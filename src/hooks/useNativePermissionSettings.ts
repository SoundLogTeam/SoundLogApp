import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import {
  getAllNativePermissions,
  getDefaultNativePermissionItems,
  openNativeSettings,
  requestNativePermission,
} from '@/utils/nativePermissions';
import type { NativePermissionItem, NativePermissionKind } from '@/utils/nativePermissions';

const APP_STATE_REFRESH_DELAY_MS = 300;

function replacePermissionItem(
  items: NativePermissionItem[],
  nextItem: NativePermissionItem,
) {
  return items.map((item) => (item.kind === nextItem.kind ? nextItem : item));
}

export function useNativePermissionSettings() {
  const [items, setItems] = useState<NativePermissionItem[]>(() =>
    getDefaultNativePermissionItems(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestingKind, setIsRequestingKind] = useState<NativePermissionKind | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>();
  const refreshInFlightRef = useRef(false);
  const appStateRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshPermissions = useCallback(async () => {
    if (refreshInFlightRef.current) {
      return;
    }

    refreshInFlightRef.current = true;
    setIsLoading(true);

    try {
      const nextItems = await getAllNativePermissions();
      setItems(nextItems);
      setErrorMessage(undefined);
    } catch {
      setErrorMessage('권한 상태를 확인하지 못했어요. 다시 시도해주세요.');
    } finally {
      refreshInFlightRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const requestPermission = useCallback(async (kind: NativePermissionKind) => {
    if (isRequestingKind) {
      return;
    }

    setIsRequestingKind(kind);
    setErrorMessage(undefined);

    try {
      const nextItem = await requestNativePermission(kind);
      setItems((currentItems) => replacePermissionItem(currentItems, nextItem));

      if (nextItem.status === 'error') {
        setErrorMessage('권한 요청을 완료하지 못했어요. 다시 시도해주세요.');
      }
    } catch {
      setErrorMessage('권한 요청을 완료하지 못했어요. 다시 시도해주세요.');
    } finally {
      setIsRequestingKind(null);
    }
  }, [isRequestingKind]);

  const openSettings = useCallback(async () => {
    try {
      await openNativeSettings();
      setErrorMessage(undefined);
    } catch {
      setErrorMessage('설정 앱을 열지 못했어요. 기기 설정에서 직접 변경해주세요.');
    }
  }, []);

  useEffect(() => {
    void refreshPermissions();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        return;
      }

      if (appStateRefreshTimerRef.current) {
        clearTimeout(appStateRefreshTimerRef.current);
      }

      appStateRefreshTimerRef.current = setTimeout(() => {
        void refreshPermissions();
      }, APP_STATE_REFRESH_DELAY_MS);
    });

    return () => {
      subscription.remove();

      if (appStateRefreshTimerRef.current) {
        clearTimeout(appStateRefreshTimerRef.current);
      }
    };
  }, [refreshPermissions]);

  return {
    errorMessage,
    isLoading,
    isRequestingKind,
    items,
    openSettings,
    refreshPermissions,
    requestPermission,
  };
}
