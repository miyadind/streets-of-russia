const MobileControls = {
  active: false,
  heldKeys: {},
  moveOrigin: null,
  moveTouchId: null,

  topSafeY() {
    return 96;
  },

  attackButton() {
    return { x: GAME_CONFIG.width - 92, y: 164, r: 44, hitR: 104 };
  },

  movementStartZone() {
    return { x: 0, y: this.topSafeY(), w: GAME_CONFIG.width * 0.58, h: GAME_CONFIG.height - this.topSafeY() };
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

  resetTouchState() {
    this.moveOrigin = null;
    this.moveTouchId = null;
  },

  getTouches() {
    return Input.touches && Input.touches.length ? Input.touches : [];
  },

  getTouchById(id) {
    if (id == null) return null;
    return this.getTouches().find(touch => touch.id === id) || null;
  },

  findNewMoveTouch() {
    const attack = this.attackButton();
    return this.getTouches().find(touch => (
      touch.justDown &&
      this.pointInRect(touch, this.movementStartZone()) &&
      !this.pointInCircle(touch, attack, attack.hitR)
    )) || null;
  },

  hasAttackTouch() {
    const attack = this.attackButton();
    const touches = this.getTouches();
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      if (touch.y < this.topSafeY()) continue;
      if (this.pointInCircle(touch, attack, attack.hitR)) return true;
    }
    return false;
  },

  update(game) {
    this.active = this.shouldShow(game);
    if (!this.active) {
      this.resetTouchState();
      this.releaseHeldKeys();
      return;
    }

    const desired = {};

    if (this.hasAttackTouch()) desired.space = true;

    let moveTouch = this.getTouchById(this.moveTouchId);
    if (!moveTouch) {
      this.moveTouchId = null;
      this.moveOrigin = null;
      moveTouch = this.findNewMoveTouch();
      if (moveTouch) {
        this.moveTouchId = moveTouch.id;
        this.moveOrigin = { x: moveTouch.x, y: moveTouch.y };
      }
    }

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

    const moveTouch = this.getTouchById(this.moveTouchId);
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

    const attackPressed = this.hasAttackTouch();
    ctx.fillStyle = attackPressed ? 'rgba(150,0,0,0.28)' : 'rgba(150,0,0,0.11)';
    ctx.strokeStyle = attackPressed ? 'rgba(255,255,255,0.48)' : 'rgba(255,255,255,0.20)';
    ctx.lineWidth = attackPressed ? 4 : 2;
    ctx.beginPath();
    ctx.arc(attack.x, attack.y, attack.r, 0, Math.PI * 2);
    ctx.fill();
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
