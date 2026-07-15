(function () {
  if (typeof GAME_CONFIG !== 'undefined') {
    GAME_CONFIG.adminTuningEnabled = /devpanel=1/.test(window.location.search);
  }

  function inRect(point, rect) {
    return point && point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  function drawButton(ctx, rect, text, active, fontSize) {
    ctx.save();
    ctx.fillStyle = active ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.50)';
    ctx.strokeStyle = active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.62)';
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
    const originalMenuUpdate = Menu.update;
    Menu.update = function (game) {
      const pointer = Input.pointer;
      if (!Responsive.isTouchDevice && pointer) {
        for (let i = 0; i < this.items.length; i++) {
          const box = this.getItemBox(i);
          if (inRect(pointer, box)) {
            if (this.selectedIndex !== i) this.selectedIndex = i;
            break;
          }
        }
      }
      originalMenuUpdate.call(this, game);
    };
  }

  if (typeof CharacterSelect !== 'undefined') {
    CharacterSelect.drawTitle = function (ctx, text, y) {
      ctx.font = 'bold 34px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 5;
      ctx.strokeText(text, GAME_CONFIG.width / 2, 104);
      ctx.fillText(text, GAME_CONFIG.width / 2, 104);
      ctx.textAlign = 'left';
    };
  }

  if (typeof CampaignMapScreen !== 'undefined') {
    CampaignMapScreen.update = function (game, dt) {
      const click = Input.consumePointer();
      if (Input.consume('escape')) {
        game.setState('mainMenu');
        return;
      }

      const startButton = this.getDesktopStartButton();
      if (Input.consume('enter') || Input.consume('space') || inRect(click, startButton)) {
        AudioManager.unlock();
        AudioManager.playSfx('menuSelect', 0.85);
        game.setState('characterSelect');
        return;
      }
    };

    CampaignMapScreen.getDesktopPanelRect = function () {
      return { x: 70, y: GAME_CONFIG.height - 128, w: GAME_CONFIG.width - 140, h: 92 };
    };

    CampaignMapScreen.getDesktopStartButton = function () {
      const panel = this.getDesktopPanelRect();
      return { x: panel.x + panel.w - 250, y: panel.y + 24, w: 200, h: 44 };
    };

    CampaignMapScreen.drawPanel = function (ctx, activeId) {
      const panel = this.getDesktopPanelRect();
      const completedCount = this.activeIndex;
      const total = this.order.length;
      const label = this.labels[activeId] || '';
      const start = this.getDesktopStartButton();

      ctx.fillStyle = 'rgba(0, 8, 22, 0.72)';
      ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
      ctx.strokeStyle = 'rgba(60, 220, 255, 0.78)';
      ctx.lineWidth = 2;
      ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);

      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#dff8ff';
      ctx.strokeStyle = '#001019';
      ctx.lineWidth = 4;
      ctx.font = 'bold 22px Arial';
      ctx.strokeText('КАРТА СОПРОТИВЛЕНИЯ', panel.x + 26, panel.y + 31);
      ctx.fillText('КАРТА СОПРОТИВЛЕНИЯ', panel.x + 26, panel.y + 31);

      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = '#fff';
      ctx.strokeText(label, panel.x + 26, panel.y + 64);
      ctx.fillText(label, panel.x + 26, panel.y + 64);

      const barW = 230;
      const barH = 16;
      const barX = start.x - barW - 42;
      const barY = panel.y + 34;
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#c8f7ff';
      ctx.fillRect(barX, barY, barW * (completedCount / Math.max(1, total)), barH);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.strokeRect(barX, barY, barW, barH);

      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('ПРОГРЕСС ' + completedCount + ' / ' + total, barX + barW / 2, barY + 42);

      drawButton(ctx, start, 'НАЧАТЬ', true, 21);
      ctx.textAlign = 'left';
    };
  }

  if (typeof HUD !== 'undefined') {
    HUD.getLevelProgress = function (scene) {
      const total = scene.images && scene.images.streets ? scene.images.streets.length : 1;
      const local = scene.encounterCleared ? 1 : 0.35;
      return Math.max(0, Math.min(1, (scene.screenIndex + local) / Math.max(1, total)));
    };

    HUD.draw = function (ctx, scene) {
      ctx.fillStyle = 'rgba(0,0,0,0.62)';
      ctx.fillRect(0, 0, GAME_CONFIG.width, 86);

      const menuBox = { x: 14, y: 16, w: 88, h: 52 };
      drawButton(ctx, menuBox, 'MENU', false, 18);

      const order = ['alexey', 'anna', 'boris'];
      for (let i = 0; i < order.length; i++) {
        const key = order[i];
        const hero = GAME_CONFIG.heroes[key];
        const x = 122 + i * 190;
        const active = scene.player.heroKey === key;

        ctx.fillStyle = active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)';
        ctx.fillRect(x, 12, 170, 60);

        ctx.fillStyle = hero.color;
        ctx.fillRect(x + 8, 18, 38, 38);
        ctx.fillStyle = '#111';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(hero.name[0], x + 27, 43);
        ctx.textAlign = 'left';

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px Arial';
        ctx.fillText(hero.name, x + 54, 28);

        const hp = active ? scene.player.hp : hero.hp;
        const pct = Math.max(0, hp / hero.hp);
        ctx.fillStyle = '#222';
        ctx.fillRect(x + 54, 38, 98, 12);
        ctx.fillStyle = pct > 0.55 ? 'lime' : pct > 0.25 ? 'yellow' : 'red';
        ctx.fillRect(x + 54, 38, 98 * pct, 12);
        ctx.strokeStyle = '#777';
        ctx.strokeRect(x + 54, 38, 98, 12);
      }

      if (this.drawSupportButtons) {
        this.drawSupportButtons(ctx, scene, 745, 22);
      }
    };
  }

  if (typeof GameApp !== 'undefined') {
    GameApp.prototype.getSpeakerRect = function () {
      return { x: GAME_CONFIG.width - 70, y: 16, w: 48, h: 48 };
    };

    GameApp.prototype.getSpeakerHitRect = function () {
      return { x: GAME_CONFIG.width - 96, y: 0, w: 96, h: 92 };
    };

    GameApp.prototype.handleSpeakerClick = function (point) {
      if (this.state === 'splash' || this.state === 'loading') return false;
      const r = this.getSpeakerHitRect ? this.getSpeakerHitRect() : this.getSpeakerRect();
      if (!inRect(point, r)) return false;
      AudioManager.unlock();
      if (AudioManager.toggleSound) AudioManager.toggleSound();
      else AudioManager.toggleMusic();
      if (this.state === 'intro' && this.syncIntroVoiceVolume) this.syncIntroVoiceVolume();
      AudioManager.playSfx('menuSelect', 0.7);
      return true;
    };

    GameApp.prototype.drawSpeaker = function (ctx) {
      if (this.state === 'splash' || this.state === 'loading') return;
      const r = this.getSpeakerRect();
      const on = AudioManager.isSoundOn ? AudioManager.isSoundOn() : GAME_CONFIG.settings.musicEnabled !== false;

      ctx.save();
      ctx.fillStyle = 'rgba(8, 8, 10, 0.68)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = on ? 'rgba(255,255,255,0.88)' : 'rgba(255,65,65,0.96)';
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x, r.y, r.w, r.h);

      ctx.fillStyle = on ? '#ffffff' : '#bdbdbd';
      ctx.beginPath();
      ctx.moveTo(r.x + 10, r.y + 22);
      ctx.lineTo(r.x + 19, r.y + 22);
      ctx.lineTo(r.x + 31, r.y + 12);
      ctx.lineTo(r.x + 31, r.y + 36);
      ctx.lineTo(r.x + 19, r.y + 26);
      ctx.lineTo(r.x + 10, r.y + 26);
      ctx.closePath();
      ctx.fill();

      if (on) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(r.x + 31, r.y + 24, 7, -0.75, 0.75); ctx.stroke();
        ctx.beginPath(); ctx.arc(r.x + 31, r.y + 24, 13, -0.65, 0.65); ctx.stroke();
      } else {
        ctx.strokeStyle = '#ff5555';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(r.x + 11, r.y + 11);
        ctx.lineTo(r.x + 37, r.y + 37);
        ctx.moveTo(r.x + 37, r.y + 11);
        ctx.lineTo(r.x + 11, r.y + 37);
        ctx.stroke();
      }
      ctx.restore();
    };
  }
})();
