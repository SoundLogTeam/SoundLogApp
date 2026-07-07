import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { syncRecommendationEvent } from '@/api/recommendationEventApi';
import { AppText } from '@/components/AppText';
import { useRecommendationEventStore } from '@/store/recommendationEventStore';
import type { GeoPoint, PlaceContext, Track } from '@/types/domain';
import { formatPlaceLabel } from '@/utils/placeLabel';

import { OpenLayersSoundMap } from './OpenLayersSoundMap';
import { createSoundMapCenter, createSoundMapPins } from './soundMapData';
import type { SoundMapVisibility } from './types';

type LiveSoundMapSectionProps = {
  currentLocation?: GeoPoint;
  currentPlace?: PlaceContext;
  currentTrack?: Track;
  sessionStatus: 'active' | 'ended' | 'idle';
};

const visibilityOptions: Array<{ label: string; value: SoundMapVisibility }> = [
  { label: '동행자만', value: 'companions' },
  { label: '주변 익명', value: 'nearby' },
  { label: '비공개', value: 'private' },
];

const visibilityCopy: Record<SoundMapVisibility, { description: string; title: string }> = {
  companions: {
    description: '같은 여행방에 있는 동행자에게만 현재 음악 핀을 보여줘요.',
    title: '동행자 공개',
  },
  nearby: {
    description: '정확한 좌표 대신 대략 위치와 음악 취향만 주변 여행자에게 보여줘요.',
    title: '주변 익명 공개',
  },
  private: {
    description: '내 지도에는 보이지만 다른 사람에게는 현재 음악 핀을 공개하지 않아요.',
    title: '비공개',
  },
};

export function LiveSoundMapSection({
  currentLocation,
  currentPlace,
  currentTrack,
  sessionStatus,
}: LiveSoundMapSectionProps) {
  const [visibility, setVisibility] = useState<SoundMapVisibility>('companions');
  const addEvent = useRecommendationEventStore((state) => state.addEvent);
  const center = useMemo(
    () => createSoundMapCenter(currentLocation, currentPlace),
    [currentLocation, currentPlace],
  );
  const pins = useMemo(
    () => createSoundMapPins({ center, currentTrack, visibility }),
    [center, currentTrack, visibility],
  );
  const isTravelActive = sessionStatus === 'active';
  const isLive = isTravelActive && visibility !== 'private';
  const locationLabel = currentPlace?.title ?? formatPlaceLabel(center);
  const visibilityMessage = visibilityCopy[visibility];

  const handleVisibilityPress = (nextVisibility: SoundMapVisibility) => {
    setVisibility(nextVisibility);

    if (!isTravelActive || !currentTrack || nextVisibility === 'private') {
      return;
    }

    const event = addEvent({
      context: {
        placeId: currentPlace?.id,
        placeName: currentPlace?.title,
      },
      trackId: currentTrack.id,
      type: nextVisibility === 'nearby' ? 'nearby_sound_opened' : 'live_track_shared',
      value: nextVisibility,
    });

    syncRecommendationEvent(event);
  };

  return (
    <View className="mt-8 rounded-[28px] border border-white/10 bg-white/10 p-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <View className="h-2.5 w-2.5 rounded-full bg-soundlog-lime" />
            <AppText className="text-xs font-semibold text-soundlog-lime">
              Live Sound Map
            </AppText>
          </View>
          <AppText className="mt-3 text-[24px] font-semibold leading-8 text-white">
            지금 듣는 음악을 지도에 남겨요
          </AppText>
          <AppText className="mt-2 text-sm leading-6 text-white/58">
            OpenLayers 지도를 Soundlog 다크 테마로 조정하고, 여행 모드 중인 내 음악과
            동행자/주변 익명 핀을 함께 보여줘요.
          </AppText>
        </View>
        <View
          className={`rounded-full px-3 py-1.5 ${
            isLive ? 'bg-soundlog-lime' : 'bg-white/10'
          }`}
        >
          <AppText
            className={`text-[11px] font-semibold ${
              isLive ? 'text-soundlog-inverse' : 'text-white/55'
            }`}
          >
            {isLive ? 'LIVE' : 'PREVIEW'}
          </AppText>
        </View>
      </View>

      <View className="mt-5">
        <OpenLayersSoundMap
          center={center}
          pins={pins}
          selectedTrack={currentTrack}
          sessionStatus={sessionStatus}
          visibility={visibility}
        />
      </View>

      <View className="mt-4 rounded-[18px] border border-white/10 bg-black/20 p-4">
        <View className="flex-row items-start gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <Feather color="#B7E628" name={isLive ? 'radio' : 'lock'} size={18} />
          </View>
          <View className="min-w-0 flex-1">
            <AppText className="text-sm font-semibold text-white">
              {isTravelActive ? visibilityMessage.title : '여행 모드 OFF'}
            </AppText>
            <AppText className="mt-1 text-xs leading-5 text-white/55">
              {isTravelActive
                ? visibilityMessage.description
                : '여행을 시작하면 현재 위치와 Soundlog에서 선택한 음악을 지도에 표시할 수 있어요.'}
            </AppText>
            <AppText className="mt-2 text-xs text-white/40" numberOfLines={1}>
              {locationLabel} · {currentTrack ? `${currentTrack.title} - ${currentTrack.artist}` : '선택한 음악 없음'}
            </AppText>
          </View>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        {visibilityOptions.map((option) => {
          const selected = visibility === option.value;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className={`h-10 flex-1 basis-[92px] items-center justify-center rounded-full border px-3 ${
                selected
                  ? 'border-soundlog-lime bg-soundlog-lime'
                  : 'border-white/12 bg-white/10'
              }`}
              key={option.value}
              onPress={() => handleVisibilityPress(option.value)}
            >
              <AppText
                className={`text-xs font-semibold ${
                  selected ? 'text-soundlog-inverse' : 'text-white/70'
                }`}
              >
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
