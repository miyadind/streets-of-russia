const MobileApp = {
  enabled: false,
  state: 'off',
  lastTap: null,
  debug: /mobiledebug=1/.test(window.location.search),

  isMobile() {
    return !!(Responsive && Responsive.isTouchDevice);
  },

  attach(game) {
    this.enabled = this.isMobile();
    if (!this.enabled || !game || game.mobileAppAttached) return;
    game.mobileAppAttached = true;
    this.patchGame(game);
  },

  patchGame(game) {
    const originalUpdate = game.update.bind(game);
    const originalDraw = game.draw.bind(game);
    const mobile = this;

    game.update = function (dt) {
      if (!mobile.enabled) {
        originalUpdate(dt);
        return;
      }

      mobile.routeInput(this);
      originalUpdate(dt);
    };

    game.draw = function () {
      originalDraw();
      if (mobile.enabled) mobile.drawOverlay(this.ctx, this);
    };
  },

  routeInput(game) {
    const click = Input.consumePointer();
    if (!click) return;

    this.lastTap = { x: Math.round(click.x), y: Math.round(click.y), state: game.state };

    if (game.handleSpeakerClick && game.handleSpeakerClick(click)) return;

    if (game.state === 'splash') {
      AudioManager.unlock();
      AudioManager.playSfx('menuSelect', 0.75);
      game.setState('mainMenu');
      return;
    }

    if (game.state === 'mainMenu' && this.handleMainMenuTap(game, click)) return;
    if (game.state === 'settings' && this.handleSettingsTap(game, click)) return;
    if (game.state === 'characterSelect' && this.handleCharacterTap(game, click)) return;

    Input.restorePointer(click);
  },

  rect(x, y, w, h) {
    return { x, y, w, h };
  },

  inRect(point, rect) {
    return point && point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  },

  mainMenuRects() {
    return [
      this.rect(220, 235, 840, 90),
      this.rect(220, 337, 840, 90),
      this.rect(220, 439, 840, 90)
    ];
  },

  settingsRects(count) {
    const rects = [];
    for (let i = 0; i < count; i++) rects.push(this.rect(140, 145 + i * 84, 1000, 78));
    return rects;
  },

  characterRects() {
    return {
      heroes: [
        this.rect(40, 90, 390, 520),
        this.rect(445, 90, 390, 520),
        this.rect(850, 90, 390, 520)
      ],
      confirm: this.rect(230, 585, 520, 120),
      back: this.rect(770, 585, 360, 120)
    };
  },

  handleMainMenuTap(game, click) {
    const rects = this.mainMenuRects();
    for (let i = 0; i < rects.length; i++) {
      if (!this.inRect(click, rects[i])) continue;
      AudioManager.unlock();
      AudioManager.playSfx('menuSelect', 0.85);
      if (i === 0) game.setState('characterSelect');
      if (i === 1) game.setState('mainMenu');
      if (i === 2) game.setState('settings');
      return true;
    }
    return false;
  },

  handleSettingsTap(game, click) {
    const items = (Menu && Menu.settingsItems) || [];
    const rects = this.settingsRects(items.length || 6);
    for (let i = 0; i < rects.length; i++) {
      if (!this.inRect(click, rects[i])) continue;
      AudioManager.unlock();
      if (Menu && Menu.changeSetting) {
        Menu.settingsIndex = i;
        Menu.changeSetting(i, game, 1);
      }
      return true;
    }
    return false;
  },

  handleCharacterTap(game, click) {
    if (typeof CharacterSelect === 'undefined') return false;
    if (CharacterSelect.infoOpen) return false;
    const rects = this.characterRects();

    for (let i = 0; i < rects.heroes.length; i++) {
      if (!this.inRect(click, rects.heroes[i])) continue;
      CharacterSelect.setSelection(i);
      CharacterSelect.footerFocus = null;
      return true;
    }

    if (this.inRect(click, rects.confirm)) {
      CharacterSelect.confirm(game);
      return true;
    }

    if (this.inRect(click, rects.back)) {
      AudioManager.playSfx('menuSelect', 0.65);
      game.setState('mainMenu');
      return true;
    }

    return false;
  },

  drawOverlay(ctx, game) {
    if (game.state === 'splash') this.drawMobileSplash(ctx);
    if (game.state === 'mainMenu') this.drawMobileMainMenu(ctx);
    if (game.state === 'settings') this.drawMobileSettings(ctx);
    if (game.state === 'characterSelect') this.drawMobileCharacterHelp(ctx);
    if (this.debug) this.drawDebug(ctx, game);
  },

  drawDim(ctx, alpha = 0.56) {
    ctx.fillStyle = 'rgba(0,0,0,' + alpha + ')';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
  },

  drawButton(ctx, box, label, active = false) {
    ctx.save();
    ctx.fillStyle = active ? 'rgba(150,0,0,0.86)' : 'rgba(0,0,0,0.72)';
    ctx.strokeStyle = active ? '#ffffff' : 'rgba(255,255,255,0.82)';
    ctx.lineWidth = active ? 6 : 4;
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    ctx.font = 'bold 34px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    ctx.strokeText(label, box.x + box.w / 2, box.y + box.h / 2 + 2);
    ctx.fillText(label, box.x + box.w / 2, box.y + box.h / 2 + 2);
    ctx.restore();
  },

  drawMobileSplash(ctx) {
    this.drawDim(ctx, 0.18);
    const box = this.rect(250, 545, 780, 100);
    this.drawButton(ctx, box, 'НАЖМИТЕ НА ЭКРАН', true);
  },

  drawMobileMainMenu(ctx) {
    this.drawDim(ctx, 0.5);
    const rects = this.mainMenuRects();
    const labels = ['НОВАЯ ИГРА', 'ТВАРИ', 'НАСТРОЙКИ'];
    ctx.save();
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 7;
    ctx.strokeText('STREETS OF RUSSIA', GAME_CONFIG.width / 2, 160);
    ctx.fillText('STREETS OF RUSSIA', GAME_CONFIG.width / 2, 160);
    ctx.restore();
    for (let i = 0; i < rects.length; i++) this.drawButton(ctx, rects[i], labels[i], i === 0);
  },

  drawMobileSettings(ctx) {
    this.drawDim(ctx, 0.66);
    const items = (Menu && Menu.settingsItems) || [];
    const rects = this.settingsRects(items.length || 6);
    ctx.save();
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 6;
    ctx.strokeText('НАСТРОЙКИ', GAME_CONFIG.width / 2, 92);
    ctx.fillText('НАСТРОЙКИ', GAME_CONFIG.width / 2, 92);
    ctx.restore();
    for (let i = 0; i < rects.length; i++) {
      const label = Menu && Menu.getSettingsLabel ? Menu.getSettingsLabel(i) : (items[i] || '');
      this.drawButton(ctx, rects[i], label, i === Menu.settingsIndex);
    }
  },

  drawMobileCharacterHelp(ctx) {
    const rects = this.characterRects();
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#fff';
    for (let i = 0; i < rects.heroes.length; i++) ctx.fillRect(rects.heroes[i].x, rects.heroes[i].y, rects.heroes[i].w, rects.heroes[i].h);
    ctx.restore();
    this.drawButton(ctx, rects.confirm, 'ПОДТВЕРДИТЬ', true);
    this.drawButton(ctx, rects.back, 'НАЗАД', false);
  },

  drawDebug(ctx, game) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.74)';
    ctx.fillRect(12, 620, 520, 86);
    ctx.fillStyle = '#00ff99';
    ctx.font = '18px monospace';
    ctx.fillText('MOBILE state: ' + game.state, 24, 648);
    if (this.lastTap) ctx.fillText('tap: ' + this.lastTap.x + ', ' + this.lastTap.y + ' from ' + this.lastTap.state, 24, 674);
    ctx.restore();
  }
};