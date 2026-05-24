import { View } from 'react-native';

type CarouselProgressProps = {
  progress?: number;
};

export function CarouselProgress({ progress = 0.55 }: CarouselProgressProps) {
  const width = Math.max(0, Math.min(progress, 1)) * 176;

  return (
    <View className="mx-auto h-[4px] w-44 rounded-full bg-white/10">
      <View className="h-[4px] rounded-full bg-soundlog-purple" style={{ width }} />
    </View>
  );
}
