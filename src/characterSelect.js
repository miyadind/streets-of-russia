const CharacterSelect = {
  heroes: ['alexey', 'anna', 'boris'],
  selectedIndex: 2,
  infoOpen: false,

  update(game) {
    if (this.infoOpen) {
      if (Input.consume('escape') || Input.consume('i') || Input.consume('backspace') || Input.consume('enter') || Input.consume('space')) {
        this.closeInfo();
        return;
      }

      const infoClick = Input.consumePointer();
      if (infoClick) {
        const close = this.getInfoCloseBox();
        if (this.isPointInBox(infoClick, close)) {
          this.closeInfo();
          return;
        }
        this.closeInfo();
      }
      return;
    }

    if (Input.consume('arrowleft') || Input.consume('a')) this.moveSelection(-1);
    if (Input.consume('arrowright') || Input.consume('d')) this.moveSelection(1);
    if (Input.consume('i')) this.openInfo();
    if (Input.consume('escape')) {
      AudioManager.playSfx('menuSelect', 0.65);
      game.setState('mainMenu');
    }

    const click = Input.consumePointer();
    if (click) {
      for (let i = 0; i < this.heroes.length; i++) {
        const info = this.getInfoButtonBox(i);
        if (this.isPointInBox(click, info)) {
          this.setSelection(i);
          this.openInfo();
          return;
        }

        const box = this.getCardBox(i);
        if (this.isPointInBox(click, box)) {
          this.setSelection(i);
        }
      }

      const confirm = { x: 420, y: 630, w: 260, h: 50 };
      const back = { x: 720, y: 630, w: 160, h: 50 };
      if (this.isPointInBox(click, confirm)) this.confirm(game);
      if (this.isPointInBox(click, back)) {
        AudioManager.playSfx('menuSelect', 0.65);
        game.setState('mainMenu');
      }
    }

    if (Input.consume('enter') || Input.consume('space')) this.confirm(game);
  },

  moveSelection(direction) {
    this.selectedIndex = (this.selectedIndex + direction + this.heroes.length) % this.heroes.length;
    AudioManager.playSfx('menuMove', 0.85, { playbackRate: direction < 0 ? 0.95 : 1.05 });
  },

  setSelection(index) {
    if (index === this.selectedIndex) return;
    this.selectedIndex = index;
    AudioManager.playSfx('menuMove', 0.85);
  },

  openInfo() {
    this.infoOpen = true;
    AudioManager.playSfx('menuSelect', 0.75);
  },

  closeInfo() {
    this.infoOpen = false;
    AudioManager.playSfx('menuSelect', 0.55);
  },

  confirm(game) {
    game.selectedHero = this.heroes[this.selectedIndex];
    AudioManager.playSfx('menuSelect', 0.85);
    game.startLevel();
  },

  getCardBox(i) {
    return { x: 120 + i * 355, y: 150, w: 320, h: 440 };
  },

  getInfoButtonBox(i) {
    const box = this.getCardBox(i);
    return { x: box.x + 48, y: box.y + box.h - 62, w: box.w - 96, h: 38 };
  },

  getInfoCloseBox() {
    return { x: GAME_CONFIG.width / 2 + 330, y: 128, w: 46, h: 46 };
  },

  isPointInBox(point, box) {
    return point.x >= box.x && point.x <= box.x + box.w && point.y >= box.y && point.y <= box.y + box.h;
  },

  draw(ctx, images) {
    ctx.fillStyle = '#08080d';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    ctx.drawImage(images.main, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    ctx.fillStyle = 'rgba(0,0,0,0.58)';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    this.drawTitle(ctx, 'ВЫБЕРИТЕ ПЕРСОНАЖА', 72);

    for (let i = 0; i < this.heroes.length; i++) {
      this.drawCard(ctx, images, this.heroes[i], i, i === this.selectedIndex);
    }

    this.drawButton(ctx, 420, 630, 260, 50, 'ПОДТВЕРДИТЬ', true);
    this.drawButton(ctx, 720, 630, 160, 50, 'НАЗАД', false);

    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.fillText('←/→ или A/D — выбрать   Enter — начать   I — информация', GAME_CONFIG.width / 2, 704);
    ctx.textAlign = 'left';

    if (this.infoOpen) this.drawInfoModal(ctx, images);
  },

  drawCard(ctx, images, heroKey, index, selected) {
    const hero = GAME_CONFIG.heroes[heroKey];
    const box = this.getCardBox(index);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.strokeStyle = selected ? '#ffffff' : 'rgba(255,255,255,0.35)';
    ctx.lineWidth = selected ? 5 : 2;
    ctx.strokeRect(box.x, box.y, box.w, box.h);

    const heroImages = images.heroes && images.heroes[heroKey];
    if (heroImages && heroImages.idle) {
      const img = heroImages.idle;
      const s = 0.25;
      const w = img.width * s;
      const h = img.height * s;
      ctx.drawImage(img, box.x + box.w / 2 - w / 2, box.y + 24, w, h);
    } else {
      ctx.fillStyle = hero.color;
      ctx.beginPath();
      ctx.arc(box.x + box.w / 2, box.y + 130, 62, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SPRITES', box.x + box.w / 2, box.y + 128);
      ctx.fillText('ПОЗЖЕ', box.x + box.w / 2, box.y + 152);
    }

    ctx.textAlign = 'center';
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = hero.color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText(hero.name.toUpperCase(), box.x + box.w / 2, box.y + 260);
    ctx.fillText(hero.name.toUpperCase(), box.x + box.w / 2, box.y + 260);
    ctx.textAlign = 'left';

    this.drawStat(ctx, box.x + 35, box.y + 305, 'СИЛА', hero.strength, hero.color);
    this.drawStat(ctx, box.x + 35, box.y + 343, 'СКОРОСТЬ', hero.speedStat, hero.color);
    this.drawStat(ctx, box.x + 35, box.y + 381, 'ЗДОРОВЬЕ', hero.health, hero.color);
    this.drawButton(ctx, box.x + 48, box.y + box.h - 62, box.w - 96, 38, 'ИНФОРМАЦИЯ', selected);
  },

  drawStat(ctx, x, y, label, value, color) {
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(label, x, y);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i < value ? color : 'rgba(255,255,255,0.12)';
      ctx.fillRect(x + 110 + i * 18, y - 15, 13, 15);
    }
  },

  drawInfoModal(ctx, images) {
    const heroKey = this.heroes[this.selectedIndex];
    const hero = GAME_CONFIG.heroes[heroKey];
    const modal = { x: 210, y: 118, w: 860, h: 470 };

    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    ctx.fillStyle = 'rgba(8,8,13,0.96)';
    ctx.fillRect(modal.x, modal.y, modal.w, modal.h);
    ctx.strokeStyle = hero.color;
    ctx.lineWidth = 4;
    ctx.strokeRect(modal.x, modal.y, modal.w, modal.h);

    const close = this.getInfoCloseBox();
    this.drawButton(ctx, close.x, close.y, close.w, close.h, '×', false);

    const heroImages = images.heroes && images.heroes[heroKey];
    if (heroImages && heroImages.idle) {
      const img = heroImages.idle;
      const s = 0.22;
      const w = img.width * s;
      const h = img.height * s;
      ctx.drawImage(img, modal.x + 52, modal.y + 70, w, h);
    }

    ctx.textAlign = 'left';
    ctx.font = 'bold 38px Arial';
    ctx.fillStyle = hero.color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    ctx.strokeText(hero.name.toUpperCase(), modal.x + 300, modal.y + 82);
    ctx.fillText(hero.name.toUpperCase(), modal.x + 300, modal.y + 82);

    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(hero.tagline || '', modal.x + 300, modal.y + 124);

    ctx.font = '21px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    this.drawWrappedText(ctx, hero.bio || '', modal.x + 300, modal.y + 168, 505, 30);

    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = hero.color;
    ctx.fillText('ОСОБЕННОСТЬ', modal.x + 300, modal.y + 345);
    ctx.font = '20px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    this.drawWrappedText(ctx, hero.ability || '', modal.x + 300, modal.y + 378, 505, 28);

    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillText('Esc / Enter / клик — закрыть', modal.x + modal.w / 2, modal.y + modal.h - 28);
    ctx.textAlign = 'left';
  },

  drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = String(text).split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, y);
        line = word;
        y += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, y);
  },

  drawButton(ctx, x, y, w, h, text, strong) {
    ctx.fillStyle = strong ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.4)';
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.font = h < 44 ? 'bold 18px Arial' : 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText(text, x + w / 2, y + h / 2 + 8);
    ctx.fillText(text, x + w / 2, y + h / 2 + 8);
    ctx.textAlign = 'left';
  },

  drawTitle(ctx, text, y) {
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 6;
    ctx.strokeText(text, GAME_CONFIG.width / 2, y);
    ctx.fillText(text, GAME_CONFIG.width / 2, y);
    ctx.textAlign = 'left';
  }
};