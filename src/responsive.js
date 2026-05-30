const Responsive = {
  canvas: null,
  ctx: null,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  cssWidth: GAME_CONFIG.width,
  cssHeight: GAME_CONFIG.height,
  isPortrait: false,

  init(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 120));
    this.resize();
  },

  resize() {
    const gameW = GAME_CONFIG.width;
    const gameH = GAME_CONFIG.height;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));

    this.isPortrait = vw < vh && vw < 900;

    const scale = Math.min(vw / gameW, vh / gameH);
    this.scale = scale;
    this.cssWidth = Math.round(gameW * scale);
    this.cssHeight = Math.round(gameH * scale);
    this.offsetX = Math.round((vw - this.cssWidth) / 2);
    this.offsetY = Math.round((vh - this.cssHeight) / 2);

    this.canvas.style.width = this.cssWidth + 'px';
    this.canvas.style.height = this.cssHeight + 'px';
    this.canvas.style.marginLeft = this.offsetX + 'px';
    this.canvas.style.marginTop = this.offsetY + 'px';

    this.canvas.width = Math.round(gameW * dpr);
    this.canvas.height = Math.round(gameH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  },

  screenToGame(clientX, clientY) {
    return {
      x: (clientX - this.offsetX) / this.scale,
      y: (clientY - this.offsetY) / this.scale
    };
  }
};