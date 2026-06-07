import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import type { PlaceContext } from '@/types/domain';

type TravelModeSuggestionSheetProps = {
  onDismiss: () => void;
  onStartTravelMode: () => void;
  place: PlaceContext;
};

export function TravelModeSuggestionSheet({
  onDismiss,
  onStartTravelMode,
  place,
}: TravelModeSuggestionSheetProps) {
  return (
    <View className="absolute inset-x-0 bottom-0 px-4 pb-4">
      <View className="rounded-t-[28px] border border-white/15 bg-[#111827] p-5 shadow-2xl">
        <View className="mx-auto mb-5 h-[5px] w-10 rounded-full bg-white/35" />

        <View className="flex-row items-start gap-3">
          <View
            className="h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(245,164,81,0.2)' }}
          >
            <Feather color="#F5A451" name="map-pin" size={20} />
          </View>

          <View className="min-w-0 flex-1">
            <AppText className="text-lg font-semibold text-white" numberOfLines={1}>
              {place.title}에 도착했습니다
            </AppText>
            <AppText className="mt-2 text-sm leading-6 text-white/58">
              현재 위치에 맞는 음악을 추천받으시겠습니까?
            </AppText>
          </View>
        </View>

        <View className="mt-5 rounded-[18px] bg-white/10 px-4 py-3">
          <AppText className="text-xs font-semibold text-[#F5A451]">
            Travel Mode는 직접 선택할 때만 시작돼요
          </AppText>
          <AppText className="mt-2 text-xs leading-5 text-white/48">
            위치 60%, 관광지 유형 20%, 시간대 10%, 취향 10%를 반영합니다.
          </AppText>
        </View>

        <View className="mt-5 flex-row gap-3">
          <Pressable
            accessibilityRole="button"
            className="h-12 flex-1 items-center justify-center rounded-full"
            onPress={onStartTravelMode}
            style={{ backgroundColor: '#F5A451' }}
          >
            <AppText className="text-sm font-semibold" style={{ color: '#07101E' }}>
              Travel Mode 시작
            </AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            className="h-12 flex-1 items-center justify-center rounded-full border border-white/15"
            onPress={onDismiss}
          >
            <AppText className="text-sm font-semibold text-white/72">나중에</AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
