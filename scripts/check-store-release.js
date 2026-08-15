#!/usr/bin/env node

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const errors = [];
const warnings = [];
const forbiddenIconHashes = new Set([
  // Expo SDK starter icon. Shipping this hash caused App Store metadata rejection.
  '119462bb78eb240a65c869fc067ee599639b3cb5a41953f25c07b17d2a8c7e0f',
]);

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

function getPngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  return { height: buffer.readUInt32BE(20), width: buffer.readUInt32BE(16) };
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function assertProductionEnv(productionEnv) {
  const apiBaseUrl = productionEnv.EXPO_PUBLIC_SOUNDLOG_API_BASE_URL;
  const privacyUrl = productionEnv.EXPO_PUBLIC_SOUNDLOG_PRIVACY_URL;
  const termsUrl = productionEnv.EXPO_PUBLIC_SOUNDLOG_TERMS_URL;
  const supportEmail = productionEnv.EXPO_PUBLIC_SOUNDLOG_SUPPORT_EMAIL;
  const uploadOrigin = productionEnv.EXPO_PUBLIC_SOUNDLOG_UPLOAD_ORIGIN;

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

  if (apiBaseUrl !== 'https://api.soundlog.shop') {
    addError('EAS production API must call the GCP api.soundlog.shop origin directly.');
  }

  if (uploadOrigin !== 'https://api.soundlog.shop') {
    addError('EAS production uploads must use the GCP api.soundlog.shop origin directly.');
  }

  if (privacyUrl !== 'https://api.soundlog.shop/legal/privacy') {
    addError('EAS production privacy URL must be hosted by the GCP API server.');
  }

  if (termsUrl !== 'https://api.soundlog.shop/legal/terms') {
    addError('EAS production terms URL must be hosted by the GCP API server.');
  }
}

function hasPlugin(config, pluginName) {
  return (config.plugins ?? []).some((plugin) =>
    Array.isArray(plugin) ? plugin[0] === pluginName : plugin === pluginName,
  );
}

function getPluginConfig(config, pluginName) {
  const plugin = (config.plugins ?? []).find(
    (candidate) => Array.isArray(candidate) && candidate[0] === pluginName,
  );

  return plugin?.[1];
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

  const iconDimensions = getPngDimensions(iconPath);
  if (iconDimensions.width !== 1024 || iconDimensions.height !== 1024) {
    addError(`App icon must be exactly 1024x1024: ${config.icon}`);
  }

  const iconHash = sha256(iconPath);
  if (forbiddenIconHashes.has(iconHash)) {
    addError('App icon is still the Expo starter icon. Replace it with the Soundlog brand icon.');
  }

  const nativeIconPath = path.join(
    projectRoot,
    'ios/Soundlog/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png',
  );
  if (fs.existsSync(nativeIconPath) && sha256(nativeIconPath) !== iconHash) {
    addError('The generated iOS AppIcon does not match the Expo config icon. Run Expo prebuild.');
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

  [
    'android.permission.ACCESS_BACKGROUND_LOCATION',
    'android.permission.FOREGROUND_SERVICE',
    'android.permission.FOREGROUND_SERVICE_LOCATION',
    'android.permission.ACTIVITY_RECOGNITION',
    'com.google.android.gms.permission.ACTIVITY_RECOGNITION',
  ].forEach((permission) => {
    if (permissions.has(permission)) {
      addError(`Android release config must not request unused background or motion permission: ${permission}`);
    }
  });
}

function assertRuntimePermissionPlugins(config) {
  const camera = getPluginConfig(config, 'expo-camera');
  const location = getPluginConfig(config, 'expo-location');

  if (!camera) {
    addError('Store release config must include the expo-camera plugin.');
  } else {
    if (camera.microphonePermission !== false) {
      addError('expo-camera must remove the unused iOS microphone permission.');
    }

    if (camera.recordAudioAndroid !== false) {
      addError('expo-camera must not add the unused Android RECORD_AUDIO permission.');
    }
  }

  if (!location) {
    addError('Store release config must include the expo-location plugin.');
    return;
  }

  if (!location.locationWhenInUsePermission) {
    addError('expo-location must retain an iOS When In Use location permission message.');
  }

  if (!config.ios?.infoPlist?.NSMotionUsageDescription?.trim()) {
    addError(
      'Expo config must include NSMotionUsageDescription because ExpoLocation links CoreMotion APIs.',
    );
  }

  if (location.motionUsagePermission !== config.ios?.infoPlist?.NSMotionUsageDescription) {
    addError(
      'expo-location motionUsagePermission must match the iOS NSMotionUsageDescription.',
    );
  }

  [
    'locationAlwaysAndWhenInUsePermission',
    'locationAlwaysPermission',
    'isIosBackgroundLocationEnabled',
    'isAndroidBackgroundLocationEnabled',
    'isAndroidForegroundServiceEnabled',
    'isAndroidMotionActivityEnabled',
  ].forEach((key) => {
    if (location[key] !== false) {
      addError(`expo-location must explicitly disable unused permission setting: ${key}`);
    }
  });
}

function assertPrivacyManifest(config) {
  const manifest = config.ios?.privacyManifests;
  const collectedDataTypes = manifest?.NSPrivacyCollectedDataTypes ?? [];
  const requiredDeclarations = [
    ['NSPrivacyCollectedDataTypeName', 'NSPrivacyCollectedDataTypePurposeAppFunctionality'],
    ['NSPrivacyCollectedDataTypeUserID', 'NSPrivacyCollectedDataTypePurposeAppFunctionality'],
    ['NSPrivacyCollectedDataTypeProductInteraction', 'NSPrivacyCollectedDataTypePurposeAnalytics'],
  ];

  if (manifest?.NSPrivacyTracking !== false) {
    addError('iOS privacy manifest must declare NSPrivacyTracking as false.');
  }

  requiredDeclarations.forEach(([dataType, purpose]) => {
    const declaration = collectedDataTypes.find(
      (entry) => entry.NSPrivacyCollectedDataType === dataType,
    );

    if (!declaration) {
      addError(`iOS privacy manifest is missing ${dataType}.`);
      return;
    }

    if (declaration.NSPrivacyCollectedDataTypeLinked !== true) {
      addError(`${dataType} must be declared as linked to the user.`);
    }

    if (declaration.NSPrivacyCollectedDataTypeTracking !== false) {
      addError(`${dataType} must be declared as not used for tracking.`);
    }

    if (!declaration.NSPrivacyCollectedDataTypePurposes?.includes(purpose)) {
      addError(`${dataType} must declare ${purpose}.`);
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

function assertIosDeviceSupport(config) {
  if (config.ios?.supportsTablet !== false) {
    addError('iOS v1.0 release config must remain iPhone-only until iPad assets and QA are complete.');
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
  ];

  forbiddenKeys.forEach((key) => {
    if (plist.includes(`<key>${key}</key>`)) {
      addError(`iOS native Info.plist still contains unused/release-risk key: ${key}`);
    }
  });

  if (!/<key>NSMotionUsageDescription<\/key>\s*<string>[^<]+<\/string>/.test(plist)) {
    addError(
      'iOS native Info.plist must include a non-empty NSMotionUsageDescription because ExpoLocation links CoreMotion APIs.',
    );
  }

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
    assertRuntimePermissionPlugins(config);
    assertPrivacyManifest(config);
    assertTransportSecurity(config);
    assertIosDeviceSupport(config);
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
