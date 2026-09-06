(function () {
  if (typeof GameApp === 'undefined' || typeof Menu === 'undefined') return;

  const ENEMIES = [
    {
      type: 'dogRegime',
      label: 'dog-regime',
      name: 'Пёс режима',
      description: 'Бывший сотрудник силовых органов, окончательно утративший собственную волю. Годы бездумного подчинения и исполнения преступных распоряжений вытравили из него остатки совести и превратили в послушного цепного пса режима. Он не задаёт вопросов, не различает добро и зло и готов выполнить любой приказ хозяина, каким бы жестоким, незаконным или аморальным тот ни был.'
    },
    {
      type: 'zetnik',
      label: 'zetnik',
      name: 'Zетник',
      description: 'Когда-то обычный гражданин России. Годы телевизионной пропаганды, ненависти и военной истерии полностью уничтожили его способность критически мыслить. Теперь это послушный, зомбированный последователь путинского режима, бездумно повторяющий лозунги пропаганды и готовый выполнять любой приказ системы.'
    },
    { type: 'sucker', label: 'sucker', name: 'Sucker' },
    { type: 'bastard', label: 'bastard', name: 'Bastard' },
    { type: 'horse', label: 'horse', name: 'Horse' },
    { type: '4ort', label: '4ort', name: '4ort' },
    { type: 'gundos', label: 'gundos', name: 'Gundos' }
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

    wrapText(ctx, text, maxWidth) {
      const words = String(text || 'Описание готовится.').split(/\s+/);
      const lines = [];
      let line = '';
      words.forEach((word) => {
        const next = line ? line + ' ' + word : word;
        if (line && ctx.measureText(next).width > maxWidth) {
          lines.push(line);
          line = word;
        } else {
          line = next;
        }
      });
      if (line) lines.push(line);
      return lines;
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
      ctx.strokeText('ТВАРИ', GAME_CONFIG.width / 2, 78);
      ctx.fillText('ТВАРИ', GAME_CONFIG.width / 2, 78);

      ctx.fillStyle = 'rgba(0,0,0,0.58)';
      ctx.fillRect(150, 110, 980, 455);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 3;
      ctx.strokeRect(150, 110, 980, 455);

      const portrait = { x: 185, y: 148, w: 345, h: 372 };
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.fillRect(portrait.x, portrait.y, portrait.w, portrait.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(portrait.x, portrait.y, portrait.w, portrait.h);

      ctx.font = 'bold 38px Arial';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 6;
      ctx.textAlign = 'left';
      ctx.strokeText(entry.name || entry.label, 575, 184);
      ctx.fillText(entry.name || entry.label, 575, 184);

      ctx.font = '24px Arial';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      const descriptionLines = this.wrapText(ctx, entry.description, 500);
      descriptionLines.slice(0, 10).forEach((line, index) => {
        const y = 235 + index * 33;
        ctx.strokeText(line, 575, y);
        ctx.fillText(line, 575, y);
      });

      if (image) {
        const maxW = portrait.w - 28;
        const maxH = portrait.h - 28;
        const scale = Math.min(maxW / image.width, maxH / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        ctx.drawImage(
          image,
          portrait.x + (portrait.w - width) / 2,
          portrait.y + portrait.h - height - 14,
          width,
          height
        );
      }

      ctx.font = '20px Arial';
      ctx.fillStyle = '#d8d8d8';
      ctx.textAlign = 'center';
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
