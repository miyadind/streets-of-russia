const Input = {
  keys: {},
  virtualKeys: {},
  just: {},
  pointer: { x: 0, y: 0, down: false, justDown: false },
  lastTouchAt: 0,

  init(canvas) {
    window.addEventListener('keydown', (event) => {
      const key = this.normalizeKey(event);
      if (!this.keys[key]) this.just[key] = true;
      this.just.any = true;
      this.keys[key] = true;

      if (event.code === 'Backquote') {
        this.just.dev = true;
        this.keys.dev = true;
        event.preventDefault();
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(event.key)) event.preventDefault();
    });

    window.addEventListener('keyup', (event) => {
      const key = this.normalizeKey(event);
      this.keys[key] = false;
      if (event.code === 'Backquote') this.keys.dev = false;
    });

    const setPointerFromClient = (clientX, clientY, justDown = false) => {
      const pos = Responsive.screenToGame(clientX, clientY);
      this.pointer.x = pos.x;
      this.pointer.y = pos.y;
      if (justDown) {
        this.pointer.down = true;
        this.pointer.justDown = true;
        this.just.any = true;
      }
    };

    const getPrimaryTouch = (event) => {
      if (event.changedTouches && event.changedTouches.length > 0) return event.changedTouches[0];
      if (event.touches && event.touches.length > 0) return event.touches[0];
      return null;
    };

    canvas.addEventListener('touchstart', (event) => {
      if (event.cancelable) event.preventDefault();
      const touch = getPrimaryTouch(event);
      if (!touch) return;
      this.lastTouchAt = performance.now();
      setPointerFromClient(touch.clientX, touch.clientY, true);
    }, { passive: false });

    canvas.addEventListener('touchmove', (event) => {
      if (event.cancelable) event.preventDefault();
      const touch = getPrimaryTouch(event);
      if (!touch) return;
      this.lastTouchAt = performance.now();
      setPointerFromClient(touch.clientX, touch.clientY, false);
    }, { passive: false });

    canvas.addEventListener('touchend', (event) => {
      if (event.cancelable) event.preventDefault();
      this.lastTouchAt = performance.now();
      this.pointer.down = false;
      this.clearVirtualKeys();
    }, { passive: false });

    canvas.addEventListener('contextmenu', (event) => event.preventDefault());

    canvas.addEventListener('pointerdown', (event) => {
      if (performance.now() - this.lastTouchAt < 450) return;
      if (event.cancelable) event.preventDefault();
      if (canvas.setPointerCapture && event.pointerId != null) {
        try { canvas.setPointerCapture(event.pointerId); } catch (error) {}
      }
      setPointerFromClient(event.clientX, event.clientY, true);
    }, { passive: false });

    canvas.addEventListener('pointermove', (event) => {
      if (performance.now() - this.lastTouchAt < 450) return;
      if (event.cancelable) event.preventDefault();
      setPointerFromClient(event.clientX, event.clientY, false);
    }, { passive: false });

    window.addEventListener('pointerup', (event) => {
      if (event && event.cancelable) event.preventDefault();
      this.pointer.down = false;
      this.clearVirtualKeys();
    }, { passive: false });
  },

  normalizeKey(event) {
    if (event.code === 'Space') return 'space';
    if (event.code === 'Backquote') return 'dev';
    if (event.key === 'Escape') return 'escape';
    if (event.key === 'Enter') return 'enter';
    return event.key.toLowerCase();
  },

  pressed(key) {
    return !!this.keys[key] || !!this.virtualKeys[key];
  },

  setVirtualKey(key, value) {
    const wasDown = !!this.virtualKeys[key];
    this.virtualKeys[key] = !!value;
    if (value && !wasDown) {
      this.just[key] = true;
      this.just.any = true;
    }
  },

  clearVirtualKeys() {
    this.virtualKeys = {};
  },

  consume(key) {
    const value = !!this.just[key];
    this.just[key] = false;
    return value;
  },

  consumeAnyKey() {
    const value = !!this.just.any;
    this.just.any = false;
    return value;
  },

  consumePointer() {
    const value = this.pointer.justDown ? { x: this.pointer.x, y: this.pointer.y } : null;
    this.pointer.justDown = false;
    return value;
  },

  restorePointer(point) {
    if (!point) return;
    this.pointer.x = point.x;
    this.pointer.y = point.y;
    this.pointer.justDown = true;
  },

  endFrame() {
    this.just = {};
    this.pointer.justDown = false;
  }
};