const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const coreSources = [
  'src/assets.js',
  'src/introContent.js',
  'src/heroVoiceLines.js'
];
const levelConfigPath = path.join(root, 'src', 'config.js');
const assetPattern = /assets\/[A-Za-z0-9_ ./()'-]+\.(?:png|jpe?g|webp|mp3|wav)/g;

function collectAssets(relativePath) {
  const text = fs.readFileSync(path.join(root, relativePath), 'utf8');
  return [...new Set(text.match(assetPattern) || [])];
}

function missing(paths) {
  return paths.filter((assetPath) => !fs.existsSync(path.join(root, assetPath)));
}

const coreAssets = coreSources.flatMap(collectAssets);
const missingCore = missing(coreAssets);
const levelAssets = collectAssets(path.relative(root, levelConfigPath));
const missingLevels = missing(levelAssets);

if (missingLevels.length) {
  console.warn('Level assets still needed:');
  missingLevels.forEach((assetPath) => console.warn(`  - ${assetPath}`));
}

if (missingCore.length) {
  console.error('Missing active assets:');
  missingCore.forEach((assetPath) => console.error(`  - ${assetPath}`));
  process.exitCode = 1;
} else {
  console.log(`Active asset check passed (${coreAssets.length} references).`);
}
