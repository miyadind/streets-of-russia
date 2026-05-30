const Menu = {
  selectedIndex: 0,
  items: ['НОВАЯ ИГРА', 'ТВАРИ', 'НАСТРОЙКИ'],

  update(game) {
    if (Input.consume('arrowup') || Input.consume('w')) {
      this.selectedIndex = (this.selectedIndex + this.items.length - 1) % this.items.length;
    }
    if (Input.consume('arrowdown') || Input.consume('s')) {
      this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
    }

    const click = Input.consumePointer();
    if (click) {
      for (let i = 0; i < this.items.length; i++) {
        const box = this.getItemBox(i);
        if (click.x >= box.x && click.x <= box.x + box.w && click.y >= box.y && click.y <= box.y + box.h) {
          this.selectedIndex = i;
          this.activate(game);
        }
      }
    }

    if (Input.consume('enter') || Input.consume('space')) {
      this.activate(game);
    }
  },

  activate(game) {
    const item = this.items[this.selectedIndex];
    if (item === 'НОВАЯ ИГРА') game.setState('characterSelect');
  },

  getItemBox(index) {
    return { x: 485, y: 300 + index * 70, w: 310, h: 54 };
  },

  draw(ctx, images) {
    ctx.drawImage(images.main, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    this.drawTitle(ctx, 'STREETS OF RUSSIA', 120, 58);

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

  drawSplash(ctx, images) {
    ctx.drawImage(images.main, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    this.drawTitle(ctx, 'STREETS OF RUSSIA', 120, 58);

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(470, 560, 340, 62);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    ctx.strokeRect(470, 560, 340, 62);
    ctx.font = 'bold 34px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    ctx.strokeText('START GAME', 640, 602);
    ctx.fillText('START GAME', 640, 602);
    ctx.textAlign = 'left';
  },

  drawTitle(ctx, text, y, size) {
    ctx.font = `bold ${size}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 7;
    ctx.strokeText(text, GAME_CONFIG.width / 2, y);
    ctx.fillText(text, GAME_CONFIG.width / 2, y);
    ctx.textAlign = 'left';
  }
};
