import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { SectionTitle } from '@/components/SectionTitle';
import { SettingsRow } from '@/components/SettingsRow';
import type { FeaturedPlaylist, PlaceContext } from '@/types/domain';
import { getPlaceDisplayTitle } from '@/utils/placeLabel';

type CurrentSoundtrackCardProps = {
  cachedAt?: string;
  currentPlace?: PlaceContext;
  isCached?: boolean;
  isError?: boolean;
  isLoading?: boolean;
  isOpeningPlaylist?: boolean;
  moodLabel: string;
  needsLocation?: boolean;
  onOpenPlaylist: (playlist: FeaturedPlaylist) => void;
  onRetry?: () => void;
  playlist?: FeaturedPlaylist;
  placeLabel: string;
  recommendationSource?: string;
};

function getRecommendationSourceLabel(source?: string) {
  if (source === 'ml-recommendation') {
    return '맞춤 추천';
  }

  if (source === 'seed-fallback') {
    return '기본 추천';
  }

  return undefined;
}

export function CurrentSoundtrackCard({
  cachedAt,
  currentPlace,
  isCached = false,
  isError = false,
  isLoading = false,
  isOpeningPlaylist = false,
  moodLabel,
  needsLocation = false,
  onOpenPlaylist,
  onRetry,
  playlist,
  placeLabel,
  recommendationSource,
}: CurrentSoundtrackCardProps) {
  const placeTitle = getPlaceDisplayTitle(currentPlace);
  const placeCaption =
    currentPlace?.address ??
    currentPlace?.category ??
    '장소를 확인하며 추천을 준비 중이에요.';
  const playlistTitle =
    recommendationSource === 'seed-fallback' && currentPlace
      ? `${placeTitle} 사운드트랙`
      : playlist?.regionName ?? `${placeLabel} 사운드트랙`;
  const playlistDescription =
    playlist?.description ??
    (needsLocation
      ? '위치를 확인하면 지금 상황에 맞춘 곡 목록을 준비할게요.'
      : '현재 장소 맥락으로 오늘 들을 곡 목록을 준비하고 있어요.');
  const trackMeta = playlist
    ? `${playlist.trackCount}곡 · ${playlist.durationText}`
    : isLoading
      ? '준비 중'
      : needsLocation
        ? '위치 필요'
        : '다시 시도';
  const sourceLabel = getRecommendationSourceLabel(recommendationSource);
  const cacheLabel = cachedAt
    ? `최근 ${new Date(cachedAt).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : '최근 추천';
  const sectionStatus = sourceLabel ?? (isCached ? cacheLabel : undefined);

  const handleOpenPlaylist = () => {
    if (playlist) {
      onOpenPlaylist(playlist);
      return;
    }

    onRetry?.();
  };

  return (
    <View>
      <SectionTitle
        rightContent={
          sectionStatus ? (
            <AppText className="text-xs font-semibold text-white/42">
              {sectionStatus}
            </AppText>
          ) : undefined
        }
        title="오늘의 사운드트랙"
      />
      <SettingsRow
        description={playlistDescription}
        disabled={isLoading || isOpeningPlaylist}
        icon="disc"
        label={playlistTitle}
        onPress={handleOpenPlaylist}
        rightText={isOpeningPlaylist ? '여는 중' : trackMeta}
      />
      <SettingsRow
        description={isError ? '추천을 다시 받아볼 수 있어요.' : placeCaption}
        icon="map-pin"
        label={placeTitle}
        rightText={moodLabel}
      />
      <SettingsRow
        disabled={isLoading}
        icon="refresh-cw"
        label="추천 다시 받기"
        onPress={onRetry}
        rightText={isLoading ? '준비 중' : undefined}
      />
    </View>
  );
}
