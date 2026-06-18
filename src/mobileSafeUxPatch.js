(function () {
  if (typeof MobileApp === 'undefined') return;

  const mobile = MobileApp;
  mobile.introTouchDrag = null;
  mobile.wakeLock = null;
  mobile.mobilePauseOpen = false;

  mobile.requestGameWakeLock = async function () {
    if (!('wakeLock' in navigator)) return;
    if (this.wakeLock) return;
    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      this.wakeLock.addEventListener('release', () => { this.wakeLock = null; });
    } catch (error) { this.wakeLock = null; }
  };

  mobile.releaseGameWakeLock = async function () {
    if (!this.wakeLock) return;
    try { await this.wakeLock.release(); } catch (error) {}
    this.wakeLock = null;
  };

  mobile.syncGameWakeLock = function (game) {
    const activeStates = ['intro', 'campaignMap', 'characterSelect', 'level'];
    if (game && activeStates.includes(game.state)) this.requestGameWakeLock();
    else this.releaseGameWakeLock();
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && window.game && MobileApp.enabled) {
      MobileApp.syncGameWakeLock(window.game);
    }
  });

  mobile.handleIntroTouchScroll = function (game) {
    if (!game || !game.intro || !game.intro.readyToContinue || !Input.pointer) return false;
    if (Input.pointer.down) {
      const p = Input.pointer;
      if (!this.introTouchDrag) {
        this.introTouchDrag = { y: p.y, moved: false };
        return false;
      }
      const dy = p.y - this.introTouchDrag.y;
      if (Math.abs(dy) >= 4) {
        const direction = dy < 0 ? 1 : -1;
        const steps = Math.max(1, Math.round(Math.abs(dy) / 32));
        if (game.scrollIntroReader) game.scrollIntroReader(direction * steps);
        this.introTouchDrag.y = p.y;
        this.introTouchDrag.moved = true;
        return true;
      }
      return false;
    }
    this.introTouchDrag = null;
    return false;
  };

  mobile.menuBox = function () { return this.rect(14, 16, 104, 56); };
  mobile.mobilePauseRects = function () {
    return {
      resume: this.rect(390, 205, 500, 72),
      developer: this.rect(390, 305, 500, 72),
      mainMenu: this.rect(390, 405, 500, 72)
    };
  };

  mobile.openDeveloperPanelFromMobile = function (game) {
    if (typeof DevPanel === 'undefined') return;
    this.mobilePauseOpen = false;
    this.paused = false;
    if (game) game.paused = false;
    GAME_CONFIG.adminTuningEnabled = true;
    if (typeof DevPanel.openFromPauseMenu === 'function') DevPanel.openFromPauseMenu(game);
    else {
      DevPanel.open = true;
      DevPanel.tab = 'LEVEL WAVES';
      if (typeof DevPanel.ensureLevels === 'function') DevPanel.ensureLevels();
      if (typeof DevPanel.syncSelectedLevelWithScene === 'function') DevPanel.syncSelectedLevelWithScene(game);
    }
    AudioManager.playSfx('menuSelect', 0.65);
  };

  mobile.handleMobileLevelMenuTap = function (game, click) {
    if (!click) return false;
    if (!this.mobilePauseOpen) {
      if (this.inRect(click, this.menuBox())) {
        this.mobilePauseOpen = true;
        this.paused = true;
        AudioManager.playSfx('menuSelect', 0.65);
        return true;
      }
      return false;
    }

    const rects = this.mobilePauseRects();
    if (this.inRect(click, rects.resume)) {
      this.mobilePauseOpen = false;
      this.paused = false;
      AudioManager.playSfx('menuSelect', 0.65);
      return true;
    }
    if (this.inRect(click, rects.developer)) {
      this.openDeveloperPanelFromMobile(game);
      return true;
    }
    if (this.inRect(click, rects.mainMenu)) {
      this.mobilePauseOpen = false;
      this.paused = false;
      if (game) {
        game.paused = false;
        game.setState('mainMenu');
      }
      AudioManager.playSfx('menuSelect', 0.65);
      return true;
    }

    return true;
  };

  mobile.drawMobileMenuButton = function (ctx) {
    this.drawButton(ctx, this.menuBox(), 'МЕНЮ', false, 18);
  };

  mobile.drawMobileLevelMenu = function (ctx) {
    if (!this.mobilePauseOpen) return;
    const rects = this.mobilePauseRects();
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    ctx.font = 'bold 46px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 7;
    ctx.strokeText('ПАУЗА', GAME_CONFIG.width / 2, 150);
    ctx.fillText('ПАУЗА', GAME_CONFIG.width / 2, 150);
    ctx.restore();
    this.drawButton(ctx, rects.resume, 'ВЕРНУТЬСЯ В ИГРУ', true, 28);
    this.drawButton(ctx, rects.developer, 'РЕЖИМ РАЗРАБОТЧИКА', false, 24);
    this.drawButton(ctx, rects.mainMenu, 'ГЛАВНОЕ МЕНЮ', false, 28);
  };

  const originalUpdateStandalone = mobile.updateStandalone;
  mobile.updateStandalone = function (game, dt) {
    if (this.enabled) this.syncGameWakeLock(game);
    if (this.enabled && game && game.state === 'intro') this.handleIntroTouchScroll(game);

    if (this.enabled && game && game.state === 'level') {
      if (typeof DevPanel !== 'undefined') DevPanel.update(game);
      if (typeof DevPanel !== 'undefined' && DevPanel.open) return true;
      const click = Input.consumePointer();
      if (click && this.handleMobileLevelMenuTap(game, click)) return true;
      if (this.mobilePauseOpen) return true;
      if (click) Input.restorePointer(click);
    }

    return originalUpdateStandalone.call(this, game, dt);
  };

  const originalDrawOverlay = mobile.drawOverlay;
  mobile.drawOverlay = function (ctx, game) {
    if (game && game.state === 'level') {
      this.drawMobileMenuButton(ctx);
      this.drawMobileLevelMenu(ctx);
      if (typeof DevPanel !== 'undefined') DevPanel.draw(ctx);
      this.drawDebug(ctx, game);
      return;
    }
    originalDrawOverlay.call(this, ctx, game);
  };

  mobile.drawMobileIntro = function (ctx, game) {
    if (game && game.drawIntro) game.drawIntro(ctx);
    game.drawSpeaker(ctx);
  };

  mobile.drawMobileCampaignMap = function (ctx, game) {
    if (game.campaignMap && game.campaignMap.draw) game.campaignMap.draw(ctx);
    game.drawSpeaker(ctx);
  };
})();