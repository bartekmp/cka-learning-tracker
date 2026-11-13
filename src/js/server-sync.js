// Server sync — ONLY shipped in the server-backed build (`npm run build:server`).
// The official static build leaves this file out, so it makes no network calls.
// Depends on: js/autosave.js (the localStorage mirror and activity log).
//
// Signed out, the app behaves exactly like the static site. Signed in, the
// server is one more sync target next to the optional save file:
//   - a local change is pushed (debounced) with the revision it was based on;
//   - on load and on returning to the tab, a newer server copy is pulled;
//   - if another device saved in between (409), both copies are merged.
(function () {
	const SYNC_KEY = 'cka-server-sync'; // { user, rev, dirty }
	const PUSH_DELAY_MS = 800;

	let pushTimer = null;
	// True while we write server data into the mirror, so that write is not
	// mistaken for a local change and pushed straight back.
	let applying = false;
	let status = 'idle'; // idle | syncing | offline
	// JSON of the document as the server last had it — lets us skip no-op pushes.
	let lastSynced = null;

	// ── Sync state ───────────────────────────────────────────────────────────
	function loadState() {
		try {
			return JSON.parse(localStorage.getItem(SYNC_KEY)) || {};
		} catch {
			return {};
		}
	}

	function saveState(state) {
		try {
			localStorage.setItem(SYNC_KEY, JSON.stringify(state));
		} catch {
			/* storage unavailable */
		}
	}

	function updateState(changes) {
		saveState(Object.assign(loadState(), changes));
	}

	// ── The document ─────────────────────────────────────────────────────────
	function sectionData(section) {
		const local = mirrorRead(section);
		return local ? local.data : {};
	}

	function localDoc() {
		return {
			tracker: sectionData('tracker'),
			tasks: sectionData('tasks'),
			activity: activityRead(),
			quiz: sectionData('quiz'),
		};
	}

	// Key order must not matter when comparing two copies.
	function sortedJson(map) {
		return JSON.stringify(map, Object.keys(map).sort());
	}

	// What the pages show at load. The quiz is left out: it re-reads its state
	// on every answer, so a change there never needs a page reload.
	function pagesJson(doc) {
		return [sortedJson(doc.tracker), sortedJson(doc.tasks), sortedJson(doc.activity)].join('|');
	}

	function docJson(doc) {
		return pagesJson(doc) + '|' + sortedJson(doc.quiz || {});
	}

	// A done flag set on either side stays set; activity keeps the higher count.
	function mergeDone(a, b) {
		const merged = Object.assign({}, a);
		Object.keys(b).forEach((id) => {
			merged[id] = !!(a[id] || b[id]);
		});
		return merged;
	}

	function mergeActivity(a, b) {
		const merged = Object.assign({}, a);
		Object.keys(b).forEach((day) => {
			merged[day] = Math.max(a[day] || 0, b[day] || 0);
		});
		return merged;
	}

	// The newer answer to a question wins; on the same day the later due date.
	function mergeQuiz(a, b) {
		const merged = Object.assign({}, a);
		Object.keys(b).forEach((id) => {
			const mine = a[id];
			const theirs = b[id];
			if (!mine || theirs.at > mine.at || (theirs.at === mine.at && theirs.due > mine.due)) {
				merged[id] = theirs;
			}
		});
		return merged;
	}

	function mergeDocs(a, b) {
		return {
			tracker: mergeDone(a.tracker, b.tracker),
			tasks: mergeDone(a.tasks, b.tasks),
			activity: mergeActivity(a.activity, b.activity),
			quiz: mergeQuiz(a.quiz || {}, b.quiz || {}),
		};
	}

	// Writes a document into the mirror. Sections are marked pending so an
	// attached save file gets flushed with them instead of overriding them.
	function applyDoc(doc) {
		applying = true;
		mirrorWrite('tracker', doc.tracker, true);
		mirrorWrite('tasks', doc.tasks, true);
		mirrorWrite('quiz', doc.quiz || {}, false);
		activityMerge(doc.activity);
		applying = false;
	}

	// ── API ──────────────────────────────────────────────────────────────────
	// Paths are relative to the page, so the app also works when the reverse
	// proxy mounts it under a sub-path such as /cka/.
	async function api(method, path, body) {
		const options = { method, credentials: 'same-origin' };
		if (body) {
			options.headers = { 'Content-Type': 'application/json' };
			options.body = JSON.stringify(body);
		}
		const response = await fetch(path, options);
		let data = {};
		try {
			data = await response.json();
		} catch {
			/* empty or non-JSON body */
		}
		return { status: response.status, data };
	}

	function setStatus(next) {
		status = next;
		renderBox();
	}

	function sessionExpired() {
		updateState({ user: null });
		setStatus('idle');
	}

	// The pages read progress once, at load — so after the mirror changed
	// underneath them, reloading is the simple way to show the new state.
	function reloadIfChanged(before, after) {
		if (pagesJson(before) !== pagesJson(after)) location.reload();
	}

	// Merge the server copy with ours and save the result. Used right after
	// signing in and whenever the server rejects a push as out of date.
	async function mergeWithServer(serverDoc) {
		const before = localDoc();
		const merged = mergeDocs(before, serverDoc);
		applyDoc(merged);
		const result = await api('PUT', 'api/progress', { baseRev: serverDoc.rev, ...merged });
		if (result.status !== 200) throw new Error('merge was rejected');
		updateState({ rev: result.data.rev, dirty: false });
		lastSynced = docJson(merged);
		setStatus('idle');
		reloadIfChanged(before, merged);
	}

	async function push() {
		const state = loadState();
		if (!state.user) return;
		const doc = localDoc();
		if (docJson(doc) === lastSynced) {
			updateState({ dirty: false });
			return;
		}
		setStatus('syncing');
		try {
			const result = await api('PUT', 'api/progress', { baseRev: state.rev, ...doc });
			if (result.status === 401) return sessionExpired();
			if (result.status === 409) return await mergeWithServer(result.data);
			if (result.status !== 200) throw new Error('push failed');
			updateState({ rev: result.data.rev, dirty: false });
			lastSynced = docJson(doc);
			setStatus('idle');
		} catch {
			setStatus('offline');
		}
	}

	async function pull() {
		const state = loadState();
		if (!state.user) return;
		setStatus('syncing');
		try {
			const result = await api('GET', 'api/progress');
			if (result.status === 401) return sessionExpired();
			if (result.status !== 200) throw new Error('pull failed');
			const before = localDoc();
			lastSynced = docJson(result.data);
			if (result.data.rev !== state.rev) {
				applyDoc(result.data);
				updateState({ rev: result.data.rev });
			}
			setStatus('idle');
			reloadIfChanged(before, localDoc());
		} catch {
			setStatus('offline');
		}
	}

	// Local changes win over a pull: push them first, the server sorts out
	// conflicts through the revision check.
	function sync() {
		if (loadState().dirty) return push();
		return pull();
	}

	// Called by autosave.js whenever the mirror or the activity log changes.
	window.ckaServerChanged = function () {
		if (applying || !loadState().user) return;
		updateState({ dirty: true });
		clearTimeout(pushTimer);
		pushTimer = setTimeout(push, PUSH_DELAY_MS);
	};

	// ── Sign in / out ────────────────────────────────────────────────────────
	async function signIn(user, password) {
		const login = await api('POST', 'api/login', { user, password });
		if (login.status !== 200) return login.data.error || 'Could not sign in.';
		updateState({ user: login.data.user, dirty: false });
		setStatus('syncing');
		const server = await api('GET', 'api/progress');
		if (server.status !== 200) return 'Signed in, but could not load progress.';
		await mergeWithServer(server.data);
		return null;
	}

	async function signOut() {
		try {
			await api('POST', 'api/logout', {});
		} catch {
			/* offline — forget the session locally anyway */
		}
		// Local progress stays, exactly as on the static site.
		saveState({});
		lastSynced = null;
		setStatus('idle');
	}

	// ── UI: a box in the sync panel, under the save-file bar ─────────────────
	const box = document.createElement('div');
	box.id = 'server-box';
	box.className = 'autosave-bar';

	function el(tag, text, className) {
		const node = document.createElement(tag);
		if (text) node.textContent = text;
		if (className) node.className = className;
		return node;
	}

	function statusText() {
		if (status === 'syncing') return 'Syncing…';
		if (status === 'offline') return 'Offline — will retry';
		return 'Synced';
	}

	function renderSignedIn(user) {
		const text = el('span', '', 'autosave-text');
		text.append(el('strong', statusText()), ` — signed in as ${user}`);
		const out = el('button', 'Sign out', 'as-btn');
		out.type = 'button';
		out.onclick = signOut;
		box.append(el('span', '☁️', 'autosave-icon'), text, out);
	}

	function renderSignInForm() {
		const text = el('span', '', 'autosave-text');
		text.append(
			el('strong', 'Sign in to sync across devices'),
			' — without it, everything stays in this browser'
		);
		const form = el('form');
		const user = el('input');
		user.placeholder = 'User name';
		user.autocomplete = 'username';
		user.required = true;
		const password = el('input');
		password.type = 'password';
		password.placeholder = 'Password';
		password.autocomplete = 'current-password';
		password.required = true;
		const submit = el('button', 'Sign in', 'as-btn primary');
		submit.type = 'submit';
		const error = el('span', '', 'server-error');
		form.onsubmit = async (event) => {
			event.preventDefault();
			submit.disabled = true;
			let message;
			try {
				message = await signIn(user.value, password.value);
			} catch {
				message = 'Could not reach the server.';
			}
			submit.disabled = false;
			if (message) error.textContent = message;
		};
		form.append(user, password, submit, error);
		box.append(el('span', '☁️', 'autosave-icon'), text, form);
	}

	function renderBox() {
		const user = loadState().user;
		// The Sync tab shows a warning while the server cannot be reached.
		document.body.dataset.server = user ? status : 'signed-out';
		box.classList.toggle('state-active', !!user && status !== 'offline');
		// Do not wipe a half-typed sign-in form on a status change.
		if (!user && box.querySelector('form')) return;
		box.textContent = '';
		if (user) renderSignedIn(user);
		else renderSignInForm();
	}

	const syncPanel = document.getElementById('sync-panel');
	if (syncPanel) syncPanel.appendChild(box);
	renderBox();

	// ── Start ────────────────────────────────────────────────────────────────
	sync();
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') sync();
	});
})();
