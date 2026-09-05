const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const forbiddenTokens = ['#4A1D96', '#7A2CFF', '#8B72FF', 'soundlog-purple'];

function walkSource(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return walkSource(filePath);
    }

    return /\.(?:js|ts|tsx)$/.test(entry.name) ? [filePath] : [];
  });
}

function assertBrandPalette() {
  const files = [
    ...walkSource(path.join(root, 'app')),
    ...walkSource(path.join(root, 'src')),
    path.join(root, 'tailwind.config.js'),
  ];
  const violations = files.flatMap((filePath) => {
    const contents = fs.readFileSync(filePath, 'utf8');
    return forbiddenTokens
      .filter((token) => contents.includes(token))
      .map((token) => `${path.relative(root, filePath)}: ${token}`);
  });

  if (violations.length > 0) {
    throw new Error(
      `보라색 브랜드 토큰이 남아 있습니다.\n${violations.join('\n')}`,
    );
  }
}

function readPngInfo(relativePath) {
  const buffer = fs.readFileSync(path.join(root, relativePath));
  const signature = buffer.subarray(0, 8).toString('hex');

  if (signature !== '89504e470d0a1a0a') {
    throw new Error(`${relativePath} 파일이 PNG가 아닙니다.`);
  }

  return {
    colorType: buffer.readUInt8(25),
    height: buffer.readUInt32BE(20),
    width: buffer.readUInt32BE(16),
  };
}

function assertPng(relativePath, expected) {
  const actual = readPngInfo(relativePath);

  if (
    actual.width !== expected.width ||
    actual.height !== expected.height ||
    (expected.colorType !== undefined &&
      actual.colorType !== expected.colorType)
  ) {
    throw new Error(
      `${relativePath} 규격이 올바르지 않습니다. expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`,
    );
  }
}

function assertAppAssets() {
  assertPng('assets/icon.png', { colorType: 2, height: 1024, width: 1024 });
  assertPng('assets/android-icon-foreground.png', { height: 512, width: 512 });
  assertPng('assets/android-icon-background.png', {
    colorType: 2,
    height: 512,
    width: 512,
  });
  assertPng('assets/android-icon-monochrome.png', { height: 432, width: 432 });
  assertPng('assets/favicon.png', { height: 48, width: 48 });
  assertPng('assets/splash-icon.png', { height: 1024, width: 1024 });

  const config = require(path.join(root, 'app.config.js'))();
  const splashPlugin = config.plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen',
  );

  if (!splashPlugin || splashPlugin[1]?.image !== './assets/splash-icon.png') {
    throw new Error('Expo 스플래시 플러그인이 새 에셋을 사용하지 않습니다.');
  }

  if (
    config.android?.adaptiveIcon?.foregroundImage !==
    './assets/android-icon-foreground.png'
  ) {
    throw new Error(
      'Android 적응형 아이콘이 새 전경 에셋을 사용하지 않습니다.',
    );
  }

  if (config.web?.favicon !== './assets/favicon.png') {
    throw new Error('웹 파비콘이 새 브랜드 에셋을 사용하지 않습니다.');
  }
}

assertBrandPalette();
assertAppAssets();
console.log('Soundlog 브랜드 팔레트와 앱 아이콘 및 스플래시 규격 확인 완료');
