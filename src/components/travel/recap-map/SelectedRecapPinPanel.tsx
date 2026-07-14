import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import type { RecapMapMarker } from '@/types/domain';
import { formatRecapRecordedAt } from '@/utils/dateFormat';

import type { SoundMapPin } from '../live-sound-map/types';

type SelectedRecapPinPanelProps = {
  markers: RecapMapMarker[];
  onClose: () => void;
  onOpenRecap: (recapId: string) => void;
  pin: SoundMapPin;
};

export function SelectedRecapPinPanel({
  markers,
  onClose,
  onOpenRecap,
  pin,
}: SelectedRecapPinPanelProps) {
  return (
    <View className="overflow-hidden rounded-[22px] border border-white/14 bg-[#090D19]/95 px-4 pb-3 pt-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <Feather color="#B7E628" name="map-pin" size={14} />
            <AppText className="text-xs font-semibold text-soundlog-lime">
              선택한 핀의 로그 · {markers.length}개
            </AppText>
          </View>
          <AppText
            className="mt-1.5 text-base font-semibold text-white"
            numberOfLines={1}
          >
            {pin.subtitle}
          </AppText>
        </View>
        <Pressable
          accessibilityLabel="선택한 핀 로그 닫기"
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center"
          hitSlop={4}
          onPress={onClose}
        >
          <Feather color="rgba(255,255,255,0.7)" name="x" size={19} />
        </Pressable>
      </View>

      <ScrollView
        className="mt-2 max-h-[238px]"
        nestedScrollEnabled
        showsVerticalScrollIndicator={markers.length > 3}
      >
        {markers.map((marker, index) => (
          <Pressable
            accessibilityHint="로그의 사진, 음악과 여행 기록을 자세히 봅니다."
            accessibilityLabel={`${marker.title} 상세 보기`}
            accessibilityRole="button"
            className={`min-h-[76px] flex-row items-center gap-3 py-2.5 ${
              index > 0 ? 'border-t border-white/10' : ''
            }`}
            key={marker.id}
            onPress={() => onOpenRecap(marker.recapId)}
          >
            <View className="h-14 w-14 shrink-0 overflow-hidden rounded-[8px] bg-white/10">
              {marker.imageUrl ? (
                <Image
                  className="h-full w-full"
                  contentFit="cover"
                  source={{ uri: marker.imageUrl }}
                  transition={180}
                />
              ) : (
                <View className="h-full w-full items-center justify-center">
                  <Feather
                    color="rgba(255,255,255,0.48)"
                    name="music"
                    size={19}
                  />
                </View>
              )}
            </View>

            <View className="min-w-0 flex-1">
              <View className="flex-row items-center gap-2">
                <AppText
                  className="min-w-0 flex-1 text-sm font-semibold text-white"
                  numberOfLines={1}
                >
                  {marker.title}
                </AppText>
                <AppText className="text-[10px] font-semibold text-white/42">
                  {marker.visibility === 'public' ? '전체공개' : '나만보기'}
                </AppText>
              </View>
              <AppText className="mt-1 text-xs text-white/62" numberOfLines={1}>
                {marker.trackTitle} · {marker.artistName}
              </AppText>
              <AppText
                className="mt-1 text-[10px] text-white/38"
                numberOfLines={1}
              >
                {marker.ownerAlias} · {formatRecapRecordedAt(marker.createdAt)}
              </AppText>
            </View>

            <View className="h-11 shrink-0 flex-row items-center gap-1 pl-1">
              <AppText className="text-xs font-semibold text-soundlog-lime">
                상세
              </AppText>
              <Feather color="#B7E628" name="chevron-right" size={16} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
