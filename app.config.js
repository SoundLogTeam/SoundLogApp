const baseConfig = {
  name: 'Soundlog',
  slug: 'soundlog',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/soundlog-logo.png',
  scheme: 'soundlog',
  userInterfaceStyle: 'dark',
  ios: {
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
    permissions: [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VIDEO',
      'android.permission.READ_MEDIA_AUDIO',
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
    eas: {
      projectId: '4b07627b-36bf-463d-a15e-b4839022ecbb',
    },
  },
};

function getHttpApiHost() {
  const apiBaseUrl = process.env.EXPO_PUBLIC_SOUNDLOG_API_BASE_URL;

  if (!apiBaseUrl?.startsWith('http://')) {
    return undefined;
  }

  try {
    return new URL(apiBaseUrl).hostname;
  } catch {
    return undefined;
  }
}

module.exports = () => {
  const nextConfig = JSON.parse(JSON.stringify(baseConfig));
  const httpApiHost = getHttpApiHost();

  if (!httpApiHost) {
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

  nextConfig.plugins = [
    ...(nextConfig.plugins ?? []),
    [
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: true,
        },
      },
    ],
  ];

  return nextConfig;
};
