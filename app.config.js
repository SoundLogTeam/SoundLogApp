const baseConfig = {
  name: 'Soundlog',
  slug: 'soundlog',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'soundlog',
  userInterfaceStyle: 'dark',
  ios: {
    infoPlist: {
      CFBundleAllowMixedLocalizations: true,
      NSCameraUsageDescription:
        'Soundlog가 여행 순간을 사진으로 기록하기 위해 카메라 권한이 필요합니다.',
      NSFaceIDUsageDescription:
        'Soundlog가 저장된 로그인 정보를 안전하게 보호하기 위해 Face ID를 사용할 수 있습니다.',
      NSLocationWhenInUseUsageDescription:
        'Soundlog가 현재 장소에 맞는 음악을 추천하고 여행 순간의 위치를 기록하기 위해 위치 권한이 필요합니다.',
      NSPhotoLibraryAddUsageDescription:
        'Soundlog가 리캡 이미지를 사진 보관함에 저장하기 위해 권한이 필요합니다.',
      NSPhotoLibraryUsageDescription:
        'Soundlog가 리캡 이미지를 저장하기 위해 사진 접근 권한이 필요합니다.',
    },
    supportsTablet: true,
    bundleIdentifier: 'com.mannomi.soundlog',
  },
  android: {
    package: 'com.mannomi.soundlog',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/soundlog-logo.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    blockedPermissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_MEDIA_AUDIO',
      'android.permission.READ_MEDIA_VIDEO',
      'android.permission.SYSTEM_ALERT_WINDOW',
    ],
    permissions: [
      'android.permission.CAMERA',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
      'android.permission.READ_MEDIA_IMAGES',
    ],
  },
  web: {
    bundler: 'metro',
    favicon: './assets/soundlog-logo.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-camera',
      {
        cameraPermission:
          'Soundlog가 여행 순간을 사진으로 기록하기 위해 카메라 권한이 필요합니다.',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Soundlog가 현재 장소에 맞는 음악을 추천하고 여행 순간의 위치를 기록하기 위해 위치 권한이 필요합니다.',
      },
    ],
    'expo-sharing',
    [
      'expo-media-library',
      {
        photosPermission:
          'Soundlog가 리캡 이미지를 저장하기 위해 사진 접근 권한이 필요합니다.',
        savePhotosPermission:
          'Soundlog가 리캡 이미지를 사진 보관함에 저장하기 위해 권한이 필요합니다.',
      },
    ],
    'expo-secure-store',
    'expo-image',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    legal: {
      privacyPolicyUrl: process.env.EXPO_PUBLIC_SOUNDLOG_PRIVACY_URL,
      supportEmail: process.env.EXPO_PUBLIC_SOUNDLOG_SUPPORT_EMAIL ?? 'support@soundlog.shop',
      termsUrl: process.env.EXPO_PUBLIC_SOUNDLOG_TERMS_URL,
    },
    eas: {
      projectId: '4b07627b-36bf-463d-a15e-b4839022ecbb',
    },
  },
};

function getApiBaseUrl() {
  return process.env.EXPO_PUBLIC_SOUNDLOG_API_BASE_URL?.replace(/\/+$/, '');
}

function isProductionBuildProfile() {
  return process.env.EAS_BUILD_PROFILE === 'production';
}

function getHttpApiHost(apiBaseUrl) {
  if (!apiBaseUrl?.startsWith('http://')) {
    return undefined;
  }

  try {
    return new URL(apiBaseUrl).hostname;
  } catch {
    return undefined;
  }
}

function assertProductionConfig(apiBaseUrl) {
  if (!isProductionBuildProfile()) {
    return;
  }

  if (!apiBaseUrl?.startsWith('https://')) {
    throw new Error(
      'Production builds require EXPO_PUBLIC_SOUNDLOG_API_BASE_URL to be an HTTPS URL.',
    );
  }

}

function upsertBuildPropertiesPlugin(config, nextAndroidConfig) {
  const plugins = config.plugins ?? [];
  const buildPropertiesIndex = plugins.findIndex(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-build-properties',
  );

  if (buildPropertiesIndex === -1) {
    config.plugins = [
      ...plugins,
      [
        'expo-build-properties',
        {
          android: nextAndroidConfig,
        },
      ],
    ];
    return;
  }

  const [pluginName, pluginConfig = {}] = plugins[buildPropertiesIndex];

  config.plugins = plugins.map((plugin, index) =>
    index === buildPropertiesIndex
      ? [
          pluginName,
          {
            ...pluginConfig,
            android: {
              ...(pluginConfig.android ?? {}),
              ...nextAndroidConfig,
            },
          },
        ]
      : plugin,
  );
}

module.exports = () => {
  const nextConfig = JSON.parse(JSON.stringify(baseConfig));
  const apiBaseUrl = getApiBaseUrl();
  const httpApiHost = getHttpApiHost(apiBaseUrl);

  assertProductionConfig(apiBaseUrl);

  if (!httpApiHost || isProductionBuildProfile()) {
    return nextConfig;
  }

  nextConfig.ios = {
    ...nextConfig.ios,
    infoPlist: {
      ...nextConfig.ios?.infoPlist,
      NSAppTransportSecurity: {
        ...nextConfig.ios?.infoPlist?.NSAppTransportSecurity,
        NSExceptionDomains: {
          ...nextConfig.ios?.infoPlist?.NSAppTransportSecurity?.NSExceptionDomains,
          [httpApiHost]: {
            NSExceptionAllowsInsecureHTTPLoads: true,
            NSExceptionMinimumTLSVersion: 'TLSv1.2',
            NSIncludesSubdomains: false,
          },
        },
      },
    },
  };

  upsertBuildPropertiesPlugin(nextConfig, {
    usesCleartextTraffic: true,
  });

  return nextConfig;
};
