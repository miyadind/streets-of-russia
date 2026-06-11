(function () {
  if (typeof GameApp === 'undefined') {
    console.warn('Intro text source patch skipped: GameApp is not loaded.');
    return;
  }

  const INTRO_TEXT_URL = '/src/introText.txt';
  const FALLBACK_INTRO_TEXT = 'Ошибка загрузки introText.txt';

  async function loadExternalIntroText() {
    try {
      const url = INTRO_TEXT_URL + '?cache=' + Date.now();
      console.log('[CAMPAIGN INTRO] Loading external intro text from:', url);

      const response = await fetch(url, { cache: 'no-store' });
      console.log('[CAMPAIGN INTRO] Response:', response.status, response.url);

      if (!response.ok) throw new Error('Failed to load introText.txt: ' + response.status);

      const buffer = await response.arrayBuffer();
      let text = new TextDecoder('utf-8').decode(buffer);
      text = text.replace(/^\uFEFF/, '');

      const trimmed = text.trim();
      if (!trimmed) throw new Error('introText.txt is empty.');
      if (trimmed.startsWith('<!DOCTYPE html') || trimmed.startsWith('<html')) {
        throw new Error('introText.txt returned HTML instead of text.');
      }

      console.log('[CAMPAIGN INTRO] External text loaded as UTF-8. Length:', text.length);
      console.log('[CAMPAIGN INTRO] External text preview:', text.slice(0, 160));
      return text;
    } catch (error) {
      console.error('[CAMPAIGN INTRO] External text load failed:', error);
      return FALLBACK_INTRO_TEXT;
    }
  }

  function applyIntroText(game, text) {
    if (!game || !game.intro) return;
    game.intro.text = text;
    game.intro.layoutLines = [];
    game.intro.readerScroll = 0;
    game.intro.readyToContinue = false;
    console.log('[CAMPAIGN INTRO] intro.text replaced from /src/introText.txt');
  }

  const originalInit = GameApp.prototype.init;
  GameApp.prototype.init = async function () {
    this.externalIntroTextPromise = loadExternalIntroText();
    await originalInit.call(this);
    const text = await this.externalIntroTextPromise;
    applyIntroText(this, text);
  };

  const originalStartIntro = GameApp.prototype.startIntro;
  GameApp.prototype.startIntro = function () {
    if (this.externalIntroTextPromise) {
      this.externalIntroTextPromise.then((text) => applyIntroText(this, text));
    } else {
      this.externalIntroTextPromise = loadExternalIntroText();
      this.externalIntroTextPromise.then((text) => applyIntroText(this, text));
    }

    originalStartIntro.call(this);
  };
})();