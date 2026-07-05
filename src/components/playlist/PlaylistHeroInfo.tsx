import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PlaylistMusicFilter } from '@/components/playlist/PlaylistMusicFilter';
import { PlaylistCuration } from '@/types/domain';

type PlaylistHeroInfoProps = {
  disabled?: boolean;
  onOpenFirstTrack: () => void;
  playlist: PlaylistCuration;
};

export function PlaylistHeroInfo({
  disabled = false,
  onOpenFirstTrack,
  playlist,
}: PlaylistHeroInfoProps) {
  return (
    <View className="px-5 pb-5">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <AppText className="text-[40px] font-semibold leading-[46px] text-white" numberOfLines={1}>
            {playlist.regionName}
          </AppText>
          {playlist.placeName ? (
            <AppText className="mt-1 text-sm font-medium text-white/65" numberOfLines={1}>
              {playlist.placeName}
            </AppText>
          ) : null}
          <AppText className="mt-2 text-[17px] leading-6 text-white/85" numberOfLines={2}>
            {playlist.reason}
          </AppText>
          <View className="mt-4 flex-row gap-2">
            <View className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
              <AppText className="text-xs font-medium text-white/85">{playlist.trackCount}곡</AppText>
            </View>
            <View className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
              <AppText className="text-xs font-medium text-white/85">{playlist.durationText}</AppText>
            </View>
          </View>
        </View>

        <Pressable
          accessibilityLabel="플레이리스트 대표곡 SoundLog 음악으로 선택"
          accessibilityRole="button"
          className="h-[54px] w-[54px] items-center justify-center rounded-full bg-[#20146F]"
          disabled={disabled}
          onPress={onOpenFirstTrack}
          style={{ opacity: disabled ? 0.45 : 1 }}
        >
          <Feather color="#fff" name="music" size={23} />
        </Pressable>
      </View>

      <View className="mt-5">
        <PlaylistMusicFilter />
      </View>
    </View>
  );
}
