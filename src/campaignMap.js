const CampaignMapScreen = {
  storageKey: 'russiaCleanerCampaignRegionIndex',
  activeIndex: 0,
  images: null,
  loaded: false,

  order: [
    'part1',
    'part2',
    'part3',
    'part4'
  ],

  labels: {
    part1: 'ЧАСТЬ 1',
    part2: 'ЧАСТЬ 2',
    part3: 'ЧАСТЬ 3',
    part4: 'ЧАСТЬ 4: МОСКВА'
  },

  sources: {
    base: 'assets/map/campaign/map_base.png',
    locked: {
      part4: 'assets/map/campaign/markers/04_moscow_star_locked.png'
    },
    active: {
      part1: 'assets/map/campaign/active/01_part_1_active.png',
      part2: 'assets/map/campaign/active/02_part_2_active.png',
      part3: 'assets/map/campaign/active/03_part_3_active.png',
      part4: 'assets/map/campaign/active/04_moscow_star_active.png'
    },
    completed: {
      part1: 'assets/map/campaign/completed/01_part_1_completed.png',
      part2: 'assets/map/campaign/completed/02_part_2_completed.png',
      part3: 'assets/map/campaign/completed/03_part_3_completed.png'
    }
  },

  init() {
    if (GAME_CONFIG.campaignRegions && Array.isArray(GAME_CONFIG.campaignRegions)) {
      this.order = GAME_CONFIG.campaignRegions.map(region => region.mapId).filter(Boolean);
    }
    this.activeIndex = 0;
    this.devRegionIndex = 0;
    this.devLevelIndex = 0;
    this.selectedIndex = 0;
    this.selectedLevelIndex = 0;
    this.clearSavedProgress();
    this.images = this.createImageSet(this.sources);
  },

  createImageSet(sources) {
    const set = {
      base: null,
      locked: {},
      active: {},
      completed: {}
    };
    for (const id of this.order) {
      set.active[id] = null;
      set.completed[id] = null;
    }
    return set;
  },

  ensureImage(group, id) {
    const collection = group === 'base' ? this.images : this.images && this.images[group];
    const src = group === 'base'
      ? this.sources.base
      : this.sources[group] && this.sources[group][id];
    const key = group === 'base' ? 'base' : id;
    if (!collection || collection[key] || !src) return collection && collection[key];

    const makeImage = (src) => {
      if (!src) return null;
      const img = new Image();
      img.onload = () => { this.loaded = true; };
      img.onerror = () => console.warn('Missing campaign map image:', src);
      img.src = src;
      return img;
    };
    collection[key] = makeImage(src);
    return collection[key];
  },

  ensureVisibleImages() {
    this.ensureImage('base');
    this.ensureImage('locked', 'part4');
    const displayIndex = this.getDisplayRegionIndex();
    const activeId = this.order[displayIndex] || this.getActiveRegionId();
    this.ensureImage('active', activeId);
    for (let i = 0; i < displayIndex; i++) {
      this.ensureImage('completed', this.order[i]);
    }
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
    this.devRegionIndex = 0;
    this.selectedIndex = 0;
    this.selectedLevelIndex = 0;
    this.clearSavedProgress();
  },

  getRequiredSupport() {
    return Math.max(1, Number(GAME_CONFIG.campaignSupportRequired) || 5);
  },

  getSupportCount(game) {
    const figures = game && Array.isArray(game.supportFigures) ? game.supportFigures : [];
    return new Set(figures).size;
  },

  isMoscowIndex(index) {
    return this.order[index] === 'part4';
  },

  isRegionPlayable(index, game) {
    if (index < 0 || index >= this.order.length) return false;
    if (index < this.activeIndex) return true;
    if (index !== this.activeIndex) return false;
    if (!this.isMoscowIndex(index)) return true;
    return this.getSupportCount(game) >= this.getRequiredSupport();
  },

  ensureMapSelection(game) {
    const fallback = Math.min(Math.max(0, this.activeIndex), Math.max(0, this.order.length - 1));
    if (!this.isRegionPlayable(this.selectedIndex, game)) {
      let next = fallback;
      while (next >= 0 && !this.isRegionPlayable(next, game)) next -= 1;
      this.selectedIndex = Math.max(0, next);
    }
    const levels = this.getMapSelectedLevels();
    this.selectedLevelIndex = Math.max(0, Math.min(Math.max(0, levels.length - 1), Number(this.selectedLevelIndex) || 0));
  },

  getMapSelectedRegionId() {
    return this.order[this.selectedIndex] || this.getActiveRegionId();
  },

  getLevelsForRegionId(regionId) {
    const regions = Array.isArray(GAME_CONFIG.campaignRegions) ? GAME_CONFIG.campaignRegions : [];
    const configured = regions.find((region) => region && region.mapId === regionId);
    if (configured && Array.isArray(configured.levels) && configured.levels.length) return configured.levels;
    return [];
  },

  getMapSelectedLevels() {
    return this.getLevelsForRegionId(this.getMapSelectedRegionId());
  },

  getMapSelectedLevel() {
    const levels = this.getMapSelectedLevels();
    const index = Math.max(0, Math.min(Math.max(0, levels.length - 1), Number(this.selectedLevelIndex) || 0));
    this.selectedLevelIndex = index;
    return { levels, index, key: levels[index] || null };
  },

  moveMapRegion(delta, game) {
    const count = this.order.length;
    if (!count) return;
    for (let step = 1; step <= count; step++) {
      const next = (this.selectedIndex + delta * step + count * 4) % count;
      if (!this.isRegionPlayable(next, game)) continue;
      this.selectedIndex = next;
      this.selectedLevelIndex = 0;
      AudioManager.playSfx('menuMove', 0.7);
      return;
    }
  },

  moveMapLevel(delta) {
    const levels = this.getMapSelectedLevels();
    if (!levels.length) return;
    this.selectedLevelIndex = (this.selectedLevelIndex + delta + levels.length) % levels.length;
    AudioManager.playSfx('menuMove', 0.7);
  },

  startMapSelection(game) {
    if (!game || !this.isRegionPlayable(this.selectedIndex, game)) return;
    const selection = this.getMapSelectedLevel();
    if (!selection.key) return;
    AudioManager.unlock();
    AudioManager.playSfx('menuSelect', 0.85);
    game.campaignStartLevelKey = selection.key;
    game.campaignRunRegionIndex = this.selectedIndex;
    if (window.CampaignFlow && window.CampaignFlow.openCharacterSelect) {
      window.CampaignFlow.openCharacterSelect(game, 'campaignStart');
      return;
    }
    game.resumeTarget = 'campaignMap';
    game.characterSelectMode = 'campaignStart';
    game.setState('characterSelect');
  },

  getActiveRegionId() {
    return this.order[this.activeIndex] || this.order[this.order.length - 1];
  },

  getDisplayRegionIndex() {
    if (this.isDevMode()) {
      return Math.max(0, Math.min(Math.max(0, this.order.length - 1), Number(this.devRegionIndex) || 0));
    }
    return Math.max(0, Math.min(Math.max(0, this.order.length - 1), Number(this.activeIndex) || 0));
  },

  getDevRegionId() {
    return this.order[this.getDisplayRegionIndex()] || this.getActiveRegionId();
  },

  completeActiveRegion() {
    if (this.activeIndex < this.order.length - 1) {
      this.activeIndex += 1;
    }
  },

  getDesktopPanelRect() {
    return { x: 70, y: GAME_CONFIG.height - 150, w: GAME_CONFIG.width - 140, h: 124 };
  },

  getDesktopStartButton() {
    const panel = this.getDesktopPanelRect();
    return { x: panel.x + panel.w - 250, y: panel.y + 62, w: 200, h: 42 };
  },

  getMapSelectorRects() {
    const panel = this.getDesktopPanelRect();
    return {
      regionPrev: { x: panel.x + 26, y: panel.y + 72, w: 36, h: 34 },
      regionNext: { x: panel.x + 248, y: panel.y + 72, w: 36, h: 34 },
      levelPrev: { x: panel.x + 324, y: panel.y + 72, w: 36, h: 34 },
      levelNext: { x: panel.x + 526, y: panel.y + 72, w: 36, h: 34 }
    };
  },

  pointInRect(point, rect) {
    return point && point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  },

  drawButton(ctx, rect, text, active, fontSize) {
    ctx.save();
    ctx.fillStyle = active ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.50)';
    ctx.strokeStyle = active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.62)';
    ctx.lineWidth = active ? 4 : 2;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.font = 'bold ' + (fontSize || 24) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText(text, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
    ctx.fillText(text, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
    ctx.restore();
  },

  isDevMode() {
    return GAME_CONFIG.adminTuningEnabled === true;
  },

  getDevPanelRects() {
    return {
      panel: { x: GAME_CONFIG.width - 420, y: 94, w: 380, h: 282 },
      regionPrev: { x: GAME_CONFIG.width - 392, y: 202, w: 58, h: 38 },
      regionNext: { x: GAME_CONFIG.width - 112, y: 202, w: 58, h: 38 },
      levelPrev: { x: GAME_CONFIG.width - 392, y: 252, w: 58, h: 38 },
      levelNext: { x: GAME_CONFIG.width - 112, y: 252, w: 58, h: 38 },
      start: { x: GAME_CONFIG.width - 324, y: 302, w: 202, h: 42 },
      dev: { x: GAME_CONFIG.width - 392, y: 352, w: 338, h: 18 }
    };
  },

  getSelectedLevels() {
    const activeId = this.getDevRegionId();
    const regions = Array.isArray(GAME_CONFIG.campaignRegions) ? GAME_CONFIG.campaignRegions : [];
    const configured = regions.find((region) => region && region.mapId === activeId);
    if (configured && Array.isArray(configured.levels) && configured.levels.length) return configured.levels;

    return (GAME_CONFIG.levelOrder || []).filter((key) => {
      const level = GAME_CONFIG.levels && GAME_CONFIG.levels[key];
      return level && level.region === activeId;
    });
  },

  getSelectedLevel() {
    const levels = this.getSelectedLevels();
    if (!levels.length) return { levels, index: 0, key: null };
    const index = Math.max(0, Math.min(levels.length - 1, Number(this.devLevelIndex) || 0));
    this.devLevelIndex = index;
    return { levels, index, key: levels[index] };
  },

  setDevRegionIndex(index) {
    this.devRegionIndex = Math.max(0, Math.min(Math.max(0, this.order.length - 1), index));
    this.devLevelIndex = 0;
  },

  moveDevRegion(delta) {
    const count = Math.max(1, this.order.length);
    this.devRegionIndex = (this.getDisplayRegionIndex() + delta + count) % count;
    this.devLevelIndex = 0;
    AudioManager.playSfx('menuMove', 0.7);
  },

  moveDevLevel(delta) {
    const levels = this.getSelectedLevels();
    if (!levels.length) return;
    const current = Math.max(0, Math.min(levels.length - 1, Number(this.devLevelIndex) || 0));
    this.devLevelIndex = (current + delta + levels.length) % levels.length;
    AudioManager.playSfx('menuMove', 0.7);
  },

  startDevSelection(game) {
    if (!game) return;
    AudioManager.unlock();
    AudioManager.playSfx('menuSelect', 0.85);
    const selection = this.getSelectedLevel();
    game.devStartLevelKey = selection.key;
    if (window.CampaignFlow && window.CampaignFlow.openCharacterSelect) {
      window.CampaignFlow.openCharacterSelect(game, 'campaignStart');
      return;
    }
    game.resumeTarget = 'campaignMap';
    game.characterSelectMode = 'campaignStart';
    game.setState('characterSelect');
  },

  openDeveloperPanel(game) {
    if (typeof DevPanel === 'undefined') return;
    GAME_CONFIG.adminTuningEnabled = true;
    if (typeof DevPanel.openFromPauseMenu === 'function') {
      DevPanel.openFromPauseMenu(game);
    } else {
      DevPanel.open = true;
      DevPanel.tab = 'LEVEL WAVES';
      if (typeof DevPanel.ensureLevels === 'function') DevPanel.ensureLevels();
      if (typeof DevPanel.syncSelectedLevelWithScene === 'function') DevPanel.syncSelectedLevelWithScene(game);
    }
    AudioManager.playSfx('menuSelect', 0.65);
  },

  handleDevInput(game) {
    if (!this.isDevMode()) return false;

    if (Input.consume('enter') || Input.consume('space')) {
      this.startDevSelection(game);
      return true;
    }
    if (Input.consume('[') || Input.consume('arrowleft')) {
      this.moveDevRegion(-1);
      return true;
    }
    if (Input.consume(']') || Input.consume('arrowright')) {
      this.moveDevRegion(1);
      return true;
    }
    if (Input.consume(',') || Input.consume('arrowup')) {
      this.moveDevLevel(-1);
      return true;
    }
    if (Input.consume('.') || Input.consume('arrowdown')) {
      this.moveDevLevel(1);
      return true;
    }

    const click = Input.consumePointer();
    if (!click) return false;
    const rects = this.getDevPanelRects();
    if (!this.pointInRect(click, rects.panel)) {
      Input.restorePointer(click);
      return false;
    }
    if (this.pointInRect(click, rects.regionPrev)) this.moveDevRegion(-1);
    else if (this.pointInRect(click, rects.regionNext)) this.moveDevRegion(1);
    else if (this.pointInRect(click, rects.levelPrev)) this.moveDevLevel(-1);
    else if (this.pointInRect(click, rects.levelNext)) this.moveDevLevel(1);
    else if (this.pointInRect(click, rects.start)) this.startDevSelection(game);
    else if (this.pointInRect(click, rects.dev)) this.openDeveloperPanel(game);
    return true;
  },

  update(game, dt) {
    if (this.handleDevInput(game)) return;
    this.ensureMapSelection(game);
    const click = Input.consumePointer();

    if (Input.consume('escape')) {
      game.runInProgress = true;
      game.resumeTarget = 'campaignMap';
      game.setState('mainMenu');
      return;
    }

    if (Input.consume('r')) {
      this.resetProgress();
      AudioManager.playSfx('menuSelect', 0.7);
      return;
    }

    if (Input.consume('arrowleft')) this.moveMapRegion(-1, game);
    else if (Input.consume('arrowright')) this.moveMapRegion(1, game);
    else if (Input.consume('arrowup')) this.moveMapLevel(-1);
    else if (Input.consume('arrowdown')) this.moveMapLevel(1);

    const selectors = this.getMapSelectorRects();
    const startButton = this.getDesktopStartButton();
    if (this.pointInRect(click, selectors.regionPrev)) this.moveMapRegion(-1, game);
    else if (this.pointInRect(click, selectors.regionNext)) this.moveMapRegion(1, game);
    else if (this.pointInRect(click, selectors.levelPrev)) this.moveMapLevel(-1);
    else if (this.pointInRect(click, selectors.levelNext)) this.moveMapLevel(1);
    else if (Input.consume('enter') || Input.consume('space') || this.pointInRect(click, startButton)) this.startMapSelection(game);
  },

  draw(ctx) {
    this.ensureVisibleImages();
    ctx.save();

    ctx.fillStyle = '#010815';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    this.drawImageStretch(ctx, this.images && this.images.base);

    const displayIndex = this.getDisplayRegionIndex();
    for (let i = 0; i < Math.min(displayIndex, this.order.length - 1); i++) {
      const id = this.order[i];
      this.drawImageStretch(ctx, this.images.completed[id]);
    }

    this.drawImageStretch(ctx, this.images.locked.part4);

    if (!this.isDevMode()) this.ensureMapSelection(window.game);
    const activeId = this.isDevMode() ? this.getDevRegionId() : this.getMapSelectedRegionId();
    const pulse = 0.72 + Math.sin(performance.now() / 180) * 0.18;
    ctx.globalAlpha = pulse;
    this.drawImageStretch(ctx, this.images.active[activeId]);
    ctx.globalAlpha = 1;

    this.drawPanel(ctx, activeId);
    this.drawDevPanel(ctx);
    ctx.restore();
  },

  drawImageStretch(ctx, image) {
    if (!image || !image.complete || image.naturalWidth <= 0) return;
    ctx.drawImage(image, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
  },

  drawPanel(ctx, activeId) {
    const panel = this.getDesktopPanelRect();
    const completedCount = this.activeIndex;
    const total = this.order.length;
    const label = this.labels[activeId] || '';
    const start = this.getDesktopStartButton();
    const selectors = this.getMapSelectorRects();
    const level = this.getMapSelectedLevel();
    const support = this.getSupportCount(window.game);
    const requiredSupport = this.getRequiredSupport();

    ctx.fillStyle = 'rgba(0, 10, 24, 0.78)';
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.strokeStyle = '#55d5ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);

    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#dff8ff';
    ctx.strokeStyle = '#001019';
    ctx.lineWidth = 4;
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'left';
    ctx.strokeText('КАРТА СОПРОТИВЛЕНИЯ', panel.x + 26, panel.y + 31);
    ctx.fillText('КАРТА СОПРОТИВЛЕНИЯ', panel.x + 26, panel.y + 31);

    ctx.font = 'bold 21px Arial';
    ctx.fillStyle = '#fff';
    ctx.strokeText(label, panel.x + 26, panel.y + 64);
    ctx.fillText(label, panel.x + 26, panel.y + 64);

    const barW = 180;
    const barH = 16;
    const barX = start.x - barW - 42;
    const barY = panel.y + 29;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#c8f7ff';
    ctx.fillRect(barX, barY, barW * (completedCount / Math.max(1, total)), barH);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('ПРОЙДЕНО ' + completedCount + ' / ' + total, barX + barW / 2, barY + 38);

    ctx.font = 'bold 15px Arial';
    ctx.fillStyle = support >= requiredSupport ? '#9fffd4' : '#ffd45a';
    ctx.fillText('ПОДДЕРЖКА ' + support + ' / ' + requiredSupport, barX + barW / 2, barY + 60);

    ctx.textAlign = 'center';
    ctx.font = 'bold 15px Arial';
    ctx.fillStyle = '#dff8ff';
    ctx.fillText('ЧАСТЬ', selectors.regionPrev.x + 129, selectors.regionPrev.y - 8);
    ctx.fillText('ЭКРАН ' + (level.index + 1) + ' / ' + Math.max(1, level.levels.length), selectors.levelPrev.x + 119, selectors.levelPrev.y - 8);
    this.drawButton(ctx, selectors.regionPrev, '<', false, 18);
    this.drawButton(ctx, selectors.regionNext, '>', false, 18);
    this.drawButton(ctx, selectors.levelPrev, '<', false, 18);
    this.drawButton(ctx, selectors.levelNext, '>', false, 18);

    this.drawButton(ctx, start, 'НАЧАТЬ', true, 21);
    if (this.activeIndex === this.order.indexOf('part4') && support < requiredSupport) {
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffd45a';
      ctx.fillText('КРЕМЛЬ ОТКРОЕТСЯ ПОСЛЕ ' + requiredSupport + ' ПОДДЕРЖЕК', panel.x + 590, panel.y + 60);
    }
    ctx.textAlign = 'left';
  },

  drawDevPanel(ctx) {
    if (!this.isDevMode()) return;
    const rects = this.getDevPanelRects();
    const activeId = this.getDevRegionId();
    const label = this.labels[activeId] || String(activeId || '').toUpperCase();
    const selection = this.getSelectedLevel();
    const levelLabel = selection.key ? String(selection.key).toUpperCase() : 'NO LEVELS';

    ctx.save();
    ctx.fillStyle = 'rgba(2, 8, 15, 0.84)';
    ctx.fillRect(rects.panel.x, rects.panel.y, rects.panel.w, rects.panel.h);
    ctx.strokeStyle = '#ffd45a';
    ctx.lineWidth = 2;
    ctx.strokeRect(rects.panel.x, rects.panel.y, rects.panel.w, rects.panel.h);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#ffd45a';
    ctx.fillText('ВЫБОР ЧАСТИ И ЭКРАНА', rects.panel.x + 22, rects.panel.y + 34);
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, rects.panel.x + 22, rects.panel.y + 76);
    ctx.font = '15px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.fillText('ЧАСТЬ: [ / ] или стрелки влево-вправо', rects.panel.x + 22, rects.panel.y + 104);
    ctx.fillText('ЭКРАН: , / . или стрелки вверх-вниз', rects.panel.x + 22, rects.panel.y + 154);
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SCREEN ' + (selection.index + 1) + '/' + Math.max(1, selection.levels.length) + ': ' + levelLabel, rects.panel.x + 22, rects.panel.y + 178);

    this.drawButton(ctx, rects.regionPrev, '<', false, 18);
    this.drawButton(ctx, rects.start, 'ЗАПУСТИТЬ ЭКРАН', true, 18);
    this.drawButton(ctx, rects.regionNext, '>', false, 18);
    this.drawButton(ctx, rects.levelPrev, '<', false, 18);
    this.drawButton(ctx, rects.levelNext, '>', false, 18);
    this.drawButton(ctx, rects.dev, 'OPEN DEVELOPER PANEL', false, 14);
    ctx.restore();
  }
};
