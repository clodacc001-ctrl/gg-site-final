/* ==========================================================
   Settings — persisted to localStorage, applied to <body>/<html>
   ========================================================== */
(function () {
  const STORAGE_KEY = 'gg-site-settings-v1';

  const DEFAULTS = {
    musicMuted: false,
    particles: true,
    bgAnim: true,
    uiAnim: true,
    pixelIntensity: 'medium',
    reducedMotion: false,
    synthEnabled: false,
    visualizer: false,
    focusOutlines: false,
    simplifyUI: false,
    navGuard: true
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULTS };
      const parsed = JSON.parse(raw);
      return { ...DEFAULTS, ...parsed };
    } catch (e) {
      return { ...DEFAULTS };
    }
  }

  function save(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) { /* storage unavailable — settings just won't persist */ }
  }

  let current = load();

  function apply() {
    const body = document.body;
    body.setAttribute('data-bg-anim', String(current.bgAnim && !current.reducedMotion));
    body.setAttribute('data-ui-anim', String(current.uiAnim && !current.reducedMotion));
    body.setAttribute('data-pixel', current.pixelIntensity);
    body.setAttribute('data-reduced-motion', String(current.reducedMotion));
    body.setAttribute('data-focus-outlines', String(current.focusOutlines));
    body.setAttribute('data-simplify', String(current.simplifyUI));

    if (window.GGParticles) {
      window.GGParticles.setEnabled(current.particles && !current.reducedMotion);
    }
    if (window.GGMusic) {
      if (current.musicMuted) window.GGMusic.mute();
    }
    if (window.GGSynth) {
      window.GGSynth.setEnabled(current.synthEnabled);
    }
    if (window.GGVisualizer) {
      window.GGVisualizer.setEnabled(current.visualizer && !current.reducedMotion);
    }
  }

  window.GGSettings = {
    get() { return { ...current }; },
    set(partial) {
      current = { ...current, ...partial };
      save(current);
      apply();
    },
    reset() {
      current = { ...DEFAULTS };
      save(current);
      apply();
    },
    applyToDom: apply
  };

  apply();
})();
