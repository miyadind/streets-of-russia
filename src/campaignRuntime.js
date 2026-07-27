(function () {
  if (typeof window === 'undefined' || typeof GAME_CONFIG === 'undefined') return;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeRegionId(regionId) {
    return String(regionId || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
  }

  function getLevelOrder() {
    return Array.isArray(GAME_CONFIG.levelOrder) ? GAME_CONFIG.levelOrder : [];
  }

  function getRegionDefinitions() {
    if (Array.isArray(GAME_CONFIG.campaignRegions) && GAME_CONFIG.campaignRegions.length) {
      return GAME_CONFIG.campaignRegions.filter(region => region && region.mapId && Array.isArray(region.levels));
    }

    const grouped = [];
    const byRegion = {};
    for (const key of getLevelOrder()) {
      const level = GAME_CONFIG.levels && GAME_CONFIG.levels[key];
      const regionId = getLevelRegionId(level);
      if (!regionId) continue;
      if (!byRegion[regionId]) {
        byRegion[regionId] = { mapId: regionId, levelRegion: regionId, levels: [] };
        grouped.push(byRegion[regionId]);
      }
      byRegion[regionId].levels.push(key);
    }
    return grouped;
  }

  function findRegionDefinition(regionId) {
    const wanted = normalizeRegionId(regionId);
    if (!wanted) return null;
    return getRegionDefinitions().find(region => (
      normalizeRegionId(region.mapId) === wanted ||
      normalizeRegionId(region.levelRegion) === wanted ||
      normalizeRegionId(region.id) === wanted
    )) || null;
  }

  function getLevelByIndex(index) {
    const key = getLevelOrder()[index];
    return key && GAME_CONFIG.levels ? GAME_CONFIG.levels[key] : null;
  }

  function getLevelRegionId(level) {
    return level && (level.region || level.regionKey || level.area || level.chapter) || '';
  }

  function getLevelMusicKey(level) {
    const fallback = (GAME_CONFIG.audio && GAME_CONFIG.audio.music && GAME_CONFIG.audio.music.level) || 'levelTheme';
    if (!level) return fallback;
    if (level.musicMode === 'boss') return level.music || (GAME_CONFIG.audio && GAME_CONFIG.audio.music && GAME_CONFIG.audio.music.boss) || 'bossTheme';

    const regionId = getLevelRegionId(level);
    const regionMusic = GAME_CONFIG.regionMusic && GAME_CONFIG.regionMusic[regionId];
    return regionMusic || level.music || fallback;
  }

  function getActiveRegionIndex(game) {
    const map = game && game.campaignMap;
    return map && Number.isFinite(map.activeIndex) ? map.activeIndex : 0;
  }

  function getActiveRegionId(game) {
    const map = game && game.campaignMap;
    const activeIndex = getActiveRegionIndex(game);
    const route = getRegionDefinitions();
    if (route[activeIndex]) return route[activeIndex].mapId;
    return map && Array.isArray(map.order) ? map.order[activeIndex] || map.order[0] || '' : '';
  }

  function getRegionStartIndexById(regionId) {
    const order = getLevelOrder();
    const definition = findRegionDefinition(regionId);
    if (definition && definition.levels && definition.levels.length) {
      const configuredIndex = order.indexOf(definition.levels[0]);
      if (configuredIndex >= 0) return configuredIndex;
    }

    const wanted = normalizeRegionId(regionId);
    if (!wanted) return 0;
    for (let index = 0; index < order.length; index++) {
      if (normalizeRegionId(getLevelRegionId(getLevelByIndex(index))) === wanted) return index;
    }

    return 0;
  }

  function getRegionStartIndexByScreen(screenIndex) {
    const order = getLevelOrder();
    if (!order.length) return 0;
    const currentIndex = clamp(Number(screenIndex) || 0, 0, order.length - 1);
    const currentKey = order[currentIndex];
    const definition = getRegionDefinitions().find(region => region.levels.includes(currentKey));
    if (definition && definition.levels.length) {
      const configuredIndex = order.indexOf(definition.levels[0]);
      return configuredIndex >= 0 ? configuredIndex : currentIndex;
    }

    const regionId = getLevelRegionId(getLevelByIndex(currentIndex));
    if (!regionId) return currentIndex;
    let startIndex = currentIndex;
    for (let index = currentIndex - 1; index >= 0; index -= 1) {
      const levelRegionId = getLevelRegionId(getLevelByIndex(index));
      if (levelRegionId !== regionId) break;
      startIndex = index;
    }
    return startIndex;
  }

  function getRegionEndIndexByStart(startIndex) {
    const order = getLevelOrder();
    if (!order.length) return 0;
    const safeStart = clamp(Number(startIndex) || 0, 0, order.length - 1);
    const startKey = order[safeStart];
    const definition = getRegionDefinitions().find(region => region.levels.includes(startKey));
    if (definition && definition.levels.length) {
      let endIndex = safeStart;
      for (const key of definition.levels) {
        const index = order.indexOf(key);
        if (index >= 0) endIndex = Math.max(endIndex, index);
      }
      return endIndex;
    }

    const regionId = getLevelRegionId(getLevelByIndex(safeStart));
    if (!regionId) return safeStart;
    let endIndex = safeStart;
    for (let index = safeStart + 1; index < order.length; index += 1) {
      const levelRegionId = getLevelRegionId(getLevelByIndex(index));
      if (levelRegionId !== regionId) break;
      endIndex = index;
    }
    return endIndex;
  }

  function getActiveRegionStartIndex(game) {
    const order = getLevelOrder();
    if (!order.length) return 0;
    const byId = getRegionStartIndexById(getActiveRegionId(game));
    if (byId || normalizeRegionId(getActiveRegionId(game))) return byId;
    return clamp(getActiveRegionIndex(game) * 3, 0, order.length - 1);
  }

  function getLocalScreenIndex(game) {
    const scene = game && game.scene;
    if (!scene || !Number.isFinite(scene.screenIndex)) return 0;
    const startIndex = getRegionStartIndexByScreen(scene.screenIndex);
    const endIndex = getRegionEndIndexByStart(startIndex);
    return clamp(scene.screenIndex - startIndex, 0, Math.max(0, endIndex - startIndex));
  }

  function getAbsoluteScreenIndexForSave(game, save) {
    const order = getLevelOrder();
    if (!order.length) return 0;
    const route = getRegionDefinitions();
    const mapOrder = game && game.campaignMap && Array.isArray(game.campaignMap.order) ? game.campaignMap.order : route.map(region => region.mapId);
    const regionIndex = clamp(Number(save && save.campaign && save.campaign.currentRegionIndex) || 0, 0, Math.max(0, mapOrder.length - 1));
    const regionId = (route[regionIndex] && route[regionIndex].mapId) || mapOrder[regionIndex] || save && save.campaign && save.campaign.currentRegion || '';
    const startIndex = getRegionStartIndexById(regionId) || clamp(regionIndex * 3, 0, order.length - 1);
    const endIndex = getRegionEndIndexByStart(startIndex);
    const localIndex = clamp(Number(save && save.campaign && save.campaign.currentScreen) || 0, 0, Math.max(0, endIndex - startIndex));
    return clamp(startIndex + localIndex, 0, order.length - 1);
  }

  function resetGundosSceneState(scene) {
    if (!scene) return;
    if (scene.stopGundosVoice) scene.stopGundosVoice();
    scene.gundosIntroActive = false;
    scene.gundosIntroLocked = false;
    scene.gundosArenaActive = false;
    scene.gundosVictoryPending = false;
    scene.gundosVictoryDelayMs = 0;
    scene.activeGundos = null;
    scene.gundosFloatTexts = [];
  }

  function placePlayerAtLevelStart(scene) {
    if (!scene || !scene.player) return;
    const level = scene.getLevelConfig ? scene.getLevelConfig() : null;
    const start = level && level.playerStart || { x: 190, y: 620 };
    scene.player.x = Number(start.x) || 190;
    scene.player.y = Number(start.y) || 620;
    scene.player.facing = scene.player.x > GAME_CONFIG.width / 2 ? -1 : 1;
    scene.player.state = 'idle';
    if (scene.player.releaseFromPin) scene.player.releaseFromPin();
  }

  function setSceneScreen(scene, screenIndex, options) {
    if (!scene) return;
    const order = getLevelOrder();
    const maxIndex = Math.max(0, order.length - 1);
    const targetIndex = clamp(Number(screenIndex) || 0, 0, maxIndex);
    resetGundosSceneState(scene);
    scene.screenIndex = targetIndex;
    placePlayerAtLevelStart(scene);
    if (!options || options.spawn !== false) {
      if (scene.spawnInitialWave) scene.spawnInitialWave();
    }
  }

  function playSceneMusic(scene) {
    if (!scene || !scene.game || !scene.getLevelConfig) return;
    const level = scene.getLevelConfig();
    const musicKey = getLevelMusicKey(level);
    AudioManager.playMusic(musicKey, true, true);

    // A campaign transition can change the screen after the first music call.
    // Retry once after the new track has had time to load in the browser.
    window.setTimeout(() => {
      if (!scene.game || scene.game.state !== 'level' || scene.getLevelConfig() !== level) return;
      if (AudioManager.currentMusicKey !== musicKey || (AudioManager.currentMusic && AudioManager.currentMusic.paused)) {
        AudioManager.playMusic(musicKey, false, true);
      }
    }, 650);
  }

  function startActiveRegionScene(game) {
    if (!game || !game.scene) return;
    const order = getLevelOrder();
    const devStartIndex = game.devStartLevelKey ? order.indexOf(game.devStartLevelKey) : -1;
    const targetIndex = devStartIndex >= 0 ? devStartIndex : getActiveRegionStartIndex(game);
    game.devStartLevelKey = null;
    if (game.scene.screenIndex === targetIndex) {
      placePlayerAtLevelStart(game.scene);
    } else {
      setSceneScreen(game.scene, targetIndex);
    }
    playSceneMusic(game.scene);
  }

  window.CampaignRuntime = {
    clamp,
    normalizeRegionId,
    getLevelOrder,
    getRegionDefinitions,
    findRegionDefinition,
    getLevelRegionId,
    getLevelMusicKey,
    getActiveRegionIndex,
    getActiveRegionId,
    getRegionStartIndexById,
    getRegionStartIndexByScreen,
    getRegionEndIndexByStart,
    getActiveRegionStartIndex,
    getLocalScreenIndex,
    getAbsoluteScreenIndexForSave,
    resetGundosSceneState,
    placePlayerAtLevelStart,
    setSceneScreen,
    playSceneMusic,
    startActiveRegionScene
  };
})();
