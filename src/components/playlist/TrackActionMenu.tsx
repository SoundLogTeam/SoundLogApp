import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Modal, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Track } from '@/types/domain';

type TrackActionMenuProps = {
  actionMessage?: string;
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
  onPress: () => void;
};

function MenuAction({ disabled = false, icon, label, onPress }: MenuActionProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className="h-12 flex-row items-center gap-3"
      disabled={disabled}
      onPress={onPress}
    >
      <Feather color={disabled ? 'rgba(255,255,255,0.3)' : '#fff'} name={icon} size={20} />
      <AppText className={`text-base font-medium ${disabled ? 'text-white/30' : 'text-white'}`}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function TrackActionMenu({
  actionMessage,
  isLiked,
  isSaved,
  onClose,
  onToggleLike,
  onToggleSave,
  track,
  visible,
}: TrackActionMenuProps) {
  const handleClose = () => {
    onClose();
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
                className="h-[42px] w-[42px] overflow-hidden rounded-[10px]"
                style={{ backgroundColor: track.fallbackColor ?? '#fff' }}
              >
                {track.albumImageUrl ? (
                  <Image
                    className="h-full w-full"
                    contentFit="cover"
                    source={{ uri: track.albumImageUrl }}
                  />
                ) : null}
              </View>
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
            <AppText className="mt-3 text-xs leading-5 text-white/48">
              곡을 누르면 Soundlog에서 현재 음악으로 선택돼요.
            </AppText>
          ) : null}
          {actionMessage ? (
            <AppText className="mt-2 text-xs leading-5 text-amber-100">
              {actionMessage}
            </AppText>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
