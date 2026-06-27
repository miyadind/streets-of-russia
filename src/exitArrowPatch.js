(function () {
  if (typeof LevelScene === 'undefined') return;

  const HERO_ORDER = ['alexey', 'anna', 'boris'];

  function arrowPolygon(x, y, w, h) {
    const head = w * 0.24;
    return [
      [x, y], [x + w - head, y], [x + w - head, y - h * 0.18],
      [x + w, y + h / 2], [x + w - head, y + h + h * 0.18],
      [x + w - head, y + h], [x, y + h]
    ];
  }

  function drawPolygon(ctx, points) {
    ctx.beginPath();
    points.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py));
    ctx.closePath();
  }

  function pointInPolygon(px, py, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i][0];
      const yi = points[i][1];
      const xj = points[j][0];
      const yj = points[j][1];
      const intersect = ((yi > py) !== (yj > py)) &&
        (px < (xj - xi) * (py - yi) / ((yj - yi) || 0.0001) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function drawLedDot(ctx, x, y, r, color, glow, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawExitLedArrow(ctx, x, y, phase) {
    const w = 90;
    const h = 32;
    const poly = arrowPolygon(x, y, w, h);
    const pulse = 0.5 + 0.5 * Math.sin(phase);

    ctx.save();
    ctx.shadowColor = 'rgba(80, 160, 255, 0.95)';
    ctx.shadowBlur = 8 + pulse * 6;
    ctx.fillStyle = 'rgba(30, 90, 190, 0.20)';
    drawPolygon(ctx, poly);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(11, 13, 18, 0.92)';
    ctx.strokeStyle = 'rgba(215, 225, 240, 0.92)';
    ctx.lineWidth = 1.5;
    drawPolygon(ctx, poly);
    ctx.fill();
    ctx.stroke();

    const innerPad = 4;
    const innerPoly = arrowPolygon(x + innerPad, y + innerPad, w - innerPad * 2, h - innerPad * 2);
    ctx.fillStyle = 'rgba(2, 5, 9, 0.78)';
    ctx.strokeStyle = 'rgba(70, 82, 96, 0.92)';
    ctx.lineWidth = 1;
    drawPolygon(ctx, innerPoly);
    ctx.fill();
    ctx.stroke();

    const rows = 6;
    const cols = 18;
    const dotR = 1.75;
    const startX = x + innerPad + 6;
    const endX = x + w - innerPad - 7;
    const startY = y + innerPad + 4;
    const rowGap = (h - innerPad * 2 - 8) / Math.max(1, rows - 1);
    const colGap = (endX - startX) / Math.max(1, cols - 1);

    for (let row = 0; row < rows; row++) {
      let color = '#f7f8ff';
      let glow = 'rgba(245, 248, 255, 0.95)';
      if (row >= 2 && row <= 3) {
        color = '#0b74ff';
        glow = 'rgba(20, 145, 255, 1)';
      }
      for (let col = 0; col < cols; col++) {
        const cx = startX + col * colGap;
        const cy = startY + row * rowGap;
        if (!pointInPolygon(cx, cy, innerPoly)) continue;
        const wave = 0.76 + 0.24 * Math.sin(phase + col * 0.38 + row * 0.8);
        drawLedDot(ctx, cx, cy, dotR, color, glow, wave);
      }
    }

    ctx.shadowColor = 'rgba(70, 160, 255, 0.95)';
    ctx.shadowBlur = 4 + pulse * 4;
    ctx.strokeStyle = 'rgba(150, 210, 255, 0.92)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x + w - 18, y - 3);
    ctx.lineTo(x + w, y + h / 2);
    ctx.lineTo(x + w - 18, y + h + 3);
    ctx.stroke();
    ctx.restore();
  }

  function clampValue(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function drawLines(ctx, lines, x, y, lineHeight) {
    lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  }

  LevelScene.prototype.nextScreen = function () {
    const order = GAME_CONFIG.levelOrder || [];
    const currentKey = order[this.screenIndex];
    const nextKey = order[this.screenIndex + 1];
    const currentLevel = currentKey && GAME_CONFIG.levels && GAME_CONFIG.levels[currentKey];
    const nextLevel = nextKey && GAME_CONFIG.levels && GAME_CONFIG.levels[nextKey];
    const currentRegion = currentLevel && (currentLevel.region || currentLevel.regionKey || currentLevel.area || currentLevel.chapter);
    const nextRegion = nextLevel && (nextLevel.region || nextLevel.regionKey || nextLevel.area || nextLevel.chapter);

    if (this.screenIndex < this.images.streets.length - 1 && currentRegion && nextRegion && currentRegion === nextRegion) {
      if (this.game && this.game.addPeopleSupport) this.game.addPeopleSupport(12);
      this.screenIndex += 1;
      this.player.x = 82;
      this.player.y = 620;
      this.player.facing = 1;
      this.player.releaseFromPin();
      const level = this.getLevelConfig();
      AudioManager.playMusic((level && level.music) || (GAME_CONFIG.audio && GAME_CONFIG.audio.music && GAME_CONFIG.audio.music.level) || 'levelTheme');
      this.spawnInitialWave();
    } else {
      if (this.game && this.game.completeCampaignRegion) this.game.completeCampaignRegion();
      else this.game.setState('mainMenu');
    }
  };

  LevelScene.prototype.draw = function (ctx) {
    const bg = this.images.streets[this.screenIndex] || this.images.streets[0];
    if (bg) ctx.drawImage(bg, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    else {
      ctx.fillStyle = '#222';
      ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    ctx.fillRect(0, GAME_CONFIG.laneTop, GAME_CONFIG.width, GAME_CONFIG.laneBottom - GAME_CONFIG.laneTop);

    const entities = [{ type: 'player', y: this.player.y, ref: this.player }];
    for (const enemy of this.enemies) entities.push({ type: 'enemy', y: enemy.y, ref: enemy });
    entities.sort((a, b) => a.y - b.y);
    for (const entity of entities) entity.ref.draw(ctx, this.debug);

    if (this.encounterCleared) {
      const phase = performance.now() / 260;
      drawExitLedArrow(ctx, GAME_CONFIG.width - 128, 388, phase);
    }

    HUD.draw(ctx, this);

    if (this.debug) {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, GAME_CONFIG.laneTop, GAME_CONFIG.width, GAME_CONFIG.laneBottom - GAME_CONFIG.laneTop);
    }
  };

  if (typeof CharacterSelect !== 'undefined') {
    const originalDrawCard = CharacterSelect.drawCard;
    const originalDrawInfoIcon = CharacterSelect.drawInfoIcon;

    CharacterSelect.getGame = function () {
      return this.gameRef || null;
    };

    CharacterSelect.isHeroDisabled = function (game, heroKey) {
      return !!(game && game.defeatedHeroes && game.defeatedHeroes[heroKey]);
    };

    CharacterSelect.findFirstAvailableIndex = function (game) {
      for (let i = 0; i < this.heroes.length; i++) {
        if (!this.isHeroDisabled(game, this.heroes[i])) return i;
      }
      return 0;
    };

    CharacterSelect.moveSelection = function (direction, game) {
      const activeGame = game || this.getGame();
      for (let step = 0; step < this.heroes.length; step++) {
        this.selectedIndex = (this.selectedIndex + direction + this.heroes.length) % this.heroes.length;
        if (!this.isHeroDisabled(activeGame, this.heroes[this.selectedIndex])) break;
      }
      AudioManager.playSfx('menuMove', 0.85, { playbackRate: direction < 0 ? 0.95 : 1.05 });
    };

    CharacterSelect.setSelection = function (index, game) {
      const activeGame = game || this.getGame();
      if (this.isHeroDisabled(activeGame, this.heroes[index])) {
        AudioManager.playSfx('menuBack', 0.55);
        return false;
      }
      if (index === this.selectedIndex) return true;
      this.selectedIndex = index;
      AudioManager.playSfx('menuMove', 0.85);
      return true;
    };

    CharacterSelect.confirm = function (game) {
      const heroKey = this.heroes[this.selectedIndex];
      if (this.isHeroDisabled(game, heroKey)) {
        AudioManager.playSfx('menuBack', 0.65);
        return;
      }
      game.selectedHero = heroKey;
      AudioManager.playSfx('menuSelect', 0.85);
      if ((game.characterSelectMode === 'casualty' || game.characterSelectMode === 'switchHero') && game.resumeAfterHeroDefeat) {
        game.resumeAfterHeroDefeat(heroKey);
      } else if (game.characterSelectMode === 'retryRegion' && game.startRetryRegion) {
        game.startRetryRegion(heroKey);
      } else {
        if (game.resetTeamRun) game.resetTeamRun();
        game.startLevel();
      }
    };

    CharacterSelect.update = function (game) {
      this.gameRef = game;
      if (this.isHeroDisabled(game, this.heroes[this.selectedIndex])) {
        this.selectedIndex = this.findFirstAvailableIndex(game);
      }

      if (this.infoOpen) {
        if (Input.consume('escape') || Input.consume('i') || Input.consume('backspace') || Input.consume('enter') || Input.consume('space')) {
          this.closeInfo();
          return;
        }
        const infoClick = Input.consumePointer();
        if (infoClick) this.closeInfo();
        return;
      }

      if (Input.consume('arrowdown') || Input.consume('s')) {
        this.footerFocus = 'confirm';
        AudioManager.playSfx('menuMove', 0.65);
      }
      if (Input.consume('arrowup') || Input.consume('w')) {
        if (this.footerFocus) AudioManager.playSfx('menuMove', 0.65);
        this.footerFocus = null;
      }
      if (Input.consume('arrowleft') || Input.consume('a')) {
        if (this.footerFocus) this.moveFooterFocus(-1);
        else this.moveSelection(-1, game);
      }
      if (Input.consume('arrowright') || Input.consume('d')) {
        if (this.footerFocus) this.moveFooterFocus(1);
        else this.moveSelection(1, game);
      }

      if (Input.consume('i')) this.openInfo();
      if (Input.consume('escape')) {
        AudioManager.playSfx('menuSelect', 0.65);
        const mode = game.characterSelectMode;
        game.characterSelectMode = null;
        game.setState((mode === 'casualty' || mode === 'switchHero') && game.scene ? 'level' : 'mainMenu');
        return;
      }

      const click = Input.consumePointer();
      if (click) {
        for (let i = 0; i < this.heroes.length; i++) {
          const info = this.getInfoButtonBox(i);
          if (this.isPointInCircle(click, info)) {
            this.selectedIndex = i;
            this.footerFocus = null;
            this.openInfo();
            return;
          }
          const box = this.getCardBox(i);
          if (this.isPointInBox(click, box)) {
            this.setSelection(i, game);
            this.footerFocus = null;
          }
        }

        if (this.isPointInBox(click, this.getBackBox())) {
          AudioManager.playSfx('menuSelect', 0.65);
          const mode = game.characterSelectMode;
          game.characterSelectMode = null;
          game.setState((mode === 'casualty' || mode === 'switchHero') && game.scene ? 'level' : 'mainMenu');
          return;
        }
        if (this.isPointInBox(click, this.getConfirmBox())) {
          this.confirm(game);
          return;
        }
      }

      if (Input.consume('enter') || Input.consume('space')) {
        if (this.footerFocus === 'back') {
          AudioManager.playSfx('menuSelect', 0.65);
          const mode = game.characterSelectMode;
          game.characterSelectMode = null;
          game.setState((mode === 'casualty' || mode === 'switchHero') && game.scene ? 'level' : 'mainMenu');
        } else {
          this.confirm(game);
        }
      }
    };

    CharacterSelect.draw = function (ctx, images) {
      ctx.fillStyle = '#08080d';
      ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
      ctx.drawImage(images.main, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
      ctx.fillStyle = 'rgba(0,0,0,0.58)';
      ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

      const mode = this.gameRef && this.gameRef.characterSelectMode;
      const title = mode === 'casualty'
        ? 'ВЫБЕРИТЕ, КТО ПРОДОЛЖИТ БОРЬБУ'
        : (mode === 'retryRegion' ? 'ВЫБЕРИТЕ ГЕРОЯ ДЛЯ НОВОЙ ПОПЫТКИ' : (mode === 'switchHero' ? 'СМЕНИТЬ ПЕРСОНАЖА' : 'ВЫБЕРИТЕ ПЕРСОНАЖА'));
      this.drawTitle(ctx, title, 104);

      for (let i = 0; i < this.heroes.length; i++) {
        const disabled = this.isHeroDisabled(this.gameRef, this.heroes[i]);
        this.drawCard(ctx, images, this.heroes[i], i, i === this.selectedIndex && !disabled);
      }

      const back = this.getBackBox();
      const confirm = this.getConfirmBox();
      this.drawButton(ctx, back.x, back.y, back.w, back.h, 'НАЗАД', this.footerFocus === 'back');
      this.drawButton(ctx, confirm.x, confirm.y, confirm.w, confirm.h, mode === 'casualty' ? 'ПРОДОЛЖИТЬ' : (mode === 'switchHero' ? 'СМЕНИТЬ' : 'ДАЛЕЕ'), this.footerFocus === 'confirm' || !this.footerFocus);

      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.fillText('←/→ или A/D — выбрать   ↑/↓ или W/S — кнопки   Enter — подтвердить   I — информация', GAME_CONFIG.width / 2, 704);
      ctx.textAlign = 'left';

      if (this.infoOpen) this.drawInfoModal(ctx, images);
    };

    CharacterSelect.drawCard = function (ctx, images, heroKey, index, selected) {
      originalDrawCard.call(this, ctx, images, heroKey, index, selected);
      if (!this.isHeroDisabled(this.gameRef, heroKey)) return;
      const box = this.getCardBox(index);
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.64)';
      ctx.fillRect(box.x, box.y, box.w, box.h);
      ctx.strokeStyle = 'rgba(150,150,150,0.75)';
      ctx.lineWidth = 4;
      ctx.strokeRect(box.x, box.y, box.w, box.h);
      ctx.fillStyle = 'rgba(220,220,220,0.88)';
      ctx.font = 'bold 38px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ВЫБЫЛ', box.x + box.w / 2, box.y + box.h / 2);
      ctx.font = '18px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.62)';
      ctx.fillText('нельзя выбрать', box.x + box.w / 2, box.y + box.h / 2 + 44);
      ctx.restore();
    };

    CharacterSelect.drawInfoIcon = function (ctx, index, selected, color) {
      originalDrawInfoIcon.call(this, ctx, index, selected, color);
    };
  }

  if (typeof HUD !== 'undefined') {
    HUD.draw = function (ctx, scene) {
      const game = scene.game;
      if (game && game.ensureRunState) game.ensureRunState();

      ctx.fillStyle = 'rgba(0,0,0,0.66)';
      ctx.fillRect(0, 0, GAME_CONFIG.width, 92);

      for (let i = 0; i < HERO_ORDER.length; i++) {
        const key = HERO_ORDER[i];
        const hero = GAME_CONFIG.heroes[key];
        const x = 122 + i * 205;
        const active = scene.player.heroKey === key;
        const defeated = !!(game && game.defeatedHeroes && game.defeatedHeroes[key]);

        ctx.fillStyle = active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)';
        ctx.fillRect(x, 12, 180, 60);

        ctx.fillStyle = defeated ? '#555' : hero.color;
        ctx.fillRect(x + 8, 18, 42, 42);
        ctx.fillStyle = '#111';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(hero.name[0], x + 29, 44);
        ctx.textAlign = 'left';

        ctx.fillStyle = defeated ? 'rgba(255,255,255,0.42)' : '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(hero.name, x + 58, 28);

        const hp = defeated ? 0 : (active ? scene.player.hp : hero.hp);
        const pct = Math.max(0, hp / hero.hp);
        ctx.fillStyle = '#222';
        ctx.fillRect(x + 58, 38, 108, 12);
        ctx.fillStyle = defeated ? '#666' : (pct > 0.55 ? 'lime' : pct > 0.25 ? 'yellow' : 'red');
        ctx.fillRect(x + 58, 38, 108 * pct, 12);
        ctx.strokeStyle = defeated ? '#555' : '#777';
        ctx.strokeRect(x + 58, 38, 108, 12);

        if (defeated) {
          ctx.font = 'bold 11px Arial';
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.fillText('ВЫБЫЛ', x + 58, 64);
        }
      }

      const barX = 875;
      const barW = 330;
      ctx.textAlign = 'left';
      ctx.font = 'bold 12px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.fillText('ПРОГРЕСС ПРОХОЖДЕНИЯ', barX, 20);
      ctx.fillStyle = '#222';
      ctx.fillRect(barX, 26, barW, 14);
      const progress = ((scene.screenIndex + (scene.encounterCleared ? 1 : 0.35)) / scene.images.streets.length);
      ctx.fillStyle = 'cyan';
      ctx.fillRect(barX, 26, barW * Math.min(1, progress), 14);
      ctx.strokeStyle = '#ddd';
      ctx.strokeRect(barX, 26, barW, 14);

      const support = game && game.peopleSupport != null ? game.peopleSupport : 25;
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.fillText('ПОДДЕРЖКА НАРОДА', barX, 58);
      ctx.fillStyle = '#222';
      ctx.fillRect(barX, 64, barW, 14);
      ctx.fillStyle = '#f2c46d';
      ctx.fillRect(barX, 64, barW * clampValue(support / 100, 0, 1), 14);
      ctx.strokeStyle = '#ddd';
      ctx.strokeRect(barX, 64, barW, 14);
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(support) + '%', barX + barW, 58);
      ctx.textAlign = 'left';
    };
  }

  if (typeof GameApp !== 'undefined') {
    const buttons = [
      { key: 'retry', label: 'ПОПРОБОВАТЬ СНОВА' },
      { key: 'support', label: 'ПОДДЕРЖАТЬ ТЕХ, КТО БОРЕТСЯ' },
      { key: 'menu', label: 'ГЛАВНОЕ МЕНЮ' }
    ];

    const heroDefeatQuotes = {
      alexey: {
        author: '— Алексей Навальный',
        lines: ['«Моё послание на случай, если меня убьют,', 'очень простое: не сдавайтесь.', 'Не надо, нельзя сдаваться».']
      },
      boris: {
        author: '— Борис Немцов',
        lines: ['«Если бы я боялся Путина по-настоящему,', 'я бы не занимался этим делом».']
      },
      anna: {
        author: '— Анна Политковская',
        lines: ['«Мы позволили им увидеть наш страх.', 'И этим только сделали их сильнее.', 'КГБ уважает только сильных.', 'Слабых оно пожирает».']
      }
    };

    GameApp.prototype.ensureRunState = function () {
      if (!this.defeatedHeroes) this.defeatedHeroes = { alexey: false, anna: false, boris: false };
      if (this.peopleSupport == null) this.peopleSupport = 25;
    };

    GameApp.prototype.resetTeamRun = function () {
      this.defeatedHeroes = { alexey: false, anna: false, boris: false };
      this.peopleSupport = 25;
      this.characterSelectMode = null;
      this.casualtyRespawn = null;
      this.gameOverRegionStartIndex = 0;
    };

    GameApp.prototype.addPeopleSupport = function (amount) {
      this.ensureRunState();
      this.peopleSupport = clampValue(this.peopleSupport + amount, 0, 100);
    };

    GameApp.prototype.getAliveHeroes = function () {
      this.ensureRunState();
      return HERO_ORDER.filter(key => !this.defeatedHeroes[key]);
    };

    GameApp.prototype.getHeroDefeatQuote = function () {
      return heroDefeatQuotes[this.gameOverHero] || heroDefeatQuotes.alexey;
    };

    GameApp.prototype.getCurrentRegionStartIndex = function (scene) {
      if (window.CampaignRuntime && scene) return window.CampaignRuntime.getRegionStartIndexByScreen(scene.screenIndex);
      const levelOrder = Array.isArray(GAME_CONFIG.levelOrder) ? GAME_CONFIG.levelOrder : [];
      if (!scene || !levelOrder.length) return 0;
      const currentIndex = clampValue(Number(scene.screenIndex) || 0, 0, levelOrder.length - 1);
      const currentKey = levelOrder[currentIndex];
      const currentLevel = (GAME_CONFIG.levels && GAME_CONFIG.levels[currentKey]) || {};
      const regionKey = currentLevel.region || currentLevel.regionKey || currentLevel.area || currentLevel.chapter;
      if (!regionKey) return Number.isFinite(scene.regionStartIndex) ? clampValue(scene.regionStartIndex, 0, levelOrder.length - 1) : 0;
      let startIndex = currentIndex;
      for (let i = currentIndex - 1; i >= 0; i -= 1) {
        const key = levelOrder[i];
        const level = (GAME_CONFIG.levels && GAME_CONFIG.levels[key]) || {};
        const levelRegion = level.region || level.regionKey || level.area || level.chapter;
        if (levelRegion !== regionKey) break;
        startIndex = i;
      }
      return startIndex;
    };

    GameApp.prototype.sendHeroToTeamSelect = function (scene, fallenHero) {
      this.ensureRunState();
      this.defeatedHeroes[fallenHero] = true;
      this.addPeopleSupport(-10);
      this.gameOverRegionStartIndex = this.getCurrentRegionStartIndex(scene);
      this.casualtyRespawn = {
        screenIndex: scene.screenIndex,
        x: clampValue(scene.player.x, 90, GAME_CONFIG.width - 140),
        y: clampValue(scene.player.y, GAME_CONFIG.laneTop + 20, GAME_CONFIG.laneBottom - 10),
        facing: scene.player.facing || 1
      };
      this.characterSelectMode = 'casualty';
      const alive = this.getAliveHeroes();
      if (alive.length <= 0) return false;
      CharacterSelect.infoOpen = false;
      CharacterSelect.footerFocus = null;
      CharacterSelect.selectedIndex = CharacterSelect.heroes.indexOf(alive[0]);
      this.setState('characterSelect');
      AudioManager.playSfx('playerDown', 0.8);
      return true;
    };

    GameApp.prototype.openGameOver = function (scene) {
      if (this.state === 'gameOver') return;
      this.gameOverSelection = 0;
      this.gameOverRegionStartIndex = this.getCurrentRegionStartIndex(scene);
      this.gameOverHero = HERO_ORDER[Math.floor(Math.random() * HERO_ORDER.length)];
      this.characterSelectMode = null;
      this.setState('gameOver');
      AudioManager.playSfx('playerDown', 0.8);
    };

    GameApp.prototype.handleHeroDefeat = function (scene) {
      if (!scene || !scene.player || this.state === 'gameOver') return;
      const fallenHero = scene.player.heroKey || this.selectedHero || 'boris';
      this.ensureRunState();
      if (this.defeatedHeroes[fallenHero]) return;
      const willHaveAlive = HERO_ORDER.some(key => key !== fallenHero && !this.defeatedHeroes[key]);
      if (willHaveAlive) {
        this.sendHeroToTeamSelect(scene, fallenHero);
      } else {
        this.defeatedHeroes[fallenHero] = true;
        this.addPeopleSupport(-15);
        this.openGameOver(scene);
      }
    };

    GameApp.prototype.resumeAfterHeroDefeat = function (heroKey) {
      this.ensureRunState();
      if (this.defeatedHeroes[heroKey]) return;
      this.selectedHero = heroKey;
      if (!this.scene) this.scene = new LevelScene(this, this.images);
      const respawn = this.casualtyRespawn || {
        screenIndex: this.scene.screenIndex,
        x: 190,
        y: 620,
        facing: 1
      };
      this.scene.screenIndex = respawn.screenIndex;
      const replacement = new Player(heroKey, this.images);
      replacement.x = respawn.x;
      replacement.y = respawn.y;
      replacement.facing = respawn.facing;
      if (replacement.releaseFromPin) replacement.releaseFromPin();
      this.scene.player = replacement;
      this.casualtyRespawn = null;
      this.characterSelectMode = null;
      this.paused = false;
      this.setState('level');
      const level = this.scene.getLevelConfig ? this.scene.getLevelConfig() : null;
      AudioManager.playMusic((level && level.music) || (GAME_CONFIG.audio && GAME_CONFIG.audio.music && GAME_CONFIG.audio.music.level) || 'levelTheme', true);
    };

    GameApp.prototype.startRetryRegion = function (heroKey) {
      this.ensureRunState();
      this.selectedHero = heroKey;
      this.scene = new LevelScene(this, this.images);
      const levelOrder = Array.isArray(GAME_CONFIG.levelOrder) ? GAME_CONFIG.levelOrder : [];
      const maxIndex = Math.max(0, levelOrder.length - 1);
      const targetIndex = clampValue(Number(this.gameOverRegionStartIndex) || 0, 0, maxIndex);
      this.scene.player = new Player(heroKey, this.images);
      if (window.CampaignRuntime) window.CampaignRuntime.setSceneScreen(this.scene, targetIndex, { spawn: false });
      else {
        this.scene.screenIndex = targetIndex;
        const startLevel = this.scene.getLevelConfig ? this.scene.getLevelConfig() : null;
        const start = (startLevel && startLevel.playerStart) || { x: 190, y: 620 };
        this.scene.player.x = start.x;
        this.scene.player.y = start.y;
        if (this.scene.player.releaseFromPin) this.scene.player.releaseFromPin();
      }
      const level = this.scene.getLevelConfig ? this.scene.getLevelConfig() : null;
      if (this.scene.spawnInitialWave) this.scene.spawnInitialWave();
      this.characterSelectMode = null;
      this.paused = false;
      this.setState('level');
      AudioManager.playMusic((level && level.music) || (GAME_CONFIG.audio && GAME_CONFIG.audio.music && GAME_CONFIG.audio.music.level) || 'levelTheme', true);
    };

    GameApp.prototype.getGameOverButtonRects = function () {
      const width = 470;
      const height = 54;
      const gap = 16;
      const startY = 500;
      const x = GAME_CONFIG.width / 2 - width / 2;
      return buttons.map((button, index) => ({ ...button, x, y: startY + index * (height + gap), w: width, h: height }));
    };

    GameApp.prototype.restartFromCurrentRegion = function () {
      const savedRegionStart = this.gameOverRegionStartIndex || 0;
      this.resetTeamRun();
      this.gameOverRegionStartIndex = savedRegionStart;
      this.characterSelectMode = 'retryRegion';
      this.scene = null;
      CharacterSelect.infoOpen = false;
      CharacterSelect.footerFocus = null;
      CharacterSelect.selectedIndex = CharacterSelect.heroes.indexOf(this.selectedHero || 'boris');
      if (CharacterSelect.selectedIndex < 0) CharacterSelect.selectedIndex = 0;
      this.setState('characterSelect');
      this.ensureMenuMusic();
    };

    GameApp.prototype.activateGameOverButton = function (key) {
      AudioManager.unlock();
      AudioManager.playSfx('menuSelect', 0.85);
      if (key === 'retry') return this.restartFromCurrentRegion();
      if (key === 'support') return window.open('support.html', '_blank', 'noopener,noreferrer');
      if (key === 'menu') {
        this.scene = null;
        this.characterSelectMode = null;
        this.setState('mainMenu');
        this.ensureMenuMusic();
      }
    };

    GameApp.prototype.updateGameOver = function (click) {
      const rects = this.getGameOverButtonRects();
      if (Input.consume('arrowup') || Input.consume('w')) {
        this.gameOverSelection = (this.gameOverSelection + rects.length - 1) % rects.length;
        AudioManager.playSfx('menuMove', 0.7);
      }
      if (Input.consume('arrowdown') || Input.consume('s')) {
        this.gameOverSelection = (this.gameOverSelection + 1) % rects.length;
        AudioManager.playSfx('menuMove', 0.7);
      }
      if (Input.consume('enter') || Input.consume('space')) return this.activateGameOverButton(rects[this.gameOverSelection].key);
      if (!click) return;
      const clickedIndex = rects.findIndex((button) => click.x >= button.x && click.x <= button.x + button.w && click.y >= button.y && click.y <= button.y + button.h);
      if (clickedIndex >= 0) {
        this.gameOverSelection = clickedIndex;
        this.activateGameOverButton(rects[clickedIndex].key);
      }
    };

    GameApp.prototype.drawGameOver = function (ctx) {
      const w = GAME_CONFIG.width;
      const h = GAME_CONFIG.height;
      const bg = this.scene && this.scene.images && this.scene.images.streets ? this.scene.images.streets[this.scene.screenIndex] || this.scene.images.streets[0] : null;
      if (bg) ctx.drawImage(bg, 0, 0, w, h);
      else {
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, w, h);
      }

      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, 'rgba(0,0,0,0.86)');
      gradient.addColorStop(0.45, 'rgba(18,0,0,0.82)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.92)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(190, 72, 900, 420);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 2;
      ctx.strokeRect(190, 72, 900, 420);

      ctx.fillStyle = '#f4d8a8';
      ctx.font = 'bold 42px Arial';
      drawLines(ctx, ['ОНИ ПОБЕЖДАЮТ ТОЛЬКО ТОГДА,', 'КОГДА ТЫ СДАЁШЬСЯ…'], w / 2, 145, 52);

      const quote = this.getHeroDefeatQuote();
      const lineHeight = quote.lines.length >= 4 ? 34 : 38;
      const quoteY = quote.lines.length >= 4 ? 286 : 304;
      ctx.fillStyle = '#ffffff';
      ctx.font = quote.lines.length >= 4 ? '26px Arial' : '28px Arial';
      drawLines(ctx, quote.lines, w / 2, quoteY, lineHeight);
      ctx.fillStyle = 'rgba(255,255,255,0.84)';
      ctx.font = '24px Arial';
      ctx.fillText(quote.author, w / 2, quoteY + quote.lines.length * lineHeight + 26);

      this.getGameOverButtonRects().forEach((button, index) => {
        const selected = index === this.gameOverSelection;
        ctx.fillStyle = selected ? 'rgba(244,216,168,0.95)' : 'rgba(0,0,0,0.68)';
        ctx.fillRect(button.x, button.y, button.w, button.h);
        ctx.strokeStyle = selected ? '#ffffff' : 'rgba(255,255,255,0.42)';
        ctx.lineWidth = selected ? 3 : 2;
        ctx.strokeRect(button.x, button.y, button.w, button.h);
        ctx.fillStyle = selected ? '#140000' : '#ffffff';
        ctx.font = 'bold 22px Arial';
        ctx.fillText(button.label, button.x + button.w / 2, button.y + button.h / 2 + 1);
      });

      ctx.fillStyle = 'rgba(255,255,255,0.58)';
      ctx.font = '17px Arial';
      ctx.fillText('↑/↓ — выбор   Enter — подтвердить', w / 2, 695);
      ctx.restore();
    };

    const originalGameUpdate = GameApp.prototype.update;
    GameApp.prototype.update = function (dt) {
      if (this.state === 'gameOver') {
        DevPanel.update(this);
        const click = Input.consumePointer();
        if (click && this.handleSpeakerClick(click)) return;
        if (DevPanel.open) return;
        this.updateGameOver(click);
        return;
      }
      originalGameUpdate.call(this, dt);
    };

    const originalGameDraw = GameApp.prototype.draw;
    GameApp.prototype.draw = function () {
      if (this.state === 'gameOver') {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
        this.drawGameOver(ctx);
        this.drawSpeaker(ctx);
        DevPanel.draw(ctx);
        return;
      }
      originalGameDraw.call(this);
    };

    const originalSceneUpdate = LevelScene.prototype.update;
    LevelScene.prototype.update = function (dt) {
      const wasCleared = this.encounterCleared;
      originalSceneUpdate.call(this, dt);
      if (!wasCleared && this.encounterCleared && this.game && this.game.addPeopleSupport) {
        this.game.addPeopleSupport(8);
      }
      if (this.player && this.player.hp <= 0) this.game.handleHeroDefeat(this);
    };
  }
})();
