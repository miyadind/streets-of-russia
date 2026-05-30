class LevelScene {
  constructor(game, images) {
    this.game = game;
    this.images = images;
    this.screenIndex = 0;
    this.player = new Player(game.selectedHero || 'boris', images);
    this.enemies = [];
    this.hitStop = 0;
    this.encounterActive = false;
    this.encounterCleared = false;
    this.debug = false;
    this.spawnEncounter();
  }

  spawnEncounter() {
    this.enemies = [
      new DogRegimeEnemy(760, 548, this.images, 0),
      new DogRegimeEnemy(845, 660, this.images, 1)
    ];
    this.encounterActive = true;
    this.encounterCleared = false;
  }

  nextScreen() {
    if (this.screenIndex < this.images.streets.length - 1) {
      this.screenIndex += 1;
      this.player.x = 190;
      this.player.y = 620;
      this.spawnEncounter();
    } else {
      this.game.setState('mainMenu');
    }
  }

  update(dt) {
    if (Input.consume('h')) this.debug = !this.debug;
    if (Input.consume('escape')) this.game.setState('mainMenu');

    if (this.hitStop > 0) {
      this.hitStop -= dt;
      return;
    }

    this.player.update(dt, this);

    for (const enemy of this.enemies) enemy.update(dt, this);
    this.enemies = this.enemies.filter(enemy => !enemy.remove);

    if (this.encounterActive && !this.enemies.some(enemy => enemy.alive)) {
      this.encounterActive = false;
      this.encounterCleared = true;
    }

    if (this.encounterCleared && this.player.x > GAME_CONFIG.width - 95) {
      this.nextScreen();
    }

    if (this.player.hp <= 0) {
      this.game.setState('characterSelect');
    }
  }

  draw(ctx) {
    const bg = this.images.streets[this.screenIndex] || this.images.streets[0];
    if (bg) ctx.drawImage(bg, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    else {
      ctx.fillStyle = '#222';
      ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    ctx.fillRect(0, GAME_CONFIG.laneTop, GAME_CONFIG.width, GAME_CONFIG.laneBottom - GAME_CONFIG.laneTop);

    const entities = [{ type: 'player', y: this.player.y, ref: this.player }];
    for (const enemy of this.enemies) entities.push({ type: 'enemy', y: enemy.y, ref: enemy });
    entities.sort((a, b) => a.y - b.y);

    for (const entity of entities) entity.ref.draw(ctx, this.debug);

    if (this.encounterActive) {
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,0,0,0.9)';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 5;
      ctx.strokeText('FIGHT!', GAME_CONFIG.width / 2, 128);
      ctx.fillText('FIGHT!', GAME_CONFIG.width / 2, 128);
      ctx.textAlign = 'left';
    }

    if (this.encounterCleared) {
      ctx.font = 'bold 42px Arial';
      ctx.fillStyle = 'lime';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 5;
      ctx.strokeText('→', GAME_CONFIG.width - 90, 380);
      ctx.fillText('→', GAME_CONFIG.width - 90, 380);
    }

    HUD.draw(ctx, this);

    if (this.debug) {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, GAME_CONFIG.laneTop, GAME_CONFIG.width, GAME_CONFIG.laneBottom - GAME_CONFIG.laneTop);
    }
  }
}
