(function () {
  if (typeof GAME_CONFIG === 'undefined' || typeof Assets === 'undefined') return;

  const FOLDER = 'assets/enemies/gundos';
  const ASSET_VERSION = 'gundos-finale-2';
  const INTRO_DURATION_MS = 56425;
  const DEVIL_LEAD_MS = 2000;

  function versioned(file) {
    return FOLDER + '/' + file + '?v=' + ASSET_VERSION;
  }

  Assets.gundos = {
    walk: [versioned('walk0.png'), versioned('walk1.png')],
    swing: versioned('swing.png'),
    devil: versioned('devil.png'),
    knockdownBody: versioned('knockdownBody.png'),
    fireWall: 'assets/effects/gundos-fire-wall.png?v=' + ASSET_VERSION,
    appear: versioned('Appear.mp3')
  };

  GAME_CONFIG.enemies.gundos = Object.assign({
    name: 'gundos',
    hp: 6,
    speed: 1.875,
    scale: 0.266,
    damage: 0,
    blocksWaveClear: true,
    canAttack: false,
    canDie: true,
    introDurationMs: INTRO_DURATION_MS,
    devilLeadMs: DEVIL_LEAD_MS,
    entranceTargetX: 1040,
    entranceY: 720,
    zetnikSpawnMinMs: 1450,
    zetnikSpawnMaxMs: 2450,
    maxZetniks: 3,
    guardZetniks: 3,
    medicSpawnMs: 1200,
    medicRespawnMs: 12500,
    fireballSpawnMinMs: 1250,
    fireballSpawnMaxMs: 2350,
    fireballDamage: 24,
    zetnikHitDamage: 1,
    arenaMoveSpeed: 0,
    arenaTop: 540,
    arenaBottom: 720,
    deathHoldMs: 5000,
    victoryDelayMs: 4800
  }, GAME_CONFIG.enemies.gundos || {});

  function migrateIntroSequence() {
    const config = GAME_CONFIG.enemies.gundos;
    if (Number(config.introSequenceVersion) >= 8) return;
    Object.assign(config, {
      introSequenceVersion: 8,
      speed: 1.875,
      hp: 6,
      scale: 0.266,
      devilLeadMs: DEVIL_LEAD_MS,
      entranceTargetX: 1040,
      entranceY: 720,
      zetnikSpawnMinMs: 1450,
      zetnikSpawnMaxMs: 2450,
      maxZetniks: 3,
      guardZetniks: 3,
      medicSpawnMs: 1200,
      medicRespawnMs: 12500,
      fireballSpawnMinMs: 1250,
      fireballSpawnMaxMs: 2350,
      fireballDamage: 24,
      zetnikHitDamage: 1,
      arenaMoveSpeed: 0,
      arenaTop: 540,
      arenaBottom: 720,
      deathHoldMs: 5000,
      victoryDelayMs: 4800
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

    if (street03 && (!Array.isArray(street03.waves) ||
        !street03.waves.some(wave => (wave.enemies || []).some(group => group.type === 'gundos')))) {
      street03.waves = [{
        trigger: 'onEnter',
        enemies: [{ type: 'gundos', count: 1, side: 'right' }]
      }];
    }
  }

  function getPostBossMusicKey(scene) {
    const level = scene && scene.getLevelConfig ? scene.getLevelConfig() : null;
    const regionId = level && (level.region || level.regionId || level.area || level.chapter);
    const regionMusic = regionId && GAME_CONFIG.regionMusic && GAME_CONFIG.regionMusic[regionId];
    if (regionMusic) return regionMusic;

    if (level && level.musicMode !== 'boss' && level.music) return level.music;
    return GAME_CONFIG.audio && GAME_CONFIG.audio.music && GAME_CONFIG.audio.music.level || 'levelTheme';
  }

  function restorePostBossMusic(scene) {
    const musicKey = getPostBossMusicKey(scene);
    if (musicKey) AudioManager.playMusic(musicKey, true, true);
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
      { label: 'Entrance Y', path: 'enemies.gundos.entranceY', min: 350, max: 820, step: 5 },
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

  class GundosFireball {
    constructor(x, y, boss, laneY) {
      this.enemyType = 'gundosFireball';
      this.x = x;
      this.y = y;
      this.laneY = laneY == null ? y : laneY;
      this.boss = boss || null;
      this.radius = 23;
      this.speed = 5.7;
      this.alive = true;
      this.remove = false;
      this.blocksWaveClear = false;
      this.nonPhysical = true;
      this.canBeHit = false;
      this.spin = Math.random() * Math.PI * 2;
    }

    update(dt, scene) {
      const frameScale = Math.max(0.65, Math.min(1.55, dt / 16.67));
      this.x -= this.speed * frameScale * (GAME_CONFIG.movementSpeedMultiplier || 1);
      this.spin += dt * 0.012;
      const player = scene && scene.player;
      const fireballLaneTolerance = Number(GAME_CONFIG.enemies.gundos.fireballLaneTolerance) || GAME_CONFIG.yHitTolerance;
      if (player && player.hp > 0 && Combat.canProjectileHit(this, player, {
        attackBox: this.getHurtbox(),
        laneY: this.laneY,
        laneTolerance: fireballLaneTolerance
      })) {
        const fireballDamage = Number(GAME_CONFIG.enemies.gundos.fireballDamage) || 24;
        const hit = player.receiveDamage(fireballDamage, {
          source: 'ranged',
          bossAttack: true,
          bossId: 'farEastRoc',
          knockbackX: -46,
          hitStunMs: 160,
          invulnerableMs: 260
        });
        this.remove = true;
        if (hit) {
          if (scene) scene.hitStop = Math.max(scene.hitStop || 0, 55);
          AudioManager.playSfx('bossAppear', 0.35, { playbackRate: 1.35, startAt: 0.01 });
        }
      }
      if (this.x < -80) this.remove = true;
    }

    getHurtbox() {
      return { x: this.x - this.radius, y: this.y - this.radius, w: this.radius * 2, h: this.radius * 2 };
    }

    getRenderDepthY() {
      return this.laneY;
    }

    draw(ctx, debug) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.spin);
      const gradient = ctx.createRadialGradient(0, 0, 3, 0, 0, this.radius);
      gradient.addColorStop(0, '#fff3a6');
      gradient.addColorStop(0.38, '#ff9b21');
      gradient.addColorStop(1, 'rgba(255,42,10,0.08)');
      ctx.shadowColor = '#ff5a1f';
      ctx.shadowBlur = 22;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,220,90,0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.62, -0.4, Math.PI * 1.3);
      ctx.stroke();
      ctx.restore();

      if (debug) {
        const hb = this.getHurtbox();
        ctx.strokeStyle = 'rgba(255,90,0,0.95)';
        ctx.strokeRect(hb.x, hb.y, hb.w, hb.h);
      }
    }

    takeHit() {}
  }

  if (typeof GameApp !== 'undefined') {
    const previousLoadImages = GameApp.prototype.loadImages;
    GameApp.prototype.loadImages = async function () {
      const loaded = await previousLoadImages.call(this);
      const walk0 = await loadImage(Assets.gundos.walk[0]);
      const walk1 = await loadImage(Assets.gundos.walk[1]);
      const swing = await loadImage(Assets.gundos.swing);
      const devil = await loadImage(Assets.gundos.devil);
      const knockdownBody = await loadImage(Assets.gundos.knockdownBody);
      const fireWall = await loadImage(Assets.gundos.fireWall);
      if (!loaded.enemies) loaded.enemies = {};
      loaded.enemies.gundos = {
        idle: walk0 || walk1,
        walk: [walk0 || walk1, walk1 || walk0],
        swing: swing || walk1 || walk0,
        devil: devil || swing || walk1 || walk0,
        knockdownBody: knockdownBody || devil || swing || walk1 || walk0,
        dead: knockdownBody || devil || swing || walk1 || walk0,
        fireWall
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
      this.guardSpawned = false;
      this.medicSpawnedOnce = false;
      this.medicSpawnTimer = this.getConfig().medicSpawnMs || 1200;
      this.fireballTimer = 1600;
      this.fireWallDamageTimer = 0;
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
        AudioManager.registerExternalAudio(this.voice, { owner: 'gundos', channel: 'sfx' });
        this.voice.addEventListener('ended', () => {
          this.voiceEnded = true;
          AudioManager.setVoiceDucking(false, 'gundosVoice');
        });
        this.voice.addEventListener('error', () => {
          this.voice = null;
          AudioManager.setVoiceDucking(false, 'gundosVoice');
        });
        const result = this.voice.play();
        if (result && result.then) {
          result.then(() => { this.voiceStarted = true; }).catch(() => {
            this.voiceStarted = false;
            AudioManager.setVoiceDucking(false, 'gundosVoice');
          });
        } else {
          this.voiceStarted = true;
        }
        AudioManager.setVoiceDucking(true, 'gundosVoice');
      } catch (error) {
        this.voice = null;
        AudioManager.setVoiceDucking(false, 'gundosVoice');
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
          this.ensureGuardWall(scene);
        }
        this.startVoice();
        return;
      }

      const frameScale = Math.max(0.7, Math.min(1.6, dt / 16.67));
      const movementSpeed = GAME_CONFIG.movementSpeedMultiplier || 1;
      this.x += dx / distance * config.speed * frameScale * movementSpeed;
      this.y += dy / distance * config.speed * GAME_CONFIG.ySpeedMultiplier * frameScale * movementSpeed;
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
      AudioManager.setVoiceDucking(false, 'gundosVoice');
      if (scene) {
        scene.gundosIntroActive = false;
        scene.gundosIntroLocked = false;
        scene.gundosArenaActive = true;
        if (scene.releaseGundosGuardWall) scene.releaseGundosGuardWall();
      }
    }

    ensureGuardWall(scene) {
      if (this.guardSpawned || !scene || !scene.spawnGundosGuardWall) return;
      this.guardSpawned = true;
      scene.spawnGundosGuardWall(this);
    }

    stopVoice() {
      if (!this.voice) return;
      const voice = this.voice;
      try {
        voice.pause();
        voice.currentTime = 0;
      } catch (error) {}
      this.voice = null;
      AudioManager.unregisterExternalAudio(voice);
      AudioManager.setVoiceDucking(false, 'gundosVoice');
    }

    pauseVoice() {
      if (!this.voice || this.voice.ended) return;
      this.voicePausedByGame = true;
      if (this.voice.paused) return;
      try {
        this.voice.pause();
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
        if (this.deathTimer > (this.getConfig().deathHoldMs || 5000) + 1200) this.remove = true;
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
      if (!this.introFinished) {
        this.ensureGuardWall(scene);
        this.updateIntroMedic(dt, scene);
      } else {
        this.enforceFireRing(scene, dt);
        this.updateZetnikPressure(dt, scene);
        this.updateFireballs(dt, scene);
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

    updateIntroMedic(dt, scene) {
      if (!scene || !scene.spawnGundosMedicBastard) return;
      if (this.medicSpawnedOnce) return;
      const activeMedic = (scene.enemies || []).some(enemy =>
        enemy && enemy.alive && !enemy.remove && enemy.enemyType === 'bastard' && enemy.gundosMedic
      );
      if (activeMedic) return;
      this.medicSpawnTimer -= dt;
      if (this.medicSpawnTimer > 0) return;
      scene.spawnGundosMedicBastard(this);
      this.medicSpawnedOnce = true;
      this.medicSpawnTimer = this.getConfig().medicRespawnMs || 12500;
    }

    updateArenaMovement(dt) {
      const config = this.getConfig();
      const top = config.arenaTop || 540;
      const bottom = config.arenaBottom || 675;
      const speed = config.arenaMoveSpeed == null ? 0.6 : config.arenaMoveSpeed;
      this.y += this.arenaMoveDirection * speed * Math.max(0.65, Math.min(1.55, dt / 16.67)) * (GAME_CONFIG.movementSpeedMultiplier || 1);
      if (this.y <= top) {
        this.y = top;
        this.arenaMoveDirection = 1;
      } else if (this.y >= bottom) {
        this.y = bottom;
        this.arenaMoveDirection = -1;
      }
    }

    enforceFireRing(scene, dt) {
      if (!this.transformed || !scene || !scene.player) return;
      const player = scene.player;
      const wall = this.getFireWallRect(scene);
      const inWallLane = player.y >= wall.y - 16 && player.y <= wall.y + wall.h + 18;
      const crossesWall = player.x > wall.x - 38 && player.x < wall.x + wall.w + 38;
      if (!inWallLane || !crossesWall) return;
      player.x = wall.x - 38;
      this.fireWallDamageTimer = Math.max(0, (this.fireWallDamageTimer || 0) - Math.max(0, dt || 0));
      if (this.fireWallDamageTimer <= 0 && player.hp > 0) {
        const config = this.getConfig();
        player.receiveDamage(config.fireWallDamage || 1, {
          source: 'fire',
          ignoreInvulnerability: true,
          hitStunMs: 0,
          invulnerableMs: 120,
          hurtFreezeMs: 0
        });
        player.flash = Math.max(player.flash || 0, 180);
        this.fireWallDamageTimer = config.fireWallDamageIntervalMs || 360;
      }
      if (player.state !== 'knockdown' && player.state !== 'pinned') {
        player.startHitStun(90, 180);
        player.flash = Math.max(player.flash || 0, 180);
      }
    }

    updateFireballs(dt, scene) {
      if (!scene || !scene.spawnGundosFireball) return;
      const config = this.getConfig();
      this.fireballTimer -= dt;
      if (this.fireballTimer > 0) return;
      scene.spawnGundosFireball(this);
      const min = config.fireballSpawnMinMs || 1250;
      const max = Math.max(min, config.fireballSpawnMaxMs || 2350);
      this.fireballTimer = min + Math.random() * (max - min);
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
      const damage = (config.zetnikHitDamage || 1) * ((zetnik && zetnik.gundosDamageMultiplier) || 1);
      this.hp = Math.max(0, this.hp - damage);
      if (scene && scene.addDamageText) scene.addDamageText(damage, this);
      this.flash = 220;
      AudioManager.playSfx('zetnikCrash', 1, { playbackRate: 0.82, startAt: 0.01 });
      if (scene) scene.hitStop = Math.max(scene.hitStop || 0, 80);
      if (this.hp <= 0) this.defeat(scene);
    }

    defeat(scene) {
      if (!this.alive) return;
      this.alive = false;
      this.deathFacing = -(this.facing || -1);
      this.blocksWaveClear = false;
      this.deathTimer = 0;
      this.stopVoice();
      if (scene) {
        scene.gundosIntroActive = false;
        scene.gundosIntroLocked = false;
        scene.gundosArenaActive = false;
        scene.activeGundos = null;
        scene.gundosBossDefeated = true;
        restorePostBossMusic(scene);
        if (scene.startGundosVictoryDelay) scene.startGundosVictoryDelay();
      }
      AudioManager.playSfx('enemyDown', 1, { playbackRate: 0.82, startAt: 0.01 });
    }

    takeHit() {
      this.flash = 120;
    }

    getBodyBox() {
      const box = GAME_CONFIG.hitboxes && GAME_CONFIG.hitboxes.enemies &&
        GAME_CONFIG.hitboxes.enemies.gundos && GAME_CONFIG.hitboxes.enemies.gundos.body;
      if (box) return { x: this.x + box.x, y: this.y + box.y, w: box.w, h: box.h };
      return { x: this.x - 35, y: this.y - 125, w: 70, h: 125 };
    }

    getHurtbox() {
      return this.getBodyBox();
    }

    getPushbox() {
      const box = GAME_CONFIG.hitboxes && GAME_CONFIG.hitboxes.enemies &&
        GAME_CONFIG.hitboxes.enemies.gundos && GAME_CONFIG.hitboxes.enemies.gundos.pushbox;
      if (box) return { x: this.x + box.x, y: this.y + box.y, w: box.w, h: box.h };
      return { x: this.x - 48, y: this.y - 22, w: 96, h: 42 };
    }

    getImage() {
      const set = this.images.enemies.gundos;
      if (!this.alive) return set.knockdownBody || set.dead || set.devil;
      if (this.state === 'devil') return set.devil;
      if (this.state === 'swing') return set.swing;
      return set.walk[this.walkFrame] || set.idle;
    }

    draw(ctx, debug) {
      const image = this.getImage();
      if (!image) return;
      const scale = this.alive ? this.getConfig().scale : this.getConfig().scale * 0.85;
      const width = image.width * scale;
      const height = image.height * scale;
      const drawOffsetY = !this.alive ? 199 * scale : 0;
      ctx.save();
      if (!this.alive) {
        const holdMs = this.getConfig().deathHoldMs || 5000;
        ctx.globalAlpha = Math.max(0, 1 - Math.max(0, this.deathTimer - holdMs) / 1200);
      }
      else if (this.flash > 0) {
        this.flash = Math.max(0, this.flash - 16);
        ctx.globalAlpha = 0.55;
      }
      ctx.translate(this.x, this.y);
      const renderFacing = this.alive ? this.facing : (this.deathFacing || this.facing);
      if (renderFacing < 0) ctx.scale(-1, 1);
      ctx.drawImage(image, -width / 2, -height + drawOffsetY, width, height);
      ctx.restore();
      this.drawHealthBar(ctx);

      if (debug) {
        const body = this.getBodyBox();
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 2;
        ctx.strokeRect(body.x, body.y, body.w, body.h);
      }
    }

    drawFireWall(ctx, scene) {
      const set = this.images.enemies.gundos || {};
      const img = set.fireWall;
      const wall = this.getFireWallRect(scene);
      ctx.save();
      if (img) {
        ctx.globalAlpha = 0.94;
        ctx.drawImage(img, wall.x, wall.y, wall.w, wall.h);
      } else {
        const gradient = ctx.createLinearGradient(wall.x, wall.y, wall.x + wall.w, wall.y);
        gradient.addColorStop(0, 'rgba(255,70,15,0.15)');
        gradient.addColorStop(0.5, 'rgba(255,210,60,0.95)');
        gradient.addColorStop(1, 'rgba(255,70,15,0.15)');
        ctx.shadowColor = '#ff4a17';
        ctx.shadowBlur = 24;
        ctx.fillStyle = gradient;
        ctx.fillRect(wall.x, wall.y + wall.h * 0.42, wall.w, Math.max(20, wall.h * 0.16));
      }
      ctx.restore();
    }

    getFireWallRect(scene) {
      const level = scene && scene.getLevelConfig ? scene.getLevelConfig() : null;
      const configured = level && level.bossFireWall;
      if (configured && Number.isFinite(configured.x) && Number.isFinite(configured.y) &&
          Number.isFinite(configured.w) && Number.isFinite(configured.h)) {
        return configured;
      }

      const zone = scene && scene.getWalkZone ? scene.getWalkZone() : {
        left: 0,
        top: GAME_CONFIG.laneTop,
        bottom: GAME_CONFIG.laneBottom
      };
      const x = Math.max((zone.left || 0) + 18, this.x - 520);
      return {
        x,
        y: zone.top - 12,
        w: Math.max(220, this.x - x - 18),
        h: zone.bottom - zone.top + 36
      };
    }

    drawHealthBar(ctx) {
      if (!this.alive) return;
      const maxHp = Math.max(1, this.maxHp || this.getConfig().hp || 1);
      const ratio = Math.max(0, Math.min(1, this.hp / maxHp));
      const w = 360;
      const h = 18;
      const x = GAME_CONFIG.width / 2 - w / 2;
      const y = 94;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
      ctx.fillStyle = '#5f1010';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#ff3b30';
      ctx.fillRect(x, y, w * ratio, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff0d0';
      ctx.fillText(`GUNDOS ${Math.ceil(this.hp)} / ${Math.ceil(maxHp)}`, GAME_CONFIG.width / 2, y + h / 2 + 1);
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
      this.gundosFloatTexts = [];
      this.gundosVictoryDelayMs = 0;
      this.gundosVictoryPending = false;
      this.bossVictoryReady = false;
      this.gundosBossDefeated = false;
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

    LevelScene.prototype.spawnGundosFireball = function (boss) {
      const lanes = this.getGundosLanes();
      const laneY = lanes[Math.floor(Math.random() * lanes.length)];
      const y = laneY - 88;
      const x = (boss ? boss.x : GAME_CONFIG.width - 120) - 82;
      const ball = new GundosFireball(x, y, boss, laneY);
      this.enemies.push(ball);
      AudioManager.playSfx('punch', 0.28, { playbackRate: 0.68, startAt: 0.01 });
      return ball;
    };

    LevelScene.prototype.startGundosVictoryDelay = function () {
      if (this.gundosVictoryPending || this.bossVictoryReady) return;
      this.startBossVictoryExit((GAME_CONFIG.enemies.gundos && GAME_CONFIG.enemies.gundos.victoryDelayMs) || 4800);
    };

    // Bosses use this shared exit: let the defeat pose breathe, then reveal the
    // regular green exit arrow. Future bosses can call this method directly.
    LevelScene.prototype.startBossVictoryExit = function (delayMs) {
      if (this.gundosVictoryPending || this.bossVictoryReady) return;
      this.gundosVictoryPending = true;
      this.gundosVictoryDelayMs = Math.max(0, Number(delayMs) || 0);
      this.encounterActive = false;
      this.encounterCleared = false;
      this.nonBlockingWaveTimer = 0;
      this.pendingWave = null;
      this.pendingWaveTimer = 0;
    };

    LevelScene.prototype.spawnGundosGuardWall = function (boss) {
      const lanes = this.getGundosLanes();
      const count = Math.max(1, (GAME_CONFIG.enemies.gundos && GAME_CONFIG.enemies.gundos.guardZetniks) || 3);
      const start = Math.max(0, Math.floor((lanes.length - count) / 2));
      for (let index = 0; index < count; index++) {
        const lane = lanes[Math.min(lanes.length - 1, start + index)];
        const id = this.enemies.length + Math.floor(Math.random() * 1000);
        const x = (boss ? boss.x : GAME_CONFIG.width - 220) - 138 - index * 10;
        const enemy = new ZetnikEnemy(x, lane, this.images, id);
        if (enemy.setupGundosGuard) enemy.setupGundosGuard(boss, x, lane);
        this.enemies.push(enemy);
      }
      this.playEnemyAppearSound('zetnik');
    };

    LevelScene.prototype.spawnGundosMedicBastard = function (boss) {
      const zone = this.getWalkZone ? this.getWalkZone() : {
        left: 0,
        top: GAME_CONFIG.laneTop,
        bottom: GAME_CONFIG.laneBottom
      };
      const id = this.enemies.length + Math.floor(Math.random() * 1000);
      const y = Math.min(zone.bottom - 26, Math.max(zone.top + 28, (this.player && this.player.y) || 620));
      const enemy = new BastardEnemy(-70, y, this.images, id);
      const targetX = Math.min(zone.left + 315, (boss ? boss.x - 520 : 315));
      if (enemy.setupGundosMedic) enemy.setupGundosMedic(targetX, y);
      this.enemies.push(enemy);
      this.playEnemyAppearSound('bastard');
      return enemy;
    };

    LevelScene.prototype.addGundosFloatText = function (text, x, y, color) {
      if (!this.gundosFloatTexts) this.gundosFloatTexts = [];
      this.gundosFloatTexts.push({ text, x, y, color: color || '#ffffff', age: 0 });
    };

    LevelScene.prototype.updateGundosFloatTexts = function (dt) {
      if (!this.gundosFloatTexts) return;
      for (const item of this.gundosFloatTexts) {
        item.age += dt;
        item.y -= 0.035 * dt;
      }
      this.gundosFloatTexts = this.gundosFloatTexts.filter(item => item.age < 900);
    };

    LevelScene.prototype.drawGundosFloatTexts = function (ctx) {
      if (!this.gundosFloatTexts || !this.gundosFloatTexts.length) return;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 22px Arial';
      for (const item of this.gundosFloatTexts) {
        const alpha = Math.max(0, 1 - item.age / 900);
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0,0,0,0.75)';
        ctx.fillStyle = item.color;
        ctx.strokeText(item.text, item.x, item.y);
        ctx.fillText(item.text, item.x, item.y);
      }
      ctx.restore();
    };

    LevelScene.prototype.releaseGundosGuardWall = function () {
      for (const enemy of this.enemies || []) {
        if (enemy && enemy.gundosMinion && enemy.gundosGuarding && enemy.releaseGundosGuard) {
          enemy.releaseGundosGuard();
        }
      }
    };

    const previousSeparateEnemies = LevelScene.prototype.separateEnemies;
    LevelScene.prototype.separateEnemies = function (dt, force) {
      const saved = [];
      for (const enemy of this.enemies || []) {
        if (enemy && enemy.enemyType === 'gundos') {
          saved.push({ enemy, x: enemy.x, y: enemy.y });
        }
      }
      previousSeparateEnemies.call(this, dt, force);
      for (const item of saved) {
        item.enemy.x = item.x;
        item.enemy.y = item.y;
      }
    };

    const previousEnemyHasPhysicalPresence = LevelScene.prototype.enemyHasPhysicalPresence;
    LevelScene.prototype.enemyHasPhysicalPresence = function (enemy) {
      if (enemy && enemy.nonPhysical) return false;
      return previousEnemyHasPhysicalPresence.call(this, enemy);
    };

    const previousNextScreen = LevelScene.prototype.nextScreen;
    LevelScene.prototype.nextScreen = function () {
      if (this.gundosVictoryPending) return;
      if (this.bossVictoryReady) {
        this.bossVictoryReady = false;
        if (this.game && this.game.completeCampaignRegion) this.game.completeCampaignRegion();
        return;
      }
      previousNextScreen.call(this);
    };

    const previousSceneUpdate = LevelScene.prototype.update;
    LevelScene.prototype.update = function (dt) {
      previousSceneUpdate.call(this, dt);
      if (this.gundosVictoryPending) {
        this.encounterCleared = false;
        this.gundosVictoryDelayMs -= dt;
        if (this.gundosVictoryDelayMs <= 0) {
          this.gundosVictoryPending = false;
          this.bossVictoryReady = true;
          this.encounterActive = false;
          this.encounterCleared = true;
        }
      }
      this.updateGundosFloatTexts(dt);
    };

    const previousSceneDraw = LevelScene.prototype.draw;
    LevelScene.prototype.draw = function (ctx) {
      if (this.isGundosFinaleScene && this.isGundosFinaleScene()) {
        this.drawGundosFinaleScene(ctx);
        return;
      }
      previousSceneDraw.call(this, ctx);
      if (this.drawLevelForegroundObjects) this.drawLevelForegroundObjects(ctx);
      this.drawGundosFloatTexts(ctx);
    };

    LevelScene.prototype.isGundosFinaleScene = function () {
      return !!((this.enemies || []).some(enemy => enemy && (
        enemy.enemyType === 'gundos' ||
        enemy.enemyType === 'gundosFireball' ||
        enemy.gundosMinion
      )) || this.gundosArenaActive || this.gundosVictoryPending);
    };

    LevelScene.prototype.drawGundosFinaleScene = function (ctx) {
      const bg = this.images.streets[this.screenIndex] || this.images.streets[0];
      if (bg) ctx.drawImage(bg, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
      else {
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
      }
      if (this.drawLevelBackgroundEffects) this.drawLevelBackgroundEffects(ctx);

      ctx.fillStyle = 'rgba(255,255,255,0.025)';
      ctx.fillRect(0, GAME_CONFIG.laneTop, GAME_CONFIG.width, GAME_CONFIG.laneBottom - GAME_CONFIG.laneTop);
      if (this.drawLevelForegroundObjects) this.drawLevelForegroundObjects(ctx);

      const boss = this.activeGundos || (this.enemies || []).find(enemy => enemy && enemy.enemyType === 'gundos');
      if (boss && boss.alive && boss.transformed && boss.introFinished && boss.drawFireWall) boss.drawFireWall(ctx, this);

      const entities = [{ type: 'player', y: this.player.y, ref: this.player }];
      for (const enemy of this.enemies) {
        const renderDepthY = typeof enemy.getRenderDepthY === 'function' ? enemy.getRenderDepthY() : enemy.y;
        entities.push({ type: 'enemy', y: renderDepthY, ref: enemy });
      }
      entities.sort((a, b) => a.y - b.y);
      for (const entity of entities) entity.ref.draw(ctx, this.debug);
      // The boss finale has its own renderer. Keep rewards visible here too,
      // otherwise kiosk support items exist in the scene but never appear.
      for (const pickup of this.pickups || []) pickup.draw(ctx);
      if (this.drawDamageTexts) this.drawDamageTexts(ctx);

      if (this.gundosVictoryPending) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = 'rgba(255, 220, 120, 0.86)';
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 4;
        const text = 'ТВАРЬ ПОВЕРЖЕНА';
        ctx.strokeText(text, GAME_CONFIG.width / 2, 360);
        ctx.fillText(text, GAME_CONFIG.width / 2, 360);
        ctx.restore();
      }

      if (this.bossVictoryReady) {
        if (this.drawExitArrow) this.drawExitArrow(ctx);
      }

      HUD.draw(ctx, this);
      this.drawGundosFloatTexts(ctx);

      if (this.debug) {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, GAME_CONFIG.laneTop, GAME_CONFIG.width, GAME_CONFIG.laneBottom - GAME_CONFIG.laneTop);
      }
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
      let backgroundPauseActive = false;
      let resumeLevelOnFocus = false;

      const suspendForBackground = () => {
        if (backgroundPauseActive) return;

        const game = window.game || null;
        backgroundPauseActive = true;
        resumeLevelOnFocus = !!(game && game.state === 'level' && !game.paused);
        if (resumeLevelOnFocus) {
          game.paused = true;
          if (game.scene && game.scene.pauseGundosVoice) game.scene.pauseGundosVoice();
          game.gundosAudioPauseState = true;
        }
        if (AudioManager.pauseAllAudio) AudioManager.pauseAllAudio();
      };

      const resumeFromBackground = () => {
        if (!backgroundPauseActive || document.hidden) return;

        const game = window.game || null;
        const resumeLevel = resumeLevelOnFocus && game && game.state === 'level';
        backgroundPauseActive = false;
        resumeLevelOnFocus = false;
        if (resumeLevel) {
          game.paused = false;
          if (game.scene && game.scene.resumeGundosVoice) game.scene.resumeGundosVoice();
          game.gundosAudioPauseState = false;
        }
        if (AudioManager.resumePausedAudio && (!game || !game.paused)) AudioManager.resumePausedAudio();
      };

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) suspendForBackground();
        else resumeFromBackground();
      });
      window.addEventListener('blur', suspendForBackground);
      window.addEventListener('focus', resumeFromBackground);
    });
  }

  configureFarEastFinale();
})();
