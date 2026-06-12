const MobileControls = {
  active: false,

  shouldShow(game) {
    return !!(Responsive.isTouchDevice && game && game.state === 'level' && game.scene);
  },

  update(game) {
    this.active = this.shouldShow(game);
    if (!this.active) {
      Input.clearVirtualKeys();
      return;
    }

    Input.clearVirtualKeys();
    if (!Input.pointer.down) return;

    const p = Input.pointer;
    const dpad = this.getDpad();
    const attack = this.getAttackButton();

    if (this.pointInCircle(p, attack)) {
      Input.setVirtualKey('space', true);
      return;
    }

    if (this.pointInCircle(p, dpad)) {
      const dx = p.x - dpad.x;
      const dy = p.y - dpad.y;
      const dead = dpad.r * 0.22;

      if (Math.abs(dx) > dead) Input.setVirtualKey(dx < 0 ? 'arrowleft' : 'arrowright', true);
      if (Math.abs(dy) > dead) Input.setVirtualKey(dy < 0 ? 'arrowup' : 'arrowdown', true);
    }
  },

  getDpad() {
    return { x: 150, y: GAME_CONFIG.height - 132, r: 92 };
  },

  getAttackButton() {
    return { x: GAME_CONFIG.width - 142, y: GAME_CONFIG.height - 132, r: 76 };
  },

  pointInCircle(point, circle) {
    const dx = point.x - circle.x;
    const dy = point.y - circle.y;
    return dx * dx + dy * dy <= circle.r * circle.r;
  },

  draw(ctx, game) {
    if (!this.shouldShow(game)) return;

    const dpad = this.getDpad();
    const attack = this.getAttackButton();

    ctx.save();
    ctx.globalAlpha = 0.72;

    ctx.fillStyle = 'rgba(0,0,0,0.46)';
    ctx.strokeStyle = 'rgba(255,255,255,0.72)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(dpad.x, dpad.y, dpad.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    this.drawArrow(ctx, dpad.x, dpad.y - 48, 'up');
    this.drawArrow(ctx, dpad.x, dpad.y + 48, 'down');
    this.drawArrow(ctx, dpad.x - 48, dpad.y, 'left');
    this.drawArrow(ctx, dpad.x + 48, dpad.y, 'right');

    ctx.fillStyle = 'rgba(150,0,0,0.62)';
    ctx.strokeStyle = 'rgba(255,255,255,0.78)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(attack.x, attack.y, attack.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 25px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText('УДАР', attack.x, attack.y);
    ctx.fillText('УДАР', attack.x, attack.y);

    ctx.restore();
  },

  drawArrow(ctx, x, y, dir) {
    ctx.beginPath();
    if (dir === 'up') {
      ctx.moveTo(x, y - 18);
      ctx.lineTo(x - 16, y + 14);
      ctx.lineTo(x + 16, y + 14);
    } else if (dir === 'down') {
      ctx.moveTo(x, y + 18);
      ctx.lineTo(x - 16, y - 14);
      ctx.lineTo(x + 16, y - 14);
    } else if (dir === 'left') {
      ctx.moveTo(x - 18, y);
      ctx.lineTo(x + 14, y - 16);
      ctx.lineTo(x + 14, y + 16);
    } else {
      ctx.moveTo(x + 18, y);
      ctx.lineTo(x - 14, y - 16);
      ctx.lineTo(x - 14, y + 16);
    }
    ctx.closePath();
    ctx.fill();
  }
};