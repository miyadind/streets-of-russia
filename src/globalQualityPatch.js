(function () {
  if (typeof GameApp === 'undefined') return;

  const REPEAT_INTRO_SKIP_DELAY_SECONDS = 3;

  if (typeof Assets !== 'undefined') {
    Assets.enemyAppear = Object.assign({
      dogRegime: null,
      zetnik: 'assets/enemies/zetnik/Appear.mp3',
      sucker: null,
      bastard: null
    }, Assets.enemyAppear || {});
  }

  if (typeof AudioManager !== 'undefined' && !AudioManager.enemyAppearPatchApplied) {
    const originalAudioInit = AudioManager.init;
    AudioManager.init = function () {
      originalAudioInit.call(this);
      for (const [enemyType, src] of Object.entries((Assets && Assets.enemyAppear) || {})) {
        if (!src) continue;
        this.sfx[enemyType + 'Appear'] = this.createAudio(src, false);
      }
    };
    AudioManager.enemyAppearPatchApplied = true;
  }

  function loadOptionalImage(src) {
    return new Promise((resolve) => {
      if (!src) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn('Missing image:', src);
        resolve(null);
      };
      img.src = src;
    });
  }

  const originalLoadImages = GameApp.prototype.loadImages;
  GameApp.prototype.loadImages = async function () {
    const loaded = await originalLoadImages.call(this);
    const fly = await loadOptionalImage(Assets.zetnik && Assets.zetnik.fly);
    const preparing = await loadOptionalImage(Assets.zetnik && Assets.zetnik.preparing);
    const crashed = await loadOptionalImage(Assets.zetnik && Assets.zetnik.crashed);

    if (loaded.enemies && loaded.enemies.zetnik) {
      loaded.enemies.zetnik.preparing = preparing || loaded.enemies.zetnik.attack[0] || loaded.enemies.zetnik.idle;
      loaded.enemies.zetnik.fly = fly || loaded.enemies.zetnik.attack[0] || loaded.enemies.zetnik.idle;
      loaded.enemies.zetnik.crashed = crashed || loaded.enemies.zetnik.dead || loaded.enemies.zetnik.attack[0] || loaded.enemies.zetnik.idle;
      loaded.enemies.zetnik.dead = loaded.enemies.zetnik.crashed;
    }
    return loaded;
  };

  const originalStartIntro = GameApp.prototype.startIntro;
  GameApp.prototype.startIntro = function () {
    originalStartIntro.call(this);

    if (!this.intro.firstRun) {
      this.intro.fastForward = false;
      this.intro.readyToContinue = false;
      this.intro.repeatPreview = true;
      this.intro.repeatPreviewTime = 0;
      this.intro.readerScroll = 0;
    }
  };

  const originalUpdateIntro = GameApp.prototype.updateIntro;
  GameApp.prototype.updateIntro = function (dt) {
    if (this.intro && this.intro.repeatPreview && !this.intro.readyToContinue) {
      const click = Input.consumePointer();
      const anyKey = Input.consumeAnyKey();
      if (click) {
        if (this.handleSpeakerClick(click)) return;
        Input.restorePointer(click);
      }

      this.intro.repeatPreviewTime += dt / 1000;
      this.intro.time += dt / 1000;

      if (anyKey && this.intro.repeatPreviewTime >= REPEAT_INTRO_SKIP_DELAY_SECONDS) {
        this.intro.repeatPreview = false;
        this.intro.readyToContinue = true;
        this.intro.time = Number.MAX_SAFE_INTEGER / 1000;
        this.intro.readerScroll = 0;
      }
      return;
    }

    originalUpdateIntro.call(this, dt);
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
