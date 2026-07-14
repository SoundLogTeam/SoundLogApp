import { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from 'react-native';

import { AppText } from '@/components/AppText';
import { CarouselProgress } from '@/components/home/CarouselProgress';
import { FeaturedPlaylistCard } from '@/components/home/FeaturedPlaylistCard';
import { SectionTitle } from '@/components/SectionTitle';
import { SettingsRow } from '@/components/SettingsRow';
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
          className="mr-4 h-[260px] w-[180px] rounded-[8px] border border-white/10 bg-white/10"
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
      <SectionTitle
        rightContent={
          isCached ? (
            <AppText className="text-xs font-semibold text-white/42">
              {cacheLabel}
            </AppText>
          ) : undefined
        }
        title="장소별 플레이리스트"
      />

      {isLoading ? (
        <FeaturedPlaylistSkeleton />
      ) : isError ? (
        <SettingsRow
          description="눌러서 다시 시도해보세요."
          icon="alert-circle"
          label="추천을 불러오지 못했어요"
          onPress={onRetry}
        />
      ) : data.length === 0 ? (
        <SettingsRow
          description="위치와 무드를 바탕으로 플레이리스트를 보여드릴게요."
          icon="music"
          label="추천을 준비 중이에요"
        />
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
