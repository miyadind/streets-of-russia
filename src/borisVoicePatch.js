(function () {
  if (typeof GameApp === 'undefined' || typeof AudioManager === 'undefined') return;

  const HERO_CLIPS = window.HeroVoiceLines || {};
  const IDLE_DELAY_MS = 30000;
  const VOICE_TEXT_HOLD_MS = 1000;

  function getActiveClips(game) {
    const player = game && game.scene && game.scene.player;
    return player ? HERO_CLIPS[player.heroKey] || null : null;
  }

  function isGameplayIdle(game) {
    const player = game && game.scene && game.scene.player;
    if (!getActiveClips(game) || !player || game.state !== 'level' || game.paused ||
        (typeof DevPanel !== 'undefined' && DevPanel.open) || game.scene.gundosIntroLocked) return false;

    return player.state === 'idle' && !hasSceneActivity(game.scene);
  }

  function hasSceneActivity(scene) {
    if (!scene || scene.hitStop > 0 || scene.pendingWave || scene.nonBlockingWaveTimer > 0) return true;

    return (scene.enemies || []).some((enemy) => enemy && enemy.alive && !enemy.remove);
  }

  function hasGameplayActionInput() {
    const justPressed = Input.just || {};
    const pressedAction = Object.keys(justPressed).some((key) =>
      key !== 'any' && key !== 'x' && key !== 'z' && justPressed[key]
    );
    const heldAction = [
      'a', 'd', 'w', 's', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'space'
    ].some((key) => Input.pressed(key));

    return pressedAction || heldAction || Input.pointer.justDown || Input.touches.length > 0;
  }

  function shouldStopVoiceForGameplay(game, actionInput) {
    const player = game && game.scene && game.scene.player;
    if (!game || game.state !== 'level' || game.paused || !player ||
        (typeof DevPanel !== 'undefined' && DevPanel.open)) return true;

    return actionInput || player.state !== 'idle' || hasSceneActivity(game.scene);
  }

  function stopVoice(game) {
    if (!game) return;
    AudioManager.stopExternalAudio('heroVoice');
    if (game.heroVoiceAudio) AudioManager.unregisterExternalAudio(game.heroVoiceAudio);
    game.heroVoiceAudio = null;
    game.heroVoicePlaying = false;
    game.heroVoiceDialogue = null;
    AudioManager.setVoiceDucking(false, 'heroVoice');
  }

  function playVoice(game, index) {
    const clips = getActiveClips(game);
    if (!game || !clips || !AudioManager.isSfxOn()) return false;
    const safeIndex = (index + clips.length) % clips.length;
    const clip = clips[safeIndex];
    stopVoice(game);

    const audio = new Audio(clip.src);
    audio.preload = 'auto';
    audio.volume = AudioManager.getSfxVolume(1);
    game.heroVoiceIndex = safeIndex;
    game.heroVoiceAudio = audio;
    game.heroVoicePlaying = true;
    game.heroVoiceDialogue = {
      heroKey: game.scene.player.heroKey,
      text: clip.text,
      audio
    };
    game.heroVoiceIdleMs = 0;
    AudioManager.setVoiceDucking(true, 'heroVoice');
    AudioManager.registerExternalAudio(audio, { owner: 'heroVoice', channel: 'sfx' });

    const finish = () => {
      if (game.heroVoiceAudio !== audio) return;
      AudioManager.unregisterExternalAudio(audio);
      game.heroVoiceAudio = null;
      game.heroVoicePlaying = false;
      game.heroVoiceIdleMs = 0;
      if (game.heroVoiceDialogue && game.heroVoiceDialogue.audio === audio) {
        game.heroVoiceDialogue.finishedAt = performance.now();
      }
      AudioManager.setVoiceDucking(false, 'heroVoice');
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
    this.heroVoiceDialogue = null;
    this.heroVoiceHeroKey = null;
    this.heroVoiceIdleStartedAt = 0;
  };

  const previousSetState = GameApp.prototype.setState;
  GameApp.prototype.setState = function (nextState) {
    if (nextState !== 'level') stopVoice(this);
    if (nextState !== 'level') {
      this.heroVoiceIdleMs = 0;
      this.heroVoiceIdleStartedAt = 0;
    }
    return previousSetState.call(this, nextState);
  };

  const previousUpdate = GameApp.prototype.update;
  GameApp.prototype.update = function (dt) {
    let requestedVoice = null;
    let actionInput = false;
    if (this.state === 'level') {
      const activeHeroKey = this.scene && this.scene.player ? this.scene.player.heroKey : null;
      if (activeHeroKey !== this.heroVoiceHeroKey) {
        stopVoice(this);
        this.heroVoiceHeroKey = activeHeroKey;
        this.heroVoiceIndex = 0;
        this.heroVoiceAutoIndex = 0;
        this.heroVoiceIdleMs = 0;
        this.heroVoiceIdleStartedAt = 0;
      }
      const clips = getActiveClips(this);
      if (Input.consume('z') && clips) {
        requestedVoice = (this.heroVoiceIndex + clips.length - 1) % clips.length;
      } else if (Input.consume('x') && clips) {
        requestedVoice = (this.heroVoiceIndex + 1) % clips.length;
      }
      actionInput = hasGameplayActionInput();

      if (!clips && this.heroVoicePlaying) stopVoice(this);
      if (!AudioManager.isSfxOn() && this.heroVoicePlaying) stopVoice(this);
    }
    const result = previousUpdate.call(this, dt);

    if (this.state !== 'level') {
      stopVoice(this);
      return result;
    }

    const clips = getActiveClips(this);
    if (!clips || !AudioManager.isSfxOn()) {
      stopVoice(this);
      return result;
    }

    if (this.heroVoicePlaying && shouldStopVoiceForGameplay(this, actionInput)) stopVoice(this);

    if (requestedVoice !== null) {
      if (isGameplayIdle(this) && !actionInput) {
        this.heroVoiceAutoIndex = requestedVoice;
        playVoice(this, requestedVoice);
      }
      return result;
    }

    if (this.heroVoicePlaying || !isGameplayIdle(this)) {
      this.heroVoiceIdleMs = 0;
      this.heroVoiceIdleStartedAt = 0;
      return result;
    }

    const now = performance.now();
    if (!this.heroVoiceIdleStartedAt) this.heroVoiceIdleStartedAt = now;
    this.heroVoiceIdleMs = now - this.heroVoiceIdleStartedAt;
    if (this.heroVoiceIdleMs >= IDLE_DELAY_MS) {
      playVoice(this, this.heroVoiceAutoIndex);
      this.heroVoiceAutoIndex = (this.heroVoiceAutoIndex + 1) % clips.length;
      this.heroVoiceIdleStartedAt = 0;
    }
    return result;
  };

  function wrapText(ctx, text, maxWidth) {
    const words = String(text || '').split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      const next = line ? line + ' ' + word : word;
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function drawVoiceBubble(game, ctx) {
    const dialogue = game && game.heroVoiceDialogue;
    if (!dialogue) return;

    if (dialogue.finishedAt && performance.now() - dialogue.finishedAt >= VOICE_TEXT_HOLD_MS) {
      game.heroVoiceDialogue = null;
      return;
    }

    const audio = dialogue.audio;
    const duration = audio && Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
    const progress = dialogue.finishedAt ? 1 : (duration && audio ? Math.max(0.06, Math.min(1, audio.currentTime / duration)) : 1);
    const visibleText = dialogue.text.slice(0, Math.max(1, Math.ceil(dialogue.text.length * progress)));

    ctx.save();
    ctx.font = 'bold 17px Arial';
    const bubbleWidth = 540;
    const lineHeight = 22;
    const maxLines = 4;
    const allLines = wrapText(ctx, visibleText, bubbleWidth - 32);
    const lines = allLines.slice(-maxLines);
    const bubbleHeight = maxLines * lineHeight + 24;
    const x = 16;
    const y = 104;

    ctx.fillStyle = 'rgba(8, 12, 18, 0.92)';
    ctx.strokeStyle = '#ffd447';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, bubbleWidth, bubbleHeight);
    ctx.strokeRect(x, y, bubbleWidth, bubbleHeight);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    for (let index = 0; index < lines.length; index++) {
      ctx.fillText(lines[index], x + 16, y + 13 + index * lineHeight);
    }
    ctx.restore();
  }

  const previousSceneDraw = LevelScene.prototype.draw;
  LevelScene.prototype.draw = function (ctx) {
    previousSceneDraw.call(this, ctx);
    drawVoiceBubble(this.game, ctx);
  };
})();
