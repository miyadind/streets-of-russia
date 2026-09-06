window.Assets = {
  backgrounds:{
    main:'assets/backgrounds/Main.png',
    level1:['assets/backgrounds/1/street01.png','assets/backgrounds/1/street02.png','assets/backgrounds/1/street03.png']
  },
  audio:{
    music:{
      menuTheme:'assets/audio/music/Main_menu1.mp3',
      menuThemeAlt:'assets/audio/music/Main_menu2.mp3',
      mapTheme:'assets/audio/music/Map.mp3',
      levelTheme:'assets/audio/music/Dalnii_vostok.mp3',
      farEastTheme:'assets/audio/music/Dalnii_vostok.mp3',
      street03Theme:'assets/audio/music/Gundos music.mp3',
      siberiaTheme:'assets/audio/music/Sibir.mp3',
      bossTheme:'assets/audio/music/Gundos music.mp3'
    },
    sfx:{
      menuMove:null,
      menuSelect:null,
      punch:'assets/audio/sfx/punch.wav',
      punch1:'assets/audio/sfx/punch1.mp3',
      punch2:'assets/audio/sfx/punch2.mp3',
      punch3:'assets/audio/sfx/punch3.mp3',
      hit:'assets/audio/sfx/punch2.mp3',
      enemyDown:'assets/audio/sfx/punch3.mp3',
      playerDown:'assets/audio/sfx/punch3.mp3',
      waveStart:null,
      waveClear:null,
      pickupDrop:null,
      pickupCollect:null,
      bossAppear:null,
      zetnikPreparing:'assets/enemies/zetnik/preparing.mp3?v=zetnik-audio-1',
      zetnikCrash:'assets/enemies/zetnik/crash.mp3?v=zetnik-audio-1',
      goydenishThrow:'assets/enemies/goydenish/Throw.mp3?v=goydenish-throw-1',
      negayWhiplash:'assets/enemies/NEgay/WhiplashFinal.mp3?v=negay-sfx-1',
      negayDeath:'assets/enemies/NEgay/death.mp3?v=negay-sfx-1',
      garageGateMetal:'assets/audio/sfx/metal sound.mp3'
    }
  },
  boris:{
    idle:'assets/characters/boris/Idle.png',
    walk:['assets/characters/boris/walk0.png','assets/characters/boris/walk1.png','assets/characters/boris/walk2.png'],
    punch:['assets/characters/boris/punch0.png','assets/characters/boris/punch1.png','assets/characters/boris/punch2.png'],
    knockdown:'assets/characters/boris/knockdown.png'
  },
  alexey:{
    idle:'assets/characters/alex/Idle.png',
    walk:['assets/characters/alex/walk0.png','assets/characters/alex/walk1.png','assets/characters/alex/walk2.png'],
    punch:['assets/characters/alex/punch0.png','assets/characters/alex/punch1.png','assets/characters/alex/punch2.png'],
    knockdown:'assets/characters/alex/knockdown.png'
  },
  anna:{
    idle:'assets/characters/anna/idle.png',
    walk:['assets/characters/anna/walk0.png','assets/characters/anna/walk1.png','assets/characters/anna/walk2.png'],
    punch:['assets/characters/anna/punch0.png','assets/characters/anna/punch1.png','assets/characters/anna/punch2.png'],
    knockdown:'assets/characters/anna/knockdown.png'
  },
  dog:{
    idle:'assets/enemies/dog-regime/idle.png',
    walk:['assets/enemies/dog-regime/walk0.png','assets/enemies/dog-regime/walk1.png'],
    attack:['assets/enemies/dog-regime/punch0.png','assets/enemies/dog-regime/punch1.png'],
    dead:'assets/enemies/dog-regime/dead.png'
  },
  zetnik:{
    idle:'assets/enemies/zetnik/run01.png',
    walk:['assets/enemies/zetnik/run01.png','assets/enemies/zetnik/run02.png','assets/enemies/zetnik/run03.png'],
    preparing:'assets/enemies/zetnik/preparing.png',
    attack:['assets/enemies/zetnik/preparing.png','assets/enemies/zetnik/fly.png'],
    fly:'assets/enemies/zetnik/fly.png',
    crashed:'assets/enemies/zetnik/crashed.png',
    dead:'assets/enemies/zetnik/crashed.png'
  },
  sucker:{
    idle:'assets/enemies/sucker/idle.png',
    walk:['assets/enemies/sucker/walk0.png','assets/enemies/sucker/walk1.png'],
    attack:['assets/enemies/sucker/bite0.png','assets/enemies/sucker/bite1.png'],
    slide:'assets/enemies/sucker/slideAttack0.png',
    bite:['assets/enemies/sucker/bite0.png','assets/enemies/sucker/bite1.png'],
    dead:'assets/enemies/sucker/dead.png'
  },
  bastard:{
    idle:'assets/enemies/bastard/idle.png',
    fall:'assets/enemies/bastard/fall.png',
    walk:['assets/enemies/bastard/idle.png','assets/enemies/bastard/walk1.png','assets/enemies/bastard/walk2.png']
  },
  goydenish:{
    idle:'assets/enemies/goydenish/Idle.png?v=goydenish-rebuilt-4',
    walkLeft:'assets/enemies/goydenish/walk_L.png?v=goydenish-rebuilt-4',
    walkRight:'assets/enemies/goydenish/walk_R.png?v=goydenish-rebuilt-4',
    swingLeft:'assets/enemies/goydenish/swing_L.png?v=goydenish-rebuilt-4',
    swingRight:'assets/enemies/goydenish/swing_R.png?v=goydenish-rebuilt-4',
    throwLeft:'assets/enemies/goydenish/throw_L.png?v=goydenish-rebuilt-4',
    throwRight:'assets/enemies/goydenish/throw_R.png?v=goydenish-rebuilt-4',
    projectile:'assets/enemies/goydenish/Z.png?v=goydenish-rebuilt-4',
    dead:'assets/enemies/goydenish/knockdown.png?v=goydenish-knockdown-1'
  },
  negay:{
    idle:'assets/enemies/NEgay/idle.png?v=negay-refresh-2',
    walk:['assets/enemies/NEgay/walk01.png?v=negay-refresh-2','assets/enemies/NEgay/walk02.png?v=negay-refresh-2','assets/enemies/NEgay/walk03.png?v=negay-refresh-2'],
    attack:['assets/enemies/NEgay/Whiplash.png?v=negay-refresh-2','assets/enemies/NEgay/WhiplashFinal.png?v=negay-final-1'],
    dead:'assets/enemies/NEgay/knockdown.png?v=negay-refresh-2'
  },
  gundon:{
    idle:'assets/enemies/GunDon/idle.png',
    walk:['assets/enemies/GunDon/walk01.png'],
    scared:'assets/enemies/GunDon/Scared.png',
    appear:'assets/enemies/GunDon/appear.mp3'
  },
  '4ort':{
    idle:'assets/enemies/4ort/idle.png',
    walk:['assets/enemies/4ort/walk01.png','assets/enemies/4ort/walk02.png','assets/enemies/4ort/walk03.png'],
    smoke:['assets/enemies/4ort/smoke_idle01.png','assets/enemies/4ort/smoke_idle02.png'],
    appear:'assets/enemies/4ort/uss4.mp3'
  },
  supportFigureCount: 18,
  pickups:{
    medkit:'assets/pickups/medkit.png?v=pickup-rebuilt-2',
    pirozhok:'assets/pickups/pirozhok.png?v=pickup-rebuilt-2',
    tea:'assets/pickups/tea.png?v=pickup-rebuilt-2'
  }
};

for (let i = 1; i <= Assets.supportFigureCount; i++) {
  const id = 'support' + String(i).padStart(2, '0');
  Assets.pickups[id] = 'assets/support/support-' + String(i).padStart(2, '0') + '.webp';
}

const ASSET_CACHE_VERSION = encodeURIComponent(GAME_CONFIG.buildVersion || 'dev');

function versionAssetPath(value) {
  if (typeof value !== 'string' || !value.startsWith('assets/')) return value;
  return value + (value.includes('?') ? '&' : '?') + 'v=' + ASSET_CACHE_VERSION;
}

function versionAssetTree(value) {
  if (typeof value === 'string') return versionAssetPath(value);
  if (Array.isArray(value)) return value.map(versionAssetTree);
  if (!value || typeof value !== 'object') return value;

  for (const key of Object.keys(value)) value[key] = versionAssetTree(value[key]);
  return value;
}

versionAssetTree(Assets);
