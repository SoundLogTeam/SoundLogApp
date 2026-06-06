import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { HomeLocationStatus } from '@/store/travelSessionStore';
import { GeoPoint, PlaceContext } from '@/types/domain';
import { formatRecapRecordedAt } from '@/utils/dateFormat';
import { formatPlaceLabel } from '@/utils/placeLabel';

type LocationContextCardProps = {
  enabled: boolean;
  isLoading?: boolean;
  isPlaceLoading?: boolean;
  location?: GeoPoint;
  onDismiss?: () => void;
  onEnable: () => void;
  onRefresh: () => void;
  place?: PlaceContext;
  placeCount?: number;
  placeInfoMessage?: string;
  status: HomeLocationStatus;
  updatedAt?: string;
};

const statusCopy: Record<HomeLocationStatus, { description: string; icon: keyof typeof Feather.glyphMap; title: string }> = {
  denied: {
    description: '권한 없이도 기본 추천은 볼 수 있어요. 위치를 허용하면 현재 장소에 더 가까운 음악을 추천해요.',
    icon: 'map-pin',
    title: '위치 권한이 꺼져 있어요',
  },
  granted: {
    description: '현재 장소 컨텍스트를 홈 추천과 순간 저장에 함께 사용할게요.',
    icon: 'navigation',
    title: '현재 위치 기반 추천 중',
  },
  idle: {
    description: '현재 장소를 확인하면 가까운 관광 맥락에 맞춰 추천 순서를 조정해요.',
    icon: 'map-pin',
    title: '위치 기반 추천 준비',
  },
  loading: {
    description: '위치 권한과 현재 좌표를 확인하고 있어요.',
    icon: 'loader',
    title: '현재 위치 확인 중',
  },
  unavailable: {
    description: '위치를 확인하지 못했지만 기본 추천은 계속 사용할 수 있어요.',
    icon: 'alert-circle',
    title: '위치를 확인하지 못했어요',
  },
};

export function LocationContextCard({
  enabled,
  isLoading = false,
  isPlaceLoading = false,
  location,
  onDismiss,
  onEnable,
  onRefresh,
  place,
  placeCount = 0,
  placeInfoMessage,
  status,
  updatedAt,
}: LocationContextCardProps) {
  const copy = enabled
    ? statusCopy[status]
    : {
        description: '취향 기반 추천은 유지하고, 위치 기반 정렬만 잠시 꺼둔 상태예요.',
        icon: 'map-pin' as const,
        title: '위치 추천이 꺼져 있어요',
      };
  const buttonLabel = enabled ? (location ? '위치 새로고침' : '현재 위치 확인') : '위치 추천 켜기';

  return (
    <View className="rounded-[22px] border border-white/10 bg-white/10 p-5">
      <View className="flex-row items-start gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-white/10">
          <Feather color="#fff" name={copy.icon} size={19} />
        </View>

        <View className="min-w-0 flex-1">
          <AppText className="text-base font-semibold text-white">{copy.title}</AppText>
          <AppText className="mt-2 text-sm leading-6 text-white/55">{copy.description}</AppText>

          {enabled && location ? (
            <View className="mt-4 rounded-[16px] bg-black/20 px-4 py-3">
              <AppText className="text-sm font-semibold text-white" numberOfLines={1}>
                {place?.title ?? formatPlaceLabel(location)}
              </AppText>
              {place ? (
                <AppText className="mt-1 text-xs text-white/45" numberOfLines={1}>
                  {[place.category ?? place.contentType, place.distanceMeters ? `${Math.round(place.distanceMeters)}m` : undefined]
                    .filter(Boolean)
                    .join(' · ') || '장소 컨텍스트 확인됨'}
                </AppText>
              ) : null}
              {updatedAt ? (
                <AppText className="mt-1 text-xs text-white/40">
                  {formatRecapRecordedAt(updatedAt)} 갱신
                </AppText>
              ) : null}
              {isPlaceLoading ? (
                <AppText className="mt-2 text-xs text-[#9EA8FF]">주변 관광지를 확인 중이에요</AppText>
              ) : placeCount > 0 ? (
                <AppText className="mt-2 text-xs text-[#9EA8FF]">
                  주변 장소 {placeCount}곳을 추천 맥락으로 반영해요
                </AppText>
              ) : null}
              {placeInfoMessage ? (
                <AppText className="mt-2 text-xs text-white/40">{placeInfoMessage}</AppText>
              ) : null}
            </View>
          ) : null}
        </View>

        {onDismiss ? (
          <Pressable
            accessibilityLabel="위치 확인 카드 삭제"
            accessibilityRole="button"
            className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
            onPress={onDismiss}
          >
            <Feather color="rgba(255,255,255,0.72)" name="x" size={18} />
          </Pressable>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        className="mt-5 h-11 items-center justify-center rounded-full border border-[#9EA8FF]/70 bg-[#243A75]/70"
        disabled={isLoading}
        onPress={enabled ? onRefresh : onEnable}
        style={{ opacity: isLoading ? 0.55 : 1 }}
      >
        <AppText className="text-sm font-semibold text-white">{buttonLabel}</AppText>
      </Pressable>
    </View>
  );
}
