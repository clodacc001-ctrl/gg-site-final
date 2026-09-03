/* ==========================================================
   Recommendations — submits to a backend if configured, and
   always falls back to local storage so nothing is silently
   lost or falsely reported as "saved" when there's no server.
   ========================================================== */
(function () {
  const STORAGE_KEY = 'gg-site-recommendations-v1';

  // Point this at a real form endpoint to actually receive submissions.
  // The easiest option for a static GitHub Pages site is Formspree:
  //   1. Go to https://formspree.io, sign up free, create a new form.
  //   2. Copy the endpoint it gives you, looks like:
  //        https://formspree.io/f/xxxxxxxx
  //   3. Paste it below. Submissions then get emailed to you (free tier:
  //      50/month), no server of your own required.
  // Until you set this, submissions are only saved locally in the
  // visitor's browser — never silently discarded, but never sent anywhere.
  const ENDPOINT = null; // e.g. 'https://formspree.io/f/xxxxxxxx'

  function loadLocal() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) { return []; }
  }

  function saveLocal(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) { /* ignore */ }
  }

  function renderLocalList() {
    const container = document.getElementById('local-rec-list');
    if (!container) return;
    const list = loadLocal();
    if (!list.length) { container.innerHTML = ''; return; }

    container.innerHTML = `<h3 style="font-family:var(--font-display);font-size:12px;color:var(--text-dim);margin:12px 0;">SAVED ON THIS DEVICE</h3>` +
      list.slice().reverse().map(item => `
        <div class="local-rec-item">
          <h4>${escapeHtml(item.name)}</h4>
          ${item.link ? `<p><a href="${escapeHtml(item.link)}" target="_blank" rel="noopener">${escapeHtml(item.link)}</a></p>` : ''}
          ${item.desc ? `<p>${escapeHtml(item.desc)}</p>` : ''}
          ${item.why ? `<p><em>${escapeHtml(item.why)}</em></p>` : ''}
          <p>&mdash; ${escapeHtml(item.user || 'anonymous')}</p>
        </div>`).join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  async function submitToBackend(payload) {
    if (!ENDPOINT) return { ok: false, reason: 'no-endpoint' };
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      return { ok: res.ok, reason: res.ok ? null : `status-${res.status}` };
    } catch (e) {
      return { ok: false, reason: 'network-error' };
    }
  }

  function setStatus(el, msg, cls) {
    el.textContent = msg;
    el.className = 'form-status' + (cls ? ' ' + cls : '');
  }

  function init() {
    const form = document.getElementById('recommend-form');
    if (!form) return;
    const status = document.getElementById('rec-status');

    renderLocalList();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('rec-name').value.trim();
      if (!name) { setStatus(status, 'A game name is required.', 'err'); return; }

      const payload = {
        name,
        link: document.getElementById('rec-link').value.trim(),
        desc: document.getElementById('rec-desc').value.trim(),
        why: document.getElementById('rec-why').value.trim(),
        user: document.getElementById('rec-user').value.trim(),
        submittedAt: new Date().toISOString()
      };

      setStatus(status, 'Submitting…', '');

      const result = await submitToBackend(payload);

      // Always keep a local copy — a backend may exist later, and we
      // never want to claim a save happened when it didn't.
      const list = loadLocal();
      list.push(payload);
      saveLocal(list);
      renderLocalList();
      form.reset();

      if (result.ok) {
        setStatus(status, 'Thanks — your recommendation was sent.', 'ok');
      } else {
        setStatus(status, 'No backend is connected yet, so this was saved locally in your browser instead. It has not been sent anywhere.', 'ok');
      }
    });
  }

  window.GGRecommend = { init };
})();
