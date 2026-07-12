import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import type { RecapShare } from '@/types/domain';
import { getRecapTravelSummary } from '@/utils/recapTravelSummary';

function formatTravelDuration(minutes: number) {
  if (minutes < 1) {
    return '1분 미만';
  }

  if (minutes < 60) {
    return `${minutes}분`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`;
}

function formatTravelDistance(distanceMeters: number) {
  if (distanceMeters < 1) {
    return '이동 기록 없음';
  }

  if (distanceMeters < 1000) {
    return `${distanceMeters}m`;
  }

  const distanceKilometers = distanceMeters / 1000;

  return `${distanceKilometers >= 10 ? distanceKilometers.toFixed(0) : distanceKilometers.toFixed(1)}km`;
}

function createPlaceRouteLabel(placeNames: string[]) {
  const routePlaces = placeNames.filter(Boolean);

  if (routePlaces.length === 0) {
    return '장소 기록 없음';
  }

  if (routePlaces.length <= 3) {
    return routePlaces.join(' -> ');
  }

  return `${routePlaces.slice(0, 3).join(' -> ')} 외 ${routePlaces.length - 3}곳`;
}

function TravelSummaryMetric({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="min-w-[132px] flex-1 rounded-[16px] bg-black/20 px-4 py-3">
      <View className="flex-row items-center gap-2">
        <Feather color="rgba(255,255,255,0.46)" name={icon} size={13} />
        <AppText className="text-[10px] font-semibold text-white/45">{label}</AppText>
      </View>
      <AppText className="mt-2 text-sm font-semibold text-white" numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

export function RecapTravelSummaryCard({ recap }: { recap: RecapShare }) {
  const summary = getRecapTravelSummary(recap);
  const distanceLabel = formatTravelDistance(summary.distanceMeters);
  const durationLabel = formatTravelDuration(summary.durationMinutes);
  const routeLabel = createPlaceRouteLabel(summary.placeNames);
  const routePointLabel = summary.routePointCount
    ? `${summary.routePointCount}개`
    : `${summary.recordedLocationCount}개`;

  return (
    <View className="w-full rounded-[20px] border border-white/10 bg-white/[0.06] p-4">
      <View className="flex-row items-start justify-between gap-4">
        <View className="min-w-0 flex-1">
          <AppText className="text-[11px] font-semibold text-white/45">
            여행 이동 기록
          </AppText>
          <AppText className="mt-2 text-lg font-semibold leading-6 text-white" numberOfLines={2}>
            {summary.startPlaceName}에서 {summary.endPlaceName}까지
          </AppText>
          <AppText className="mt-1 text-xs leading-5 text-white/55">
            여행모드 동안 기록된 이동 경로를 기준으로 계산했어요.
          </AppText>
        </View>
        <View className="h-11 w-11 items-center justify-center rounded-full bg-white/10">
          <Feather color="#B7E628" name="map" size={18} />
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-3">
        <TravelSummaryMetric icon="clock" label="총 여행 시간" value={durationLabel} />
        <TravelSummaryMetric icon="navigation" label="이동 거리" value={distanceLabel} />
        <TravelSummaryMetric icon="map-pin" label="이동 경로" value={routeLabel} />
        <TravelSummaryMetric
          icon="camera"
          label={summary.routePointCount ? '기록된 경로점' : '위치가 있는 기록'}
          value={routePointLabel}
        />
      </View>
    </View>
  );
}
