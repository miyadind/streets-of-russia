(function () {
  if (typeof GAME_CONFIG !== 'undefined') {
    GAME_CONFIG.runtimeRevisionPatchVersion = 1;
  }

  function normalizedSrc(value) {
    return String(value || '').replace(/\\/g, '/').toLowerCase();
  }

  function isHorseAppearSource(value) {
    return normalizedSrc(value).includes('assets/enemies/horse/appear.mp3');
  }

  function getAudioSource(audio) {
    return audio && audio.src ? audio.src : '';
  }

  function shouldBlockHorseAppear(key, options) {
    if (key === 'horseAppear') return AudioManager.enemyAppearType !== 'horse';
    if (isHorseAppearSource(options && (options.src || options.path))) return AudioManager.enemyAppearType !== 'horse';
    const registered = AudioManager.sfx && key ? AudioManager.sfx[key] : null;
    const optional = AudioManager.optionalSfx && key ? AudioManager.optionalSfx[key] : null;
    return (isHorseAppearSource(getAudioSource(registered)) || isHorseAppearSource(getAudioSource(optional))) &&
      AudioManager.enemyAppearType !== 'horse';
  }

  function stopBlockedHorseAppearAudio() {
    if (typeof AudioManager === 'undefined') return;
    AudioManager.activeSfx = (AudioManager.activeSfx || []).filter((audio) => {
      if (!audio || !isHorseAppearSource(getAudioSource(audio))) return true;
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (error) {}
      return false;
    });
  }

  function installAudioRevision() {
    if (typeof AudioManager === 'undefined' || AudioManager.runtimeRevisionPatchApplied) return;

    const previousPlaySfx = AudioManager.playSfx.bind(AudioManager);
    AudioManager.playSfx = function (key, volume, options) {
      if (shouldBlockHorseAppear(key, options || {})) return false;
      return previousPlaySfx(key, volume, options);
    };

    const previousPlayOptionalSfx = AudioManager.playOptionalSfx.bind(AudioManager);
    AudioManager.playOptionalSfx = function (key, volume, options) {
      if (shouldBlockHorseAppear(key, options || {})) return false;
      return previousPlayOptionalSfx(key, volume, options);
    };

    AudioManager.stopBlockedHorseAppearAudio = stopBlockedHorseAppearAudio;
    AudioManager.runtimeRevisionPatchApplied = true;
  }

  function getLevelVehicles(scene) {
    const level = scene && scene.getLevelConfig ? scene.getLevelConfig() : null;
    const list = Array.isArray(level && level.interactives) ? level.interactives : [];
    const vehicles = list.filter(item => item && item.type === 'vehicleObstacle');
    const key = scene && scene.getLevelKey ? scene.getLevelKey() : null;
    if (key === 'street01' && !vehicles.some(item => item.id === 'policeBuhanka')) {
      vehicles.push({
        id: 'policeBuhanka',
        type: 'vehicleObstacle',
        image: 'assets/vehicles/buhanka.png',
        drawRect: { x: 910, y: 430, w: 310, h: 207 },
        blockBox: { x: 930, y: 558, w: 285, h: 86 }
      });
    }
    return vehicles;
  }

  const vehicleImageCache = {};
  function getVehicleImage(src) {
    if (!src) return null;
    if (!vehicleImageCache[src]) {
      const img = new Image();
      img.src = src;
      vehicleImageCache[src] = img;
    }
    return vehicleImageCache[src];
  }

  function drawVehicleFallback(ctx, rect) {
    ctx.save();
    ctx.fillStyle = 'rgba(18, 38, 58, 0.94)';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 3;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = '#dce9f5';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('POLICE VAN', rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.restore();
  }

  function drawRuntimeVehicles(scene, ctx) {
    for (const item of getLevelVehicles(scene)) {
      const rect = item.drawRect;
      if (!rect) continue;
      const image = getVehicleImage(item.image);
      if (image && image.complete && image.naturalWidth > 0) {
        try {
          ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h);
          continue;
        } catch (error) {}
      }
      drawVehicleFallback(ctx, rect);
    }
  }

  function installSceneRevision() {
    if (typeof LevelScene === 'undefined' || LevelScene.prototype.runtimeRevisionPatchApplied) return;

    const previousPlayEnemyAppearSound = LevelScene.prototype.playEnemyAppearSound;
    LevelScene.prototype.playEnemyAppearSound = function (type) {
      if (type === 'dogRegime') {
        stopBlockedHorseAppearAudio();
        return false;
      }
      if (typeof AudioManager !== 'undefined') AudioManager.enemyAppearType = type || null;
      try {
        return previousPlayEnemyAppearSound ? previousPlayEnemyAppearSound.call(this, type) : false;
      } finally {
        if (typeof AudioManager !== 'undefined') AudioManager.enemyAppearType = null;
      }
    };

    const previousSpawnEnemyGroup = LevelScene.prototype.spawnEnemyGroup;
    LevelScene.prototype.spawnEnemyGroup = function (group) {
      if (group && group.type === 'dogRegime') stopBlockedHorseAppearAudio();
      return previousSpawnEnemyGroup.call(this, group);
    };

    const previousDraw = LevelScene.prototype.draw;
    LevelScene.prototype.draw = function (ctx) {
      previousDraw.call(this, ctx);
      drawRuntimeVehicles(this, ctx);
    };

    LevelScene.prototype.runtimeRevisionPatchApplied = true;
  }

  installAudioRevision();
  installSceneRevision();
}());
