import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/components/MiniPlayer';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { getHomeContentBottomPadding } from '@/constants/layout';
import { useMomentLogStore } from '@/store/momentLogStore';
import { usePlayerStore } from '@/store/playerStore';
import { useTravelSessionStore } from '@/store/travelSessionStore';
import type { TravelMode } from '@/types/domain';

import { EndTravelConfirmModal } from './EndTravelConfirmModal';
import { MomentCard } from './MomentCard';
import { RecapCard } from './RecapCard';
import { TravelModeBottomSheet } from './TravelModeBottomSheet';
import { TravelReportModal } from './TravelReportModal';
import { TravelStatusCard } from './TravelStatusCard';
import { sampleMoments, sampleRecaps, type TravelRecap } from './travelData';

const sampleMomentMusicLogIds: Record<string, string> = {
  'sample-gwangalli': 'log-1',
  'sample-night': 'log-3',
  'sample-seongsu': 'log-2',
};

function getMomentMusicLogId(momentId: string) {
  return sampleMomentMusicLogIds[momentId] ?? momentId;
}

export function TravelScreen() {
  const insets = useSafeAreaInsets();
  const [isModeSheetVisible, setIsModeSheetVisible] = useState(false);
  const [isEndConfirmVisible, setIsEndConfirmVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<TravelRecap>();
  const [, setClockTick] = useState(0);
  const {
    currentPlace,
    selectedMode,
    session,
    endSession,
    resetSession,
    setMode,
    startSession,
  } = useTravelSessionStore();
  const { currentTrack } = usePlayerStore();
  const momentLogs = useMomentLogStore((state) => state.logs);
  const moments = useMemo(
    () => [...momentLogs, ...sampleMoments].slice(0, 3),
    [momentLogs],
  );
  const momentCount = Math.max(momentLogs.length, session.status === 'active' ? 8 : 0);

  useEffect(() => {
    if (session.status !== 'active') {
      return;
    }

    const intervalId = setInterval(() => {
      setClockTick((tick) => tick + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [session.status]);

  const openModeSheet = () => {
    if (session.status === 'ended') {
      resetSession();
    }

    setIsModeSheetVisible(true);
  };
  const handleSelectMode = (mode: TravelMode) => {
    setMode(mode);
  };
  const handleStartTravel = () => {
    if (!selectedMode) {
      setMode('cafe');
    }

    startSession();
    setIsModeSheetVisible(false);
  };
  const handleConfirmEnd = () => {
    endSession();
    setIsEndConfirmVisible(false);
  };

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: getHomeContentBottomPadding(insets.bottom, Boolean(currentTrack)),
          paddingHorizontal: 20,
          paddingTop: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6">
          <AppText className="text-[13px] font-semibold text-soundlog-lime">
            음악으로 기록하는 당신의 여정
          </AppText>
          <AppText className="mt-2 text-[34px] font-semibold leading-10 text-white">
            Travel
          </AppText>
        </View>

        <TravelStatusCard
          currentPlace={currentPlace}
          currentTrack={currentTrack}
          endedAt={session.endedAt}
          momentCount={momentCount}
          onEndTravel={() => setIsEndConfirmVisible(true)}
          onOpenRecap={() => router.push('/recap-share/seoul-night')}
          onSaveMoment={() => router.push('/camera')}
          onStartTravel={openModeSheet}
          selectedMode={selectedMode}
          startedAt={session.startedAt}
          status={session.status}
        />

        <View className="mt-8">
          <View className="flex-row items-center justify-between">
            <View>
              <AppText className="text-xl font-semibold text-white">최근 Moment</AppText>
              <AppText className="mt-1 text-xs text-white/45">여행 중 직접 저장한 순간</AppText>
            </View>
            <Pressable accessibilityRole="button" onPress={() => router.push('/library')}>
              <AppText className="text-xs font-semibold text-soundlog-lime">더보기</AppText>
            </Pressable>
          </View>

          <View className="mt-4 gap-3">
            {moments.map((moment) => (
              <MomentCard
                key={moment.id}
                item={moment}
                onPress={() => router.push(`/recap-share/${getMomentMusicLogId(moment.id)}`)}
              />
            ))}
          </View>
        </View>

        <View className="mt-8">
          <View className="flex-row items-center justify-between">
            <View>
              <AppText className="text-xl font-semibold text-white">Travel Log</AppText>
              <AppText className="mt-1 text-xs text-white/45">
                여행별 음악과 Moment 요약
              </AppText>
            </View>
          </View>

          <View className="mt-4 gap-3">
            {sampleRecaps.slice(0, session.status === 'idle' ? 3 : 2).map((recap) => (
              <RecapCard
                key={recap.id}
                item={recap}
                onPress={() => setSelectedReport(recap)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {currentTrack ? <MiniPlayer /> : null}

      <TravelModeBottomSheet
        onClose={() => setIsModeSheetVisible(false)}
        onSelectMode={handleSelectMode}
        onStart={handleStartTravel}
        selectedMode={selectedMode}
        visible={isModeSheetVisible}
      />
      <EndTravelConfirmModal
        momentCount={momentCount}
        onCancel={() => setIsEndConfirmVisible(false)}
        onConfirm={handleConfirmEnd}
        visible={isEndConfirmVisible}
      />
      <TravelReportModal
        item={selectedReport}
        onClose={() => setSelectedReport(undefined)}
        visible={Boolean(selectedReport)}
      />
    </Screen>
  );
}
