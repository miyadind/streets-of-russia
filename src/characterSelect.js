const CharacterSelect = {
  heroes: ['alexey', 'anna', 'boris'],
  selectedIndex: 2,

  update(game) {
    if (Input.consume('arrowleft') || Input.consume('a')) this.selectedIndex = (this.selectedIndex + 2) % 3;
    if (Input.consume('arrowright') || Input.consume('d')) this.selectedIndex = (this.selectedIndex + 1) % 3;
    if (Input.consume('escape')) game.setState('mainMenu');

    const click = Input.consumePointer();
    if (click) {
      for (let i = 0; i < 3; i++) {
        const box = this.getCardBox(i);
        if (click.x >= box.x && click.x <= box.x + box.w && click.y >= box.y && click.y <= box.y + box.h) {
          this.selectedIndex = i;
        }
      }
      const confirm = { x: 420, y: 630, w: 260, h: 50 };
      const back = { x: 720, y: 630, w: 160, h: 50 };
      if (click.x >= confirm.x && click.x <= confirm.x + confirm.w && click.y >= confirm.y && click.y <= confirm.y + confirm.h) this.confirm(game);
      if (click.x >= back.x && click.x <= back.x + back.w && click.y >= back.y && click.y <= back.y + back.h) game.setState('mainMenu');
    }

    if (Input.consume('enter') || Input.consume('space')) this.confirm(game);
  },

  confirm(game) {
    game.selectedHero = this.heroes[this.selectedIndex];
    game.startLevel();
  },

  getCardBox(i) {
    return { x: 120 + i * 355, y: 160, w: 320, h: 420 };
  },

  draw(ctx, images) {
    ctx.fillStyle = '#08080d';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    ctx.drawImage(images.main, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    ctx.fillStyle = 'rgba(0,0,0,0.58)';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    this.drawTitle(ctx, 'ВЫБЕРИТЕ ПЕРСОНАЖА', 78);

    for (let i = 0; i < this.heroes.length; i++) {
      this.drawCard(ctx, images, this.heroes[i], i, i === this.selectedIndex);
    }

    this.drawButton(ctx, 420, 630, 260, 50, 'ПОДТВЕРДИТЬ', true);
    this.drawButton(ctx, 720, 630, 160, 50, 'НАЗАД', false);
  },

  drawCard(ctx, images, heroKey, index, selected) {
    const hero = GAME_CONFIG.heroes[heroKey];
    const box = this.getCardBox(index);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.strokeStyle = selected ? '#ffffff' : 'rgba(255,255,255,0.35)';
    ctx.lineWidth = selected ? 5 : 2;
    ctx.strokeRect(box.x, box.y, box.w, box.h);

    if (heroKey === 'boris' && images.borisIdle) {
      const img = images.borisIdle;
      const s = 0.28;
      const w = img.width * s;
      const h = img.height * s;
      ctx.drawImage(img, box.x + box.w / 2 - w / 2, box.y + 30, w, h);
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
    ctx.strokeText(hero.name.toUpperCase(), box.x + box.w / 2, box.y + 270);
    ctx.fillText(hero.name.toUpperCase(), box.x + box.w / 2, box.y + 270);
    ctx.textAlign = 'left';

    this.drawStat(ctx, box.x + 35, box.y + 315, 'СИЛА', hero.strength, hero.color);
    this.drawStat(ctx, box.x + 35, box.y + 355, 'СКОРОСТЬ', hero.speedStat, hero.color);
    this.drawStat(ctx, box.x + 35, box.y + 395, 'ЗДОРОВЬЕ', hero.health, hero.color);
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

  drawButton(ctx, x, y, w, h, text, strong) {
    ctx.fillStyle = strong ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.4)';
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText(text, x + w / 2, y + 33);
    ctx.fillText(text, x + w / 2, y + 33);
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
