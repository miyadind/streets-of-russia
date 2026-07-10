(function () {
  if (typeof AudioManager === 'undefined') return;

  const musicPauseReasons = new Set();
  const originalPlayMusic = AudioManager.playMusic.bind(AudioManager);
  const originalStopMusic = AudioManager.stopMusic.bind(AudioManager);
  const originalRefreshSettings = AudioManager.refreshSettings.bind(AudioManager);

  function allMusicTracks() {
    return Object.values(AudioManager.music || {}).filter(Boolean);
  }

  function silenceOtherMusic(except) {
    for (const audio of allMusicTracks()) {
      if (!audio || audio === except) continue;
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (error) {}
    }
  }

  function pauseCurrentMusic() {
    silenceOtherMusic(AudioManager.currentMusic || null);
    if (!AudioManager.currentMusic) return;
    try {
      if (!AudioManager.currentMusic.paused) AudioManager.currentMusic.pause();
    } catch (error) {}
    AudioManager.musicActuallyPlaying = false;
  }

  function resumeCurrentMusic() {
    if (!AudioManager.currentMusicKey || !AudioManager.isMusicOn || !AudioManager.isMusicOn()) return;
    originalPlayMusic(AudioManager.currentMusicKey, false, true);
    silenceOtherMusic(AudioManager.currentMusic || null);
  }

  AudioManager.isMusicPausedByGame = function () {
    return musicPauseReasons.size > 0;
  };

  AudioManager.setMusicPauseReason = function (reason, paused) {
    if (!reason) return;
    const hadPause = musicPauseReasons.size > 0;
    if (paused) musicPauseReasons.add(reason);
    else musicPauseReasons.delete(reason);

    const hasPause = musicPauseReasons.size > 0;
    if (hasPause) pauseCurrentMusic();
    else if (hadPause) resumeCurrentMusic();
  };

  AudioManager.playMusic = function (key, forceRestart = false, retryIfBlocked = false) {
    if (!key) return;
    this.currentMusicKey = key;
    const next = this.music && this.music[key];
    if (next) this.currentMusic = next;

    if (this.isMusicPausedByGame && this.isMusicPausedByGame()) {
      if (forceRestart && next) {
        try { next.currentTime = 0; } catch (error) {}
      }
      pauseCurrentMusic();
      return;
    }

    originalPlayMusic(key, forceRestart, retryIfBlocked);
    silenceOtherMusic(this.currentMusic || next || null);
  };

  AudioManager.stopMusic = function () {
    originalStopMusic();
    silenceOtherMusic(null);
  };

  AudioManager.refreshSettings = function () {
    if (this.isMusicPausedByGame && this.isMusicPausedByGame()) {
      pauseCurrentMusic();
      return;
    }
    originalRefreshSettings();
    silenceOtherMusic(this.currentMusic || null);
  };

  if (typeof GameApp !== 'undefined') {
    const originalGameUpdate = GameApp.prototype.update;
    const originalGameSetState = GameApp.prototype.setState;

    GameApp.prototype.syncMusicPauseState = function () {
      const devOpen = typeof DevPanel !== 'undefined' && DevPanel.open;
      const gamePaused = this.state === 'level' && !!this.paused;
      AudioManager.setMusicPauseReason('game-pause', gamePaused || devOpen);
    };

    GameApp.prototype.update = function (dt) {
      this.syncMusicPauseState();
      originalGameUpdate.call(this, dt);
      this.syncMusicPauseState();
    };

    GameApp.prototype.setState = function (nextState) {
      originalGameSetState.call(this, nextState);
      this.syncMusicPauseState();
    };
  }

  if (typeof DevPanel !== 'undefined') {
    const originalDevUpdate = DevPanel.update.bind(DevPanel);
    const originalDevHandleClick = DevPanel.handleClick.bind(DevPanel);

    DevPanel.update = function (game) {
      const wasOpen = this.open;
      originalDevUpdate(game);
      if (game && wasOpen !== this.open && typeof game.syncMusicPauseState === 'function') {
        game.syncMusicPauseState();
      }
    };

    DevPanel.handleClick = function (point, game) {
      const wasOpen = this.open;
      const result = originalDevHandleClick(point, game);
      if (game && wasOpen !== this.open && typeof game.syncMusicPauseState === 'function') {
        game.syncMusicPauseState();
      }
      return result;
    };

    if (typeof DevPanel.openFromPauseMenu === 'function') {
      const originalOpenFromPauseMenu = DevPanel.openFromPauseMenu.bind(DevPanel);
      DevPanel.openFromPauseMenu = function (game) {
        const result = originalOpenFromPauseMenu(game);
        this.open = true;
        if (game && typeof game.syncMusicPauseState === 'function') game.syncMusicPauseState();
        return result;
      };
    }
  }

  document.addEventListener('visibilitychange', () => {
    AudioManager.setMusicPauseReason('hidden-tab', document.visibilityState !== 'visible');
  });

  window.addEventListener('blur', () => {
    AudioManager.setMusicPauseReason('window-blur', true);
  });

  window.addEventListener('focus', () => {
    AudioManager.setMusicPauseReason('window-blur', false);
  });
})();
