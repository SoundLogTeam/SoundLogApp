import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

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
      {playlist.coverImageUrl ? (
        <Image
          accessibilityIgnoresInvertColors
          contentFit="cover"
          source={{ uri: playlist.coverImageUrl }}
          style={StyleSheet.absoluteFill}
          transition={250}
        />
      ) : (
        <LinearGradient
          className="absolute inset-0 items-center justify-center"
          colors={['#31426E', '#12182B']}
        >
          <View className="h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/10">
            <Feather color="rgba(255,255,255,0.8)" name="disc" size={42} />
            <View className="absolute h-7 w-7 items-center justify-center rounded-full bg-[#12182B]">
              <Feather color="#B7E628" name="map-pin" size={14} />
            </View>
          </View>
        </LinearGradient>
      )}
      <LinearGradient
        colors={['rgba(5,9,22,0.04)', 'rgba(5,9,22,0.88)']}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0.2 }}
        style={StyleSheet.absoluteFill}
      />
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
