(function () {
  if (typeof GAME_CONFIG === 'undefined' || typeof Assets === 'undefined') return;

  const FOLDER = 'assets/enemies/gundos';
  const ASSET_VERSION = 'gundos-flag-1';
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
    hp: 6,
    speed: 1.25,
    scale: 0.133,
    damage: 0,
    blocksWaveClear: true,
    canAttack: false,
    canDie: true,
    introDurationMs: INTRO_DURATION_MS,
    devilLeadMs: DEVIL_LEAD_MS,
    entranceTargetX: 1040,
    entranceY: 620,
    zetnikSpawnMinMs: 1450,
    zetnikSpawnMaxMs: 2450,
    maxZetniks: 3,
    zetnikHitDamage: 1,
    arenaMoveSpeed: 0.6,
    arenaTop: 540,
    arenaBottom: 675
  }, GAME_CONFIG.enemies.gundos || {});

  function migrateIntroSequence() {
    const config = GAME_CONFIG.enemies.gundos;
    if (Number(config.introSequenceVersion) >= 4) return;
    Object.assign(config, {
      introSequenceVersion: 4,
      speed: 1.25,
      hp: 6,
      scale: 0.133,
      devilLeadMs: DEVIL_LEAD_MS,
      entranceTargetX: 1040,
      entranceY: 620,
      zetnikSpawnMinMs: 1450,
      zetnikSpawnMaxMs: 2450,
      maxZetniks: 3,
      zetnikHitDamage: 1,
      arenaMoveSpeed: 0.6,
      arenaTop: 540,
      arenaBottom: 675
    });
    delete config.swingLeadMs;
    delete config.patrolLeft;
    delete config.patrolRight;
    delete config.patrolTop;
    delete config.patrolBottom;
  }

  function configureFarEastFinale() {
    if (!GAME_CONFIG.levels) return;
    const street02 = GAME_CONFIG.levels.street02;
    const street03 = GAME_CONFIG.levels.street03;

    if (street02 && Array.isArray(street02.waves) &&
        !street02.waves.some(wave => (wave.enemies || []).some(group => group.type === 'sucker'))) {
      street02.waves.push({
        trigger: 'afterWaveCleared',
        enemies: [{ type: 'sucker', count: 1, side: 'right' }]
      });
    }

    if (street03) {
      street03.waves = [{
        trigger: 'onEnter',
        enemies: [{ type: 'gundos', count: 1, side: 'right' }]
      }];
    }
  }

  migrateIntroSequence();
  configureFarEastFinale();

  if (typeof DevPanel !== 'undefined') {
    const previousLoad = DevPanel.load;
    DevPanel.load = function () {
      if (previousLoad) previousLoad.call(this);
      migrateIntroSequence();
      configureFarEastFinale();
    };

    if (DevPanel.tabs && !DevPanel.tabs.includes('GUNDOS')) DevPanel.tabs.push('GUNDOS');
    if (!DevPanel.fieldGroups) DevPanel.fieldGroups = {};
    if (!DevPanel.fieldGroups.GUNDOS) DevPanel.fieldGroups.GUNDOS = [];
    const fields = [
      { label: 'Gundos speed', path: 'enemies.gundos.speed', min: 0.1, max: 3, step: 0.05 },
      { label: 'Gundos scale', path: 'enemies.gundos.scale', min: 0.1, max: 0.7, step: 0.01 },
      { label: 'Gundos HP', path: 'enemies.gundos.hp', min: 1, max: 20, step: 1 },
      { label: 'Entrance target X', path: 'enemies.gundos.entranceTargetX', min: 600, max: 1200, step: 10 },
      { label: 'Entrance Y', path: 'enemies.gundos.entranceY', min: 350, max: 720, step: 5 },
      { label: 'Devil lead ms', path: 'enemies.gundos.devilLeadMs', min: 0, max: 10000, step: 250 },
      { label: 'Zetnik min spawn', path: 'enemies.gundos.zetnikSpawnMinMs', min: 500, max: 6000, step: 100 },
      { label: 'Zetnik max spawn', path: 'enemies.gundos.zetnikSpawnMaxMs', min: 500, max: 8000, step: 100 },
      { label: 'Max Zetniks', path: 'enemies.gundos.maxZetniks', min: 1, max: 8, step: 1 },
      { label: 'Arena move speed', path: 'enemies.gundos.arenaMoveSpeed', min: 0, max: 2.5, step: 0.05 }
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
      this.spawnTimer = 900;
      this.deathTimer = 0;
      this.arenaMoveDirection = Math.random() < 0.5 ? -1 : 1;
      this.voicePausedByGame = false;
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

    walkToEntrance(dt, scene) {
      const config = this.getConfig();
      const dx = config.entranceTargetX - this.x;
      const dy = config.entranceY - this.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= 4) {
        this.x = config.entranceTargetX;
        this.y = config.entranceY;
        this.state = 'swing';
        this.facing = -1;
        if (scene) {
          scene.gundosIntroActive = true;
          scene.gundosIntroLocked = false;
          scene.gundosArenaActive = true;
          scene.activeGundos = this;
        }
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
      if (scene) {
        scene.gundosIntroActive = false;
        scene.gundosIntroLocked = false;
        scene.gundosArenaActive = true;
      }
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

    pauseVoice() {
      if (!this.voice || this.voice.paused || this.voice.ended) return;
      try {
        this.voice.pause();
        this.voicePausedByGame = true;
      } catch (error) {}
    }

    resumeVoice() {
      if (!this.voice || !this.voicePausedByGame || this.voice.ended) return;
      this.voicePausedByGame = false;
      try {
        this.voice.volume = AudioManager.getSfxVolume(1);
        this.voice.play().catch(() => {});
      } catch (error) {}
    }

    update(dt, scene) {
      if (!this.alive) {
        this.deathTimer += dt;
        if (this.deathTimer > 1200) this.remove = true;
        return;
      }

      scene.gundosIntroActive = true;

      if (this.state === 'introWalk') {
        scene.gundosIntroLocked = true;
        this.walkToEntrance(dt, scene);
        return;
      }

      scene.gundosIntroLocked = false;
      scene.gundosArenaActive = true;
      scene.activeGundos = this;
      this.updateArenaMovement(dt);
      this.updateZetnikPressure(dt, scene);

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

    updateArenaMovement(dt) {
      const config = this.getConfig();
      const top = config.arenaTop || 540;
      const bottom = config.arenaBottom || 675;
      const speed = config.arenaMoveSpeed == null ? 0.6 : config.arenaMoveSpeed;
      this.y += this.arenaMoveDirection * speed * Math.max(0.65, Math.min(1.55, dt / 16.67));
      if (this.y <= top) {
        this.y = top;
        this.arenaMoveDirection = 1;
      } else if (this.y >= bottom) {
        this.y = bottom;
        this.arenaMoveDirection = -1;
      }
    }

    updateZetnikPressure(dt, scene) {
      const config = this.getConfig();
      this.spawnTimer -= dt;
      if (this.spawnTimer > 0) return;

      const active = (scene.enemies || []).filter(enemy =>
        enemy && enemy.alive && enemy.enemyType === 'zetnik' && enemy.gundosMinion && !enemy.remove
      ).length;
      if (active < (config.maxZetniks || 3) && scene.spawnGundosZetnik) {
        scene.spawnGundosZetnik(this);
      }

      const min = config.zetnikSpawnMinMs || 1450;
      const max = Math.max(min, config.zetnikSpawnMaxMs || 2450);
      this.spawnTimer = min + Math.random() * (max - min);
    }

    receiveZetnikHit(zetnik, scene) {
      if (!this.alive) return;
      const config = this.getConfig();
      this.hp = Math.max(0, this.hp - (config.zetnikHitDamage || 1));
      this.flash = 220;
      AudioManager.playSfx('zetnikCrash', 1, { playbackRate: 0.82, startAt: 0.01 });
      if (scene) scene.hitStop = Math.max(scene.hitStop || 0, 80);
      if (this.hp <= 0) this.defeat(scene);
    }

    defeat(scene) {
      if (!this.alive) return;
      this.alive = false;
      this.blocksWaveClear = false;
      this.deathTimer = 0;
      this.stopVoice();
      if (scene) {
        scene.gundosIntroActive = false;
        scene.gundosIntroLocked = false;
        scene.gundosArenaActive = false;
        scene.activeGundos = null;
      }
      AudioManager.playSfx('enemyDown', 1, { playbackRate: 0.82, startAt: 0.01 });
    }

    takeHit() {
      this.flash = 120;
    }

    getBodyBox() {
      return { x: this.x - 35, y: this.y - 125, w: 70, h: 125 };
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
      if (!this.alive) ctx.globalAlpha = Math.max(0, 1 - this.deathTimer / 1200);
      else if (this.flash > 0) {
        this.flash = Math.max(0, this.flash - 16);
        ctx.globalAlpha = 0.55;
      }
      ctx.translate(this.x, this.y);
      if (this.facing < 0) ctx.scale(-1, 1);
      ctx.drawImage(image, -width / 2, -height, width, height);
      ctx.restore();
      this.drawHealthBar(ctx);

      if (debug) {
        const body = this.getBodyBox();
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 2;
        ctx.strokeRect(body.x, body.y, body.w, body.h);
      }
    }

    drawHealthBar(ctx) {
      if (!this.alive) return;
      const maxHp = Math.max(1, this.maxHp || this.getConfig().hp || 1);
      const ratio = Math.max(0, Math.min(1, this.hp / maxHp));
      const w = 120;
      const h = 10;
      const x = this.x - w / 2;
      const y = this.y - 160;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
      ctx.fillStyle = '#5f1010';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#ff3b30';
      ctx.fillRect(x, y, w * ratio, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
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
      this.gundosIntroLocked = false;
      this.gundosArenaActive = false;
      this.activeGundos = null;
      this.gundosDrops = [];
      previousSpawnInitialWave.call(this);
    };

    const previousMaterializeWave = LevelScene.prototype.materializeWave;
    LevelScene.prototype.materializeWave = function (wave) {
      if ((wave.enemies || []).some(group => group.type === 'gundos')) {
        this.gundosIntroActive = true;
        this.gundosIntroLocked = true;
        this.gundosArenaActive = false;
        this.activeGundos = null;
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

    LevelScene.prototype.getGundosLanes = function () {
      const zone = this.getWalkZone ? this.getWalkZone() : {
        top: GAME_CONFIG.laneTop,
        bottom: GAME_CONFIG.laneBottom
      };
      const top = zone.top + 24;
      const bottom = zone.bottom - 26;
      const mid = (top + bottom) / 2;
      return [top, mid, bottom];
    };

    LevelScene.prototype.spawnGundosZetnik = function (boss) {
      const lanes = this.getGundosLanes();
      const y = lanes[Math.floor(Math.random() * lanes.length)];
      const id = this.enemies.length + Math.floor(Math.random() * 1000);
      const x = Math.min(GAME_CONFIG.width + 110, (boss && boss.x ? boss.x + 180 : GAME_CONFIG.width + 80));
      const enemy = new ZetnikEnemy(x, y, this.images, id);
      if (enemy.setupGundosMinion) enemy.setupGundosMinion(boss);
      this.enemies.push(enemy);
      this.playEnemyAppearSound('zetnik');
      return enemy;
    };

    LevelScene.prototype.ensureGundosDrops = function () {
      if (!this.gundosDrops) this.gundosDrops = [];
      return this.gundosDrops;
    };

    LevelScene.prototype.addGundosFlagDrop = function (x, y) {
      const drops = this.ensureGundosDrops();
      drops.push({ type: 'flag', x, y, age: 0 });
      if (!drops.some(drop => drop.type === 'stick' && !drop.picked)) {
        drops.push({ type: 'stick', x: x + 42, y: y + 4, age: 0, picked: false });
      }
    };

    LevelScene.prototype.updateGundosDrops = function (dt) {
      const drops = this.ensureGundosDrops();
      const player = this.player;
      for (const drop of drops) {
        drop.age += dt;
        if (drop.type !== 'stick' || drop.picked || !player) continue;
        const nearX = Math.abs(player.x - drop.x) <= 62;
        const nearY = Math.abs(player.y - drop.y) <= 46;
        if (!nearX || !nearY) continue;
        drop.picked = true;
        player.gundosStickCharges = Math.max(player.gundosStickCharges || 0, 6);
        AudioManager.playSfx('menuSelect', 0.75, { playbackRate: 1.18, startAt: 0.01 });
      }
    };

    LevelScene.prototype.drawGundosDrops = function (ctx) {
      const drops = this.ensureGundosDrops();
      for (const drop of drops) {
        if (drop.picked) continue;
        if (drop.type === 'flag') this.drawGundosGroundFlag(ctx, drop);
        if (drop.type === 'stick') this.drawGundosStickPickup(ctx, drop);
      }
    };

    LevelScene.prototype.drawGundosGroundFlag = function (ctx, drop) {
      const img = this.images && this.images.enemies && this.images.enemies.zetnik && this.images.enemies.zetnik.flag;
      ctx.save();
      ctx.globalAlpha = 0.78;
      ctx.translate(drop.x, drop.y - 8);
      ctx.rotate(-0.34);
      if (img) {
        const scale = 0.045;
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      } else {
        ctx.fillStyle = '#771111';
        ctx.fillRect(-42, -10, 84, 20);
      }
      ctx.restore();
    };

    LevelScene.prototype.drawGundosStickPickup = function (ctx, drop) {
      const pulse = 0.5 + 0.5 * Math.sin(drop.age / 150);
      ctx.save();
      ctx.translate(drop.x, drop.y - 18);
      ctx.rotate(-0.55);
      ctx.shadowColor = '#ffe66d';
      ctx.shadowBlur = 12 + pulse * 12;
      ctx.strokeStyle = '#ffe66d';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(-42, 0);
      ctx.lineTo(42, 0);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#5b4a37';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-42, 0);
      ctx.lineTo(42, 0);
      ctx.stroke();
      ctx.fillStyle = '#d7c08a';
      ctx.fillRect(-28, -5, 18, 10);
      ctx.restore();
    };

    const previousSceneUpdate = LevelScene.prototype.update;
    LevelScene.prototype.update = function (dt) {
      previousSceneUpdate.call(this, dt);
      if (this.gundosDrops && this.gundosDrops.length) this.updateGundosDrops(dt);
    };

    const previousSceneDraw = LevelScene.prototype.draw;
    LevelScene.prototype.draw = function (ctx) {
      previousSceneDraw.call(this, ctx);
      if (this.gundosDrops && this.gundosDrops.length) this.drawGundosDrops(ctx);
    };

    LevelScene.prototype.pauseGundosVoice = function () {
      const boss = this.activeGundos || (this.enemies || []).find(enemy => enemy && enemy.enemyType === 'gundos');
      if (boss && boss.pauseVoice) boss.pauseVoice();
    };

    LevelScene.prototype.resumeGundosVoice = function () {
      const boss = this.activeGundos || (this.enemies || []).find(enemy => enemy && enemy.enemyType === 'gundos');
      if (boss && boss.resumeVoice) boss.resumeVoice();
    };

    LevelScene.prototype.stopGundosVoice = function () {
      for (const enemy of this.enemies || []) {
        if (enemy && enemy.enemyType === 'gundos' && enemy.stopVoice) enemy.stopVoice();
      }
      this.gundosIntroActive = false;
      this.gundosIntroLocked = false;
      this.gundosArenaActive = false;
      this.activeGundos = null;
    };
  }

  if (typeof Player !== 'undefined') {
    const previousPlayerUpdate = Player.prototype.update;
    Player.prototype.update = function (dt, scene) {
      if (scene && scene.gundosIntroLocked) {
        this.state = 'idle';
        this.attackTimer = 0;
        this.attackHasHit = false;
        this.walkTimer = 0;
        return;
      }
      previousPlayerUpdate.call(this, dt, scene);
    };
  }

  if (typeof GameApp !== 'undefined') {
    const previousSetState = GameApp.prototype.setState;
    GameApp.prototype.setState = function (nextState) {
      const previousState = this.state;
      const scene = this.scene;
      if (scene && previousState === 'level' && nextState !== 'level') {
        const keepPausedForHeroSwitch = nextState === 'characterSelect' && this.characterSelectMode === 'switchHero';
        if (keepPausedForHeroSwitch && scene.pauseGundosVoice) scene.pauseGundosVoice();
        else if (scene.stopGundosVoice) scene.stopGundosVoice();
      }

      const result = previousSetState.call(this, nextState);

      if (this.scene && previousState !== 'level' && nextState === 'level' && this.scene.resumeGundosVoice) {
        this.scene.resumeGundosVoice();
      }

      return result;
    };

    const previousGameUpdate = GameApp.prototype.update;
    GameApp.prototype.update = function (dt) {
      const wasPaused = !!this.gundosAudioPauseState;
      const shouldPause = this.state === 'level' && !!this.paused;
      if (this.scene) {
        if (shouldPause && !wasPaused && this.scene.pauseGundosVoice) this.scene.pauseGundosVoice();
        if (!shouldPause && wasPaused && this.scene.resumeGundosVoice) this.scene.resumeGundosVoice();
      }
      if (shouldPause && !wasPaused && AudioManager.pauseAllAudio) AudioManager.pauseAllAudio();
      if (!shouldPause && wasPaused && AudioManager.resumePausedAudio) AudioManager.resumePausedAudio();
      this.gundosAudioPauseState = shouldPause;
      return previousGameUpdate.call(this, dt);
    };

    window.addEventListener('load', () => {
      let hiddenPaused = false;
      let hiddenPausedGameplay = false;
      document.addEventListener('visibilitychange', () => {
        const game = window.game || null;
        if (document.hidden) {
          hiddenPaused = true;
          hiddenPausedGameplay = !!(game && game.state === 'level' && !game.paused);
          if (game && game.state === 'level') game.paused = true;
          if (game && game.scene && game.scene.pauseGundosVoice) game.scene.pauseGundosVoice();
          if (AudioManager.pauseAllAudio) AudioManager.pauseAllAudio();
          if (game && game.state === 'level') game.gundosAudioPauseState = true;
        } else if (hiddenPaused) {
          hiddenPaused = false;
          if (game && hiddenPausedGameplay) game.paused = false;
          hiddenPausedGameplay = false;
          if (game && game.scene && game.scene.resumeGundosVoice && !game.paused) game.scene.resumeGundosVoice();
          if (AudioManager.resumePausedAudio && (!game || !game.paused)) AudioManager.resumePausedAudio();
        }
      });
      window.addEventListener('blur', () => {
        const game = window.game || null;
        if (game && game.state === 'level') game.paused = true;
        if (game && game.scene && game.scene.pauseGundosVoice) game.scene.pauseGundosVoice();
        if (AudioManager.pauseAllAudio) AudioManager.pauseAllAudio();
        if (game && game.state === 'level') game.gundosAudioPauseState = true;
      });
    });
  }

  configureFarEastFinale();
})();
