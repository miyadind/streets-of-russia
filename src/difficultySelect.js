(function () {
  if (typeof GameApp === 'undefined') return;

  const MODES = [
    { key: 'easy', label: 'ЛЁГКАЯ', description: 'Полный запас здоровья для спокойного прохождения.' },
    { key: 'normal', label: 'НОРМАЛЬНАЯ', description: 'На 30% меньше здоровья у всех героев.' },
    { key: 'hard', label: 'СЛОЖНАЯ', description: 'На 50% меньше здоровья у всех героев.' }
  ];
  const HEROES = [
    { key: 'alexey', label: 'АЛЕКСЕЙ' },
    { key: 'anna', label: 'АННА' },
    { key: 'boris', label: 'БОРИС' }
  ];

  function clampIndex(index) {
    return Math.max(0, Math.min(MODES.length - 1, Number(index) || 0));
  }

  function getModeIndex(key) {
    const found = MODES.findIndex(mode => mode.key === key);
    return found >= 0 ? found : 1;
  }

  function inRect(point, rect) {
    return point && point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  function getCardRect(index) {
    return { x: 145 + index * 340, y: 244, w: 310, h: 290 };
  }

  function getConfirmRect() {
    return { x: 470, y: 590, w: 340, h: 58 };
  }

  const DifficultySelect = {
    selectedIndex: 1,

    open(game) {
      this.selectedIndex = getModeIndex((GAME_CONFIG.settings && GAME_CONFIG.settings.difficulty) || 'normal');
      game.setState('difficultySelect');
      if (game.ensureMenuMusic) game.ensureMenuMusic();
    },

    confirm(game) {
      const mode = MODES[clampIndex(this.selectedIndex)];
      GAME_CONFIG.settings.difficulty = mode.key;
      game.runDifficulty = mode.key;
      game.runDifficultyLocked = true;
      game.difficultyConfirmedForNewRun = true;
      AudioManager.playSfx('menuSelect', 0.85);
      game.startNewCampaign();
    },

    update(game) {
      if (Input.consume('arrowleft') || Input.consume('a') || Input.consume('arrowup') || Input.consume('w')) {
        this.selectedIndex = (this.selectedIndex + MODES.length - 1) % MODES.length;
        AudioManager.playSfx('menuMove', 0.75);
      }
      if (Input.consume('arrowright') || Input.consume('d') || Input.consume('arrowdown') || Input.consume('s')) {
        this.selectedIndex = (this.selectedIndex + 1) % MODES.length;
        AudioManager.playSfx('menuMove', 0.75);
      }

      const click = Input.consumePointer();
      if (click) {
        for (let index = 0; index < MODES.length; index++) {
          if (!inRect(click, getCardRect(index))) continue;
          if (this.selectedIndex === index) this.confirm(game);
          else {
            this.selectedIndex = index;
            AudioManager.playSfx('menuMove', 0.75);
          }
          return;
        }
        if (inRect(click, getConfirmRect())) this.confirm(game);
      }

      if (Input.consume('enter') || Input.consume('space')) this.confirm(game);
      if (Input.consume('escape')) {
        AudioManager.playSfx('menuSelect', 0.65);
        game.setState('mainMenu');
      }
    },

    draw(ctx, images) {
      ctx.save();
      ctx.drawImage(images.main, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

      ctx.textAlign = 'center';
      ctx.font = 'bold 42px Arial';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 6;
      ctx.strokeText('ВЫБЕРИТЕ СЛОЖНОСТЬ', GAME_CONFIG.width / 2, 150);
      ctx.fillText('ВЫБЕРИТЕ СЛОЖНОСТЬ', GAME_CONFIG.width / 2, 150);

      for (let index = 0; index < MODES.length; index++) {
        const mode = MODES[index];
        const active = index === this.selectedIndex;
        const rect = getCardRect(index);
        ctx.fillStyle = active ? 'rgba(255, 205, 50, 0.16)' : 'rgba(0, 0, 0, 0.45)';
        ctx.strokeStyle = active ? '#ffd44d' : 'rgba(255,255,255,0.42)';
        ctx.lineWidth = active ? 5 : 2;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

        ctx.font = 'bold 29px Arial';
        ctx.fillStyle = active ? '#ffe68b' : '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText(mode.label, rect.x + rect.w / 2, rect.y + 49);
        ctx.fillText(mode.label, rect.x + rect.w / 2, rect.y + 49);

        ctx.font = '17px Arial';
        ctx.fillStyle = '#e7e7e7';
        ctx.fillText(mode.description, rect.x + rect.w / 2, rect.y + 84);

        HEROES.forEach((hero, heroIndex) => {
          const baseHp = Math.max(1, Number(GAME_CONFIG.heroes[hero.key].hp) || 1);
          const multiplier = Number((GAME_CONFIG.heroHealthByDifficulty || {})[mode.key]) || 1;
          const hp = Math.round(baseHp * multiplier);
          ctx.font = 'bold 21px Arial';
          ctx.fillStyle = '#fff';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 3;
          const y = rect.y + 140 + heroIndex * 40;
          ctx.strokeText(hero.label + ': ' + hp + ' HP', rect.x + rect.w / 2, y);
          ctx.fillText(hero.label + ': ' + hp + ' HP', rect.x + rect.w / 2, y);
        });
      }

      const confirm = getConfirmRect();
      ctx.fillStyle = 'rgba(166, 33, 26, 0.9)';
      ctx.strokeStyle = '#ffe28a';
      ctx.lineWidth = 3;
      ctx.fillRect(confirm.x, confirm.y, confirm.w, confirm.h);
      ctx.strokeRect(confirm.x, confirm.y, confirm.w, confirm.h);
      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.strokeText('НАЧАТЬ', confirm.x + confirm.w / 2, confirm.y + 38);
      ctx.fillText('НАЧАТЬ', confirm.x + confirm.w / 2, confirm.y + 38);
      ctx.font = '17px Arial';
      ctx.fillStyle = '#d7d7d7';
      ctx.fillText('После начала прохождения сложность изменить нельзя.', GAME_CONFIG.width / 2, 686);
      ctx.restore();
    }
  };

  window.DifficultySelect = DifficultySelect;
})();
