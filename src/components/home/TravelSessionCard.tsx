import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import type { PlaceContext, TravelMode } from '@/types/domain';
import { formatRecapRecordedAt } from '@/utils/dateFormat';

type TravelSessionStatus = 'active' | 'ended' | 'idle';

type TravelSessionCardProps = {
  endedAt?: string;
  currentPlace?: PlaceContext;
  onDismissEnded?: () => void;
  onOpenRecap: () => void;
  onOpenTravel: () => void;
  selectedMode?: TravelMode;
  startedAt?: string;
  status: TravelSessionStatus;
};

const travelModeOptions: Array<{ label: string; value: TravelMode }> = [
  { label: '산책', value: 'walk' },
  { label: '드라이브', value: 'drive' },
  { label: '카페 투어', value: 'cafe' },
  { label: '바다 보기', value: 'ocean' },
  { label: '야경 감상', value: 'night' },
];

const statusCopy: Record<
  TravelSessionStatus,
  {
    cta: string;
    description: string;
    icon: keyof typeof Feather.glyphMap;
    title: string;
  }
> = {
  active: {
    cta: '여행 보기',
    description: '여행 중 저장한 리캡들이 지금 로그에 함께 묶이고 있어요.',
    icon: 'radio',
    title: '여행 기록 중',
  },
  ended: {
    cta: '로그 보기',
    description: '저장한 리캡들은 여행 로그에서 다시 확인할 수 있어요.',
    icon: 'check-circle',
    title: '여행이 종료됐어요',
  },
  idle: {
    cta: '여행 보기',
    description: '현재 장소와 음악을 하나의 여정으로 묶어 기록해요.',
    icon: 'play-circle',
    title: '여행을 시작해볼까요?',
  },
};

function formatSessionTime(status: TravelSessionStatus, startedAt?: string, endedAt?: string) {
  if (status === 'active' && startedAt) {
    return `${formatRecapRecordedAt(startedAt)} 시작`;
  }

  if (status === 'ended' && endedAt) {
    return `${formatRecapRecordedAt(endedAt)} 종료`;
  }

  return '아직 기록 전';
}

export function TravelSessionCard({
  currentPlace,
  endedAt,
  onDismissEnded,
  onOpenRecap,
  onOpenTravel,
  selectedMode,
  startedAt,
  status,
}: TravelSessionCardProps) {
  const copy = statusCopy[status];
  const onPrimaryPress = status === 'ended' ? onOpenRecap : onOpenTravel;
  const sessionTime = formatSessionTime(status, startedAt, endedAt);
  const selectedModeLabel = travelModeOptions.find(
    (mode) => mode.value === selectedMode,
  )?.label;
  const isActive = status === 'active';
  const locationLabel = currentPlace?.title ?? '현재 위치 확인 중';

  return (
    <View
      className={`rounded-[18px] border px-3.5 ${
        isActive ? 'border-[#9EA8FF]/45 bg-[#182755]/55 py-3.5' : 'border-white/10 bg-white/10 py-2.5'
      }`}
    >
      <View className={`flex-row ${isActive ? 'items-start gap-3' : 'items-center gap-2.5'}`}>
        <View
          className={`${isActive ? 'h-11 w-11 bg-[#9EA8FF]/20' : 'h-9 w-9 bg-white/10'} items-center justify-center rounded-full`}
        >
          <Feather color={isActive ? '#9EA8FF' : '#fff'} name={copy.icon} size={isActive ? 18 : 16} />
        </View>

        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <AppText className={`${isActive ? 'text-[17px]' : 'text-[15px]'} shrink font-semibold text-white`} numberOfLines={1}>
              {copy.title}
            </AppText>
            {status === 'idle' ? (
              <AppText className="text-[11px] text-[#9EA8FF]" numberOfLines={1}>
                {sessionTime}
              </AppText>
            ) : null}
            {status === 'active' && selectedModeLabel ? (
              <View className="rounded-full bg-[#9EA8FF]/20 px-2.5 py-1">
                <AppText className="text-[10px] font-semibold text-[#E4E8FF]">
                  {selectedModeLabel}
                </AppText>
              </View>
            ) : null}
          </View>
          {isActive ? (
            <View className="mt-2 flex-row items-center gap-1.5">
              <Feather color="#9EA8FF" name="clock" size={12} />
              <AppText className="text-[12px] font-medium text-[#DCE3FF]" numberOfLines={1}>
                {sessionTime}
              </AppText>
              <AppText className="text-[12px] font-medium text-[#DCE3FF]">·</AppText>
              <Feather color="#9EA8FF" name="map-pin" size={12} />
              <AppText className="min-w-0 flex-1 text-[12px] font-medium text-[#DCE3FF]" numberOfLines={1}>
                {locationLabel}
              </AppText>
            </View>
          ) : status !== 'idle' ? (
            <AppText className="mt-0.5 text-[11px] text-[#9EA8FF]" numberOfLines={1}>
              {sessionTime}
            </AppText>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          className={`${isActive ? 'h-10 border-[#B9C2FF]/80 bg-[#9EA8FF]/22 px-4' : 'h-9 border-[#9EA8FF]/70 bg-[#243A75]/70 px-3'} items-center justify-center rounded-full border`}
          onPress={onPrimaryPress}
        >
          <AppText className="text-xs font-semibold text-white">{copy.cta}</AppText>
        </Pressable>

        {status === 'ended' && onDismissEnded ? (
          <Pressable
            accessibilityLabel="여행 종료 카드 닫기"
            accessibilityRole="button"
            className="h-8 w-8 items-center justify-center rounded-full bg-white/10"
            onPress={onDismissEnded}
          >
            <Feather color="#fff" name="x" size={16} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
