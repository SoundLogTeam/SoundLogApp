import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { SectionTitle } from '@/components/SectionTitle';
import { SettingsRow } from '@/components/SettingsRow';
import { HomeLocationStatus } from '@/store/travelSessionStore';
import { GeoPoint, PlaceContext } from '@/types/domain';
import { formatRecapRecordedAt } from '@/utils/dateFormat';
import { getPlaceDisplayTitle } from '@/utils/placeLabel';

type LocationContextCardProps = {
  enabled: boolean;
  isLoading?: boolean;
  isPlaceLoading?: boolean;
  location?: GeoPoint;
  onDismiss?: () => void;
  onEnable: () => void;
  onRefresh: () => void;
  onSelectPlace?: () => void;
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
    description: '확인한 지역을 음악 추천과 리캡 저장에 함께 사용할게요.',
    icon: 'navigation',
    title: '지역 기반 추천 중',
  },
  idle: {
    description: '위치 설정을 켜면 현재 장소와 가까운 관광 맥락에 맞춰 추천 순서를 조정해요.',
    icon: 'map-pin',
    title: '위치를 확인해 볼까요?',
  },
  loading: {
    description: '위치 권한과 한국어 지역명을 확인하고 있어요.',
    icon: 'loader',
    title: '지역명 확인 중',
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
  onSelectPlace,
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
  const buttonLabel = enabled ? (location ? '새로고침' : '지역 확인') : '추천 켜기';
  const placeTitle = getPlaceDisplayTitle(
    place,
    location ? '지역명 확인 중' : copy.title,
  );
  const placeMeta = place
    ? [
        place.address,
        place.category ?? place.contentType,
        place.distanceMeters ? `${Math.round(place.distanceMeters)}m` : undefined,
      ]
        .filter(Boolean)
        .join(' · ')
    : undefined;
  const statusText = isPlaceLoading
    ? '주변 관광지를 확인 중이에요'
    : placeCount > 0
      ? `주변 장소 ${placeCount}곳 반영`
      : place && !location
        ? '직접 선택한 장소로 추천 중'
      : location
        ? updatedAt
          ? `${formatRecapRecordedAt(updatedAt)} 갱신`
          : '지역 기반 추천 중'
        : copy.description;

  return (
    <View>
      <SectionTitle
        rightContent={
          onDismiss ? (
          <Pressable
            accessibilityLabel="추천 장소 정보 닫기"
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center"
            onPress={onDismiss}
          >
            <Feather color="rgba(255,255,255,0.72)" name="x" size={18} />
          </Pressable>
          ) : undefined
        }
        title="장소 기반 추천"
      />
      <SettingsRow
        description={
          placeInfoMessage ??
          (placeMeta ? `${placeMeta} · ${statusText}` : statusText)
        }
        disabled={isLoading}
        icon={copy.icon}
        label={placeTitle}
        onPress={enabled ? onRefresh : onEnable}
        rightText={isLoading ? '확인 중' : buttonLabel}
      />
      {place?.attribution ? (
        <SettingsRow
          description={place.attribution}
          icon="info"
          label="위치 정보 출처"
          rightText="OpenStreetMap"
        />
      ) : null}
      {onSelectPlace ? (
        <SettingsRow
          description="검색한 장소를 추천 기준으로 사용해요."
          disabled={isLoading}
          icon="search"
          label="추천 장소 직접 선택"
          onPress={onSelectPlace}
        />
      ) : null}
    </View>
  );
}
