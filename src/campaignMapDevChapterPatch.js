(function () {
  if (typeof CampaignMapScreen === 'undefined' || typeof GAME_CONFIG === 'undefined') return;

  const originalUpdate = CampaignMapScreen.update.bind(CampaignMapScreen);
  const originalDraw = CampaignMapScreen.draw.bind(CampaignMapScreen);

  function enabled() {
    return GAME_CONFIG.adminTuningEnabled === true;
  }

  function rects() {
    return {
      panel: { x: GAME_CONFIG.width - 420, y: 94, w: 380, h: 172 },
      prev: { x: GAME_CONFIG.width - 392, y: 188, w: 58, h: 42 },
      next: { x: GAME_CONFIG.width - 112, y: 188, w: 58, h: 42 },
      start: { x: GAME_CONFIG.width - 324, y: 188, w: 202, h: 42 },
      dev: { x: GAME_CONFIG.width - 392, y: 238, w: 338, h: 28 }
    };
  }

  function inRect(point, rect) {
    return point && point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  function clampIndex(map, index) {
    return Math.max(0, Math.min(Math.max(0, map.order.length - 1), index));
  }

  function setRegionIndex(map, index) {
    map.activeIndex = clampIndex(map, index);
    if (map.clearSavedProgress) map.clearSavedProgress();
  }

  function moveRegion(map, delta) {
    const count = Math.max(1, map.order.length);
    map.activeIndex = (map.activeIndex + delta + count) % count;
    if (map.clearSavedProgress) map.clearSavedProgress();
    AudioManager.playSfx('menuMove', 0.7);
  }

  function startSelectedRegion(map, game) {
    AudioManager.unlock();
    AudioManager.playSfx('menuSelect', 0.85);
    if (game) {
      if (window.CampaignFlow && window.CampaignFlow.openCharacterSelect) {
        window.CampaignFlow.openCharacterSelect(game, 'campaignStart');
      } else {
        game.resumeTarget = 'campaignMap';
        game.characterSelectMode = 'campaignStart';
        game.setState('characterSelect');
      }
    }
  }

  function openDeveloperPanel(game) {
    if (typeof DevPanel === 'undefined') return;
    GAME_CONFIG.adminTuningEnabled = true;
    if (typeof DevPanel.openFromPauseMenu === 'function') DevPanel.openFromPauseMenu(game);
    else {
      DevPanel.open = true;
      DevPanel.tab = 'LEVEL WAVES';
      if (typeof DevPanel.ensureLevels === 'function') DevPanel.ensureLevels();
      if (typeof DevPanel.syncSelectedLevelWithScene === 'function') DevPanel.syncSelectedLevelWithScene(game);
    }
    AudioManager.playSfx('menuSelect', 0.65);
  }

  function handleDevInput(map, game) {
    if (!enabled()) return false;

    if (Input.consume('[')) {
      moveRegion(map, -1);
      return true;
    }

    if (Input.consume(']')) {
      moveRegion(map, 1);
      return true;
    }

    const click = Input.consumePointer();
    if (!click) return false;

    const r = rects();
    if (!inRect(click, r.panel)) {
      Input.restorePointer(click);
      return false;
    }

    if (inRect(click, r.prev)) {
      moveRegion(map, -1);
      return true;
    }

    if (inRect(click, r.next)) {
      moveRegion(map, 1);
      return true;
    }

    if (inRect(click, r.start)) {
      startSelectedRegion(map, game);
      return true;
    }

    if (inRect(click, r.dev)) {
      openDeveloperPanel(game);
      return true;
    }

    return true;
  }

  function drawButton(ctx, rect, label, active) {
    ctx.save();
    ctx.fillStyle = active ? 'rgba(158, 26, 26, 0.88)' : 'rgba(0, 0, 0, 0.62)';
    ctx.strokeStyle = active ? '#ffffff' : 'rgba(255,255,255,0.72)';
    ctx.lineWidth = active ? 3 : 2;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
    ctx.restore();
  }

  function drawDevPanel(map, ctx) {
    if (!enabled()) return;
    const r = rects();
    const activeId = map.getActiveRegionId ? map.getActiveRegionId() : map.order[map.activeIndex];
    const label = map.labels && map.labels[activeId] ? map.labels[activeId] : String(activeId || '').toUpperCase();

    ctx.save();
    ctx.fillStyle = 'rgba(2, 8, 15, 0.84)';
    ctx.fillRect(r.panel.x, r.panel.y, r.panel.w, r.panel.h);
    ctx.strokeStyle = '#ffd45a';
    ctx.lineWidth = 2;
    ctx.strokeRect(r.panel.x, r.panel.y, r.panel.w, r.panel.h);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#ffd45a';
    ctx.fillText('DEV CHAPTER SELECT', r.panel.x + 22, r.panel.y + 34);

    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, r.panel.x + 22, r.panel.y + 76);

    ctx.font = '15px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.fillText('Click arrows or press [ / ] to switch region', r.panel.x + 22, r.panel.y + 108);

    drawButton(ctx, r.prev, '<', false);
    drawButton(ctx, r.start, 'START REGION', true);
    drawButton(ctx, r.next, '>', false);
    drawButton(ctx, r.dev, 'OPEN DEVELOPER PANEL', false);
    ctx.restore();
  }

  CampaignMapScreen.update = function (game, dt) {
    if (handleDevInput(this, game)) return;
    originalUpdate(game, dt);
  };

  CampaignMapScreen.draw = function (ctx) {
    originalDraw(ctx);
    drawDevPanel(this, ctx);
  };

  CampaignMapScreen.setDevRegionIndex = function (index) {
    setRegionIndex(this, index);
  };
})();
