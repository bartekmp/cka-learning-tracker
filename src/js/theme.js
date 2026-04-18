(function () {
  var THEME_KEY = 'cka-theme';
  var html = document.documentElement;

  function queryTheme() {
    try {
      var theme = new URLSearchParams(window.location.search).get('theme');
      return theme === 'dark' || theme === 'light' ? theme : null;
    } catch (_) {
      return null;
    }
  }

  function dark() { return html.classList.contains('dark'); }

  function storedTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (_) {
      return null;
    }
  }

  function preferredTheme() {
    var fromQuery = queryTheme();
    if (fromQuery) return fromQuery;

    var saved = storedTheme();
    if (saved === 'dark' || saved === 'light') return saved;
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function currentTheme() {
    return dark() ? 'dark' : 'light';
  }

  function syncThemeLinks(themeValue) {
    var links = document.querySelectorAll('a[href]');

    links.forEach(function (link) {
      var rawHref = link.getAttribute('href');
      if (!rawHref || rawHref.indexOf('#') === 0 || rawHref.indexOf('mailto:') === 0 || rawHref.indexOf('tel:') === 0) {
        return;
      }

      try {
        var url = new URL(rawHref, window.location.href);
        var isInternalHtml = url.origin === window.location.origin && /\.html$/i.test(url.pathname);
        if (!isInternalHtml) return;
        url.searchParams.set('theme', themeValue);
        link.href = url.href;
      } catch (_) {
        // Ignore malformed or unsupported href values.
      }
    });
  }

  function syncCurrentUrl(themeValue) {
    try {
      var url = new URL(window.location.href);
      url.searchParams.set('theme', themeValue);
      window.history.replaceState(null, '', url.toString());
    } catch (_) {
      // Ignore if the environment does not support History updates.
    }
  }

  function applyTheme(toDark) {
    if (toDark) html.classList.add('dark');
    else html.classList.remove('dark');
    var nextTheme = toDark ? 'dark' : 'light';
    try {
      localStorage.setItem(THEME_KEY, nextTheme);
    } catch (_) {
      // Ignore storage errors and still update the current document theme.
    }
    syncCurrentUrl(nextTheme);
    syncThemeLinks(nextTheme);
    updateBtn();
    window.dispatchEvent(new CustomEvent('themechange'));
  }

  function syncTheme(themeValue) {
    var nextDark = themeValue === 'dark';
    if (nextDark) html.classList.add('dark');
    else html.classList.remove('dark');
    syncCurrentUrl(themeValue);
    syncThemeLinks(themeValue);
    updateBtn();
    window.dispatchEvent(new CustomEvent('themechange'));
  }

  function updateBtn() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.textContent = dark() ? '\u2600\uFE0F' : '\uD83C\uDF19';
    btn.title = dark() ? 'Switch to light mode' : 'Switch to dark mode';
    btn.style.background = dark() ? 'rgba(50,50,48,.92)' : 'rgba(255,255,255,.92)';
    btn.style.borderColor = dark() ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.12)';
  }

  function createBtn() {
    if (document.getElementById('theme-toggle')) return;
    var btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.setAttribute('aria-label', 'Toggle dark/light mode');
    btn.style.cssText = [
      'position:fixed', 'top:14px', 'right:16px', 'z-index:9999',
      'width:34px', 'height:34px', 'border-radius:50%',
      'border:0.5px solid', 'cursor:pointer',
      'font-size:15px', 'line-height:1', 'padding:0',
      'display:flex', 'align-items:center', 'justify-content:center',
      'box-shadow:0 1px 6px rgba(0,0,0,.15)',
      'transition:background 0.15s, border-color 0.15s',
      'backdrop-filter:blur(4px)'
    ].join(';');
    btn.addEventListener('click', function () { applyTheme(!dark()); });
    document.body.appendChild(btn);
    updateBtn();
  }

  function initTheme() {
    var themeValue = preferredTheme();
    try {
      localStorage.setItem(THEME_KEY, themeValue);
    } catch (_) {
      // Ignore storage errors and still initialize the theme.
    }
    syncTheme(themeValue);
  }

  window.addEventListener('storage', function (event) {
    if (event.key !== THEME_KEY) return;
    syncTheme(preferredTheme());
  });

  if (window.matchMedia) {
    var media = window.matchMedia('(prefers-color-scheme: dark)');
    var handleSystemTheme = function () {
      if (storedTheme() !== null) return;
      syncTheme(preferredTheme());
    };

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', handleSystemTheme);
    } else if (typeof media.addListener === 'function') {
      media.addListener(handleSystemTheme);
    }
  }

  initTheme();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createBtn);
  } else {
    createBtn();
  }
})();
