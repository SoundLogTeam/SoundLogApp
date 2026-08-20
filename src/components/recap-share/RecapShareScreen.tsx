import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";

import { ApiError } from "@/api/client";
import { communityApi } from "@/api/communityApi";
import { recapApi } from "@/api/recapApi";
import { recapQueryKeys, useRecapShareQuery } from "@/api/recapQueries";
import { AppText } from "@/components/AppText";
import { ReportContentSheet } from "@/components/moderation/ReportContentSheet";
import { IconButton } from "@/components/IconButton";
import { PageHeader } from "@/components/PageHeader";
import {
  RecapCaptureFrame,
  type RecapCaptureFrameHandle,
} from "@/components/recap-share/RecapCaptureFrame";
import { RecapMusicSummary } from "@/components/recap-share/RecapMusicSummary";
import { RecapRouteMap } from "@/components/recap-share/RecapRouteMap";
import {
  RecapShareEmptyState,
  RecapShareErrorState,
  RecapShareLoadingState,
} from "@/components/recap-share/RecapShareState";
import {
  RecapSoundLogCard,
  RecapSoundLogList,
} from "@/components/recap-share/RecapSoundLogList";
import { RecapTravelSummaryCard } from "@/components/recap-share/RecapTravelSummaryCard";
import { ShareActionList } from "@/components/recap-share/ShareActionList";
import { Screen } from "@/components/Screen";
import { SectionTitle } from "@/components/SectionTitle";
import { getTabBarHeight } from "@/constants/layout";
import { useRecapShareActions } from "@/hooks/useRecapShareActions";
import type {
  RecapItem,
  RecapShare,
  RecapShareMoment,
  RecapVisibility,
} from "@/types/domain";
import { formatRecapRecordedAt } from "@/utils/dateFormat";
import { getRecapSoundLogs } from "@/utils/recapTravelSummary";

type RecapShareScreenProps = {
  recapId?: string;
};

function isTravelLogRecap(recap?: RecapShare | null) {
  return Boolean(recap?.sessionId);
}

function createRecapTitle(recap?: RecapShare | null) {
  if (!recap) {
    return "리캡";
  }

  return isTravelLogRecap(recap)
    ? `${recap.placeName} 여행 로그`
    : `${recap.placeName} 리캡`;
}

export function RecapShareScreen({ recapId }: RecapShareScreenProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const captureFrameRef = useRef<RecapCaptureFrameHandle>(null);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [isUpdatingThumbnail, setIsUpdatingThumbnail] = useState(false);
  const [visibility, setVisibility] = useState<RecapVisibility>("private");
  const [thumbnailMessage, setThumbnailMessage] = useState<string>();
  const [visibilityMessage, setVisibilityMessage] = useState<string>();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const {
    data: recap,
    isError,
    isLoading,
    refetch,
  } = useRecapShareQuery(recapId, { enabled: Boolean(recapId) });
  const isTravelLog = isTravelLogRecap(recap);
  const soundLogs = recap ? getRecapSoundLogs(recap) : [];
  const shareMoment = soundLogs[soundLogs.length - 1];
  const canManageVisibility = Boolean(recap?.isMine);
  const canSelectThumbnail = Boolean(isTravelLog && recap?.isMine);
  const shareActions = useRecapShareActions({
    capture: () =>
      captureFrameRef.current?.capture() ?? Promise.resolve(undefined),
    recapId: recap?.id,
  });
  const handleBlockAuthor = () => {
    if (!recap || recap.isMine) return;
    Alert.alert(
      '이 사용자를 차단할까요?',
      '이 사용자의 공개 리캡과 로그가 피드와 지도에서 즉시 숨겨집니다.',
      [
        { style: 'cancel', text: '취소' },
        {
          style: 'destructive',
          text: '차단',
          onPress: () => {
            void communityApi
              .blockUser({ targetContentId: recap.id, targetType: 'recap' })
              .then(() => {
                void queryClient.invalidateQueries({ queryKey: recapQueryKeys.lists });
                Alert.alert('차단 완료', '해당 사용자의 공개 콘텐츠를 숨겼어요.', [
                  { text: '확인', onPress: () => router.back() },
                ]);
              })
              .catch((error) => Alert.alert(
                '차단 실패',
                error instanceof ApiError ? error.message : '잠시 후 다시 시도해주세요.',
              ));
          },
        },
      ],
    );
  };
  const handleChangeVisibility = async (nextVisibility: RecapVisibility) => {
    if (!recap || !canManageVisibility || isUpdatingVisibility) {
      return;
    }

    setIsUpdatingVisibility(true);
    setVisibilityMessage(undefined);

    try {
      const updatedRecap = await recapApi.updateRecapVisibility(
        recap.id,
        nextVisibility,
      );
      setVisibility(nextVisibility);
      if (updatedRecap) {
        queryClient.setQueriesData<RecapItem[]>(
          { queryKey: recapQueryKeys.lists },
          (currentRecaps) =>
            currentRecaps?.map((currentRecap) =>
              currentRecap.id === updatedRecap.id
                ? {
                    ...currentRecap,
                    ...updatedRecap,
                    visibility: nextVisibility,
                  }
                : currentRecap,
            ),
        );
      }
      setVisibilityMessage(
        nextVisibility === "public"
          ? updatedRecap?.moderationStatus === "pending"
            ? "공개 검토를 요청했어요. 승인되면 다른 사람의 피드와 지도에 표시돼요."
            : "전체공개로 바꿨어요. 현재 위치 300m 이내 지도에 리캡 핀이 남아요."
          : "나만보기로 바꿨어요. 다른 사람의 지도에는 보이지 않아요.",
      );
      void refetch();
      void queryClient.invalidateQueries({ queryKey: recapQueryKeys.lists });
    } catch (error) {
      setVisibilityMessage(
        error instanceof ApiError
          ? error.message
          : "공개 범위를 바꾸지 못했어요. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const handleSelectThumbnail = async (moment: RecapShareMoment) => {
    if (
      !recap ||
      !canSelectThumbnail ||
      isUpdatingThumbnail ||
      recap.thumbnailMomentId === moment.id
    ) {
      return;
    }

    setIsUpdatingThumbnail(true);
    setThumbnailMessage(undefined);

    try {
      const updatedRecap = await recapApi.updateRecapThumbnail(
        recap.id,
        moment.id,
      );

      queryClient.setQueryData<RecapShare | null>(
        recapQueryKeys.share(recap.id),
        (currentRecap) =>
          currentRecap
            ? {
                ...currentRecap,
                backgroundImageUrl: moment.imageUrl,
                thumbnailMomentId: moment.id,
              }
            : currentRecap,
      );

      if (updatedRecap) {
        queryClient.setQueriesData<RecapItem[]>(
          { queryKey: recapQueryKeys.lists },
          (currentRecaps) =>
            currentRecaps?.map((currentRecap) =>
              currentRecap.id === updatedRecap.id
                ? { ...currentRecap, ...updatedRecap }
                : currentRecap,
            ),
        );
      }

      setThumbnailMessage("이 리캡을 로그의 대표 썸네일로 지정했어요.");
      await refetch();
      void queryClient.invalidateQueries({ queryKey: recapQueryKeys.lists });
    } catch (error) {
      setThumbnailMessage(
        error instanceof ApiError
          ? error.message
          : "로그 썸네일을 바꾸지 못했어요. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setIsUpdatingThumbnail(false);
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
          paddingBottom: getTabBarHeight(insets.bottom) + 28,
          paddingHorizontal: 20,
          paddingTop: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          leftContent={
            <IconButton
              label="이전 화면으로 돌아가기"
              name="arrow-left"
              onPress={() => router.back()}
            />
          }
          title={createRecapTitle(recap)}
        />
        <AppText className="ml-12 mt-3 text-sm leading-6 text-white/50">
          {recap
            ? isTravelLog
              ? "여행모드에서 남긴 기록들이 하나의 로그로 묶였어요."
              : "여행모드 밖에서 만든 독립 리캡이에요."
            : "리캡과 로그를 불러오고 있어요."}
        </AppText>

        {recap ? (
          <View className="ml-12 mt-3 items-start">
            <AppText className="text-xs font-semibold text-white/42">
              {formatRecapRecordedAt(recap.recordedAt)}
            </AppText>

            {canManageVisibility ? (
              <View className="mt-4 flex-row rounded-full border border-white/10 bg-white/[0.06] p-1">
                {(["private", "public"] as RecapVisibility[]).map((option) => {
                  const selected = visibility === option;

                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{
                        disabled: isUpdatingVisibility,
                        selected,
                      }}
                      className={`min-h-[38px] min-w-[92px] items-center justify-center rounded-full px-4 ${
                        selected ? "bg-soundlog-selected" : "bg-transparent"
                      }`}
                      disabled={isUpdatingVisibility}
                      key={option}
                      onPress={() => void handleChangeVisibility(option)}
                    >
                      <AppText
                        className={`text-xs font-semibold ${
                          selected ? "text-soundlog-inverse" : "text-white/60"
                        }`}
                      >
                        {option === "public" ? "전체공개" : "나만보기"}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View className="mt-4 flex-row gap-2">
                <Pressable
                  accessibilityRole="button"
                  className="min-h-[42px] items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/10 px-4"
                  onPress={() => setIsReportOpen(true)}
                >
                  <AppText className="text-xs font-semibold text-amber-100">신고</AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  className="min-h-[42px] items-center justify-center rounded-full border border-red-300/25 bg-red-300/10 px-4"
                  onPress={handleBlockAuthor}
                >
                  <AppText className="text-xs font-semibold text-red-100">사용자 차단</AppText>
                </Pressable>
              </View>
            )}

            {visibilityMessage ? (
              <AppText className="mt-3 text-xs leading-5 text-white/55">
                {visibilityMessage}
              </AppText>
            ) : null}
          </View>
        ) : null}

        <View className="mt-7 w-full">
          {isLoading ? (
            <RecapShareLoadingState />
          ) : isError ? (
            <RecapShareErrorState onRetry={() => refetch()} />
          ) : !recap ? (
            <RecapShareEmptyState />
          ) : (
            <>
              <View className="w-full">
                <RecapSoundLogList
                  canSelectThumbnail={canSelectThumbnail}
                  isTravelLog={isTravelLog}
                  isUpdatingThumbnail={isUpdatingThumbnail}
                  onSelectThumbnail={(moment) =>
                    void handleSelectThumbnail(moment)
                  }
                  recap={recap}
                />
                {thumbnailMessage ? (
                  <AppText className="mt-3 text-center text-xs leading-5 text-white/55">
                    {thumbnailMessage}
                  </AppText>
                ) : null}
              </View>

              {isTravelLog ? (
                <>
                  <View className="mt-8 w-full">
                    <RecapRouteMap recap={recap} />
                  </View>

                  <View className="mt-5 w-full">
                    <RecapTravelSummaryCard recap={recap} />
                  </View>
                </>
              ) : null}

              <View className="mt-8 w-full">
                <RecapMusicSummary recap={recap} />
              </View>

              <View className="mt-8 w-full">
                <SectionTitle title="공유용 리캡" />
                <View className="w-full items-center">
                  {shareMoment ? (
                    <RecapCaptureFrame
                      aspectRatio={3 / 5}
                      ref={captureFrameRef}
                    >
                      <View className="h-full w-full">
                        <RecapSoundLogCard
                          fill
                          index={soundLogs.length - 1}
                          moment={shareMoment}
                          total={soundLogs.length}
                        />
                      </View>
                    </RecapCaptureFrame>
                  ) : null}
                </View>

                <View className="mt-5 w-full">
                  <ShareActionList
                    activeAction={shareActions.activeAction}
                    isBusy={Boolean(shareActions.activeAction)}
                    onAction={(action) => {
                      if (action === "save") {
                        void shareActions.save();
                        return;
                      }

                      void shareActions.share();
                    }}
                  />
                  {shareActions.message ? (
                    <View className="mt-3 py-2">
                      <AppText
                        className={`text-center text-xs leading-5 ${
                          shareActions.message.type === "error"
                            ? "text-red-200"
                            : shareActions.message.type === "success"
                              ? "text-soundlog-lime"
                              : "text-white/70"
                        }`}
                      >
                        {shareActions.message.text}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
      <ReportContentSheet
        onClose={() => setIsReportOpen(false)}
        onReported={() => Alert.alert('신고 접수', '운영자가 24시간 안에 확인합니다.')}
        target={recap && !recap.isMine ? { targetContentId: recap.id, targetType: 'recap' } : undefined}
        title="공개 리캡 신고"
        visible={isReportOpen}
      />
    </Screen>
  );
}
