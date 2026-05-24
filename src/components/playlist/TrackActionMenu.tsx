import { Feather } from '@expo/vector-icons';
import { Linking, Modal, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Track } from '@/types/domain';

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
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
};

function MenuAction({ icon, label, onPress }: MenuActionProps) {
  return (
    <Pressable className="h-12 flex-row items-center gap-3" onPress={onPress}>
      <Feather color="#fff" name={icon} size={20} />
      <AppText className="text-base font-medium text-white">{label}</AppText>
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
  const openExternalUrl = () => {
    if (!track?.externalUrl) {
      return;
    }

    Linking.openURL(track.externalUrl);
    onClose();
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />
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
          {track?.externalUrl ? (
            <MenuAction icon="external-link" label="외부 음악 앱에서 열기" onPress={openExternalUrl} />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
