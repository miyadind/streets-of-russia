(function () {
  if (typeof GameApp === 'undefined') {
    console.warn('Intro text source patch skipped: GameApp is not loaded.');
    return;
  }

  const FALLBACK_INTRO_TEXT = 'Ошибка загрузки introContent.js';

  function getIntroText() {
    const text = window.STREETS_INTRO_TEXT;
    if (typeof text !== 'string' || !text.trim()) {
      console.error('[CAMPAIGN INTRO] window.STREETS_INTRO_TEXT is missing or empty. Check src/introContent.js script order.');
      return FALLBACK_INTRO_TEXT;
    }

    console.log('[CAMPAIGN INTRO] Intro text loaded from window.STREETS_INTRO_TEXT. Length:', text.length);
    console.log('[CAMPAIGN INTRO] Intro text preview:', text.slice(0, 160));
    return text;
  }

  function applyIntroText(game) {
    if (!game || !game.intro) return;
    game.intro.text = getIntroText();
    game.intro.layoutLines = [];
    game.intro.readerScroll = 0;
    game.intro.readyToContinue = false;
    console.log('[CAMPAIGN INTRO] intro.text replaced from src/introContent.js');
  }

  const originalInit = GameApp.prototype.init;
  GameApp.prototype.init = async function () {
    await originalInit.call(this);
    applyIntroText(this);
  };

  const originalStartIntro = GameApp.prototype.startIntro;
  GameApp.prototype.startIntro = function () {
    applyIntroText(this);
    originalStartIntro.call(this);
  };
})();
