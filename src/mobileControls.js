const MobileControls = {
  active: false,
  heldKeys: {},
  moveOrigin: null,
  moveTouchId: null,
  attackTouchId: null,

  topSafeY() {
    return 96;
  },

  attackButton() {
    return { x: GAME_CONFIG.width - 92, y: 164, r: 44, hitR: 104 };
  },

  movementStartZone() {
    return { x: 0, y: this.topSafeY(), w: GAME_CONFIG.width, h: GAME_CONFIG.height - this.topSafeY() };
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

  pointInCircle(point, circle, radiusOverride) {
    const r = radiusOverride || circle.r;
    const dx = point.x - circle.x;
    const dy = point.y - circle.y;
    return dx * dx + dy * dy <= r * r;
  },

  getTouches() {
    if (Input.touches && Input.touches.length) return Input.touches;
    return Input.pointer && Input.pointer.down ? [{ id: 'pointer', x: Input.pointer.x, y: Input.pointer.y, justDown: Input.pointer.justDown }] : [];
  },

  findTouch(id, touches) {
    return touches.find(touch => touch.id === id) || null;
  },

  resetTouchState() {
    this.moveOrigin = null;
    this.moveTouchId = null;
    this.attackTouchId = null;
  },

  update(game) {
    this.active = this.shouldShow(game);
    if (!this.active) {
      this.resetTouchState();
      this.releaseHeldKeys();
      return;
    }

    const desired = {};
    const touches = this.getTouches().filter(touch => touch.y >= this.topSafeY());
    const attack = this.attackButton();

    if (!touches.length) {
      this.resetTouchState();
      this.applyDesiredKeys(desired);
      return;
    }

    let moveTouch = this.findTouch(this.moveTouchId, touches);
    let attackTouch = this.findTouch(this.attackTouchId, touches);

    if (!moveTouch) {
      this.moveTouchId = null;
      this.moveOrigin = null;
    }

    if (!attackTouch) {
      this.attackTouchId = null;
    }

    for (const touch of touches) {
      if (!this.attackTouchId && touch.id !== this.moveTouchId && this.pointInCircle(touch, attack, attack.hitR)) {
        this.attackTouchId = touch.id;
        attackTouch = touch;
      }
    }

    for (const touch of touches) {
      if (!this.moveTouchId && touch.id !== this.attackTouchId && this.pointInRect(touch, this.movementStartZone())) {
        this.moveTouchId = touch.id;
        this.moveOrigin = { x: touch.x, y: touch.y };
        moveTouch = touch;
      }
    }

    if (attackTouch) desired.space = true;

    if (moveTouch && this.moveOrigin) {
      const dx = moveTouch.x - this.moveOrigin.x;
      const dy = moveTouch.y - this.moveOrigin.y;
      const distance = Math.hypot(dx, dy);
      const dead = 16;

      if (distance > dead) {
        const nx = dx / Math.max(1, distance);
        const ny = dy / Math.max(1, distance);
        const horizontal = Math.abs(nx);
        const vertical = Math.abs(ny);

        if (horizontal > 0.20) desired[nx < 0 ? 'arrowleft' : 'arrowright'] = true;
        if (vertical > 0.28) desired[ny < 0 ? 'arrowup' : 'arrowdown'] = true;
      }
    }

    this.applyDesiredKeys(desired);
  },

  getStick() {
    const origin = this.moveOrigin || { x: 160, y: GAME_CONFIG.height - 132 };
    return { x: origin.x, y: origin.y, r: 78, knobR: 30 };
  },

  getDpad() {
    return this.getStick();
  },

  getAttackButton() {
    const button = this.attackButton();
    return { x: button.x, y: button.y, r: button.hitR };
  },

  draw(ctx, game) {
    if (!this.shouldShow(game)) return;

    const touches = this.getTouches();
    const moveTouch = this.findTouch(this.moveTouchId, touches);
    const stick = this.getStick();
    const attack = this.attackButton();
    let knobX = stick.x;
    let knobY = stick.y;

    if (moveTouch && this.moveOrigin) {
      const dx = moveTouch.x - stick.x;
      const dy = moveTouch.y - stick.y;
      const distance = Math.hypot(dx, dy);
      const max = stick.r - stick.knobR;
      const ratio = distance > max ? max / Math.max(1, distance) : 1;
      knobX = stick.x + dx * ratio;
      knobY = stick.y + dy * ratio;
    }

    ctx.save();

    if (this.moveOrigin) {
      ctx.fillStyle = 'rgba(255,255,255,0.055)';
      ctx.strokeStyle = 'rgba(255,255,255,0.24)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(stick.x, stick.y, stick.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.strokeStyle = 'rgba(255,255,255,0.34)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(knobX, knobY, stick.knobR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = this.attackTouchId ? 'rgba(150,0,0,0.28)' : 'rgba(150,0,0,0.11)';
    ctx.strokeStyle = this.attackTouchId ? 'rgba(255,255,255,0.48)' : 'rgba(255,255,255,0.20)';
    ctx.lineWidth = this.attackTouchId ? 4 : 2;
    ctx.beginPath();
    ctx.arc(attack.x, attack.y, attack.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = this.attackTouchId ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(attack.x, attack.y, attack.hitR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = 'bold 17px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.52)';
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 3;
    ctx.strokeText('УДАР', attack.x, attack.y);
    ctx.fillText('УДАР', attack.x, attack.y);

    ctx.restore();
  }
};
