(function () {
  if (typeof GameApp === 'undefined') return;

  const SAVE_KEY = 'streetsOfRussiaCampaignSaveV1';
  const STATS_KEY = 'streetsOfRussiaPlayerStatsV1';
  const HEROES = ['alexey', 'anna', 'boris'];
  const DEFAULT_NAME = 'Игрок';
  const FLUSH_INTERVAL_MS = 5000;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function parseJson(raw) {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (error) { return null; }
  }

  function readJson(key) {
    try { return parseJson(localStorage.getItem(key)); } catch (error) { return null; }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('Could not write local save data:', error);
      return false;
    }
  }

  function removeJson(key) {
    try { localStorage.removeItem(key); } catch (error) {}
  }

  function sanitizeName(name) {
    const clean = String(name || '').trim().replace(/\s+/g, ' ').slice(0, 18);
    return clean || DEFAULT_NAME;
  }

  function getHeroMaxHp(heroKey) {
    const hero = GAME_CONFIG.heroes && GAME_CONFIG.heroes[heroKey];
    return hero && Number(hero.hp) ? Number(hero.hp) : 100;
  }

  function defaultHeroHp() {
    return {
      alexey: getHeroMaxHp('alexey'),
      anna: getHeroMaxHp('anna'),
      boris: getHeroMaxHp('boris')
    };
  }

  function defaultDefeatedHeroes() {
    return { alexey: false, anna: false, boris: false };
  }

  function getAliveCount(defeatedHeroes) {
    return HEROES.filter(key => !(defeatedHeroes && defeatedHeroes[key])).length;
  }

  function getTotalHp(heroHp, defeatedHeroes) {
    return HEROES.reduce((sum, key) => {
      if (defeatedHeroes && defeatedHeroes[key]) return sum;
      return sum + clamp(Number(heroHp && heroHp[key]) || 0, 0, getHeroMaxHp(key));
    }, 0);
  }

  function getFirstAliveHero(game) {
    const defeated = game && game.defeatedHeroes;
    return HEROES.find(key => !(defeated && defeated[key])) || 'boris';
  }

  function createDefaultProfileStats() {
    return {
      statsVersion: 1,
      totalPageLoads: 0,
      totalNewGames: 0,
      totalContinues: 0,
      totalGameOvers: 0,
      totalWins: 0,
      totalPlaySeconds: 0,
      bestScore: 0,
      lastScore: 0,
      lastPlayerName: DEFAULT_NAME,
      lastRuns: []
    };
  }

  function loadProfileStats() {
    const loaded = readJson(STATS_KEY);
    const stats = Object.assign(createDefaultProfileStats(), loaded && loaded.statsVersion === 1 ? loaded : {});
    stats.lastRuns = Array.isArray(stats.lastRuns) ? stats.lastRuns.slice(0, 10) : [];
    return stats;
  }

  function saveProfileStats(stats) {
    if (!stats) return false;
    stats.statsVersion = 1;
    stats.lastRuns = Array.isArray(stats.lastRuns) ? stats.lastRuns.slice(0, 10) : [];
    return writeJson(STATS_KEY, stats);
  }

  function getCampaignMapOrder(game) {
    return game && game.campaignMap && Array.isArray(game.campaignMap.order) ? game.campaignMap.order : [];
  }

  function getRegionIndex(game) {
    return game && game.campaignMap && Number.isFinite(game.campaignMap.activeIndex) ? game.campaignMap.activeIndex : 0;
  }

  function getScreenIndex(game) {
    if (!game || !game.scene || !Number.isFinite(game.scene.screenIndex)) return 0;
    if (window.CampaignRuntime) return window.CampaignRuntime.getLocalScreenIndex(game);
    const regionIndex = getRegionIndex(game);
    return clamp(game.scene.screenIndex - regionIndex * 3, 0, 2);
  }

  function calculateScore(save) {
    const regionIndex = Number(save && save.campaign && save.campaign.currentRegionIndex) || 0;
    const screenIndex = Number(save && save.campaign && save.campaign.currentScreen) || 0;
    const completedScreens = Math.max(0, regionIndex * 3 + screenIndex);
    const completedRegions = Array.isArray(save && save.campaign && save.campaign.completedRegions)
      ? save.campaign.completedRegions.length
      : regionIndex;
    const defeated = save && save.team && save.team.defeatedHeroes;
    const aliveCount = getAliveCount(defeated);
    const totalHp = getTotalHp(save && save.team && save.team.heroHp, defeated);
    const support = Number(save && save.stats && save.stats.peopleSupport) || 0;
    const playSeconds = Number(save && save.stats && save.stats.runPlaySeconds) || 0;
    const deaths = HEROES.length - aliveCount;

    return Math.max(0, Math.round(
      completedScreens * 1000 +
      completedRegions * 3000 +
      aliveCount * 1500 +
      totalHp * 10 +
      support * 20 -
      deaths * 500 -
      Math.floor(playSeconds / 60) * 25
    ));
  }

  function createSaveFromGame(game) {
    if (game.saveCurrentHeroHp) game.saveCurrentHeroHp();
    if (game.ensureRunState) game.ensureRunState();
    if (game.ensureTeamHpState) game.ensureTeamHpState();

    const order = getCampaignMapOrder(game);
    const regionIndex = getRegionIndex(game);
    const currentScreen = getScreenIndex(game);
    const currentRegion = order[regionIndex] || 'farEast';
    const heroHp = Object.assign(defaultHeroHp(), game.heroHp || {});
    const defeatedHeroes = Object.assign(defaultDefeatedHeroes(), game.defeatedHeroes || {});

    for (const key of HEROES) {
      heroHp[key] = defeatedHeroes[key] ? 0 : clamp(Number(heroHp[key]) || getHeroMaxHp(key), 0, getHeroMaxHp(key));
    }

    const save = {
      saveVersion: 1,
      savedAt: Date.now(),
      playerName: sanitizeName(game.playerName),
      runId: game.currentRunId || null,
      campaign: {
        currentRegion,
        currentRegionIndex: regionIndex,
        currentScreen,
        completedRegions: order.slice(0, regionIndex),
        unlockedRegions: order.slice(0, Math.min(order.length, regionIndex + 1))
      },
      team: {
        activeHero: game.selectedHero || getFirstAliveHero(game),
        heroHp,
        defeatedHeroes
      },
      stats: {
        peopleSupport: game.peopleSupport != null ? game.peopleSupport : 25,
        heroesAlive: getAliveCount(defeatedHeroes),
        heroesLost: HEROES.length - getAliveCount(defeatedHeroes),
        runStartedAt: game.currentRunStartedAt || Date.now(),
        runPlaySeconds: Math.round(game.currentRunPlaySeconds || 0)
      }
    };

    save.stats.score = calculateScore(save);
    return save;
  }

  function readCampaignSave() {
    const save = readJson(SAVE_KEY);
    if (!save || save.saveVersion !== 1) return null;
    return save;
  }

  function writeCampaignSave(game) {
    const save = createSaveFromGame(game);
    writeJson(SAVE_KEY, save);
    if (game.profileStats) {
      game.profileStats.lastPlayerName = save.playerName;
      game.profileStats.lastScore = save.stats.score;
      game.profileStats.bestScore = Math.max(Number(game.profileStats.bestScore) || 0, save.stats.score);
      saveProfileStats(game.profileStats);
    }
    return save;
  }

  function applySaveToGame(game, save) {
    if (!save) return false;

    game.playerName = sanitizeName(save.playerName);
    game.currentRunId = save.runId || ('run-' + Date.now());
    game.currentRunStartedAt = Number(save.stats && save.stats.runStartedAt) || Date.now();
    game.currentRunPlaySeconds = Number(save.stats && save.stats.runPlaySeconds) || 0;
    game.runInProgress = true;
    game.resumeTarget = 'level';
    game.paused = false;
    game.characterSelectMode = null;
    game.casualtyRespawn = null;

    if (game.campaignMap) {
      const maxIndex = Math.max(0, getCampaignMapOrder(game).length - 1);
      game.campaignMap.activeIndex = clamp(Number(save.campaign && save.campaign.currentRegionIndex) || 0, 0, maxIndex);
    }

    game.heroHp = Object.assign(defaultHeroHp(), save.team && save.team.heroHp || {});
    game.defeatedHeroes = Object.assign(defaultDefeatedHeroes(), save.team && save.team.defeatedHeroes || {});
    game.peopleSupport = save.stats && save.stats.peopleSupport != null ? save.stats.peopleSupport : 25;
    game.selectedHero = (save.team && save.team.activeHero) || getFirstAliveHero(game);

    for (const key of HEROES) {
      game.heroHp[key] = game.defeatedHeroes[key] ? 0 : clamp(Number(game.heroHp[key]) || getHeroMaxHp(key), 0, getHeroMaxHp(key));
    }

    return true;
  }

  function buildSceneFromSave(game, save) {
    if (!save) return false;
    applySaveToGame(game, save);
    game.scene = new LevelScene(game, game.images);
    game.scene.player = new Player(game.selectedHero || getFirstAliveHero(game), game.images);
    const targetIndex = window.CampaignRuntime
      ? window.CampaignRuntime.getAbsoluteScreenIndexForSave(game, save)
      : clamp((Number(save.campaign && save.campaign.currentRegionIndex) || 0) * 3 + (Number(save.campaign && save.campaign.currentScreen) || 0), 0, game.scene.images.streets.length - 1);
    if (window.CampaignRuntime) window.CampaignRuntime.setSceneScreen(game.scene, targetIndex, { spawn: false });
    else {
      game.scene.screenIndex = targetIndex;
      game.scene.player.x = 190;
      game.scene.player.y = 620;
      game.scene.player.facing = 1;
    }
    if (game.applySavedHeroHp) game.applySavedHeroHp(game.scene.player, game.scene.player.heroKey || game.selectedHero);
    if (game.scene.spawnInitialWave) game.scene.spawnInitialWave();
    return true;
  }

  function addRunSummary(game, outcome) {
    if (!game.profileStats) return;
    const save = createSaveFromGame(game);
    const summary = {
      playerName: save.playerName,
      outcome,
      score: save.stats.score,
      heroesAlive: save.stats.heroesAlive,
      heroesLost: save.stats.heroesLost,
      region: save.campaign.currentRegion,
      screen: save.campaign.currentScreen,
      playSeconds: save.stats.runPlaySeconds,
      endedAt: Date.now()
    };
    game.profileStats.lastRuns = [summary].concat(game.profileStats.lastRuns || []).slice(0, 10);
    game.profileStats.lastScore = summary.score;
    game.profileStats.bestScore = Math.max(Number(game.profileStats.bestScore) || 0, summary.score);
    if (outcome === 'gameOver') game.profileStats.totalGameOvers += 1;
    if (outcome === 'win') game.profileStats.totalWins += 1;
    saveProfileStats(game.profileStats);
  }

  function askPlayerName(previousName) {
    const typed = window.prompt('Введите имя или никнейм для статистики. Можно оставить пустым.', previousName || '');
    if (typed === null) return sanitizeName(previousName || DEFAULT_NAME);
    return sanitizeName(typed);
  }

  GameApp.prototype.loadCampaignSave = readCampaignSave;
  GameApp.prototype.saveCampaignProgress = function () { return writeCampaignSave(this); };
  GameApp.prototype.clearCampaignSave = function () { removeJson(SAVE_KEY); };
  GameApp.prototype.applyCampaignSave = function (save) { return applySaveToGame(this, save); };
  GameApp.prototype.buildSceneFromCampaignSave = function (save) { return buildSceneFromSave(this, save); };
  GameApp.prototype.getCurrentScore = function () { return calculateScore(createSaveFromGame(this)); };

  const previousInit = GameApp.prototype.init;
  GameApp.prototype.init = async function () {
    this.profileStats = loadProfileStats();
    this.profileStats.totalPageLoads += 1;
    this.playerName = sanitizeName(this.profileStats.lastPlayerName);
    saveProfileStats(this.profileStats);

    await previousInit.call(this);

    const save = this.loadCampaignSave();
    if (save) this.applyCampaignSave(save);
  };

  const previousStartNewCampaign = GameApp.prototype.startNewCampaign;
  GameApp.prototype.startNewCampaign = function () {
    this.profileStats = this.profileStats || loadProfileStats();
    this.profileStats.totalNewGames += 1;
    this.playerName = askPlayerName(this.playerName || this.profileStats.lastPlayerName);
    this.profileStats.lastPlayerName = this.playerName;
    this.currentRunId = 'run-' + Date.now();
    this.currentRunStartedAt = Date.now();
    this.currentRunPlaySeconds = 0;
    this.clearCampaignSave();
    saveProfileStats(this.profileStats);
    previousStartNewCampaign.call(this);
    this.saveCampaignProgress();
  };

  const previousContinueCampaignRun = GameApp.prototype.continueCampaignRun;
  GameApp.prototype.continueCampaignRun = function () {
    const save = this.loadCampaignSave();
    if (save) {
      this.profileStats = this.profileStats || loadProfileStats();
      this.profileStats.totalContinues += 1;
      saveProfileStats(this.profileStats);
      AudioManager.unlock();
      AudioManager.playSfx('menuSelect', 0.85);
      this.buildSceneFromCampaignSave(save);
      this.paused = false;
      this.characterSelectMode = null;
      this.setState('level');
      const level = this.scene && this.scene.getLevelConfig ? this.scene.getLevelConfig() : null;
      AudioManager.playMusic((level && level.music) || (GAME_CONFIG.audio && GAME_CONFIG.audio.music && GAME_CONFIG.audio.music.level) || 'levelTheme', true);
      return true;
    }
    return previousContinueCampaignRun.call(this);
  };

  if (typeof Menu !== 'undefined') {
    const previousGetRuntimeItems = Menu.getRuntimeItems;
    Menu.getRuntimeItems = function (game) {
      if (window.CampaignFlow) return window.CampaignFlow.getMenuItems(game);
      const items = previousGetRuntimeItems.call(this, game);
      if (game && game.loadCampaignSave && game.loadCampaignSave() && !items.some(item => item.key === 'continue')) {
        items.unshift({ key: 'continue', label: 'ПРОДОЛЖИТЬ' });
      }
      return items;
    };
  }

  if (typeof LevelScene !== 'undefined') {
    const previousNextScreen = LevelScene.prototype.nextScreen;
    LevelScene.prototype.nextScreen = function () {
      if (this.game && this.game.saveCurrentHeroHp) this.game.saveCurrentHeroHp();
      previousNextScreen.call(this);
      if (this.game && this.game.state !== 'mainMenu' && this.game.saveCampaignProgress) this.game.saveCampaignProgress();
    };
  }

  const previousHandleHeroDefeat = GameApp.prototype.handleHeroDefeat;
  GameApp.prototype.handleHeroDefeat = function (scene) {
    previousHandleHeroDefeat.call(this, scene);
    if (this.saveCampaignProgress) this.saveCampaignProgress();
    if (this.state === 'gameOver') addRunSummary(this, 'gameOver');
  };

  const previousOpenGameOver = GameApp.prototype.openGameOver;
  if (previousOpenGameOver) {
    GameApp.prototype.openGameOver = function (scene) {
      previousOpenGameOver.call(this, scene);
      if (this.saveCampaignProgress) this.saveCampaignProgress();
      addRunSummary(this, 'gameOver');
    };
  }

  const previousUpdate = GameApp.prototype.update;
  GameApp.prototype.update = function (dt) {
    previousUpdate.call(this, dt);

    if (!this.runInProgress || this.state === 'splash' || this.state === 'loading') return;
    const seconds = Math.max(0, Number(dt) || 0) / 1000;
    this.currentRunPlaySeconds = (Number(this.currentRunPlaySeconds) || 0) + seconds;
    this.profileStats = this.profileStats || loadProfileStats();
    this.profileStats.totalPlaySeconds = (Number(this.profileStats.totalPlaySeconds) || 0) + seconds;

    const now = performance.now();
    if (!this.lastStatsFlushAt || now - this.lastStatsFlushAt > FLUSH_INTERVAL_MS) {
      this.lastStatsFlushAt = now;
      saveProfileStats(this.profileStats);
      if (this.saveCampaignProgress) this.saveCampaignProgress();
    }
  };

  const previousDrawGameOver = GameApp.prototype.drawGameOver;
  if (previousDrawGameOver) {
    GameApp.prototype.drawGameOver = function (ctx) {
      previousDrawGameOver.call(this, ctx);
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.74)';
      ctx.font = 'bold 18px Arial';
      const score = this.getCurrentScore ? this.getCurrentScore() : 0;
      ctx.fillText('Игрок: ' + sanitizeName(this.playerName) + '   Очки: ' + score, GAME_CONFIG.width / 2, 472);
      ctx.restore();
    };
  }

  window.addEventListener('beforeunload', function () {
    if (!window.game) return;
    if (window.game.profileStats) saveProfileStats(window.game.profileStats);
    if (window.game.runInProgress && window.game.saveCampaignProgress) window.game.saveCampaignProgress();
  });
})();
