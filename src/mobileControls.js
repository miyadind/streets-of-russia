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
    const stick = this.getStick();
    const attack = this.getAttackButton();

    if (this.pointInCircle(p, attack)) {
      Input.setVirtualKey('space', true);
      return;
    }

    if (this.pointInCircle(p, stick)) {
      const dx = p.x - stick.x;
      const dy = p.y - stick.y;
      const distance = Math.hypot(dx, dy);
      const dead = stick.r * 0.18;
      if (distance <= dead) return;

      const nx = dx / Math.max(1, distance);
      const ny = dy / Math.max(1, distance);
      const horizontal = Math.abs(nx);
      const vertical = Math.abs(ny);

      if (horizontal > 0.26) Input.setVirtualKey(nx < 0 ? 'arrowleft' : 'arrowright', true);
      if (vertical > 0.32) Input.setVirtualKey(ny < 0 ? 'arrowup' : 'arrowdown', true);
    }
  },

  getStick() {
    return { x: 160, y: GAME_CONFIG.height - 132, r: 104, knobR: 38 };
  },

  getDpad() {
    return this.getStick();
  },

  getAttackButton() {
    return { x: GAME_CONFIG.width - 142, y: GAME_CONFIG.height - 132, r: 74 };
  },

  pointInCircle(point, circle) {
    const dx = point.x - circle.x;
    const dy = point.y - circle.y;
    return dx * dx + dy * dy <= circle.r * circle.r;
  },

  draw(ctx, game) {
    if (!this.shouldShow(game)) return;

    const stick = this.getStick();
    const attack = this.getAttackButton();
    const p = Input.pointer;
    let knobX = stick.x;
    let knobY = stick.y;

    if (Input.pointer.down && this.pointInCircle(p, stick)) {
      const dx = p.x - stick.x;
      const dy = p.y - stick.y;
      const distance = Math.hypot(dx, dy);
      const max = stick.r - stick.knobR;
      const ratio = distance > max ? max / Math.max(1, distance) : 1;
      knobX = stick.x + dx * ratio;
      knobY = stick.y + dy * ratio;
    }

    ctx.save();

    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.strokeStyle = 'rgba(255,255,255,0.34)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(stick.x, stick.y, stick.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.20)';
    ctx.strokeStyle = 'rgba(255,255,255,0.42)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(knobX, knobY, stick.knobR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(150,0,0,0.32)';
    ctx.strokeStyle = 'rgba(255,255,255,0.48)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(attack.x, attack.y, attack.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 23px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 4;
    ctx.strokeText('УДАР', attack.x, attack.y);
    ctx.fillText('УДАР', attack.x, attack.y);

    ctx.restore();
  }
};