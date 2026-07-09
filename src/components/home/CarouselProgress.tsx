import { View } from 'react-native';

type CarouselProgressProps = {
  contentVisibleRatio?: number;
  progress?: number;
};

const TRACK_WIDTH = 176;
const MIN_THUMB_RATIO = 0.24;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function CarouselProgress({
  contentVisibleRatio = 0.5,
  progress = 0,
}: CarouselProgressProps) {
  const thumbWidth = clamp(contentVisibleRatio, MIN_THUMB_RATIO, 1) * TRACK_WIDTH;
  const translateX = clamp(progress, 0, 1) * (TRACK_WIDTH - thumbWidth);

  return (
    <View className="mx-auto h-[4px] w-44 rounded-full bg-white/10">
      <View
        className="h-[4px] rounded-full bg-soundlog-purple"
        style={{
          transform: [{ translateX }],
          width: thumbWidth,
        }}
      />
    </View>
  );
}
