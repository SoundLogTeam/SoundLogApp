import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { useMusicPlatformStore } from '@/store/musicPlatformStore';
import { Track } from '@/types/domain';
import { getTrackExternalLink, openMusicPlatformUrl } from '@/utils/musicPlatformLinks';

type TrackActionMenuProps = {
  isLiked: boolean;
  isSaved: boolean;
  onClose: () => void;
  onToggleLike: () => void;
  onToggleSave: () => void;
  track?: Track;
  visible: boolean;
};

type MenuActionProps = {
  disabled?: boolean;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  isLoading?: boolean;
  onPress: () => void;
};

function MenuAction({ disabled = false, icon, isLoading = false, label, onPress }: MenuActionProps) {
  return (
    <Pressable
      className="h-12 flex-row items-center gap-3"
      disabled={disabled || isLoading}
      onPress={onPress}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Feather color={disabled ? 'rgba(255,255,255,0.3)' : '#fff'} name={icon} size={20} />
      )}
      <AppText className={`text-base font-medium ${disabled ? 'text-white/30' : 'text-white'}`}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function TrackActionMenu({
  isLiked,
  isSaved,
  onClose,
  onToggleLike,
  onToggleSave,
  track,
  visible,
}: TrackActionMenuProps) {
  const selectedPlatformId = useMusicPlatformStore((state) => state.selectedPlatformId);
  const [externalMessage, setExternalMessage] = useState<string>();
  const [isOpeningExternal, setIsOpeningExternal] = useState(false);
  const externalLink = useMemo(
    () => (track ? getTrackExternalLink(track, selectedPlatformId) : undefined),
    [selectedPlatformId, track],
  );
  const canOpenExternal = Boolean(externalLink?.url);

  const handleClose = () => {
    if (isOpeningExternal) {
      return;
    }

    setExternalMessage(undefined);
    onClose();
  };
  const openExternalUrl = async () => {
    if (!track || !externalLink) {
      return;
    }

    if (!externalLink.url) {
      setExternalMessage('이 곡을 열 수 있는 링크를 만들지 못했어요.');
      return;
    }

    if (isOpeningExternal) {
      return;
    }

    setIsOpeningExternal(true);
    setExternalMessage(undefined);

    try {
      await openMusicPlatformUrl(externalLink.url);
      onClose();
    } catch {
      setExternalMessage('음악 링크를 열지 못했어요. 다시 시도해주세요.');
    } finally {
      setIsOpeningExternal(false);
    }
  };

  return (
    <Modal animationType="fade" onRequestClose={handleClose} transparent visible={visible}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/60" onPress={handleClose} />
        <View className="rounded-t-[24px] border border-white/10 bg-[#121827] px-5 pb-10 pt-5">
          <View className="mx-auto mb-5 h-[5px] w-9 rounded-full bg-white/35" />
          {track ? (
            <View className="mb-4 flex-row items-center">
              <View
                className="h-[42px] w-[42px] rounded-[10px]"
                style={{ backgroundColor: track.fallbackColor ?? '#fff' }}
              />
              <View className="ml-3 flex-1">
                <AppText className="text-base font-semibold text-white" numberOfLines={1}>
                  {track.title}
                </AppText>
                <AppText className="mt-1 text-xs text-white/55" numberOfLines={1}>
                  {track.artist}
                </AppText>
              </View>
            </View>
          ) : null}

          <MenuAction
            icon="heart"
            label={isLiked ? '좋아요 취소' : '좋아요'}
            onPress={onToggleLike}
          />
          <MenuAction
            icon="bookmark"
            label={isSaved ? '저장 취소' : '저장하기'}
            onPress={onToggleSave}
          />
          {track ? (
            <MenuAction
              disabled={!canOpenExternal}
              icon="external-link"
              isLoading={isOpeningExternal}
              label={externalLink?.label ?? '외부 음악 앱에서 열기'}
              onPress={openExternalUrl}
            />
          ) : null}
          {externalMessage ? (
            <View className="mt-2 rounded-[14px] border border-amber-300/20 bg-amber-300/10 px-4 py-3">
              <AppText className="text-xs leading-5 text-amber-100">
                {externalMessage}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
