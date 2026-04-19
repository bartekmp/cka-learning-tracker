// CKA Pomodoro Timer — opt-in floating widget, state persists across pages
(function () {
	'use strict';

	var STORAGE_KEY = 'cka-pomodoro';
	var PHASES = {
		work: { label: 'Focus', mins: 25, color: '#ef4444', icon: '🍅' },
		shortBreak: { label: 'Short Break', mins: 5, color: '#10b981', icon: '☕' },
		longBreak: { label: 'Long Break', mins: 15, color: '#3b82f6', icon: '🌿' },
	};
	var SESSIONS_PER_LONG = 4;
	var CIRC = 2 * Math.PI * 11; // SVG ring circumference (r=11)

	// ── State ────────────────────────────────────────────────────────────────

	function defaultState() {
		return {
			phase: 'work',
			sessions: 0,
			running: false,
			endsAt: null,
			remaining: 1500,
			customMins: { work: 25, shortBreak: 5, longBreak: 15 },
		};
	}

	function loadState() {
		try {
			var raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return defaultState();
			var parsed = JSON.parse(raw);
			var s = Object.assign(defaultState(), parsed);
			s.customMins = Object.assign(
				{ work: 25, shortBreak: 5, longBreak: 15 },
				parsed.customMins || {}
			);
			return s;
		} catch (_) {
			return defaultState();
		}
	}

	function saveState(s) {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
		} catch (_) {
			/* noop */
		}
	}

	function getRemaining(s) {
		if (s.running && s.endsAt != null) {
			return Math.max(0, Math.round((s.endsAt - Date.now()) / 1000));
		}
		var mins = (s.customMins && s.customMins[s.phase]) || (PHASES[s.phase] || PHASES.work).mins;
		return typeof s.remaining === 'number' ? s.remaining : mins * 60;
	}

	function getPhaseMins(phase) {
		return (state.customMins && state.customMins[phase]) || (PHASES[phase] || PHASES.work).mins;
	}

	function fmt(secs) {
		var m = Math.floor(secs / 60);
		var s = secs % 60;
		return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
	}

	// ── Audio ────────────────────────────────────────────────────────────────

	function beep() {
		try {
			var AudioCtx = window.AudioContext || window.webkitAudioContext;
			if (!AudioCtx) return;
			var ctx = new AudioCtx();
			[660, 880].forEach(function (freq, i) {
				var osc = ctx.createOscillator();
				var gain = ctx.createGain();
				osc.connect(gain);
				gain.connect(ctx.destination);
				osc.frequency.value = freq;
				var t = ctx.currentTime + i * 0.28;
				gain.gain.setValueAtTime(0.18, t);
				gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
				osc.start(t);
				osc.stop(t + 0.22);
			});
		} catch (_) {
			/* noop */
		}
	}

	// ── DOM ──────────────────────────────────────────────────────────────────

	var state = loadState();
	var tickId = null;
	var panelOpen = false;
	var settingsOpen = false;

	var host = document.createElement('div');
	host.id = 'pomo-host';

	// Pill button
	var pill = document.createElement('button');
	pill.id = 'pomo-pill';
	pill.type = 'button';
	pill.setAttribute('aria-label', 'Open Pomodoro timer');
	pill.title = 'Pomodoro timer — click to open';

	var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('width', '28');
	svg.setAttribute('height', '28');
	svg.setAttribute('viewBox', '0 0 28 28');
	svg.setAttribute('aria-hidden', 'true');
	svg.style.cssText = 'display:block;flex-shrink:0;';

	var ringBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
	ringBg.setAttribute('cx', '14');
	ringBg.setAttribute('cy', '14');
	ringBg.setAttribute('r', '11');
	ringBg.setAttribute('fill', 'none');
	ringBg.setAttribute('stroke-width', '2.5');
	ringBg.id = 'pomo-ring-bg';

	var ringFg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
	ringFg.setAttribute('cx', '14');
	ringFg.setAttribute('cy', '14');
	ringFg.setAttribute('r', '11');
	ringFg.setAttribute('fill', 'none');
	ringFg.setAttribute('stroke-width', '2.5');
	ringFg.setAttribute('stroke-linecap', 'round');
	ringFg.id = 'pomo-ring-fg';
	ringFg.style.cssText =
		'transform:rotate(-90deg);transform-origin:14px 14px;transition:stroke-dashoffset 0.8s linear,stroke 0.3s;';

	svg.appendChild(ringBg);
	svg.appendChild(ringFg);

	var pillTime = document.createElement('span');
	pillTime.id = 'pomo-pill-time';

	pill.appendChild(svg);
	pill.appendChild(pillTime);

	// Panel
	var panel = document.createElement('div');
	panel.id = 'pomo-panel';
	panel.hidden = true;
	panel.setAttribute('role', 'dialog');
	panel.setAttribute('aria-label', 'Pomodoro timer controls');

	var closeBtn = document.createElement('button');
	closeBtn.id = 'pomo-close';
	closeBtn.type = 'button';
	closeBtn.textContent = '×';
	closeBtn.title = 'Close';
	closeBtn.setAttribute('aria-label', 'Close timer panel');

	var phaseEl = document.createElement('div');
	phaseEl.id = 'pomo-phase';

	var timeEl = document.createElement('div');
	timeEl.id = 'pomo-time';

	var dotsEl = document.createElement('div');
	dotsEl.id = 'pomo-dots';
	dotsEl.setAttribute('aria-label', 'Sessions in current cycle');

	var btnsEl = document.createElement('div');
	btnsEl.id = 'pomo-btns';

	var startBtn = document.createElement('button');
	startBtn.id = 'pomo-start';
	startBtn.type = 'button';

	var skipBtn = document.createElement('button');
	skipBtn.id = 'pomo-skip';
	skipBtn.type = 'button';
	skipBtn.textContent = 'Skip';
	skipBtn.title = 'Skip to next phase';

	var resetBtn = document.createElement('button');
	resetBtn.id = 'pomo-reset';
	resetBtn.type = 'button';
	resetBtn.textContent = 'Reset';
	resetBtn.title = 'Reset to start of current phase';

	btnsEl.appendChild(startBtn);
	btnsEl.appendChild(skipBtn);
	btnsEl.appendChild(resetBtn);

	// Settings toggle + inputs
	var settingsToggle = document.createElement('button');
	settingsToggle.id = 'pomo-settings-toggle';
	settingsToggle.type = 'button';
	settingsToggle.textContent = '⚙ Durations';
	settingsToggle.title = 'Customize phase durations';
	settingsToggle.setAttribute('aria-label', 'Customize phase durations');

	var settingsEl = document.createElement('div');
	settingsEl.id = 'pomo-settings';
	settingsEl.hidden = true;

	var settingsDefs = [
		['work', 'Focus'],
		['shortBreak', 'Short break'],
		['longBreak', 'Long break'],
	];
	var settingsInputs = {};
	settingsDefs.forEach(function (def) {
		var key = def[0];
		var rowEl = document.createElement('label');
		rowEl.className = 'pomo-set-row';
		var spanEl = document.createElement('span');
		spanEl.textContent = def[1];
		var inputEl = document.createElement('input');
		inputEl.type = 'number';
		inputEl.min = '1';
		inputEl.max = '99';
		inputEl.addEventListener('change', function () {
			var val = Math.min(99, Math.max(1, parseInt(inputEl.value, 10) || 1));
			inputEl.value = val;
			if (!state.customMins) state.customMins = {};
			state.customMins[key] = val;
			if (!state.running && state.phase === key) state.remaining = val * 60;
			saveState(state);
			render();
		});
		settingsInputs[key] = inputEl;
		var unitEl = document.createElement('span');
		unitEl.textContent = 'min';
		rowEl.appendChild(spanEl);
		rowEl.appendChild(inputEl);
		rowEl.appendChild(unitEl);
		settingsEl.appendChild(rowEl);
	});

	panel.appendChild(closeBtn);
	panel.appendChild(phaseEl);
	panel.appendChild(timeEl);
	panel.appendChild(dotsEl);
	panel.appendChild(btnsEl);
	panel.appendChild(settingsToggle);
	panel.appendChild(settingsEl);

	host.appendChild(pill);
	host.appendChild(panel);

	// ── Render ───────────────────────────────────────────────────────────────

	function render() {
		var secs = getRemaining(state);
		var ph = PHASES[state.phase] || PHASES.work;
		var total = getPhaseMins(state.phase) * 60;
		var pct = total > 0 ? secs / total : 0;
		var dark = document.documentElement.classList.contains('dark');

		ringBg.setAttribute('stroke', dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)');
		ringFg.setAttribute('stroke', ph.color);
		ringFg.setAttribute('stroke-dasharray', String(CIRC));
		ringFg.setAttribute('stroke-dashoffset', String(CIRC * (1 - pct)));

		pillTime.textContent = fmt(secs);
		pill.style.borderColor = state.running ? ph.color + '99' : '';

		phaseEl.textContent = ph.icon + '\u2002' + ph.label;
		timeEl.textContent = fmt(secs);
		timeEl.style.color = ph.color;

		startBtn.textContent = state.running ? '⏸ Pause' : secs < total ? '▶ Resume' : '▶ Start';

		// Session dots (progress toward long break)
		dotsEl.innerHTML = '';
		var sessInCycle = (state.sessions || 0) % SESSIONS_PER_LONG;
		for (var i = 0; i < SESSIONS_PER_LONG; i++) {
			var dot = document.createElement('span');
			dot.className = 'pomo-dot' + (i < sessInCycle ? ' pomo-dot-done' : '');
			if (i < sessInCycle) dot.style.background = ph.color;
			dotsEl.appendChild(dot);
		}

		host.setAttribute('data-dark', dark ? '1' : '0');
	}

	// ── Timer logic ──────────────────────────────────────────────────────────

	function advancePhase() {
		clearInterval(tickId);
		tickId = null;
		beep();
		if (state.phase === 'work') {
			state.sessions = (state.sessions || 0) + 1;
			state.phase = state.sessions % SESSIONS_PER_LONG === 0 ? 'longBreak' : 'shortBreak';
		} else {
			state.phase = 'work';
		}
		state.remaining = getPhaseMins(state.phase) * 60;
		state.endsAt = null;
		state.running = false;
		saveState(state);
		render();
	}

	function tick() {
		if (getRemaining(state) <= 0) {
			advancePhase();
		} else {
			render();
		}
	}

	function startOrPause() {
		if (state.running) {
			clearInterval(tickId);
			tickId = null;
			state.remaining = getRemaining(state);
			state.endsAt = null;
			state.running = false;
		} else {
			var secs = getRemaining(state);
			if (secs <= 0) secs = getPhaseMins(state.phase) * 60;
			state.running = true;
			state.endsAt = Date.now() + secs * 1000;
			state.remaining = secs;
			tickId = setInterval(tick, 500);
		}
		saveState(state);
		render();
	}

	function skipPhase() {
		state.remaining = 0;
		state.endsAt = null;
		state.running = false;
		advancePhase();
	}

	function resetPhase() {
		clearInterval(tickId);
		tickId = null;
		state.customMins = { work: 25, shortBreak: 5, longBreak: 15 };
		state.remaining = getPhaseMins(state.phase) * 60;
		state.endsAt = null;
		state.running = false;
		if (settingsOpen) {
			settingsDefs.forEach(function (def) {
				settingsInputs[def[0]].value = getPhaseMins(def[0]);
			});
		}
		saveState(state);
		render();
	}

	// ── Events ───────────────────────────────────────────────────────────────

	pill.addEventListener('click', function () {
		panelOpen = !panelOpen;
		panel.hidden = !panelOpen;
		if (panelOpen) render();
	});

	closeBtn.addEventListener('click', function (e) {
		e.stopPropagation();
		panelOpen = false;
		panel.hidden = true;
	});

	startBtn.addEventListener('click', startOrPause);
	skipBtn.addEventListener('click', skipPhase);
	resetBtn.addEventListener('click', resetPhase);

	settingsToggle.addEventListener('click', function () {
		settingsOpen = !settingsOpen;
		settingsEl.hidden = !settingsOpen;
		if (settingsOpen) {
			settingsDefs.forEach(function (def) {
				settingsInputs[def[0]].value = getPhaseMins(def[0]);
			});
		}
	});

	window.addEventListener('themechange', render);

	// ── Resume if a session was running on the previous page ─────────────────

	if (state.running && state.endsAt != null) {
		if (state.endsAt <= Date.now()) {
			advancePhase();
		} else {
			tickId = setInterval(tick, 500);
		}
	}

	// ── Inject ───────────────────────────────────────────────────────────────

	render();

	function inject() {
		document.body.appendChild(host);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', inject);
	} else {
		inject();
	}
})();
