const CampaignMapScreen = {
  storageKey: 'russiaCleanerCampaignRegionIndex',
  activeIndex: 0,
  images: null,
  loaded: false,

  order: [
    'farEast',
    'siberia',
    'ural',
    'northwestPiter',
    'volga',
    'southSochi',
    'centralMoscow'
  ],

  labels: {
    farEast: 'ДАЛЬНЕВОСТОЧНОЕ ОТДЕЛЕНИЕ',
    siberia: 'СИБИРСКОЕ ОТДЕЛЕНИЕ',
    ural: 'УРАЛЬСКОЕ ОТДЕЛЕНИЕ',
    northwestPiter: 'СЕВЕРО-ЗАПАДНОЕ ОТДЕЛЕНИЕ',
    volga: 'ПРИВОЛЖСКОЕ ОТДЕЛЕНИЕ',
    southSochi: 'ЮЖНОЕ ОТДЕЛЕНИЕ',
    centralMoscow: 'ЦЕНТРАЛЬНОЕ ОТДЕЛЕНИЕ / МОСКВА'
  },

  sources: {
    base: 'assets/map/campaign/map_base.png',
    active: {
      farEast: 'assets/map/campaign/active/01_far_east_active.png',
      siberia: 'assets/map/campaign/active/02_siberia_active.png',
      ural: 'assets/map/campaign/active/03_ural_active.png',
      volga: 'assets/map/campaign/active/04_volga_active.png',
      centralMoscow: 'assets/map/campaign/active/05_central_moscow_active.png',
      northwestPiter: 'assets/map/campaign/active/06_northwest_piter_active.png',
      southSochi: 'assets/map/campaign/active/07_south_sochi_active.png'
    },
    completed: {
      farEast: 'assets/map/campaign/completed/01_far_east_completed.png',
      siberia: 'assets/map/campaign/completed/02_siberia_completed.png',
      ural: 'assets/map/campaign/completed/03_ural_completed.png',
      volga: 'assets/map/campaign/completed/04_volga_completed.png',
      centralMoscow: 'assets/map/campaign/completed/05_central_moscow_completed.png',
      northwestPiter: 'assets/map/campaign/completed/06_northwest_piter_completed.png',
      southSochi: 'assets/map/campaign/completed/07_south_sochi_completed.png'
    }
  },

  init() {
    this.activeIndex = 0;
    this.clearSavedProgress();
    this.images = this.createImageSet(this.sources);
  },

  createImageSet(sources) {
    const makeImage = (src) => {
      if (!src) return null;
      const img = new Image();
      img.onload = () => { this.loaded = true; };
      img.onerror = () => console.warn('Missing campaign map image:', src);
      img.src = src;
      return img;
    };

    const set = {
      base: makeImage(sources.base),
      active: {},
      completed: {}
    };

    for (const id of this.order) {
      set.active[id] = makeImage(sources.active && sources.active[id]);
      set.completed[id] = makeImage(sources.completed && sources.completed[id]);
    }

    return set;
  },

  loadProgress() {
    return 0;
  },

  saveProgress() {
    // Сохранения кампании пока отключены: прогресс живёт только до перезагрузки страницы.
  },

  clearSavedProgress() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {}
  },

  resetProgress() {
    this.activeIndex = 0;
    this.clearSavedProgress();
  },

  getActiveRegionId() {
    return this.order[this.activeIndex] || this.order[this.order.length - 1];
  },

  completeActiveRegion() {
    if (this.activeIndex < this.order.length - 1) {
      this.activeIndex += 1;
    }
  },

  update(game, dt) {
    const click = Input.consumePointer();

    if (Input.consume('escape')) {
      game.setState('mainMenu');
      return;
    }

    if (Input.consume('r')) {
      this.resetProgress();
      AudioManager.playSfx('menuSelect', 0.7);
      return;
    }

    if (Input.consume('enter') || Input.consume('space') || click) {
      AudioManager.unlock();
      AudioManager.playSfx('menuSelect', 0.85);
      game.setState('characterSelect');
    }
  },

  draw(ctx) {
    ctx.save();

    ctx.fillStyle = '#010815';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    this.drawImageStretch(ctx, this.images && this.images.base);

    for (let i = 0; i < this.activeIndex; i++) {
      const id = this.order[i];
      this.drawImageStretch(ctx, this.images.completed[id]);
    }

    const activeId = this.getActiveRegionId();
    const pulse = 0.72 + Math.sin(performance.now() / 180) * 0.18;
    ctx.globalAlpha = pulse;
    this.drawImageStretch(ctx, this.images.active[activeId]);
    ctx.globalAlpha = 1;

    this.drawPanel(ctx, activeId);
    ctx.restore();
  },

  drawImageStretch(ctx, image) {
    if (!image || !image.complete || image.naturalWidth <= 0) return;
    ctx.drawImage(image, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
  },

  drawPanel(ctx, activeId) {
    const panelX = 40;
    const panelY = GAME_CONFIG.height - 160;
    const panelW = GAME_CONFIG.width - 80;
    const panelH = 118;
    const completedCount = this.activeIndex;
    const total = this.order.length;

    ctx.fillStyle = 'rgba(0, 8, 22, 0.78)';
    ctx.fillRect(panelX, panelY, panelW, panelH);

    ctx.strokeStyle = 'rgba(60, 220, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#dff8ff';
    ctx.strokeStyle = '#001019';
    ctx.lineWidth = 4;
    ctx.strokeText('КАРТА СОПРОТИВЛЕНИЯ', panelX + 28, panelY + 40);
    ctx.fillText('КАРТА СОПРОТИВЛЕНИЯ', panelX + 28, panelY + 40);

    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.strokeText('АКТИВНО: ' + this.labels[activeId], panelX + 28, panelY + 76);
    ctx.fillText('АКТИВНО: ' + this.labels[activeId], panelX + 28, panelY + 76);

    ctx.font = '18px Arial';
    ctx.fillStyle = '#b8eaff';
    ctx.fillText('ENTER / SPACE / КЛИК — НАЧАТЬ УРОВЕНЬ    R — СБРОС ПРОГРЕССА', panelX + 28, panelY + 102);

    const barX = panelX + panelW - 310;
    const barY = panelY + 44;
    const barW = 250;
    const barH = 18;

    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#c8f7ff';
    ctx.fillRect(barX, barY, barW * (completedCount / Math.max(1, total - 1)), barH);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('ПРОГРЕСС ' + completedCount + ' / ' + (total - 1), barX + barW / 2, barY + 45);

    ctx.textAlign = 'left';
  }
};
