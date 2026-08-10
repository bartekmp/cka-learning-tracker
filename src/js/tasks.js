// CKA Practice Tasks — page logic
// Depends on: js/autosave.js and data/tasks-data.js (provides SECTIONS)

const HANDLE_KEY = 'cka-handle';
const UI_KEY = 'cka-tasks-ui';

// ── State ────────────────────────────────────────────────────────────────────
let fileHandle = null;
// True once the save file's contents have been read into `done`. Until then we
// must never write, or we would overwrite the file with empty progress.
let fileLoaded = false;
let done = {};
let totalTasks = 0,
	completedTasks = 0;
let focusMode = false;

function taskCbs() {
	return { pickFile, loadFile, reEnable, manualExport, manualImport };
}

// ── Autosave functions ───────────────────────────────────────────────────────
// Read the file into `done` and switch the bar to active.
async function activateHandle(h) {
	const data = await readSection(h, 'tasks');
	fileHandle = h;
	fileLoaded = true;
	done = data;
	mirrorWrite('tasks', done, false);
	refreshAllButtons();
	updateOverall();
	setBarState('active', h.name, taskCbs());
}

async function loadFile() {
	try {
		const [h] = await window.showOpenFilePicker({
			types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
		});
		await activateHandle(h);
		await idbSet(HANDLE_KEY, h);
		asFlash('✓ Progress loaded!');
	} catch (e) {
		if (e.name !== 'AbortError') asFlash('Could not load file', '#dc2626');
	}
}

async function pickFile() {
	try {
		const h = await window.showSaveFilePicker({
			suggestedName: 'cka-progress.json',
			types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
		});
		fileHandle = h;
		fileLoaded = true;
		await idbSet(HANDLE_KEY, h);
		await writeSection(h, 'tasks', done);
		mirrorWrite('tasks', done, false);
		setBarState('active', h.name, taskCbs());
		asFlash('✓ Auto-save enabled!');
	} catch (e) {
		if (e.name !== 'AbortError') asFlash('Could not set up auto-save', '#dc2626');
	}
}

async function reEnable() {
	if (!fileHandle) return;
	// Called from a click, so requesting permission is allowed here.
	if (!(await canWrite(fileHandle))) {
		asFlash('Permission denied', '#dc2626');
		return;
	}
	try {
		const local = mirrorRead('tasks');
		if (fileLoaded || (local && local.pending)) {
			// Local progress is ahead of the file — flush it rather than
			// re-reading and losing the changes made without write access.
			fileLoaded = true;
			await writeSection(fileHandle, 'tasks', done);
			mirrorWrite('tasks', done, false);
			setBarState('active', fileHandle.name, taskCbs());
		} else {
			await activateHandle(fileHandle);
		}
		asFlash('✓ Auto-save re-enabled!');
	} catch {
		asFlash('Could not read save file', '#dc2626');
	}
}

async function autoSave() {
	// Always mirror first — instant, needs no permission, cannot fail.
	mirrorWrite('tasks', done, true);
	if (!fileHandle || !fileLoaded) return;
	try {
		if (!(await hasWrite(fileHandle))) {
			setBarState('perm', null, taskCbs());
			return;
		}
		await writeSection(fileHandle, 'tasks', done);
		mirrorWrite('tasks', done, false);
		asFlash('✓ Saved');
	} catch {
		asFlash('Save failed', '#dc2626');
	}
}

async function manualExport() {
	let trackerData = {};

	if (fileHandle) {
		try {
			const text = await (await fileHandle.getFile()).text();
			const p = JSON.parse(text);
			if (p._type === SHARED_MARKER) trackerData = p.tracker || {};
		} catch {
			/* ignore */
		}
	}

	const blob = new Blob(
		[
			JSON.stringify(
				{
					_type: SHARED_MARKER,
					saved: new Date().toISOString(),
					tracker: trackerData,
					tasks: done,
				},
				null,
				2
			),
		],
		{ type: 'application/json' }
	);
	const a = document.createElement('a');
	a.href = URL.createObjectURL(blob);
	a.download = 'cka-progress.json';
	a.click();
	URL.revokeObjectURL(a.href);
	asFlash('✓ Exported!');
}

function manualImport(evt) {
	const file = evt.target.files[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onload = (e) => {
		try {
			const p = JSON.parse(e.target.result);
			let tasksData;

			if (p._type === SHARED_MARKER) {
				tasksData = p.tasks || {};
			} else if (p._type === 'cka-tasks-progress-v1') {
				tasksData = p.data || {};
			} else {
				asFlash('Wrong file', '#dc2626');
				return;
			}

			done = tasksData;
			mirrorWrite('tasks', done, true);
			refreshAllButtons();
			updateOverall();
			asFlash('✓ Imported!');
		} catch {
			asFlash('Could not read file', '#dc2626');
		}
		evt.target.value = '';
	};
	reader.readAsText(file);
}

function refreshAllButtons() {
	document.querySelectorAll('.done-btn').forEach((btn) => {
		const tid = btn.dataset.taskid;
		if (!tid) return;
		btn.className = 'done-btn' + (done[tid] ? ' marked' : '');
		btn.textContent = done[tid] ? '✓ Completed' : 'Mark as completed';
		btn.closest('.task-card')?.classList.toggle('done', !!done[tid]);
	});
}

async function initStorage() {
	// Restore progress from the browser mirror first — no permission needed, so
	// the page is never blank while we sort the save file out.
	const local = mirrorRead('tasks');
	if (local) {
		done = local.data;
		refreshAllButtons();
		updateOverall();
	}

	if (!HAS_FSA) {
		setBarState('fallback', null, taskCbs());
		return;
	}
	let h;
	try {
		h = await idbGet(HANDLE_KEY);
	} catch {
		h = null;
	}
	if (!h) {
		setBarState('none', null, taskCbs());
		return;
	}
	fileHandle = h;
	// Page load has no user activation, so we may only *query* the permission.
	// Chrome resets it to "prompt" between sessions; the Re-enable button asks.
	if (!(await hasWrite(h))) {
		setBarState('perm', null, taskCbs());
		return;
	}
	try {
		if (local && local.pending) {
			// Local changes never reached the file — keep them and flush.
			fileLoaded = true;
			await writeSection(h, 'tasks', done);
			mirrorWrite('tasks', done, false);
			setBarState('active', h.name, taskCbs());
		} else {
			await activateHandle(h);
		}
		asFlash('✓ Progress loaded');
	} catch (e) {
		if (isPermError(e)) {
			setBarState('perm', null, taskCbs());
			return;
		}
		await idbDel(HANDLE_KEY);
		fileHandle = null;
		setBarState('none', null, taskCbs());
	}
}

// ── Progress ─────────────────────────────────────────────────────────────────
function countAll() {
	totalTasks = 0;
	completedTasks = 0;
	SECTIONS.forEach((s) =>
		s.tasks.forEach((t) => {
			totalTasks++;
			if (done[t.id]) completedTasks++;
		})
	);
}

function updateOverall() {
	countAll();
	const pct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
	document.getElementById('overall-bar').style.width = pct + '%';
	document.getElementById('overall-label').textContent =
		`${completedTasks} / ${totalTasks} tasks completed`;
}

// ── UI builders ──────────────────────────────────────────────────────────────

function switchTab(idx) {
	const tabs = document.querySelectorAll('.tab-btn');
	const panels = document.querySelectorAll('.section');
	if (idx < 0 || idx >= tabs.length) return;
	tabs.forEach((b) => b.classList.remove('active'));
	panels.forEach((p) => p.classList.remove('active'));
	tabs[idx].classList.add('active');
	document.getElementById('panel-' + idx).classList.add('active');
	tabs[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
	try {
		localStorage.setItem(UI_KEY, idx);
	} catch (_) {
		/* storage unavailable */
	}
}

function getActiveTabIdx() {
	const tabs = [...document.querySelectorAll('.tab-btn')];
	const idx = tabs.findIndex((b) => b.classList.contains('active'));
	return idx >= 0 ? idx : 0;
}

function copyCode(el, text) {
	navigator.clipboard.writeText(text).catch(() => {});
	const hint = el.querySelector('.copy-hint');
	if (hint) {
		hint.textContent = '✓ copied';
		setTimeout(() => (hint.textContent = 'click to copy'), 1600);
	}
}

function buildTabs() {
	const tabsEl = document.getElementById('tabs');
	SECTIONS.forEach((s, i) => {
		const btn = document.createElement('button');
		btn.className = 'tab-btn' + (i === 0 ? ' active' : '');
		btn.textContent = s.title;
		btn.dataset.idx = i;
		btn.onclick = () => switchTab(i);
		tabsEl.appendChild(btn);
	});
}

function buildPanels() {
	const panelsEl = document.getElementById('panels');
	SECTIONS.forEach((s, si) => {
		const section = document.createElement('div');
		section.className = 'section' + (si === 0 ? ' active' : '');
		section.id = 'panel-' + si;

		const hdr = document.createElement('div');
		hdr.className = 'section-header';
		const h2 = document.createElement('h2');
		h2.style.color = s.color;
		h2.textContent = s.title;
		const p = document.createElement('p');
		p.textContent = s.tasks.length + ' practice task' + (s.tasks.length > 1 ? 's' : '');
		hdr.appendChild(h2);
		hdr.appendChild(p);
		section.appendChild(hdr);

		s.tasks.forEach((task, ti) => {
			const card = document.createElement('div');
			card.className = 'task-card' + (done[task.id] ? ' done' : '');
			card.style.borderLeftColor = s.color;
			card.dataset.search = taskHaystack(task);

			const diffClass =
				task.difficulty === 'hard'
					? 'hard'
					: task.difficulty === 'medium'
						? 'medium'
						: 'easy';

			const hdrDiv = document.createElement('div');
			hdrDiv.className = 'task-header';

			const numEl = document.createElement('div');
			numEl.className = 'task-number';
			numEl.textContent = 'Task ' + (ti + 1);

			const titleEl = document.createElement('div');
			titleEl.className = 'task-title';
			titleEl.textContent = task.title;

			const scenEl = document.createElement('div');
			scenEl.className = 'task-scenario';
			scenEl.textContent = task.scenario;

			const metaEl = document.createElement('div');
			metaEl.className = 'task-meta';
			const pill = document.createElement('span');
			pill.className = 'pill ' + diffClass;
			pill.textContent = task.difficulty;
			metaEl.appendChild(pill);
			const tagPill = document.createElement('span');
			const isOptional = task.tag === 'optional';
			tagPill.className = 'pill tag-' + (isOptional ? 'optional' : 'essential');
			tagPill.textContent = isOptional ? 'optional' : 'essential';
			metaEl.appendChild(tagPill);
			const doneBadge = document.createElement('span');
			doneBadge.className = 'pill done-badge';
			doneBadge.textContent = '✓ Done';
			metaEl.appendChild(doneBadge);

			const studyLink = document.createElement('a');
			studyLink.className = 'study-that-link';
			studyLink.href = 'cka-tracker.html?section=' + s.id;
			studyLink.textContent = '📖 Study that';
			metaEl.appendChild(studyLink);
			hdrDiv.appendChild(numEl);
			hdrDiv.appendChild(titleEl);
			hdrDiv.appendChild(scenEl);
			hdrDiv.appendChild(metaEl);
			card.appendChild(hdrDiv);

			const toggle = document.createElement('div');
			toggle.className = 'hint-toggle';
			const arrow = document.createElement('span');
			arrow.className = 'hint-arrow';
			arrow.textContent = '▶';
			toggle.appendChild(arrow);
			toggle.appendChild(document.createTextNode(' Show step-by-step solution'));
			card.appendChild(toggle);

			const sol = document.createElement('div');
			sol.className = 'solution';

			task.steps.forEach((step) => {
				const stepDiv = document.createElement('div');
				stepDiv.className = 'sol-step';

				const labelEl = document.createElement('div');
				labelEl.className = 'step-label';
				labelEl.textContent = step.label;
				stepDiv.appendChild(labelEl);

				if (step.desc) {
					const descEl = document.createElement('div');
					descEl.className = 'step-desc';
					descEl.textContent = step.desc;
					stepDiv.appendChild(descEl);
				}

				step.code.forEach((c) => {
					const codeEl = document.createElement('div');
					codeEl.className = 'code-block';
					const hint = document.createElement('span');
					hint.className = 'copy-hint';
					hint.textContent = 'click to copy';
					codeEl.appendChild(hint);
					codeEl.appendChild(document.createTextNode(c));
					codeEl.addEventListener('click', () => {
						const raw = codeEl.textContent
							.replace('click to copy', '')
							.replace('✓ copied', '')
							.trim();
						copyCode(codeEl, raw);
					});
					stepDiv.appendChild(codeEl);
				});

				sol.appendChild(stepDiv);
			});

			if (task.expected) {
				const exp = document.createElement('div');
				exp.className = 'expected';
				exp.textContent = '✓ Expected: ' + task.expected;
				sol.appendChild(exp);
			}
			if (task.note) {
				const note = document.createElement('div');
				note.className = 'note';
				note.textContent = '💡 ' + task.note;
				sol.appendChild(note);
			}

			// Lives outside .solution so a task can be completed without ever
			// revealing the steps — solving it yourself shouldn't cost a spoiler.
			const actions = document.createElement('div');
			actions.className = 'task-actions';
			const doneBtn = document.createElement('button');
			doneBtn.className = 'done-btn' + (done[task.id] ? ' marked' : '');
			doneBtn.textContent = done[task.id] ? '✓ Completed' : 'Mark as completed';
			doneBtn.dataset.taskid = task.id;
			doneBtn.onclick = () => {
				done[task.id] = !done[task.id];
				autoSave();
				doneBtn.className = 'done-btn' + (done[task.id] ? ' marked' : '');
				doneBtn.textContent = done[task.id] ? '✓ Completed' : 'Mark as completed';
				card.classList.toggle('done', done[task.id]);
				updateOverall();
			};
			actions.appendChild(doneBtn);
			// Above the solution toggle: complete first, peek only if stuck.
			card.insertBefore(actions, toggle);

			card.appendChild(sol);

			toggle.addEventListener('click', () => {
				const open = sol.classList.toggle('open');
				toggle.classList.toggle('open', open);
				arrow.style.transform = open ? 'rotate(90deg)' : 'none';
				toggle.childNodes[1].textContent =
					' ' + (open ? 'Hide solution' : 'Show step-by-step solution');
			});

			section.appendChild(card);
		});

		panelsEl.appendChild(section);
	});
}

// ── Focus mode ────────────────────────────────────────────────────────────────

function toggleFocusMode() {
	focusMode = !focusMode;
	document.querySelector('.wrap')?.classList.toggle('focus-mode', focusMode);
	const focusBtn = document.getElementById('focus-btn');
	if (focusBtn) focusBtn.textContent = focusMode ? '⊡ Exit focus' : '⊞ Focus mode';
	if (focusMode) asFlash('Focus mode on · Esc to exit');
}

// ── Task navigation ───────────────────────────────────────────────────────────

function findFirstIncomplete() {
	for (let si = 0; si < SECTIONS.length; si++) {
		for (const task of SECTIONS[si].tasks) {
			if (!done[task.id]) return { sectionIdx: si, taskId: task.id };
		}
	}
	return null;
}

function jumpToTask(sectionIdx, taskId) {
	if (sectionIdx == null) return;
	switchTab(sectionIdx);
	if (!taskId) return;
	setTimeout(() => {
		const btn = document.querySelector(`[data-taskid="${taskId}"]`);
		const card = btn?.closest('.task-card');
		if (!card) return;
		card.scrollIntoView({ behavior: 'smooth', block: 'center' });
		document
			.querySelectorAll('.task-highlight')
			.forEach((el) => el.classList.remove('task-highlight'));
		card.classList.add('task-highlight');
	}, 80);
}

function jumpToRandomTask() {
	const pool = [];
	SECTIONS.forEach((s, si) => {
		s.tasks.forEach((t) => {
			if (!done[t.id]) pool.push({ sectionIdx: si, taskId: t.id });
		});
	});
	if (!pool.length) {
		asFlash('🎉 All tasks done!');
		return;
	}
	const pick = pool[Math.floor(Math.random() * pool.length)];
	jumpToTask(pick.sectionIdx, pick.taskId);
	asFlash('🎲 Random task!');
}

// ── Controls bar ─────────────────────────────────────────────────────────────

function buildControls() {
	const tabsEl = document.getElementById('tabs');
	if (!tabsEl) return;

	const bar = document.createElement('div');
	bar.id = 'task-controls';

	const continueBtn = document.createElement('button');
	continueBtn.id = 'continue-btn';
	continueBtn.className = 'ctrl-btn';
	continueBtn.title = 'Jump to next incomplete task (C)';
	continueBtn.textContent = '▶ Next incomplete task';
	continueBtn.onclick = () => {
		const info = findFirstIncomplete();
		if (info) jumpToTask(info.sectionIdx, info.taskId);
		else asFlash('🎉 All tasks done!');
	};

	const randBtn = document.createElement('button');
	randBtn.className = 'ctrl-btn';
	randBtn.title = 'Jump to a random incomplete task (R)';
	randBtn.textContent = '🎲 Random task';
	randBtn.onclick = jumpToRandomTask;

	const focusBtn = document.createElement('button');
	focusBtn.id = 'focus-btn';
	focusBtn.className = 'ctrl-btn';
	focusBtn.title = 'Show only the active section (F)';
	focusBtn.textContent = '⊞ Focus mode';
	focusBtn.onclick = toggleFocusMode;

	const examBtn = document.createElement('button');
	examBtn.className = 'ctrl-btn';
	examBtn.title = `${EXAM_MINUTES}-minute timed run, solutions hidden (E)`;
	examBtn.textContent = '🎯 Exam mode';
	examBtn.onclick = confirmStartExam;

	const kbdBtn = document.createElement('button');
	kbdBtn.className = 'ctrl-btn';
	kbdBtn.title = 'Keyboard shortcuts (?)';
	kbdBtn.textContent = '⌨️ Keys';
	kbdBtn.onclick = () => {
		if (document.getElementById('kbd-help')) removeKbdHelp();
		else buildKbdHelp();
	};

	const searchWrap = document.createElement('div');
	searchWrap.id = 'search-wrap';
	const search = document.createElement('input');
	search.id = 'task-search';
	search.type = 'search';
	search.placeholder = 'Search tasks and commands…  (/)';
	search.autocomplete = 'off';
	search.oninput = () => applySearch(search.value);
	search.onkeydown = (e) => {
		if (e.key === 'Escape') clearSearch();
	};
	const searchCount = document.createElement('span');
	searchCount.id = 'search-count';
	searchWrap.appendChild(search);
	searchWrap.appendChild(searchCount);

	bar.appendChild(continueBtn);
	bar.appendChild(randBtn);
	bar.appendChild(focusBtn);
	bar.appendChild(examBtn);
	bar.appendChild(kbdBtn);
	bar.appendChild(searchWrap);
	tabsEl.parentNode.insertBefore(bar, tabsEl);
}

// ── Search ────────────────────────────────────────────────────────────────────
// Nothing else on the page finds a command by name; scrolling 100+ tasks to
// remember "how do I drain a node" is exactly the wrong kind of friction.

function taskHaystack(task) {
	const parts = [task.title, task.scenario, task.expected || '', task.note || ''];
	task.steps.forEach((step) => {
		parts.push(step.label, step.desc || '');
		step.code.forEach((c) => parts.push(c));
	});
	return parts.join(' ').toLowerCase();
}

function applySearch(query) {
	const wrap = document.querySelector('.wrap');
	const countEl = document.getElementById('search-count');
	const q = query.trim().toLowerCase();

	if (!q) {
		wrap?.classList.remove('searching');
		document
			.querySelectorAll('.search-hit, .no-hits')
			.forEach((el) => el.classList.remove('search-hit', 'no-hits'));
		if (countEl) countEl.textContent = '';
		return;
	}

	wrap?.classList.add('searching');
	let hits = 0;
	document.querySelectorAll('.section').forEach((section) => {
		let sectionHits = 0;
		section.querySelectorAll('.task-card').forEach((card) => {
			const match = (card.dataset.search || '').includes(q);
			card.classList.toggle('search-hit', match);
			if (match) sectionHits++;
		});
		section.classList.toggle('no-hits', sectionHits === 0);
		hits += sectionHits;
	});
	if (countEl) countEl.textContent = hits === 1 ? '1 match' : `${hits} matches`;
}

function focusSearch() {
	const input = document.getElementById('task-search');
	if (!input) return;
	input.focus();
	input.select();
}

function clearSearch() {
	const input = document.getElementById('task-search');
	if (!input || !input.value) return false;
	input.value = '';
	applySearch('');
	input.blur();
	return true;
}

// ── Exam simulation mode ──────────────────────────────────────────────────────
// The real CKA is 2 hours of hands-on tasks with no hints. The Pomodoro paces
// studying; this paces the exam. Marks are kept separate from study progress
// until the user explicitly saves them.

const EXAM_KEY = 'cka-exam';
const EXAM_MINUTES = 120;
const EXAM_COUNT = 17;

let exam = null;
let examTicker = null;

function examSave() {
	try {
		if (exam) localStorage.setItem(EXAM_KEY, JSON.stringify(exam));
		else localStorage.removeItem(EXAM_KEY);
	} catch (_) {
		/* storage unavailable */
	}
}

function examLoad() {
	try {
		const raw = JSON.parse(localStorage.getItem(EXAM_KEY));
		if (!raw || !Array.isArray(raw.ids) || typeof raw.endsAt !== 'number') return null;
		return { endsAt: raw.endsAt, ids: raw.ids, marks: raw.marks || {} };
	} catch (_) {
		return null;
	}
}

// Flat lookup of every task with its section, for exam rendering.
function allTasks() {
	const out = [];
	SECTIONS.forEach((s, si) => s.tasks.forEach((t) => out.push({ task: t, section: s, si })));
	return out;
}

function findTask(id) {
	return allTasks().find((e) => e.task.id === id) || null;
}

function fmtClock(ms) {
	const total = Math.max(0, Math.round(ms / 1000));
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	const pad = (n) => String(n).padStart(2, '0');
	return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function examMarkedCount() {
	return exam ? exam.ids.filter((id) => exam.marks[id]).length : 0;
}

function updateExamBar() {
	if (!exam) return;
	const timeEl = document.getElementById('exam-time');
	const countEl = document.getElementById('exam-count');
	const left = exam.endsAt - Date.now();
	if (timeEl) {
		timeEl.textContent = fmtClock(left);
		timeEl.classList.toggle('urgent', left <= 10 * 60 * 1000);
	}
	if (countEl) countEl.textContent = `${examMarkedCount()} of ${exam.ids.length} marked`;
	if (left <= 0) finishExam(true);
}

function buildExamCard(entry, idx) {
	const { task, section } = entry;
	const card = document.createElement('div');
	card.className = 'task-card exam-card' + (exam.marks[task.id] ? ' done' : '');
	card.style.borderLeftColor = section.color;

	const hdr = document.createElement('div');
	hdr.className = 'task-header';

	const num = document.createElement('div');
	num.className = 'task-number';
	num.textContent = `Question ${idx + 1} of ${exam.ids.length} · ${section.title}`;

	const title = document.createElement('div');
	title.className = 'task-title';
	title.textContent = task.title;

	const scen = document.createElement('div');
	scen.className = 'task-scenario';
	scen.textContent = task.scenario;

	const meta = document.createElement('div');
	meta.className = 'task-meta';
	const pill = document.createElement('span');
	pill.className =
		'pill ' +
		(task.difficulty === 'hard' ? 'hard' : task.difficulty === 'medium' ? 'medium' : 'easy');
	pill.textContent = task.difficulty;
	meta.appendChild(pill);

	hdr.appendChild(num);
	hdr.appendChild(title);
	hdr.appendChild(scen);
	hdr.appendChild(meta);
	card.appendChild(hdr);

	const actions = document.createElement('div');
	actions.className = 'task-actions';
	const btn = document.createElement('button');
	btn.className = 'done-btn' + (exam.marks[task.id] ? ' marked' : '');
	btn.textContent = exam.marks[task.id] ? '✓ Done' : 'Mark as done';
	btn.onclick = () => {
		exam.marks[task.id] = !exam.marks[task.id];
		btn.className = 'done-btn' + (exam.marks[task.id] ? ' marked' : '');
		btn.textContent = exam.marks[task.id] ? '✓ Done' : 'Mark as done';
		card.classList.toggle('done', !!exam.marks[task.id]);
		examSave();
		updateExamBar();
	};
	actions.appendChild(btn);
	card.appendChild(actions);

	return card;
}

function renderExam() {
	const view = document.getElementById('exam-view');
	const list = document.getElementById('exam-list');
	if (!view || !list) return;
	list.textContent = '';
	exam.ids.forEach((id, i) => {
		const entry = findTask(id);
		if (entry) list.appendChild(buildExamCard(entry, i));
	});
	document.body.classList.add('exam-active');
	view.style.display = 'block';
	updateExamBar();
	clearInterval(examTicker);
	examTicker = setInterval(updateExamBar, 1000);
}

function buildExamShell() {
	if (document.getElementById('exam-view')) return;
	const view = document.createElement('div');
	view.id = 'exam-view';
	view.style.display = 'none';

	const bar = document.createElement('div');
	bar.id = 'exam-bar';

	const time = document.createElement('span');
	time.id = 'exam-time';
	time.textContent = '--:--';

	const count = document.createElement('span');
	count.id = 'exam-count';

	const hint = document.createElement('span');
	hint.id = 'exam-hint';
	hint.textContent = 'Solutions are hidden until you finish.';

	const finish = document.createElement('button');
	finish.className = 'ctrl-btn primary';
	finish.textContent = 'Finish exam';
	finish.onclick = () => finishExam(false);

	bar.appendChild(time);
	bar.appendChild(count);
	bar.appendChild(hint);
	bar.appendChild(finish);

	const list = document.createElement('div');
	list.id = 'exam-list';

	view.appendChild(bar);
	view.appendChild(list);
	document.querySelector('.wrap')?.appendChild(view);
}

function startExam() {
	const pool = allTasks().map((e) => e.task.id);
	for (let i = pool.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[pool[i], pool[j]] = [pool[j], pool[i]];
	}
	exam = {
		endsAt: Date.now() + EXAM_MINUTES * 60 * 1000,
		ids: pool.slice(0, Math.min(EXAM_COUNT, pool.length)),
		marks: {},
	};
	examSave();
	buildExamShell();
	renderExam();
	window.scrollTo({ top: 0, behavior: 'smooth' });
}

function exitExam() {
	clearInterval(examTicker);
	examTicker = null;
	exam = null;
	examSave();
	document.body.classList.remove('exam-active');
	const view = document.getElementById('exam-view');
	if (view) view.style.display = 'none';
}

function finishExam(timedOut) {
	if (!exam) return;
	clearInterval(examTicker);
	examTicker = null;
	const marked = exam.ids.filter((id) => exam.marks[id]);
	const used = EXAM_MINUTES * 60 * 1000 - Math.max(0, exam.endsAt - Date.now());
	showExamResults(marked, exam.ids.slice(), used, timedOut);
}

function showExamResults(marked, ids, usedMs, timedOut) {
	const overlay = document.createElement('div');
	overlay.id = 'exam-results';
	const box = document.createElement('div');
	box.id = 'exam-results-box';

	const h = document.createElement('h3');
	h.textContent = timedOut ? "⏰ Time's up" : '🎯 Exam finished';
	box.appendChild(h);

	const score = document.createElement('div');
	score.id = 'exam-score';
	score.textContent = `${marked.length} / ${ids.length}`;
	box.appendChild(score);

	const sub = document.createElement('div');
	sub.className = 'exam-sub';
	sub.textContent = `tasks completed in ${fmtClock(usedMs)}`;
	box.appendChild(sub);

	const pct = ids.length ? Math.round((marked.length / ids.length) * 100) : 0;
	const verdict = document.createElement('div');
	verdict.className = 'exam-verdict';
	verdict.textContent =
		pct >= 66
			? '✓ Above the CKA pass mark (66%) at this pace.'
			: 'Below the CKA pass mark (66%) — worth another run.';
	box.appendChild(verdict);

	const list = document.createElement('div');
	list.className = 'exam-review-list';
	ids.forEach((id, i) => {
		const entry = findTask(id);
		if (!entry) return;
		const row = document.createElement('div');
		row.className = 'exam-review-row' + (marked.includes(id) ? ' ok' : '');
		const mark = document.createElement('span');
		mark.className = 'exam-review-mark';
		mark.textContent = marked.includes(id) ? '✓' : '–';
		const label = document.createElement('span');
		label.textContent = `${i + 1}. ${entry.task.title}`;
		row.appendChild(mark);
		row.appendChild(label);
		list.appendChild(row);
	});
	box.appendChild(list);

	const btns = document.createElement('div');
	btns.className = 'exam-results-btns';

	const saveBtn = document.createElement('button');
	saveBtn.className = 'ctrl-btn primary';
	saveBtn.textContent = `Save ${marked.length} to my progress`;
	saveBtn.disabled = marked.length === 0;
	saveBtn.onclick = () => {
		marked.forEach((id) => (done[id] = true));
		autoSave();
		refreshAllButtons();
		updateOverall();
		overlay.remove();
		exitExam();
		asFlash(`✓ ${marked.length} saved to your progress`);
	};

	const closeBtn = document.createElement('button');
	closeBtn.className = 'ctrl-btn';
	closeBtn.textContent = 'Close without saving';
	closeBtn.onclick = () => {
		overlay.remove();
		exitExam();
	};

	btns.appendChild(saveBtn);
	btns.appendChild(closeBtn);
	box.appendChild(btns);

	overlay.appendChild(box);
	document.body.appendChild(overlay);
}

function confirmStartExam() {
	if (exam) {
		asFlash('An exam is already running');
		return;
	}
	const overlay = document.createElement('div');
	overlay.id = 'exam-results';
	const box = document.createElement('div');
	box.id = 'exam-results-box';

	const h = document.createElement('h3');
	h.textContent = '🎯 Exam simulation';
	box.appendChild(h);

	const ul = document.createElement('ul');
	ul.className = 'exam-rules';
	[
		`${EXAM_COUNT} random tasks, ${EXAM_MINUTES} minutes`,
		'Solutions and hints stay hidden until you finish',
		'Do the tasks on your own cluster, mark each one as you go',
		'Your study progress is untouched unless you save at the end',
	].forEach((t) => {
		const li = document.createElement('li');
		li.textContent = t;
		ul.appendChild(li);
	});
	box.appendChild(ul);

	const btns = document.createElement('div');
	btns.className = 'exam-results-btns';
	const go = document.createElement('button');
	go.className = 'ctrl-btn primary';
	go.textContent = 'Start the clock';
	go.onclick = () => {
		overlay.remove();
		startExam();
	};
	const cancel = document.createElement('button');
	cancel.className = 'ctrl-btn';
	cancel.textContent = 'Cancel';
	cancel.onclick = () => overlay.remove();
	btns.appendChild(go);
	btns.appendChild(cancel);
	box.appendChild(btns);

	overlay.appendChild(box);
	overlay.addEventListener('click', (e) => {
		if (e.target === overlay) overlay.remove();
	});
	document.body.appendChild(overlay);
}

// Restore an exam that was still running when the page was closed.
function initExam() {
	const saved = examLoad();
	if (!saved) return;
	if (saved.endsAt <= Date.now()) {
		try {
			localStorage.removeItem(EXAM_KEY);
		} catch (_) {
			/* storage unavailable */
		}
		return;
	}
	exam = saved;
	buildExamShell();
	renderExam();
	asFlash('⏱ Exam resumed');
}

// ── Keyboard shortcut help ────────────────────────────────────────────────────

function buildKbdHelp() {
	if (document.getElementById('kbd-help')) return;
	const overlay = document.createElement('div');
	overlay.id = 'kbd-help';
	const box = document.createElement('div');
	box.id = 'kbd-help-box';
	const title = document.createElement('h3');
	title.textContent = '⌨️ Keyboard shortcuts';
	box.appendChild(title);
	[
		['n', 'Next section'],
		['p', 'Previous section'],
		['r', 'Random incomplete task'],
		['c', 'Continue (first incomplete)'],
		['f', 'Toggle focus mode'],
		['e', 'Start exam simulation'],
		['/', 'Search tasks'],
		['?', 'Show / hide this help'],
		['Esc', 'Close overlays / clear search / exit focus'],
	].forEach(([keys, desc]) => {
		const row = document.createElement('div');
		row.className = 'kbd-row';
		const kbdEl = document.createElement('span');
		kbdEl.className = 'kbd';
		kbdEl.textContent = keys;
		const descEl = document.createElement('span');
		descEl.textContent = desc;
		row.appendChild(kbdEl);
		row.appendChild(descEl);
		box.appendChild(row);
	});
	const closeEl = document.createElement('button');
	closeEl.id = 'kbd-help-close';
	closeEl.textContent = 'Close';
	closeEl.onclick = removeKbdHelp;
	box.appendChild(closeEl);
	overlay.appendChild(box);
	overlay.addEventListener('click', (e) => {
		if (e.target === overlay) removeKbdHelp();
	});
	document.body.appendChild(overlay);
}

function removeKbdHelp() {
	document.getElementById('kbd-help')?.remove();
}

function initKeyboardShortcuts() {
	document.addEventListener('keydown', (e) => {
		if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
		if (e.ctrlKey || e.altKey || e.metaKey) return;
		// While the exam clock runs the tab/jump shortcuts have nothing to act
		// on — only the help overlay stays reachable.
		if (exam && e.key !== '?' && e.key !== 'Escape') return;
		const tabCount = document.querySelectorAll('.tab-btn').length;
		const idx = getActiveTabIdx();
		switch (e.key) {
			case '/':
				e.preventDefault();
				focusSearch();
				break;
			case 'e':
				confirmStartExam();
				break;
			case 'n':
				switchTab((idx + 1) % tabCount);
				break;
			case 'p':
				switchTab((idx - 1 + tabCount) % tabCount);
				break;
			case 'r':
				jumpToRandomTask();
				break;
			case 'c': {
				const info = findFirstIncomplete();
				if (info) jumpToTask(info.sectionIdx, info.taskId);
				else asFlash('🎉 All tasks done!');
				break;
			}
			case 'f':
				toggleFocusMode();
				break;
			case '?':
				if (document.getElementById('kbd-help')) removeKbdHelp();
				else buildKbdHelp();
				break;
			case 'Escape':
				removeKbdHelp();
				if (clearSearch()) break;
				if (focusMode) toggleFocusMode();
				break;
		}
	});
}

buildTabs();
buildPanels();
buildControls();
updateOverall();
// Restore last active tab
(function () {
	try {
		const saved = parseInt(localStorage.getItem(UI_KEY), 10);
		if (!isNaN(saved) && saved > 0) switchTab(saved);
	} catch (_) {
		/* storage unavailable */
	}
})();
initStorage();
initKeyboardShortcuts();
initExam();

// ── Deep-link from tracker (?section=sN) ──────────────────────────────────────
(function () {
	var sectionId = new URLSearchParams(location.search).get('section');
	if (!sectionId) return;
	var idx = SECTIONS.findIndex((s) => s.id === sectionId);
	if (idx >= 0) switchTab(idx);
})();
