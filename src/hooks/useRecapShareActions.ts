import { useState } from 'react';
import { Platform } from 'react-native';

import { recapApi } from '@/api/recapApi';
import { ShareActionId } from '@/components/recap-share/ShareActionButton';

export type RecapShareMessage = {
  text: string;
  type: 'error' | 'info' | 'success';
};

type UseRecapShareActionsParams = {
  capture: () => Promise<string | undefined>;
  recapId?: string;
};

type MediaPermissionResponse = {
  granted?: boolean;
  accessPrivileges?: 'all' | 'limited' | 'none';
};

function canWriteToLibrary(permission: MediaPermissionResponse) {
  return permission.granted || permission.accessPrivileges === 'limited';
}

export function useRecapShareActions({ capture, recapId }: UseRecapShareActionsParams) {
  const [activeAction, setActiveAction] = useState<ShareActionId>();
  const [message, setMessage] = useState<RecapShareMessage>();

  const runAction = async (action: ShareActionId, task: () => Promise<void>) => {
    if (activeAction) {
      return;
    }

    setActiveAction(action);
    setMessage(undefined);

    try {
      await task();
    } finally {
      setActiveAction(undefined);
    }
  };

  const captureRecap = async () => {
    const uri = await capture();

    if (!uri) {
      throw new Error('capture_failed');
    }

    return uri;
  };

  const syncShareEvent = (type: 'os_share' | 'save_image') => {
    if (!recapId) {
      return;
    }

    void recapApi.createShareEvent(recapId, type).catch(() => undefined);
  };

  const save = () =>
    runAction('save', async () => {
      if (Platform.OS === 'web') {
        setMessage({
          text: '웹에서는 저장 기능을 확인할 수 없어요. 모바일 앱에서 다시 시도해주세요.',
          type: 'info',
        });
        return;
      }

      try {
        const uri = await captureRecap();
        const MediaLibrary = await import('expo-media-library');
        const permission = await MediaLibrary.requestPermissionsAsync(true);

        if (!canWriteToLibrary(permission)) {
          setMessage({
            text: '리캡 이미지를 저장하려면 사진 보관함 권한이 필요해요.',
            type: 'error',
          });
          return;
        }

        await MediaLibrary.createAssetAsync(uri);
        syncShareEvent('save_image');
        setMessage({
          text: '리캡 이미지가 사진 보관함에 저장됐어요.',
          type: 'success',
        });
      } catch {
        setMessage({
          text: '리캡 이미지를 저장하지 못했어요. 다시 시도해주세요.',
          type: 'error',
        });
      }
    });

  const share = () =>
    runAction('share', async () => {
      if (Platform.OS === 'web') {
        setMessage({
          text: '웹에서는 공유 기능을 확인할 수 없어요. 모바일 앱에서 다시 시도해주세요.',
          type: 'info',
        });
        return;
      }

      try {
        const Sharing = await import('expo-sharing');
        const isAvailable = await Sharing.isAvailableAsync();

        if (!isAvailable) {
          setMessage({
            text: '이 기기에서는 공유 기능을 사용할 수 없어요.',
            type: 'error',
          });
          return;
        }

        const uri = await captureRecap();
        await Sharing.shareAsync(uri, {
          UTI: 'public.png',
          dialogTitle: 'Soundlog Recap 공유',
          mimeType: 'image/png',
        });
        syncShareEvent('os_share');
      } catch {
        setMessage({
          text: '리캡 이미지를 공유하지 못했어요. 다시 시도해주세요.',
          type: 'error',
        });
      }
    });

  return {
    activeAction,
    message,
    recapId,
    save,
    share,
  };
}
