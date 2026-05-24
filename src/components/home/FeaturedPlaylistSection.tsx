import { Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { CarouselProgress } from '@/components/home/CarouselProgress';
import { FeaturedPlaylistCard } from '@/components/home/FeaturedPlaylistCard';
import { FeaturedPlaylist } from '@/types/domain';

type FeaturedPlaylistSectionProps = {
  data?: FeaturedPlaylist[];
  isError?: boolean;
  isLoading?: boolean;
  onRetry?: () => void;
};

function FeaturedPlaylistSkeleton() {
  return (
    <View className="flex-row">
      {[0, 1].map((item) => (
        <View
          key={item}
          className="mr-4 h-[260px] w-[180px] rounded-[20px] border border-white/10 bg-white/10"
        />
      ))}
    </View>
  );
}

export function FeaturedPlaylistSection({
  data = [],
  isError = false,
  isLoading = false,
  onRetry,
}: FeaturedPlaylistSectionProps) {
  return (
    <View className="gap-4">
      <AppText className="text-[24px] font-semibold text-white">Music Playlist</AppText>

      {isLoading ? (
        <FeaturedPlaylistSkeleton />
      ) : isError ? (
        <Pressable className="rounded-[20px] bg-white/10 p-5" onPress={onRetry}>
          <AppText className="text-base font-semibold text-white">추천을 불러오지 못했어요</AppText>
          <AppText className="mt-2 text-sm text-white/60">눌러서 다시 시도해보세요.</AppText>
        </Pressable>
      ) : data.length === 0 ? (
        <View className="rounded-[20px] bg-white/10 p-5">
          <AppText className="text-base font-semibold text-white">추천을 준비 중이에요</AppText>
          <AppText className="mt-2 text-sm text-white/60">
            위치와 무드를 바탕으로 플레이리스트를 보여드릴게요.
          </AppText>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row pr-5">
            {data.map((playlist) => (
              <FeaturedPlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </View>
        </ScrollView>
      )}

      <CarouselProgress />
    </View>
  );
}
