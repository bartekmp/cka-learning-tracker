// Shared autosave utilities — IndexedDB + File System Access API
// Requires DOM elements: #autosave-bar, #as-icon, #as-text, #as-flash

const IDB_DB = 'cka-autosave',
	IDB_STORE = 'handles';
const HAS_FSA = typeof window.showSaveFilePicker === 'function';

function idbOpen() {
	return new Promise((res, rej) => {
		const r = indexedDB.open(IDB_DB, 1);
		r.onupgradeneeded = (e) => e.target.result.createObjectStore(IDB_STORE);
		r.onsuccess = (e) => res(e.target.result);
		r.onerror = rej;
	});
}

async function idbGet(key) {
	const db = await idbOpen();
	return new Promise((res) => {
		const r = db.transaction(IDB_STORE).objectStore(IDB_STORE).get(key);
		r.onsuccess = () => res(r.result ?? null);
		r.onerror = () => res(null);
	});
}

async function idbSet(key, val) {
	const db = await idbOpen();
	return new Promise((res) => {
		const tx = db.transaction(IDB_STORE, 'readwrite');
		tx.objectStore(IDB_STORE).put(val, key);
		tx.oncomplete = res;
		tx.onerror = res;
	});
}

async function idbDel(key) {
	const db = await idbOpen();
	return new Promise((res) => {
		const tx = db.transaction(IDB_STORE, 'readwrite');
		tx.objectStore(IDB_STORE).delete(key);
		tx.oncomplete = res;
		tx.onerror = res;
	});
}

// Query only — safe to call at any time, never prompts.
async function hasWrite(h) {
	try {
		return (await h.queryPermission({ mode: 'readwrite' })) === 'granted';
	} catch {
		return false;
	}
}

// Prompts if needed — ONLY call this from a real user gesture (click handler).
// requestPermission() throws SecurityError without user activation.
async function canWrite(h) {
	const o = { mode: 'readwrite' };
	try {
		if ((await h.queryPermission(o)) === 'granted') return true;
		return (await h.requestPermission(o)) === 'granted';
	} catch {
		return false;
	}
}

function isPermError(e) {
	return e && (e.name === 'NotAllowedError' || e.name === 'SecurityError');
}

const SHARED_MARKER = 'cka-progress-v1';

// ── localStorage mirror ──────────────────────────────────────────────────────
// Progress is always kept here as well as in the save file. It needs no
// permission, so a page load can restore progress instantly — the save file is
// a sync/backup target, not the thing we depend on to show the user their work.
// `pending` marks a section changed locally but not yet written to the file.
const MIRROR_KEY = 'cka-progress';

function mirrorLoad() {
	try {
		const p = JSON.parse(localStorage.getItem(MIRROR_KEY));
		if (!p || p._type !== SHARED_MARKER) return null;
		return p;
	} catch {
		return null;
	}
}

// Returns { data, pending } or null when nothing is mirrored yet.
function mirrorRead(section) {
	const p = mirrorLoad();
	if (!p || !p[section]) return null;
	return { data: p[section], pending: !!(p.pending && p.pending[section]) };
}

function mirrorWrite(section, data, pending) {
	const p = mirrorLoad() || { _type: SHARED_MARKER, tracker: {}, tasks: {}, pending: {} };
	p[section] = data;
	p.pending = Object.assign({}, p.pending, { [section]: !!pending });
	p.saved = new Date().toISOString();
	try {
		localStorage.setItem(MIRROR_KEY, JSON.stringify(p));
	} catch {
		/* storage full or disabled — the save file is still the backstop */
	}
}

async function readSection(h, section) {
	const text = await (await h.getFile()).text();
	const p = JSON.parse(text);
	if (p._type === SHARED_MARKER) return p[section] || {};
	if (section === 'tracker' && p._type === 'cka-tracker-progress-v1') return p.data || {};
	if (section === 'tasks' && p._type === 'cka-tasks-progress-v1') return p.data || {};
	throw new Error('wrong file');
}

async function writeSection(h, section, data) {
	let combined = { tracker: {}, tasks: {} };

	try {
		const text = await (await h.getFile()).text();
		const p = JSON.parse(text);
		if (p._type === SHARED_MARKER) {
			combined = { tracker: p.tracker || {}, tasks: p.tasks || {} };
		} else if (p._type === 'cka-tracker-progress-v1') {
			combined.tracker = p.data || {};
		} else if (p._type === 'cka-tasks-progress-v1') {
			combined.tasks = p.data || {};
		}
	} catch {
		/* fresh file, start empty */
	}

	combined[section] = data;
	const w = await h.createWritable();
	await w.write(
		JSON.stringify(
			{ _type: SHARED_MARKER, saved: new Date().toISOString(), ...combined },
			null,
			2
		)
	);
	await w.close();
}

function asFlash(msg, color) {
	const el = document.getElementById('as-flash');
	if (!el) return;
	el.textContent = msg;
	el.style.color = color || '#16a34a';
	el.classList.add('show');
	setTimeout(() => el.classList.remove('show'), 2000);
}

function mkBtn(label, cls, fn) {
	const b = document.createElement('button');
	b.className = 'as-btn' + (cls ? ' ' + cls : '');
	b.textContent = label;
	b.onclick = fn;
	return b;
}

function setBarText(el, parts) {
	el.textContent = '';
	parts.forEach((p) => {
		if (typeof p === 'string') {
			el.appendChild(document.createTextNode(p));
		} else {
			const node = document.createElement(p.tag || 'span');
			if (p.style) node.setAttribute('style', p.style);
			node.textContent = p.text;
			el.appendChild(node);
		}
	});
}

// cbs: { pickFile, reEnable, manualExport, manualImport }
function setBarState(state, filename, cbs) {
	const bar = document.getElementById('autosave-bar');
	const icon = document.getElementById('as-icon');
	const text = document.getElementById('as-text');
	if (!bar) return;
	bar.className = 'autosave-bar state-' + state;
	bar.querySelectorAll('.as-btn, input[type=file]').forEach((el) => el.remove());
	const fin = document.getElementById('as-flash');

	if (state === 'active') {
		icon.textContent = '✅';
		setBarText(text, ['Auto-saving to ', { tag: 'strong', text: filename }]);
		bar.insertBefore(mkBtn('Change file', '', cbs.pickFile), fin);
	} else if (state === 'perm') {
		icon.textContent = '⚠️';
		setBarText(text, [
			{ tag: 'strong', text: 'Click Re-enable to load your progress' },
			' — your browser asks for file permission once per visit',
		]);
		bar.insertBefore(mkBtn('Re-enable', 'amber', cbs.reEnable), fin);
	} else if (state === 'none') {
		icon.textContent = '💾';
		setBarText(text, [
			{ tag: 'strong', text: 'Set up auto-save' },
			' — create a new file or load a previously saved one',
		]);
		bar.insertBefore(mkBtn('New file', 'primary', cbs.pickFile), fin);
		bar.insertBefore(mkBtn('Load existing', '', cbs.loadFile), fin);
	} else {
		// fallback (Firefox etc.)
		icon.textContent = '💾';
		setBarText(text, [
			{ tag: 'strong', text: 'Progress is saved in this browser' },
			' — export a file to back it up or move it to another device.',
			{ tag: 'br', text: '' },
			{
				tag: 'span',
				style: 'font-size:11px;opacity:0.75',
				text: 'Saving straight to a file needs Chrome 86+, Edge 86+ or Opera 72+.',
			},
		]);
		const inp = document.createElement('input');
		inp.type = 'file';
		inp.accept = '.json';
		inp.style.display = 'none';
		inp.onchange = cbs.manualImport;
		bar.insertBefore(mkBtn('Export', 'primary', cbs.manualExport), fin);
		bar.insertBefore(
			mkBtn('Import', '', () => inp.click()),
			fin
		);
		bar.insertBefore(inp, fin);
	}
}
