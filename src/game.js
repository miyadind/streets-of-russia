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
    DevPanel.init();
    this.images = await this.loadImages();
    this.setState('splash');
    requestAnimationFrame((time) => this.loop(time));
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

      alexeyIdle: Assets.alexey.idle,
      alexeyWalk0: Assets.alexey.walk[0],
      alexeyWalk1: Assets.alexey.walk[1],
      alexeyWalk2: Assets.alexey.walk[2],
      alexeyPunch0: Assets.alexey.punch[0],
      alexeyPunch1: Assets.alexey.punch[1],
      alexeyPunch2: Assets.alexey.punch[2],

      dogIdle: Assets.dog.idle,
      dogWalk0: Assets.dog.walk[0],
      dogWalk1: Assets.dog.walk[1],
      dogAttack0: Assets.dog.attack[0],
      dogAttack1: Assets.dog.attack[1],
      dogDead: Assets.dog.dead,

      suckerIdle: Assets.sucker.idle,
      suckerWalk0: Assets.sucker.walk[0],
      suckerWalk1: Assets.sucker.walk[1],
      suckerAttack0: Assets.sucker.attack[0],
      suckerAttack1: Assets.sucker.attack[1],
      suckerDead: Assets.sucker.dead
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
        punch: [loaded.borisPunch0, loaded.borisPunch1, loaded.borisPunch2]
      },
      alexey: {
        idle: loaded.alexeyIdle || loaded.borisIdle,
        walk: [loaded.alexeyWalk0, loaded.alexeyWalk1, loaded.alexeyWalk2],
        punch: [loaded.alexeyPunch0, loaded.alexeyPunch1, loaded.alexeyPunch2]
      },
      anna: {
        idle: loaded.borisIdle,
        walk: [loaded.borisWalk0, loaded.borisWalk1, loaded.borisWalk2],
        punch: [loaded.borisPunch0, loaded.borisPunch1, loaded.borisPunch2]
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
      sucker: {
        idle: loaded.suckerIdle || loaded.dogIdle,
        walk: [loaded.suckerWalk0 || loaded.dogWalk0, loaded.suckerWalk1 || loaded.dogWalk1],
        attack: [loaded.suckerAttack0 || loaded.dogAttack0, loaded.suckerAttack1 || loaded.dogAttack1],
        dead: loaded.suckerDead || loaded.dogDead
      }
    };

    return loaded;
  }

  setState(nextState) {
    this.state = nextState;
  }

  startLevel() {
    this.scene = new LevelScene(this, this.images);
    this.setState('level');
  }

  update(dt) {
    if (Responsive.isPortrait) return;

    DevPanel.update(this);

    if (DevPanel.open) return;

    if (this.state === 'splash') {
      const click = Input.consumePointer();
      if (Input.consumeAnyKey() || click) this.setState('mainMenu');
    } else if (this.state === 'mainMenu') {
      Menu.update(this);
    } else if (this.state === 'settings') {
      Menu.updateSettings(this);
    } else if (this.state === 'characterSelect') {
      CharacterSelect.update(this);
    } else if (this.state === 'level' && this.scene) {
      this.scene.update(dt);
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    if (Responsive.isPortrait) {
      this.drawRotateWarning(ctx);
      return;
    }

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