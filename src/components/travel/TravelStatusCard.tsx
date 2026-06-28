import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import type { PlaceContext, Track, TravelMode } from '@/types/domain';

import { formatDurationText, formatElapsedTime, formatKoreanDateTime, formatShortEndedAt } from './travelFormat';
import { modeIconByValue, modeLabelByValue } from './travelData';

type TravelStatus = 'active' | 'ended' | 'idle';

type TravelStatusCardProps = {
  currentPlace?: PlaceContext;
  currentTrack?: Track;
  endedAt?: string;
  isCreatingRecap?: boolean;
  momentCount: number;
  onEndTravel: () => void;
  onOpenRecap: () => void;
  onSaveMoment: () => void;
  onStartTravel: () => void;
  selectedMode?: TravelMode;
  startedAt?: string;
  status: TravelStatus;
  trackCount?: number;
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[126px] flex-1 rounded-[18px] bg-white/10 p-4">
      <AppText className="text-[11px] font-semibold text-white">{label}</AppText>
      <AppText className="mt-2 text-base font-semibold text-white" numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[126px] flex-1 rounded-[14px] bg-white/10 px-3 py-2.5">
      <AppText className="text-[10px] font-semibold text-white/45">{label}</AppText>
      <AppText className="mt-1 text-sm font-semibold text-white" numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

export function TravelStatusCard({
  currentPlace,
  currentTrack,
  endedAt,
  isCreatingRecap = false,
  momentCount,
  onEndTravel,
  onOpenRecap,
  onSaveMoment,
  onStartTravel,
  selectedMode,
  startedAt,
  status,
  trackCount = 0,
}: TravelStatusCardProps) {
  const modeLabel = selectedMode ? modeLabelByValue[selectedMode] : '미설정';
  const modeIcon = selectedMode ? modeIconByValue[selectedMode] : '🧭';
  const placeLabel = currentPlace?.title ?? '위치 확인 전';
  const currentTrackLabel = currentTrack
    ? `${currentTrack.artist} - ${currentTrack.title}`
    : '재생 중인 음악 없음';

  if (status === 'active') {
    return (
      <View className="overflow-hidden rounded-[22px] border border-soundlog-lime/35 bg-white/10 p-4">
        <View className="flex-row items-center justify-between gap-3">
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            <View className="h-2.5 w-2.5 rounded-full bg-soundlog-lime" />
            <AppText className="text-sm font-semibold text-soundlog-lime">여행 진행 중</AppText>
          </View>
          <View className="rounded-full bg-white/10 px-3 py-1">
            <AppText className="text-xs font-semibold text-white">
              {modeIcon} {modeLabel}
            </AppText>
          </View>
        </View>

        <AppText className="mt-3 text-[24px] font-semibold leading-8 text-white">
          {formatElapsedTime(startedAt)}
        </AppText>
        <AppText className="mt-1 text-xs font-semibold text-white/50">
          {formatKoreanDateTime(startedAt)} 시작
        </AppText>

        <View className="mt-3 flex-row flex-wrap gap-2">
          <CompactMetric label="현재 위치" value={placeLabel} />
          <CompactMetric label="저장한 순간" value={`${momentCount}개`} />
        </View>

        <View className="mt-3 flex-row items-center gap-2 rounded-[16px] border border-white/10 bg-black/20 px-3 py-2.5">
          <Feather color="#B7E628" name="music" size={14} />
          <View className="min-w-0 flex-1">
            <AppText className="text-[10px] font-semibold text-white/45">현재 재생 중</AppText>
            <AppText className="mt-0.5 text-sm font-semibold text-white" numberOfLines={1}>
              {currentTrackLabel}
            </AppText>
          </View>
        </View>

        <View className="mt-3 flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            className="h-11 flex-1 items-center justify-center rounded-full bg-[#FF8A3D]"
            onPress={onEndTravel}
          >
            <AppText className="text-sm font-semibold text-black">여행 종료</AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="h-11 flex-1 items-center justify-center rounded-full border border-white/15 bg-white/10"
            onPress={onSaveMoment}
          >
            <AppText className="text-sm font-semibold text-white">순간 저장</AppText>
          </Pressable>
        </View>
      </View>
    );
  }

  if (status === 'ended') {
    return (
      <View className="rounded-[28px] border border-white/10 bg-white/10 p-5">
        <AppText className="text-[28px] font-semibold text-white">여행이 종료됐어요</AppText>
        <AppText className="mt-2 text-sm leading-6 text-[#9CA3AF]">
          저장한 순간은 Recap에서 다시 확인할 수 있어요.
        </AppText>
        <AppText className="mt-5 text-sm font-semibold text-soundlog-lime">
          {formatShortEndedAt(endedAt)}
        </AppText>

        <View className="mt-5 flex-row flex-wrap gap-3">
          <Metric label="여행 모드" value={modeLabel} />
          <Metric label="총 여행 시간" value={formatDurationText(startedAt, endedAt)} />
          <Metric label="저장한 순간" value={`${momentCount}개`} />
          <Metric label="기록된 음악" value={`${trackCount}곡`} />
        </View>

        <View className="mt-5 flex-row gap-3">
          <Pressable
            accessibilityRole="button"
            className="h-14 flex-1 items-center justify-center rounded-full bg-soundlog-lime"
            disabled={isCreatingRecap || momentCount === 0}
            onPress={onOpenRecap}
            style={{ opacity: isCreatingRecap || momentCount === 0 ? 0.62 : 1 }}
          >
            <AppText className="text-base font-semibold text-soundlog-inverse">
              {isCreatingRecap ? 'Recap 생성 중' : 'Recap 보기'}
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="h-14 flex-1 items-center justify-center rounded-full border border-white/15"
            onPress={onStartTravel}
          >
            <AppText className="text-base font-semibold text-white">새 여행 시작</AppText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="rounded-[30px] border border-white/10 bg-white/10 p-6">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-soundlog-lime">
        <Feather color="#090515" name="navigation" size={24} />
      </View>
      <AppText className="mt-6 text-[30px] font-semibold leading-9 text-white">
        여행을 시작해보세요
      </AppText>
      <AppText className="mt-3 text-base leading-7 text-white">
        현재 위치에 맞는 음악을 추천받고, 여행 중 남긴 순간을 Recap으로 기록할 수 있어요.
      </AppText>
      <Pressable
        accessibilityRole="button"
        className="mt-7 h-14 items-center justify-center rounded-full bg-soundlog-lime"
        onPress={onStartTravel}
      >
        <AppText className="text-base font-semibold text-soundlog-inverse">새 여행 시작</AppText>
      </Pressable>
    </View>
  );
}
