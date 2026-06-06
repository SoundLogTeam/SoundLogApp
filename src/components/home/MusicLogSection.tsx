import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  View,
} from 'react-native';

import { AppText } from '@/components/AppText';
import { MusicLogCard } from '@/components/home/MusicLogCard';
import { MusicLogItem } from '@/types/domain';

type MusicLogSectionProps = {
  data?: MusicLogItem[];
  isError?: boolean;
  isLoading?: boolean;
  onSelectLog?: (item: MusicLogItem) => void;
};

const MUSIC_LOG_CARD_WIDTH = 164;
const MUSIC_LOG_CARD_HEIGHT = 216;
const MUSIC_LOG_CARD_GAP = 14;
const MUSIC_LOG_SNAP_INTERVAL = MUSIC_LOG_CARD_WIDTH + MUSIC_LOG_CARD_GAP;
const MUSIC_LOG_INITIAL_INDEX = 1;

function MusicLogSkeleton() {
  return (
    <View className="flex-row overflow-hidden">
      {[0, 1, 2].map((item) => (
        <View key={item} className="mr-[14px] h-[216px] w-[164px] rounded-[18px] bg-white/10" />
      ))}
    </View>
  );
}

export function MusicLogSection({
  data = [],
  isError = false,
  isLoading = false,
  onSelectLog,
}: MusicLogSectionProps) {
  const scrollRef = useRef<any>(null);
  const scrollX = useRef(new Animated.Value(MUSIC_LOG_INITIAL_INDEX * MUSIC_LOG_SNAP_INTERVAL)).current;
  const [sectionWidth, setSectionWidth] = useState(0);
  const carouselSidePadding =
    sectionWidth > 0 ? Math.max(0, (sectionWidth - MUSIC_LOG_CARD_WIDTH) / 2) : 0;
  const initialIndex = data.length > MUSIC_LOG_INITIAL_INDEX ? MUSIC_LOG_INITIAL_INDEX : 0;
  const initialOffset = initialIndex * MUSIC_LOG_SNAP_INTERVAL;

  const handleLayout = (event: LayoutChangeEvent) => {
    setSectionWidth(event.nativeEvent.layout.width);
  };

  useEffect(() => {
    if (data.length === 0) {
      return;
    }

    const nextIndex = data.length > MUSIC_LOG_INITIAL_INDEX ? MUSIC_LOG_INITIAL_INDEX : 0;

    scrollX.setValue(nextIndex * MUSIC_LOG_SNAP_INTERVAL);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        animated: false,
        x: nextIndex * MUSIC_LOG_SNAP_INTERVAL,
        y: 0,
      });
    });
  }, [data.length, scrollX]);

  return (
    <View className="gap-4" onLayout={handleLayout}>
      <AppText className="text-[26px] font-semibold text-white">Music Log</AppText>

      {isLoading ? (
        <MusicLogSkeleton />
      ) : isError ? (
        <View className="rounded-[16px] bg-white/10 p-4">
          <AppText className="text-sm font-semibold text-white">
            Music Log를 불러오지 못했어요
          </AppText>
        </View>
      ) : data.length === 0 ? (
        <View className="rounded-[16px] bg-white/10 p-4">
          <AppText className="text-sm font-semibold text-white">
            오늘의 여행 순간을 저장해보세요.
          </AppText>
        </View>
      ) : (
        <Animated.ScrollView
          contentContainerStyle={{
            paddingLeft: carouselSidePadding,
            paddingRight: carouselSidePadding,
          }}
          contentOffset={{ x: initialOffset, y: 0 }}
          decelerationRate="fast"
          disableIntervalMomentum
          horizontal
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true },
          )}
          ref={scrollRef}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start"
          snapToInterval={MUSIC_LOG_SNAP_INTERVAL}
        >
          {data.map((item, index) => {
            const inputRange = [
              (index - 1) * MUSIC_LOG_SNAP_INTERVAL,
              index * MUSIC_LOG_SNAP_INTERVAL,
              (index + 1) * MUSIC_LOG_SNAP_INTERVAL,
            ];
            const rotate = scrollX.interpolate({
              extrapolate: 'clamp',
              inputRange,
              outputRange: ['-8deg', '0deg', '8deg'],
            });
            const scale = scrollX.interpolate({
              extrapolate: 'clamp',
              inputRange,
              outputRange: [0.9, 1, 0.9],
            });

            return (
              <MusicLogCard
                animatedStyle={{
                  transform: [{ rotate }, { scale }],
                }}
                cardHeight={MUSIC_LOG_CARD_HEIGHT}
                cardWidth={MUSIC_LOG_CARD_WIDTH}
                index={index}
                item={item}
                key={item.id}
                onPress={onSelectLog ? () => onSelectLog(item) : undefined}
                style={{ marginRight: index === data.length - 1 ? 0 : MUSIC_LOG_CARD_GAP }}
              />
            );
          })}
        </Animated.ScrollView>
      )}
    </View>
  );
}
