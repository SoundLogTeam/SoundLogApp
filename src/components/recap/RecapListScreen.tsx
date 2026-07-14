import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  GestureResponderEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError } from "@/api/client";
import { recapApi } from "@/api/recapApi";
import { recapQueryKeys, useRecapListQuery } from "@/api/recapQueries";
import { AppText } from "@/components/AppText";
import { PageHeader } from "@/components/PageHeader";
import { RecapEmptyState } from "@/components/recap/RecapEmptyState";
import { Screen } from "@/components/Screen";
import { getTabBarHeight } from "@/constants/layout";
import { useMomentLogStore } from "@/store/momentLogStore";
import type { MomentLog, RecapItem, RecapVisibility } from "@/types/domain";
import {
  createMomentLogGroups,
  momentLogGroupToRecapItem,
} from "@/utils/recapMappers";
import { flushPendingMomentActions } from "@/utils/momentLogSync";

type LogFeedTabId = "others" | "all";

type LogGridEntry = {
  imageUrl?: string;
  item: RecapItem;
  owner: "mine" | "other";
  shareId: string;
  source: "local" | "server";
  syncStatus?: MomentLog["syncStatus"];
};

const logFeedTabs: Array<{
  label: string;
  value: LogFeedTabId;
}> = [
  {
    label: "다른사람 보기",
    value: "others",
  },
  {
    label: "모든 사람 보기",
    value: "all",
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
  return visibility === "public" ? "공개" : "비공개";
}

function getMomentCountLabel(item: RecapItem) {
  if (item.momentCount && item.momentCount > 1) {
    return `${item.momentCount}개`;
  }

  return "1개";
}

function getGroupSyncStatus(logs: MomentLog[]): MomentLog["syncStatus"] {
  if (logs.some((log) => log.syncStatus === "failed")) {
    return "failed";
  }

  if (logs.some((log) => log.syncStatus === "pending")) {
    return "pending";
  }

  if (logs.some((log) => log.syncStatus === "local")) {
    return "local";
  }

  return "synced";
}

function getLocalSyncLabel(syncStatus?: MomentLog["syncStatus"]) {
  if (syncStatus === "failed") {
    return "재시도";
  }

  if (syncStatus === "pending") {
    return "동기화 중";
  }

  return "기기 저장";
}

type LogGridCardProps = {
  entry: LogGridEntry;
  itemSize: number;
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
  itemSize,
  isMine,
  isUpdating,
  onChangeVisibility,
  onPress,
}: LogGridCardProps) {
  const imageUrl = getEntryImageUrl(entry);
  const [failedImageUrl, setFailedImageUrl] = useState<string>();
  const visibleImageUrl =
    imageUrl && failedImageUrl !== imageUrl ? imageUrl : undefined;
  const visibility = entry.item.visibility ?? "private";
  const nextVisibility: RecapVisibility =
    visibility === "public" ? "private" : "public";
  const canChangeVisibility = entry.source === "server";

  return (
    <View
      className="overflow-hidden bg-white/10"
      style={[
        styles.gridCard,
        { height: Math.round(itemSize * 1.25), width: itemSize },
      ]}
    >
      <Pressable
        accessibilityLabel={`${entry.item.title} 자세히 보기`}
        accessibilityRole="button"
        onPress={onPress}
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {visibleImageUrl ? (
          <Image
            contentFit="cover"
            onError={() => setFailedImageUrl(visibleImageUrl)}
            source={{ uri: visibleImageUrl }}
            style={StyleSheet.absoluteFill}
            transition={180}
          />
        ) : (
          <LinearGradient
            colors={["#241747", "#1D365C", "#121829"]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <LinearGradient
          colors={["rgba(0,0,0,0.02)", "rgba(0,0,0,0.18)", "rgba(0,0,0,0.76)"]}
          end={{ x: 0.5, y: 1 }}
          start={{ x: 0.5, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        {!visibleImageUrl ? (
          <View className="absolute inset-0 items-center justify-center px-3 pb-5">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <Feather color="rgba(255,255,255,0.78)" name="disc" size={19} />
            </View>
            <AppText
              className="mt-2 text-center text-xs font-semibold leading-4 text-white/82"
              numberOfLines={2}
            >
              {entry.item.title}
            </AppText>
          </View>
        ) : null}
        <View className="absolute left-2 top-2 rounded-full bg-black/42 px-2 py-1">
          <AppText className="text-[10px] font-semibold text-white/82">
            {getMomentCountLabel(entry.item)}
          </AppText>
        </View>

        <View className="absolute bottom-2 left-2 right-2 flex-row items-center justify-between gap-2">
          <View className="min-w-0 flex-1 rounded-full bg-black/42 px-2 py-1">
            <AppText
              className="text-[10px] font-semibold text-white/82"
              numberOfLines={1}
            >
              {entry.item.placeName}
            </AppText>
          </View>
          <Feather
            color="rgba(255,255,255,0.82)"
            name="chevrons-right"
            size={13}
          />
        </View>
      </View>

      {isMine ? (
        <Pressable
          accessibilityLabel={
            canChangeVisibility
              ? `${entry.item.title} ${getVisibilityLabel(visibility)}, ${getVisibilityLabel(nextVisibility)}로 변경`
              : `${entry.item.title} ${getLocalSyncLabel(entry.syncStatus)}`
          }
          accessibilityRole="button"
          accessibilityState={{ disabled: isUpdating }}
          className={`absolute right-2 top-2 rounded-full px-2 py-1 ${
            visibility === "public" ? "bg-soundlog-lime" : "bg-black/48"
          }`}
          disabled={isUpdating}
          onPress={(event) => onChangeVisibility(entry, nextVisibility, event)}
          style={{ opacity: canChangeVisibility ? 1 : 0.62 }}
        >
          <AppText
            className={`text-[10px] font-semibold ${
              visibility === "public"
                ? "text-soundlog-inverse"
                : "text-white/80"
            }`}
          >
            {isUpdating
              ? "변경중"
              : canChangeVisibility
                ? getVisibilityLabel(visibility)
                : getLocalSyncLabel(entry.syncStatus)}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

type LogFeedPageProps = {
  actionMessage?: string;
  contentBottomPadding: number;
  emptyMessage: string;
  entries: LogGridEntry[];
  hasAnyLog: boolean;
  isActive: boolean;
  isError: boolean;
  isLoading: boolean;
  itemSize: number;
  onChangeVisibility: (
    entry: LogGridEntry,
    visibility: RecapVisibility,
    event: GestureResponderEvent,
  ) => void;
  onOpenEntry: (entry: LogGridEntry) => void;
  tabId: LogFeedTabId;
  updatingRecapId?: string;
  width: number;
};

function LogFeedPage({
  actionMessage,
  contentBottomPadding,
  emptyMessage,
  entries,
  hasAnyLog,
  isActive,
  isError,
  isLoading,
  itemSize,
  onChangeVisibility,
  onOpenEntry,
  tabId,
  updatingRecapId,
  width,
}: LogFeedPageProps) {
  return (
    <ScrollView
      accessibilityElementsHidden={!isActive}
      contentContainerStyle={{
        gap: 14,
        paddingBottom: contentBottomPadding,
        paddingTop: 14,
      }}
      directionalLockEnabled
      keyboardShouldPersistTaps="handled"
      importantForAccessibility={isActive ? "auto" : "no-hide-descendants"}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
      style={{ width }}
    >
      {actionMessage ? (
        <View className="px-5">
          <AppText className="text-xs leading-5 text-white/55">
            {actionMessage}
          </AppText>
        </View>
      ) : null}

      {isLoading ? (
        <View className="px-5">
          <AppText className="text-sm text-white/55">
            로그 데이터를 불러오는 중이에요.
          </AppText>
        </View>
      ) : null}

      {isError && !hasAnyLog ? (
        <View className="px-5">
          <AppText className="text-sm text-white/55">
            로그 데이터를 불러오지 못했어요. 잠시 후 다시 확인해주세요.
          </AppText>
        </View>
      ) : null}

      {!isLoading && !hasAnyLog ? (
        <View className="px-5">
          <RecapEmptyState />
        </View>
      ) : null}

      {entries.length > 0 ? (
        <View className="flex-row flex-wrap" style={{ gap: 1, width }}>
          {entries.map((entry) => (
            <LogGridCard
              entry={entry}
              itemSize={itemSize}
              isMine={entry.owner === "mine"}
              isUpdating={updatingRecapId === entry.item.id}
              key={`${tabId}-${entry.source}-${entry.item.id}`}
              onChangeVisibility={onChangeVisibility}
              onPress={() => onOpenEntry(entry)}
            />
          ))}
        </View>
      ) : hasAnyLog && !isLoading ? (
        <View className="px-5">
          <AppText className="text-sm leading-6 text-white/55">
            {emptyMessage}
          </AppText>
        </View>
      ) : null}
    </ScrollView>
  );
}

export function RecapListScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ view?: string | string[] }>();
  const initialView = Array.isArray(params.view) ? params.view[0] : params.view;
  const queryClient = useQueryClient();
  const momentLogs = useMomentLogStore((state) => state.logs);
  const [selectedTab, setSelectedTab] = useState<LogFeedTabId>(
    initialView === "all" ? "all" : "others",
  );
  const [updatingRecapId, setUpdatingRecapId] = useState<string>();
  const [actionMessage, setActionMessage] = useState<string>();
  const pagerRef = useRef<ScrollView>(null);
  const initialTabIndex = initialView === "all" ? 1 : 0;
  const scrollX = useRef(new Animated.Value(initialTabIndex * width)).current;
  const mineRecapsQuery = useRecapListQuery("mine");
  const otherRecapsQuery = useRecapListQuery("others");
  const contentBottomPadding = getTabBarHeight(insets.bottom) + 56;
  const gridItemSize = Math.floor((width - 1) / 2);
  const isLoading = mineRecapsQuery.isLoading || otherRecapsQuery.isLoading;
  const isError = mineRecapsQuery.isError || otherRecapsQuery.isError;

  const serverMineEntries: LogGridEntry[] = useMemo(
    () =>
      (mineRecapsQuery.data ?? [])
        .filter((item) => Boolean(item.sessionId))
        .map((item) => ({
          imageUrl: item.backgroundImageUrl,
          item,
          owner: "mine" as const,
          shareId: item.id,
          source: "server",
        })),
    [mineRecapsQuery.data],
  );
  const serverSessionIds = useMemo(
    () =>
      new Set(
        serverMineEntries.map(({ item }) => item.sessionId).filter(Boolean),
      ),
    [serverMineEntries],
  );
  const serverRecapIds = useMemo(
    () => new Set(serverMineEntries.map(({ item }) => item.id)),
    [serverMineEntries],
  );
  const localEntries: LogGridEntry[] = useMemo(
    () =>
      createMomentLogGroups(momentLogs)
        .filter((group) => Boolean(group.sessionId))
        .map((group) => ({
          imageUrl: group.logs[0]?.photoUri,
          item: momentLogGroupToRecapItem(group),
          owner: "mine" as const,
          shareId: group.id,
          source: "local" as const,
          syncStatus: getGroupSyncStatus(group.logs),
        }))
        .filter(
          ({ item }) =>
            !serverRecapIds.has(item.id) &&
            (!item.sessionId || !serverSessionIds.has(item.sessionId)),
        ),
    [momentLogs, serverRecapIds, serverSessionIds],
  );
  const otherEntries = useMemo(
    () =>
      sortEntriesByCreatedAt(
        (otherRecapsQuery.data ?? [])
          .filter((item) => Boolean(item.sessionId))
          .map((item) => ({
            imageUrl: item.backgroundImageUrl,
            item,
            owner: "other" as const,
            shareId: item.id,
            source: "server" as const,
          })),
      ),
    [otherRecapsQuery.data],
  );
  const myEntries = useMemo(
    () => sortEntriesByCreatedAt([...localEntries, ...serverMineEntries]),
    [localEntries, serverMineEntries],
  );
  const allEntries = useMemo(
    () =>
      sortEntriesByCreatedAt(dedupeEntries([...myEntries, ...otherEntries])),
    [myEntries, otherEntries],
  );
  const hasAnyLog = otherEntries.length > 0 || allEntries.length > 0;
  const handleOpenEntry = useCallback((entry: LogGridEntry) => {
    router.push(`/recap-share/${entry.shareId}`);
  }, []);

  const handleSelectTab = useCallback(
    (tab: LogFeedTabId) => {
      const tabIndex = tab === "others" ? 0 : 1;

      setActionMessage(undefined);
      setSelectedTab(tab);
      pagerRef.current?.scrollTo({
        animated: true,
        x: tabIndex * width,
        y: 0,
      });
    },
    [width],
  );

  const handlePagerScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const tabIndex = Math.round(event.nativeEvent.contentOffset.x / width);
      const nextTab = logFeedTabs[tabIndex]?.value ?? "others";

      if (nextTab !== selectedTab) {
        setActionMessage(undefined);
        setSelectedTab(nextTab);
      }
    },
    [selectedTab, width],
  );

  const updateVisibilityCache = (
    recapId: string,
    visibility: RecapVisibility,
    replacement?: RecapItem,
  ) => {
    queryClient.setQueryData<RecapItem[]>(
      recapQueryKeys.list("mine"),
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

    if (entry.owner !== "mine" || entry.source === "local") {
      if (entry.source !== "local") {
        return;
      }

      setUpdatingRecapId(entry.item.id);
      setActionMessage("기기에 저장된 로그를 서버와 다시 동기화하고 있어요.");

      try {
        const result = await flushPendingMomentActions();

        if (result.failureCount > 0) {
          setActionMessage(
            "동기화하지 못했어요. 네트워크를 확인한 뒤 다시 눌러주세요.",
          );
          return;
        }

        setActionMessage(
          "서버 동기화를 마쳤어요. 로그 목록을 새로 불러올게요.",
        );
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: recapQueryKeys.lists }),
          queryClient.invalidateQueries({ queryKey: ["moment-logs"] }),
        ]);
      } finally {
        setUpdatingRecapId(undefined);
      }
      return;
    }

    const previousRecaps = queryClient.getQueryData<RecapItem[]>(
      recapQueryKeys.list("mine"),
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
        nextVisibility === "public"
          ? "전체공개로 바꿨어요. 다른사람 보기와 지도 공개 영역에 표시돼요."
          : "비공개로 바꿨어요. 내 로그에서만 확인할 수 있어요.",
      );
      void queryClient.invalidateQueries({ queryKey: recapQueryKeys.lists });
    } catch (error) {
      queryClient.setQueryData(recapQueryKeys.list("mine"), previousRecaps);
      setActionMessage(
        error instanceof ApiError
          ? error.message
          : "공개 범위를 바꾸지 못했어요. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setUpdatingRecapId(undefined);
    }
  };

  return (
    <Screen>
      <View className="px-5 pt-8">
        <PageHeader title="로그" />
      </View>

      <View className="mt-[14px] border-b border-white/10">
        <View className="flex-row">
          {logFeedTabs.map((tab) => {
            const selected = selectedTab === tab.value;
            const count =
              tab.value === "others" ? otherEntries.length : allEntries.length;

            return (
              <Pressable
                accessibilityHint="피드를 좌우로 밀어도 전환할 수 있어요."
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className="min-h-[48px] flex-1 items-center justify-center px-2"
                key={tab.value}
                onPress={() => handleSelectTab(tab.value)}
              >
                <View className="flex-row items-center gap-1.5">
                  <AppText
                    className={`text-sm font-semibold ${
                      selected ? "text-white" : "text-white/45"
                    }`}
                  >
                    {tab.label}
                  </AppText>
                  <AppText
                    className={`text-[11px] font-semibold ${
                      selected ? "text-soundlog-lime" : "text-white/35"
                    }`}
                  >
                    {count}
                  </AppText>
                </View>
              </Pressable>
            );
          })}

          <Animated.View
            pointerEvents="none"
            style={[
              styles.tabIndicator,
              {
                transform: [
                  {
                    translateX: scrollX.interpolate({
                      extrapolate: "clamp",
                      inputRange: [0, width],
                      outputRange: [0, width / 2],
                    }),
                  },
                ],
                width: width / 2,
              },
            ]}
          />
        </View>
      </View>

      <Animated.ScrollView
        accessibilityLabel="로그 피드"
        bounces={false}
        contentOffset={{ x: initialTabIndex * width, y: 0 }}
        decelerationRate="fast"
        directionalLockEnabled
        horizontal
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        onMomentumScrollEnd={handlePagerScrollEnd}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true },
        )}
        pagingEnabled
        ref={pagerRef}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        style={styles.pager}
      >
        <LogFeedPage
          actionMessage={selectedTab === "others" ? actionMessage : undefined}
          contentBottomPadding={contentBottomPadding}
          emptyMessage="아직 다른 사람이 공개한 로그가 없어요."
          entries={otherEntries}
          hasAnyLog={hasAnyLog}
          isActive={selectedTab === "others"}
          isError={isError}
          isLoading={isLoading}
          itemSize={gridItemSize}
          onChangeVisibility={handleChangeVisibility}
          onOpenEntry={handleOpenEntry}
          tabId="others"
          updatingRecapId={updatingRecapId}
          width={width}
        />
        <LogFeedPage
          actionMessage={selectedTab === "all" ? actionMessage : undefined}
          contentBottomPadding={contentBottomPadding}
          emptyMessage="아직 볼 수 있는 로그가 없어요."
          entries={allEntries}
          hasAnyLog={hasAnyLog}
          isActive={selectedTab === "all"}
          isError={isError}
          isLoading={isLoading}
          itemSize={gridItemSize}
          onChangeVisibility={handleChangeVisibility}
          onOpenEntry={handleOpenEntry}
          tabId="all"
          updatingRecapId={updatingRecapId}
          width={width}
        />
      </Animated.ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    backgroundColor: "#151927",
  },
  pager: {
    flex: 1,
  },
  tabIndicator: {
    backgroundColor: "#B9F20D",
    bottom: 0,
    height: 2,
    left: 0,
    position: "absolute",
  },
});
