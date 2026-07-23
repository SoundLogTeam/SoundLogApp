import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Chip } from '@/components/Chip';
import { FeaturedPlaylist } from '@/types/domain';

type FeaturedPlaylistCardProps = {
  onPress: (playlist: FeaturedPlaylist) => void;
  playlist: FeaturedPlaylist;
};

export function FeaturedPlaylistCard({ onPress, playlist }: FeaturedPlaylistCardProps) {
  return (
    <Pressable
      accessibilityLabel={`${playlist.regionName} 플레이리스트 열기`}
      accessibilityRole="button"
      className="mr-4 h-[260px] w-[180px] justify-end overflow-hidden rounded-[8px] border border-white/10 bg-soundlog-card p-4"
      onPress={() => onPress(playlist)}
    >
      <View className="absolute inset-0 bg-black/10" />
      <View className="absolute left-3 top-4 flex-row gap-2">
        <Chip label={`${playlist.trackCount}곡`} size="small" />
        <Chip label={playlist.durationText} size="small" />
      </View>
      <AppText className="text-[22px] font-semibold leading-7 text-white">
        {playlist.regionName}
      </AppText>
      <AppText className="mt-2 text-[13px] leading-5 text-white">{playlist.description}</AppText>
    </Pressable>
  );
}
