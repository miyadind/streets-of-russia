(function () {
  if (typeof CampaignMapScreen === 'undefined') {
    console.warn('CampaignMapScreen is not loaded');
    return;
  }

  const originalInit = GameApp.prototype.init;
  GameApp.prototype.init = async function () {
    CampaignMapScreen.init();
    this.campaignMap = CampaignMapScreen;
    await originalInit.call(this);
  };

  const originalIsMenuState = GameApp.prototype.isMenuState;
  GameApp.prototype.isMenuState = function (state) {
    return state === 'campaignMap' || originalIsMenuState.call(this, state);
  };

  const originalUpdate = GameApp.prototype.update;
  GameApp.prototype.update = function (dt) {
    if (Responsive.isPortrait) return;

    if (this.state !== 'campaignMap') {
      originalUpdate.call(this, dt);
      return;
    }

    DevPanel.update(this);

    const click = Input.consumePointer();
    if (click && this.handleSpeakerClick(click)) return;
    if (click) Input.restorePointer(click);

    if (DevPanel.open) return;

    this.campaignMap.update(this, dt);
  };

  const originalDraw = GameApp.prototype.draw;
  GameApp.prototype.draw = function () {
    if (this.state !== 'campaignMap') {
      originalDraw.call(this);
      return;
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    if (Responsive.isPortrait) {
      this.drawRotateWarning(ctx);
      return;
    }

    this.campaignMap.draw(ctx);
    this.drawSpeaker(ctx);
    DevPanel.draw(ctx);
  };

  const originalMenuActivate = Menu.activate;
  Menu.activate = function (game) {
    const item = this.items[this.selectedIndex];
    if (item === 'НОВАЯ ИГРА') {
      AudioManager.playSfx('menuSelect', 0.85);
      game.setState('campaignMap');
      return;
    }

    originalMenuActivate.call(this, game);
  };

  const originalNextScreen = LevelScene.prototype.nextScreen;
  LevelScene.prototype.nextScreen = function () {
    if (this.screenIndex < this.images.streets.length - 1) {
      originalNextScreen.call(this);
      return;
    }

    this.game.completeCampaignRegion();
  };

  GameApp.prototype.completeCampaignRegion = function () {
    this.campaignMap.completeActiveRegion();
    this.setState('campaignMap');
    this.ensureMenuMusic();
  };
})();
