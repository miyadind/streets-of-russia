const Menu = {
  selectedIndex: 0,
  settingsIndex: 0,
  items: ['НОВАЯ ИГРА', 'ТВАРИ', 'НАСТРОЙКИ'],
  settingsItems: ['СЛОЖНОСТЬ', 'МУЗЫКА', 'ГРОМКОСТЬ МУЗЫКИ', 'ЗВУКИ УДАРОВ', 'ГРОМКОСТЬ ЗВУКОВ', 'НАЗАД'],
  difficulties: ['easy', 'normal', 'hard'],
  difficultyLabels: {
    easy: 'ЛЕГКО',
    normal: 'НОРМАЛЬНО',
    hard: 'СЛОЖНО'
  },

  update(game) {
    if (Input.consume('arrowup') || Input.consume('w')) {
      this.selectedIndex = (this.selectedIndex + this.items.length - 1) % this.items.length;
      AudioManager.playSfx('menuMove', 0.75);
    }
    if (Input.consume('arrowdown') || Input.consume('s')) {
      this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
      AudioManager.playSfx('menuMove', 0.75);
    }

    const click = Input.consumePointer();
    if (click) {
      AudioManager.unlock();
      for (let i = 0; i < this.items.length; i++) {
        const box = this.getItemBox(i);
        if (click.x >= box.x && click.x <= box.x + box.w && click.y >= box.y && click.y <= box.y + box.h) {
          this.selectedIndex = i;
          this.activate(game);
        }
      }
    }

    if (Input.consume('enter') || Input.consume('space')) {
      AudioManager.unlock();
      this.activate(game);
    }
  },

  updateSettings(game) {
    if (Input.consume('escape')) {
      AudioManager.playSfx('menuSelect', 0.75);
      game.setState('mainMenu');
    }
    if (Input.consume('arrowup') || Input.consume('w')) {
      this.settingsIndex = (this.settingsIndex + this.settingsItems.length - 1) % this.settingsItems.length;
      AudioManager.playSfx('menuMove', 0.75);
    }
    if (Input.consume('arrowdown') || Input.consume('s')) {
      this.settingsIndex = (this.settingsIndex + 1) % this.settingsItems.length;
      AudioManager.playSfx('menuMove', 0.75);
    }
    if (Input.consume('arrowleft') || Input.consume('a')) {
      this.changeSetting(this.settingsIndex, game, -1);
    }
    if (Input.consume('arrowright') || Input.consume('d')) {
      this.changeSetting(this.settingsIndex, game, 1);
    }

    const click = Input.consumePointer();
    if (click) {
      AudioManager.unlock();
      for (let i = 0; i < this.settingsItems.length; i++) {
        const box = this.getSettingsBox(i);
        if (click.x >= box.x && click.x <= box.x + box.w && click.y >= box.y && click.y <= box.y + box.h) {
          this.settingsIndex = i;
          this.changeSetting(i, game, 1);
        }
      }
    }

    if (Input.consume('enter') || Input.consume('space')) {
      AudioManager.unlock();
      this.changeSetting(this.settingsIndex, game, 1);
    }
  },

  activate(game) {
    const item = this.items[this.selectedIndex];
    AudioManager.playSfx('menuSelect', 0.85);
    if (item === 'НОВАЯ ИГРА') game.setState('characterSelect');
    if (item === 'НАСТРОЙКИ') game.setState('settings');
  },

  changeSetting(index, game, direction = 1) {
    const item = this.settingsItems[index];
    AudioManager.playSfx('menuSelect', 0.75);

    if (item === 'СЛОЖНОСТЬ') {
      const current = this.difficulties.indexOf(GAME_CONFIG.settings.difficulty);
      GAME_CONFIG.settings.difficulty = this.difficulties[this.wrap(current + direction, this.difficulties.length)];
    }

    if (item === 'МУЗЫКА') {
      AudioManager.toggleMusic();
    }

    if (item === 'ГРОМКОСТЬ МУЗЫКИ') {
      AudioManager.setMusicVolume(GAME_CONFIG.settings.musicVolume + direction * 0.05);
    }

    if (item === 'ЗВУКИ УДАРОВ') {
      AudioManager.toggleSfx();
    }

    if (item === 'ГРОМКОСТЬ ЗВУКОВ') {
      AudioManager.setSfxVolume(GAME_CONFIG.settings.sfxVolume + direction * 0.05);
      AudioManager.playSfx('menuSelect', 0.9);
    }

    if (item === 'НАЗАД') {
      game.setState('mainMenu');
    }
  },

  wrap(index, length) {
    if (length <= 0) return 0;
    return ((index % length) + length) % length;
  },

  getItemBox(index) {
    return { x: 485, y: 300 + index * 70, w: 310, h: 54 };
  },

  getSettingsBox(index) {
    return { x: 350, y: 210 + index * 70, w: 580, h: 54 };
  },

  draw(ctx, images) {
    ctx.drawImage(images.main, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    for (let i = 0; i < this.items.length; i++) {
      const box = this.getItemBox(i);
      const active = i === this.selectedIndex;
      ctx.fillStyle = active ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.28)';
      ctx.strokeStyle = active ? '#ffffff' : 'rgba(255,255,255,0.45)';
      ctx.lineWidth = active ? 4 : 2;
      ctx.fillRect(box.x, box.y, box.w, box.h);
      ctx.strokeRect(box.x, box.y, box.w, box.h);
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(this.items[i], box.x + box.w / 2, box.y + 36);
      ctx.fillText(this.items[i], box.x + box.w / 2, box.y + 36);
    }
    ctx.textAlign = 'left';
  },

  drawSettings(ctx, images) {
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
      const active = i === this.settingsIndex;
      const label = this.getSettingsLabel(i);
      ctx.fillStyle = active ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.36)';
      ctx.strokeStyle = active ? '#ffffff' : 'rgba(255,255,255,0.45)';
      ctx.lineWidth = active ? 4 : 2;
      ctx.fillRect(box.x, box.y, box.w, box.h);
      ctx.strokeRect(box.x, box.y, box.w, box.h);
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(label, box.x + box.w / 2, box.y + 35);
      ctx.fillText(label, box.x + box.w / 2, box.y + 35);
    }

    ctx.font = '18px Arial';
    ctx.fillStyle = '#ddd';
    ctx.fillText('A/D или ←/→ — изменить громкость. Enter/Space — переключить.', 340, 660);
    ctx.textAlign = 'left';
  },

  getSettingsLabel(index) {
    const item = this.settingsItems[index];
    if (item === 'СЛОЖНОСТЬ') return 'СЛОЖНОСТЬ: ' + this.difficultyLabels[GAME_CONFIG.settings.difficulty];
    if (item === 'МУЗЫКА') return 'МУЗЫКА: ' + (GAME_CONFIG.settings.musicEnabled ? 'ВКЛ' : 'ВЫКЛ');
    if (item === 'ГРОМКОСТЬ МУЗЫКИ') return 'ГРОМКОСТЬ МУЗЫКИ: ' + Math.round(GAME_CONFIG.settings.musicVolume * 100) + '%';
    if (item === 'ЗВУКИ УДАРОВ') return 'ЗВУКИ: ' + (GAME_CONFIG.settings.sfxEnabled ? 'ВКЛ' : 'ВЫКЛ');
    if (item === 'ГРОМКОСТЬ ЗВУКОВ') return 'ГРОМКОСТЬ ЗВУКОВ: ' + Math.round(GAME_CONFIG.settings.sfxVolume * 100) + '%';
    return item;
  },

  drawSplash(ctx, images) {
    ctx.drawImage(images.main, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(410, 560, 460, 62);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    ctx.strokeRect(410, 560, 460, 62);
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    ctx.strokeText('НАЖМИ ЛЮБУЮ КНОПКУ', 640, 600);
    ctx.fillText('НАЖМИ ЛЮБУЮ КНОПКУ', 640, 600);
    ctx.textAlign = 'left';
  }
};