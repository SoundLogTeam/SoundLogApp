import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { communityApi } from "@/api/communityApi";
import { AppText } from "@/components/AppText";
import { IconButton } from "@/components/IconButton";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";
import { SectionTitle } from "@/components/SectionTitle";
import { SettingsRow } from "@/components/SettingsRow";
import { getTabBarHeight } from "@/constants/layout";
import { SoundlogButton } from "@/design-system";
import { useAuthStore } from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { useTravelRoomStore } from "@/store/travelRoomStore";
import { useTravelSessionStore } from "@/store/travelSessionStore";
import type { TravelRoom, TravelRoomMoment } from "@/types/domain";
import { shareTravelRoomInvite } from "@/utils/travelRoomInvite";

type TravelRoomDetailScreenProps = {
  roomId: string;
};

type TravelRoomMomentComment = NonNullable<
  TravelRoomMoment["comments"]
>[number];

function replaceRoomMoment(
  room: TravelRoom,
  updatedMoment: TravelRoomMoment,
): TravelRoom {
  return {
    ...room,
    moments: room.moments.map((moment) =>
      moment.id === updatedMoment.id ? updatedMoment : moment,
    ),
  };
}

function appendRoomMomentComment(
  room: TravelRoom,
  momentId: string,
  comment: TravelRoomMomentComment,
): TravelRoom {
  return {
    ...room,
    moments: room.moments.map((moment) => {
      if (moment.id !== momentId) {
        return moment;
      }

      const comments = [...(moment.comments ?? []), comment];

      return {
        ...moment,
        commentCount: comments.length,
        comments,
      };
    }),
  };
}

function createMemberLabel(
  member: TravelRoom["members"][number],
  currentUserId?: string,
) {
  if (member.userId === currentUserId) {
    return "나";
  }

  return member.displayName ?? "동행자";
}

function createMomentTrackLabel(moment: TravelRoomMoment) {
  if (!moment.track) {
    return moment.note ?? "음악 없이 남긴 후보";
  }

  return `${moment.track.title} - ${moment.track.artist}`;
}

function createStatusLabel(status: TravelRoomMoment["status"]) {
  if (status === "accepted") {
    return "채택됨";
  }

  if (status === "rejected") {
    return "보류";
  }

  return "채택 후보";
}

function sortMoments(moments: TravelRoomMoment[]) {
  return [...moments].sort((first, second) => {
    if (first.status === second.status) {
      return (
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime()
      );
    }

    return first.status === "accepted" ? -1 : 1;
  });
}

export function TravelRoomDetailScreen({
  roomId,
}: TravelRoomDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const authStatus = useAuthStore((state) => state.status);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const cachedRoom = useTravelRoomStore((state) => state.roomsById[roomId]);
  const setRoomById = useTravelRoomStore((state) => state.setRoomById);
  const { currentTrack } = usePlayerStore();
  const currentPlace = useTravelSessionStore((state) => state.currentPlace);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {},
  );
  const [isAddingMoment, setIsAddingMoment] = useState(false);
  const [isCreatingRecap, setIsCreatingRecap] = useState(false);
  const [isLoading, setIsLoading] = useState(!cachedRoom);
  const [isSharingInvite, setIsSharingInvite] = useState(false);
  const [message, setMessage] = useState<string>();
  const [pendingCommentMomentId, setPendingCommentMomentId] =
    useState<string>();
  const [pendingStatusMomentId, setPendingStatusMomentId] = useState<string>();
  const room = cachedRoom;
  const hasCachedRoom = Boolean(cachedRoom);
  const sortedMoments = useMemo(
    () => sortMoments(room?.moments ?? []),
    [room?.moments],
  );
  const acceptedMomentCount = sortedMoments.filter(
    (moment) => moment.status === "accepted",
  ).length;
  const myMemberRole = room?.members.find(
    (member) => member.userId === currentUserId,
  )?.role;
  const canModerate = myMemberRole === "owner";
  const canUseServerRoom = authStatus === "authenticated";

  useEffect(() => {
    if (!canUseServerRoom || !roomId) {
      setIsLoading(false);
      return;
    }

    let ignore = false;

    setIsLoading(!hasCachedRoom);
    communityApi
      .getTravelRoom(roomId)
      .then((nextRoom) => {
        if (!ignore && nextRoom) {
          setRoomById(nextRoom);
          setMessage(undefined);
        }
      })
      .catch(() => {
        if (!ignore && !hasCachedRoom) {
          setMessage(
            "여행방을 불러오지 못했어요. 초대 코드나 로그인 상태를 확인해주세요.",
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [canUseServerRoom, hasCachedRoom, roomId, setRoomById]);

  const handleShareInvite = async () => {
    if (!room || isSharingInvite) {
      return;
    }

    setIsSharingInvite(true);
    setMessage(undefined);

    try {
      const result = await shareTravelRoomInvite(room);
      setMessage(
        result === "copied"
          ? "초대 메시지를 클립보드에 복사했어요."
          : "초대 메시지를 공유했어요.",
      );
    } catch {
      setMessage(
        "초대 메시지를 공유하지 못했어요. 초대 코드를 직접 전달해주세요.",
      );
    } finally {
      setIsSharingInvite(false);
    }
  };

  const handleAddCurrentTrack = async () => {
    if (!room || isAddingMoment) {
      return;
    }

    setIsAddingMoment(true);
    setMessage(undefined);

    try {
      const moment = await communityApi.addCurrentTrackMoment(
        room.id,
        currentTrack,
        currentPlace?.title,
      );

      if (!moment) {
        setMessage("로그인된 서버 세션에서 후보를 추가할 수 있어요.");
        return;
      }

      setRoomById({
        ...room,
        momentCount: room.momentCount + 1,
        moments: [moment, ...room.moments],
      });
      setMessage("현재 곡을 공동 Recap 후보에 추가했어요.");
    } catch {
      setMessage(
        "후보를 추가하지 못했어요. 현재 곡이나 네트워크 상태를 확인해주세요.",
      );
    } finally {
      setIsAddingMoment(false);
    }
  };

  const handleToggleMomentStatus = async (moment: TravelRoomMoment) => {
    if (!room || !canModerate || pendingStatusMomentId) {
      return;
    }

    const nextStatus = moment.status === "accepted" ? "candidate" : "accepted";

    setPendingStatusMomentId(moment.id);
    setMessage(undefined);

    try {
      const updatedMoment = await communityApi.updateTravelRoomMomentStatus(
        room.id,
        moment.id,
        nextStatus,
      );

      if (!updatedMoment) {
        setMessage("방장 계정으로 로그인하면 후보 채택 상태를 바꿀 수 있어요.");
        return;
      }

      setRoomById(replaceRoomMoment(room, updatedMoment));
      setMessage(
        nextStatus === "accepted"
          ? "후보 리캡을 채택했어요."
          : "후보로 되돌렸어요.",
      );
    } catch {
      setMessage(
        "후보 상태를 변경하지 못했어요. 방장 권한이나 네트워크 상태를 확인해주세요.",
      );
    } finally {
      setPendingStatusMomentId(undefined);
    }
  };

  const handleSubmitComment = async (moment: TravelRoomMoment) => {
    if (!room || pendingCommentMomentId) {
      return;
    }

    const body = commentDrafts[moment.id]?.trim();

    if (!body) {
      return;
    }

    setPendingCommentMomentId(moment.id);
    setMessage(undefined);

    try {
      const comment = await communityApi.addTravelRoomMomentComment(
        room.id,
        moment.id,
        body,
      );

      if (!comment) {
        setMessage("로그인 후 후보 리캡에 댓글을 남길 수 있어요.");
        return;
      }

      setRoomById(appendRoomMomentComment(room, moment.id, comment));
      setCommentDrafts((drafts) => ({ ...drafts, [moment.id]: "" }));
      setMessage("후보 리캡에 댓글을 남겼어요.");
    } catch {
      setMessage(
        "댓글을 저장하지 못했어요. 여행방 참여 상태나 네트워크를 확인해주세요.",
      );
    } finally {
      setPendingCommentMomentId(undefined);
    }
  };

  const handleCreateRecap = async () => {
    if (!room || isCreatingRecap) {
      return;
    }

    setIsCreatingRecap(true);
    setMessage(undefined);

    try {
      const representativeTrackId =
        sortedMoments.find(
          (moment) => moment.status === "accepted" && moment.track,
        )?.track?.id ?? sortedMoments.find((moment) => moment.track)?.track?.id;
      const recap = await communityApi.createTravelRoomRecap(room.id, {
        representativeTrackId,
        templateId: "album",
        title: `${room.title} 공동 Recap`,
      });

      if (!recap) {
        setMessage(
          "공동 Recap 생성은 로그인된 서버 세션에서 사용할 수 있어요.",
        );
        return;
      }

      router.push(`/recap-share/${recap.id}` as never);
    } catch {
      setMessage(
        "공동 Recap 생성에 실패했어요. 채택 후보나 대표 곡을 확인해주세요.",
      );
    } finally {
      setIsCreatingRecap(false);
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: getTabBarHeight(insets.bottom) + 32,
          paddingHorizontal: 20,
          paddingTop: 18,
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
          title="공동 여행방"
        />

        {isLoading ? (
          <View className="mt-7">
            <SectionTitle title="여행방 정보" />
            <SettingsRow
              description="동행자가 올린 후보와 댓글을 최신 상태로 확인하고 있어요."
              icon="loader"
              label="여행방을 불러오고 있어요"
            />
          </View>
        ) : !room ? (
          <View className="mt-7">
            <SectionTitle title="여행방 정보" />
            <SettingsRow
              description="초대 코드로 먼저 참여하거나 네트워크 상태를 확인해주세요."
              icon="alert-circle"
              label="여행방을 찾지 못했어요"
            />
            {message ? (
              <AppText className="ml-12 mt-2 text-xs leading-5 text-white/45">
                {message}
              </AppText>
            ) : null}
          </View>
        ) : (
          <>
            <View className="mt-7">
              <SectionTitle
                rightContent={
                  <AppText className="text-xs font-semibold text-soundlog-lime">
                    {canModerate ? "방장" : "참여자"}
                  </AppText>
                }
                title={room.title}
              />
              <AppText className="mt-2 text-sm leading-6 text-white/52">
                동행자의 사진, 곡과 메모를 모아 하나의 공동 리캡으로 정리해요.
              </AppText>
              <SettingsRow
                disabled={isSharingInvite}
                icon="send"
                label="초대 코드"
                onPress={() => void handleShareInvite()}
                rightText={isSharingInvite ? "공유 중" : room.inviteCode}
              />
              <SettingsRow
                icon="users"
                label="참여자"
                rightText={`${room.memberCount}명`}
              />
              <SettingsRow
                icon="image"
                label="리캡 후보"
                rightText={`${room.momentCount}개`}
              />
              <SettingsRow
                icon="check-circle"
                label="채택된 후보"
                rightText={`${acceptedMomentCount}개`}
              />

              {message ? (
                <AppText className="ml-12 mt-2 text-xs leading-5 text-white/56">
                  {message}
                </AppText>
              ) : null}

              <View className="mt-4 flex-row gap-2">
                <SoundlogButton
                  disabled={!currentTrack || isAddingMoment}
                  fullWidth
                  iconName="music"
                  label={isAddingMoment ? "추가 중" : "현재 곡 후보 추가"}
                  onPress={() => void handleAddCurrentTrack()}
                  variant="ghost"
                />
                <SoundlogButton
                  disabled={isCreatingRecap || room.momentCount === 0}
                  fullWidth
                  iconName="image"
                  label={isCreatingRecap ? "생성 중" : "Recap 생성"}
                  onPress={() => void handleCreateRecap()}
                />
              </View>
            </View>

            <View className="mt-7">
              <SectionTitle title="참여자" />
              <View className="mt-1">
                {room.members.map((member) => (
                  <SettingsRow
                    description={member.role === "owner" ? "방장" : "참여자"}
                    icon="user"
                    key={member.id}
                    label={createMemberLabel(member, currentUserId)}
                    rightText={member.userId === currentUserId ? "나" : undefined}
                  />
                ))}
              </View>
            </View>

            <View className="mt-7">
              <SectionTitle title="리캡 후보" />
              <AppText className="mt-1 text-xs leading-5 text-white/45">
                채택된 후보가 있으면 채택 후보만 공동 리캡에 우선 반영돼요.
              </AppText>

              <View className="mt-3 gap-3">
                {sortedMoments.length === 0 ? (
                  <SettingsRow
                    description="현재 곡을 먼저 올리거나 초대 코드로 동행자를 초대해보세요."
                    icon="music"
                    label="아직 후보가 없어요"
                  />
                ) : (
                  sortedMoments.map((moment) => {
                    const isPendingStatus = pendingStatusMomentId === moment.id;
                    const isPendingComment =
                      pendingCommentMomentId === moment.id;
                    const commentDraft = commentDrafts[moment.id] ?? "";

                    return (
                      <View
                        className="rounded-lg border border-white/10 bg-white/[0.06] p-4"
                        key={moment.id}
                      >
                        <View className="flex-row items-start justify-between gap-3">
                          <View className="min-w-0 flex-1">
                            <AppText
                              className="text-base font-semibold text-white"
                              numberOfLines={1}
                            >
                              {moment.placeName ?? "장소 미정"}
                            </AppText>
                            <AppText
                              className="mt-1 text-xs leading-5 text-white/55"
                              numberOfLines={2}
                            >
                              {createMomentTrackLabel(moment)}
                              {moment.note ? ` · ${moment.note}` : ""}
                            </AppText>
                          </View>
                          <View
                            className={`rounded px-2.5 py-1 ${
                              moment.status === "accepted"
                                ? "bg-soundlog-lime"
                                : "bg-white/10"
                            }`}
                          >
                            <AppText
                              className={`text-[10px] font-semibold ${
                                moment.status === "accepted"
                                  ? "text-soundlog-inverse"
                                  : "text-white/60"
                              }`}
                            >
                              {createStatusLabel(moment.status)}
                            </AppText>
                          </View>
                        </View>

                        {moment.comments?.length ? (
                          <View className="mt-3 gap-2 border-t border-white/10 pt-3">
                            {moment.comments.map((comment) => (
                              <AppText
                                className="text-xs leading-5 text-white/55"
                                key={comment.id}
                              >
                                {comment.userId} · {comment.body}
                              </AppText>
                            ))}
                          </View>
                        ) : null}

                        <TextInput
                          className="mt-3 min-h-[42px] rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-white"
                          editable={!isPendingComment}
                          multiline
                          onChangeText={(value) =>
                            setCommentDrafts((drafts) => ({
                              ...drafts,
                              [moment.id]: value,
                            }))
                          }
                          placeholder="후보에 댓글 남기기"
                          placeholderTextColor="rgba(255,255,255,0.35)"
                          value={commentDraft}
                        />

                        <View className="mt-3 flex-row gap-2">
                          {canModerate ? (
                            <SoundlogButton
                              disabled={isPendingStatus}
                              fullWidth
                              iconName={
                                moment.status === "accepted"
                                  ? "rotate-ccw"
                                  : "check"
                              }
                              label={
                                isPendingStatus
                                  ? "변경 중"
                                  : moment.status === "accepted"
                                    ? "후보로"
                                    : "채택"
                              }
                              onPress={() =>
                                void handleToggleMomentStatus(moment)
                              }
                              size="compact"
                              variant={
                                moment.status === "accepted"
                                  ? "ghost"
                                  : "primary"
                              }
                            />
                          ) : null}
                          <SoundlogButton
                            disabled={isPendingComment || !commentDraft.trim()}
                            fullWidth
                            iconName="message-circle"
                            label={
                              isPendingComment ? "댓글 저장 중" : "댓글 추가"
                            }
                            onPress={() => void handleSubmitComment(moment)}
                            size="compact"
                            variant="ghost"
                          />
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
