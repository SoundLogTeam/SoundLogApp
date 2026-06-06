import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';

import { modeIconByValue, modeLabelByValue, type TravelRecap } from './travelData';

type TravelReportModalProps = {
  item?: TravelRecap;
  onClose: () => void;
  visible: boolean;
};

function ReportShell({
  children,
  colors,
}: {
  children: React.ReactNode;
  colors: [string, string, string];
}) {
  return (
    <LinearGradient
      colors={colors}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={{ borderRadius: 30, minHeight: 470, padding: 24 }}
    >
      {children}
    </LinearGradient>
  );
}

function ReportStat({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-[22px] bg-white/14 p-4">
      <AppText className="text-[11px] font-semibold text-white/62">{label}</AppText>
      <AppText className="mt-2 text-[28px] font-semibold text-white">{value}</AppText>
    </View>
  );
}

export function TravelReportModal({ item, onClose, visible }: TravelReportModalProps) {
  const insets = useSafeAreaInsets();
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    if (visible) {
      setPageIndex(0);
    }
  }, [visible, item?.id]);

  if (!item) {
    return null;
  }

  const modeLabel = modeLabelByValue[item.mode];
  const modeIcon = modeIconByValue[item.mode];
  const mostPlayed = item.topTracks[0];
  const pages = [
    {
      key: 'cover',
      node: (
        <ReportShell colors={['#1DB954', '#132A1D', '#050816']}>
          <View className="flex-1 justify-between">
            <View>
              <AppText className="text-xs font-semibold text-white/70">
                SOUNDLOG TRAVEL REPORT
              </AppText>
              <AppText className="mt-8 text-[64px]">{modeIcon}</AppText>
              <AppText className="mt-5 text-[36px] font-semibold leading-10 text-white">
                {modeLabel}
              </AppText>
              <AppText className="mt-2 text-base text-white/72">{item.date}</AppText>
            </View>
            <View>
              <AppText className="text-sm font-semibold text-white/58">여행 위치</AppText>
              <AppText className="mt-2 text-[24px] font-semibold leading-8 text-white">
                {item.locations.join(' · ')}
              </AppText>
            </View>
          </View>
        </ReportShell>
      ),
    },
    {
      key: 'summary',
      node: (
        <ReportShell colors={['#3B1D75', '#101827', '#050816']}>
          <AppText className="text-[30px] font-semibold leading-9 text-white">
            이 여행에서{'\n'}음악은 이렇게 흘렀어요
          </AppText>
          <View className="mt-8 gap-3">
            <ReportStat
              label="총 음악 재생 시간"
              value={item.playTimeText.replace('총 음악 재생 ', '')}
            />
            <ReportStat label="총 재생 횟수" value={`${item.playCount}회`} />
            <ReportStat label="재생한 음악 종류" value={`${item.trackCount}곡`} />
          </View>
        </ReportShell>
      ),
    },
    {
      key: 'most',
      node: (
        <ReportShell colors={['#FF8A3D', '#321B12', '#050816']}>
          <View className="flex-1 justify-between">
            <View>
              <AppText className="text-xs font-semibold text-white/70">MOST PLAYED</AppText>
              <AppText className="mt-4 text-[30px] font-semibold leading-9 text-white">
                가장 많이 들은 노래
              </AppText>
            </View>
            <View className="rounded-[28px] bg-black/28 p-5">
              <View className="h-28 w-28 items-center justify-center rounded-[28px] bg-white/90">
                <Feather color="#111827" name="music" size={42} />
              </View>
              <AppText className="mt-6 text-[30px] font-semibold leading-9 text-white">
                {mostPlayed.artist} - {mostPlayed.title}
              </AppText>
              <AppText className="mt-3 text-sm text-white/70">
                이 곡만 {mostPlayed.playCount}회 재생했어요.
              </AppText>
            </View>
          </View>
        </ReportShell>
      ),
    },
    {
      key: 'ranking',
      node: (
        <ReportShell colors={['#0F766E', '#0B2A2A', '#050816']}>
          <AppText className="text-[30px] font-semibold leading-9 text-white">
            많이 들은 순위
          </AppText>
          <View className="mt-7 gap-2.5">
            {item.topTracks.map((track, index) => (
              <View
                key={`${track.artist}-${track.title}`}
                className="flex-row items-center rounded-[18px] bg-white/14 px-4 py-3"
              >
                <AppText className="w-8 text-base font-semibold text-soundlog-lime">
                  {index + 1}
                </AppText>
                <View className="min-w-0 flex-1">
                  <AppText className="text-sm font-semibold text-white" numberOfLines={1}>
                    {track.title}
                  </AppText>
                  <AppText className="mt-0.5 text-xs text-white/58" numberOfLines={1}>
                    {track.artist}
                  </AppText>
                </View>
                <AppText className="text-xs font-semibold text-white/70">
                  {track.playCount}회
                </AppText>
              </View>
            ))}
          </View>
        </ReportShell>
      ),
    },
    {
      key: 'unique',
      node: (
        <ReportShell colors={['#1F2937', '#111827', '#050816']}>
          <AppText className="text-[30px] font-semibold leading-9 text-white">
            중복 없이 들은{'\n'}음악 목록
          </AppText>
          <AppText className="mt-3 text-sm text-white/64">
            {item.trackCount}곡 중 대표 곡을 정리했어요.
          </AppText>
          <View className="mt-7 flex-row flex-wrap gap-2">
            {item.uniqueTracks.map((track) => (
              <View key={track} className="rounded-full bg-white/14 px-3 py-2">
                <AppText className="text-sm font-semibold text-white">{track}</AppText>
              </View>
            ))}
          </View>
        </ReportShell>
      ),
    },
    {
      key: 'share',
      node: (
        <ReportShell colors={['#B7E628', '#24330B', '#050816']}>
          <View className="flex-1 justify-between">
            <View>
              <AppText className="text-xs font-semibold text-white/70">SHARE CARD</AppText>
              <AppText className="mt-4 text-[32px] font-semibold leading-10 text-white">
                {modeLabel}의 음악 리포트가 발행됐어요
              </AppText>
            </View>
            <View className="rounded-[26px] bg-black/30 p-5">
              <AppText className="text-sm font-semibold text-soundlog-lime">
                {item.locations[0]}
              </AppText>
              <AppText className="mt-3 text-[24px] font-semibold leading-8 text-white">
                {item.durationText} · {item.playCount}회 재생 · Moment {item.momentCount}
              </AppText>
            </View>
          </View>
        </ReportShell>
      ),
    },
  ];
  const isLastPage = pageIndex === pages.length - 1;

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <View className="flex-1 bg-soundlog-bg" style={{ paddingTop: insets.top + 10 }}>
        <View className="flex-row items-center justify-between px-5">
          <View className="min-w-0 flex-1">
            <AppText className="text-xs font-semibold text-soundlog-lime">Travel Report</AppText>
            <AppText className="mt-1 text-lg font-semibold text-white" numberOfLines={1}>
              {modeLabel} · {item.date}
            </AppText>
          </View>
          <Pressable
            accessibilityLabel="Travel Report 닫기"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
            onPress={onClose}
          >
            <Feather color="#fff" name="x" size={18} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 20,
            paddingTop: 18,
          }}
          showsVerticalScrollIndicator={false}
        >
          {pages[pageIndex].node}

          <View className="mt-5 flex-row justify-center gap-2">
            {pages.map((page, index) => (
              <View
                key={page.key}
                className={`h-1.5 rounded-full ${
                  index === pageIndex ? 'w-8 bg-soundlog-lime' : 'w-2 bg-white/25'
                }`}
              />
            ))}
          </View>

          <View className="mt-5 flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              className="h-12 flex-1 items-center justify-center rounded-full border border-white/15"
              disabled={pageIndex === 0}
              onPress={() => setPageIndex((index) => Math.max(0, index - 1))}
            >
              <AppText
                className={`text-sm font-semibold ${
                  pageIndex === 0 ? 'text-white/30' : 'text-white'
                }`}
              >
                이전
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              className="h-12 flex-1 items-center justify-center rounded-full bg-soundlog-lime"
              onPress={() => {
                if (isLastPage) {
                  onClose();
                  return;
                }

                setPageIndex((index) => Math.min(pages.length - 1, index + 1));
              }}
            >
              <AppText className="text-sm font-semibold text-soundlog-inverse">
                {isLastPage ? '완료' : '다음'}
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
