(function () {
  if (typeof GameApp === 'undefined' || typeof AudioManager === 'undefined') return;

  const HERO_CLIPS = {
    boris: [
      {
        src: 'assets/audio/sfx/putin_crysis_war.mp3',
        text: 'С Путиным надо прощаться. И для меня абсолютно слова-синонимы: Путин, кризис, война.'
      },
      {
        src: 'assets/audio/sfx/NO_war.mp3',
        text: 'Самое главное — это то, что это не наша война. Это не война ребят, которые там сейчас находятся. Это не война граждан, не война, естественно, матерей и близких. Это война Путина за собственную власть и за собственные деньги, а также за власть и деньги его дружков-миллиардеров.'
      },
      {
        src: 'assets/audio/sfx/Putin_ebnutii.mp3',
        text: 'Он ебнутый, Владимир Путин, чтобы вы поняли. Понятно, да?'
      }
    ],
    alexey: [
      {
        src: 'assets/audio/sfx/Navalnii1.mp3',
        text: 'Чего боится эта жаба, сидящая на трубе? Чего боятся эти бункерные воры больше всего? Вы сами отлично знаете: выхода людей на улицы. Потому что это та вещь, этот политический фактор, который нельзя игнорировать. Он самый главный, самый важный, это суть политики. Поэтому не бойтесь выходить на улицы. Выходите не за меня, выходите за себя, за своё будущее.'
      },
      {
        src: 'assets/audio/sfx/Navalnii2.mp3',
        text: 'Ну не сдавайтесь. Не надо, нельзя сдаваться. Если это произошло, это означает, что мы необыкновенно сильны в этот момент, раз они решили меня убить. И нужно использовать эту силу. Не сдаваться. Помните о том, что мы огромная сила, которая находится под гнётом вот этих вот плохих чуваков, лишь потому что мы не можем осознать, насколько действительно мы сильны. Всё, что нужно для торжества зла, — это бездействие добрых людей. Поэтому бездействовать не надо.'
      },
      {
        src: 'assets/audio/sfx/Navalnii3.mp3',
        text: 'Есть генератор маразма и идиотизма, и у него есть конкретное имя: зовут его Владимир Путин. Он выдумывает тупости и глупости, потому что за 20 лет у власти он выжил из ума.'
      }
    ],
    anna: [
      {
        src: 'assets/audio/sfx/Anna1.mp3',
        text: 'Кадыров-младший имел репутацию мальчика, который стоит в углу и в лучшем случае ему разрешается, когда старшие говорят, подойти, налить им чаю.'
      },
      {
        src: 'assets/audio/sfx/Anna2.mp3',
        text: 'Адам Кадыров, омерзительный младший сын Кадырова, который возглавляет на сегодняшний день этот эскадрон смерти при Кадырове. Кадыров — это Сталин наших дней.'
      },
      {
        src: 'assets/audio/sfx/Anna3.mp3',
        text: 'Война — это знакомство с Путиным, потому что он был избран на волне этого мощнейшего военного пиара.'
      }
    ]
  };
  const IDLE_DELAY_MS = 30000;

  function getActiveClips(game) {
    const player = game && game.scene && game.scene.player;
    return player ? HERO_CLIPS[player.heroKey] || null : null;
  }

  function isGameplayIdle(game) {
    const player = game && game.scene && game.scene.player;
    if (!getActiveClips(game) || !player || game.state !== 'level' || game.paused ||
        (typeof DevPanel !== 'undefined' && DevPanel.open) || game.scene.gundosIntroLocked) return false;

    return player.state === 'idle';
  }

  function stopVoice(game) {
    if (!game) return;
    AudioManager.stopExternalAudio('heroVoice');
    if (game.heroVoiceAudio) AudioManager.unregisterExternalAudio(game.heroVoiceAudio);
    game.heroVoiceAudio = null;
    game.heroVoicePlaying = false;
    game.heroVoiceDialogue = null;
    AudioManager.setVoiceDucking(false);
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
    AudioManager.setVoiceDucking(true);
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
        this.heroVoiceAutoIndex = (this.heroVoiceIndex + clips.length - 1) % clips.length;
        playVoice(this, this.heroVoiceAutoIndex);
      } else if (Input.consume('x') && clips) {
        this.heroVoiceAutoIndex = (this.heroVoiceIndex + 1) % clips.length;
        playVoice(this, this.heroVoiceAutoIndex);
      }

      if (!clips && this.heroVoicePlaying) stopVoice(this);
      if (!AudioManager.isSfxOn() && this.heroVoicePlaying) stopVoice(this);
      if (this.heroVoicePlaying || !isGameplayIdle(this)) {
        this.heroVoiceIdleMs = 0;
        this.heroVoiceIdleStartedAt = 0;
      } else {
        const now = performance.now();
        if (!this.heroVoiceIdleStartedAt) this.heroVoiceIdleStartedAt = now;
        this.heroVoiceIdleMs = now - this.heroVoiceIdleStartedAt;
        if (this.heroVoiceIdleMs >= IDLE_DELAY_MS) {
          playVoice(this, this.heroVoiceAutoIndex);
          this.heroVoiceAutoIndex = (this.heroVoiceAutoIndex + 1) % clips.length;
          this.heroVoiceIdleStartedAt = 0;
        }
      }
    }
    return previousUpdate.call(this, dt);
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
    const player = game && game.scene && game.scene.player;
    if (!dialogue || !player || dialogue.heroKey !== player.heroKey) return;

    const audio = dialogue.audio;
    const duration = audio && Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
    const progress = duration && audio ? Math.max(0.06, Math.min(1, audio.currentTime / duration)) : 1;
    const visibleText = dialogue.text.slice(0, Math.max(1, Math.ceil(dialogue.text.length * progress)));

    ctx.save();
    ctx.font = 'bold 18px Arial';
    const maxWidth = 430;
    const lines = wrapText(ctx, visibleText, maxWidth - 34);
    const lineHeight = 23;
    const bubbleWidth = Math.min(maxWidth, Math.max(150, ...lines.map(line => ctx.measureText(line).width + 34)));
    const bubbleHeight = lines.length * lineHeight + 28;
    const body = player.getHurtbox ? player.getHurtbox() : { y: player.y - 120 };
    const x = Math.max(16, Math.min(GAME_CONFIG.width - bubbleWidth - 16, player.x - bubbleWidth / 2));
    const y = Math.max(104, body.y - bubbleHeight - 26);

    ctx.fillStyle = 'rgba(8, 12, 18, 0.92)';
    ctx.strokeStyle = '#ffd447';
    ctx.lineWidth = 3;
    ctx.fillRect(x, y, bubbleWidth, bubbleHeight);
    ctx.strokeRect(x, y, bubbleWidth, bubbleHeight);
    ctx.fillStyle = '#ffd447';
    ctx.beginPath();
    ctx.moveTo(player.x - 10, y + bubbleHeight);
    ctx.lineTo(player.x + 10, y + bubbleHeight);
    ctx.lineTo(player.x, y + bubbleHeight + 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    for (let index = 0; index < lines.length; index++) {
      ctx.fillText(lines[index], x + 17, y + 14 + index * lineHeight);
    }
    ctx.restore();
  }

  const previousDraw = GameApp.prototype.draw;
  GameApp.prototype.draw = function () {
    previousDraw.call(this);
    if (this.state === 'level') drawVoiceBubble(this, this.ctx);
  };
})();
