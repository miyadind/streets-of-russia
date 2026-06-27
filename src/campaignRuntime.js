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

  function getLevelByIndex(index) {
    const key = getLevelOrder()[index];
    return key && GAME_CONFIG.levels ? GAME_CONFIG.levels[key] : null;
  }

  function getLevelRegionId(level) {
    return level && (level.region || level.regionKey || level.area || level.chapter) || '';
  }

  function getActiveRegionIndex(game) {
    const map = game && game.campaignMap;
    return map && Number.isFinite(map.activeIndex) ? map.activeIndex : 0;
  }

  function getActiveRegionId(game) {
    const map = game && game.campaignMap;
    const activeIndex = getActiveRegionIndex(game);
    return map && Array.isArray(map.order) ? map.order[activeIndex] || map.order[0] || '' : '';
  }

  function getRegionStartIndexById(regionId) {
    const order = getLevelOrder();
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
    const mapOrder = game && game.campaignMap && Array.isArray(game.campaignMap.order) ? game.campaignMap.order : [];
    const regionIndex = clamp(Number(save && save.campaign && save.campaign.currentRegionIndex) || 0, 0, Math.max(0, mapOrder.length - 1));
    const regionId = mapOrder[regionIndex] || save && save.campaign && save.campaign.currentRegion || '';
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

  function startActiveRegionScene(game) {
    if (!game || !game.scene) return;
    const targetIndex = getActiveRegionStartIndex(game);
    if (game.scene.screenIndex === targetIndex) {
      placePlayerAtLevelStart(game.scene);
      return;
    }
    setSceneScreen(game.scene, targetIndex);
  }

  window.CampaignRuntime = {
    clamp,
    normalizeRegionId,
    getLevelOrder,
    getLevelRegionId,
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
    startActiveRegionScene
  };
})();
