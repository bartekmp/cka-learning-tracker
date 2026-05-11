// Intro tour — shown once on first visit to the landing page
(function () {
	'use strict';

	var STORAGE_KEY = 'cka-tour-done';
	try {
		if (localStorage.getItem(STORAGE_KEY)) return;
	} catch (_) {
		return;
	}

	var steps = [
		{
			selector: '.hero',
			welcome: true,
			title: '👋 Welcome!',
			text: "A self-contained study toolkit built for the CKA exam. Want a quick tour of what's here?",
		},
		{
			selector: '.card.blue',
			title: '📋 Study Tracker',
			text: 'Keep track of your progress here! All 9 CKA exam domains with checkable topics, command cheatsheets, and per-section progress bars.',
		},
		{
			selector: '.card.purple',
			title: '🧪 Practice Tasks',
			text: 'Real, exam-like exercises here! 24 hands-on scenarios with step-by-step hidden solutions and click-to-copy commands.',
		},
		{
			id: 'pomo-pill',
			title: '🍅 Pomodoro Timer',
			text: 'Built-in focus timer — 25-minute work sessions with short and long break reminders. Keeps ticking as you navigate between pages.',
		},
		{
			id: 'theme-toggle',
			title: '🌙 Dark / Light Mode',
			text: 'Switch between dark and light themes. Follows your OS preference automatically — or toggle it manually. The choice is remembered across all pages.',
		},
		{
			id: 'useful-resources',
			title: '🔗 Useful Resources',
			text: 'Curated links to free CKA labs (KillerCoda), the exam simulator (killer.sh), the official kubectl cheat sheet, and the Linux Foundation exam page.',
		},
	];

	var current = 0;
	var overlay, spotlight, tooltip, stepCounter, prevBtn, nextBtn, skipBtn, skipBigBtn, startBtn;
	var TIP_W = 280;
	var TIP_MARGIN = 16;
	var GAP = 16;
	var PAD = 10; // spotlight padding around target

	function getTarget(step) {
		if (step.id) return document.getElementById(step.id);
		if (step.selector) return document.querySelector(step.selector);
		return null;
	}

	function positionSpotlight(el) {
		var r = el.getBoundingClientRect();
		spotlight.style.left = r.left - PAD + 'px';
		spotlight.style.top = r.top - PAD + 'px';
		spotlight.style.width = r.width + PAD * 2 + 'px';
		spotlight.style.height = r.height + PAD * 2 + 'px';
	}

	function positionTooltip(el) {
		var r = el.getBoundingClientRect();
		var vw = window.innerWidth;
		var vh = window.innerHeight;
		// Spotlight bounds
		var sL = r.left - PAD;
		var sT = r.top - PAD;
		var sR = r.right + PAD;
		var sB = r.bottom + PAD;

		tooltip.className = 'tour-tooltip';
		tooltip.style.top =
			tooltip.style.bottom =
			tooltip.style.left =
			tooltip.style.right =
				'auto';

		var spaceBelow = vh - sB;
		var spaceAbove = sT;
		var spaceLeft = sL;

		var left, arrowLeft, arrowTop;

		if (spaceBelow >= 170 || (spaceBelow >= spaceAbove && spaceBelow >= 80)) {
			// Below the spotlight — arrow points up
			left = r.left + r.width / 2 - TIP_W / 2;
			left = Math.max(TIP_MARGIN, Math.min(left, vw - TIP_W - TIP_MARGIN));
			tooltip.style.top = sB + GAP + 'px';
			tooltip.style.left = left + 'px';
			tooltip.classList.add('tour-arrow-top');
			arrowLeft = r.left + r.width / 2 - left;
			tooltip.style.setProperty(
				'--arr',
				Math.max(20, Math.min(arrowLeft, TIP_W - 20)) + 'px'
			);
		} else if (spaceAbove >= 80) {
			// Above the spotlight — arrow points down
			left = r.left + r.width / 2 - TIP_W / 2;
			left = Math.max(TIP_MARGIN, Math.min(left, vw - TIP_W - TIP_MARGIN));
			tooltip.style.bottom = vh - sT + GAP + 'px';
			tooltip.style.left = left + 'px';
			tooltip.classList.add('tour-arrow-bottom');
			arrowLeft = r.left + r.width / 2 - left;
			tooltip.style.setProperty(
				'--arr',
				Math.max(20, Math.min(arrowLeft, TIP_W - 20)) + 'px'
			);
		} else if (spaceLeft >= TIP_W + GAP + TIP_MARGIN) {
			// Left of spotlight — arrow points right
			tooltip.style.left = sL - TIP_W - GAP + 'px';
			arrowTop = r.top + r.height / 2;
			var tipTop = arrowTop - 70;
			tipTop = Math.max(TIP_MARGIN, Math.min(tipTop, vh - 180));
			tooltip.style.top = tipTop + 'px';
			tooltip.classList.add('tour-arrow-right');
			tooltip.style.setProperty(
				'--arr',
				Math.max(16, Math.min(arrowTop - tipTop, 140)) + 'px'
			);
		} else {
			// Right of spotlight — arrow points left
			var tipLeft = sR + GAP;
			tipLeft = Math.min(tipLeft, vw - TIP_W - TIP_MARGIN);
			tooltip.style.left = tipLeft + 'px';
			arrowTop = r.top + r.height / 2;
			tipTop = arrowTop - 70;
			tipTop = Math.max(TIP_MARGIN, Math.min(tipTop, vh - 180));
			tooltip.style.top = tipTop + 'px';
			tooltip.classList.add('tour-arrow-left');
			tooltip.style.setProperty(
				'--arr',
				Math.max(16, Math.min(arrowTop - tipTop, 140)) + 'px'
			);
		}
	}

	function showStep(idx) {
		var step = steps[idx];
		var el = getTarget(step);
		if (!el) {
			if (idx < steps.length - 1) {
				current = idx + 1;
				showStep(current);
			} else {
				finish();
			}
			return;
		}

		spotlight.style.opacity = '0';
		tooltip.style.opacity = '0';

		// Scroll target into view (instant so getBoundingClientRect is accurate)
		el.scrollIntoView({ behavior: 'instant', block: 'center' });

		setTimeout(function () {
			if (step.welcome) {
				tooltip.classList.add('tour-tooltip--welcome');
			} else {
				tooltip.classList.remove('tour-tooltip--welcome');
			}
			positionSpotlight(el);
			positionTooltip(el);
			tooltip.querySelector('.tour-title').textContent = step.title;
			tooltip.querySelector('.tour-text').textContent = step.text;
			if (step.welcome) {
				stepCounter.textContent = '';
				prevBtn.disabled = true;
				nextBtn.textContent = 'Next →';
				startBtn.focus();
			} else {
				stepCounter.textContent = idx + ' / ' + (steps.length - 1);
				prevBtn.disabled = idx <= 1;
				nextBtn.textContent = idx === steps.length - 1 ? 'Done ✓' : 'Next →';
				nextBtn.focus();
			}
			spotlight.style.opacity = '1';
			tooltip.style.opacity = '1';
		}, 60);
	}

	function finish() {
		document.removeEventListener('keydown', onKey);
		window.removeEventListener('resize', onResize);
		try {
			localStorage.setItem(STORAGE_KEY, '1');
		} catch (_e) {
			// Ignore storage errors; tour won't re-show since it already completed.
		}
		document.body.style.overflow = '';
		if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
		if (spotlight && spotlight.parentNode) spotlight.parentNode.removeChild(spotlight);
		if (tooltip && tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
	}

	function onKey(e) {
		if (e.key === 'Escape') {
			finish();
		} else if (e.key === 'ArrowRight') {
			if (current < steps.length - 1) {
				current++;
				showStep(current);
			} else {
				finish();
			}
		} else if (e.key === 'ArrowLeft' && current > 1) {
			current--;
			showStep(current);
		}
	}

	function onResize() {
		var el = getTarget(steps[current]);
		if (el) {
			positionSpotlight(el);
			positionTooltip(el);
		}
	}

	function buildUI() {
		// Transparent click-blocker overlay
		overlay = document.createElement('div');
		overlay.id = 'tour-overlay';
		overlay.setAttribute('aria-hidden', 'true');
		document.body.appendChild(overlay);

		// Spotlight — transparent with huge box-shadow for dimming
		spotlight = document.createElement('div');
		spotlight.id = 'tour-spotlight';
		spotlight.setAttribute('aria-hidden', 'true');
		document.body.appendChild(spotlight);

		// Tooltip card
		tooltip = document.createElement('div');
		tooltip.id = 'tour-tooltip';
		tooltip.className = 'tour-tooltip';
		tooltip.setAttribute('role', 'dialog');
		tooltip.setAttribute('aria-modal', 'true');
		tooltip.setAttribute('aria-label', 'Intro tour');
		tooltip.innerHTML =
			'<div class="tour-header">' +
			'<span class="tour-badge">Intro tour</span>' +
			'<button class="tour-skip" type="button" aria-label="Skip intro tour">Skip</button>' +
			'</div>' +
			'<div class="tour-title"></div>' +
			'<p class="tour-text"></p>' +
			'<div class="tour-welcome-footer">' +
			'<button class="tour-btn-skip-big" type="button">Skip</button>' +
			'<button class="tour-btn-start" type="button">Take a tour →</button>' +
			'</div>' +
			'<div class="tour-footer">' +
			'<button class="tour-prev" type="button">← Back</button>' +
			'<span class="tour-counter"></span>' +
			'<button class="tour-next" type="button">Next →</button>' +
			'</div>';
		document.body.appendChild(tooltip);

		stepCounter = tooltip.querySelector('.tour-counter');
		prevBtn = tooltip.querySelector('.tour-prev');
		nextBtn = tooltip.querySelector('.tour-next');
		skipBtn = tooltip.querySelector('.tour-skip');
		skipBigBtn = tooltip.querySelector('.tour-btn-skip-big');
		startBtn = tooltip.querySelector('.tour-btn-start');

		prevBtn.addEventListener('click', function () {
			if (current > 1) {
				current--;
				showStep(current);
			}
		});
		nextBtn.addEventListener('click', function () {
			if (current < steps.length - 1) {
				current++;
				showStep(current);
			} else {
				finish();
			}
		});
		skipBtn.addEventListener('click', finish);
		skipBigBtn.addEventListener('click', finish);
		startBtn.addEventListener('click', function () {
			current = 1;
			showStep(current);
		});

		document.addEventListener('keydown', onKey);
		window.addEventListener('resize', onResize);
		document.body.style.overflow = 'hidden';
	}

	function init() {
		buildUI();
		showStep(0);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function () {
			// Delay allows theme.js and pomodoro.js to create their DOM elements
			setTimeout(init, 450);
		});
	} else {
		setTimeout(init, 450);
	}
})();
