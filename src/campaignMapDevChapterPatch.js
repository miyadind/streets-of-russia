(function () {
  if (typeof CampaignMapScreen === 'undefined' || typeof GAME_CONFIG === 'undefined') return;

  const originalUpdate = CampaignMapScreen.update.bind(CampaignMapScreen);
  const originalDraw = CampaignMapScreen.draw.bind(CampaignMapScreen);

  function enabled() {
    return GAME_CONFIG.adminTuningEnabled === true;
  }

  function rects() {
    return {
      panel: { x: GAME_CONFIG.width - 420, y: 94, w: 380, h: 282 },
      regionPrev: { x: GAME_CONFIG.width - 392, y: 202, w: 58, h: 38 },
      regionNext: { x: GAME_CONFIG.width - 112, y: 202, w: 58, h: 38 },
      levelPrev: { x: GAME_CONFIG.width - 392, y: 252, w: 58, h: 38 },
      levelNext: { x: GAME_CONFIG.width - 112, y: 252, w: 58, h: 38 },
      start: { x: GAME_CONFIG.width - 324, y: 302, w: 202, h: 42 },
      dev: { x: GAME_CONFIG.width - 392, y: 352, w: 338, h: 18 }
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
    map.devLevelIndex = 0;
    if (map.clearSavedProgress) map.clearSavedProgress();
  }

  function moveRegion(map, delta) {
    const count = Math.max(1, map.order.length);
    map.activeIndex = (map.activeIndex + delta + count) % count;
    map.devLevelIndex = 0;
    if (map.clearSavedProgress) map.clearSavedProgress();
    AudioManager.playSfx('menuMove', 0.7);
  }

  function getSelectedLevels(map) {
    const activeId = map.getActiveRegionId ? map.getActiveRegionId() : map.order[map.activeIndex];
    const regions = Array.isArray(GAME_CONFIG.campaignRegions) ? GAME_CONFIG.campaignRegions : [];
    const configured = regions.find(region => region && region.mapId === activeId);
    if (configured && Array.isArray(configured.levels) && configured.levels.length) return configured.levels;

    return (GAME_CONFIG.levelOrder || []).filter((key) => {
      const level = GAME_CONFIG.levels && GAME_CONFIG.levels[key];
      return level && level.region === activeId;
    });
  }

  function getSelectedLevel(map) {
    const levels = getSelectedLevels(map);
    if (!levels.length) return { levels, index: 0, key: null };
    const index = Math.max(0, Math.min(levels.length - 1, Number(map.devLevelIndex) || 0));
    map.devLevelIndex = index;
    return { levels, index, key: levels[index] };
  }

  function moveLevel(map, delta) {
    const levels = getSelectedLevels(map);
    if (!levels.length) return;
    const current = Math.max(0, Math.min(levels.length - 1, Number(map.devLevelIndex) || 0));
    map.devLevelIndex = (current + delta + levels.length) % levels.length;
    AudioManager.playSfx('menuMove', 0.7);
  }

  function startSelectedRegion(map, game) {
    AudioManager.unlock();
    AudioManager.playSfx('menuSelect', 0.85);
    if (game) {
      const selection = getSelectedLevel(map);
      game.devStartLevelKey = selection.key;
      game.devMapStartLevelKey = selection.key;
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

    if (Input.consume('[') || Input.consume('arrowleft')) {
      moveRegion(map, -1);
      return true;
    }

    if (Input.consume(']') || Input.consume('arrowright')) {
      moveRegion(map, 1);
      return true;
    }

    if (Input.consume(',') || Input.consume('arrowup')) {
      moveLevel(map, -1);
      return true;
    }

    if (Input.consume('.') || Input.consume('arrowdown')) {
      moveLevel(map, 1);
      return true;
    }

    const click = Input.consumePointer();
    if (!click) return false;

    const r = rects();
    if (!inRect(click, r.panel)) {
      Input.restorePointer(click);
      return false;
    }

    if (inRect(click, r.regionPrev)) {
      moveRegion(map, -1);
      return true;
    }

    if (inRect(click, r.regionNext)) {
      moveRegion(map, 1);
      return true;
    }

    if (inRect(click, r.levelPrev)) {
      moveLevel(map, -1);
      return true;
    }

    if (inRect(click, r.levelNext)) {
      moveLevel(map, 1);
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
    const selection = getSelectedLevel(map);
    const levelLabel = selection.key ? String(selection.key).toUpperCase() : 'NO LEVELS';

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
    ctx.fillText('REGION: [ / ] or arrows', r.panel.x + 22, r.panel.y + 104);
    ctx.fillText('LEVEL: , / . or arrows', r.panel.x + 22, r.panel.y + 154);

    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SCREEN ' + (selection.index + 1) + '/' + Math.max(1, selection.levels.length) + ': ' + levelLabel, r.panel.x + 22, r.panel.y + 178);

    drawButton(ctx, r.regionPrev, '<', false);
    drawButton(ctx, r.start, 'START SCREEN', true);
    drawButton(ctx, r.regionNext, '>', false);
    drawButton(ctx, r.levelPrev, '<', false);
    drawButton(ctx, r.levelNext, '>', false);
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
