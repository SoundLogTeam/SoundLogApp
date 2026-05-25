import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import { Linking, Platform } from 'react-native';

export type NativePermissionKind = 'camera' | 'location' | 'mediaLibrary';

export type NativePermissionStatus =
  | 'denied'
  | 'error'
  | 'granted'
  | 'limited'
  | 'unavailable'
  | 'undetermined';

export type NativePermissionItem = {
  canAskAgain: boolean;
  description: string;
  kind: NativePermissionKind;
  status: NativePermissionStatus;
  title: string;
};

type PermissionLike = {
  accessPrivileges?: 'all' | 'limited' | 'none';
  canAskAgain?: boolean;
  granted?: boolean;
  status?: string;
};

const permissionMeta: Record<
  NativePermissionKind,
  Pick<NativePermissionItem, 'description' | 'title'>
> = {
  camera: {
    description: '여행 순간 촬영',
    title: '카메라',
  },
  location: {
    description: '현재 장소에 맞는 음악 추천',
    title: '위치',
  },
  mediaLibrary: {
    description: '리캡 이미지 저장',
    title: '사진 보관함',
  },
};

export const nativePermissionKinds: NativePermissionKind[] = [
  'location',
  'camera',
  'mediaLibrary',
];

export function createNativePermissionItem(
  kind: NativePermissionKind,
  status: NativePermissionStatus,
  canAskAgain = false,
): NativePermissionItem {
  return {
    ...permissionMeta[kind],
    canAskAgain,
    kind,
    status,
  };
}

export function getDefaultNativePermissionItems() {
  return nativePermissionKinds.map((kind) =>
    createNativePermissionItem(
      kind,
      Platform.OS === 'web' ? 'unavailable' : 'undetermined',
      true,
    ),
  );
}

function normalizePermissionResponse(
  kind: NativePermissionKind,
  response: PermissionLike,
): NativePermissionItem {
  if (
    kind === 'mediaLibrary' &&
    Platform.OS === 'ios' &&
    response.accessPrivileges === 'limited'
  ) {
    return createNativePermissionItem(kind, 'limited', false);
  }

  if (response.granted || response.status === 'granted') {
    return createNativePermissionItem(kind, 'granted', response.canAskAgain ?? false);
  }

  if (response.status === 'denied') {
    return createNativePermissionItem(kind, 'denied', response.canAskAgain ?? false);
  }

  if (response.status === 'undetermined') {
    return createNativePermissionItem(kind, 'undetermined', response.canAskAgain ?? true);
  }

  return createNativePermissionItem(kind, 'unavailable', false);
}

async function getPermissionResponse(kind: NativePermissionKind): Promise<PermissionLike> {
  if (kind === 'camera') {
    return Camera.getCameraPermissionsAsync();
  }

  if (kind === 'location') {
    return Location.getForegroundPermissionsAsync();
  }

  return MediaLibrary.getPermissionsAsync(true);
}

async function requestPermissionResponse(kind: NativePermissionKind): Promise<PermissionLike> {
  if (kind === 'camera') {
    return Camera.requestCameraPermissionsAsync();
  }

  if (kind === 'location') {
    return Location.requestForegroundPermissionsAsync();
  }

  return MediaLibrary.requestPermissionsAsync(true);
}

export async function getNativePermission(
  kind: NativePermissionKind,
): Promise<NativePermissionItem> {
  if (Platform.OS === 'web') {
    return createNativePermissionItem(kind, 'unavailable', false);
  }

  try {
    const response = await getPermissionResponse(kind);

    return normalizePermissionResponse(kind, response);
  } catch {
    return createNativePermissionItem(kind, 'error', true);
  }
}

export async function requestNativePermission(
  kind: NativePermissionKind,
): Promise<NativePermissionItem> {
  if (Platform.OS === 'web') {
    return createNativePermissionItem(kind, 'unavailable', false);
  }

  try {
    const response = await requestPermissionResponse(kind);

    return normalizePermissionResponse(kind, response);
  } catch {
    return createNativePermissionItem(kind, 'error', true);
  }
}

export async function getAllNativePermissions() {
  return Promise.all(nativePermissionKinds.map((kind) => getNativePermission(kind)));
}

export async function openNativeSettings() {
  await Linking.openSettings();
}
