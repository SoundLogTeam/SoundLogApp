import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { recapApi } from '@/api/recapApi';
import { useRecapShareQuery } from '@/api/recapQueries';
import { AppText } from '@/components/AppText';
import { RecapMusicSummary } from '@/components/recap-share/RecapMusicSummary';
import { RecapPreviewCard } from '@/components/recap-share/RecapPreviewCard';
import {
  RecapShareEmptyState,
  RecapShareErrorState,
  RecapShareLoadingState,
} from '@/components/recap-share/RecapShareState';
import { RecapSoundLogList } from '@/components/recap-share/RecapSoundLogList';
import { RecapTravelSummaryCard } from '@/components/recap-share/RecapTravelSummaryCard';
import { Screen } from '@/components/Screen';
import { getTabBarHeight } from '@/constants/layout';
import { useMomentLogStore } from '@/store/momentLogStore';
import { useTravelSessionStore } from '@/store/travelSessionStore';
import type { RecapShare, RecapVisibility } from '@/types/domain';
import { formatRecapRecordedAt } from '@/utils/dateFormat';
import {
  createMomentLogGroups,
  extractSessionIdFromRecapId,
  momentLogGroupToRecapShare,
  momentLogToRecapShare,
} from '@/utils/recapMappers';

type RecapShareScreenProps = {
  recapId?: string;
};

function isTravelLogRecap(recap?: RecapShare | null) {
  return (recap?.moments?.length ?? 0) > 1;
}

function createRecapTitle(recap?: RecapShare | null) {
  if (!recap) {
    return '리캡';
  }

  return isTravelLogRecap(recap) ? `${recap.placeName} 여행 로그` : `${recap.placeName} 리캡`;
}

export function RecapShareScreen({ recapId }: RecapShareScreenProps) {
  const insets = useSafeAreaInsets();
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [visibility, setVisibility] = useState<RecapVisibility>('private');
  const [visibilityMessage, setVisibilityMessage] = useState<string>();
  const momentLogs = useMomentLogStore((state) => state.logs);
  const session = useTravelSessionStore((state) => state.session);
  const sessionId = extractSessionIdFromRecapId(recapId);
  const localMomentGroup = useMemo(
    () =>
      sessionId
        ? createMomentLogGroups(momentLogs).find((group) => group.sessionId === sessionId)
        : undefined,
    [momentLogs, sessionId],
  );
  const localMomentLog = sessionId
    ? undefined
    : momentLogs.find((item) => item.id === recapId);
  const localRecap = localMomentGroup
    ? momentLogGroupToRecapShare(
        localMomentGroup,
        localMomentGroup.sessionId === session.id
          ? {
              endedAt: session.endedAt,
              routePoints: session.routePoints,
              startedAt: session.startedAt,
            }
          : {},
      )
    : localMomentLog
      ? momentLogToRecapShare(localMomentLog)
      : undefined;
  const isLocalRecap = Boolean(localRecap);
  const {
    data: remoteRecap,
    isError,
    isLoading,
    refetch,
  } = useRecapShareQuery(recapId, { enabled: Boolean(recapId) && !localRecap });
  const recap = localRecap ?? remoteRecap;
  const isTravelLog = isTravelLogRecap(recap);
  const itemLabel = isTravelLog ? '로그' : '리캡';
  const handleChangeVisibility = async (nextVisibility: RecapVisibility) => {
    if (!recap || isUpdatingVisibility) {
      return;
    }

    if (isLocalRecap) {
      setVisibilityMessage(`서버에 저장된 ${itemLabel}만 공개 범위를 바꿀 수 있어요.`);
      return;
    }

    setIsUpdatingVisibility(true);
    setVisibilityMessage(undefined);

    try {
      await recapApi.updateRecapVisibility(recap.id, nextVisibility);
      setVisibility(nextVisibility);
      setVisibilityMessage(
        nextVisibility === 'public'
          ? '전체공개로 바꿨어요. 현재 위치 300m 이내 지도에 리캡 핀이 남아요.'
          : '나만보기로 바꿨어요. 다른 사람의 지도에는 보이지 않아요.',
      );
      void refetch();
    } catch {
      setVisibilityMessage('공개 범위를 바꾸지 못했어요. 위치가 없는 리캡은 전체공개할 수 없어요.');
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  useEffect(() => {
    if (recap?.visibility) {
      setVisibility(recap.visibility);
    }
  }, [recap?.visibility]);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          alignItems: 'center',
          paddingBottom: getTabBarHeight(insets.bottom) + 28,
          paddingHorizontal: 20,
          paddingTop: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <AppText className="text-center text-[30px] font-semibold leading-9 text-white">
          {createRecapTitle(recap)}
        </AppText>
        <AppText className="mt-3 max-w-[320px] text-center text-sm leading-6 text-white/58">
          {recap
            ? isTravelLog
              ? '여행모드에서 남긴 기록들이 하나의 로그로 묶였어요.'
              : '여행모드 밖에서 만든 단발 기록이에요.'
            : '리캡과 로그를 불러오고 있어요.'}
        </AppText>

        {recap ? (
          <View className="mt-4 items-center">
            <View className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2">
              <AppText className="text-xs font-semibold text-white/58">
                {formatRecapRecordedAt(recap.recordedAt)}
              </AppText>
            </View>

            <View className="mt-4 flex-row rounded-full border border-white/10 bg-white/[0.06] p-1">
              {(['private', 'public'] as RecapVisibility[]).map((option) => {
                const selected = visibility === option;

                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isUpdatingVisibility, selected }}
                    className={`min-h-[38px] min-w-[92px] items-center justify-center rounded-full px-4 ${
                      selected ? 'bg-soundlog-lime' : 'bg-transparent'
                    }`}
                    disabled={isUpdatingVisibility}
                    key={option}
                    onPress={() => void handleChangeVisibility(option)}
                  >
                    <AppText
                      className={`text-xs font-semibold ${
                        selected ? 'text-soundlog-inverse' : 'text-white/60'
                      }`}
                    >
                      {option === 'public' ? '전체공개' : '나만보기'}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            {visibilityMessage ? (
              <AppText className="mt-3 max-w-[320px] text-center text-xs leading-5 text-white/55">
                {visibilityMessage}
              </AppText>
            ) : null}
          </View>
        ) : null}

        <View className="mt-7 w-full items-center">
          {isLoading && !localRecap ? (
            <RecapShareLoadingState />
          ) : isError ? (
            <RecapShareErrorState onRetry={() => refetch()} />
          ) : !recap ? (
            <RecapShareEmptyState />
          ) : (
            <>
              {isLocalRecap ? (
                <View className="mb-5 w-full rounded-[16px] border border-amber-300/20 bg-amber-300/10 px-4 py-3">
                  <AppText className="text-center text-xs leading-5 text-amber-100">
                    서버 동기화 전 로컬 {itemLabel}이에요. 리캡 동기화 후 서버에 저장할 수 있어요.
                  </AppText>
                </View>
              ) : null}

              <View className="mb-5 h-[420px] w-full max-w-[340px] self-center">
                <RecapPreviewCard
                  musicSticker={{ template: 'badge', theme: 'glass', visible: false }}
                  recap={recap}
                  template="map"
                />
              </View>

              <View className="w-full">
                <RecapTravelSummaryCard recap={recap} />
              </View>

              <View className="mt-5 w-full">
                <RecapSoundLogList recap={recap} />
              </View>

              <View className="mt-5 w-full">
                <RecapMusicSummary recap={recap} />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
