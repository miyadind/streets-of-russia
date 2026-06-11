(function () {
  if (typeof GameApp === 'undefined') {
    console.warn('Intro text source patch skipped: GameApp is not loaded.');
    return;
  }

  const FALLBACK_INTRO_TEXT = 'Ошибка загрузки introText.txt';

  function getIntroTextUrls() {
    const urls = [];
    const scriptSrc = document.currentScript && document.currentScript.src;

    if (scriptSrc) {
      urls.push(new URL('introText.txt', scriptSrc).href);
    }

    urls.push(new URL('src/introText.txt', document.baseURI).href);
    urls.push(new URL('/src/introText.txt', window.location.origin).href);

    return [...new Set(urls)];
  }

  async function fetchIntroText(url) {
    const cacheBustedUrl = url + (url.includes('?') ? '&' : '?') + 'cache=' + Date.now();
    console.log('[CAMPAIGN INTRO] Trying intro text URL:', cacheBustedUrl);

    const response = await fetch(cacheBustedUrl, { cache: 'no-store' });
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

    return text;
  }

  async function loadExternalIntroText() {
    const urls = getIntroTextUrls();
    let lastError = null;

    for (const url of urls) {
      try {
        const text = await fetchIntroText(url);
        console.log('[CAMPAIGN INTRO] External text loaded as UTF-8. Length:', text.length);
        console.log('[CAMPAIGN INTRO] External text preview:', text.slice(0, 160));
        console.log('[CAMPAIGN INTRO] External text source:', url);
        return text;
      } catch (error) {
        lastError = error;
        console.warn('[CAMPAIGN INTRO] Intro text URL failed:', url, error);
      }
    }

    console.error('[CAMPAIGN INTRO] External text load failed for all URLs:', lastError);
    return FALLBACK_INTRO_TEXT;
  }

  function applyIntroText(game, text) {
    if (!game || !game.intro) return;
    game.intro.text = text;
    game.intro.layoutLines = [];
    game.intro.readerScroll = 0;
    game.intro.readyToContinue = false;
    console.log('[CAMPAIGN INTRO] intro.text replaced from external introText.txt');
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