import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Chip } from '@/components/Chip';
import { TravelMode } from '@/types/domain';
import { formatRecapRecordedAt } from '@/utils/dateFormat';

type TravelSessionStatus = 'active' | 'ended' | 'idle';

type TravelSessionCardProps = {
  endedAt?: string;
  onEndSession: () => void;
  onOpenRecap: () => void;
  onSelectMode: (mode: TravelMode) => void;
  onStartSession: () => void;
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
    cta: '여행 종료',
    description: '순간 저장과 Music Log가 지금 여행에 함께 묶이고 있어요.',
    icon: 'radio',
    title: '여행 기록 중',
  },
  ended: {
    cta: '새 여행 시작',
    description: '저장한 순간은 Recap에서 다시 확인할 수 있어요.',
    icon: 'check-circle',
    title: '여행이 종료됐어요',
  },
  idle: {
    cta: '여행 시작',
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
  onEndSession,
  onOpenRecap,
  onSelectMode,
  onStartSession,
  selectedMode,
  startedAt,
  status,
}: TravelSessionCardProps) {
  const copy = statusCopy[status];
  const onPrimaryPress = status === 'active' ? onEndSession : onStartSession;

  return (
    <View className="rounded-[22px] border border-white/10 bg-white/10 p-5">
      <View className="flex-row items-start gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-white/10">
          <Feather color="#fff" name={copy.icon} size={19} />
        </View>

        <View className="min-w-0 flex-1">
          <AppText className="text-base font-semibold text-white">{copy.title}</AppText>
          <AppText className="mt-2 text-sm leading-6 text-white/55">{copy.description}</AppText>
          <AppText className="mt-3 text-xs text-[#9EA8FF]">
            {formatSessionTime(status, startedAt, endedAt)}
          </AppText>
        </View>
      </View>

      <View className="mt-5">
        <AppText className="mb-3 text-xs font-semibold text-white/45">여행 모드</AppText>
        <View className="flex-row flex-wrap gap-2">
          {travelModeOptions.map((mode) => (
            <Chip
              key={mode.value}
              label={mode.label}
              onPress={() => onSelectMode(mode.value)}
              selected={selectedMode === mode.value}
            />
          ))}
        </View>
      </View>

      <View className="mt-5 flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          className="h-11 flex-1 items-center justify-center rounded-full bg-white"
          onPress={onPrimaryPress}
        >
          <AppText className="text-sm font-semibold text-[#050916]">{copy.cta}</AppText>
        </Pressable>

        {status === 'ended' ? (
          <Pressable
            accessibilityRole="button"
            className="h-11 flex-1 items-center justify-center rounded-full border border-white/15"
            onPress={onOpenRecap}
          >
            <AppText className="text-sm font-semibold text-white/80">Recap 보기</AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
