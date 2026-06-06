import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import type { TravelMode } from '@/types/domain';
import { formatRecapRecordedAt } from '@/utils/dateFormat';

type TravelSessionStatus = 'active' | 'ended' | 'idle';

type TravelSessionCardProps = {
  endedAt?: string;
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
  { label: '축제', value: 'festival' },
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
    description: '순간 저장과 Music Log가 지금 여행에 함께 묶이고 있어요.',
    icon: 'radio',
    title: '여행 기록 중',
  },
  ended: {
    cta: '리캡 보기',
    description: '저장한 순간은 Recap에서 다시 확인할 수 있어요.',
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

  return (
    <View className="rounded-[20px] border border-white/10 bg-white/10 px-4 py-3.5">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
          <Feather color="#fff" name={copy.icon} size={18} />
        </View>

        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <AppText className="shrink text-base font-semibold text-white" numberOfLines={1}>
              {copy.title}
            </AppText>
            {status === 'active' && selectedModeLabel ? (
              <View className="rounded-full bg-white/10 px-2 py-1">
                <AppText className="text-[10px] font-semibold text-white/70">
                  {selectedModeLabel}
                </AppText>
              </View>
            ) : null}
          </View>
          <AppText className="mt-1 text-xs text-[#9EA8FF]" numberOfLines={1}>
            {sessionTime}
          </AppText>
        </View>

        <Pressable
          accessibilityRole="button"
          className="h-10 items-center justify-center rounded-full border border-[#9EA8FF]/70 bg-[#243A75]/70 px-4"
          onPress={onPrimaryPress}
        >
          <AppText className="text-xs font-semibold text-white">{copy.cta}</AppText>
        </Pressable>

        {status === 'ended' && onDismissEnded ? (
          <Pressable
            accessibilityLabel="여행 종료 카드 닫기"
            accessibilityRole="button"
            className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
            onPress={onDismissEnded}
          >
            <Feather color="#fff" name="x" size={16} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
