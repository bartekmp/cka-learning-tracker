// CKA Practice Tasks — page logic
// Depends on: js/autosave.js and data/tasks-data.js (provides SECTIONS)

const FILE_MARKER = 'cka-tasks-progress-v1';
const HANDLE_KEY = 'tasks-handle';
const UI_KEY = 'cka-tasks-ui';

// ── State ────────────────────────────────────────────────────────────────────
let fileHandle = null;
let done = {};
let totalTasks = 0,
	completedTasks = 0;
let focusMode = false;

function taskCbs() {
	return { pickFile, reEnable, manualExport, manualImport };
}

// ── Autosave functions ───────────────────────────────────────────────────────
async function pickFile() {
	try {
		const h = await window.showSaveFilePicker({
			suggestedName: 'cka-tasks-progress.json',
			types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
		});
		fileHandle = h;
		await idbSet(HANDLE_KEY, h);
		await writeHandle(h, done, FILE_MARKER);
		setBarState('active', h.name, taskCbs());
		asFlash('✓ Auto-save enabled!');
	} catch (e) {
		if (e.name !== 'AbortError') asFlash('Could not set up auto-save', '#dc2626');
	}
}

async function reEnable() {
	if (!fileHandle) return;
	if (await canWrite(fileHandle)) {
		setBarState('active', fileHandle.name, taskCbs());
		asFlash('✓ Auto-save re-enabled!');
	} else {
		asFlash('Permission denied', '#dc2626');
	}
}

async function autoSave() {
	if (!fileHandle) return;
	try {
		if (!(await canWrite(fileHandle))) {
			setBarState('perm', null, taskCbs());
			return;
		}
		await writeHandle(fileHandle, done, FILE_MARKER);
		asFlash('✓ Saved');
	} catch {
		asFlash('Save failed', '#dc2626');
	}
}

function manualExport() {
	const blob = new Blob(
		[
			JSON.stringify(
				{ _type: FILE_MARKER, saved: new Date().toISOString(), data: done },
				null,
				2
			),
		],
		{ type: 'application/json' }
	);
	const a = document.createElement('a');
	a.href = URL.createObjectURL(blob);
	a.download = 'cka-tasks-progress.json';
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
			if (p._type !== FILE_MARKER) {
				asFlash('Wrong file', '#dc2626');
				return;
			}
			done = p.data || {};
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
	if (!HAS_FSA) {
		setBarState('fallback', null, taskCbs());
		return;
	}
	const h = await idbGet(HANDLE_KEY);
	if (!h) {
		setBarState('none', null, taskCbs());
		return;
	}
	fileHandle = h;
	if (!(await canWrite(h))) {
		setBarState('perm', null, taskCbs());
		return;
	}
	try {
		done = await readHandle(h, FILE_MARKER);
		refreshAllButtons();
		updateOverall();
		setBarState('active', h.name, taskCbs());
		asFlash('✓ Progress loaded');
	} catch {
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
			sol.appendChild(doneBtn);

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

	const kbdBtn = document.createElement('button');
	kbdBtn.className = 'ctrl-btn';
	kbdBtn.title = 'Keyboard shortcuts (?)';
	kbdBtn.textContent = '⌨️ Keys';
	kbdBtn.onclick = () => {
		if (document.getElementById('kbd-help')) removeKbdHelp();
		else buildKbdHelp();
	};

	bar.appendChild(continueBtn);
	bar.appendChild(randBtn);
	bar.appendChild(focusBtn);
	bar.appendChild(kbdBtn);
	tabsEl.parentNode.insertBefore(bar, tabsEl);
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
		['?', 'Show / hide this help'],
		['Esc', 'Close overlays / exit focus'],
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
		const tabCount = document.querySelectorAll('.tab-btn').length;
		const idx = getActiveTabIdx();
		switch (e.key) {
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
