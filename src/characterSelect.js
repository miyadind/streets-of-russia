const CharacterSelect = {
  heroes: ['alexey', 'anna', 'boris'],
  selectedIndex: 2,
  footerFocus: null,
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
      else this.moveSelection(-1);
    }

    if (Input.consume('arrowright') || Input.consume('d')) {
      if (this.footerFocus) this.moveFooterFocus(1);
      else this.moveSelection(1);
    }

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
          this.footerFocus = null;
          this.openInfo();
          return;
        }

        const box = this.getCardBox(i);
        if (this.isPointInBox(click, box)) {
          this.setSelection(i);
          this.footerFocus = null;
        }
      }

      if (this.isPointInBox(click, this.getConfirmBox())) this.confirm(game);
      if (this.isPointInBox(click, this.getBackBox())) {
        AudioManager.playSfx('menuSelect', 0.65);
        game.setState('mainMenu');
      }
    }

    if (Input.consume('enter') || Input.consume('space')) {
      if (this.footerFocus === 'back') {
        AudioManager.playSfx('menuSelect', 0.65);
        game.setState('mainMenu');
      } else {
        this.confirm(game);
      }
    }
  },

  moveSelection(direction) {
    this.selectedIndex = (this.selectedIndex + direction + this.heroes.length) % this.heroes.length;
    AudioManager.playSfx('menuMove', 0.85, { playbackRate: direction < 0 ? 0.95 : 1.05 });
  },

  moveFooterFocus(direction) {
    this.footerFocus = this.footerFocus === 'confirm' ? 'back' : 'confirm';
    AudioManager.playSfx('menuMove', 0.7, { playbackRate: direction < 0 ? 0.95 : 1.05 });
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
    return { x: 120 + i * 355, y: 126, w: 320, h: 488 };
  },

  getPortraitBox(i) {
    const box = this.getCardBox(i);
    return { x: box.x + 42, y: box.y + 44, w: box.w - 84, h: 244 };
  },

  getInfoButtonBox(i) {
    const box = this.getCardBox(i);
    return { x: box.x + 18, y: box.y + 18, w: 122, h: 30 };
  },

  getConfirmBox() {
    return { x: 420, y: 628, w: 260, h: 46 };
  },

  getBackBox() {
    return { x: 720, y: 628, w: 160, h: 46 };
  },

  getInfoCloseBox() {
    return { x: GAME_CONFIG.width / 2 + 330, y: 128, w: 46, h: 46 };
  },

  isPointInBox(point, box) {
    return point.x >= box.x && point.x <= box.x + box.w && point.y >= box.y && point.y <= box.y + box.h;
  },

  isPointInCircle(point, circle) {
    const dx = point.x - circle.x;
    const dy = point.y - circle.y;
    return dx * dx + dy * dy <= circle.r * circle.r;
  },

  draw(ctx, images) {
    ctx.fillStyle = '#08080d';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    ctx.drawImage(images.main, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    ctx.fillStyle = 'rgba(0,0,0,0.58)';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    this.drawTitle(ctx, 'ВЫБЕРИТЕ ПЕРСОНАЖА', 72);

    for (let i = 0; i < this.heroes.length; i++) {
      this.drawCard(ctx, images, this.heroes[i], i, i === this.selectedIndex && !this.footerFocus);
    }

    const confirm = this.getConfirmBox();
    const back = this.getBackBox();
    this.drawButton(ctx, confirm.x, confirm.y, confirm.w, confirm.h, 'ПОДТВЕРДИТЬ', this.footerFocus === 'confirm' || !this.footerFocus);
    this.drawButton(ctx, back.x, back.y, back.w, back.h, 'НАЗАД', this.footerFocus === 'back');

    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.fillText('←/→ или A/D — выбрать   ↓ — кнопки   Enter — начать   I — информация', GAME_CONFIG.width / 2, 704);
    ctx.textAlign = 'left';

    if (this.infoOpen) this.drawInfoModal(ctx, images);
  },

  drawCard(ctx, images, heroKey, index, selected) {
    const hero = GAME_CONFIG.heroes[heroKey];
    const box = this.getCardBox(index);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.strokeStyle = selected ? '#ffd447' : 'rgba(255,255,255,0.35)';
    ctx.lineWidth = selected ? 5 : 2;
    ctx.strokeRect(box.x, box.y, box.w, box.h);

    this.drawHeroPortrait(ctx, images, heroKey, index, hero.color);
    this.drawInfoIcon(ctx, index, selected, hero.color);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = hero.color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText(hero.name.toUpperCase(), box.x + box.w / 2, box.y + 334);
    ctx.fillText(hero.name.toUpperCase(), box.x + box.w / 2, box.y + 334);
    ctx.textAlign = 'left';

    this.drawStat(ctx, box.x + 35, box.y + 385, 'СИЛА', hero.strength, hero.color);
    this.drawStat(ctx, box.x + 35, box.y + 427, 'СКОРОСТЬ', hero.speedStat, hero.color);
    this.drawStat(ctx, box.x + 35, box.y + 469, 'ЗДОРОВЬЕ', hero.health, hero.color);
  },

  drawHeroPortrait(ctx, images, heroKey, index, color) {
    const heroImages = images.heroes && images.heroes[heroKey];
    const portrait = this.getPortraitBox(index);
    const box = this.getCardBox(index);

    if (heroImages && heroImages.idle) {
      const img = heroImages.idle;
      const scale = Math.min(portrait.w / img.width, portrait.h / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = portrait.x + portrait.w / 2 - w / 2;
      const y = portrait.y + portrait.h - h;
      ctx.drawImage(img, x, y, w, h);
      return;
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(box.x + box.w / 2, portrait.y + 118, 62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SPRITES', box.x + box.w / 2, portrait.y + 116);
    ctx.fillText('ПОЗЖЕ', box.x + box.w / 2, portrait.y + 140);
  },

  drawInfoIcon(ctx, index, selected, color) {
    const icon = this.getInfoButtonBox(index);
    ctx.save();
    ctx.fillStyle = selected ? color : 'rgba(0,0,0,0.72)';
    ctx.fillRect(icon.x, icon.y, icon.w, icon.h);
    ctx.lineWidth = selected ? 2.5 : 2;
    ctx.strokeStyle = selected ? '#ffd447' : 'rgba(255,255,255,0.74)';
    ctx.strokeRect(icon.x, icon.y, icon.w, icon.h);

    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.lineWidth = 2.5;
    ctx.strokeText('ИНФОРМАЦИЯ', icon.x + icon.w / 2, icon.y + icon.h / 2 + 0.5);
    ctx.fillText('ИНФОРМАЦИЯ', icon.x + icon.w / 2, icon.y + icon.h / 2 + 0.5);
    ctx.restore();
  },

  drawStat(ctx, x, y, label, value, color) {
    ctx.font = 'bold 18px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(label, x, y);
    const barX = x + 118;
    const boxY = y - 8;
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i < value ? color : 'rgba(255,255,255,0.12)';
      ctx.fillRect(barX + i * 18, boxY, 13, 16);
    }
    ctx.textBaseline = 'alphabetic';
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
      const maxW = 210;
      const maxH = 330;
      const scale = Math.min(maxW / img.width, maxH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, modal.x + 44 + maxW / 2 - w / 2, modal.y + 84 + maxH - h, w, h);
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
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
    ctx.fillStyle = strong ? 'rgba(255, 202, 54, 0.18)' : 'rgba(0,0,0,0.4)';
    ctx.strokeStyle = strong ? '#ffd447' : 'rgba(255,255,255,0.72)';
    ctx.lineWidth = strong ? 4 : 2;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.font = h < 44 ? 'bold 18px Arial' : 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText(text, x + w / 2, y + h / 2 + 1);
    ctx.fillText(text, x + w / 2, y + h / 2 + 1);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  },

  drawTitle(ctx, text, y) {
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 6;
    ctx.strokeText(text, GAME_CONFIG.width / 2, y);
    ctx.fillText(text, GAME_CONFIG.width / 2, y);
    ctx.textAlign = 'left';
  }
};
