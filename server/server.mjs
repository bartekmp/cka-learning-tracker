// CKA tracker server — the optional, self-hosted variant.
// Serves the built site (dist/) and a small API for login and progress sync.
// No dependencies: only Node's standard library. Run behind a reverse proxy
// that terminates HTTPS.

import http from 'node:http';
import crypto from 'node:crypto';
import path from 'node:path';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const serverDir = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT || 8080);
const DIST_DIR = path.resolve(process.env.DIST_DIR || path.join(serverDir, '..', 'dist'));
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(serverDir, 'data'));
const USER = process.env.CKA_USER;
const PASSWORD = process.env.CKA_PASSWORD;

if (!USER || !PASSWORD) {
	console.error('Set CKA_USER and CKA_PASSWORD — they are the only login this server accepts.');
	process.exit(1);
}

const SESSION_COOKIE = 'cka_session';
const SESSION_DAYS = 30;
const MAX_BODY_BYTES = 1024 * 1024;
const LOGIN_MAX_FAILURES = 10;
const LOGIN_MAX_FAILURES_GLOBAL = 50;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

const CONTENT_TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.txt': 'text/plain; charset=utf-8',
	'.md': 'text/plain; charset=utf-8',
	'.yaml': 'text/plain; charset=utf-8',
	'.sh': 'text/plain; charset=utf-8',
	'.ps1': 'text/plain; charset=utf-8',
	'.zip': 'application/zip',
	'.webmanifest': 'application/manifest+json',
};

// ── Storage ──────────────────────────────────────────────────────────────────
// One user, one document — a JSON file is all the database this needs.

const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');
const SECRET_FILE = path.join(DATA_DIR, 'session-secret');

async function readJson(file, fallback) {
	try {
		return JSON.parse(await readFile(file, 'utf8'));
	} catch {
		return fallback;
	}
}

// Write to a temp file, then rename: a crash mid-write cannot corrupt the data.
async function writeJson(file, value) {
	const tmp = file + '.tmp';
	await writeFile(tmp, JSON.stringify(value, null, 2));
	await rename(tmp, file);
}

// Persisted so a restart does not sign everyone out.
async function loadSessionSecret() {
	try {
		return await readFile(SECRET_FILE, 'utf8');
	} catch {
		const secret = crypto.randomBytes(32).toString('hex');
		await writeFile(SECRET_FILE, secret, { mode: 0o600 });
		return secret;
	}
}

await mkdir(DATA_DIR, { recursive: true });
const sessionSecret = await loadSessionSecret();
let progress = await readJson(PROGRESS_FILE, { rev: 0, tracker: {}, tasks: {}, activity: {} });

// ── Sessions ─────────────────────────────────────────────────────────────────
// The cookie is "<expiry>.<hmac of expiry>". Nothing is stored server-side.

function sign(value) {
	return crypto.createHmac('sha256', sessionSecret).update(value).digest('hex');
}

// Compares in constant time, and without leaking the length of either side.
function safeEqual(a, b) {
	const hashA = crypto.createHash('sha256').update(a).digest();
	const hashB = crypto.createHash('sha256').update(b).digest();
	return crypto.timingSafeEqual(hashA, hashB);
}

function newSessionCookie(req) {
	const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
	const value = `${expires}.${sign(String(expires))}`;
	const parts = [
		`${SESSION_COOKIE}=${value}`,
		'Path=/',
		'HttpOnly',
		'SameSite=Lax',
		`Max-Age=${SESSION_DAYS * 24 * 60 * 60}`,
	];
	// The reverse proxy tells us whether the browser is on HTTPS.
	if (req.headers['x-forwarded-proto'] === 'https') parts.push('Secure');
	return parts.join('; ');
}

function isLoggedIn(req) {
	const cookies = req.headers.cookie || '';
	const match = cookies.split(';').find((c) => c.trim().startsWith(SESSION_COOKIE + '='));
	if (!match) return false;
	const [expires, signature] = match
		.trim()
		.slice(SESSION_COOKIE.length + 1)
		.split('.');
	if (!expires || !signature) return false;
	if (!safeEqual(signature, sign(expires))) return false;
	return Number(expires) > Date.now();
}

// ── Login throttle ───────────────────────────────────────────────────────────
// In memory. Two limits, because a client address is only as trustworthy as
// the proxy in front of us:
//   - per client, so one guesser cannot lock the owner out;
//   - global, so rotating a forged address cannot buy unlimited guesses.

const GLOBAL_KEY = '*';
const loginFailures = new Map();

// X-Forwarded-For is a list each proxy appends to. Only the LAST entry was
// written by our own reverse proxy; everything before it is client-supplied
// and must not be trusted.
function clientAddress(req) {
	const forwarded = req.headers['x-forwarded-for'];
	if (forwarded) return forwarded.split(',').pop().trim();
	return req.socket.remoteAddress || 'unknown';
}

function failureCount(key) {
	const entry = loginFailures.get(key);
	if (!entry) return 0;
	if (entry.resetAt < Date.now()) {
		loginFailures.delete(key);
		return 0;
	}
	return entry.count;
}

function isThrottled(address) {
	return (
		failureCount(address) >= LOGIN_MAX_FAILURES ||
		failureCount(GLOBAL_KEY) >= LOGIN_MAX_FAILURES_GLOBAL
	);
}

function recordFailure(address) {
	[address, GLOBAL_KEY].forEach((key) => {
		const count = failureCount(key); // also drops an expired entry
		const entry = loginFailures.get(key) || { count, resetAt: Date.now() + LOGIN_WINDOW_MS };
		entry.count++;
		loginFailures.set(key, entry);
	});
}

// ── HTTP helpers ─────────────────────────────────────────────────────────────

function sendJson(res, status, body, headers) {
	res.writeHead(status, {
		'Content-Type': 'application/json; charset=utf-8',
		'Cache-Control': 'no-store',
		...headers,
	});
	res.end(JSON.stringify(body));
}

function readBody(req) {
	return new Promise((resolve, reject) => {
		// Requiring JSON blocks cross-site form posts (a plain form cannot send it).
		if (!(req.headers['content-type'] || '').startsWith('application/json')) {
			reject(new Error('expected application/json'));
			return;
		}
		const chunks = [];
		let size = 0;
		req.on('data', (chunk) => {
			size += chunk.length;
			if (size > MAX_BODY_BYTES) {
				reject(new Error('body too large'));
				req.destroy();
				return;
			}
			chunks.push(chunk);
		});
		req.on('end', () => {
			try {
				resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
			} catch {
				reject(new Error('invalid JSON'));
			}
		});
		req.on('error', reject);
	});
}

function isPlainObject(value) {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ── API ──────────────────────────────────────────────────────────────────────

async function handleLogin(req, res) {
	const address = clientAddress(req);
	if (isThrottled(address)) {
		sendJson(res, 429, { error: 'Too many attempts — try again in 15 minutes.' });
		return;
	}
	const body = await readBody(req);
	// Evaluate both, so a wrong user name takes as long as a wrong password.
	const userOk = safeEqual(String(body.user || ''), USER);
	const passwordOk = safeEqual(String(body.password || ''), PASSWORD);
	if (!userOk || !passwordOk) {
		recordFailure(address);
		sendJson(res, 401, { error: 'Wrong user name or password.' });
		return;
	}
	loginFailures.delete(address);
	sendJson(res, 200, { user: USER }, { 'Set-Cookie': newSessionCookie(req) });
}

function handleLogout(_req, res) {
	sendJson(res, 200, {}, { 'Set-Cookie': `${SESSION_COOKIE}=; Path=/; HttpOnly; Max-Age=0` });
}

// The client sends the revision its copy is based on. If another device saved
// in between, it gets 409 plus the current document, merges, and retries.
async function handleSaveProgress(req, res) {
	const body = await readBody(req);
	if (
		!isPlainObject(body.tracker) ||
		!isPlainObject(body.tasks) ||
		!isPlainObject(body.activity)
	) {
		sendJson(res, 400, { error: 'tracker, tasks and activity must be objects' });
		return;
	}
	if (body.baseRev !== progress.rev) {
		sendJson(res, 409, progress);
		return;
	}
	progress = {
		rev: progress.rev + 1,
		saved: new Date().toISOString(),
		tracker: body.tracker,
		tasks: body.tasks,
		activity: body.activity,
	};
	await writeJson(PROGRESS_FILE, progress);
	sendJson(res, 200, { rev: progress.rev });
}

async function handleApi(req, res, route) {
	if (route === 'POST /api/login') return handleLogin(req, res);
	if (route === 'POST /api/logout') return handleLogout(req, res);

	if (!isLoggedIn(req)) {
		sendJson(res, 401, { error: 'Not signed in.' });
		return;
	}
	if (route === 'GET /api/progress') return sendJson(res, 200, progress);
	if (route === 'PUT /api/progress') return handleSaveProgress(req, res);

	sendJson(res, 404, { error: 'Not found.' });
}

// ── Static files ─────────────────────────────────────────────────────────────

async function sendFile(res, file, status) {
	const content = await readFile(file);
	res.writeHead(status, {
		'Content-Type': CONTENT_TYPES[path.extname(file)] || 'application/octet-stream',
		// Assets carry a content hash in their URL; revalidating is cheap and
		// means a redeploy is never masked by a stale cached page.
		'Cache-Control': 'no-cache',
	});
	res.end(content);
}

async function handleStatic(res, urlPath) {
	const relative = urlPath.endsWith('/') ? urlPath + 'index.html' : urlPath;
	const file = path.join(DIST_DIR, decodeURIComponent(relative));
	// Never serve anything outside dist/, whatever the URL contains.
	if (file !== DIST_DIR && !file.startsWith(DIST_DIR + path.sep)) {
		res.writeHead(403).end();
		return;
	}
	try {
		await sendFile(res, file, 200);
	} catch {
		await sendFile(res, path.join(DIST_DIR, '404.html'), 404);
	}
}

// ── Server ───────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
	try {
		const url = new URL(req.url, 'http://localhost');
		if (url.pathname.startsWith('/api/')) {
			await handleApi(req, res, `${req.method} ${url.pathname}`);
		} else if (req.method === 'GET' || req.method === 'HEAD') {
			await handleStatic(res, url.pathname);
		} else {
			res.writeHead(405).end();
		}
	} catch (error) {
		if (!res.headersSent) sendJson(res, 400, { error: error.message });
		else res.end();
	}
});

server.listen(PORT, () => {
	console.log(`CKA tracker listening on :${PORT} — site from ${DIST_DIR}, data in ${DATA_DIR}`);
});

// Docker sends SIGTERM on stop; exit promptly instead of waiting to be killed.
process.on('SIGTERM', () => server.close(() => process.exit(0)));
