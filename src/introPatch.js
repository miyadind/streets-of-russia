(() => {
  if (typeof Intro === 'undefined' || typeof GameApp === 'undefined' || typeof Menu === 'undefined') {
    console.warn('Intro patch skipped: required globals are missing.');
    return;
  }

  const originalActivate = Menu.activate.bind(Menu);
  Menu.activate = function activateWithIntro(game) {
    const item = this.items[this.selectedIndex];
    if (item === 'НОВАЯ ИГРА') {
      AudioManager.playSfx('menuSelect', 0.85);
      Intro.reset();
      game.setState('intro');
      return;
    }
    originalActivate(game);
  };

  const originalIsMenuState = GameApp.prototype.isMenuState;
  GameApp.prototype.isMenuState = function isMenuStateWithIntro(state) {
    return state === 'intro' || originalIsMenuState.call(this, state);
  };

  const originalUpdate = GameApp.prototype.update;
  GameApp.prototype.update = function updateWithIntro(dt) {
    if (Responsive.isPortrait) return;

    if (this.state === 'intro') {
      DevPanel.update(this);

      const click = Input.consumePointer();
      if (click && this.handleSpeakerClick(click)) return;
      if (click) Input.restorePointer(click);

      if (DevPanel.open) return;
      Intro.update(this, dt);
      return;
    }

    originalUpdate.call(this, dt);
  };

  const originalDraw = GameApp.prototype.draw;
  GameApp.prototype.draw = function drawWithIntro() {
    if (this.state !== 'intro') {
      originalDraw.call(this);
      return;
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    if (Responsive.isPortrait) {
      this.drawRotateWarning(ctx);
      return;
    }

    Intro.draw(ctx, this.images);
    this.drawSpeaker(ctx);
    DevPanel.draw(ctx);
  };
})();
