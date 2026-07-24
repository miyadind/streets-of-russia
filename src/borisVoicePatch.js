(function () {
  if (typeof GameApp === 'undefined' || typeof AudioManager === 'undefined') return;

  const HERO_CLIPS = {
    boris: [
      'assets/audio/sfx/putin_crysis_war.mp3',
      'assets/audio/sfx/NO_war.mp3',
      'assets/audio/sfx/Putin_ebnutii.mp3'
    ],
    alexey: [
      'assets/audio/sfx/Navalnii1.mp3',
      'assets/audio/sfx/Navalnii2.mp3',
      'assets/audio/sfx/Navalnii3.mp3'
    ]
  };
  const IDLE_DELAY_MS = 60000;

  function getActiveClips(game) {
    const player = game && game.scene && game.scene.player;
    return player ? HERO_CLIPS[player.heroKey] || null : null;
  }

  function isGameplayIdle(game) {
    const player = game && game.scene && game.scene.player;
    if (!getActiveClips(game) || !player || game.state !== 'level' || game.paused ||
        (typeof DevPanel !== 'undefined' && DevPanel.open) || game.scene.gundosIntroLocked) return false;

    if (player.state !== 'idle') return false;
    return !Input.pressed('a') && !Input.pressed('d') && !Input.pressed('w') && !Input.pressed('s') &&
      !Input.pressed('arrowleft') && !Input.pressed('arrowright') &&
      !Input.pressed('arrowup') && !Input.pressed('arrowdown') &&
      !Input.pressed('space') && !Input.pressed('enter');
  }

  function stopVoice(game) {
    if (!game) return;
    AudioManager.stopExternalAudio('heroVoice');
    if (game.heroVoiceAudio) AudioManager.unregisterExternalAudio(game.heroVoiceAudio);
    game.heroVoiceAudio = null;
    game.heroVoicePlaying = false;
  }

  function playVoice(game, index) {
    const clips = getActiveClips(game);
    if (!game || !clips || !AudioManager.isSfxOn()) return false;
    const safeIndex = (index + clips.length) % clips.length;
    stopVoice(game);

    const audio = new Audio(clips[safeIndex]);
    audio.preload = 'auto';
    audio.volume = AudioManager.getSfxVolume(1);
    game.heroVoiceIndex = safeIndex;
    game.heroVoiceAudio = audio;
    game.heroVoicePlaying = true;
    game.heroVoiceIdleMs = 0;
    AudioManager.registerExternalAudio(audio, { owner: 'heroVoice', channel: 'sfx' });

    const finish = () => {
      if (game.heroVoiceAudio !== audio) return;
      AudioManager.unregisterExternalAudio(audio);
      game.heroVoiceAudio = null;
      game.heroVoicePlaying = false;
      game.heroVoiceIdleMs = 0;
    };
    audio.addEventListener('ended', finish, { once: true });
    audio.addEventListener('error', finish, { once: true });
    audio.play().catch(finish);
    return true;
  }

  const previousInit = GameApp.prototype.init;
  GameApp.prototype.init = async function () {
    await previousInit.call(this);
    this.heroVoiceIndex = 0;
    this.heroVoiceAutoIndex = 0;
    this.heroVoiceIdleMs = 0;
    this.heroVoicePlaying = false;
    this.heroVoiceAudio = null;
    this.heroVoiceHeroKey = null;
  };

  const previousSetState = GameApp.prototype.setState;
  GameApp.prototype.setState = function (nextState) {
    if (nextState !== 'level') stopVoice(this);
    if (nextState !== 'level') this.heroVoiceIdleMs = 0;
    return previousSetState.call(this, nextState);
  };

  const previousUpdate = GameApp.prototype.update;
  GameApp.prototype.update = function (dt) {
    if (this.state === 'level') {
      const activeHeroKey = this.scene && this.scene.player ? this.scene.player.heroKey : null;
      if (activeHeroKey !== this.heroVoiceHeroKey) {
        stopVoice(this);
        this.heroVoiceHeroKey = activeHeroKey;
        this.heroVoiceIndex = 0;
        this.heroVoiceAutoIndex = 0;
        this.heroVoiceIdleMs = 0;
      }
      const clips = getActiveClips(this);
      if (Input.consume('z') && clips) {
        this.heroVoiceAutoIndex = (this.heroVoiceIndex + clips.length - 1) % clips.length;
        playVoice(this, this.heroVoiceAutoIndex);
      } else if (Input.consume('x') && clips) {
        this.heroVoiceAutoIndex = (this.heroVoiceIndex + 1) % clips.length;
        playVoice(this, this.heroVoiceAutoIndex);
      }

      if (!clips && this.heroVoicePlaying) stopVoice(this);
      if (this.heroVoicePlaying || !isGameplayIdle(this)) {
        this.heroVoiceIdleMs = 0;
      } else {
        this.heroVoiceIdleMs += Math.max(0, dt || 0);
        if (this.heroVoiceIdleMs >= IDLE_DELAY_MS) {
          playVoice(this, this.heroVoiceAutoIndex);
          this.heroVoiceAutoIndex = (this.heroVoiceAutoIndex + 1) % clips.length;
        }
      }
    }
    return previousUpdate.call(this, dt);
  };
})();
