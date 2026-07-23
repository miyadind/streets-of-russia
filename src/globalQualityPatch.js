(function () {
  if (typeof GameApp === 'undefined') return;

  const ENEMY_SOUND_FOLDERS = {
    dogRegime: null,
    zetnik: 'zetnik',
    sucker: 'sucker',
    bastard: 'bastard'
  };

  function getAssetDirectory(src) {
    if (!src || typeof src !== 'string' || src.indexOf('/') === -1) return null;
    return src.slice(0, src.lastIndexOf('/'));
  }

  function getHeroHitSrc(heroKey) {
    const heroAssets = Assets && Assets[heroKey];
    const dir = getAssetDirectory(heroAssets && heroAssets.idle);
    return dir ? dir + '/Hit.mp3' : null;
  }

  function getEnemyAppearSrc(enemyType) {
    if (ENEMY_SOUND_FOLDERS[enemyType] === null) return null;
    const folder = ENEMY_SOUND_FOLDERS[enemyType] || enemyType;
    return 'assets/enemies/' + folder + '/Appear.mp3';
  }

  function isUsableSfxKey(key) {
    const audio = AudioManager && AudioManager.sfx && AudioManager.sfx[key];
    return !!audio && (!audio.dataset || audio.dataset.failed !== 'true');
  }

  if (typeof GAME_CONFIG !== 'undefined') {
    GAME_CONFIG.playerHurtFreezeMs = GAME_CONFIG.playerHurtFreezeMs || 280;
  }

  if (typeof Assets !== 'undefined') {
    const enemyAppear = {};
    for (const enemyType of Object.keys((GAME_CONFIG && GAME_CONFIG.enemies) || {})) {
      enemyAppear[enemyType] = getEnemyAppearSrc(enemyType);
    }
    Assets.enemyAppear = Object.assign(enemyAppear, Assets.enemyAppear || {});

    const heroHit = {};
    for (const heroKey of Object.keys((GAME_CONFIG && GAME_CONFIG.heroes) || {})) {
      heroHit[heroKey] = getHeroHitSrc(heroKey);
    }
    Assets.heroHit = Object.assign(heroHit, Assets.heroHit || {});
  }

  if (typeof AudioManager !== 'undefined' && !AudioManager.optionalCharacterAudioPatchApplied) {
    const originalAudioInit = AudioManager.init;
    AudioManager.init = function () {
      originalAudioInit.call(this);

      for (const [enemyType, src] of Object.entries((Assets && Assets.enemyAppear) || {})) {
        if (!src) continue;
        this.sfx[enemyType + 'Appear'] = this.createAudio(src, false);
      }

      for (const [heroKey, src] of Object.entries((Assets && Assets.heroHit) || {})) {
        if (!src) continue;
        this.sfx[heroKey + 'Hit'] = this.createAudio(src, false);
      }
    };
    AudioManager.optionalCharacterAudioPatchApplied = true;
  }

  if (typeof LevelScene !== 'undefined' && !LevelScene.enemyAppearAudioPatchApplied) {
    LevelScene.prototype.getWaveAppearKey = function (wave) {
      for (const group of wave.enemies || []) {
        if (group.type === 'dogRegime') continue;
        const key = group.type + 'Appear';
        if (isUsableSfxKey(key)) return key;
      }
      return null;
    };

    LevelScene.prototype.getWaveAppearDelayMs = function (wave) {
      if (wave.appearDelayMs != null) return Math.max(0, Number(wave.appearDelayMs) || 0);
      const key = this.getWaveAppearKey(wave);
      return key === 'zetnikAppear' ? 850 : 0;
    };

    LevelScene.enemyAppearAudioPatchApplied = true;
  }

  if (typeof Player !== 'undefined' && !Player.hurtFreezePatchApplied) {
    const originalPlayerUpdate = Player.prototype.update;
    Player.prototype.update = function (dt, scene) {
      if (this.state === 'hurt') {
        this.hurtTimer = Math.max(0, (this.hurtTimer || 0) - dt);
        this.x = Math.max(70, Math.min(GAME_CONFIG.width - 70, this.x));
        this.y = Math.max(GAME_CONFIG.laneTop, Math.min(GAME_CONFIG.laneBottom, this.y));
        if (this.hurtTimer <= 0) {
          this.state = 'idle';
          this.hurtTimer = 0;
        }
        return;
      }

      originalPlayerUpdate.call(this, dt, scene);
    };

    const originalReceiveDamage = Player.prototype.receiveDamage;
    Player.prototype.receiveDamage = function (amount, options = {}) {
      const wasAlive = this.hp > 0;
      const hit = originalReceiveDamage.call(this, amount, options);

      if (hit && wasAlive && this.hp > 0 && this.state !== 'knockdown' && this.state !== 'pinned') {
        this.state = 'hurt';
        this.hurtTimer = Math.max(0, options.hurtFreezeMs || GAME_CONFIG.playerHurtFreezeMs || 280);
        this.attackTimer = 0;
        this.attackHasHit = false;
        this.comboStep = 0;
        this.comboTimer = 0;

        const hitKey = this.heroKey + 'Hit';
        if (isUsableSfxKey(hitKey)) {
          AudioManager.playSfx(hitKey, 0.92, { startAt: 0.01 });
        }
      }

      return hit;
    };

    const originalStartAttack = Player.prototype.startAttack;
    Player.prototype.startAttack = function () {
      if (this.state === 'hurt') return;
      originalStartAttack.call(this);
    };

    const originalGetImage = Player.prototype.getImage;
    Player.prototype.getImage = function () {
      if (this.state === 'hurt') {
        const heroImages = this.getHeroImages();
        return heroImages.hit || heroImages.idle;
      }
      return originalGetImage.call(this);
    };

    Player.hurtFreezePatchApplied = true;
  }

  if (typeof DogRegimeEnemy !== 'undefined' && !DogRegimeEnemy.prototype.attackRangeBindingPatchApplied) {
    DogRegimeEnemy.prototype.getClubReachBox = function () {
      const minX = Math.max(0, this.attackMinDistanceX || 0);
      const maxX = Math.max(minX + 1, this.attackRangeX || GAME_CONFIG.enemyAttackRangeX || 76);
      const rangeY = Math.max(1, this.attackRangeY || GAME_CONFIG.enemyAttackRangeY || 36);
      return {
        x: this.facing === 1 ? this.x + minX : this.x - maxX,
        y: this.y - rangeY,
        w: maxX - minX,
        h: rangeY * 2
      };
    };

    DogRegimeEnemy.prototype.canClubReachPlayer = function (player, anticipation = false) {
      if (!player) return false;
      if (typeof Combat !== 'undefined' && Combat.actorsSameLane && !Combat.actorsSameLane(this, player)) return false;
      const forwardDistance = (player.x - this.x) * (this.facing || 1);
      const yDistance = Math.abs(player.y - this.y);
      const padX = anticipation ? 6 : 0;
      const padY = anticipation ? 4 : 0;
      const minX = Math.max(0, (this.attackMinDistanceX || 0) - padX);
      const maxX = Math.max(minX + 1, (this.attackRangeX || GAME_CONFIG.enemyAttackRangeX || 76) + padX);
      const maxY = (this.attackRangeY || GAME_CONFIG.enemyAttackRangeY || 36) + padY;
      return forwardDistance >= minX && forwardDistance <= maxX && yDistance <= maxY;
    };

    const originalDogApplyTuning = DogRegimeEnemy.prototype.applyTuning;
    DogRegimeEnemy.prototype.applyTuning = function (resetHp = false) {
      if (typeof originalDogApplyTuning === 'function') originalDogApplyTuning.call(this, resetHp);
      const config = (GAME_CONFIG.enemies && GAME_CONFIG.enemies[this.enemyType]) || {};
      this.attackMinDistanceX = config.attackMinDistanceX == null ? 28 : config.attackMinDistanceX;
      this.attackRangeX = config.attackRangeX || GAME_CONFIG.enemyAttackRangeX || 76;
      this.attackRangeY = config.attackRangeY || GAME_CONFIG.enemyAttackRangeY || 36;
      this.attackMaxDistanceX = this.attackRangeX;
    };

    DogRegimeEnemy.prototype.isInAttackRange = function (player) {
      return this.canClubReachPlayer(player, true);
    };

    DogRegimeEnemy.prototype.attackRangeBindingPatchApplied = true;
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
