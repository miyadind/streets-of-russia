class GameApp {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.state = 'loading';
    this.selectedHero = 'boris';
    this.images = {};
    this.scene = null;
    this.lastTime = performance.now();
  }

  async init() {
    Responsive.init(this.canvas, this.ctx);
    Input.init(this.canvas);
    AudioManager.init();
    DevPanel.init();

    requestAnimationFrame((time) => this.loop(time));

    this.images = await this.loadImages();
    this.setState('splash');
    this.ensureMenuMusic();
  }

  async loadImages() {
    const paths = {
      main: Assets.backgrounds.main,
      street0: Assets.backgrounds.level1[0],
      street1: Assets.backgrounds.level1[1],
      street2: Assets.backgrounds.level1[2],

      borisIdle: Assets.boris.idle,
      borisWalk0: Assets.boris.walk[0],
      borisWalk1: Assets.boris.walk[1],
      borisWalk2: Assets.boris.walk[2],
      borisPunch0: Assets.boris.punch[0],
      borisPunch1: Assets.boris.punch[1],
      borisPunch2: Assets.boris.punch[2],
      borisKnockdown: Assets.boris.knockdown,

      alexeyIdle: Assets.alexey.idle,
      alexeyWalk0: Assets.alexey.walk[0],
      alexeyWalk1: Assets.alexey.walk[1],
      alexeyWalk2: Assets.alexey.walk[2],
      alexeyPunch0: Assets.alexey.punch[0],
      alexeyPunch1: Assets.alexey.punch[1],
      alexeyPunch2: Assets.alexey.punch[2],
      alexeyKnockdown: Assets.alexey.knockdown,

      annaIdle: Assets.anna.idle,
      annaWalk0: Assets.anna.walk[0],
      annaWalk1: Assets.anna.walk[1],
      annaWalk2: Assets.anna.walk[2],
      annaPunch0: Assets.anna.punch[0],
      annaPunch1: Assets.anna.punch[1],
      annaPunch2: Assets.anna.punch[2],
      annaKnockdown: Assets.anna.knockdown,

      dogIdle: Assets.dog.idle,
      dogWalk0: Assets.dog.walk[0],
      dogWalk1: Assets.dog.walk[1],
      dogAttack0: Assets.dog.attack[0],
      dogAttack1: Assets.dog.attack[1],
      dogDead: Assets.dog.dead,

      zetnikIdle: Assets.zetnik.idle,
      zetnikWalk0: Assets.zetnik.walk[0],
      zetnikWalk1: Assets.zetnik.walk[1],
      zetnikWalk2: Assets.zetnik.walk[2],
      zetnikAttack0: Assets.zetnik.attack[0],
      zetnikAttack1: Assets.zetnik.attack[1],
      zetnikDead: Assets.zetnik.dead,

      suckerIdle: Assets.sucker.idle,
      suckerWalk0: Assets.sucker.walk[0],
      suckerWalk1: Assets.sucker.walk[1],
      suckerAttack0: Assets.sucker.attack[0],
      suckerAttack1: Assets.sucker.attack[1],
      suckerSlide: Assets.sucker.slide,
      suckerBite0: Assets.sucker.bite[0],
      suckerBite1: Assets.sucker.bite[1],
      suckerDead: Assets.sucker.dead,

      bastardIdle: Assets.bastard.idle,
      bastardFall: Assets.bastard.fall,
      bastardWalk0: Assets.bastard.walk[0],
      bastardWalk1: Assets.bastard.walk[1],
      bastardWalk2: Assets.bastard.walk[2]
    };

    const loaded = {};
    const entries = Object.entries(paths);
    await Promise.all(entries.map(([key, src]) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { loaded[key] = img; resolve(); };
      img.onerror = () => { console.warn('Missing image:', src); loaded[key] = null; resolve(); };
      img.src = src;
    })));

    loaded.streets = [loaded.street0, loaded.street1, loaded.street2];

    loaded.heroes = {
      boris: {
        idle: loaded.borisIdle,
        walk: [loaded.borisWalk0, loaded.borisWalk1, loaded.borisWalk2],
        punch: [loaded.borisPunch0, loaded.borisPunch1, loaded.borisPunch2],
        knockdown: loaded.borisKnockdown || loaded.borisIdle
      },
      alexey: {
        idle: loaded.alexeyIdle || loaded.borisIdle,
        walk: [loaded.alexeyWalk0 || loaded.borisWalk0, loaded.alexeyWalk1 || loaded.borisWalk1, loaded.alexeyWalk2 || loaded.borisWalk2],
        punch: [loaded.alexeyPunch0 || loaded.borisPunch0, loaded.alexeyPunch1 || loaded.borisPunch1, loaded.alexeyPunch2 || loaded.borisPunch2],
        knockdown: loaded.alexeyKnockdown || loaded.alexeyIdle || loaded.borisIdle
      },
      anna: {
        idle: loaded.annaIdle || loaded.borisIdle,
        walk: [loaded.annaWalk0 || loaded.borisWalk0, loaded.annaWalk1 || loaded.borisWalk1, loaded.annaWalk2 || loaded.borisWalk2],
        punch: [loaded.annaPunch0 || loaded.borisPunch0, loaded.annaPunch1 || loaded.borisPunch1, loaded.annaPunch2 || loaded.borisPunch2],
        knockdown: loaded.annaKnockdown || loaded.annaIdle || loaded.borisKnockdown || loaded.borisIdle
      }
    };

    loaded.borisWalk = loaded.heroes.boris.walk;
    loaded.borisPunch = loaded.heroes.boris.punch;

    loaded.dogWalk = [loaded.dogWalk0, loaded.dogWalk1];
    loaded.dogAttack = [loaded.dogAttack0, loaded.dogAttack1];

    loaded.enemies = {
      dogRegime: {
        idle: loaded.dogIdle,
        walk: [loaded.dogWalk0, loaded.dogWalk1],
        attack: [loaded.dogAttack0, loaded.dogAttack1],
        dead: loaded.dogDead
      },
      zetnik: {
        idle: loaded.zetnikIdle || loaded.zetnikWalk0 || loaded.dogIdle,
        walk: [
          loaded.zetnikWalk0 || loaded.zetnikIdle || loaded.dogWalk0,
          loaded.zetnikWalk1 || loaded.zetnikIdle || loaded.dogWalk1,
          loaded.zetnikWalk2 || loaded.zetnikIdle || loaded.dogWalk0
        ],
        attack: [loaded.zetnikAttack0 || loaded.zetnikIdle || loaded.dogAttack0, loaded.zetnikAttack1 || loaded.zetnikAttack0 || loaded.dogAttack1],
        dead: loaded.zetnikDead || loaded.zetnikAttack0 || loaded.zetnikIdle || loaded.dogDead
      },
      sucker: {
        idle: loaded.suckerIdle || loaded.dogIdle,
        walk: [loaded.suckerWalk0 || loaded.dogWalk0, loaded.suckerWalk1 || loaded.dogWalk1],
        attack: [loaded.suckerAttack0 || loaded.dogAttack0, loaded.suckerAttack1 || loaded.dogAttack1],
        slide: loaded.suckerSlide || loaded.suckerAttack0 || loaded.dogAttack0,
        bite: [loaded.suckerBite0 || loaded.suckerAttack0 || loaded.dogAttack0, loaded.suckerBite1 || loaded.suckerAttack1 || loaded.dogAttack1],
        dead: loaded.suckerDead || loaded.dogDead
      },
      bastard: {
        idle: loaded.bastardIdle || loaded.dogIdle,
        fall: loaded.bastardFall || loaded.dogDead || loaded.bastardIdle || loaded.dogIdle,
        walk: [
          loaded.bastardWalk0 || loaded.bastardIdle || loaded.dogWalk0,
          loaded.bastardWalk1 || loaded.bastardIdle || loaded.dogWalk1,
          loaded.bastardWalk2 || loaded.bastardIdle || loaded.dogWalk0
        ]
      }
    };

    return loaded;
  }

  getMenuMusicKey() {
    return (GAME_CONFIG.audio && GAME_CONFIG.audio.music && GAME_CONFIG.audio.music.menu) || 'menuTheme';
  }

  isMenuState(state) {
    return state === 'splash' || state === 'mainMenu' || state === 'settings' || state === 'characterSelect';
  }

  ensureMenuMusic() {
    AudioManager.playMusic(this.getMenuMusicKey(), false, true);
  }

  setState(nextState) {
    const previousState = this.state;
    this.state = nextState;
    this.updateMusicForState(previousState, nextState);
  }

  updateMusicForState(previousState, nextState) {
    if (this.isMenuState(nextState)) {
      if (!this.isMenuState(previousState) || AudioManager.currentMusicKey !== this.getMenuMusicKey()) {
        this.ensureMenuMusic();
      }
      return;
    }
  }

  startLevel() {
    this.scene = new LevelScene(this, this.images);
    this.setState('level');
    const levelKey = this.scene && this.scene.getLevelKey ? this.scene.getLevelKey() : null;
    const level = levelKey && GAME_CONFIG.levels ? GAME_CONFIG.levels[levelKey] : null;
    AudioManager.playMusic((level && level.music) || (GAME_CONFIG.audio && GAME_CONFIG.audio.music && GAME_CONFIG.audio.music.level) || 'levelTheme', true);
  }

  update(dt) {
    DevPanel.update(this);

    const click = Input.consumePointer();
    if (click && this.handleSpeakerClick(click)) return;

    if (DevPanel.open) return;

    if (this.state === 'splash') {
      if (Input.consumeAnyKey() || click) {
        AudioManager.unlock();
        this.ensureMenuMusic();
        AudioManager.playSfx('menuSelect');
        this.setState('mainMenu');
      }
    } else if (this.state === 'mainMenu') {
      if (click) Input.restorePointer(click);
      Menu.update(this);
    } else if (this.state === 'settings') {
      if (click) Input.restorePointer(click);
      Menu.updateSettings(this);
    } else if (this.state === 'characterSelect') {
      if (click) Input.restorePointer(click);
      CharacterSelect.update(this);
    } else if (this.state === 'level' && this.scene) {
      if (click) Input.restorePointer(click);
      if (typeof MobileControls !== 'undefined') MobileControls.update(this);
      this.scene.update(dt);
    } else if (typeof MobileControls !== 'undefined') {
      MobileControls.update(this);
    }
  }

  getSpeakerRect() {
    return { x: GAME_CONFIG.width - 72, y: 16, w: 48, h: 48 };
  }

  handleSpeakerClick(point) {
    const r = this.getSpeakerRect();
    if (point.x < r.x || point.x > r.x + r.w || point.y < r.y || point.y > r.y + r.h) return false;
    AudioManager.unlock();
    AudioManager.toggleMusic();
    AudioManager.playSfx('menuSelect', 0.7);
    return true;
  }

  drawSpeaker(ctx) {
    const r = this.getSpeakerRect();
    const on = GAME_CONFIG.settings.musicEnabled !== false;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.48)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = on ? 'rgba(255,255,255,0.85)' : 'rgba(255,80,80,0.95)';
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x, r.y, r.w, r.h);

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(r.x + 12, r.y + 22);
    ctx.lineTo(r.x + 20, r.y + 22);
    ctx.lineTo(r.x + 31, r.y + 12);
    ctx.lineTo(r.x + 31, r.y + 36);
    ctx.lineTo(r.x + 20, r.y + 26);
    ctx.lineTo(r.x + 12, r.y + 26);
    ctx.closePath();
    ctx.fill();

    if (on) {
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.arc(r.x + 31, r.y + 24, 7, -0.75, 0.75);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(r.x + 31, r.y + 24, 13, -0.65, 0.65);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#ff5555';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(r.x + 12, r.y + 12);
      ctx.lineTo(r.x + 36, r.y + 36);
      ctx.moveTo(r.x + 36, r.y + 12);
      ctx.lineTo(r.x + 12, r.y + 36);
      ctx.stroke();
    }
    ctx.restore();
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    if (this.state === 'loading') {
      this.drawLoading(ctx);
    } else if (this.state === 'splash') {
      Menu.drawSplash(ctx, this.images);
    } else if (this.state === 'mainMenu') {
      Menu.draw(ctx, this.images);
    } else if (this.state === 'settings') {
      Menu.drawSettings(ctx, this.images);
    } else if (this.state === 'characterSelect') {
      CharacterSelect.draw(ctx, this.images);
    } else if (this.state === 'level' && this.scene) {
      this.scene.draw(ctx);
    }

    if (typeof MobileControls !== 'undefined') MobileControls.draw(ctx, this);
    this.drawSpeaker(ctx);
    DevPanel.draw(ctx);
  }

  drawLoading(ctx) {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 34px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ЗАГРУЗКА...', GAME_CONFIG.width / 2, GAME_CONFIG.height / 2);
    ctx.textAlign = 'left';
  }

  drawRotateWarning(ctx) {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ПОВЕРНИТЕ ТЕЛЕФОН', GAME_CONFIG.width / 2, 320);
    ctx.font = '24px Arial';
    ctx.fillText('Игра работает в горизонтальном режиме', GAME_CONFIG.width / 2, 370);
    ctx.textAlign = 'left';
  }

  loop(time) {
    const dt = Math.min(45, time - this.lastTime);
    this.lastTime = time;
    this.update(dt);
    this.draw();
    Input.endFrame();
    requestAnimationFrame((nextTime) => this.loop(nextTime));
  }
}

window.addEventListener('load', () => {
  const game = new GameApp();
  game.init();
});
