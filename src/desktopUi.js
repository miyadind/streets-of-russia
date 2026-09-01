(function () {
  function inRect(point, rect) {
    return point && point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  function drawButton(ctx, rect, text, active, fontSize) {
    ctx.save();
    ctx.fillStyle = active ? 'rgba(255,255,255,0.17)' : 'rgba(0,0,0,0.48)';
    ctx.strokeStyle = active ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.62)';
    ctx.lineWidth = active ? 4 : 2;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.font = 'bold ' + (fontSize || 24) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText(text, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
    ctx.fillText(text, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
    ctx.restore();
  }

  if (typeof Menu !== 'undefined') {
    Menu.getSettingsControlRects = function (index) {
      const box = this.getSettingsBox(index);
      return {
        row: box,
        minus: { x: box.x - 74, y: box.y, w: 58, h: box.h },
        plus: { x: box.x + box.w + 16, y: box.y, w: 58, h: box.h }
      };
    };

    Menu.updateSettings = function (game) {
      if (Input.consume('escape')) {
        AudioManager.playSfx('menuSelect', 0.75);
        game.setState('mainMenu');
        return;
      }
      if (Input.consume('arrowup') || Input.consume('w')) {
        this.settingsIndex = (this.settingsIndex + this.settingsItems.length - 1) % this.settingsItems.length;
        AudioManager.playSfx('menuMove', 0.75);
      }
      if (Input.consume('arrowdown') || Input.consume('s')) {
        this.settingsIndex = (this.settingsIndex + 1) % this.settingsItems.length;
        AudioManager.playSfx('menuMove', 0.75);
      }
      if (Input.consume('arrowleft') || Input.consume('a')) this.changeSetting(this.settingsIndex, game, -1);
      if (Input.consume('arrowright') || Input.consume('d')) this.changeSetting(this.settingsIndex, game, 1);

      const click = Input.consumePointer();
      if (click) {
        AudioManager.unlock();
        for (let i = 0; i < this.settingsItems.length; i++) {
          const item = this.settingsItems[i];
          const r = this.getSettingsControlRects(i);
          if (inRect(click, r.minus)) {
            this.settingsIndex = i;
            this.changeSetting(i, game, -1);
            return;
          }
          if (inRect(click, r.plus)) {
            this.settingsIndex = i;
            this.changeSetting(i, game, 1);
            return;
          }
          if (inRect(click, r.row)) {
            this.settingsIndex = i;
            if (item === 'НАЗАД') this.changeSetting(i, game, 1);
            return;
          }
        }
      }

      if (Input.consume('enter') || Input.consume('space')) {
        AudioManager.unlock();
        this.changeSetting(this.settingsIndex, game, 1);
      }
    };

    Menu.drawSettings = function (ctx, images) {
      ctx.drawImage(images.main, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 5;
      ctx.strokeText('НАСТРОЙКИ', GAME_CONFIG.width / 2, 135);
      ctx.fillText('НАСТРОЙКИ', GAME_CONFIG.width / 2, 135);

      for (let i = 0; i < this.settingsItems.length; i++) {
        const box = this.getSettingsBox(i);
        const r = this.getSettingsControlRects(i);
        const active = i === this.settingsIndex;
        const item = this.settingsItems[i];
        const label = this.getSettingsLabel(i);
        drawButton(ctx, box, label, active, 24);
        if (item !== 'НАЗАД') {
          drawButton(ctx, r.minus, '−', false, 32);
          drawButton(ctx, r.plus, '+', false, 32);
        }
      }

      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ddd';
      ctx.fillText('W/S или ↑/↓ — выбрать строку. A/D или ←/→ — изменить. Enter — подтвердить.', GAME_CONFIG.width / 2, 660);
      ctx.textAlign = 'left';
    };
  }

  if (typeof CharacterSelect !== 'undefined') {
    CharacterSelect.getConfirmBox = function () {
      return { x: 720, y: 628, w: 180, h: 46 };
    };

    CharacterSelect.getBackBox = function () {
      return { x: 390, y: 628, w: 180, h: 46 };
    };

    const originalMoveFooterFocus = CharacterSelect.moveFooterFocus;
    CharacterSelect.moveFooterFocus = function (direction) {
      this.footerFocus = this.footerFocus === 'back' ? 'confirm' : 'back';
      AudioManager.playSfx('menuMove', 0.7, { playbackRate: direction < 0 ? 0.95 : 1.05 });
    };

    const originalDraw = CharacterSelect.draw;
    CharacterSelect.draw = function (ctx, images) {
      ctx.fillStyle = '#08080d';
      ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
      ctx.drawImage(images.main, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
      ctx.fillStyle = 'rgba(0,0,0,0.58)';
      ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

      this.drawTitle(ctx, 'ВЫБЕРИТЕ ПЕРСОНАЖА', 104);

      for (let i = 0; i < this.heroes.length; i++) {
        this.drawCard(ctx, images, this.heroes[i], i, i === this.selectedIndex && !this.footerFocus);
      }

      const back = this.getBackBox();
      const confirm = this.getConfirmBox();
      this.drawButton(ctx, back.x, back.y, back.w, back.h, 'НАЗАД', this.footerFocus === 'back');
      this.drawButton(ctx, confirm.x, confirm.y, confirm.w, confirm.h, 'ДАЛЕЕ', this.footerFocus === 'confirm' || !this.footerFocus);

      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.fillText('←/→ или A/D — выбрать   ↑/↓ или W/S — кнопки   Enter — подтвердить   I — информация', GAME_CONFIG.width / 2, 704);
      ctx.textAlign = 'left';

      if (this.infoOpen) this.drawInfoModal(ctx, images);
    };
  }

  if (typeof GameApp !== 'undefined') {
    const previousUpdateIntro = GameApp.prototype.updateIntro;
    GameApp.prototype.updateIntro = function (dt) {
      if (this.intro && this.intro.readyToContinue) {
        const click = Input.consumePointer();
        this.syncIntroAudioVolumes && this.syncIntroAudioVolumes();
        if (click && this.handleSpeakerClick(click)) return;

        const start = { x: GAME_CONFIG.width / 2 - 130, y: GAME_CONFIG.height - 86, w: 260, h: 52 };
        if (click && inRect(click, start)) {
          this.finishIntro();
          return;
        }

        if (Input.consume('arrowup') || Input.consume('w')) this.scrollIntroReader && this.scrollIntroReader(-1);
        if (Input.consume('arrowdown') || Input.consume('s')) this.scrollIntroReader && this.scrollIntroReader(1);
        if (Input.consume('pageup')) this.scrollIntroReader && this.scrollIntroReader(-4);
        if (Input.consume('pagedown')) this.scrollIntroReader && this.scrollIntroReader(4);
        if (Input.consume('enter') || Input.consume('space')) this.finishIntro();
        return;
      }

      previousUpdateIntro.call(this, dt);
    };

    GameApp.prototype.drawIntroReader = function (ctx, lines, maxWidth) {
      if (!this.intro || !this.intro.readyToContinue) {
        if (this.drawIntroStartButton) this.drawIntroStartButton(ctx, 0);
        return;
      }

      const panelX = 150;
      const panelY = 88;
      const panelW = GAME_CONFIG.width - 300;
      const panelH = GAME_CONFIG.height - 190;
      const lineHeight = 32;
      const totalHeight = lines.length * lineHeight;
      const maxScroll = Math.max(0, totalHeight - panelH);

      this.intro.layoutLines = lines;
      if (this.intro.readerScrollToConclusion) {
        this.intro.readerScroll = maxScroll;
        this.intro.readerScrollToConclusion = false;
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.66)';
      ctx.fillRect(panelX - 20, panelY - 20, panelW + 40, panelH + 40);
      ctx.strokeStyle = 'rgba(255,255,255,0.58)';
      ctx.lineWidth = 2;
      ctx.strokeRect(panelX - 20, panelY - 20, panelW + 40, panelH + 40);

      ctx.save();
      ctx.beginPath();
      ctx.rect(panelX, panelY, panelW, panelH);
      ctx.clip();
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#000';
      ctx.fillStyle = '#f4f4f4';

      for (let i = 0; i < lines.length; i++) {
        const y = panelY + i * lineHeight - (this.intro.readerScroll || 0);
        if (y < panelY - lineHeight || y > panelY + panelH) continue;
        ctx.strokeText(lines[i], panelX, y);
        ctx.fillText(lines[i], panelX, y);
      }
      ctx.restore();

      if (maxScroll > 0) {
        const barX = panelX + panelW + 16;
        const barY = panelY;
        const barH = panelH;
        const thumbH = Math.max(40, barH * (panelH / totalHeight));
        const thumbY = barY + (barH - thumbH) * ((this.intro.readerScroll || 0) / maxScroll);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(barX, barY, 6, barH);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fillRect(barX, thumbY, 6, thumbH);
      }

      const btn = { x: GAME_CONFIG.width / 2 - 130, y: GAME_CONFIG.height - 86, w: 260, h: 52 };
      drawButton(ctx, btn, 'НАЧАТЬ', true, 28);

      ctx.font = 'bold 17px Arial';
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.fillText('Колесо мыши / ↑↓ — читать текст', GAME_CONFIG.width - 34, GAME_CONFIG.height - 18);
      ctx.textAlign = 'left';
    };
  }

  if (typeof HUD !== 'undefined') {
    const previousDraw = HUD.draw;
    HUD.draw = function (ctx, scene) {
      previousDraw.call(this, ctx, scene);
    };
  }
})();
