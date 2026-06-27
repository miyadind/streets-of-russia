(function () {
  if (typeof window === 'undefined' || typeof GameApp === 'undefined' || typeof AudioManager === 'undefined') return;

  const INTRO_STATE = 'intro';
  const MENU_MUSIC_STATES = new Set([
    'splash',
    'mainMenu',
    'settings',
    'characterSelect',
    'campaignMap',
    'playerNameEntry',
    'regionStory'
  ]);

  function getMenuMusicKey(game) {
    if (game && game.getMenuMusicKey) return game.getMenuMusicKey();
    return (GAME_CONFIG.audio && GAME_CONFIG.audio.music && GAME_CONFIG.audio.music.menu) || 'menuTheme';
  }

  function isMenuMusicState(state) {
    return MENU_MUSIC_STATES.has(state);
  }

  function pauseAndReset(audio) {
    if (!audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch (error) {}
  }

  function stopIntroAudio(game) {
    const intro = game && game.intro;
    if (!intro) return;

    if (game.stopIntroVoiceOnly) game.stopIntroVoiceOnly();
    else if (game.stopIntroVoice) game.stopIntroVoice();
    pauseAndReset(intro.music);
    intro.voiceStarted = false;
  }

  function stopCurrentManagedMusic(game) {
    if (!AudioManager.currentMusic) return;
    const menuKey = getMenuMusicKey(game);
    const managedKeys = new Set([
      menuKey,
      'menuTheme',
      'levelTheme',
      'bossTheme'
    ]);
    if (AudioManager.currentMusicKey && !managedKeys.has(AudioManager.currentMusicKey)) return;
    AudioManager.stopMusic();
  }

  const previousEnsureMenuMusic = GameApp.prototype.ensureMenuMusic;
  GameApp.prototype.ensureMenuMusic = function () {
    if (this.state === INTRO_STATE || this.state === 'level') return;
    stopIntroAudio(this);
    previousEnsureMenuMusic.call(this);
  };

  const previousSetState = GameApp.prototype.setState;
  GameApp.prototype.setState = function (nextState) {
    const previousState = this.state;

    if (nextState === INTRO_STATE) {
      stopCurrentManagedMusic(this);
    }

    if (previousState === INTRO_STATE && nextState !== INTRO_STATE) {
      stopIntroAudio(this);
    }

    if (nextState === 'level') {
      stopIntroAudio(this);
      if (AudioManager.currentMusicKey === getMenuMusicKey(this)) AudioManager.stopMusic();
    }

    const result = previousSetState.call(this, nextState);

    if (isMenuMusicState(nextState) && nextState !== INTRO_STATE) {
      stopIntroAudio(this);
      if (AudioManager.currentMusicKey !== getMenuMusicKey(this) || !AudioManager.currentMusic || AudioManager.currentMusic.paused) {
        previousEnsureMenuMusic.call(this);
      }
    }

    return result;
  };

  window.AudioDirector = {
    isMenuMusicState,
    stopIntroAudio,
    stopCurrentManagedMusic
  };
})();
