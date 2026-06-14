const Input = {
  keys: {},
  virtualKeys: {},
  just: {},
  pointer: { x: 0, y: 0, down: false, justDown: false },
  touches: [],
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

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(event.key) ||
          ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(event.code)) event.preventDefault();
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

    const syncTouches = (touchList, changedTouchList = null, markChangedAsJustDown = false) => {
      const changedIds = new Set();
      if (changedTouchList) {
        for (let i = 0; i < changedTouchList.length; i++) changedIds.add(changedTouchList[i].identifier);
      }

      this.touches = [];
      for (let i = 0; i < touchList.length; i++) {
        const touch = touchList[i];
        const pos = Responsive.screenToGame(touch.clientX, touch.clientY);
        const justDown = markChangedAsJustDown && changedIds.has(touch.identifier);
        this.touches.push({ id: touch.identifier, x: pos.x, y: pos.y, justDown });
      }

      const first = this.touches[0];
      this.pointer.down = this.touches.length > 0;
      if (first) {
        this.pointer.x = first.x;
        this.pointer.y = first.y;
        if (markChangedAsJustDown && first.justDown) this.pointer.justDown = true;
      }
    };

    canvas.addEventListener('touchstart', (event) => {
      if (event.cancelable) event.preventDefault();
      const touch = getPrimaryTouch(event);
      if (!touch) return;
      this.lastTouchAt = performance.now();
      syncTouches(event.touches, event.changedTouches, true);
      setPointerFromClient(touch.clientX, touch.clientY, true);
    }, { passive: false });

    canvas.addEventListener('touchmove', (event) => {
      if (event.cancelable) event.preventDefault();
      const touch = getPrimaryTouch(event);
      if (!touch) return;
      this.lastTouchAt = performance.now();
      syncTouches(event.touches, event.changedTouches, false);
      const first = event.touches && event.touches.length ? event.touches[0] : touch;
      setPointerFromClient(first.clientX, first.clientY, false);
    }, { passive: false });

    const handleTouchEnd = (event) => {
      if (event.cancelable) event.preventDefault();
      this.lastTouchAt = performance.now();
      syncTouches(event.touches || [], event.changedTouches, false);
      if (!event.touches || event.touches.length === 0) {
        this.pointer.down = false;
        this.pointer.justDown = false;
        this.clearVirtualKeys();
      }
    };

    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

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
    if (event.code === 'KeyW') return 'w';
    if (event.code === 'KeyA') return 'a';
    if (event.code === 'KeyS') return 's';
    if (event.code === 'KeyD') return 'd';
    if (event.code === 'Space') return 'space';
    if (event.code === 'Backquote') return 'dev';
    if (event.key === 'Escape') return 'escape';
    if (event.key === 'Enter') return 'enter';
    return String(event.key || '').toLowerCase();
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
    for (const touch of this.touches) touch.justDown = false;
  }
};
