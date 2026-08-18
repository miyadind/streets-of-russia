(function () {
  if (typeof GameApp === 'undefined' || typeof Menu === 'undefined') return;

  const ENEMIES = [
    { type: 'dogRegime', label: 'dog-regime' },
    { type: 'zetnik', label: 'zetnik' },
    { type: 'sucker', label: 'sucker' },
    { type: 'bastard', label: 'bastard' },
    { type: 'horse', label: 'horse' },
    { type: 'gundos', label: 'gundos' }
  ];

  const BestiaryScreen = {
    index: 0,

    getEntries(game) {
      return ENEMIES.filter((entry) => (
        game && game.images && game.images.enemies && game.images.enemies[entry.type]
      ));
    },

    getRects() {
      return {
        prev: { x: 110, y: 595, w: 190, h: 70 },
        next: { x: 980, y: 595, w: 190, h: 70 },
        back: { x: 420, y: 595, w: 440, h: 70 }
      };
    },

    inRect(point, rect) {
      return point && point.x >= rect.x && point.x <= rect.x + rect.w &&
        point.y >= rect.y && point.y <= rect.y + rect.h;
    },

    move(game, direction) {
      const entries = this.getEntries(game);
      if (!entries.length) return;
      this.index = (this.index + direction + entries.length) % entries.length;
      AudioManager.playSfx('menuMove', 0.7);
    },

    close(game) {
      const target = game.bestiaryReturnState === 'level' && game.scene ? 'level' : 'mainMenu';
      game.paused = false;
      game.setState(target);
      AudioManager.playSfx('menuSelect', 0.65);
    },

    update(game, click) {
      if (Input.consume('escape') || Input.consume('backspace')) {
        this.close(game);
        return;
      }
      if (Input.consume('arrowleft') || Input.consume('a')) this.move(game, -1);
      if (Input.consume('arrowright') || Input.consume('d')) this.move(game, 1);

      if (!click) return;
      const rects = this.getRects();
      if (this.inRect(click, rects.prev)) this.move(game, -1);
      else if (this.inRect(click, rects.next)) this.move(game, 1);
      else if (this.inRect(click, rects.back)) this.close(game);
    },

    drawButton(ctx, rect, label, active) {
      ctx.fillStyle = active ? 'rgba(130,0,0,0.86)' : 'rgba(0,0,0,0.62)';
      ctx.strokeStyle = active ? '#fff' : 'rgba(255,255,255,0.68)';
      ctx.lineWidth = active ? 4 : 3;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 5;
      ctx.strokeText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
      ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
    },

    draw(ctx, game) {
      const bg = game.images && game.images.main;
      if (bg) ctx.drawImage(bg, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
      else {
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.74)';
      ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

      const entries = this.getEntries(game);
      if (!entries.length) return;
      this.index = Math.max(0, Math.min(entries.length - 1, this.index));
      const entry = entries[this.index];
      const enemyImages = game.images.enemies[entry.type];
      const image = enemyImages.idle ||
        (enemyImages.walk && enemyImages.walk[0]) ||
        enemyImages.dead;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 7;
      ctx.font = 'bold 44px Arial';
      ctx.strokeText('BESTIARY', GAME_CONFIG.width / 2, 78);
      ctx.fillText('BESTIARY', GAME_CONFIG.width / 2, 78);

      ctx.fillStyle = 'rgba(0,0,0,0.58)';
      ctx.fillRect(260, 110, 760, 455);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 3;
      ctx.strokeRect(260, 110, 760, 455);

      ctx.font = 'bold 38px Arial';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 6;
      ctx.strokeText(entry.label, GAME_CONFIG.width / 2, 168);
      ctx.fillText(entry.label, GAME_CONFIG.width / 2, 168);

      if (image) {
        const maxW = 430;
        const maxH = 330;
        const scale = Math.min(maxW / image.width, maxH / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        ctx.drawImage(image, GAME_CONFIG.width / 2 - width / 2, 515 - height, width, height);
      }

      ctx.font = '20px Arial';
      ctx.fillStyle = '#d8d8d8';
      ctx.fillText(String(this.index + 1) + ' / ' + String(entries.length), GAME_CONFIG.width / 2, 542);
      ctx.restore();

      const rects = this.getRects();
      this.drawButton(ctx, rects.prev, 'НАЗАД', false);
      this.drawButton(
        ctx,
        rects.back,
        game.bestiaryReturnState === 'level' ? 'ВЕРНУТЬСЯ В ИГРУ' : 'ГЛАВНОЕ МЕНЮ',
        true
      );
      this.drawButton(ctx, rects.next, 'ВПЕРЁД', false);
    }
  };

  window.BestiaryScreen = BestiaryScreen;

  GameApp.prototype.openBestiary = function (returnState) {
    this.bestiaryReturnState = returnState === 'level' && this.scene ? 'level' : 'mainMenu';
    BestiaryScreen.index = 0;
    this.setState('bestiary');
    AudioManager.playSfx('menuSelect', 0.75);
  };

  const previousUpdate = GameApp.prototype.update;
  GameApp.prototype.update = function (dt) {
    if (this.state === 'bestiary') {
      const click = Input.consumePointer();
      if (click && this.handleSpeakerClick(click)) return;
      BestiaryScreen.update(this, click);
      return;
    }
    previousUpdate.call(this, dt);
  };

  const previousDraw = GameApp.prototype.draw;
  GameApp.prototype.draw = function () {
    if (this.state === 'bestiary') {
      this.ctx.clearRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
      BestiaryScreen.draw(this.ctx, this);
      this.drawSpeaker(this.ctx);
      return;
    }
    previousDraw.call(this);
  };

  const previousActivate = Menu.activate;
  Menu.activate = function (game) {
    const items = this.getRuntimeItems ? this.getRuntimeItems(game) : [];
    const item = items[this.selectedIndex];
    if (item && item.key === 'bestiary') {
      game.openBestiary('mainMenu');
      return;
    }
    previousActivate.call(this, game);
  };

  if (typeof MobileApp !== 'undefined') {
    const previousMainMenuTap = MobileApp.handleMainMenuTap;
    MobileApp.handleMainMenuTap = function (game, click) {
      const rects = this.mainMenuRects();
      if (rects[1] && this.inRect(click, rects[1])) {
        game.openBestiary('mainMenu');
        return true;
      }
      return previousMainMenuTap.call(this, game, click);
    };

    MobileApp.handleBestiaryTap = function (game, click) {
      BestiaryScreen.update(game, click);
      return true;
    };

    MobileApp.drawMobileBestiary = function (ctx, game) {
      BestiaryScreen.draw(ctx, game);
      if (game.drawSpeaker) game.drawSpeaker(ctx);
    };
  }
})();
