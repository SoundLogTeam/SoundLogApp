#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const errors = [];
const warnings = [];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function addError(message) {
  errors.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

function getProductionEnv() {
  const eas = readJson(path.join(projectRoot, 'eas.json'));
  return {
    ...(eas.build?.production?.env ?? {}),
    ...process.env,
  };
}

function withEnv(env, task) {
  const previous = {};

  Object.entries(env).forEach(([key, value]) => {
    previous[key] = process.env[key];
    process.env[key] = value;
  });

  try {
    return task();
  } finally {
    Object.keys(env).forEach((key) => {
      if (previous[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previous[key];
      }
    });
  }
}

function loadProductionConfig(productionEnv) {
  const appConfigPath = path.join(projectRoot, 'app.config.js');
  delete require.cache[require.resolve(appConfigPath)];

  const apiBaseUrl =
    productionEnv.EXPO_PUBLIC_SOUNDLOG_API_BASE_URL || 'https://release-check.invalid';

  return withEnv(
    {
      ...productionEnv,
      EAS_BUILD_PROFILE: 'production',
      EXPO_PUBLIC_SOUNDLOG_API_BASE_URL: apiBaseUrl,
    },
    () => require(appConfigPath)(),
  );
}

function hasPngAlpha(filePath) {
  const buffer = fs.readFileSync(filePath);
  const pngSignature = '89504e470d0a1a0a';

  if (buffer.subarray(0, 8).toString('hex') !== pngSignature) {
    throw new Error(`${filePath} is not a PNG file.`);
  }

  const colorType = buffer[25];
  const hasTransparencyChunk = buffer.includes(Buffer.from('tRNS'));

  return colorType === 4 || colorType === 6 || hasTransparencyChunk;
}

function assertProductionEnv(productionEnv) {
  const apiBaseUrl = productionEnv.EXPO_PUBLIC_SOUNDLOG_API_BASE_URL;
  const privacyUrl = productionEnv.EXPO_PUBLIC_SOUNDLOG_PRIVACY_URL;
  const termsUrl = productionEnv.EXPO_PUBLIC_SOUNDLOG_TERMS_URL;
  const supportEmail = productionEnv.EXPO_PUBLIC_SOUNDLOG_SUPPORT_EMAIL;

  if (!apiBaseUrl?.startsWith('https://')) {
    addError('EAS production env must set EXPO_PUBLIC_SOUNDLOG_API_BASE_URL to an HTTPS URL.');
  }

  if (!privacyUrl?.startsWith('https://')) {
    addError('EAS production env must set EXPO_PUBLIC_SOUNDLOG_PRIVACY_URL to an HTTPS URL.');
  }

  if (!termsUrl?.startsWith('https://')) {
    addError('EAS production env must set EXPO_PUBLIC_SOUNDLOG_TERMS_URL to an HTTPS URL.');
  }

  if (!supportEmail || supportEmail.endsWith('@example.com')) {
    addError('EAS production env must set EXPO_PUBLIC_SOUNDLOG_SUPPORT_EMAIL to a real mailbox.');
  }
}

function hasPlugin(config, pluginName) {
  return (config.plugins ?? []).some((plugin) =>
    Array.isArray(plugin) ? plugin[0] === pluginName : plugin === pluginName,
  );
}

function assertAppIcon(config) {
  const iconPath = path.resolve(projectRoot, config.icon ?? '');

  if (!config.icon || !fs.existsSync(iconPath)) {
    addError(`App icon does not exist: ${config.icon ?? '(missing)'}`);
    return;
  }

  if (hasPngAlpha(iconPath)) {
    addError(`App icon must not have alpha transparency: ${config.icon}`);
  }
}

function assertAndroidPermissions(config) {
  const permissions = new Set(config.android?.permissions ?? []);
  const blockedPermissions = new Set(config.android?.blockedPermissions ?? []);
  const blockedRequired = [
    'android.permission.RECORD_AUDIO',
    'android.permission.READ_MEDIA_AUDIO',
    'android.permission.READ_MEDIA_VIDEO',
    'android.permission.SYSTEM_ALERT_WINDOW',
  ];

  blockedRequired.forEach((permission) => {
    if (!blockedPermissions.has(permission)) {
      addError(`Android release config should block unused sensitive permission: ${permission}`);
    }

    if (permissions.has(permission)) {
      addError(`Android release config should not request unused sensitive permission: ${permission}`);
    }
  });
}

function assertTransportSecurity(config) {
  const ats = config.ios?.infoPlist?.NSAppTransportSecurity;

  if (ats?.NSAllowsArbitraryLoads) {
    addError('iOS release config must not enable NSAllowsArbitraryLoads.');
  }

  const plugins = config.plugins ?? [];
  const cleartextPlugin = plugins.find((plugin) => {
    return (
      Array.isArray(plugin) &&
      plugin[0] === 'expo-build-properties' &&
      plugin[1]?.android?.usesCleartextTraffic === true
    );
  });

  if (cleartextPlugin) {
    addError('Android release config must not enable usesCleartextTraffic.');
  }
}

function assertNativeIosPlist() {
  const plistPath = path.join(projectRoot, 'ios/Soundlog/Info.plist');
  const entitlementsPath = path.join(projectRoot, 'ios/Soundlog/Soundlog.entitlements');

  if (!fs.existsSync(plistPath)) {
    return;
  }

  const plist = fs.readFileSync(plistPath, 'utf8');
  const forbiddenKeys = [
    'NSAllowsArbitraryLoads',
    'NSLocationAlwaysUsageDescription',
    'NSLocationAlwaysAndWhenInUseUsageDescription',
    'NSMicrophoneUsageDescription',
    'NSMotionUsageDescription',
  ];

  forbiddenKeys.forEach((key) => {
    if (plist.includes(`<key>${key}</key>`)) {
      addError(`iOS native Info.plist still contains unused/release-risk key: ${key}`);
    }
  });

  if (plist.includes('Expo Dev Launcher')) {
    const projectPath = path.join(
      projectRoot,
      'ios/Soundlog.xcodeproj/project.pbxproj',
    );
    const project = fs.existsSync(projectPath)
      ? fs.readFileSync(projectPath, 'utf8')
      : '';
    const hasReleaseStripPhase = [
      '[Expo Dev Launcher] Strip Local Network Keys for Release',
      'if [ \\\"$CONFIGURATION\\\" != \\\"Debug\\\" ]',
      'Delete :NSLocalNetworkUsageDescription',
      'Delete :NSBonjourServices',
    ].every((expectedText) => project.includes(expectedText));

    if (!hasReleaseStripPhase) {
      addError(
        'iOS Info.plist contains Expo Dev Launcher local-network keys without a verified non-Debug strip phase.',
      );
    }
  }

  if (fs.existsSync(entitlementsPath)) {
    const entitlements = fs.readFileSync(entitlementsPath, 'utf8');

    if (entitlements.includes('com.apple.developer.applesignin')) {
      addError('iOS native entitlements must not include Apple Sign In for first-party login.');
    }
  }
}

function main() {
  const productionEnv = getProductionEnv();
  assertProductionEnv(productionEnv);

  let config;

  try {
    config = loadProductionConfig(productionEnv);
  } catch (error) {
    addError(`Unable to load production Expo config: ${error.message}`);
  }

  if (config) {
    assertAppIcon(config);
    assertAndroidPermissions(config);
    assertTransportSecurity(config);
  }

  assertNativeIosPlist();

  if (warnings.length > 0) {
    console.log('Store release warnings:');
    warnings.forEach((warning) => console.log(`- ${warning}`));
  }

  if (errors.length > 0) {
    console.error('Store release check failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log('Store release check passed.');
}

main();
