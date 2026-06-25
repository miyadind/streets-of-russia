(function () {
  if (typeof GAME_CONFIG === 'undefined' || typeof Assets === 'undefined') return;

  const FOLDER = 'assets/enemies/gundos';
  const ASSET_VERSION = 'bcbac33';
  const INTRO_DURATION_MS = 56425;
  const DEVIL_LEAD_MS = 2000;

  function versioned(file) {
    return FOLDER + '/' + file + '?v=' + ASSET_VERSION;
  }

  Assets.gundos = {
    walk: [versioned('walk0.png'), versioned('walk1.png')],
    swing: versioned('swing.png'),
    devil: versioned('devil.png'),
    appear: versioned('Appear.mp3')
  };

  GAME_CONFIG.enemies.gundos = Object.assign({
    name: 'gundos',
    hp: 9999,
    speed: 1.25,
    scale: 0.266,
    damage: 0,
    blocksWaveClear: true,
    canAttack: false,
    canDie: false,
    introDurationMs: INTRO_DURATION_MS,
    devilLeadMs: DEVIL_LEAD_MS,
    entranceTargetX: 1040,
    entranceY: 620
  }, GAME_CONFIG.enemies.gundos || {});

  function migrateIntroSequence() {
    const config = GAME_CONFIG.enemies.gundos;
    if (Number(config.introSequenceVersion) >= 2) return;
    Object.assign(config, {
      introSequenceVersion: 2,
      speed: 1.25,
      scale: 0.266,
      devilLeadMs: DEVIL_LEAD_MS,
      entranceTargetX: 1040,
      entranceY: 620
    });
    delete config.swingLeadMs;
    delete config.patrolLeft;
    delete config.patrolRight;
    delete config.patrolTop;
    delete config.patrolBottom;
  }

  migrateIntroSequence();

  if (typeof DevPanel !== 'undefined') {
    const previousLoad = DevPanel.load;
    DevPanel.load = function () {
      if (previousLoad) previousLoad.call(this);
      migrateIntroSequence();
    };

    if (DevPanel.tabs && !DevPanel.tabs.includes('GUNDOS')) DevPanel.tabs.push('GUNDOS');
    if (!DevPanel.fieldGroups) DevPanel.fieldGroups = {};
    if (!DevPanel.fieldGroups.GUNDOS) DevPanel.fieldGroups.GUNDOS = [];
    const fields = [
      { label: 'Gundos speed', path: 'enemies.gundos.speed', min: 0.1, max: 3, step: 0.05 },
      { label: 'Gundos scale', path: 'enemies.gundos.scale', min: 0.1, max: 0.7, step: 0.01 },
      { label: 'Entrance target X', path: 'enemies.gundos.entranceTargetX', min: 600, max: 1200, step: 10 },
      { label: 'Entrance Y', path: 'enemies.gundos.entranceY', min: 350, max: 720, step: 5 },
      { label: 'Devil lead ms', path: 'enemies.gundos.devilLeadMs', min: 0, max: 10000, step: 250 }
    ];
    for (const field of fields) {
      if (!DevPanel.fieldGroups.GUNDOS.some(item => item.path === field.path)) {
        DevPanel.fieldGroups.GUNDOS.push(field);
      }
    }
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => {
        console.warn('Missing Gundos image:', src);
        resolve(null);
      };
      image.src = src;
    });
  }

  if (typeof GameApp !== 'undefined') {
    const previousLoadImages = GameApp.prototype.loadImages;
    GameApp.prototype.loadImages = async function () {
      const loaded = await previousLoadImages.call(this);
      const walk0 = await loadImage(Assets.gundos.walk[0]);
      const walk1 = await loadImage(Assets.gundos.walk[1]);
      const swing = await loadImage(Assets.gundos.swing);
      const devil = await loadImage(Assets.gundos.devil);
      if (!loaded.enemies) loaded.enemies = {};
      loaded.enemies.gundos = {
        idle: walk0 || walk1,
        walk: [walk0 || walk1, walk1 || walk0],
        swing: swing || walk1 || walk0,
        devil: devil || swing || walk1 || walk0,
        dead: devil || swing || walk1 || walk0
      };
      return loaded;
    };
  }

  class GundosEnemy {
    constructor(x, y, images, id) {
      this.enemyType = 'gundos';
      this.id = id;
      this.images = images;
      this.x = x;
      this.y = y;
      this.facing = -1;
      this.alive = true;
      this.remove = false;
      this.blocksWaveClear = true;
      this.maxHp = this.getConfig().hp;
      this.hp = this.maxHp;
      this.state = 'introWalk';
      this.walkFrame = 0;
      this.walkTimer = 0;
      this.introElapsed = 0;
      this.voice = null;
      this.voiceStarted = false;
      this.voiceEnded = false;
      this.transformed = false;
      this.introFinished = false;
      this.previousMusicVolume = null;
    }

    getConfig() {
      return GAME_CONFIG.enemies.gundos;
    }

    startVoice() {
      try {
        this.voice = new Audio();
        this.voice.src = Assets.gundos.appear;
        this.voice.preload = 'auto';
        this.voice.loop = false;
        this.voice.volume = AudioManager.getSfxVolume(1);
        this.voice.addEventListener('ended', () => {
          this.voiceEnded = true;
        });
        this.voice.addEventListener('error', () => {
          this.voice = null;
        });
        const result = this.voice.play();
        if (result && result.then) {
          result.then(() => { this.voiceStarted = true; }).catch(() => {});
        } else {
          this.voiceStarted = true;
        }
        if (AudioManager.currentMusic) {
          this.previousMusicVolume = AudioManager.currentMusic.volume;
          AudioManager.currentMusic.volume = Math.min(0.12, AudioManager.getMusicVolume() * 0.28);
        }
      } catch (error) {
        this.voice = null;
      }
    }

    getIntroProgressMs() {
      if (this.voice && this.voiceStarted && Number.isFinite(this.voice.currentTime)) {
        return this.voice.currentTime * 1000;
      }
      return this.introElapsed;
    }

    walkToEntrance(dt) {
      const config = this.getConfig();
      const dx = config.entranceTargetX - this.x;
      const dy = config.entranceY - this.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= 4) {
        this.x = config.entranceTargetX;
        this.y = config.entranceY;
        this.state = 'swing';
        this.facing = -1;
        this.startVoice();
        return;
      }

      const frameScale = Math.max(0.7, Math.min(1.6, dt / 16.67));
      this.x += dx / distance * config.speed * frameScale;
      this.y += dy / distance * config.speed * GAME_CONFIG.ySpeedMultiplier * frameScale;
      if (Math.abs(dx) > 3) this.facing = dx >= 0 ? 1 : -1;

      this.walkTimer += dt;
      if (this.walkTimer >= 360) {
        this.walkTimer -= 360;
        this.walkFrame = 1 - this.walkFrame;
      }
    }

    transform(scene) {
      if (this.transformed) return;
      this.transformed = true;
      this.state = 'devil';
      this.facing = -1;
      AudioManager.playSfx('bossAppear', 0.95);
    }

    finishIntro(scene) {
      if (this.introFinished) return;
      this.introFinished = true;
      if (!this.transformed) this.transform(scene);
      if (AudioManager.currentMusic) AudioManager.currentMusic.volume = AudioManager.getMusicVolume();
      if (scene) scene.gundosIntroActive = false;
    }

    stopVoice() {
      if (!this.voice) return;
      try {
        this.voice.pause();
        this.voice.currentTime = 0;
      } catch (error) {}
      this.voice = null;
      if (AudioManager.currentMusic) AudioManager.currentMusic.volume = AudioManager.getMusicVolume();
    }

    update(dt, scene) {
      if (this.introFinished) return;
      scene.gundosIntroActive = true;

      if (this.state === 'introWalk') {
        this.walkToEntrance(dt);
        return;
      }

      this.introElapsed += dt;
      if (this.voice) this.voice.volume = AudioManager.getSfxVolume(1);

      const config = this.getConfig();
      const elapsed = this.getIntroProgressMs();
      const duration = this.voice && Number.isFinite(this.voice.duration) && this.voice.duration > 0
        ? this.voice.duration * 1000
        : config.introDurationMs;
      const devilAt = Math.max(0, duration - config.devilLeadMs);

      if (elapsed >= devilAt) this.transform(scene);
      if (this.voiceEnded || elapsed >= duration) this.finishIntro(scene);
    }

    takeHit() {
      // The introduction and transformation are invulnerable.
    }

    getBodyBox() {
      return { x: this.x - 55, y: this.y - 190, w: 110, h: 190 };
    }

    getHurtbox() {
      return this.getBodyBox();
    }

    getPushbox() {
      return { x: this.x - 48, y: this.y - 22, w: 96, h: 42 };
    }

    getImage() {
      const set = this.images.enemies.gundos;
      if (this.state === 'devil') return set.devil;
      if (this.state === 'swing') return set.swing;
      return set.walk[this.walkFrame] || set.idle;
    }

    draw(ctx, debug) {
      const image = this.getImage();
      if (!image) return;
      const scale = this.getConfig().scale;
      const width = image.width * scale;
      const height = image.height * scale;
      ctx.save();
      ctx.translate(this.x, this.y);
      if (this.facing < 0) ctx.scale(-1, 1);
      ctx.drawImage(image, -width / 2, -height, width, height);
      ctx.restore();

      if (debug) {
        const body = this.getBodyBox();
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 2;
        ctx.strokeRect(body.x, body.y, body.w, body.h);
      }
    }
  }

  window.GundosEnemy = GundosEnemy;

  if (typeof LevelScene !== 'undefined') {
    const previousPlayEnemyAppearSound = LevelScene.prototype.playEnemyAppearSound;
    LevelScene.prototype.playEnemyAppearSound = function (type) {
      if (type === 'gundos') return;
      return previousPlayEnemyAppearSound.call(this, type);
    };

    const previousCreateEnemy = LevelScene.prototype.createEnemy;
    LevelScene.prototype.createEnemy = function (type, x, y, id) {
      if (type === 'gundos') return new GundosEnemy(x, y, this.images, id);
      return previousCreateEnemy.call(this, type, x, y, id);
    };

    const previousSpawnInitialWave = LevelScene.prototype.spawnInitialWave;
    LevelScene.prototype.spawnInitialWave = function () {
      for (const enemy of this.enemies || []) {
        if (enemy && enemy.enemyType === 'gundos' && enemy.stopVoice) enemy.stopVoice();
      }
      this.gundosIntroActive = false;
      previousSpawnInitialWave.call(this);
    };

    const previousMaterializeWave = LevelScene.prototype.materializeWave;
    LevelScene.prototype.materializeWave = function (wave) {
      if ((wave.enemies || []).some(group => group.type === 'gundos')) {
        this.gundosIntroActive = true;
        const zone = this.getWalkZone ? this.getWalkZone() : {
          left: 0,
          right: GAME_CONFIG.width,
          top: GAME_CONFIG.laneTop,
          bottom: GAME_CONFIG.laneBottom
        };
        this.player.x = zone.left + 160;
        this.player.y = Math.min(zone.bottom - 20, Math.max(zone.top + 20, 620));
        this.player.facing = 1;
        this.player.state = 'idle';
      }
      previousMaterializeWave.call(this, wave);
    };
  }

  if (typeof Player !== 'undefined') {
    const previousPlayerUpdate = Player.prototype.update;
    Player.prototype.update = function (dt, scene) {
      if (scene && scene.gundosIntroActive) {
        this.state = 'idle';
        this.attackTimer = 0;
        this.attackHasHit = false;
        this.walkTimer = 0;
        return;
      }
      previousPlayerUpdate.call(this, dt, scene);
    };
  }

  const street03 = GAME_CONFIG.levels && GAME_CONFIG.levels.street03;
  if (street03 && Array.isArray(street03.waves) &&
      !street03.waves.some(wave => (wave.enemies || []).some(group => group.type === 'gundos'))) {
    street03.waves.push({
      trigger: 'afterWaveCleared',
      enemies: [{ type: 'gundos', count: 1, side: 'right' }]
    });
  }
})();
