(function () {
  if (typeof MobileApp === 'undefined') return;

  const mobile = MobileApp;
  mobile.introTouchDrag = null;
  mobile.wakeLock = null;
  mobile.mobilePauseOpen = false;
  mobile.mobileBestiaryIndex = 0;

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
    const activeStates = ['intro', 'campaignMap', 'characterSelect', 'level', 'settings', 'bestiary'];
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
      resume: this.rect(390, 145, 500, 62),
      settings: this.rect(390, 225, 500, 62),
      bestiary: this.rect(390, 305, 500, 62),
      developer: this.rect(390, 385, 500, 62),
      mainMenu: this.rect(390, 465, 500, 62)
    };
  };

  mobile.bestiaryRects = function () {
    return {
      prev: this.rect(110, 595, 190, 70),
      next: this.rect(980, 595, 190, 70),
      back: this.rect(420, 595, 440, 70)
    };
  };

  mobile.getBestiaryTypes = function () {
    const preferred = ['dogRegime', 'zetnik', 'sucker', 'bastard', 'horse'];
    const configTypes = Object.keys((typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.enemies) || {});
    const combined = preferred.concat(configTypes);
    return combined.filter((type, index) => combined.indexOf(type) === index && ((GAME_CONFIG.enemies || {})[type] || type === 'horse'));
  };

  mobile.getEnemyLabel = function (type) {
    const names = {
      dogRegime: 'ПЁС РЕЖИМА',
      zetnik: 'ЗЕТНИК',
      sucker: 'ПРИСОСКА',
      bastard: 'ТВАРЬ',
      horse: 'HORSE'
    };
    return names[type] || String(type).toUpperCase();
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
    if (game && game.handleSpeakerClick && game.handleSpeakerClick(click)) return true;

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
    if (this.inRect(click, rects.settings)) {
      this.mobilePauseOpen = false;
      this.paused = false;
      if (game) game.setState('settings');
      AudioManager.playSfx('menuSelect', 0.65);
      return true;
    }
    if (this.inRect(click, rects.bestiary)) {
      this.mobilePauseOpen = false;
      this.paused = false;
      this.mobileBestiaryIndex = 0;
      if (game) game.setState('bestiary');
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

  mobile.handleBestiaryTap = function (game, click) {
    if (!click) return false;
    if (game && game.handleSpeakerClick && game.handleSpeakerClick(click)) return true;
    const types = this.getBestiaryTypes();
    const rects = this.bestiaryRects();
    if (this.inRect(click, rects.prev)) {
      this.mobileBestiaryIndex = (this.mobileBestiaryIndex + types.length - 1) % Math.max(1, types.length);
      AudioManager.playSfx('menuMove', 0.7);
      return true;
    }
    if (this.inRect(click, rects.next)) {
      this.mobileBestiaryIndex = (this.mobileBestiaryIndex + 1) % Math.max(1, types.length);
      AudioManager.playSfx('menuMove', 0.7);
      return true;
    }
    if (this.inRect(click, rects.back)) {
      if (game) game.setState('level');
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
    ctx.strokeText('ПАУЗА', GAME_CONFIG.width / 2, 105);
    ctx.fillText('ПАУЗА', GAME_CONFIG.width / 2, 105);
    ctx.restore();
    this.drawButton(ctx, rects.resume, 'ВЕРНУТЬСЯ В ИГРУ', true, 25);
    this.drawButton(ctx, rects.settings, 'НАСТРОЙКИ', false, 27);
    this.drawButton(ctx, rects.bestiary, 'ТВАРИ', false, 28);
    this.drawButton(ctx, rects.developer, 'РЕЖИМ РАЗРАБОТЧИКА', false, 22);
    this.drawButton(ctx, rects.mainMenu, 'ГЛАВНОЕ МЕНЮ', false, 26);
  };

  mobile.drawMobileBestiary = function (ctx, game) {
    this.drawBackground(ctx, game, 0.72);
    const types = this.getBestiaryTypes();
    if (!types.length) return;
    this.mobileBestiaryIndex = Math.max(0, Math.min(types.length - 1, this.mobileBestiaryIndex));
    const type = types[this.mobileBestiaryIndex];
    const enemyImages = game.images && game.images.enemies && game.images.enemies[type];
    const img = enemyImages && (enemyImages.idle || (enemyImages.walk && enemyImages.walk[0]) || enemyImages.dead);

    ctx.save();
    ctx.font = 'bold 44px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 7;
    ctx.strokeText('ТВАРИ', GAME_CONFIG.width / 2, 92);
    ctx.fillText('ТВАРИ', GAME_CONFIG.width / 2, 92);

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(260, 130, 760, 420);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 3;
    ctx.strokeRect(260, 130, 760, 420);

    ctx.font = 'bold 34px Arial';
    ctx.fillStyle = '#fff';
    ctx.strokeText(this.getEnemyLabel(type), GAME_CONFIG.width / 2, 185);
    ctx.fillText(this.getEnemyLabel(type), GAME_CONFIG.width / 2, 185);

    if (img) {
      const maxW = 360;
      const maxH = 265;
      const scale = Math.min(maxW / img.width, maxH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, GAME_CONFIG.width / 2 - w / 2, 505 - h, w, h);
    }

    ctx.font = '20px Arial';
    ctx.fillStyle = '#d8d8d8';
    ctx.fillText(String(this.mobileBestiaryIndex + 1) + ' / ' + String(types.length), GAME_CONFIG.width / 2, 525);
    ctx.restore();

    const rects = this.bestiaryRects();
    this.drawButton(ctx, rects.prev, 'НАЗАД', false, 24);
    this.drawButton(ctx, rects.back, 'ВЕРНУТЬСЯ В ИГРУ', true, 25);
    this.drawButton(ctx, rects.next, 'ВПЕРЁД', false, 24);
    if (game.drawSpeaker) game.drawSpeaker(ctx);
  };

  const originalUpdateStandalone = mobile.updateStandalone;
  mobile.updateStandalone = function (game, dt) {
    if (this.enabled) this.syncGameWakeLock(game);
    if (this.enabled && game && game.state === 'intro') this.handleIntroTouchScroll(game);

    if (this.enabled && game && game.state === 'bestiary') {
      const click = Input.consumePointer();
      if (click) this.handleBestiaryTap(game, click);
      return true;
    }

    if (this.enabled && game && game.state === 'level') {
      if (typeof DevPanel !== 'undefined' && DevPanel.open) {
        DevPanel.update(game);
        return true;
      }
      const click = Input.consumePointer();
      if (click && this.handleMobileLevelMenuTap(game, click)) return true;
      if (this.mobilePauseOpen) return true;
      if (click) Input.restorePointer(click);
    }

    return originalUpdateStandalone.call(this, game, dt);
  };

  const originalDrawStandalone = mobile.drawStandalone;
  mobile.drawStandalone = function (ctx, game) {
    if (this.enabled && game && game.state === 'bestiary') {
      this.drawMobileBestiary(ctx, game);
      this.drawDebug(ctx, game);
      return true;
    }
    return originalDrawStandalone.call(this, ctx, game);
  };

  const originalDrawOverlay = mobile.drawOverlay;
  mobile.drawOverlay = function (ctx, game) {
    if (game && game.state === 'level') {
      this.drawMobileMenuButton(ctx);
      if (game.drawSpeaker) game.drawSpeaker(ctx);
      this.drawMobileLevelMenu(ctx);
      if (typeof DevPanel !== 'undefined' && DevPanel.open) DevPanel.draw(ctx);
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