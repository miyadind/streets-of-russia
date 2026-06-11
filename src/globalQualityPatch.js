(function () {
  if (typeof GameApp === 'undefined') return;

  const originalStartIntro = GameApp.prototype.startIntro;
  GameApp.prototype.startIntro = function () {
    originalStartIntro.call(this);

    if (!this.intro.firstRun) {
      this.intro.fastForward = true;
      this.intro.readyToContinue = true;
      this.intro.time = Number.MAX_SAFE_INTEGER / 1000;
      this.intro.readerScroll = 0;
    }
  };

  const originalHandleSpeakerClick = GameApp.prototype.handleSpeakerClick;
  GameApp.prototype.handleSpeakerClick = function (point) {
    const rect = this.getSpeakerHitRect ? this.getSpeakerHitRect() : this.getSpeakerRect();
    if (!rect || !point) return false;
    if (point.x < rect.x || point.x > rect.x + rect.w || point.y < rect.y || point.y > rect.y + rect.h) return false;

    AudioManager.unlock();
    const musicOn = AudioManager.toggleMusic();

    if (!musicOn && this.state === 'intro' && this.intro && this.intro.music) {
      try {
        this.intro.music.pause();
        this.intro.music.currentTime = 0;
      } catch (error) {}
    }

    if (musicOn) {
      if (this.state === 'intro' && this.playIntroMusic) this.playIntroMusic();
      else if (this.isMenuState && this.isMenuState(this.state)) this.ensureMenuMusic();
    }

    AudioManager.playSfx('menuSelect', 0.7);
    return true;
  };

  const originalUpdate = GameApp.prototype.update;
  GameApp.prototype.update = function (dt) {
    if (this.state === 'intro') {
      const click = Input.consumePointer();
      if (click) {
        if (this.handleSpeakerClick(click)) return;
        Input.restorePointer(click);
      }
    }

    originalUpdate.call(this, dt);
  };

  const originalDraw = GameApp.prototype.draw;
  GameApp.prototype.draw = function () {
    originalDraw.call(this);

    if (Responsive.isPortrait || this.state === 'loading') return;
    if (this.state === 'intro' || this.state === 'splash') {
      this.drawSpeaker(this.ctx);
    }
  };
})();
