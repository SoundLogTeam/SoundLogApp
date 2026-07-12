import { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import { AppText } from '@/components/AppText';
import { CarouselProgress } from '@/components/home/CarouselProgress';
import { FeaturedPlaylistCard } from '@/components/home/FeaturedPlaylistCard';
import { FeaturedPlaylist } from '@/types/domain';

type FeaturedPlaylistSectionProps = {
  cachedAt?: string;
  data?: FeaturedPlaylist[];
  isCached?: boolean;
  isError?: boolean;
  isLoading?: boolean;
  onSelectPlaylist: (playlist: FeaturedPlaylist) => void;
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
  cachedAt,
  data = [],
  isCached = false,
  isError = false,
  isLoading = false,
  onSelectPlaylist,
  onRetry,
}: FeaturedPlaylistSectionProps) {
  const scrollRef = useRef<ScrollView | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollViewportWidth, setScrollViewportWidth] = useState(0);
  const [scrollContentWidth, setScrollContentWidth] = useState(0);
  const cacheLabel = cachedAt
    ? `최근 추천 · ${new Date(cachedAt).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : '최근 추천';
  const contentVisibleRatio =
    scrollContentWidth > 0 && scrollViewportWidth > 0
      ? Math.min(scrollViewportWidth / scrollContentWidth, 1)
      : 1;

  useEffect(() => {
    setScrollProgress(0);
    scrollRef.current?.scrollTo({ animated: false, x: 0, y: 0 });
  }, [data.length]);

  const handlePlaylistScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const {
      contentOffset,
      contentSize,
      layoutMeasurement,
    } = event.nativeEvent;
    const maxScrollableX = Math.max(contentSize.width - layoutMeasurement.width, 0);

    setScrollViewportWidth(layoutMeasurement.width);
    setScrollContentWidth(contentSize.width);
    setScrollProgress(maxScrollableX > 0 ? contentOffset.x / maxScrollableX : 0);
  };

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between gap-3">
        <AppText className="text-[24px] font-semibold text-white">Music Playlist</AppText>
        {isCached ? (
          <View className="rounded-full bg-amber-300/15 px-3 py-1.5">
            <AppText className="text-[10px] font-semibold text-amber-100">
              {cacheLabel}
            </AppText>
          </View>
        ) : null}
      </View>

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
        <ScrollView
          horizontal
          onContentSizeChange={(width) => setScrollContentWidth(width)}
          onLayout={(event) => setScrollViewportWidth(event.nativeEvent.layout.width)}
          onScroll={handlePlaylistScroll}
          ref={scrollRef}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
        >
          <View className="flex-row pr-5">
            {data.map((playlist) => (
              <FeaturedPlaylistCard
                key={playlist.id}
                onPress={onSelectPlaylist}
                playlist={playlist}
              />
            ))}
          </View>
        </ScrollView>
      )}

      {data.length > 0 ? (
        <CarouselProgress contentVisibleRatio={contentVisibleRatio} progress={scrollProgress} />
      ) : null}
    </View>
  );
}
