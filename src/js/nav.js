// Quick-nav bar + per-page scroll position persistence
!(function () {
	var page = location.pathname.split('/').pop() || 'index.html';
	var SCROLL_KEY = 'cka-scroll-' + page.replace('.html', '');

	// ── Inject nav bar ──────────────────────────────────────────────────────────
	var links = [
		{ href: 'cka-tracker.html', label: '📋 Study' },
		{ href: 'cka-practice-tasks.html', label: '🧪 Practice' },
	];
	var nav = document.createElement('nav');
	nav.className = 'quick-nav';
	nav.setAttribute('aria-label', 'Page navigation');
	nav.innerHTML = links
		.map(function (l) {
			var cls = l.href === page ? 'quick-nav-link active' : 'quick-nav-link';
			return '<a href="' + l.href + '" class="' + cls + '">' + l.label + '</a>';
		})
		.join('');
	document.body.prepend(nav);

	// ── Save scroll position (debounced 200 ms) ─────────────────────────────────
	var _saveTimer;
	window.addEventListener(
		'scroll',
		function () {
			clearTimeout(_saveTimer);
			_saveTimer = setTimeout(function () {
				try {
					localStorage.setItem(SCROLL_KEY, Math.round(window.scrollY));
				} catch (_) {
					/* localStorage unavailable */
				}
			}, 200);
		},
		{ passive: true }
	);

	// ── Restore scroll after load + React paint ─────────────────────────────────
	var saved = 0;
	try {
		saved = parseInt(localStorage.getItem(SCROLL_KEY) || '0', 10) || 0;
	} catch (_) {
		/* localStorage unavailable */
	}

	if (saved > 0) {
		window.addEventListener('load', function () {
			var attempts = 0;
			function tryScroll() {
				// Wait until the page is tall enough to scroll to the saved position
				if (document.body.scrollHeight >= saved + window.innerHeight || attempts > 30) {
					window.scrollTo(0, saved);
				} else {
					attempts++;
					requestAnimationFrame(tryScroll);
				}
			}
			requestAnimationFrame(tryScroll);
		});
	}
})();
