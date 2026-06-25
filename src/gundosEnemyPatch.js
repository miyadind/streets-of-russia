(function () {
  if (typeof GAME_CONFIG === 'undefined' || typeof Assets === 'undefined') return;

  const FOLDER = 'assets/enemies/gundos';
  const INTRO_DURATION_MS = 56425;
  const SWING_LEAD_MS = 5000;

  Assets.gundos = {
    walk: [FOLDER + '/walk0.png', FOLDER + '/walk1.png'],
    swing: FOLDER + '/swing.png',
    devil: FOLDER + '/devil.png',
    appear: FOLDER + '/Appear.mp3'
  };

  GAME_CONFIG.enemies.gundos = Object.assign({
    name: 'gundos',
    hp: 9999,
    speed: 0.55,
    scale: 0.38,
    damage: 0,
    blocksWaveClear: true,
    canAttack: false,
    canDie: false,
    introDurationMs: INTRO_DURATION_MS,
    swingLeadMs: SWING_LEAD_MS,
    patrolLeft: 890,
    patrolRight: 1160,
    patrolTop: 555,
    patrolBottom: 665
  }, GAME_CONFIG.enemies.gundos || {});

  if (typeof DevPanel !== 'undefined') {
    if (DevPanel.tabs && !DevPanel.tabs.includes('GUNDOS')) DevPanel.tabs.push('GUNDOS');
    if (!DevPanel.fieldGroups) DevPanel.fieldGroups = {};
    if (!DevPanel.fieldGroups.GUNDOS) DevPanel.fieldGroups.GUNDOS = [];
    const fields = [
      { label: 'Gundos speed', path: 'enemies.gundos.speed', min: 0.1, max: 3, step: 0.05 },
      { label: 'Gundos scale', path: 'enemies.gundos.scale', min: 0.1, max: 0.7, step: 0.01 },
      { label: 'Patrol left', path: 'enemies.gundos.patrolLeft', min: 500, max: 1200, step: 10 },
      { label: 'Patrol right', path: 'enemies.gundos.patrolRight', min: 600, max: 1280, step: 10 },
      { label: 'Patrol top', path: 'enemies.gundos.patrolTop', min: 350, max: 700, step: 5 },
      { label: 'Patrol bottom', path: 'enemies.gundos.patrolBottom', min: 400, max: 760, step: 5 },
      { label: 'Swing lead ms', path: 'enemies.gundos.swingLeadMs', min: 500, max: 15000, step: 250 }
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
      this.targetX = x;
      this.targetY = y;
      this.targetTimer = 0;
      this.voice = null;
      this.voiceStarted = false;
      this.voiceEnded = false;
      this.transformed = false;
      this.previousMusicVolume = null;
      this.startVoice();
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

    choosePatrolTarget() {
      const config = this.getConfig();
      this.targetX = config.patrolLeft + Math.random() * (config.patrolRight - config.patrolLeft);
      this.targetY = config.patrolTop + Math.random() * (config.patrolBottom - config.patrolTop);
      this.targetTimer = 1100 + Math.random() * 1800;
    }

    patrol(dt) {
      const config = this.getConfig();
      this.targetTimer -= dt;
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      if (this.targetTimer <= 0 || Math.hypot(dx, dy) < 12) this.choosePatrolTarget();

      const nextDx = this.targetX - this.x;
      const nextDy = this.targetY - this.y;
      const distance = Math.max(1, Math.hypot(nextDx, nextDy));
      const frameScale = Math.max(0.7, Math.min(1.6, dt / 16.67));
      this.x += nextDx / distance * config.speed * frameScale;
      this.y += nextDy / distance * config.speed * GAME_CONFIG.ySpeedMultiplier * frameScale;
      if (Math.abs(nextDx) > 3) this.facing = nextDx >= 0 ? 1 : -1;

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
      if (AudioManager.currentMusic) AudioManager.currentMusic.volume = AudioManager.getMusicVolume();
      if (scene) scene.gundosIntroActive = false;
      AudioManager.playSfx('bossAppear', 0.95);
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
      if (this.transformed) return;
      scene.gundosIntroActive = true;
      this.introElapsed += dt;
      if (this.voice) this.voice.volume = AudioManager.getSfxVolume(1);

      const config = this.getConfig();
      const elapsed = this.getIntroProgressMs();
      const duration = this.voice && Number.isFinite(this.voice.duration) && this.voice.duration > 0
        ? this.voice.duration * 1000
        : config.introDurationMs;
      const swingAt = Math.max(0, duration - config.swingLeadMs);

      if (elapsed >= swingAt) {
        this.state = 'swing';
        this.facing = -1;
      } else {
        this.state = 'introWalk';
        this.patrol(dt);
      }

      if (this.voiceEnded || elapsed >= duration) this.transform(scene);
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
