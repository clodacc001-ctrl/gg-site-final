/* ==========================================================
   Watchdog — loaded first, before anything else, so it can
   catch problems as early as possible.

   What this can and can't do (being upfront about it):
   - It CAN stop the hub's own game iframe from hijacking the
     top-level page or popping new windows/tabs, by sandboxing
     that iframe (see the `sandbox` attribute in index.html).
   - It CAN catch JS errors and failed loads on this site and
     show a clear message instead of a silent blank page.
   - It CAN warn you before the tab navigates away to *anywhere*
     (via the browser's own "leave site?" prompt), which gives
     you a chance to cancel if something tries to redirect you
     without you clicking a link — including from a malicious
     browser extension.
   - It CANNOT reach into a browser extension and stop it from
     acting, and it cannot choose where you land if you do get
     redirected — no page's JavaScript can do that once the
     browser has decided to navigate away. The confirmation
     prompt above is the real, honest limit of what's possible
     from inside a webpage.
   ========================================================== */
(function () {
  let toastEl = null;
  let toastTimer = null;

  function ensureToast() {
    if (toastEl) return toastEl;
    toastEl = document.createElement('div');
    toastEl.id = 'watchdog-toast';
    toastEl.className = 'watchdog-toast hidden';
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(toastEl));
    if (document.body) document.body.appendChild(toastEl);
    return toastEl;
  }

  function showToast(message, kind) {
    const el = ensureToast();
    el.textContent = message;
    el.className = 'watchdog-toast' + (kind ? ' ' + kind : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 6000);
  }

  // -------------------- catch broken / blocked code --------------------
  window.addEventListener('error', (e) => {
    // Resource load failures (script/img/iframe blocked or 404) surface
    // as error events with no message but a target element.
    if (e.target && e.target !== window && e.target.tagName) {
      console.warn('Resource failed to load:', e.target.tagName, e.target.src || e.target.href);
      return; // don't alarm the user over a missing thumbnail etc.
    }
    console.error('Script error:', e.message, e.filename, e.lineno);
    showToast('Something on the page hit an error and was stopped before it could break the site.', 'warn');
  });

  window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
  });

  // -------------------- warn before unexpected navigation --------------------
  // Settings-controlled: on by default. This is the real, browser-level
  // guard against something (extension, injected script, compromised
  // ad, etc.) trying to carry you off to a different site without a
  // click of your own.
  function navGuardEnabled() {
    try {
      const s = JSON.parse(localStorage.getItem('gg-site-settings-v1') || '{}');
      return s.navGuard !== false; // default true
    } catch (e) { return true; }
  }

  window.addEventListener('beforeunload', (e) => {
    if (!navGuardEnabled()) return;
    e.preventDefault();
    e.returnValue = '';
  });

  // -------------------- block stray popups from this page's own context --------------------
  // The GG Site itself never calls window.open — every outbound link on
  // the site is a normal <a target="_blank"> click, which this does not
  // touch. This only stops *programmatic* popups, which is the pattern
  // ad-injection scripts use.
  const nativeOpen = window.open;
  window.open = function (...args) {
    console.warn('Blocked a window.open() attempt:', args);
    showToast('Blocked a pop-up window attempt.', 'warn');
    return null;
  };

  window.GGWatchdog = { showToast };
})();
