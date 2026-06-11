(function () {
  if (typeof CampaignMapScreen === 'undefined') {
    console.warn('CampaignMapScreen is not loaded');
    return;
  }

  const INTRO_TEXT = `Эта страна могла быть счастливой.

Люди могли бы смотреть в завтрашний день без страха.
Смеяться. Строить планы. Говорить правду.
Жить свободно.

Но этому не дали случиться.

Шаг за шагом страну захватила преступная группировка тварей.
Они протянули свои грязные руки во власть, в суды, в средства массовой информации, в полицию, в армию — и в головы людей.
Как раковая опухоль, они пустили метастазы по телу страны.

Чиновники стали послушными марионетками.
Полиция перестала защищать людей и превратилась в дубинку режима.
Закон стал оружием.
Телевизор стал машиной лжи.
А правда — преступлением.

Годы страха, пропаганды и насилия превратили страну в огромную тюрьму.

Улицы заполнили силовики, доносчики, продажные чиновники и зомбированные толпы.
Тех, кто не согласен, ломают, давят, убивают или заставляют исчезнуть.

Казалось, надежды больше нет.

Лучшие давно покинули этот мир.
Те, кто говорил правду.
Те, кто не боялся.
Те, кто отдал свои жизни за свободу.

Но у людей осталось кое-что,
чего не отнять ни силой, ни болью, ни ложью.

Вера в светлое будущее.

И эта вера совершила невозможное.

Трое героев, когда-то отдавшие свои жизни в борьбе за свободу, вернулись.
Они стали ответом на отчаянный крик страны.

Теперь они выходят на улицы России,
чтобы пробиться через страх, ложь и насилие
и вернуть людям свободу.

На улицах этой замученной страны начинается их путь.
Путь очищения страны от тварей, паразитирующих на её теле.

Это больше не просто борьба.

Это последняя надежда.

Это Streets of Russia.`;

  const INTRO_BACKGROUND = 'assets/backgrounds/Intro.png';
  const INTRO_TYPEWRITER_SOUND = 'assets/audio/sfx/typewriter-key.mp3';
  const INTRO_TYPE_SPEED = 24; // characters per second for visible line typing
  const INTRO_FAST_MULTIPLIER = 6;
  const INTRO_LINE_HOLD = 0.18;
  const INTRO_BLANK_LINE_TIME = 0.34;
  const INTRO_TYPE_Y = 455;
  const INTRO_END_FADE_SECONDS = 5;
  const INTRO_SEEN_KEY = 'streetsOfRussiaIntroSeen';
  const INTRO_TYPE_CLICK_MIN_INTERVAL = 42;
  const INTRO_TYPE_CLICK_EVERY_CHARS = 2;

  function loadPatchImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn('Missing image:', src);
        resolve(null);
      };
      img.src = src;
    });
  }

  function loadPatchAudio(src) {
    const audio = new Audio();
    audio.src = src;
    audio.preload = 'auto';
    audio.volume = 0.35;
    audio.addEventListener('error', () => {
      console.warn('Missing intro typewriter sound:', src);
    });
    return audio;
  }

  function wrapText(ctx, text, maxWidth) {
    const lines = [];
    const paragraphs = text.split('\n');

    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) {
        lines.push('');
        continue;
      }

      const words = paragraph.split(' ');
      let line = '';

      for (const word of words) {
        const testLine = line ? line + ' ' + word : word;
        if (ctx.measureText(testLine).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = testLine;
        }
      }

      if (line) lines.push(line);
    }

    return lines;
  }

  function lineDuration(line) {
    if (!line || !line.trim()) return INTRO_BLANK_LINE_TIME;
    return Math.max(0.55, line.length / INTRO_TYPE_SPEED + INTRO_LINE_HOLD);
  }

  function getTypingDuration(lines) {
    return lines.reduce((sum, line) => sum + lineDuration(line), 0);
  }

  function getTimelineState(lines, timeSeconds) {
    let t = Math.max(0, timeSeconds);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const duration = lineDuration(line);

      if (t <= duration) {
        const typingPart = Math.max(0.01, duration - INTRO_LINE_HOLD);
        const progress = Math.min(1, t / typingPart);
        const chars = line && line.trim() ? Math.floor(line.length * progress) : 0;
        return {
          phase: 'typing',
          lineIndex: i,
          charInLine: Math.min(line.length, chars),
          fadeElapsed: 0,
          complete: false
        };
      }

      t -= duration;
    }

    return {
      phase: 'fadeOut',
      lineIndex: Math.max(0, lines.length - 1),
      charInLine: lines.length ? lines[lines.length - 1].length : 0,
      fadeElapsed: t,
      complete: t >= INTRO_END_FADE_SECONDS
    };
  }

  function getTypedCursor(lines, state) {
    let cursor = 0;
    for (let i = 0; i < state.lineIndex; i++) {
      cursor += (lines[i] || '').length + 1;
    }
    return cursor + state.charInLine;
  }

  const originalLoadImages = GameApp.prototype.loadImages;
  GameApp.prototype.loadImages = async function () {
    const loaded = await originalLoadImages.call(this);
    loaded.intro = await loadPatchImage(INTRO_BACKGROUND);
    return loaded;
  };

  const originalInit = GameApp.prototype.init;
  GameApp.prototype.init = async function () {
    CampaignMapScreen.init();
    this.campaignMap = CampaignMapScreen;
    this.intro = {
      text: INTRO_TEXT,
      time: 0,
      firstRun: false,
      fastForward: false,
      readyToContinue: false,
      layoutLines: [],
      lastTypedCursor: 0,
      lastTypeSoundAt: 0,
      audioContext: null,
      typewriterSound: loadPatchAudio(INTRO_TYPEWRITER_SOUND),
      typewriterSoundMissing: false
    };
    await originalInit.call(this);
  };

  const originalIsMenuState = GameApp.prototype.isMenuState;
  GameApp.prototype.isMenuState = function (state) {
    return state === 'campaignMap' || state === 'intro' || originalIsMenuState.call(this, state);
  };

  GameApp.prototype.hasSeenIntro = function () {
    try {
      return localStorage.getItem(INTRO_SEEN_KEY) === 'yes';
    } catch (error) {
      return false;
    }
  };

  GameApp.prototype.markIntroSeen = function () {
    try {
      localStorage.setItem(INTRO_SEEN_KEY, 'yes');
    } catch (error) {}
  };

  GameApp.prototype.startIntro = function () {
    this.intro.time = 0;
    this.intro.firstRun = !this.hasSeenIntro();
    this.intro.fastForward = false;
    this.intro.readyToContinue = false;
    this.intro.lastTypedCursor = 0;
    this.intro.lastTypeSoundAt = 0;
    if (this.intro.typewriterSound) this.intro.typewriterSound.load();
    this.setState('intro');
  };

  GameApp.prototype.finishIntro = function () {
    this.markIntroSeen();
    this.setState('campaignMap');
    this.ensureMenuMusic();
  };

  GameApp.prototype.playGeneratedIntroTypeClick = function () {
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return;
      if (!this.intro.audioContext) this.intro.audioContext = new AudioCtor();
      const audioCtx = this.intro.audioContext;
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

      const t = audioCtx.currentTime;
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      oscillator.type = 'square';
      oscillator.frequency.value = 900 + Math.random() * 520;
      filter.type = 'highpass';
      filter.frequency.value = 550;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.026, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.028);

      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      oscillator.start(t);
      oscillator.stop(t + 0.03);
    } catch (error) {}
  };

  GameApp.prototype.playIntroTypeClick = function (typedCursor) {
    if (!typedCursor || typedCursor <= this.intro.lastTypedCursor) return;
    if (this.intro.fastForward) {
      this.intro.lastTypedCursor = typedCursor;
      return;
    }
    if (typedCursor % INTRO_TYPE_CLICK_EVERY_CHARS !== 0) {
      this.intro.lastTypedCursor = typedCursor;
      return;
    }
    if (AudioManager && AudioManager.isSfxOn && !AudioManager.isSfxOn()) {
      this.intro.lastTypedCursor = typedCursor;
      return;
    }

    const now = performance.now();
    if (now - this.intro.lastTypeSoundAt < INTRO_TYPE_CLICK_MIN_INTERVAL) {
      this.intro.lastTypedCursor = typedCursor;
      return;
    }

    const realSound = this.intro.typewriterSound;
    if (realSound && !this.intro.typewriterSoundMissing) {
      try {
        const click = realSound.cloneNode(true);
        click.volume = 0.28;
        click.currentTime = 0;
        click.play().catch(() => {
          this.intro.typewriterSoundMissing = true;
          this.playGeneratedIntroTypeClick();
        });
      } catch (error) {
        this.intro.typewriterSoundMissing = true;
        this.playGeneratedIntroTypeClick();
      }
    } else {
      this.playGeneratedIntroTypeClick();
    }

    this.intro.lastTypeSoundAt = now;
    this.intro.lastTypedCursor = typedCursor;
  };

  GameApp.prototype.updateIntro = function (dt) {
    const click = Input.consumePointer();
    const anyKey = Input.consumeAnyKey();
    const requestedAction = !!(click || anyKey);

    if (this.intro.readyToContinue) {
      if (requestedAction) this.finishIntro();
      return;
    }

    if (!this.intro.firstRun && requestedAction) {
      this.intro.fastForward = true;
    }

    const multiplier = this.intro.fastForward ? INTRO_FAST_MULTIPLIER : 1;
    this.intro.time += (dt / 1000) * multiplier;
  };

  GameApp.prototype.drawIntro = function (ctx) {
    const bg = this.images.intro;

    if (bg) {
      ctx.drawImage(bg, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    } else {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.50)';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    ctx.font = 'bold 25px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const textX = 150;
    const lineHeight = 34;
    const maxWidth = GAME_CONFIG.width - 300;
    const clipTop = 76;
    const clipBottom = GAME_CONFIG.height - 84;
    const lines = wrapText(ctx, this.intro.text, maxWidth);
    this.intro.layoutLines = lines;

    const state = getTimelineState(lines, this.intro.time);
    if (state.complete) {
      this.intro.readyToContinue = true;
    }

    if (!this.intro.readyToContinue) {
      const typedCursor = getTypedCursor(lines, state);
      if (state.phase === 'typing' && state.charInLine > 0) {
        this.playIntroTypeClick(typedCursor);
      }

      const fadeAlpha = state.phase === 'fadeOut'
        ? Math.max(0, 1 - state.fadeElapsed / INTRO_END_FADE_SECONDS)
        : 1;

      ctx.save();
      ctx.globalAlpha = fadeAlpha;
      ctx.beginPath();
      ctx.rect(textX, clipTop, maxWidth, clipBottom - clipTop);
      ctx.clip();

      ctx.shadowColor = '#000';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#000';
      ctx.fillStyle = '#f4f4f4';

      for (let i = 0; i <= state.lineIndex && i < lines.length; i++) {
        let line = lines[i];
        if (state.phase === 'typing' && i === state.lineIndex) {
          line = line.slice(0, state.charInLine);
        }

        const y = INTRO_TYPE_Y - (state.lineIndex - i) * lineHeight;
        if (y < clipTop - lineHeight || y > clipBottom) continue;

        ctx.strokeText(line, textX, y);
        ctx.fillText(line, textX, y);
      }

      if (state.phase === 'typing') {
        const currentLine = lines[state.lineIndex] || '';
        const typedLine = currentLine.slice(0, state.charInLine);
        const caretX = textX + ctx.measureText(typedLine).width + 8;
        const caretY = INTRO_TYPE_Y + 3;
        if (Math.floor(this.intro.time * 4) % 2 === 0) {
          ctx.fillStyle = '#ff2b2b';
          ctx.fillRect(caretX, caretY, 12, 25);
        }
      }

      ctx.restore();
    }

    const fade = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.height);
    fade.addColorStop(0, 'rgba(0,0,0,0.84)');
    fade.addColorStop(0.18, 'rgba(0,0,0,0)');
    fade.addColorStop(0.74, 'rgba(0,0,0,0)');
    fade.addColorStop(1, 'rgba(0,0,0,0.90)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.70)';

    let hint = '';
    if (this.intro.readyToContinue) {
      hint = 'Нажмите любую кнопку для продолжения';
    } else if (this.intro.firstRun) {
      hint = state.phase === 'fadeOut' ? 'Интро завершается...' : 'Первый запуск: интро нужно досмотреть до конца';
    } else if (this.intro.fastForward) {
      hint = state.phase === 'fadeOut' ? 'Интро завершается...' : 'Ускоренная перемотка интро...';
    } else {
      hint = 'Нажмите любую кнопку, чтобы ускорить интро';
    }

    ctx.fillText(hint, GAME_CONFIG.width - 34, GAME_CONFIG.height - 30);
    ctx.textAlign = 'left';
  };

  const originalUpdate = GameApp.prototype.update;
  GameApp.prototype.update = function (dt) {
    if (Responsive.isPortrait) return;

    if (this.state === 'intro') {
      DevPanel.update(this);
      if (DevPanel.open) return;
      this.updateIntro(dt);
      return;
    }

    if (this.state !== 'splash' && this.state !== 'loading') {
      const click = Input.consumePointer();
      if (click) {
        if (this.handleSpeakerClick(click)) return;
        Input.restorePointer(click);
      }
    }

    if (this.state !== 'campaignMap') {
      originalUpdate.call(this, dt);
      return;
    }

    DevPanel.update(this);

    const click = Input.consumePointer();
    if (click) Input.restorePointer(click);

    if (DevPanel.open) return;

    this.campaignMap.update(this, dt);
  };

  const originalDraw = GameApp.prototype.draw;
  GameApp.prototype.draw = function () {
    if (this.state === 'intro') {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

      if (Responsive.isPortrait) {
        this.drawRotateWarning(ctx);
        return;
      }

      this.drawIntro(ctx);
      DevPanel.draw(ctx);
      return;
    }

    if (this.state !== 'campaignMap') {
      originalDraw.call(this);
      return;
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    if (Responsive.isPortrait) {
      this.drawRotateWarning(ctx);
      return;
    }

    this.campaignMap.draw(ctx);
    this.drawSpeaker(ctx);
    DevPanel.draw(ctx);
  };

  const originalMenuActivate = Menu.activate;
  Menu.activate = function (game) {
    const item = this.items[this.selectedIndex];
    if (item === 'НОВАЯ ИГРА') {
      AudioManager.playSfx('menuSelect', 0.85);
      game.startIntro();
      return;
    }

    originalMenuActivate.call(this, game);
  };

  GameApp.prototype.getSpeakerHitRect = function () {
    return { x: GAME_CONFIG.width - 112, y: 0, w: 112, h: 96 };
  };

  GameApp.prototype.handleSpeakerClick = function (point) {
    if (this.state === 'splash' || this.state === 'loading' || this.state === 'intro') return false;

    const r = this.getSpeakerHitRect();
    if (point.x < r.x || point.x > r.x + r.w || point.y < r.y || point.y > r.y + r.h) return false;

    AudioManager.unlock();
    const musicOn = AudioManager.toggleMusic();
    if (musicOn && this.isMenuState(this.state)) this.ensureMenuMusic();
    AudioManager.playSfx('menuSelect', 0.7);
    return true;
  };

  GameApp.prototype.drawSpeaker = function (ctx) {
    if (this.state === 'splash' || this.state === 'loading' || this.state === 'intro') return;

    const r = this.getSpeakerRect();
    const on = GAME_CONFIG.settings.musicEnabled !== false;

    ctx.save();
    ctx.fillStyle = 'rgba(8, 8, 10, 0.68)';
    ctx.fillRect(r.x, r.y, r.w, r.h);

    ctx.strokeStyle = on ? 'rgba(255,255,255,0.88)' : 'rgba(255,65,65,0.96)';
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x, r.y, r.w, r.h);

    ctx.fillStyle = on ? '#ffffff' : '#bdbdbd';

    ctx.beginPath();
    ctx.moveTo(r.x + 9, r.y + 21);
    ctx.lineTo(r.x + 17, r.y + 21);
    ctx.lineTo(r.x + 30, r.y + 11);
    ctx.lineTo(r.x + 30, r.y + 37);
    ctx.lineTo(r.x + 17, r.y + 27);
    ctx.lineTo(r.x + 9, r.y + 27);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = on ? '#ffffff' : '#bdbdbd';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(r.x + 31, r.y + 24, 7, -0.8, 0.8);
    ctx.stroke();

    if (on) {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x + 31, r.y + 24, 14, -0.72, 0.72);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(r.x + 31, r.y + 24, 20, -0.62, 0.62);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#ff2b2b';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(r.x + 8, r.y + 40);
      ctx.lineTo(r.x + 40, r.y + 8);
      ctx.stroke();
    }

    ctx.restore();
  };

  const originalNextScreen = LevelScene.prototype.nextScreen;
  LevelScene.prototype.nextScreen = function () {
    if (this.screenIndex < this.images.streets.length - 1) {
      originalNextScreen.call(this);
      return;
    }

    this.game.completeCampaignRegion();
  };

  GameApp.prototype.completeCampaignRegion = function () {
    this.campaignMap.completeActiveRegion();
    this.setState('campaignMap');
    this.ensureMenuMusic();
  };
})();
