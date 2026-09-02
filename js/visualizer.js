/* ==========================================================
   Music visualizer — an optional, quiet backdrop that pulses
   with the background music. Off by default; turned on from
   Settings under Focus & Sensory. Reads live data straight
   from GGMusic's analyser node, so it always matches whatever
   track is actually playing.
   ========================================================== */
(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'visualizer-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let enabled = false;
  let w, h, dpr;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function draw() {
    requestAnimationFrame(draw);
    if (!enabled) return;

    const analyser = window.GGMusic && window.GGMusic.getAnalyser ? window.GGMusic.getAnalyser() : null;
    ctx.clearRect(0, 0, w, h);
    if (!analyser) return;

    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    const barCount = Math.min(40, data.length);
    const gap = 3;
    const barW = (w - gap * (barCount - 1)) / barCount;

    for (let i = 0; i < barCount; i++) {
      const v = data[i] / 255;
      const barH = Math.max(2, v * h * 0.32);
      const x = i * (barW + gap);
      ctx.fillStyle = `rgba(201,98,143,${0.06 + v * 0.20})`;
      ctx.fillRect(x, h - barH, barW, barH);
      // faint mirrored pixels near the top, kept very quiet
      ctx.fillStyle = `rgba(168,90,140,${0.03 + v * 0.08})`;
      ctx.fillRect(x, 0, barW, Math.max(1, barH * 0.15));
    }
  }
  requestAnimationFrame(draw);

  window.GGVisualizer = {
    setEnabled(value) {
      enabled = !!value;
      if (!enabled) ctx.clearRect(0, 0, w, h);
    }
  };
})();
