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
  const INTRO_TYPE_SPEED = 46; // characters per second
  const INTRO_SCROLL_SPEED = 28; // pixels per second
  const INTRO_AUTO_CONTINUE_DELAY = 4200;
  const INTRO_SEEN_KEY = 'streetsOfRussiaIntroSeen';

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
      startedAt: 0,
      finishedAt: 0,
      firstRun: false,
      visibleChars: 0
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
    this.intro.startedAt = performance.now();
    this.intro.finishedAt = 0;
    this.intro.firstRun = !this.hasSeenIntro();
    this.intro.visibleChars = 0;
    this.setState('intro');
  };

  GameApp.prototype.finishIntro = function () {
    this.markIntroSeen();
    this.setState('campaignMap');
    this.ensureMenuMusic();
  };

  GameApp.prototype.updateIntro = function (dt) {
    const elapsedMs = performance.now() - this.intro.startedAt;
    this.intro.visibleChars = Math.min(this.intro.text.length, Math.floor(elapsedMs / 1000 * INTRO_TYPE_SPEED));
    const complete = this.intro.visibleChars >= this.intro.text.length;

    const click = Input.consumePointer();
    const anyKey = Input.consumeAnyKey();

    if (!this.intro.firstRun && (click || anyKey)) {
      this.finishIntro();
      return;
    }

    if (this.intro.firstRun && (click || anyKey) && complete) {
      this.finishIntro();
      return;
    }

    if (complete) {
      if (!this.intro.finishedAt) this.intro.finishedAt = performance.now();
      if (performance.now() - this.intro.finishedAt > INTRO_AUTO_CONTINUE_DELAY) {
        this.finishIntro();
      }
    }
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

    const elapsedMs = performance.now() - this.intro.startedAt;
    const visibleChars = this.intro.visibleChars;
    const visibleText = this.intro.text.slice(0, visibleChars);

    ctx.save();
    ctx.beginPath();
    ctx.rect(150, 80, GAME_CONFIG.width - 300, GAME_CONFIG.height - 160);
    ctx.clip();

    ctx.font = 'bold 25px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const lineHeight = 34;
    const maxWidth = GAME_CONFIG.width - 300;
    const lines = wrapText(ctx, visibleText, maxWidth);
    const fullLines = wrapText(ctx, this.intro.text, maxWidth);
    const totalTextHeight = fullLines.length * lineHeight;
    const scrollDistance = Math.max(0, totalTextHeight - (GAME_CONFIG.height - 210));
    const typedRatio = this.intro.text.length > 0 ? visibleChars / this.intro.text.length : 1;
    const startY = GAME_CONFIG.height - 92 - Math.min(scrollDistance + 110, elapsedMs / 1000 * INTRO_SCROLL_SPEED + typedRatio * scrollDistance * 0.35);

    ctx.shadowColor = '#000';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#f4f4f4';

    for (let i = 0; i < lines.length; i++) {
      const y = startY + i * lineHeight;
      if (y < 50 || y > GAME_CONFIG.height - 65) continue;
      ctx.strokeText(lines[i], 150, y);
      ctx.fillText(lines[i], 150, y);
    }

    const caretLine = lines.length > 0 ? lines[lines.length - 1] : '';
    const caretX = 150 + ctx.measureText(caretLine).width + 8;
    const caretY = startY + (lines.length - 1) * lineHeight + 3;
    if (visibleChars < this.intro.text.length && Math.floor(elapsedMs / 320) % 2 === 0 && caretY > 50 && caretY < GAME_CONFIG.height - 65) {
      ctx.fillStyle = '#ff2b2b';
      ctx.fillRect(caretX, caretY, 12, 25);
    }

    ctx.restore();

    const fade = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.height);
    fade.addColorStop(0, 'rgba(0,0,0,0.84)');
    fade.addColorStop(0.18, 'rgba(0,0,0,0)');
    fade.addColorStop(0.78, 'rgba(0,0,0,0)');
    fade.addColorStop(1, 'rgba(0,0,0,0.90)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.62)';
    const complete = visibleChars >= this.intro.text.length;
    let hint = '';
    if (this.intro.firstRun) {
      hint = complete ? 'Нажмите любую клавишу, чтобы продолжить' : 'Первый запуск: интро нужно досмотреть до конца';
    } else {
      hint = 'Нажмите любую клавишу, чтобы пропустить';
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

    if (this.state !== 'campaignMap') {
      originalUpdate.call(this, dt);
      return;
    }

    DevPanel.update(this);

    const click = Input.consumePointer();
    if (click && this.handleSpeakerClick(click)) return;
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

  const originalHandleSpeakerClick = GameApp.prototype.handleSpeakerClick;
  GameApp.prototype.handleSpeakerClick = function (point) {
    if (this.state === 'splash' || this.state === 'loading' || this.state === 'intro') return false;
    return originalHandleSpeakerClick.call(this, point);
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
