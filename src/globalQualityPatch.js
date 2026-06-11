(function () {
  if (typeof GameApp === 'undefined') return;

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

  const originalHandleSpeakerClick = GameApp.prototype.handleSpeakerClick;
  GameApp.prototype.handleSpeakerClick = function (point) {
    const rect = this.getSpeakerHitRect ? this.getSpeakerHitRect() : this.getSpeakerRect();
    if (!rect || !point) return false;
    if (point.x < rect.x || point.x > rect.x + rect.w || point.y < rect.y || point.y > rect.y + rect.h) return false;

    AudioManager.unlock();
    const musicOn = AudioManager.toggleMusic();

    if (this.state === 'intro' && this.intro) {
      if (this.syncIntroVoiceVolume) this.syncIntroVoiceVolume();
      if (!musicOn && this.intro.voice) {
        this.intro.voice.volume = 0;
      }
      if (musicOn && this.intro.voice && this.intro.voice.paused && !this.intro.readyToContinue) {
        this.intro.voice.play().catch(() => {});
      }
    } else if (musicOn && this.isMenuState && this.isMenuState(this.state)) {
      this.ensureMenuMusic();
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
