import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState } from 'react';
import {
  GestureResponderEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRecentMusicLogsQuery } from '@/api/homeQueries';
import { recapApi } from '@/api/recapApi';
import { recapQueryKeys, useRecapListQuery } from '@/api/recapQueries';
import { AppText } from '@/components/AppText';
import { MusicLogSection } from '@/components/home/MusicLogSection';
import { RecapEmptyState } from '@/components/recap/RecapEmptyState';
import { Screen } from '@/components/Screen';
import { getTabBarHeight } from '@/constants/layout';
import {
  momentLogToMusicLogItem,
  useMomentLogStore,
} from '@/store/momentLogStore';
import type { MusicLogItem, RecapItem, RecapVisibility } from '@/types/domain';
import {
  createMomentLogGroups,
  momentLogGroupToRecapItem,
} from '@/utils/recapMappers';

type LogFeedTabId = 'others' | 'all';

type LogGridEntry = {
  imageUrl?: string;
  item: RecapItem;
  owner: 'mine' | 'other';
  shareId: string;
  source: 'local' | 'server';
};

const logFeedTabs: Array<{
  description: string;
  label: string;
  value: LogFeedTabId;
}> = [
  {
    description: '공개된 장소 로그를 낯선 사람의 시선으로 둘러봐요.',
    label: '다른사람 보기',
    value: 'others',
  },
  {
    description: '내 로그와 공개 로그를 한 번에 보고 공개 범위도 관리해요.',
    label: '모든 사람 보기',
    value: 'all',
  },
];

function sortEntriesByCreatedAt(entries: LogGridEntry[]) {
  return [...entries].sort(
    (first, second) =>
      new Date(second.item.createdAt).getTime() -
      new Date(first.item.createdAt).getTime(),
  );
}

function dedupeEntries(entries: LogGridEntry[]) {
  const seenKeys = new Set<string>();

  return entries.filter((entry) => {
    const key = `${entry.source}:${entry.shareId}`;

    if (seenKeys.has(key)) {
      return false;
    }

    seenKeys.add(key);
    return true;
  });
}

function getEntryImageUrl(entry: LogGridEntry) {
  return entry.imageUrl ?? entry.item.representativeTrack.albumImageUrl;
}

function getVisibilityLabel(visibility?: RecapVisibility) {
  return visibility === 'public' ? '공개' : '비공개';
}

function getMomentCountLabel(item: RecapItem) {
  if (item.momentCount && item.momentCount > 1) {
    return `${item.momentCount}개`;
  }

  return '1개';
}

type LogGridCardProps = {
  entry: LogGridEntry;
  isMine: boolean;
  isUpdating: boolean;
  onChangeVisibility: (
    entry: LogGridEntry,
    visibility: RecapVisibility,
    event: GestureResponderEvent,
  ) => void;
  onPress: () => void;
};

function LogGridCard({
  entry,
  isMine,
  isUpdating,
  onChangeVisibility,
  onPress,
}: LogGridCardProps) {
  const imageUrl = getEntryImageUrl(entry);
  const visibility = entry.item.visibility ?? 'private';
  const nextVisibility: RecapVisibility =
    visibility === 'public' ? 'private' : 'public';
  const canChangeVisibility = entry.source === 'server';

  return (
    <Pressable
      accessibilityLabel={`${entry.item.title} 자세히 보기`}
      accessibilityRole="button"
      className="overflow-hidden rounded-lg border border-white/10 bg-white/10"
      onPress={onPress}
      style={styles.gridCard}
    >
      {imageUrl ? (
        <Image
          contentFit="cover"
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          transition={180}
        />
      ) : (
        <LinearGradient
          colors={['#241747', '#1D365C', '#121829']}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <LinearGradient
        colors={['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.76)']}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View className="absolute left-2 top-2 rounded-full bg-black/42 px-2 py-1">
        <AppText className="text-[10px] font-semibold text-white/82">
          {getMomentCountLabel(entry.item)}
        </AppText>
      </View>

      {isMine ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: isUpdating || !canChangeVisibility }}
          className={`absolute right-2 top-2 rounded-full px-2 py-1 ${
            visibility === 'public' ? 'bg-soundlog-lime' : 'bg-black/48'
          }`}
          disabled={isUpdating}
          onPress={(event) => onChangeVisibility(entry, nextVisibility, event)}
          style={{ opacity: canChangeVisibility ? 1 : 0.62 }}
        >
          <AppText
            className={`text-[10px] font-semibold ${
              visibility === 'public'
                ? 'text-soundlog-inverse'
                : 'text-white/80'
            }`}
          >
            {isUpdating ? '변경중' : getVisibilityLabel(visibility)}
          </AppText>
        </Pressable>
      ) : null}

      <View className="absolute bottom-0 left-0 right-0 p-2">
        <AppText className="text-[11px] font-semibold text-white" numberOfLines={1}>
          {entry.item.placeName}
        </AppText>
        <View className="mt-1 flex-row items-center gap-1">
          <Feather color="rgba(255,255,255,0.68)" name="music" size={10} />
          <AppText className="min-w-0 flex-1 text-[10px] text-white/68" numberOfLines={1}>
            {entry.item.representativeTrack.title}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

export function RecapListScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const momentLogs = useMomentLogStore((state) => state.logs);
  const [selectedTab, setSelectedTab] = useState<LogFeedTabId>('others');
  const [updatingRecapId, setUpdatingRecapId] = useState<string>();
  const [actionMessage, setActionMessage] = useState<string>();
  const recentMusicLogsQuery = useRecentMusicLogsQuery();
  const mineRecapsQuery = useRecapListQuery('mine');
  const otherRecapsQuery = useRecapListQuery('others');
  const contentBottomPadding = getTabBarHeight(insets.bottom) + 56;
  const isLoading = mineRecapsQuery.isLoading || otherRecapsQuery.isLoading;
  const isError = mineRecapsQuery.isError || otherRecapsQuery.isError;

  const serverMineEntries: LogGridEntry[] = useMemo(
    () =>
      (mineRecapsQuery.data ?? []).map((item) => ({
        imageUrl: item.representativeTrack.albumImageUrl,
        item,
        owner: 'mine' as const,
        shareId: item.id,
        source: 'server',
      })),
    [mineRecapsQuery.data],
  );
  const serverSessionIds = useMemo(
    () =>
      new Set(
        serverMineEntries
          .map(({ item }) => item.sessionId)
          .filter(Boolean),
      ),
    [serverMineEntries],
  );
  const localEntries: LogGridEntry[] = useMemo(
    () =>
      createMomentLogGroups(momentLogs)
        .map((group) => ({
          imageUrl: group.logs[0]?.photoUri,
          item: momentLogGroupToRecapItem(group),
          owner: 'mine' as const,
          shareId: group.id,
          source: 'local' as const,
        }))
        .filter(({ item }) => !item.sessionId || !serverSessionIds.has(item.sessionId)),
    [momentLogs, serverSessionIds],
  );
  const otherEntries = useMemo(
    () =>
      sortEntriesByCreatedAt(
        (otherRecapsQuery.data ?? []).map((item) => ({
          imageUrl: item.representativeTrack.albumImageUrl,
          item,
          owner: 'other' as const,
          shareId: item.id,
          source: 'server' as const,
        })),
      ),
    [otherRecapsQuery.data],
  );
  const myEntries = useMemo(
    () => sortEntriesByCreatedAt([...localEntries, ...serverMineEntries]),
    [localEntries, serverMineEntries],
  );
  const allEntries = useMemo(
    () => sortEntriesByCreatedAt(dedupeEntries([...myEntries, ...otherEntries])),
    [myEntries, otherEntries],
  );
  const selectedEntries = selectedTab === 'others' ? otherEntries : allEntries;
  const selectedTabOption = logFeedTabs.find((tab) => tab.value === selectedTab);
  const hasAnyLog = otherEntries.length > 0 || allEntries.length > 0;
  const musicLogs = useMemo(
    () =>
      [
        ...momentLogs.slice(0, 6).map(momentLogToMusicLogItem),
        ...(recentMusicLogsQuery.data ?? []),
      ].slice(0, 10),
    [momentLogs, recentMusicLogsQuery.data],
  );

  const handleSelectMusicLog = useCallback((item: MusicLogItem) => {
    router.push(`/recap-share/${item.recapShareId ?? item.id}`);
  }, []);

  const updateVisibilityCache = (
    recapId: string,
    visibility: RecapVisibility,
    replacement?: RecapItem,
  ) => {
    queryClient.setQueryData<RecapItem[]>(
      recapQueryKeys.list('mine'),
      (previous = []) =>
        previous.map((item) =>
          item.id === recapId
            ? {
                ...(replacement ?? item),
                visibility,
              }
            : item,
        ),
    );
  };

  const handleChangeVisibility = async (
    entry: LogGridEntry,
    nextVisibility: RecapVisibility,
    event: GestureResponderEvent,
  ) => {
    event.stopPropagation();

    if (updatingRecapId) {
      return;
    }

    if (entry.owner !== 'mine' || entry.source === 'local') {
      setActionMessage('서버에 저장된 내 로그만 공개 범위를 바꿀 수 있어요.');
      return;
    }

    const previousRecaps = queryClient.getQueryData<RecapItem[]>(
      recapQueryKeys.list('mine'),
    );

    setUpdatingRecapId(entry.item.id);
    setActionMessage(undefined);
    updateVisibilityCache(entry.item.id, nextVisibility);

    try {
      const updatedRecap = await recapApi.updateRecapVisibility(
        entry.item.id,
        nextVisibility,
      );

      if (updatedRecap) {
        updateVisibilityCache(entry.item.id, nextVisibility, updatedRecap);
      }

      setActionMessage(
        nextVisibility === 'public'
          ? '전체공개로 바꿨어요. 다른사람 보기와 지도 공개 영역에 표시돼요.'
          : '비공개로 바꿨어요. 내 로그에서만 확인할 수 있어요.',
      );
      void queryClient.invalidateQueries({ queryKey: recapQueryKeys.lists });
    } catch {
      queryClient.setQueryData(recapQueryKeys.list('mine'), previousRecaps);
      setActionMessage('공개 범위를 바꾸지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setUpdatingRecapId(undefined);
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          gap: 18,
          paddingBottom: contentBottomPadding,
          paddingHorizontal: 20,
          paddingTop: 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="overflow-hidden rounded-[28px] border border-white/10">
          <LinearGradient
            colors={[
              'rgba(91,45,255,0.38)',
              'rgba(11,16,31,0.96)',
              'rgba(6,9,19,1)',
            ]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={{ paddingHorizontal: 20, paddingVertical: 24 }}
          >
            <View className="self-start rounded-full border border-white/15 bg-white/10 px-3 py-1">
              <AppText className="text-[11px] font-semibold text-white/70">
                SOUNDLOG EXPLORE
              </AppText>
            </View>
            <AppText className="mt-5 text-[32px] font-semibold leading-9 text-white">
              로그
            </AppText>
            <AppText className="mt-3 text-sm leading-6 text-white/60">
              공개된 사운드로그를 격자로 둘러보고, 내 로그는 바로 공개 범위를 바꿔요.
            </AppText>

            <View className="mt-6 flex-row gap-3">
              <View className="flex-1 rounded-[18px] bg-white/10 p-4">
                <AppText className="text-[24px] font-semibold text-white">
                  {otherEntries.length}
                </AppText>
                <AppText className="mt-1 text-[11px] text-white/55">
                  다른사람
                </AppText>
              </View>
              <View className="flex-1 rounded-[18px] bg-white/10 p-4">
                <AppText className="text-[24px] font-semibold text-white">
                  {allEntries.length}
                </AppText>
                <AppText className="mt-1 text-[11px] text-white/55">
                  전체 로그
                </AppText>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View className="rounded-[22px] border border-white/10 bg-white/[0.06] p-2">
          <View className="flex-row gap-2">
            {logFeedTabs.map((tab) => {
              const selected = selectedTab === tab.value;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  className={`min-h-[44px] flex-1 items-center justify-center rounded-[16px] px-3 ${
                    selected ? 'bg-soundlog-lime' : 'bg-transparent'
                  }`}
                  key={tab.value}
                  onPress={() => {
                    setActionMessage(undefined);
                    setSelectedTab(tab.value);
                  }}
                >
                  <AppText
                    className={`text-xs font-semibold ${
                      selected ? 'text-soundlog-inverse' : 'text-white/62'
                    }`}
                  >
                    {tab.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <View className="flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1">
              <AppText className="text-[18px] font-semibold text-white">
                {selectedTabOption?.label ?? '다른사람 보기'}
              </AppText>
              <AppText className="mt-1 text-xs leading-5 text-white/45">
                {selectedTabOption?.description}
              </AppText>
            </View>
            <View className="rounded-full bg-white/10 px-3 py-1">
              <AppText className="text-[11px] font-semibold text-white/55">
                {selectedEntries.length}개
              </AppText>
            </View>
          </View>

          {actionMessage ? (
            <View className="mt-3 rounded-[14px] border border-white/10 bg-white/[0.06] px-4 py-3">
              <AppText className="text-xs leading-5 text-white/60">
                {actionMessage}
              </AppText>
            </View>
          ) : null}
        </View>

        {isLoading ? (
          <AppText className="text-sm text-white/55">
            로그 데이터를 불러오는 중이에요.
          </AppText>
        ) : null}

        {isError && !hasAnyLog ? (
          <AppText className="text-sm text-white/55">
            로그 데이터를 불러오지 못했어요. 잠시 후 다시 확인해주세요.
          </AppText>
        ) : null}

        {!isLoading && !hasAnyLog ? <RecapEmptyState /> : null}

        {selectedEntries.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5">
            {selectedEntries.map((entry) => (
              <LogGridCard
                entry={entry}
                isMine={entry.owner === 'mine'}
                isUpdating={updatingRecapId === entry.item.id}
                key={`${selectedTab}-${entry.source}-${entry.item.id}`}
                onChangeVisibility={handleChangeVisibility}
                onPress={() => router.push(`/recap-share/${entry.shareId}`)}
              />
            ))}
          </View>
        ) : hasAnyLog && !isLoading ? (
          <View className="rounded-[18px] border border-white/10 bg-white/[0.06] p-4">
            <AppText className="text-sm leading-6 text-white/55">
              {selectedTab === 'others'
                ? '아직 다른 사람이 공개한 로그가 없어요. 공개 로그가 생기면 여기서 격자로 볼 수 있어요.'
                : '아직 볼 수 있는 로그가 없어요. 카메라로 첫 로그를 남기면 여기에 쌓여요.'}
            </AppText>
          </View>
        ) : null}

        <View className="mt-2">
          <MusicLogSection
            data={musicLogs}
            isError={recentMusicLogsQuery.isError}
            isLoading={recentMusicLogsQuery.isLoading && momentLogs.length === 0}
            onSelectLog={handleSelectMusicLog}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    aspectRatio: 1,
    width: '32%',
  },
});
