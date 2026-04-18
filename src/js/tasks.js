// CKA Practice Tasks — page logic
// Depends on: js/autosave.js and data/tasks-data.js (provides SECTIONS)

const FILE_MARKER = 'cka-tasks-progress-v1';
const HANDLE_KEY = 'tasks-handle';

// ── State ────────────────────────────────────────────────────────────────────
let fileHandle = null;
let done = {};
let totalTasks = 0,
	completedTasks = 0;

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
		btn.onclick = () => {
			document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
			document.querySelectorAll('.section').forEach((p) => p.classList.remove('active'));
			btn.classList.add('active');
			document.getElementById('panel-' + i).classList.add('active');
		};
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
			card.className = 'task-card';
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

buildTabs();
buildPanels();
updateOverall();
initStorage();
