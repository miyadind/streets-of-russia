const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const configPath = path.join(root, 'src', 'config.js');
const exportPath = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : null;

if (!exportPath) {
  console.error('Usage: npm run apply-dev-export -- path/to/streets-of-russia-dev-export.json');
  process.exit(1);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(target, source) {
  for (const [key, value] of Object.entries(source || {})) {
    if (isPlainObject(value) && isPlainObject(target[key])) {
      deepMerge(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

function loadCurrentConfig() {
  const code = fs.readFileSync(configPath, 'utf8');
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(code + '\nthis.__GAME_CONFIG = GAME_CONFIG;', sandbox, { filename: configPath });
  if (!sandbox.__GAME_CONFIG) throw new Error('Could not read GAME_CONFIG from src/config.js');
  return sandbox.__GAME_CONFIG;
}

function buildPatch(exportData) {
  const keys = [
    'settings',
    'audio',
    'playerScale',
    'enemyScale',
    'walkFrameMs',
    'enemyWalkFrameMs',
    'heroes',
    'enemies',
    'levelOrder',
    'levels'
  ];
  const patch = {};
  for (const key of keys) {
    if (exportData[key] !== undefined) patch[key] = exportData[key];
  }
  return patch;
}

function writeConfig(config) {
  const text = [
    'const GAME_CONFIG = ' + JSON.stringify(config, null, 2) + ';',
    '',
    'const DEFAULT_GAME_CONFIG = JSON.parse(JSON.stringify(GAME_CONFIG));',
    ''
  ].join('\n');
  fs.writeFileSync(configPath, text, 'utf8');
}

const exportData = readJson(exportPath);
const currentConfig = loadCurrentConfig();
const patch = buildPatch(exportData);
deepMerge(currentConfig, patch);
writeConfig(currentConfig);
console.log(`Applied dev export to ${path.relative(root, configPath)}`);
