import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { SectionTitle } from '@/components/SectionTitle';
import { SettingsRow } from '@/components/SettingsRow';
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

export function RecapTravelSummaryCard({ recap }: { recap: RecapShare }) {
  const summary = getRecapTravelSummary(recap);
  const distanceLabel = formatTravelDistance(summary.distanceMeters);
  const durationLabel = formatTravelDuration(summary.durationMinutes);
  const routeLabel = createPlaceRouteLabel(summary.placeNames);
  const routePointLabel = summary.routePointCount
    ? `${summary.routePointCount}개`
    : `${summary.recordedLocationCount}개`;

  return (
    <View className="w-full">
      <SectionTitle title="여행 이동 기록" />
      <AppText className="mt-2 text-sm leading-6 text-white/52" numberOfLines={2}>
        {summary.startPlaceName}에서 {summary.endPlaceName}까지
      </AppText>
      <SettingsRow icon="clock" label="총 여행 시간" rightText={durationLabel} />
      <SettingsRow icon="navigation" label="이동 거리" rightText={distanceLabel} />
      <SettingsRow
        description={routeLabel}
        icon="map-pin"
        label="이동 경로"
      />
      <SettingsRow
        icon="camera"
        label={summary.routePointCount ? '기록된 경로점' : '위치가 있는 기록'}
        rightText={routePointLabel}
      />
    </View>
  );
}
