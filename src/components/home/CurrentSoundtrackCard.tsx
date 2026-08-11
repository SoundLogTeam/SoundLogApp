import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { SectionTitle } from '@/components/SectionTitle';
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
      : (playlist?.regionName ?? `${placeLabel} 사운드트랙`);
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
    <View className="gap-4">
      <SectionTitle
        rightContent={
          <View className="flex-row items-center gap-2">
            {sectionStatus ? (
              <AppText className="text-xs font-semibold text-white/42">
                {sectionStatus}
              </AppText>
            ) : null}
            <IconButton
              disabled={isLoading}
              label={
                isLoading
                  ? '사운드트랙 추천 준비 중'
                  : '사운드트랙 추천 다시 받기'
              }
              name="refresh-cw"
              onPress={onRetry}
            />
          </View>
        }
        title="오늘의 사운드트랙"
      />

      <Pressable
        accessibilityHint={
          playlist ? '추천된 곡 목록을 엽니다' : '추천을 다시 요청합니다'
        }
        accessibilityLabel={`${playlistTitle}, ${trackMeta}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: isLoading || isOpeningPlaylist }}
        className="min-h-[228px] overflow-hidden rounded-[28px] border border-white/10 bg-soundlog-card p-6"
        disabled={isLoading || isOpeningPlaylist}
        onPress={handleOpenPlaylist}
        style={({ pressed }) => ({
          opacity: isLoading || isOpeningPlaylist ? 0.52 : pressed ? 0.72 : 1,
        })}
      >
        <View className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-soundlog-lime/10" />
        <View className="absolute -bottom-16 -left-8 h-44 w-44 rounded-full bg-white/[0.03]" />

        <View className="flex-row items-start justify-between gap-4">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-soundlog-lime/15">
            <Feather color="#D4FF3F" name="disc" size={28} />
          </View>
          <View className="rounded-full bg-white/10 px-3 py-2">
            <AppText className="text-xs font-semibold text-white/66">
              {isOpeningPlaylist ? '여는 중' : trackMeta}
            </AppText>
          </View>
        </View>

        <View className="mt-auto pt-6">
          <AppText
            className="text-[28px] font-semibold leading-9 text-white"
            numberOfLines={2}
          >
            {playlistTitle}
          </AppText>
          <AppText
            className="mt-2 text-sm leading-6 text-white/58"
            numberOfLines={2}
          >
            {isError ? '추천을 다시 받아볼 수 있어요.' : playlistDescription}
          </AppText>
          <View className="mt-5 flex-row items-center gap-2">
            <Feather color="rgba(255,255,255,0.5)" name="map-pin" size={16} />
            <AppText
              className="min-w-0 flex-1 text-sm text-white/66"
              numberOfLines={2}
            >
              {placeTitle} · {placeCaption}
            </AppText>
            <AppText className="shrink-0 text-sm font-semibold text-soundlog-lime">
              {moodLabel}
            </AppText>
          </View>
        </View>
      </Pressable>
    </View>
  );
}
