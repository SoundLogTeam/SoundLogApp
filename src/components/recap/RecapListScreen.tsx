import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  Alert,
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
import { communityApi } from "@/api/communityApi";
import { recapApi } from "@/api/recapApi";
import { recapQueryKeys, useRecapListQuery } from "@/api/recapQueries";
import { AppText } from "@/components/AppText";
import { ResilientImage } from "@/components/media/ResilientImage";
import { ReportContentSheet } from "@/components/moderation/ReportContentSheet";
import { PageHeader } from "@/components/PageHeader";
import { RecapEmptyState } from "@/components/recap/RecapEmptyState";
import { Screen } from "@/components/Screen";
import { getTabBarHeight } from "@/constants/layout";
import { useAuthenticatedImageSource } from "@/hooks/useAuthenticatedImageSource";
import { useTravelSessionStore } from "@/store/travelSessionStore";
import type { RecapItem, RecapVisibility } from "@/types/domain";

type LogFeedTabId = "others" | "mine";

type LogGridEntry = {
  imageUrl?: string;
  item: RecapItem;
  owner: "mine" | "other";
  shareId: string;
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
    label: "내것만 보기",
    value: "mine",
  },
];

function sortEntriesByCreatedAt(entries: LogGridEntry[]) {
  return [...entries].sort(
    (first, second) =>
      new Date(second.item.createdAt).getTime() -
      new Date(first.item.createdAt).getTime(),
  );
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
  onBlock: (entry: LogGridEntry) => void;
  onReport: (entry: LogGridEntry) => void;
};

function LogGridCard({
  entry,
  itemSize,
  isMine,
  isUpdating,
  onChangeVisibility,
  onBlock,
  onPress,
  onReport,
}: LogGridCardProps) {
  const imageUrl = getEntryImageUrl(entry);
  const [failedImageUrl, setFailedImageUrl] = useState<string>();
  const visibleImageUrl =
    imageUrl && failedImageUrl !== imageUrl ? imageUrl : undefined;
  const photoSource = useAuthenticatedImageSource(visibleImageUrl);
  const visibility = entry.item.visibility ?? "private";
  const nextVisibility: RecapVisibility =
    visibility === "public" ? "private" : "public";

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
          <ResilientImage
            contentFit="cover"
            fallbackVariant="recap"
            onError={() => setFailedImageUrl(visibleImageUrl)}
            source={photoSource}
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
          accessibilityLabel={`${entry.item.title} ${getVisibilityLabel(visibility)}, ${getVisibilityLabel(nextVisibility)}로 변경`}
          accessibilityRole="button"
          accessibilityState={{ disabled: isUpdating }}
          className={`absolute right-2 top-2 rounded-full px-2 py-1 ${
            visibility === "public" ? "bg-soundlog-selected" : "bg-black/48"
          }`}
          disabled={isUpdating}
          onPress={(event) => onChangeVisibility(entry, nextVisibility, event)}
        >
          <AppText
            className={`text-[10px] font-semibold ${
              visibility === "public"
                ? "text-soundlog-inverse"
                : "text-white/80"
            }`}
          >
            {isUpdating ? "변경중" : getVisibilityLabel(visibility)}
          </AppText>
        </Pressable>
      ) : (
        <View className="absolute right-2 top-2 flex-row gap-1">
          <Pressable
            accessibilityLabel={`${entry.item.title} 신고`}
            accessibilityRole="button"
            className="h-8 w-8 items-center justify-center rounded-full bg-black/65"
            onPress={() => onReport(entry)}
          >
            <Feather color="#FDE68A" name="flag" size={14} />
          </Pressable>
          <Pressable
            accessibilityLabel={`${entry.item.title} 작성자 차단`}
            accessibilityRole="button"
            className="h-8 w-8 items-center justify-center rounded-full bg-black/65"
            onPress={() => onBlock(entry)}
          >
            <Feather color="#FCA5A5" name="slash" size={14} />
          </Pressable>
        </View>
      )}
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
  onBlockEntry: (entry: LogGridEntry) => void;
  onReportEntry: (entry: LogGridEntry) => void;
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
  onBlockEntry,
  onOpenEntry,
  onReportEntry,
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
              key={`${tabId}-${entry.item.id}`}
              onChangeVisibility={onChangeVisibility}
              onBlock={onBlockEntry}
              onPress={() => onOpenEntry(entry)}
              onReport={onReportEntry}
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
  const travelSessionStatus = useTravelSessionStore(
    (state) => state.session.status,
  );
  const [selectedTab, setSelectedTab] = useState<LogFeedTabId>(
    initialView === "mine" || initialView === "all" ? "mine" : "others",
  );
  const [updatingRecapId, setUpdatingRecapId] = useState<string>();
  const [actionMessage, setActionMessage] = useState<string>();
  const [reportEntry, setReportEntry] = useState<LogGridEntry>();
  const pagerRef = useRef<ScrollView>(null);
  const initialTabIndex =
    initialView === "mine" || initialView === "all" ? 1 : 0;
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
        })),
    [mineRecapsQuery.data],
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
          })),
      ),
    [otherRecapsQuery.data],
  );
  const myEntries = useMemo(
    () => sortEntriesByCreatedAt(serverMineEntries),
    [serverMineEntries],
  );
  const hasAnyLog = otherEntries.length > 0 || myEntries.length > 0;
  const travelButtonLabel =
    travelSessionStatus === "active" ? "여행 계속하기" : "여행 시작하기";
  const handleOpenEntry = useCallback((entry: LogGridEntry) => {
    router.push(`/recap-share/${entry.shareId}`);
  }, []);
  const handleOpenTravel = useCallback(() => {
    router.navigate("/" as never);
  }, []);
  const handleReportEntry = useCallback((entry: LogGridEntry) => {
    setReportEntry(entry);
  }, []);
  const handleBlockEntry = useCallback((entry: LogGridEntry) => {
    Alert.alert(
      '이 사용자를 차단할까요?',
      '이 사용자가 공개한 로그와 리캡이 즉시 숨겨지고 운영자에게 전달됩니다.',
      [
        { style: 'cancel', text: '취소' },
        {
          style: 'destructive',
          text: '차단',
          onPress: () => {
            void communityApi
              .blockUser({ targetContentId: entry.item.id, targetType: 'recap' })
              .then(() => {
                queryClient.setQueryData<RecapItem[]>(
                  recapQueryKeys.list('others'),
                  (previous = []) => previous.filter((item) => item.id !== entry.item.id),
                );
                setActionMessage('사용자를 차단했어요. 해당 사용자의 공개 콘텐츠는 더 이상 보이지 않아요.');
                void queryClient.invalidateQueries({ queryKey: recapQueryKeys.lists });
              })
              .catch((error) => {
                setActionMessage(error instanceof ApiError ? error.message : '사용자를 차단하지 못했어요.');
              });
          },
        },
      ],
    );
  }, [queryClient]);

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

    if (entry.owner !== "mine") {
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
          ? updatedRecap?.moderationStatus === "pending"
            ? "공개 검토를 요청했어요. 승인되면 다른 사람의 피드와 지도에 표시돼요."
            : "전체공개로 바꿨어요. 다른 사람의 공개 피드와 지도에 표시돼요."
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
        <PageHeader
          rightContent={
            <Pressable
              accessibilityHint="지도에서 여행모드를 시작하거나 이어가요."
              accessibilityLabel={travelButtonLabel}
              accessibilityRole="button"
              className="min-h-11 flex-row items-center justify-center gap-1.5 rounded-full border border-soundlog-lime/35 bg-soundlog-lime/10 px-3"
              onPress={handleOpenTravel}
            >
              <Feather color="#B7E628" name="navigation" size={14} />
              <AppText
                className="text-xs font-semibold text-soundlog-lime"
                numberOfLines={1}
              >
                {travelButtonLabel}
              </AppText>
            </Pressable>
          }
          title="로그"
        />
      </View>

      <View className="mt-[14px] border-b border-white/10">
        <View className="flex-row">
          {logFeedTabs.map((tab) => {
            const selected = selectedTab === tab.value;
            const count =
              tab.value === "others" ? otherEntries.length : myEntries.length;

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
                    className={`text-sm font-semibold ${selected ? "text-white" : "text-white/45"}`}
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
          {
            useNativeDriver: true,
          },
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
          onBlockEntry={handleBlockEntry}
          onOpenEntry={handleOpenEntry}
          onReportEntry={handleReportEntry}
          tabId="others"
          updatingRecapId={updatingRecapId}
          width={width}
        />
        <LogFeedPage
          actionMessage={selectedTab === "mine" ? actionMessage : undefined}
          contentBottomPadding={contentBottomPadding}
          emptyMessage="아직 저장한 내 로그가 없어요."
          entries={myEntries}
          hasAnyLog={hasAnyLog}
          isActive={selectedTab === "mine"}
          isError={isError}
          isLoading={isLoading}
          itemSize={gridItemSize}
          onChangeVisibility={handleChangeVisibility}
          onBlockEntry={handleBlockEntry}
          onOpenEntry={handleOpenEntry}
          onReportEntry={handleReportEntry}
          tabId="mine"
          updatingRecapId={updatingRecapId}
          width={width}
        />
      </Animated.ScrollView>
      <ReportContentSheet
        onClose={() => setReportEntry(undefined)}
        onReported={() => setActionMessage('신고를 접수했어요. 운영자가 24시간 안에 확인합니다.')}
        target={reportEntry ? { targetContentId: reportEntry.item.id, targetType: 'recap' } : undefined}
        title="공개 로그 신고"
        visible={Boolean(reportEntry)}
      />
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
