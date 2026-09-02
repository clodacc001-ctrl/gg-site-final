/* ==========================================================
   Particle background — small pixel motes, slow + low-opacity
   ========================================================== */
(function () {
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let running = true;
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

  function makeParticle() {
    const size = Math.random() < 0.7 ? (1 + Math.random() * 2) : (2 + Math.random() * 3);
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      size,
      speed: 0.06 + Math.random() * 0.18,
      drift: (Math.random() - 0.5) * 0.08,
      opacity: 0.05 + Math.random() * 0.18,
      hue: Math.random() < 0.5 ? '201,98,143' : '168,90,140'
    };
  }

  function init(count) {
    particles = Array.from({ length: count }, makeParticle);
  }

  function tick() {
    if (!running) { requestAnimationFrame(tick); return; }
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.y -= p.speed;
      p.x += p.drift;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      ctx.fillStyle = `rgba(${p.hue},${p.opacity})`;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    requestAnimationFrame(tick);
  }

  window.GGParticles = {
    start(count = 70) {
      resize();
      init(count);
      running = true;
      canvas.style.display = 'block';
    },
    stop() {
      running = false;
      ctx.clearRect(0, 0, w, h);
      canvas.style.display = 'none';
    },
    setEnabled(enabled) {
      if (enabled) this.start(); else this.stop();
    }
  };

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(tick);
})();
