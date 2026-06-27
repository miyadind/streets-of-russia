(function () {
  if (typeof window === 'undefined') return;

  function getCampaignProgress(game) {
    return game && game.campaignMap && Number.isFinite(game.campaignMap.activeIndex)
      ? game.campaignMap.activeIndex
      : 0;
  }

  function canContinue(game) {
    if (!game) return false;
    if (game.loadCampaignSave && game.loadCampaignSave()) return true;
    return !!(game.runInProgress || game.scene || getCampaignProgress(game) > 0);
  }

  function getMenuItems(game) {
    const items = [];
    if (canContinue(game)) items.push({ key: 'continue', label: 'ПРОДОЛЖИТЬ' });
    items.push({ key: 'newGame', label: 'НОВАЯ ИГРА' });
    items.push({ key: 'bestiary', label: 'ТВАРИ' });
    items.push({ key: 'settings', label: 'НАСТРОЙКИ' });
    return items;
  }

  function openCharacterSelect(game, mode) {
    if (!game) return;
    game.runInProgress = true;
    game.resumeTarget = mode === 'campaignStart' ? 'campaignMap' : game.resumeTarget;
    game.characterSelectMode = mode || 'campaignStart';
    if (typeof CharacterSelect !== 'undefined') {
      CharacterSelect.infoOpen = false;
      CharacterSelect.footerFocus = null;
      CharacterSelect.gameRef = game;
    }
    game.setState('characterSelect');
  }

  function backFromCharacterSelect(game) {
    if (!game) return;
    if (typeof AudioManager !== 'undefined') AudioManager.playSfx('menuSelect', 0.65);
    const mode = game.characterSelectMode;
    game.characterSelectMode = null;

    if ((mode === 'casualty' || mode === 'switchHero') && game.scene) {
      game.setState('level');
      return;
    }

    if (mode === 'campaignStart') {
      game.resumeTarget = 'campaignMap';
      game.setState('campaignMap');
      return;
    }

    game.setState('mainMenu');
  }

  function confirmCharacterSelect(select, game) {
    if (!select || !game) return;
    const heroKey = select.heroes[select.selectedIndex];
    if (select.isHeroDisabled && select.isHeroDisabled(game, heroKey)) {
      if (typeof AudioManager !== 'undefined') AudioManager.playSfx('menuBack', 0.65);
      return;
    }

    game.selectedHero = heroKey;
    if (typeof AudioManager !== 'undefined') AudioManager.playSfx('menuSelect', 0.85);

    if ((game.characterSelectMode === 'casualty' || game.characterSelectMode === 'switchHero') && game.resumeAfterHeroDefeat) {
      game.resumeAfterHeroDefeat(heroKey);
      return;
    }

    if (game.characterSelectMode === 'retryRegion' && game.startRetryRegion) {
      game.startRetryRegion(heroKey);
      return;
    }

    game.characterSelectMode = null;
    game.runInProgress = true;
    game.resumeTarget = 'level';
    if (game.resetTeamRun) game.resetTeamRun();
    game.startLevel();
  }

  function resetRunForNewCampaign(game) {
    if (!game) return;
    game.runInProgress = true;
    game.resumeTarget = 'campaignMap';
    game.scene = null;
    game.paused = false;
    game.characterSelectMode = null;
    game.casualtyRespawn = null;
    if (game.campaignMap && game.campaignMap.resetProgress) game.campaignMap.resetProgress();
    if (game.resetTeamRun) game.resetTeamRun();
  }

  function startNewCampaign(game) {
    resetRunForNewCampaign(game);
    if (game.startIntro) game.startIntro();
    else game.setState('campaignMap');
  }

  function continueCampaignRun(game) {
    if (!canContinue(game)) return false;

    if (typeof AudioManager !== 'undefined') {
      AudioManager.unlock();
      AudioManager.playSfx('menuSelect', 0.85);
    }

    game.paused = false;
    game.characterSelectMode = null;

    if (game.resumeTarget === 'campaignMap' || !game.scene) {
      game.setState('campaignMap');
      if (game.ensureMenuMusic) game.ensureMenuMusic();
      return true;
    }

    game.setState('level');
    const level = game.scene && game.scene.getLevelConfig ? game.scene.getLevelConfig() : null;
    if (typeof AudioManager !== 'undefined') {
      AudioManager.playMusic((level && level.music) || (GAME_CONFIG.audio && GAME_CONFIG.audio.music && GAME_CONFIG.audio.music.level) || 'levelTheme');
    }
    return true;
  }

  window.CampaignFlow = {
    canContinue,
    getMenuItems,
    openCharacterSelect,
    backFromCharacterSelect,
    confirmCharacterSelect,
    resetRunForNewCampaign,
    startNewCampaign,
    continueCampaignRun
  };
})();
