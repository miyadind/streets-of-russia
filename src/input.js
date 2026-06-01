const Input = {
  keys: {},
  just: {},
  pointer: { x: 0, y: 0, down: false, justDown: false },

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

    canvas.addEventListener('pointerdown', (event) => {
      const pos = Responsive.screenToGame(event.clientX, event.clientY);
      this.pointer.x = pos.x;
      this.pointer.y = pos.y;
      this.pointer.down = true;
      this.pointer.justDown = true;
    });

    canvas.addEventListener('pointermove', (event) => {
      const pos = Responsive.screenToGame(event.clientX, event.clientY);
      this.pointer.x = pos.x;
      this.pointer.y = pos.y;
    });

    window.addEventListener('pointerup', () => {
      this.pointer.down = false;
    });
  },

  normalizeKey(event) {
    if (event.code === 'Space') return 'space';
    if (event.code === 'Backquote') return 'dev';
    if (event.key === 'Escape') return 'escape';
    if (event.key === 'Enter') return 'enter';
    return event.key.toLowerCase();
  },

  pressed(key) {
    return !!this.keys[key];
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