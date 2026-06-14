const MobileControls = {
  active: false,
  heldKeys: {},
  moveOrigin: null,

  topSafeY() {
    return 96;
  },

  movementZone() {
    return { x: 0, y: this.topSafeY(), w: GAME_CONFIG.width / 2, h: GAME_CONFIG.height - this.topSafeY() };
  },

  attackZone() {
    return { x: GAME_CONFIG.width / 2, y: this.topSafeY(), w: GAME_CONFIG.width / 2, h: GAME_CONFIG.height - this.topSafeY() };
  },

  shouldShow(game) {
    return !!(Responsive.isTouchDevice && game && game.state === 'level' && game.scene);
  },

  setHeldKey(key, value) {
    if (this.heldKeys[key] === value) return;
    this.heldKeys[key] = value;
    Input.setVirtualKey(key, value);
  },

  releaseHeldKeys() {
    for (const key of Object.keys(this.heldKeys)) {
      if (this.heldKeys[key]) Input.setVirtualKey(key, false);
    }
    this.heldKeys = {};
  },

  applyDesiredKeys(desired) {
    const keys = ['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'space'];
    for (const key of keys) this.setHeldKey(key, !!desired[key]);
  },

  pointInRect(point, rect) {
    return point && point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  },

  update(game) {
    this.active = this.shouldShow(game);
    if (!this.active) {
      this.moveOrigin = null;
      this.releaseHeldKeys();
      return;
    }

    const desired = {};
    const p = Input.pointer;

    if (!p.down || p.y < this.topSafeY()) {
      this.moveOrigin = null;
      this.applyDesiredKeys(desired);
      return;
    }

    if (this.pointInRect(p, this.attackZone())) {
      this.moveOrigin = null;
      desired.space = true;
      this.applyDesiredKeys(desired);
      return;
    }

    if (this.pointInRect(p, this.movementZone())) {
      if (!this.moveOrigin) this.moveOrigin = { x: p.x, y: p.y };

      const dx = p.x - this.moveOrigin.x;
      const dy = p.y - this.moveOrigin.y;
      const distance = Math.hypot(dx, dy);
      const dead = 18;

      if (distance > dead) {
        const nx = dx / Math.max(1, distance);
        const ny = dy / Math.max(1, distance);
        const horizontal = Math.abs(nx);
        const vertical = Math.abs(ny);

        if (horizontal > 0.22) desired[nx < 0 ? 'arrowleft' : 'arrowright'] = true;
        if (vertical > 0.30) desired[ny < 0 ? 'arrowup' : 'arrowdown'] = true;
      }
    } else {
      this.moveOrigin = null;
    }

    this.applyDesiredKeys(desired);
  },

  getStick() {
    const origin = this.moveOrigin || { x: 160, y: GAME_CONFIG.height - 132 };
    return { x: origin.x, y: origin.y, r: 74, knobR: 30 };
  },

  getDpad() {
    return this.getStick();
  },

  getAttackButton() {
    return { x: GAME_CONFIG.width * 0.75, y: GAME_CONFIG.height - 132, r: 74 };
  },

  pointInCircle(point, circle) {
    const dx = point.x - circle.x;
    const dy = point.y - circle.y;
    return dx * dx + dy * dy <= circle.r * circle.r;
  },

  draw(ctx, game) {
    if (!this.shouldShow(game)) return;

    const moveZone = this.movementZone();
    const attackZone = this.attackZone();
    const attack = this.getAttackButton();
    const p = Input.pointer;
    const stick = this.getStick();
    let knobX = stick.x;
    let knobY = stick.y;

    if (Input.pointer.down && this.moveOrigin && this.pointInRect(p, moveZone)) {
      const dx = p.x - stick.x;
      const dy = p.y - stick.y;
      const distance = Math.hypot(dx, dy);
      const max = stick.r - stick.knobR;
      const ratio = distance > max ? max / Math.max(1, distance) : 1;
      knobX = stick.x + dx * ratio;
      knobY = stick.y + dy * ratio;
    }

    ctx.save();

    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    ctx.fillRect(moveZone.x, moveZone.y, moveZone.w, moveZone.h);
    ctx.fillStyle = 'rgba(150,0,0,0.045)';
    ctx.fillRect(attackZone.x, attackZone.y, attackZone.w, attackZone.h);

    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(GAME_CONFIG.width / 2, this.topSafeY());
    ctx.lineTo(GAME_CONFIG.width / 2, GAME_CONFIG.height);
    ctx.stroke();

    if (this.moveOrigin) {
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.strokeStyle = 'rgba(255,255,255,0.34)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(stick.x, stick.y, stick.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.strokeStyle = 'rgba(255,255,255,0.44)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(knobX, knobY, stick.knobR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

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

    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.strokeStyle = 'rgba(0,0,0,0.65)';
    ctx.lineWidth = 3;
    ctx.strokeText('ДВИЖЕНИЕ', moveZone.x + moveZone.w / 2, GAME_CONFIG.height - 34);
    ctx.fillText('ДВИЖЕНИЕ', moveZone.x + moveZone.w / 2, GAME_CONFIG.height - 34);

    ctx.restore();
  }
};
