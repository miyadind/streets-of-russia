(function () {
  if (typeof GameApp === 'undefined' || typeof Menu === 'undefined') return;

  const ANALYTICS_KEY = 'streetsOfRussiaLocalAnalyticsV1';
  const MAX_EVENTS = 250;
  const HEROES = ['alexey', 'anna', 'boris'];

  function readData() {
    try {
      const raw = localStorage.getItem(ANALYTICS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function writeData(data) {
    try { localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data)); } catch (error) {}
  }

  function makeId(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  function getBrowserName() {
    const ua = navigator.userAgent || '';
    if (/Edg\//.test(ua)) return 'Edge';
    if (/OPR\//.test(ua)) return 'Opera';
    if (/Chrome\//.test(ua)) return 'Chrome';
    if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
    if (/Firefox\//.test(ua)) return 'Firefox';
    return 'Other';
  }

  function getDeviceType() {
    const touch = navigator.maxTouchPoints > 0 || (typeof Responsive !== 'undefined' && Responsive.isTouchDevice);
    const narrow = Math.min(window.innerWidth || 0, window.innerHeight || 0) < 700;
    return touch || narrow ? 'mobile' : 'desktop';
  }

  function getDayPart(hour) {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'day';
    if (hour >= 17 && hour < 23) return 'evening';
    return 'night';
  }

  function getTimeContext() {
    const now = new Date();
    const localHour = now.getHours();
    return {
      utcTime: now.toISOString(),
      localTime: now.toLocaleString(),
      localHour,
      localDayOfWeek: now.getDay(),
      timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown'),
      dayPart: getDayPart(localHour)
    };
  }

  function getDeviceContext() {
    return {
      deviceType: getDeviceType(),
      browser: getBrowserName(),
      language: navigator.language || 'unknown',
      screen: (screen.width || 0) + 'x' + (screen.height || 0),
      viewport: (window.innerWidth || 0) + 'x' + (window.innerHeight || 0),
      pixelRatio: window.devicePixelRatio || 1
    };
  }

  function createDefaultData() {
    const playerId = makeId('player');
    return {
      version: 1,
      playerId,
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
      totalSessions: 0,
      totalEvents: 0,
      totalNewGames: 0,
      totalContinues: 0,
      totalGameOvers: 0,
      totalCampaignCompletions: 0,
      maxRegionIndex: 0,
      maxScreenIndex: 0,
      heroPlaySeconds: { alexey: 0, anna: 0, boris: 0 },
      heroSelections: { alexey: 0, anna: 0, boris: 0 },
      heroDeaths: { alexey: 0, anna: 0, boris: 0 },
      localHourBuckets: Array(24).fill(0),
      dayPartBuckets: { morning: 0, day: 0, evening: 0, night: 0 },
      deviceCounts: { desktop: 0, mobile: 0 },
      browserCounts: {},
      events: []
    };
  }

  function normalizeData(data) {
    const base = createDefaultData();
    const merged = Object.assign(base, data && data.version === 1 ? data : {});
    merged.heroPlaySeconds = Object.assign({ alexey: 0, anna: 0, boris: 0 }, merged.heroPlaySeconds || {});
    merged.heroSelections = Object.assign({ alexey: 0, anna: 0, boris: 0 }, merged.heroSelections || {});
    merged.heroDeaths = Object.assign({ alexey: 0, anna: 0, boris: 0 }, merged.heroDeaths || {});
    merged.localHourBuckets = Array.isArray(merged.localHourBuckets) && merged.localHourBuckets.length === 24 ? merged.localHourBuckets : Array(24).fill(0);
    merged.dayPartBuckets = Object.assign({ morning: 0, day: 0, evening: 0, night: 0 }, merged.dayPartBuckets || {});
    merged.deviceCounts = Object.assign({ desktop: 0, mobile: 0 }, merged.deviceCounts || {});
    merged.browserCounts = merged.browserCounts || {};
    merged.events = Array.isArray(merged.events) ? merged.events.slice(-MAX_EVENTS) : [];
    return merged;
  }

  function getRegionIndex(game) {
    return game && game.campaignMap && Number.isFinite(game.campaignMap.activeIndex) ? game.campaignMap.activeIndex : 0;
  }

  function getScreenIndex(game) {
    return game && game.scene && Number.isFinite(game.scene.screenIndex) ? game.scene.screenIndex : 0;
  }

  function createEventPayload(game, eventName, details) {
    const time = getTimeContext();
    const device = getDeviceContext();
    return Object.assign({
      event: eventName,
      sessionId: game.analyticsSessionId,
      playerId: game.analyticsData && game.analyticsData.playerId,
      playerName: game.playerName || 'Игрок',
      regionIndex: getRegionIndex(game),
      screenIndex: getScreenIndex(game),
      activeHero: game.selectedHero || (game.scene && game.scene.player && game.scene.player.heroKey) || 'unknown',
      time,
      device
    }, details || {});
  }

  function track(game, eventName, details) {
    if (!game) return;
    if (!game.analyticsData) game.analyticsData = normalizeData(readData());
    const data = game.analyticsData;
    const payload = createEventPayload(game, eventName, details);
    const hour = payload.time.localHour;
    const part = payload.time.dayPart;
    const deviceType = payload.device.deviceType;
    const browser = payload.device.browser;

    data.lastSeenAt = Date.now();
    data.totalEvents += 1;
    data.localHourBuckets[hour] = (data.localHourBuckets[hour] || 0) + 1;
    data.dayPartBuckets[part] = (data.dayPartBuckets[part] || 0) + 1;
    data.deviceCounts[deviceType] = (data.deviceCounts[deviceType] || 0) + 1;
    data.browserCounts[browser] = (data.browserCounts[browser] || 0) + 1;
    data.maxRegionIndex = Math.max(Number(data.maxRegionIndex) || 0, payload.regionIndex || 0);
    data.maxScreenIndex = Math.max(Number(data.maxScreenIndex) || 0, payload.screenIndex || 0);

    if (eventName === 'new_game_started') data.totalNewGames += 1;
    if (eventName === 'continue_started') data.totalContinues += 1;
    if (eventName === 'game_over') data.totalGameOvers += 1;
    if (eventName === 'campaign_completed') data.totalCampaignCompletions += 1;
    if (eventName === 'hero_selected' && HEROES.includes(payload.activeHero)) {
      data.heroSelections[payload.activeHero] = (data.heroSelections[payload.activeHero] || 0) + 1;
    }
    if (eventName === 'hero_died' && details && HEROES.includes(details.hero)) {
      data.heroDeaths[details.hero] = (data.heroDeaths[details.hero] || 0) + 1;
    }

    data.events.push(payload);
    data.events = data.events.slice(-MAX_EVENTS);
    writeData(data);
  }

  function formatDuration(seconds) {
    seconds = Math.max(0, Math.round(Number(seconds) || 0));
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return h + 'ч ' + m + 'м';
    if (m > 0) return m + 'м ' + s + 'с';
    return s + 'с';
  }

  function drawBar(ctx, label, value, max, x, y, w) {
    const pct = max > 0 ? Math.min(1, value / max) : 0;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x, y, w, 20);
    ctx.fillStyle = 'rgba(120,220,255,0.82)';
    ctx.fillRect(x, y, w * pct, 20);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.strokeRect(x, y, w, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(label, x, y - 7);
    ctx.textAlign = 'right';
    ctx.fillText(String(value), x + w, y - 7);
  }

  function drawHeroTime(ctx, data, x, y) {
    const values = HEROES.map(key => ({ key, value: Math.round(data.heroPlaySeconds[key] || 0) }));
    const max = Math.max(1, ...values.map(item => item.value));
    const labels = { alexey: 'Алексей', anna: 'Анна', boris: 'Борис' };
    ctx.fillStyle = '#f4d8a8';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Время игры по героям', x, y);
    values.forEach((item, i) => {
      const yy = y + 44 + i * 52;
      const pct = item.value / max;
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(x, yy, 390, 24);
      ctx.fillStyle = 'rgba(255,210,120,0.86)';
      ctx.fillRect(x, yy, 390 * pct, 24);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.strokeRect(x, yy, 390, 24);
      ctx.fillStyle = '#fff';
      ctx.font = '18px Arial';
      ctx.fillText(labels[item.key] + ' — ' + formatDuration(item.value), x, yy - 8);
    });
  }

  function drawTimeBuckets(ctx, data, x, y) {
    ctx.fillStyle = '#f4d8a8';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Когда играют по локальному времени', x, y);
    const parts = [
      ['morning', 'Утро 06–11'],
      ['day', 'День 12–16'],
      ['evening', 'Вечер 17–22'],
      ['night', 'Ночь 23–05']
    ];
    const max = Math.max(1, ...parts.map(([key]) => Number(data.dayPartBuckets[key]) || 0));
    parts.forEach(([key, label], i) => drawBar(ctx, label, Number(data.dayPartBuckets[key]) || 0, max, x, y + 42 + i * 52, 390));
  }

  function drawTechnical(ctx, data, x, y) {
    const device = getDeviceContext();
    ctx.fillStyle = '#f4d8a8';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Техника последнего игрока', x, y);
    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    const lines = [
      'Device: ' + device.deviceType,
      'Browser: ' + device.browser,
      'Screen: ' + device.screen,
      'Viewport: ' + device.viewport,
      'Language: ' + device.language,
      'Timezone: ' + getTimeContext().timezone
    ];
    lines.forEach((line, i) => ctx.fillText(line, x, y + 42 + i * 30));
  }

  function drawFunnel(ctx, data, x, y) {
    ctx.fillStyle = '#f4d8a8';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Прогресс и попытки', x, y);
    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    const lines = [
      'Уникальный игрок: ' + data.playerId,
      'Сессий: ' + data.totalSessions,
      'New Game: ' + data.totalNewGames,
      'Continue: ' + data.totalContinues,
      'Game Over: ' + data.totalGameOvers,
      'Прошли кампанию: ' + data.totalCampaignCompletions,
      'Макс. регион: ' + data.maxRegionIndex + '   Макс. экран: ' + data.maxScreenIndex
    ];
    lines.forEach((line, i) => ctx.fillText(line, x, y + 42 + i * 28));
  }

  const AnalyticsScreen = {
    update(game, click) {
      if (Input.consume('escape') || Input.consume('backspace') || Input.consume('enter') || Input.consume('space')) {
        AudioManager.playSfx('menuSelect', 0.65);
        game.setState('mainMenu');
        return;
      }
      if (click) {
        AudioManager.playSfx('menuSelect', 0.65);
        game.setState('mainMenu');
      }
    },

    draw(ctx, game) {
      const data = game.analyticsData || normalizeData(readData());
      ctx.fillStyle = '#05070d';
      ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(36, 36, GAME_CONFIG.width - 72, GAME_CONFIG.height - 72);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.strokeRect(36, 36, GAME_CONFIG.width - 72, GAME_CONFIG.height - 72);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('СТАТИСТИКА / LOCAL ANALYTICS', GAME_CONFIG.width / 2, 88);

      drawFunnel(ctx, data, 78, 132);
      drawHeroTime(ctx, data, 78, 380);
      drawTimeBuckets(ctx, data, 690, 132);
      drawTechnical(ctx, data, 690, 405);

      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '17px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Esc / Enter / клик — назад в главное меню. Это локальная версия; позже эти события можно отправлять на сервер.', GAME_CONFIG.width / 2, 690);
    }
  };

  window.RussiaAnalytics = {
    track,
    read: function () { return normalizeData(readData()); },
    clear: function () { localStorage.removeItem(ANALYTICS_KEY); }
  };
  window.AnalyticsScreen = AnalyticsScreen;

  const previousInit = GameApp.prototype.init;
  GameApp.prototype.init = async function () {
    this.analyticsData = normalizeData(readData());
    this.analyticsSessionId = makeId('session');
    this.analyticsData.totalSessions += 1;
    writeData(this.analyticsData);
    await previousInit.call(this);
    track(this, 'page_loaded');
  };

  const previousStartNewCampaign = GameApp.prototype.startNewCampaign;
  GameApp.prototype.startNewCampaign = function () {
    previousStartNewCampaign.call(this);
    track(this, 'new_game_started');
  };

  const previousContinueCampaignRun = GameApp.prototype.continueCampaignRun;
  GameApp.prototype.continueCampaignRun = function () {
    const result = previousContinueCampaignRun.call(this);
    if (result) track(this, 'continue_started');
    return result;
  };

  if (typeof CharacterSelect !== 'undefined') {
    const previousConfirm = CharacterSelect.confirm;
    CharacterSelect.confirm = function (game) {
      const heroKey = this.heroes[this.selectedIndex];
      previousConfirm.call(this, game);
      if (game && HEROES.includes(heroKey)) track(game, 'hero_selected', { activeHero: heroKey });
    };
  }

  if (typeof LevelScene !== 'undefined') {
    const previousNextScreen = LevelScene.prototype.nextScreen;
    LevelScene.prototype.nextScreen = function () {
      const completedScreen = this.screenIndex;
      if (this.game) track(this.game, 'screen_completed', { screenIndex: completedScreen });
      previousNextScreen.call(this);
      if (this.game && this.game.state === 'level') track(this.game, 'screen_started', { screenIndex: this.screenIndex });
    };
  }

  const previousHandleHeroDefeat = GameApp.prototype.handleHeroDefeat;
  GameApp.prototype.handleHeroDefeat = function (scene) {
    const hero = scene && scene.player ? scene.player.heroKey || this.selectedHero : this.selectedHero;
    previousHandleHeroDefeat.call(this, scene);
    if (hero) track(this, 'hero_died', { hero });
    if (this.state === 'gameOver') track(this, 'game_over');
  };

  const previousMenuGetRuntimeItems = Menu.getRuntimeItems;
  Menu.getRuntimeItems = function (game) {
    const items = previousMenuGetRuntimeItems ? previousMenuGetRuntimeItems.call(this, game) : [];
    if (!items.some(item => item.key === 'analytics')) items.push({ key: 'analytics', label: 'СТАТИСТИКА' });
    return items;
  };

  const previousMenuActivate = Menu.activate;
  Menu.activate = function (game) {
    const items = this.getRuntimeItems(game);
    const item = items[this.selectedIndex];
    if (item && item.key === 'analytics') {
      AudioManager.playSfx('menuSelect', 0.75);
      game.setState('analytics');
      return;
    }
    previousMenuActivate.call(this, game);
  };

  const previousUpdate = GameApp.prototype.update;
  GameApp.prototype.update = function (dt) {
    if (this.state === 'analytics') {
      DevPanel.update(this);
      const click = Input.consumePointer();
      if (click && this.handleSpeakerClick(click)) return;
      if (DevPanel.open) return;
      AnalyticsScreen.update(this, click);
      return;
    }

    const beforeHero = this.scene && this.scene.player ? this.scene.player.heroKey : null;
    previousUpdate.call(this, dt);

    if (this.state === 'level' && beforeHero && HEROES.includes(beforeHero)) {
      this.analyticsData = this.analyticsData || normalizeData(readData());
      this.analyticsData.heroPlaySeconds[beforeHero] = (this.analyticsData.heroPlaySeconds[beforeHero] || 0) + Math.max(0, Number(dt) || 0) / 1000;
      if (!this.analyticsFlushAt || performance.now() - this.analyticsFlushAt > 5000) {
        this.analyticsFlushAt = performance.now();
        writeData(this.analyticsData);
      }
    }
  };

  const previousDraw = GameApp.prototype.draw;
  GameApp.prototype.draw = function () {
    if (this.state === 'analytics') {
      this.ctx.clearRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
      AnalyticsScreen.draw(this.ctx, this);
      this.drawSpeaker(this.ctx);
      DevPanel.draw(this.ctx);
      return;
    }
    previousDraw.call(this);
  };

  window.addEventListener('beforeunload', function () {
    if (window.game && window.game.analyticsData) writeData(window.game.analyticsData);
  });
})();