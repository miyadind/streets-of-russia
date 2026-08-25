(function () {
  if (typeof GameApp === 'undefined') return;

  const PAUSE_ITEMS = ['resume', 'switchHero', 'bestiary', 'audio', 'developer', 'menu'];
  const GOIDA_SFX = {
    z: { key: 'hotkeyZ', src: 'assets/sounds/Z.mp3' },
    x: { key: 'hotkeyX', src: 'assets/sounds/X.mp3' }
  };

  function pauseRect() {
    return { x: 14, y: 16, w: 88, h: 52 };
  }

  function resumeRect() {
    return { x: 390, y: 118, w: 500, h: 54 };
  }

  function switchHeroRect() {
    return { x: 390, y: 182, w: 500, h: 54 };
  }

  function bestiaryRect() {
    return { x: 390, y: 246, w: 500, h: 54 };
  }

  function audioRect() {
    return { x: 390, y: 310, w: 500, h: 54 };
  }

  function developerRect() {
    return { x: 390, y: 374, w: 500, h: 54 };
  }

  function menuRect() {
    return { x: 390, y: 438, w: 500, h: 54 };
  }

  function getPauseItemRects() {
    return [
      { key: 'resume', label: 'ПРОДОЛЖИТЬ', rect: resumeRect(), fontSize: 30 },
      { key: 'switchHero', label: 'СМЕНИТЬ ПЕРСОНАЖА', rect: switchHeroRect(), fontSize: 28 },
      { key: 'bestiary', label: 'ТВАРИ', rect: bestiaryRect(), fontSize: 28 },
      { key: 'audio', label: 'НАСТРОЙКИ ЗВУКА', rect: audioRect(), fontSize: 26 },
      { key: 'developer', label: 'РЕЖИМ РАЗРАБОТЧИКА', rect: developerRect(), fontSize: 25 },
      { key: 'menu', label: 'В МЕНЮ', rect: menuRect(), fontSize: 30 }
    ];
  }

  function inRect(p, r) {
    return p && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  }

  function drawButton(ctx, r, label, active, fontSize) {
    ctx.save();
    ctx.fillStyle = active ? 'rgba(130,0,0,0.86)' : 'rgba(0,0,0,0.58)';
    ctx.strokeStyle = active ? '#ffffff' : 'rgba(255,255,255,0.70)';
    ctx.lineWidth = active ? 5 : 3;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeRect(r.x, r.y, r.w, r.h);

    if (active) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('▶', r.x + 34, r.y + r.h / 2 + 1);
    }

    ctx.font = 'bold ' + (fontSize || 30) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    ctx.strokeText(label, r.x + r.w / 2, r.y + r.h / 2 + 2);
    ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 2);
    ctx.restore();
  }

  function ensurePauseSelection(game) {
    if (!Number.isFinite(game.pauseSelection)) game.pauseSelection = 0;
    game.pauseSelection = Math.max(0, Math.min(PAUSE_ITEMS.length - 1, game.pauseSelection));
  }

  function setPaused(game, paused) {
    game.paused = paused;
    if (paused) {
      game.pauseSelection = 0;
      game.pauseAudioSettings = false;
      game.pauseAudioSelection = 0;
    }
  }

  function getAudioRows() {
    return [
      { key: 'sound', label: 'ОБЩИЙ ЗВУК', y: 220 },
      { key: 'music', label: 'МУЗЫКА', y: 302 },
      { key: 'sfx', label: 'ЭФФЕКТЫ', y: 384 },
      { key: 'back', label: 'НАЗАД', y: 484 }
    ];
  }

  function getAudioControlRects(row) {
    return {
      row: { x: 350, y: row.y, w: 580, h: 60 },
      minus: { x: 640, y: row.y + 9, w: 52, h: 42 },
      plus: { x: 852, y: row.y + 9, w: 52, h: 42 }
    };
  }

  function ensureAudioSelection(game) {
    if (!Number.isFinite(game.pauseAudioSelection)) game.pauseAudioSelection = 0;
    game.pauseAudioSelection = Math.max(0, Math.min(getAudioRows().length - 1, game.pauseAudioSelection));
  }

  function changeAudioSetting(key, direction) {
    if (key === 'music') {
      AudioManager.setMusicVolume(GAME_CONFIG.settings.musicVolume + direction * 0.05);
      return;
    }
    if (key === 'sfx') AudioManager.setSfxVolume(GAME_CONFIG.settings.sfxVolume + direction * 0.05);
  }

  function activateAudioRow(game, key) {
    if (key === 'sound') AudioManager.toggleSound();
    else if (key === 'back') game.pauseAudioSettings = false;
    AudioManager.playSfx('menuSelect', 0.65);
  }

  function startQuickHeroSwitch(game) {
    if (!game || !game.scene || !game.scene.player) return;
    const player = game.scene.player;
    game.paused = false;
    game.casualtyRespawn = {
      screenIndex: game.scene.screenIndex,
      x: Math.max(90, Math.min(GAME_CONFIG.width - 140, player.x)),
      y: Math.max(GAME_CONFIG.laneTop + 20, Math.min(GAME_CONFIG.laneBottom - 10, player.y)),
      facing: player.facing || 1
    };
    game.characterSelectMode = 'switchHero';
    if (typeof CharacterSelect !== 'undefined') {
      CharacterSelect.infoOpen = false;
      CharacterSelect.footerFocus = null;
      CharacterSelect.selectedIndex = CharacterSelect.heroes.indexOf(player.heroKey || game.selectedHero || 'boris');
      if (CharacterSelect.selectedIndex < 0) CharacterSelect.selectedIndex = 0;
    }
    game.setState('characterSelect');
    AudioManager.playSfx('menuSelect', 0.75);
  }

  function canQuickHeroSwitch(game) {
    if (!game || !game.scene || !game.scene.player) return false;
    const player = game.scene.player;
    if (player.hp <= 0 || player.dead) return false;
    const heroes = (typeof CharacterSelect !== 'undefined' && CharacterSelect.heroes) || Object.keys(GAME_CONFIG.heroes || {});
    return heroes.some((key) => key !== player.heroKey && !(game.defeatedHeroes && game.defeatedHeroes[key]));
  }

  function playGoidaSfx(game, buttonKey) {
    const sound = GOIDA_SFX[buttonKey];
    if (!sound || typeof AudioManager === 'undefined') return false;

    const now = performance.now();
    if (game.lastGoidaSfxAt && now - game.lastGoidaSfxAt < 450) return true;
    game.lastGoidaSfxAt = now;

    AudioManager.playOptionalSfx(sound.key, 1, {
      src: sound.src,
      startAt: 0.01
    });
    return true;
  }

  function openDeveloperPanel(game) {
    if (typeof DevPanel === 'undefined') return;
    setPaused(game, false);
    GAME_CONFIG.adminTuningEnabled = true;

    if (typeof DevPanel.openFromPauseMenu === 'function') {
      DevPanel.openFromPauseMenu(game);
    } else {
      DevPanel.open = true;
      DevPanel.tab = 'LEVEL WAVES';
      if (typeof DevPanel.ensureLevels === 'function') DevPanel.ensureLevels();
      if (typeof DevPanel.syncSelectedLevelWithScene === 'function') DevPanel.syncSelectedLevelWithScene(game);
    }

    AudioManager.playSfx('menuSelect', 0.65);
  }

  function activatePauseItem(game, key) {
    if (key === 'resume') {
      setPaused(game, false);
      AudioManager.playSfx('menuSelect', 0.65);
      return;
    }
    if (key === 'switchHero') {
      startQuickHeroSwitch(game);
      return;
    }
    if (key === 'bestiary') {
      setPaused(game, false);
      if (game.openBestiary) game.openBestiary('level');
      return;
    }
    if (key === 'audio') {
      game.pauseAudioSettings = true;
      game.pauseAudioSelection = 0;
      AudioManager.playSfx('menuSelect', 0.65);
      return;
    }
    if (key === 'developer') {
      openDeveloperPanel(game);
      return;
    }
    if (key === 'menu') {
      setPaused(game, false);
      game.setState('mainMenu');
      AudioManager.playSfx('menuSelect', 0.65);
    }
  }

  const originalUpdate = GameApp.prototype.update;
  GameApp.prototype.update = function (dt) {
    if (this.state === 'level') {
      if (Input.consume('escape')) {
        if (this.paused && this.pauseAudioSettings) {
          this.pauseAudioSettings = false;
          AudioManager.playSfx('menuBack', 0.65);
          return;
        }
        setPaused(this, !this.paused);
        AudioManager.playSfx('menuSelect', 0.65);
        return;
      }

      if (this.paused) {
        if (this.pauseAudioSettings) {
          ensureAudioSelection(this);
          const rows = getAudioRows();
          if (Input.consume('arrowup') || Input.consume('w')) {
            this.pauseAudioSelection = (this.pauseAudioSelection + rows.length - 1) % rows.length;
            AudioManager.playSfx('menuMove', 0.7);
            return;
          }
          if (Input.consume('arrowdown') || Input.consume('s')) {
            this.pauseAudioSelection = (this.pauseAudioSelection + 1) % rows.length;
            AudioManager.playSfx('menuMove', 0.7);
            return;
          }
          if (Input.consume('arrowleft') || Input.consume('a')) {
            changeAudioSetting(rows[this.pauseAudioSelection].key, -1);
            AudioManager.playSfx('menuMove', 0.7);
            return;
          }
          if (Input.consume('arrowright') || Input.consume('d')) {
            changeAudioSetting(rows[this.pauseAudioSelection].key, 1);
            AudioManager.playSfx('menuMove', 0.7);
            return;
          }
          if (Input.consume('enter') || Input.consume('space')) {
            activateAudioRow(this, rows[this.pauseAudioSelection].key);
            return;
          }
        }

        ensurePauseSelection(this);

        if (Input.consume('arrowup') || Input.consume('w')) {
          this.pauseSelection = (this.pauseSelection + PAUSE_ITEMS.length - 1) % PAUSE_ITEMS.length;
          AudioManager.playSfx('menuMove', 0.7);
          return;
        }

        if (Input.consume('arrowdown') || Input.consume('s')) {
          this.pauseSelection = (this.pauseSelection + 1) % PAUSE_ITEMS.length;
          AudioManager.playSfx('menuMove', 0.7);
          return;
        }

        if (Input.consume('enter') || Input.consume('space')) {
          activatePauseItem(this, PAUSE_ITEMS[this.pauseSelection]);
          return;
        }
      }

      const click = Input.consumePointer();
      if (click) {
        if (inRect(click, pauseRect())) {
          setPaused(this, !this.paused);
          AudioManager.playSfx('menuSelect', 0.65);
          return;
        }

        if (this.paused) {
          if (this.pauseAudioSettings) {
            const rows = getAudioRows();
            for (let i = 0; i < rows.length; i++) {
              const controls = getAudioControlRects(rows[i]);
              if (inRect(click, controls.minus)) {
                changeAudioSetting(rows[i].key, -1);
                return;
              }
              if (inRect(click, controls.plus)) {
                changeAudioSetting(rows[i].key, 1);
                return;
              }
              if (inRect(click, controls.row)) {
                this.pauseAudioSelection = i;
                activateAudioRow(this, rows[i].key);
                return;
              }
            }
            return;
          }
          const items = getPauseItemRects();
          for (let i = 0; i < items.length; i++) {
            if (!inRect(click, items[i].rect)) continue;
            this.pauseSelection = i;
            activatePauseItem(this, items[i].key);
            return;
          }
        }

        Input.restorePointer(click);
      }

      if (this.paused) return;

      if (Input.consume('c') && canQuickHeroSwitch(this)) {
        startQuickHeroSwitch(this);
        return;
      }

      if (Input.consume('z')) {
        playGoidaSfx(this, 'z');
        return;
      }

      if (Input.consume('x')) {
        playGoidaSfx(this, 'x');
        return;
      }
    }

    originalUpdate.call(this, dt);
  };

  const originalDraw = GameApp.prototype.draw;
  GameApp.prototype.draw = function () {
    originalDraw.call(this);
    if (this.state !== 'level') return;

    const ctx = this.ctx;
    drawButton(ctx, pauseRect(), 'MENU', false, 18);

    if (!this.paused) return;
    if (this.pauseAudioSettings) {
      ensureAudioSelection(this);
      const rows = getAudioRows();
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.58)';
      ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 7;
      ctx.strokeText('НАСТРОЙКИ ЗВУКА', GAME_CONFIG.width / 2, 152);
      ctx.fillText('НАСТРОЙКИ ЗВУКА', GAME_CONFIG.width / 2, 152);
      ctx.restore();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const controls = getAudioControlRects(row);
        const selected = i === this.pauseAudioSelection;
        const isSound = row.key === 'sound';
        const isBack = row.key === 'back';
        const value = row.key === 'music' ? GAME_CONFIG.settings.musicVolume : row.key === 'sfx' ? GAME_CONFIG.settings.sfxVolume : null;
        ctx.save();
        ctx.fillStyle = selected ? 'rgba(130,0,0,0.86)' : 'rgba(0,0,0,0.58)';
        ctx.strokeStyle = selected ? '#ffd447' : 'rgba(255,255,255,0.7)';
        ctx.lineWidth = selected ? 4 : 2;
        ctx.fillRect(controls.row.x, controls.row.y, controls.row.w, controls.row.h);
        ctx.strokeRect(controls.row.x, controls.row.y, controls.row.w, controls.row.h);
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(row.label, controls.row.x + 22, controls.row.y + controls.row.h / 2 + 1);
        if (isSound) {
          ctx.textAlign = 'right';
          ctx.fillStyle = AudioManager.isSoundOn() ? '#8cff8c' : '#ff7777';
          ctx.fillText(AudioManager.isSoundOn() ? 'ВКЛ' : 'ВЫКЛ', controls.row.x + controls.row.w - 24, controls.row.y + controls.row.h / 2 + 1);
        } else if (!isBack) {
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          ctx.fillRect(706, controls.row.y + 22, 130, 16);
          ctx.fillStyle = '#55d5ff';
          ctx.fillRect(706, controls.row.y + 22, 130 * value, 16);
          drawButton(ctx, controls.minus, '-', false, 26);
          drawButton(ctx, controls.plus, '+', false, 26);
        }
        ctx.restore();
      }
      return;
    }
    ensurePauseSelection(this);

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.58)';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    ctx.font = 'bold 46px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 7;
    ctx.strokeText('ПАУЗА', GAME_CONFIG.width / 2, 148);
    ctx.fillText('ПАУЗА', GAME_CONFIG.width / 2, 148);
    ctx.font = '18px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.fillText('↑/↓ — выбор   Enter/Space — подтвердить   Esc — назад', GAME_CONFIG.width / 2, 600);
    ctx.restore();

    const items = getPauseItemRects();
    for (let i = 0; i < items.length; i++) {
      drawButton(ctx, items[i].rect, items[i].label, i === this.pauseSelection, items[i].fontSize);
    }
  };
})();
