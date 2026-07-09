import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';

import { modeIconByValue, modeLabelByValue, sampleMoments, type TravelRecap } from './travelData';

type TravelReportModalProps = {
  item?: TravelRecap;
  onClose: () => void;
  visible: boolean;
};

type StoryPage = {
  accent: string;
  hideBottomBar?: boolean;
  hideGrayCircle?: boolean;
  hideInnerCircles?: boolean;
  hideShapes?: boolean;
  key: string;
  node: React.ReactNode;
  palette: [string, string, string];
};

const STORY_DURATION_MS = 4200;
const STORY_PAGE_COUNT = 6;

function CoverGeometry({ accent }: { accent: string }) {
  return (
    <>
      <View className="absolute left-8 top-24 h-44 w-44 rounded-full" style={{ backgroundColor: accent }} />
      <View className="absolute -right-10 top-28 h-36 w-36 bg-black" style={{ transform: [{ rotate: '24deg' }] }} />
      <View className="absolute right-10 top-[246px] h-20 w-20 bg-[#D7D0C4]" style={{ transform: [{ rotate: '45deg' }] }} />
      <View className="absolute left-6 top-[324px] h-4 w-28 bg-black" style={{ transform: [{ rotate: '-12deg' }] }} />
      <View className="absolute left-[132px] top-[370px] h-3 w-20 bg-[#FF352B]" style={{ transform: [{ rotate: '18deg' }] }} />
      <View className="absolute bottom-40 left-8 h-24 w-24 border-[10px] border-black" style={{ transform: [{ rotate: '18deg' }] }} />
      <View
        className="absolute bottom-[186px] right-12"
        style={{
          borderBottomColor: '#111111',
          borderBottomWidth: 72,
          borderLeftColor: 'transparent',
          borderLeftWidth: 42,
          borderRightColor: 'transparent',
          borderRightWidth: 42,
          height: 0,
          transform: [{ rotate: '-10deg' }],
          width: 0,
        }}
      />
      <View className="absolute bottom-24 right-4 h-4 w-32 bg-[#D7D0C4]" style={{ transform: [{ rotate: '-18deg' }] }} />
      <View className="absolute bottom-16 left-20 h-3 w-40 bg-black" />
    </>
  );
}

function DotPattern({ color = 'rgba(255,255,255,0.16)' }: { color?: string }) {
  return (
    <View className="absolute inset-0">
      {Array.from({ length: 42 }).map((_, index) => {
        const row = Math.floor(index / 7);
        const column = index % 7;

        return (
          <View
            key={index}
            className="absolute h-2 w-2 rounded-full"
            style={{
              backgroundColor: color,
              left: 22 + column * 54 + (row % 2) * 20,
              opacity: index % 3 === 0 ? 0.9 : 0.48,
              top: 116 + row * 78,
            }}
          />
        );
      })}
    </View>
  );
}

function StoryBackdrop({
  accent,
  hideBottomBar = false,
  hideGrayCircle = false,
  hideInnerCircles = false,
  hideShapes = false,
  minimal = false,
  pattern,
}: {
  accent: string;
  hideBottomBar?: boolean;
  hideGrayCircle?: boolean;
  hideInnerCircles?: boolean;
  hideShapes?: boolean;
  minimal?: boolean;
  pattern?: 'dots';
}) {
  return (
    <View style={StyleSheet.absoluteFill}>
      {pattern === 'dots' ? <DotPattern /> : null}
      {minimal ? (
        <CoverGeometry accent={accent} />
      ) : hideShapes ? null : (
        <>
          <View className="absolute left-10 top-28 h-44 w-44 rounded-full" style={{ backgroundColor: accent }} />
          {hideInnerCircles ? null : (
            <View className="absolute left-[86px] top-[154px] h-24 w-24 rounded-full bg-black" />
          )}
          <View className="absolute -right-10 top-24 h-40 w-40 rounded-full bg-black" />
          {hideGrayCircle ? null : (
            <View className="absolute bottom-24 right-6 h-52 w-52 rounded-full bg-[#273238]" />
          )}
          {hideInnerCircles ? null : (
            <View className="absolute bottom-32 right-16 h-20 w-20 rounded-full bg-black" />
          )}
          {hideBottomBar ? null : (
            <View
              className="absolute bottom-6 left-0 right-0 h-[132px]"
              style={{ backgroundColor: accent }}
            />
          )}
        </>
      )}
    </View>
  );
}

function ProgressBars({ currentIndex, total }: { currentIndex: number; total: number }) {
  return (
    <View className="flex-row gap-1.5">
      {Array.from({ length: total }).map((_, index) => (
        <View key={index} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
          <View
            className="h-full rounded-full bg-white"
            style={{ width: index <= currentIndex ? '100%' : '0%' }}
          />
        </View>
      ))}
    </View>
  );
}

function StoryShell({
  accent,
  children,
  hideBottomBar,
  hideGrayCircle,
  hideInnerCircles,
  hideShapes,
  minimalBackdrop,
  palette,
  pattern,
}: {
  accent: string;
  children: React.ReactNode;
  hideBottomBar?: boolean;
  hideGrayCircle?: boolean;
  hideInnerCircles?: boolean;
  hideShapes?: boolean;
  minimalBackdrop?: boolean;
  palette: [string, string, string];
  pattern?: 'dots';
}) {
  return (
    <LinearGradient
      colors={palette}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={StyleSheet.absoluteFill}
    >
      <StoryBackdrop
        accent={accent}
        hideBottomBar={hideBottomBar}
        hideGrayCircle={hideGrayCircle}
        hideInnerCircles={hideInnerCircles}
        hideShapes={hideShapes}
        minimal={minimalBackdrop}
        pattern={pattern}
      />
      <View className="relative flex-1 px-6 pb-9 pt-0" style={{ zIndex: 1 }}>
        {children}
      </View>
    </LinearGradient>
  );
}

function SmallCaps({ children }: { children: React.ReactNode }) {
  return (
    <AppText className="text-[11px] font-semibold uppercase tracking-[2px] text-white">
      {children}
    </AppText>
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

  useEffect(() => {
    if (!visible) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setPageIndex((index) => {
        if (index >= STORY_PAGE_COUNT - 1) {
          return index;
        }

        return index + 1;
      });
    }, STORY_DURATION_MS);

    return () => clearTimeout(timeoutId);
  }, [pageIndex, visible]);

  if (!item) {
    return null;
  }

  const modeLabel = modeLabelByValue[item.mode];
  const modeIcon = modeIconByValue[item.mode];
  const mostPlayed = item.topTracks[0];
  const [startedAtText = item.periodText, rawEndedAtText = item.periodText] = item.periodText
    .split(' - ')
    .map((value) => value.trim());
  const startedDateText = startedAtText.split(' ')[0] ?? '';
  const endedAtText = rawEndedAtText.includes('.')
    ? rawEndedAtText
    : `${startedDateText} ${rawEndedAtText}`.trim();
  const recapThumbnails = [sampleMoments[0], sampleMoments[1], sampleMoments[0]].filter(Boolean);
  const pages: StoryPage[] = [
    {
      accent: '#F2C94C',
      hideBottomBar: true,
      hideInnerCircles: true,
      key: 'cover',
      palette: ['#070B1F', '#070B1F', '#070B1F'],
      node: (
        <View className="flex-1 justify-between">
          <View>
            <AppText className="text-[11px] font-semibold uppercase tracking-[2px] text-white/70">
              Soundlog
            </AppText>
            <AppText className="mt-5 text-[58px] font-semibold leading-[58px] text-white">
              Travel{'\n'}Recap
            </AppText>
            <AppText className="mt-5 text-[64px]">{modeIcon}</AppText>
            <AppText className="mt-2 text-[32px] font-semibold leading-9 text-white">
              {modeLabel} 기록
            </AppText>
            <View className="mt-4 gap-1">
              <AppText className="text-base font-semibold text-white">
                {endedAtText}
              </AppText>
              <AppText className="text-base font-semibold text-white">
                {startedAtText}
              </AppText>
            </View>
          </View>
          <View className="items-end">
            <AppText className="text-[11px] font-semibold uppercase tracking-[2px] text-white/70">
              Travel location
            </AppText>
            <AppText className="mt-3 text-right text-[26px] font-semibold leading-8 text-white">
              {item.locations.join('\n')}
            </AppText>
          </View>
        </View>
      ),
    },
    {
      accent: '#FF352B',
      hideBottomBar: true,
      hideInnerCircles: true,
      key: 'summary',
      palette: ['#F2C94C', '#F2C94C', '#F2C94C'],
      node: (
        <View className="flex-1 justify-between">
          <View>
            <AppText className="text-[11px] font-semibold uppercase tracking-[2px] text-white">
              Music records
            </AppText>
            <AppText className="mt-8 text-[64px] font-semibold leading-[68px] text-white">
              {item.playTimeText.replace('음악 기록 ', '')}
            </AppText>
            <AppText className="mt-4 text-xl font-semibold leading-7 text-white">
              음악으로 남긴{'\n'}{item.durationText}
            </AppText>
          </View>
          <View className="gap-7">
            <View>
              <AppText className="text-[11px] font-semibold uppercase tracking-[2px] text-white">
                Saved music
              </AppText>
              <AppText className="mt-1 text-[72px] font-semibold leading-[76px] text-white">
                {item.playCount}
              </AppText>
              <AppText className="text-xl font-semibold text-white">회 기록</AppText>
            </View>
            <View className="items-end">
              <AppText className="text-[11px] font-semibold uppercase tracking-[2px] text-white">
                Unique tracks
              </AppText>
              <AppText className="mt-1 text-[64px] font-semibold leading-[68px] text-white">
                {item.trackCount}
              </AppText>
              <AppText className="text-lg font-semibold text-white">곡 감상</AppText>
            </View>
          </View>
        </View>
      ),
    },
    {
      accent: '#FF352B',
      hideInnerCircles: true,
      key: 'most',
      palette: ['#07131A', '#07131A', '#111C22'],
      node: (
        <View className="flex-1 justify-between">
          <View>
            <SmallCaps>Most recorded</SmallCaps>
            <AppText className="mt-8 text-[38px] font-semibold leading-[44px] text-white">
              이 여행에서{'\n'}가장 많이 기록한 노래
            </AppText>
          </View>
          <View className="items-center">
            <View className="h-64 w-64 items-center justify-center rounded-full bg-black">
              <View className="h-52 w-52 items-center justify-center rounded-full border border-white/16 bg-[#161A1D]">
                <View className="h-40 w-40 items-center justify-center rounded-full border border-white/12 bg-black">
                  <View className="h-24 w-24 items-center justify-center rounded-full bg-[#FF352B]">
                    <View className="h-8 w-8 rounded-full bg-[#07131A]" />
                  </View>
                </View>
              </View>
            </View>
          </View>
          <View className="h-[116px] justify-center">
            <AppText className="text-center text-[32px] font-semibold leading-9 text-white">
              {mostPlayed.title}
            </AppText>
            <AppText className="mt-2 text-center text-base font-semibold text-white/72">
              {mostPlayed.artist} · {mostPlayed.playCount}회 기록
            </AppText>
          </View>
        </View>
      ),
    },
    {
      accent: '#F2C94C',
      hideInnerCircles: true,
      hideBottomBar: true,
      key: 'ranking',
      palette: ['#FF352B', '#FF352B', '#FF352B'],
      node: (
        <View className="flex-1 justify-between">
          <View>
            <SmallCaps>Top songs</SmallCaps>
            <AppText className="mt-5 text-[36px] font-semibold leading-10 text-white">
              많이 기록한 순위
            </AppText>
          </View>
          <View className="gap-5">
            {item.topTracks.map((track, index) => (
              <View key={`${track.artist}-${track.title}`} className="flex-row items-center gap-4">
                <AppText className="w-8 text-[36px] font-semibold text-white">{index + 1}</AppText>
                <View className="h-14 w-14 rounded-[12px] bg-white/90" />
                <View className="min-w-0 flex-1">
                  <AppText className="text-base font-semibold text-white" numberOfLines={1}>
                    {track.title}
                  </AppText>
                  <AppText className="mt-1 text-sm text-white" numberOfLines={1}>
                    {track.artist}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
          <View />
        </View>
      ),
    },
    {
      accent: '#FF352B',
      hideBottomBar: true,
      hideGrayCircle: true,
      hideInnerCircles: true,
      key: 'recaps',
      palette: ['#F2C94C', '#F2C94C', '#F2C94C'],
      node: (
        <View className="flex-1 justify-between">
          <View>
            <SmallCaps>Saved recaps</SmallCaps>
            <AppText className="mt-8 text-[38px] font-semibold leading-[44px] text-white">
              이 여행에서{'\n'}남긴 기록
            </AppText>
          </View>
          <View>
            <AppText className="text-[86px] font-semibold leading-[92px] text-white">
              {item.momentCount}
            </AppText>
            <AppText className="text-xl font-semibold text-white">개의 Recap</AppText>
          </View>
          <View className="rounded-[30px] bg-white/20 p-3">
            <View className="flex-row items-center justify-center gap-3">
              {recapThumbnails.map((moment, index) => (
                <View
                  key={`${moment.id}-${index}`}
                  className="flex-1 overflow-hidden rounded-[22px]"
                  style={{ height: 154 }}
                >
                  {moment.photoUri ? (
                    <Image
                      className="h-full w-full"
                      resizeMode="cover"
                      source={{ uri: moment.photoUri }}
                    />
                  ) : (
                    <View
                      className="h-full w-full items-center justify-center"
                      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                    >
                      <Feather color="rgba(255,255,255,0.82)" name="music" size={26} />
                      <AppText className="mt-2 text-center text-xs font-semibold text-white/80">
                        음악 기록
                      </AppText>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>
      ),
    },
    {
      accent: '#FF352B',
      hideBottomBar: true,
      hideInnerCircles: true,
      key: 'share',
      palette: ['#07131A', '#07131A', '#111C22'],
      node: (
        <View className="flex-1 justify-between">
          <View>
            <SmallCaps>Travel summary</SmallCaps>
            <AppText className="mt-8 text-[40px] font-semibold leading-[46px] text-white">
              숫자로 남은{'\n'}이번 여행
            </AppText>
          </View>
          <View className="gap-5">
            <View>
              <AppText className="text-[11px] font-semibold uppercase tracking-[2px] text-white/70">
                Travel time
              </AppText>
              <AppText className="mt-1 text-[44px] font-semibold leading-[48px] text-white">
                {item.durationText.replace('의 여행', '')}
              </AppText>
            </View>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <AppText className="text-[11px] font-semibold uppercase tracking-[2px] text-white/70">
                  Records
                </AppText>
                <AppText className="mt-1 text-[52px] font-semibold leading-[56px] text-white">
                  {item.playCount}
                </AppText>
              </View>
              <View className="flex-1 items-end">
                <AppText className="text-[11px] font-semibold uppercase tracking-[2px] text-white/70">
                  Tracks
                </AppText>
                <AppText className="mt-1 text-[52px] font-semibold leading-[56px] text-white">
                  {item.trackCount}
                </AppText>
              </View>
            </View>
            <View className="items-end">
              <AppText className="text-[11px] font-semibold uppercase tracking-[2px] text-white/70">
                Moments
              </AppText>
              <AppText className="mt-1 text-[64px] font-semibold leading-[68px] text-white">
                {item.momentCount}
              </AppText>
            </View>
          </View>
          <View>
            <AppText className="text-[11px] font-semibold uppercase tracking-[2px] text-white/70">
              Mode
            </AppText>
            <AppText className="mt-3 text-[28px] font-semibold leading-8 text-white">
              {modeIcon} {modeLabel}
            </AppText>
          </View>
        </View>
      ),
    },
  ];

  const goPrevious = () => setPageIndex((index) => Math.max(0, index - 1));
  const goNext = () => setPageIndex((index) => Math.min(pages.length - 1, index + 1));
  const currentPage = pages[pageIndex];

  return (
    <Modal animationType="fade" onRequestClose={onClose} visible={visible}>
      <View className="flex-1 bg-[#07131A]">
        <StoryShell
          accent={currentPage.accent}
          hideBottomBar={currentPage.hideBottomBar}
          hideGrayCircle={currentPage.hideGrayCircle}
          hideInnerCircles={currentPage.hideInnerCircles}
          hideShapes={currentPage.hideShapes}
          palette={currentPage.palette}
          pattern={currentPage.key === 'summary' ? 'dots' : undefined}
        >
          <View style={{ paddingTop: 8, zIndex: 6 }}>
            <ProgressBars currentIndex={pageIndex} total={pages.length} />
            <View className="mt-4 flex-row items-center justify-between">
              <AppText className="text-xs font-semibold text-white/70">
                Soundlog · Travel Recap
              </AppText>
              <Pressable
                accessibilityLabel="Travel Report 닫기"
                accessibilityRole="button"
                className="h-9 w-9 items-center justify-center rounded-full bg-white/12"
                onPress={onClose}
                style={{ zIndex: 8 }}
              >
                <Feather color="#fff" name="x" size={17} />
              </Pressable>
            </View>
          </View>

          <View className="flex-1">{currentPage.node}</View>

          <Pressable
            accessibilityLabel="이전 리포트 페이지"
            accessibilityRole="button"
            onPress={goPrevious}
            style={{
              bottom: 0,
              left: 0,
              position: 'absolute',
              top: insets.top + 104,
              width: '50%',
              zIndex: 3,
            }}
          />
          <Pressable
            accessibilityLabel="다음 리포트 페이지"
            accessibilityRole="button"
            onPress={goNext}
            style={{
              bottom: 0,
              position: 'absolute',
              right: 0,
              top: insets.top + 104,
              width: '50%',
              zIndex: 3,
            }}
          />
        </StoryShell>
      </View>
    </Modal>
  );
}
