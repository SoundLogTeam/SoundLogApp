import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';

import { modeIconByValue, modeLabelByValue, type TravelRecap } from './travelData';

type RecapCardProps = {
  item: TravelRecap;
  onPress: () => void;
};

export function RecapCard({ item, onPress }: RecapCardProps) {
  return (
    <Pressable
      accessibilityLabel={`${modeLabelByValue[item.mode]} Travel Log 보기`}
      accessibilityRole="button"
      className="rounded-[18px] border border-white/10 bg-white/10 px-4 py-3.5"
      onPress={onPress}
    >
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-white/10">
          <AppText className="text-[20px]">{modeIconByValue[item.mode]}</AppText>
        </View>

        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <AppText className="text-base font-semibold text-white" numberOfLines={1}>
              {modeLabelByValue[item.mode]}
            </AppText>
            <AppText className="text-[11px] font-medium text-white/45">{item.date}</AppText>
          </View>

          <AppText className="mt-1 text-xs font-semibold text-white" numberOfLines={1}>
            {item.durationText} · {item.playTimeText.replace('음악 기록 ', '')}
          </AppText>

          <View className="mt-2 flex-row items-center gap-2">
            <View className="rounded-full bg-white/10 px-2 py-1">
              <AppText className="text-[10px] font-semibold text-white/70">
                {item.playCount}회 기록
              </AppText>
            </View>
            <View className="rounded-full bg-white/10 px-2 py-1">
              <AppText className="text-[10px] font-semibold text-white/70">
                {item.trackCount}곡
              </AppText>
            </View>
            <View className="rounded-full bg-white/10 px-2 py-1">
              <AppText className="text-[10px] font-semibold text-white/70">
                리캡 {item.momentCount}
              </AppText>
            </View>
          </View>
        </View>

        <View className="h-9 w-9 items-center justify-center rounded-full bg-soundlog-lime">
          <Feather color="#090515" name="arrow-up-right" size={16} />
        </View>
      </View>
    </Pressable>
  );
}
