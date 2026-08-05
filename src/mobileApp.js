const MobileApp = {
  enabled: false,
  lastTap: null,
  debug: /mobiledebug=1/.test(window.location.search),
  paused: false,

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

      if (mobile.updateStandalone(this, dt)) return;
      originalUpdate(dt);
    };

    game.draw = function () {
      if (mobile.enabled && mobile.drawStandalone(this.ctx, this)) return;
      originalDraw();
      if (mobile.enabled) mobile.drawOverlay(this.ctx, this);
    };
  },

  updateStandalone(game, dt) {
    const click = Input.consumePointer();
    if (click) {
      this.lastTap = { x: Math.round(click.x), y: Math.round(click.y), state: game.state };
      if (game.handleSpeakerClick && game.handleSpeakerClick(click)) return true;
    }

    if (game.state === 'splash') {
      if (click || Input.consumeAnyKey()) {
        AudioManager.unlock();
        AudioManager.playSfx('menuSelect', 0.75);
        game.setState('mainMenu');
      }
      return true;
    }

    if (game.state === 'mainMenu') {
      if (click) this.handleMainMenuTap(game, click);
      return true;
    }

    if (game.state === 'settings') {
      if (click) this.handleSettingsTap(game, click);
      return true;
    }

    if (game.state === 'characterSelect') {
      if (click) this.handleCharacterTap(game, click);
      return true;
    }

    if (game.state === 'intro') {
      if (click) {
        if (this.inRect(click, this.skipIntroBox())) {
          if (game.isIntroSkipUnlocked && game.isIntroSkipUnlocked() && game.requestIntroSkip) {
            game.requestIntroSkip();
            return true;
          }
        }
        Input.restorePointer(click);
      }
      if (game.updateIntro) game.updateIntro(dt);
      return true;
    }

    if (game.state === 'campaignMap') {
      if (click) {
        AudioManager.unlock();
        AudioManager.playSfx('menuSelect', 0.85);
        game.setState('characterSelect');
        return true;
      }
      if (game.campaignMap && game.campaignMap.update) game.campaignMap.update(game, dt);
      return true;
    }

    if (game.state === 'level') {
      if (click && this.inRect(click, this.pauseBox())) {
        this.paused = !this.paused;
        AudioManager.playSfx('menuSelect', 0.65);
        return true;
      }
      if (this.paused) return true;
      if (click) Input.restorePointer(click);
    } else if (click) {
      Input.restorePointer(click);
    }

    return false;
  },

  drawStandalone(ctx, game) {
    if (game.state === 'splash') {
      this.drawMobileSplash(ctx, game);
      this.drawDebug(ctx, game);
      return true;
    }
    if (game.state === 'mainMenu') {
      this.drawMobileMainMenu(ctx, game);
      this.drawDebug(ctx, game);
      return true;
    }
    if (game.state === 'settings') {
      this.drawMobileSettings(ctx, game);
      this.drawDebug(ctx, game);
      return true;
    }
    if (game.state === 'characterSelect') {
      this.drawMobileCharacterSelect(ctx, game);
      this.drawDebug(ctx, game);
      return true;
    }
    if (game.state === 'intro') {
      this.drawMobileIntro(ctx, game);
      this.drawDebug(ctx, game);
      return true;
    }
    if (game.state === 'campaignMap') {
      this.drawMobileCampaignMap(ctx, game);
      this.drawDebug(ctx, game);
      return true;
    }
    return false;
  },

  drawOverlay(ctx, game) {
    if (game.state === 'level') {
      this.drawPauseButton(ctx);
      if (this.paused) this.drawPauseOverlay(ctx, game);
    }
    this.drawDebug(ctx, game);
  },

  rect(x, y, w, h) { return { x, y, w, h }; },
  inRect(point, rect) { return point && point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h; },

  pauseBox() { return this.rect(20, 18, 92, 62); },
  skipIntroBox() { return this.rect(1015, 628, 225, 64); },

  mainMenuRects() {
    return [this.rect(220, 250, 840, 86), this.rect(220, 355, 840, 86), this.rect(220, 460, 840, 86)];
  },

  settingsControlRects(index) {
    const y = 140 + index * 84;
    return {
      row: this.rect(100, y, 1080, 76),
      minus: this.rect(100, y, 92, 76),
      plus: this.rect(1088, y, 92, 76),
      label: this.rect(210, y, 860, 76)
    };
  },

  characterRects() {
    return {
      heroes: [this.rect(80, 126, 330, 410), this.rect(475, 126, 330, 410), this.rect(870, 126, 330, 410)],
      info: [this.rect(92, 138, 58, 58), this.rect(487, 138, 58, 58), this.rect(882, 138, 58, 58)],
      confirm: this.rect(235, 595, 490, 90),
      back: this.rect(760, 595, 285, 90)
    };
  },

  handleMainMenuTap(game, click) {
    const rects = this.mainMenuRects();
    for (let i = 0; i < rects.length; i++) {
      if (!this.inRect(click, rects[i])) continue;
      AudioManager.unlock();
      AudioManager.playSfx('menuSelect', 0.85);
      if (i === 0) {
        if (game.startIntro) game.startIntro();
        else game.setState('characterSelect');
      }
      if (i === 1) game.setState('mainMenu');
      if (i === 2) game.setState('settings');
      return true;
    }
    return false;
  },

  handleSettingsTap(game, click) {
    const items = (Menu && Menu.settingsItems) || [];
    for (let i = 0; i < items.length; i++) {
      const r = this.settingsControlRects(i);
      if (!this.inRect(click, r.row)) continue;
      AudioManager.unlock();
      Menu.settingsIndex = i;
      const direction = this.inRect(click, r.minus) ? -1 : 1;
      Menu.changeSetting(i, game, direction);
      return true;
    }
    return false;
  },

  handleCharacterTap(game, click) {
    if (typeof CharacterSelect === 'undefined') return false;
    const rects = this.characterRects();

    for (let i = 0; i < rects.info.length; i++) {
      if (!this.inRect(click, rects.info[i])) continue;
      CharacterSelect.setSelection(i);
      CharacterSelect.openInfo();
      return true;
    }

    if (CharacterSelect.infoOpen) {
      CharacterSelect.closeInfo();
      return true;
    }

    for (let i = 0; i < rects.heroes.length; i++) {
      if (!this.inRect(click, rects.heroes[i])) continue;
      CharacterSelect.setSelection(i);
      CharacterSelect.footerFocus = null;
      return true;
    }

    if (this.inRect(click, rects.confirm)) { CharacterSelect.confirm(game); return true; }
    if (this.inRect(click, rects.back)) { AudioManager.playSfx('menuSelect', 0.65); game.setState('mainMenu'); return true; }
    return false;
  },

  drawBackground(ctx, game, alpha = 0.62) {
    const bg = game.images && game.images.main;
    if (bg) ctx.drawImage(bg, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    else { ctx.fillStyle = '#050508'; ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height); }
    ctx.fillStyle = 'rgba(0,0,0,' + alpha + ')';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
  },

  drawButton(ctx, box, label, active = false, fontSize = 34) {
    ctx.save();
    ctx.fillStyle = active ? 'rgba(130,0,0,0.78)' : 'rgba(0,0,0,0.58)';
    ctx.strokeStyle = active ? 'rgba(255,255,255,0.94)' : 'rgba(255,255,255,0.62)';
    ctx.lineWidth = active ? 5 : 3;
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    ctx.font = 'bold ' + fontSize + 'px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 5;
    ctx.strokeText(label, box.x + box.w / 2, box.y + box.h / 2 + 2);
    ctx.fillText(label, box.x + box.w / 2, box.y + box.h / 2 + 2);
    ctx.restore();
  },

  drawMobileSplash(ctx, game) {
    this.drawBackground(ctx, game, 0.22);
    this.drawButton(ctx, this.rect(250, 548, 780, 96), 'НАЖМИТЕ НА ЭКРАН', true, 33);
    game.drawSpeaker(ctx);
  },

  drawMobileMainMenu(ctx, game) {
    this.drawBackground(ctx, game, 0.54);
    const rects = this.mainMenuRects();
    const labels = ['НОВАЯ ИГРА', 'ТВАРИ', 'НАСТРОЙКИ'];
    ctx.save(); ctx.font = 'bold 52px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 7;
    ctx.strokeText('STREETS OF RUSSIA', GAME_CONFIG.width / 2, 162); ctx.fillText('STREETS OF RUSSIA', GAME_CONFIG.width / 2, 162); ctx.restore();
    for (let i = 0; i < rects.length; i++) this.drawButton(ctx, rects[i], labels[i], i === 0, 34);
    game.drawSpeaker(ctx);
  },

  drawMobileSettings(ctx, game) {
    this.drawBackground(ctx, game, 0.70);
    ctx.save(); ctx.font = 'bold 42px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 6;
    ctx.strokeText('НАСТРОЙКИ', GAME_CONFIG.width / 2, 90); ctx.fillText('НАСТРОЙКИ', GAME_CONFIG.width / 2, 90); ctx.restore();
    const items = (Menu && Menu.settingsItems) || [];
    for (let i = 0; i < items.length; i++) {
      const r = this.settingsControlRects(i);
      const label = Menu && Menu.getSettingsLabel ? Menu.getSettingsLabel(i) : items[i];
      this.drawButton(ctx, r.row, label, i === Menu.settingsIndex, 23);
      if (items[i].indexOf('ГРОМКОСТЬ') >= 0 || items[i] === 'СЛОЖНОСТЬ') {
        this.drawButton(ctx, r.minus, '−', false, 38);
        this.drawButton(ctx, r.plus, '+', false, 38);
      }
    }
    game.drawSpeaker(ctx);
  },

  drawMobileCharacterSelect(ctx, game) {
    this.drawBackground(ctx, game, 0.68);
    ctx.save(); ctx.font = 'bold 40px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 6;
    ctx.strokeText('ВЫБЕРИТЕ ПЕРСОНАЖА', GAME_CONFIG.width / 2, 72); ctx.fillText('ВЫБЕРИТЕ ПЕРСОНАЖА', GAME_CONFIG.width / 2, 72); ctx.restore();
    const rects = this.characterRects();
    for (let i = 0; i < CharacterSelect.heroes.length; i++) this.drawMobileHeroCard(ctx, game, CharacterSelect.heroes[i], i, rects.heroes[i]);
    this.drawButton(ctx, rects.confirm, 'ПОДТВЕРДИТЬ', true, 32);
    this.drawButton(ctx, rects.back, 'НАЗАД', false, 30);
    if (CharacterSelect.infoOpen) CharacterSelect.drawInfoModal(ctx, game.images);
    game.drawSpeaker(ctx);
  },

  drawMobileHeroCard(ctx, game, heroKey, index, box) {
    const hero = GAME_CONFIG.heroes[heroKey];
    const selected = index === CharacterSelect.selectedIndex;
    ctx.save();
    ctx.fillStyle = selected ? 'rgba(90,0,0,0.68)' : 'rgba(0,0,0,0.52)';
    ctx.strokeStyle = selected ? '#fff' : 'rgba(255,255,255,0.55)';
    ctx.lineWidth = selected ? 5 : 3;
    ctx.fillRect(box.x, box.y, box.w, box.h); ctx.strokeRect(box.x, box.y, box.w, box.h);
    const heroImages = game.images.heroes && game.images.heroes[heroKey];
    const portrait = this.rect(box.x + 32, box.y + 54, box.w - 64, 225);
    if (heroImages && heroImages.idle) {
      const img = heroImages.idle;
      const scale = Math.min(portrait.w / img.width, portrait.h / img.height);
      const w = img.width * scale; const h = img.height * scale;
      ctx.drawImage(img, portrait.x + portrait.w / 2 - w / 2, portrait.y + portrait.h - h, w, h);
    }
    ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = hero.color || '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
    ctx.strokeText(hero.name.toUpperCase(), box.x + box.w / 2, box.y + 322); ctx.fillText(hero.name.toUpperCase(), box.x + box.w / 2, box.y + 322);
    this.drawButton(ctx, this.characterRects().info[index], 'i', false, 26);
    ctx.restore();
  },

  drawMobileIntro(ctx, game) {
    if (game.drawIntro) game.drawIntro(ctx);
    this.drawButton(ctx, this.skipIntroBox(), 'ДАЛЬШЕ', false, 24);
    game.drawSpeaker(ctx);
  },

  drawMobileCampaignMap(ctx, game) {
    if (game.campaignMap && game.campaignMap.draw) game.campaignMap.draw(ctx);
    this.drawButton(ctx, this.rect(430, 620, 420, 70), 'НАЧАТЬ УРОВЕНЬ', true, 28);
    game.drawSpeaker(ctx);
  },

  drawPauseButton(ctx) { this.drawButton(ctx, this.pauseBox(), 'Ⅱ', false, 34); },
  drawPauseOverlay(ctx, game) {
    ctx.fillStyle = 'rgba(0,0,0,0.58)'; ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    this.drawButton(ctx, this.rect(390, 250, 500, 90), 'ПРОДОЛЖИТЬ', true, 34);
    this.drawButton(ctx, this.rect(390, 370, 500, 90), 'В МЕНЮ', false, 34);
  },

  drawDebug(ctx, game) {
    if (!this.debug) return;
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.74)'; ctx.fillRect(12, 620, 540, 86);
    ctx.fillStyle = '#00ff99'; ctx.font = '18px monospace'; ctx.fillText('MOBILE state: ' + game.state, 24, 648);
    if (this.lastTap) ctx.fillText('tap: ' + this.lastTap.x + ', ' + this.lastTap.y + ' from ' + this.lastTap.state, 24, 674);
    ctx.restore();
  }
};
