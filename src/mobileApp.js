const MobileApp = {
  enabled: false,
  state: 'off',
  lastTap: null,
  debug: false,

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
    for (let i = 0; i < count; i++) rects.push(this.rect(150, 150 + i * 82, 980, 76));
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
      if (i === 1) game.setState('bestiary');
      if (i === 2) game.setState('settings');
      return true;
    }
    return false;
  },

  handleSettingsTap(game, click) {
    const items = (Menu && Menu.settingsItems) || [];
    const rects = this.settingsRects(items.length || 4);
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
    if (!this.debug || !this.lastTap) return;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(12, 620, 430, 80);
    ctx.fillStyle = '#00ff99';
    ctx.font = '18px monospace';
    ctx.fillText('MOBILE state: ' + game.state, 24, 648);
    ctx.fillText('tap: ' + this.lastTap.x + ', ' + this.lastTap.y + ' from ' + this.lastTap.state, 24, 674);
    ctx.restore();
  }
};