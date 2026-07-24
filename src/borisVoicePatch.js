(function () {
  if (typeof GameApp === 'undefined' || typeof AudioManager === 'undefined') return;

  const CLIPS = [
    'assets/audio/sfx/putin_crysis_war.mp3',
    'assets/audio/sfx/NO_war.mp3',
    'assets/audio/sfx/Putin_ebnutii.mp3'
  ];
  const IDLE_DELAY_MS = 60000;

  function isBorisActive(game) {
    return !!(game && game.scene && game.scene.player && game.scene.player.heroKey === 'boris');
  }

  function isGameplayIdle(game) {
    const player = game && game.scene && game.scene.player;
    if (!isBorisActive(game) || !player || game.state !== 'level' || game.paused ||
        (typeof DevPanel !== 'undefined' && DevPanel.open) ||
        (game.scene && game.scene.gundosIntroLocked)) return false;

    if (player.state !== 'idle') return false;
    return !Input.pressed('a') && !Input.pressed('d') && !Input.pressed('w') && !Input.pressed('s') &&
      !Input.pressed('arrowleft') && !Input.pressed('arrowright') &&
      !Input.pressed('arrowup') && !Input.pressed('arrowdown') &&
      !Input.pressed('space') && !Input.pressed('enter');
  }

  function stopVoice(game) {
    if (!game) return;
    AudioManager.stopExternalAudio('borisVoice');
    if (game.borisVoiceAudio) AudioManager.unregisterExternalAudio(game.borisVoiceAudio);
    game.borisVoiceAudio = null;
    game.borisVoicePlaying = false;
  }

  function playVoice(game, index) {
    if (!game || !AudioManager.isSfxOn()) return false;
    const safeIndex = (index + CLIPS.length) % CLIPS.length;
    stopVoice(game);

    const audio = new Audio(CLIPS[safeIndex]);
    audio.preload = 'auto';
    audio.volume = AudioManager.getSfxVolume(1);
    game.borisVoiceIndex = safeIndex;
    game.borisVoiceAudio = audio;
    game.borisVoicePlaying = true;
    game.borisVoiceIdleMs = 0;
    AudioManager.registerExternalAudio(audio, { owner: 'borisVoice', channel: 'sfx' });

    const finish = () => {
      if (game.borisVoiceAudio !== audio) return;
      AudioManager.unregisterExternalAudio(audio);
      game.borisVoiceAudio = null;
      game.borisVoicePlaying = false;
      game.borisVoiceIdleMs = 0;
    };
    audio.addEventListener('ended', finish, { once: true });
    audio.addEventListener('error', finish, { once: true });
    audio.play().catch(finish);
    return true;
  }

  const previousInit = GameApp.prototype.init;
  GameApp.prototype.init = async function () {
    await previousInit.call(this);
    this.borisVoiceIndex = 0;
    this.borisVoiceAutoIndex = 0;
    this.borisVoiceIdleMs = 0;
    this.borisVoicePlaying = false;
    this.borisVoiceAudio = null;
  };

  const previousSetState = GameApp.prototype.setState;
  GameApp.prototype.setState = function (nextState) {
    if (nextState !== 'level') stopVoice(this);
    if (nextState !== 'level') this.borisVoiceIdleMs = 0;
    return previousSetState.call(this, nextState);
  };

  const previousUpdate = GameApp.prototype.update;
  GameApp.prototype.update = function (dt) {
    if (this.state === 'level') {
      if (Input.consume('z') && isBorisActive(this)) {
        this.borisVoiceAutoIndex = (this.borisVoiceIndex + CLIPS.length - 1) % CLIPS.length;
        playVoice(this, this.borisVoiceAutoIndex);
      } else if (Input.consume('x') && isBorisActive(this)) {
        this.borisVoiceAutoIndex = (this.borisVoiceIndex + 1) % CLIPS.length;
        playVoice(this, this.borisVoiceAutoIndex);
      }

      if (!isBorisActive(this) && this.borisVoicePlaying) stopVoice(this);
      if (this.borisVoicePlaying || !isGameplayIdle(this)) {
        this.borisVoiceIdleMs = 0;
      } else {
        this.borisVoiceIdleMs += Math.max(0, dt || 0);
        if (this.borisVoiceIdleMs >= IDLE_DELAY_MS) {
          playVoice(this, this.borisVoiceAutoIndex);
          this.borisVoiceAutoIndex = (this.borisVoiceAutoIndex + 1) % CLIPS.length;
        }
      }
    }
    return previousUpdate.call(this, dt);
  };
})();
