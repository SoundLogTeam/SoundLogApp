import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { ResilientImage } from '@/components/media/ResilientImage';
import type { PlaceContext } from '@/types/domain';

type SelectedTourPlacePanelProps = {
  onClose: () => void;
  place: PlaceContext;
};

function getPlaceMeta(place: PlaceContext) {
  const distance = place.distanceMeters;
  const distanceLabel =
    distance === undefined
      ? undefined
      : distance >= 1000
        ? `${(distance / 1000).toFixed(1)}km`
        : `${Math.round(distance).toLocaleString('ko-KR')}m`;

  return [
    place.category ?? place.contentType,
    distanceLabel,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function SelectedTourPlacePanel({
  onClose,
  place,
}: SelectedTourPlacePanelProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const placeMeta = getPlaceMeta(place);
  const shouldShowImage = Boolean(place.imageUrl && !hasImageError);

  useEffect(() => {
    setHasImageError(false);
  }, [place.id, place.imageUrl]);

  return (
    <View className="overflow-hidden rounded-[22px] border border-white/14 bg-[#090D19]/95 p-4">
      <View className="flex-row items-start gap-3">
        <View className="h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[14px] border border-white/10 bg-white/10">
          {shouldShowImage ? (
            <ResilientImage
              accessibilityIgnoresInvertColors
              className="h-full w-full"
              contentFit="cover"
              fallbackVariant="place"
              onError={() => setHasImageError(true)}
              source={{ uri: place.imageUrl }}
              transition={180}
            />
          ) : (
            <LinearGradient
              className="h-full w-full items-center justify-center"
              colors={['#27345B', '#11172B']}
            >
              <Feather color="rgba(255,255,255,0.76)" name="map-pin" size={24} />
              <AppText className="mt-1 text-[9px] font-semibold text-white/55">
                관광지
              </AppText>
            </LinearGradient>
          )}
        </View>

        <View className="min-w-0 flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <View className="min-w-0 flex-1">
              <AppText className="text-[11px] font-semibold text-soundlog-lime">
                선택한 관광지
              </AppText>
              <AppText
                accessibilityRole="header"
                className="mt-1 text-base font-semibold leading-6 text-white"
                numberOfLines={2}
              >
                {place.title}
              </AppText>
            </View>
            <Pressable
              accessibilityLabel="관광지 정보 닫기"
              accessibilityRole="button"
              className="h-11 w-11 shrink-0 items-center justify-center"
              hitSlop={4}
              onPress={onClose}
            >
              <Feather color="rgba(255,255,255,0.72)" name="x" size={19} />
            </Pressable>
          </View>

          {placeMeta ? (
            <AppText className="mt-1 text-xs text-white/62" numberOfLines={1}>
              {placeMeta}
            </AppText>
          ) : null}
        </View>
      </View>

      {place.address ? (
        <View className="mt-3 flex-row items-start gap-2 border-t border-white/10 pt-3">
          <Feather color="rgba(255,255,255,0.56)" name="navigation" size={14} />
          <AppText className="min-w-0 flex-1 text-xs leading-5 text-white/65">
            {place.address}
          </AppText>
        </View>
      ) : null}

      {place.overview ? (
        <AppText className="mt-2 text-xs leading-5 text-white/72" numberOfLines={3}>
          {place.overview}
        </AppText>
      ) : null}

      <AppText className="mt-2 text-[10px] text-white/42">
        {place.attribution ??
          (place.source === 'tour-api' ? '한국관광공사 관광정보' : '관광지 정보')}
      </AppText>
    </View>
  );
}
