import { useRef, useState } from 'react';
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

type RecapShareActionErrorCode =
  | 'capture_failed'
  | 'media_permission_denied'
  | 'media_save_failed'
  | 'share_failed'
  | 'sharing_unavailable';

class RecapShareActionError extends Error {
  code: RecapShareActionErrorCode;

  constructor(code: RecapShareActionErrorCode) {
    super(code);
    this.code = code;
  }
}

function canWriteToLibrary(permission: MediaPermissionResponse) {
  return permission.granted || permission.accessPrivileges === 'limited';
}

function getActionErrorMessage(
  action: ShareActionId,
  error: unknown,
): RecapShareMessage {
  if (error instanceof RecapShareActionError) {
    switch (error.code) {
      case 'capture_failed':
        return {
          text: '리캡 이미지를 캡처하지 못했어요. 화면을 다시 연 뒤 시도해주세요.',
          type: 'error',
        };
      case 'media_permission_denied':
        return {
          text: '리캡 이미지를 저장하려면 사진 보관함 권한이 필요해요.',
          type: 'error',
        };
      case 'sharing_unavailable':
        return {
          text: '이 기기에서는 공유 기능을 사용할 수 없어요.',
          type: 'error',
        };
      case 'media_save_failed':
        return {
          text: '리캡 이미지를 사진 보관함에 저장하지 못했어요. 잠시 후 다시 시도해주세요.',
          type: 'error',
        };
      case 'share_failed':
        return {
          text: '공유 시트를 열지 못했어요. 잠시 후 다시 시도해주세요.',
          type: 'error',
        };
    }
  }

  return {
    text:
      action === 'save'
        ? '리캡 이미지를 저장하지 못했어요. 다시 시도해주세요.'
        : '리캡 이미지를 공유하지 못했어요. 다시 시도해주세요.',
    type: 'error',
  };
}

export function useRecapShareActions({ capture, recapId }: UseRecapShareActionsParams) {
  const [activeAction, setActiveAction] = useState<ShareActionId>();
  const [message, setMessage] = useState<RecapShareMessage>();
  const activeActionRef = useRef<ShareActionId | undefined>(undefined);

  const runAction = async (action: ShareActionId, task: () => Promise<void>) => {
    if (activeActionRef.current) {
      return;
    }

    activeActionRef.current = action;
    setActiveAction(action);
    setMessage(undefined);

    try {
      await task();
    } catch (error) {
      setMessage(getActionErrorMessage(action, error));
    } finally {
      activeActionRef.current = undefined;
      setActiveAction(undefined);
    }
  };

  const captureRecap = async () => {
    let uri: string | undefined;

    try {
      uri = await capture();
    } catch {
      throw new RecapShareActionError('capture_failed');
    }

    if (!uri) {
      throw new RecapShareActionError('capture_failed');
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

      let MediaLibrary: typeof import('expo-media-library');
      let permission: MediaPermissionResponse;

      try {
        MediaLibrary = await import('expo-media-library');
        permission = await MediaLibrary.requestPermissionsAsync(true);
      } catch {
        throw new RecapShareActionError('media_save_failed');
      }

      if (!canWriteToLibrary(permission)) {
        throw new RecapShareActionError('media_permission_denied');
      }

      const uri = await captureRecap();

      try {
        await MediaLibrary.saveToLibraryAsync(uri);
      } catch {
        throw new RecapShareActionError('media_save_failed');
      }

      syncShareEvent('save_image');
      setMessage({
        text: '리캡 이미지가 사진 보관함에 저장됐어요.',
        type: 'success',
      });
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

      let Sharing: typeof import('expo-sharing');
      let isAvailable = false;

      try {
        Sharing = await import('expo-sharing');
        isAvailable = await Sharing.isAvailableAsync();
      } catch {
        throw new RecapShareActionError('share_failed');
      }

      if (!isAvailable) {
        throw new RecapShareActionError('sharing_unavailable');
      }

      const uri = await captureRecap();

      try {
        await Sharing.shareAsync(uri, {
          UTI: 'public.png',
          dialogTitle: 'Soundlog Recap 공유',
          mimeType: 'image/png',
        });
      } catch {
        throw new RecapShareActionError('share_failed');
      }

      syncShareEvent('os_share');
      setMessage({
        text: '공유 시트를 열었어요. 공유를 취소해도 Recap은 그대로 남아 있어요.',
        type: 'success',
      });
    });

  return {
    activeAction,
    message,
    recapId,
    save,
    share,
  };
}
