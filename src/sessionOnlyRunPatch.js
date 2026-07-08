(function () {
  if (typeof window === 'undefined') return;

  const SAVE_KEY = 'streetsOfRussiaCampaignSaveV1';

  function parseJson(raw) {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (error) { return null; }
  }

  function removeStorageSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (error) {}
    try { sessionStorage.removeItem(SAVE_KEY); } catch (error) {}
  }

  function readMemorySave() {
    const save = parseJson(window.__streetsSessionCampaignSave || null);
    if (!save || save.saveVersion !== 1) return null;
    return save;
  }

  function writeMemorySave(game) {
    if (!game || !game.createSessionOnlySave) return null;
    const save = game.createSessionOnlySave();
    window.__streetsSessionCampaignSave = JSON.stringify(save);
    removeStorageSave();
    return save;
  }

  function install() {
    if (typeof GameApp === 'undefined') return false;

    removeStorageSave();
    window.__streetsSessionCampaignSave = null;

    const previousSaveCampaignProgress = GameApp.prototype.saveCampaignProgress;
    const previousClearCampaignSave = GameApp.prototype.clearCampaignSave;
    const previousLoadCampaignSave = GameApp.prototype.loadCampaignSave;
    const previousGetCurrentScore = GameApp.prototype.getCurrentScore;

    GameApp.prototype.createSessionOnlySave = function () {
      if (previousSaveCampaignProgress && !this.__sessionOnlyCreatingSave) {
        this.__sessionOnlyCreatingSave = true;
        try {
          const save = previousSaveCampaignProgress.call(this);
          removeStorageSave();
          return save;
        } finally {
          this.__sessionOnlyCreatingSave = false;
        }
      }
      return {
        saveVersion: 1,
        savedAt: Date.now(),
        playerName: this.playerName || 'Игрок',
        runId: this.currentRunId || null,
        campaign: {
          currentRegion: 'farEast',
          currentRegionIndex: this.campaignMap && Number.isFinite(this.campaignMap.activeIndex) ? this.campaignMap.activeIndex : 0,
          currentScreen: this.scene && Number.isFinite(this.scene.screenIndex) ? this.scene.screenIndex : 0,
          completedRegions: [],
          unlockedRegions: ['farEast']
        },
        team: {
          activeHero: this.selectedHero || 'boris',
          heroHp: this.heroHp || {},
          defeatedHeroes: this.defeatedHeroes || {}
        },
        stats: {
          peopleSupport: this.peopleSupport != null ? this.peopleSupport : 25,
          heroesAlive: 3,
          heroesLost: 0,
          runStartedAt: this.currentRunStartedAt || Date.now(),
          runPlaySeconds: Math.round(this.currentRunPlaySeconds || 0),
          score: previousGetCurrentScore ? previousGetCurrentScore.call(this) : 0
        }
      };
    };

    GameApp.prototype.loadCampaignSave = function () {
      removeStorageSave();
      return readMemorySave();
    };

    GameApp.prototype.saveCampaignProgress = function () {
      return writeMemorySave(this);
    };

    GameApp.prototype.clearCampaignSave = function () {
      window.__streetsSessionCampaignSave = null;
      removeStorageSave();
      if (previousClearCampaignSave) previousClearCampaignSave.call(this);
      removeStorageSave();
    };

    const previousInit = GameApp.prototype.init;
    GameApp.prototype.init = async function () {
      window.__streetsSessionCampaignSave = null;
      removeStorageSave();
      await previousInit.call(this);
      removeStorageSave();
    };

    window.addEventListener('beforeunload', removeStorageSave);
    window.addEventListener('pagehide', removeStorageSave);

    window.SessionOnlyRunPatch = {
      installed: true,
      saveKey: SAVE_KEY,
      removeStorageSave,
      readMemorySave
    };

    return true;
  }

  if (!install()) {
    window.addEventListener('load', install, { once: true });
  }
})();
