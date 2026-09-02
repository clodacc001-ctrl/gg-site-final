/* ==========================================================
   Synthesizer — a small playable pixel keyboard, toggled on
   from Settings. It rides along with the background music: it
   shares the same mute state, so muting the music silences the
   synth too, and it goes quiet whenever a game is open.
   ========================================================== */
(function () {
  const KEYS = [
    { key: 'a', note: 'C4', freq: 261.63 },
    { key: 's', note: 'D4', freq: 293.66 },
    { key: 'd', note: 'E4', freq: 329.63 },
    { key: 'f', note: 'F4', freq: 349.23 },
    { key: 'g', note: 'G4', freq: 392.00 },
    { key: 'h', note: 'A4', freq: 440.00 },
    { key: 'j', note: 'B4', freq: 493.88 },
    { key: 'k', note: 'C5', freq: 523.25 }
  ];

  let audioCtx = null;
  let masterGain = null;
  let enabled = false;
  let duckLevel = 1;
  let panelEl = null;

  function ensureCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.28;
      masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  function applyMute() {
    if (!masterGain) return;
    const muted = window.GGMusic ? window.GGMusic.isMuted() : false;
    const target = muted ? 0 : 0.28 * duckLevel;
    const now = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(masterGain.gain.value, now);
    masterGain.gain.linearRampToValueAtTime(target, now + 0.15);
  }

  function pluck(freq) {
    if (!enabled) return;
    ensureCtx();
    applyMute();
    const osc = audioCtx.createOscillator();
    const env = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    const now = audioCtx.currentTime;
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(0.9, now + 0.015);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    osc.connect(env);
    env.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.55);
  }

  function buildPanel() {
    const panel = document.createElement('div');
    panel.id = 'synth-panel';
    panel.className = 'synth-panel hidden';
    panel.innerHTML = `
      <div class="synth-title">SYNTH &mdash; keys A S D F G H J K</div>
      <div class="synth-keys">
        ${KEYS.map(k => `<button class="synth-key" data-freq="${k.freq}" title="${k.note}">${k.key.toUpperCase()}</button>`).join('')}
      </div>`;
    document.body.appendChild(panel);

    panel.querySelectorAll('.synth-key').forEach(btn => {
      const fire = (e) => {
        e.preventDefault();
        pluck(parseFloat(btn.dataset.freq));
        btn.classList.add('is-pressed');
        setTimeout(() => btn.classList.remove('is-pressed'), 140);
      };
      btn.addEventListener('pointerdown', fire);
    });

    document.addEventListener('keydown', (e) => {
      if (!enabled || e.repeat) return;
      const match = KEYS.find(k => k.key === e.key.toLowerCase());
      if (!match) return;
      // Don't hijack typing in the recommendations form.
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      pluck(match.freq);
      const btn = panel.querySelector(`[data-freq="${match.freq}"]`);
      if (btn) { btn.classList.add('is-pressed'); setTimeout(() => btn.classList.remove('is-pressed'), 140); }
    });

    return panel;
  }

  window.GGSynth = {
    setEnabled(value) {
      enabled = !!value;
      if (!panelEl) panelEl = buildPanel();
      panelEl.classList.toggle('hidden', !enabled);
    },
    duck() { duckLevel = 0; applyMute(); },
    unduck() { duckLevel = 1; applyMute(); },
    refreshMute() { applyMute(); }
  };
})();
