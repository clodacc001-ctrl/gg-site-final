/* ==========================================================
   Main controller — ties intro → hub → nav → game player together
   ========================================================== */
(function () {
  const introScreen = document.getElementById('intro-screen');
  const hub = document.getElementById('hub');
  const enterBtn = document.getElementById('enter-btn');
  const musicToggle = document.getElementById('music-toggle');
  const musicIcon = document.getElementById('music-icon');
  const navBtns = document.querySelectorAll('.nav-btn');
  const hubNav = document.getElementById('hub-nav');
  const burger = document.getElementById('nav-burger');
  const pages = document.querySelectorAll('.page');

  const player = document.getElementById('game-player');
  const playerFrame = document.getElementById('player-frame');
  const playerTitle = document.getElementById('player-title');
  const playerBack = document.getElementById('player-back');
  const playerFullscreen = document.getElementById('player-fullscreen');
  const playerFallback = document.getElementById('player-fallback');
  const playerRetry = document.getElementById('player-retry');
  let loadWatchTimer = null;
  let activeGame = null;

  const VISITED_KEY = 'gg-site-visited-before';

  // -------------------- intro --------------------
  function enterSite() {
    const settings = window.GGSettings.get();
    let everVisited = true;
    try { everVisited = localStorage.getItem(VISITED_KEY) === 'true'; } catch (e) {}

    // First time ever on the site: stay silent for this visit, without
    // changing the saved mute preference used on future visits.
    window.GGMusic.init(settings.musicMuted, !everVisited);

    try { localStorage.setItem(VISITED_KEY, 'true'); } catch (e) {}

    updateMusicIcon();

    introScreen.classList.add('fade-out');
    setTimeout(() => {
      introScreen.classList.add('hidden');
      hub.classList.remove('hidden');
      hub.classList.add('entering');
      window.GGGames.render();
      window.GGRecommend.init();
    }, 550);
  }

  enterBtn.addEventListener('click', enterSite);
  document.addEventListener('keydown', (e) => {
    if (!introScreen.classList.contains('hidden') && (e.key === 'Enter' || e.key === ' ')) {
      enterSite();
    }
  });

  // -------------------- nav --------------------
  function goToPage(name) {
    pages.forEach(p => p.classList.toggle('is-active', p.dataset.page === name));
    navBtns.forEach(b => b.classList.toggle('is-active', b.dataset.nav === name));
    hubNav.classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => goToPage(el.dataset.nav));
  });

  burger.addEventListener('click', () => hubNav.classList.toggle('open'));

  // -------------------- music toggle --------------------
  function updateMusicIcon() {
    const muted = window.GGMusic.isMuted();
    musicIcon.textContent = muted ? '✕' : '♪';
    musicToggle.title = muted ? 'Unmute music' : 'Mute music';
  }

  musicToggle.addEventListener('click', () => {
    if (window.GGMusic.isMuted()) {
      window.GGMusic.unmute();
      window.GGSettings.set({ musicMuted: false });
    } else {
      window.GGMusic.mute();
      window.GGSettings.set({ musicMuted: true });
    }
    updateMusicIcon();
  });

  // -------------------- settings page wiring --------------------
  function refreshSettingUI() {
    const s = window.GGSettings.get();
    document.querySelectorAll('.toggle-group').forEach(group => {
      const key = group.dataset.setting;
      const value = String(s[key]);
      group.querySelectorAll('.toggle-opt').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.value === value);
      });
    });
    updateMusicIcon();
  }

  document.querySelectorAll('.toggle-group').forEach(group => {
    const key = group.dataset.setting;
    group.querySelectorAll('.toggle-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        let value = btn.dataset.value;
        if (value === 'true') value = true;
        else if (value === 'false') value = false;

        window.GGSettings.set({ [key]: value });

        if (key === 'musicMuted') {
          if (value) window.GGMusic.mute(); else window.GGMusic.unmute();
          if (window.GGSynth) window.GGSynth.refreshMute();
        }
        refreshSettingUI();
      });
    });
  });

  document.getElementById('reset-settings').addEventListener('click', () => {
    window.GGSettings.reset();
    if (window.GGSettings.get().musicMuted) window.GGMusic.mute(); else window.GGMusic.unmute();
    refreshSettingUI();
  });

  refreshSettingUI();

  // -------------------- game player --------------------
  function loadGameFrame(game) {
    playerFallback.classList.add('hidden');
    playerFrame.classList.remove('hidden');
    clearTimeout(loadWatchTimer);

    let loaded = false;
    playerFrame.onload = () => {
      loaded = true;
      // Keyboard input defaults to whatever element has focus in the
      // parent page (e.g. the "PLAY" button just clicked) — without
      // explicitly moving focus into the iframe, arrow keys/space/WASD
      // never reach the game at all. This is what was causing "can't
      // move" for some games.
      focusGameFrame();
    };
    playerFrame.src = `games/${game.folder}/${game.entry}`;

    // If the game hasn't fired a load event within a few seconds, it's
    // most likely blocked (extension, content filter) or its files are
    // missing — show a clear fallback instead of a blank frame.
    loadWatchTimer = setTimeout(() => {
      if (!loaded) {
        playerFrame.classList.add('hidden');
        playerFallback.classList.remove('hidden');
      }
    }, 6000);
  }

  function focusGameFrame() {
    try {
      playerFrame.focus();
      if (playerFrame.contentWindow) playerFrame.contentWindow.focus();
    } catch (e) { /* cross-origin or not ready yet — ignore */ }
  }

  function openGame(game) {
    activeGame = game;
    playerTitle.textContent = game.name;
    player.classList.remove('hidden');
    requestAnimationFrame(() => player.classList.add('visible'));
    loadGameFrame(game);

    // Site music (and the synth) must fully stop overlapping with a game's own audio.
    window.GGMusic.duck();
    if (window.GGSynth) window.GGSynth.duck();
  }

  // Clicking anywhere on the frame itself re-focuses it — covers cases
  // where focus drifted back to the page (e.g. after a fullscreen toggle).
  playerFrame.addEventListener('load', focusGameFrame);
  player.addEventListener('click', (e) => {
    if (e.target === playerFrame) focusGameFrame();
  });

  playerRetry.addEventListener('click', () => {
    if (activeGame) loadGameFrame(activeGame);
  });

  function closeGame() {
    clearTimeout(loadWatchTimer);
    activeGame = null;
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
    player.classList.remove('visible');
    setTimeout(() => {
      player.classList.add('hidden');
      playerFrame.src = 'about:blank';
    }, 350);
    window.GGMusic.unduck();
    if (window.GGSynth) window.GGSynth.unduck();
  }

  playerBack.addEventListener('click', closeGame);

  // -------------------- fullscreen --------------------
  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function updateFullscreenIcon() {
    playerFullscreen.textContent = isFullscreen() ? '✕' : '⛶';
    playerFullscreen.title = isFullscreen() ? 'Exit fullscreen' : 'Fullscreen';
  }

  playerFullscreen.addEventListener('click', () => {
    if (isFullscreen()) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    } else {
      const target = player; // fullscreen the whole player, bar included
      if (target.requestFullscreen) target.requestFullscreen();
      else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
    }
  });

  document.addEventListener('fullscreenchange', () => { updateFullscreenIcon(); focusGameFrame(); });
  document.addEventListener('webkitfullscreenchange', () => { updateFullscreenIcon(); focusGameFrame(); });

  window.GGMain = { openGame, closeGame };
})();
