import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { communityApi } from "@/api/communityApi";
import { AppText } from "@/components/AppText";
import {
  SoundlogButton,
  SoundlogMetric,
  SoundlogSurface,
} from "@/design-system";
import { useAuthStore } from "@/store/authStore";
import { useTravelRoomStore } from "@/store/travelRoomStore";
import type {
  PlaceContext,
  RecapItem,
  Track,
  TravelRoom,
  TravelRoomMoment,
} from "@/types/domain";
import { shareTravelRoomInvite } from "@/utils/travelRoomInvite";

type CommunityRecapCardProps = {
  currentPlace?: PlaceContext;
  currentTrack?: Track;
  momentCount: number;
  onRecapCreated: (recap: RecapItem) => void;
  sessionId: string;
  sessionStatus: "active" | "ended" | "idle";
  trackCount: number;
};

const previewMembers = ["나", "수", "재", "채"];
const previewContributors = ["수경", "재걸", "채린"];
const COLLAPSED_MOMENT_COUNT = 2;
const MAX_MEMBER_AVATAR_COUNT = 5;

type TravelRoomMomentComment = NonNullable<
  TravelRoomMoment["comments"]
>[number];
type TravelRoomMember = TravelRoom["members"][number];

function createPreviewCandidateMoments(
  placeName: string,
  currentTrack?: Track,
): TravelRoomMoment[] {
  const fallbackTrack: Track = currentTrack ?? {
    artist: "Soundlog",
    fallbackColor: "#2B176C",
    id: "preview-community-track",
    title: "곡명 A",
  };

  return [
    {
      commentCount: 1,
      createdAt: new Date().toISOString(),
      id: "preview-candidate-ocean",
      placeName:
        placeName === "이번 여행" ? "주문진 바다 컷" : `${placeName} 컷`,
      status: "candidate",
      track: fallbackTrack,
      userId: "수경",
    },
    {
      commentCount: 2,
      createdAt: new Date().toISOString(),
      id: "preview-candidate-cafe",
      note: "카페 거리 컷",
      placeName: "카페 거리 컷",
      status: "candidate",
      track: currentTrack
        ? {
            ...currentTrack,
            id: `${currentTrack.id}-community-alt`,
            title: currentTrack.title,
          }
        : {
            artist: "Soundlog",
            fallbackColor: "#B7E628",
            id: "preview-community-track-b",
            title: "곡명 B",
          },
      userId: "재걸",
    },
  ];
}

function getUniqueTrackCount(moments: TravelRoomMoment[]) {
  return new Set(moments.map((moment) => moment.track?.id).filter(Boolean))
    .size;
}

function getMemberLabel(
  member: TravelRoomMember,
  index: number,
  currentUserId?: string,
) {
  if (member.userId === currentUserId) {
    return "나";
  }

  const displayName = member.displayName ?? member.userId;
  return Array.from(displayName.trim())[0] ?? String(index + 1);
}

function getMemberCaption(member: TravelRoomMember, currentUserId?: string) {
  const name =
    member.userId === currentUserId ? "나" : (member.displayName ?? "동행자");
  const role = member.role === "owner" ? "방장" : "참여자";

  return `${name} · ${role}`;
}

function CandidateMomentRow({
  canComment,
  canModerate,
  commentDraft,
  commentsExpanded,
  index,
  moment,
  onChangeComment,
  onSubmitComment,
  onToggleComments,
  onToggleStatus,
  pendingComment,
  pendingStatus,
}: {
  canComment: boolean;
  canModerate: boolean;
  commentDraft: string;
  commentsExpanded: boolean;
  index: number;
  moment: TravelRoomMoment;
  onChangeComment: (value: string) => void;
  onSubmitComment: () => void;
  onToggleComments: () => void;
  onToggleStatus: () => void;
  pendingComment: boolean;
  pendingStatus: boolean;
}) {
  const contributor = moment.userId || previewContributors[index] || "동행자";
  const trackLabel = moment.track
    ? `${contributor} 추가 · ${moment.track.title}`
    : `${contributor} 추가 · ${moment.note ?? "곡 없이 남긴 후보"}`;
  const latestComment = moment.comments?.at(-1);
  const commentCount = moment.commentCount ?? moment.comments?.length ?? 0;
  const visibleComments = commentsExpanded
    ? (moment.comments ?? [])
    : latestComment
      ? [latestComment]
      : [];
  const nextStatusLabel = moment.status === "accepted" ? "후보로" : "채택";

  return (
    <View className="rounded-[16px] border border-white/10 bg-black/20 px-4 py-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <AppText
            className="text-sm font-semibold text-white"
            numberOfLines={1}
          >
            {moment.placeName ?? "장소 미정"}
          </AppText>
          <AppText
            className="mt-1 text-xs leading-5 text-white/55"
            numberOfLines={2}
          >
            {trackLabel}
          </AppText>
        </View>
        {canModerate ? (
          <Pressable
            accessibilityRole="button"
            className={`
              rounded-full px-2.5 py-1
              ${moment.status === "accepted" ? "bg-white/10" : "bg-soundlog-lime"}
            `}
            disabled={pendingStatus}
            onPress={onToggleStatus}
          >
            <AppText
              className={`
                text-[10px] font-semibold
                ${moment.status === "accepted" ? "text-white/65" : "text-soundlog-inverse"}
              `}
            >
              {pendingStatus ? "변경 중" : nextStatusLabel}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <View className="mt-3 flex-row gap-2">
        <View className="rounded-full bg-white/10 px-3 py-1.5">
          <AppText className="text-[11px] font-semibold text-white/65">
            {moment.status === "accepted" ? "채택됨" : "채택 후보"}
          </AppText>
        </View>
        <View className="rounded-full bg-white/10 px-3 py-1.5">
          <AppText className="text-[11px] font-semibold text-white/65">
            댓글 {commentCount}
          </AppText>
        </View>
      </View>

      {commentCount > 0 ? (
        <View className="mt-3 gap-2 rounded-[12px] bg-white/5 px-3 py-2">
          <Pressable accessibilityRole="button" onPress={onToggleComments}>
            <AppText className="text-[11px] font-semibold text-soundlog-lime">
              {commentsExpanded ? "댓글 접기" : `댓글 ${commentCount}개 보기`}
            </AppText>
          </Pressable>
          {visibleComments.length > 0 ? (
            visibleComments.map((comment) => (
              <AppText
                className="text-[11px] leading-5 text-white/55"
                key={comment.id}
                numberOfLines={commentsExpanded ? undefined : 2}
              >
                {comment.userId} · {comment.body}
              </AppText>
            ))
          ) : (
            <AppText className="text-[11px] leading-5 text-white/45">
              댓글 목록은 여행방을 다시 열면 불러올 수 있어요.
            </AppText>
          )}
        </View>
      ) : null}

      {canComment ? (
        <View className="mt-3 gap-2">
          <TextInput
            className="min-h-[42px] rounded-[14px] border border-white/10 bg-white/10 px-3 py-2 text-xs text-white"
            editable={!pendingComment}
            multiline
            onChangeText={onChangeComment}
            placeholder="후보에 댓글 남기기"
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={commentDraft}
          />
          <Pressable
            accessibilityRole="button"
            className="h-9 items-center justify-center rounded-full border border-soundlog-lime/40 bg-soundlog-lime/10"
            disabled={pendingComment || !commentDraft.trim()}
            onPress={onSubmitComment}
            style={{
              opacity: pendingComment || !commentDraft.trim() ? 0.55 : 1,
            }}
          >
            <AppText className="text-xs font-semibold text-soundlog-lime">
              {pendingComment ? "댓글 저장 중" : "댓글 추가"}
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

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

export function CommunityRecapCard({
  currentPlace,
  currentTrack,
  momentCount,
  onRecapCreated,
  sessionId,
  sessionStatus,
  trackCount,
}: CommunityRecapCardProps) {
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isAddingMoment, setIsAddingMoment] = useState(false);
  const [isCreatingRecap, setIsCreatingRecap] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [isRestoringRoom, setIsRestoringRoom] = useState(false);
  const [isSharingInvite, setIsSharingInvite] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {},
  );
  const [expandedCommentIds, setExpandedCommentIds] = useState<
    Record<string, true>
  >({});
  const [joinDisplayName, setJoinDisplayName] = useState("");
  const [joinInviteCode, setJoinInviteCode] = useState("");
  const [message, setMessage] = useState<string>();
  const [pendingCommentMomentId, setPendingCommentMomentId] =
    useState<string>();
  const [pendingStatusMomentId, setPendingStatusMomentId] = useState<string>();
  const [showAllMoments, setShowAllMoments] = useState(false);
  const authStatus = useAuthStore((state) => state.status);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const room = useTravelRoomStore((state) => state.roomsBySessionId[sessionId]);
  const setTravelRoom = useTravelRoomStore((state) => state.setRoom);

  const placeName = currentPlace?.title ?? "이번 여행";
  const canUseRoom = sessionStatus !== "idle";
  const normalizedInviteCode = joinInviteCode.trim().toUpperCase();
  const previewCandidateMoments = createPreviewCandidateMoments(
    placeName,
    currentTrack,
  );
  const allCandidateMoments = room?.moments ?? previewCandidateMoments;
  const candidateMoments = showAllMoments
    ? allCandidateMoments
    : allCandidateMoments.slice(0, COLLAPSED_MOMENT_COUNT);
  const hiddenMomentCount = Math.max(
    allCandidateMoments.length - candidateMoments.length,
    0,
  );
  const displayMemberCount = room?.memberCount ?? 4;
  const displayMomentCount =
    room?.momentCount ?? Math.max(momentCount, candidateMoments.length);
  const displayTrackCount = room
    ? Math.max(getUniqueTrackCount(room.moments), 1)
    : Math.max(trackCount, currentTrack ? 1 : candidateMoments.length);
  const displayRoomTitle = room?.title ?? `${placeName} 여행방`;
  const myMemberRole = room?.members.find(
    (member) => member.userId === currentUserId,
  )?.role;
  const canCommentRoom = Boolean(room && authStatus === "authenticated");
  const canModerateRoom = myMemberRole === "owner";
  const visibleMembers = room?.members.slice(0, MAX_MEMBER_AVATAR_COUNT);
  const memberOverflowCount = Math.max(
    (room?.memberCount ?? 0) - (visibleMembers?.length ?? 0),
    0,
  );

  useEffect(() => {
    if (!canUseRoom || room || authStatus !== "authenticated" || !sessionId) {
      return;
    }

    let ignore = false;

    setIsRestoringRoom(true);
    communityApi
      .getTravelRooms({ limit: 1, sessionId })
      .then((rooms) => {
        if (ignore) {
          return;
        }

        const restoredRoom = rooms[0];

        if (restoredRoom) {
          setTravelRoom(sessionId, restoredRoom);
          setMessage(undefined);
        }
      })
      .catch(() => {
        if (!ignore) {
          setMessage(
            "기존 공동 여행방을 불러오지 못했어요. 초대 코드는 직접 입력할 수 있어요.",
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsRestoringRoom(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [authStatus, canUseRoom, room, sessionId, setTravelRoom]);

  const handleCreateRoom = async () => {
    if (!canUseRoom || isCreatingRoom) {
      return;
    }

    setIsCreatingRoom(true);
    setMessage(undefined);

    try {
      const nextRoom = await communityApi.createTravelRoom({
        sessionId,
        title: `${placeName} 사운드 여행방`,
        visibility: "invite_only",
      });

      if (!nextRoom) {
        setMessage("로그인 후 공동 Recap 여행방을 만들 수 있어요.");
        return;
      }

      setTravelRoom(sessionId, nextRoom);
      setMessage(
        "초대 코드를 공유하면 동행자가 Moment 후보를 함께 올릴 수 있어요.",
      );
    } catch {
      setMessage("공동 여행방을 만들지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsCreatingRoom(false);
    }
  };
  const handleOpenRoomDetail = () => {
    if (!room) {
      return;
    }

    router.push(`/travel-room/${room.id}` as never);
  };
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
        setMessage("서버에 연결된 로그인 상태에서 후보를 추가할 수 있어요.");
        return;
      }

      const nextRoom = {
        ...room,
        momentCount: room.momentCount + 1,
        moments: [moment, ...room.moments],
      };

      setTravelRoom(sessionId, nextRoom);
      setMessage("현재 선택 곡을 공동 Recap 후보에 추가했어요.");
    } catch {
      setMessage(
        "후보 추가에 실패했어요. 현재 곡이나 네트워크 상태를 확인해주세요.",
      );
    } finally {
      setIsAddingMoment(false);
    }
  };

  const handleCreateRecap = async () => {
    if (!room || isCreatingRecap) {
      return;
    }

    setIsCreatingRecap(true);
    setMessage(undefined);

    try {
      const recap = await communityApi.createTravelRoomRecap(room.id, {
        representativeTrackId: currentTrack?.id,
        templateId: "album",
        title: `${placeName} 공동 Recap`,
      });

      if (!recap) {
        setMessage(
          "공동 Recap 생성은 로그인된 서버 세션에서 사용할 수 있어요.",
        );
        return;
      }

      setMessage("공동 Recap을 만들었어요.");
      onRecapCreated(recap);
    } catch {
      setMessage(
        "공동 로그 생성에 실패했어요. 후보 리캡이 있는지 확인해주세요.",
      );
    } finally {
      setIsCreatingRecap(false);
    }
  };
  const handleJoinRoom = async () => {
    if (!canUseRoom || isJoiningRoom || !normalizedInviteCode) {
      return;
    }

    setIsJoiningRoom(true);
    setMessage(undefined);

    try {
      const nextRoom = await communityApi.joinTravelRoomByInviteCode({
        displayName: joinDisplayName.trim() || undefined,
        inviteCode: normalizedInviteCode,
      });

      if (!nextRoom) {
        setMessage("로그인 후 초대 코드로 공동 여행방에 참여할 수 있어요.");
        return;
      }

      setTravelRoom(sessionId, nextRoom);
      setJoinDisplayName("");
      setJoinInviteCode("");
      setMessage(
        "공동 여행방에 참여했어요. 이제 현재 곡을 Recap 후보로 올릴 수 있어요.",
      );
    } catch {
      setMessage(
        "초대 코드로 여행방에 참여하지 못했어요. 코드를 다시 확인해주세요.",
      );
    } finally {
      setIsJoiningRoom(false);
    }
  };
  const handleToggleMomentStatus = async (moment: TravelRoomMoment) => {
    if (!room || !canModerateRoom || pendingStatusMomentId) {
      return;
    }

    setPendingStatusMomentId(moment.id);
    setMessage(undefined);

    try {
      const nextStatus =
        moment.status === "accepted" ? "candidate" : "accepted";
      const updatedMoment = await communityApi.updateTravelRoomMomentStatus(
        room.id,
        moment.id,
        nextStatus,
      );

      if (!updatedMoment) {
        setMessage("방장 계정으로 로그인하면 후보 채택 상태를 바꿀 수 있어요.");
        return;
      }

      setTravelRoom(sessionId, replaceRoomMoment(room, updatedMoment));
      setMessage(
        nextStatus === "accepted"
          ? "후보 리캡을 채택했어요."
          : "후보 상태로 되돌렸어요.",
      );
    } catch {
      setMessage(
        "후보 상태를 변경하지 못했어요. 방장 권한이나 네트워크 상태를 확인해주세요.",
      );
    } finally {
      setPendingStatusMomentId(undefined);
    }
  };
  const handleSubmitMomentComment = async (moment: TravelRoomMoment) => {
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

      setTravelRoom(
        sessionId,
        appendRoomMomentComment(room, moment.id, comment),
      );
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

  return (
    <SoundlogSurface className="mt-8 p-5" variant="glass">
      <View className="flex-row items-start gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-white/10">
          <Feather color="#B7E628" name="users" size={19} />
        </View>
        <View className="min-w-0 flex-1">
          <AppText className="text-xs font-semibold text-soundlog-lime">
            Collaborative Recap
          </AppText>
          <AppText className="mt-2 text-[22px] font-semibold leading-7 text-white">
            {displayRoomTitle}
          </AppText>
          <AppText className="mt-2 text-sm leading-6 text-white/60">
            {displayMemberCount}명이 함께 만드는 사운드트랙 앨범
          </AppText>
        </View>
      </View>

      <View className="mt-4 flex-row items-center gap-2">
        {room
          ? visibleMembers?.map((member, index) => (
              <View
                className={`h-9 w-9 items-center justify-center rounded-full border border-white/15 ${
                  member.userId === currentUserId
                    ? "bg-soundlog-lime"
                    : "bg-white/10"
                }`}
                key={member.id}
              >
                <AppText
                  className={`text-xs font-semibold ${
                    member.userId === currentUserId
                      ? "text-soundlog-inverse"
                      : "text-white"
                  }`}
                >
                  {getMemberLabel(member, index, currentUserId)}
                </AppText>
              </View>
            ))
          : previewMembers.slice(0, displayMemberCount).map((member, index) => (
              <View
                className={`h-9 w-9 items-center justify-center rounded-full border border-white/15 ${
                  index === 0 ? "bg-soundlog-lime" : "bg-white/10"
                }`}
                key={`${member}-${index}`}
              >
                <AppText
                  className={`text-xs font-semibold ${
                    index === 0 ? "text-soundlog-inverse" : "text-white"
                  }`}
                >
                  {member}
                </AppText>
              </View>
            ))}
        {memberOverflowCount > 0 ? (
          <View className="h-9 items-center justify-center rounded-full border border-white/15 bg-white/10 px-3">
            <AppText className="text-xs font-semibold text-white">
              +{memberOverflowCount}
            </AppText>
          </View>
        ) : null}
        <AppText
          className="ml-1 flex-1 text-xs text-white/45"
          numberOfLines={2}
        >
          {room && visibleMembers?.length
            ? visibleMembers
                .map((member) => getMemberCaption(member, currentUserId))
                .join(" · ")
            : "초대 코드로 함께 참여"}
        </AppText>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-3">
        <SoundlogMetric
          compact
          label="순간"
          value={`${displayMomentCount}개`}
        />
        <SoundlogMetric compact label="곡" value={`${displayTrackCount}개`} />
        <SoundlogMetric
          compact
          label="참여자"
          value={`${displayMemberCount}명`}
        />
      </View>

      {isRestoringRoom ? (
        <View className="mt-4 rounded-[16px] bg-black/20 px-4 py-3">
          <AppText className="text-xs leading-5 text-white/60">
            서버에서 현재 여행의 공동 여행방을 확인하고 있어요.
          </AppText>
        </View>
      ) : null}

      {message ? (
        <View className="mt-4 rounded-[16px] bg-black/20 px-4 py-3">
          <AppText className="text-xs leading-5 text-white/60">
            {message}
          </AppText>
        </View>
      ) : null}

      <View className="mt-4 gap-2">
        <View className="flex-row items-center justify-between">
          <AppText className="text-sm font-semibold text-white">
            Recap 후보
          </AppText>
          <AppText className="text-[11px] font-semibold text-white/40">
            {room?.inviteCode
              ? `초대 코드 ${room.inviteCode}`
              : "초대 코드 기반 참여"}
          </AppText>
        </View>

        {candidateMoments.length === 0 ? (
          <View className="rounded-[16px] border border-white/10 bg-black/20 px-4 py-3">
            <AppText className="text-xs leading-5 text-white/55">
              아직 후보가 없어요. 현재 곡을 먼저 올리거나 초대 코드로 동행자를
              초대해보세요.
            </AppText>
          </View>
        ) : (
          candidateMoments.map((moment, index) => (
            <CandidateMomentRow
              canComment={canCommentRoom}
              canModerate={canModerateRoom}
              commentDraft={commentDrafts[moment.id] ?? ""}
              index={index}
              key={moment.id}
              moment={moment}
              onChangeComment={(value) =>
                setCommentDrafts((drafts) => ({
                  ...drafts,
                  [moment.id]: value,
                }))
              }
              onSubmitComment={() => void handleSubmitMomentComment(moment)}
              onToggleComments={() =>
                setExpandedCommentIds((state) => {
                  if (state[moment.id]) {
                    const nextState = { ...state };
                    delete nextState[moment.id];
                    return nextState;
                  }

                  return { ...state, [moment.id]: true };
                })
              }
              onToggleStatus={() => void handleToggleMomentStatus(moment)}
              pendingComment={pendingCommentMomentId === moment.id}
              pendingStatus={pendingStatusMomentId === moment.id}
              commentsExpanded={Boolean(expandedCommentIds[moment.id])}
            />
          ))
        )}
        {allCandidateMoments.length > COLLAPSED_MOMENT_COUNT ? (
          <Pressable
            accessibilityRole="button"
            className="h-10 items-center justify-center rounded-full border border-white/10 bg-white/10"
            onPress={() => setShowAllMoments((value) => !value)}
          >
            <AppText className="text-xs font-semibold text-white/70">
              {showAllMoments
                ? "후보 접기"
                : `후보 ${hiddenMomentCount}개 더 보기`}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {!room ? (
        <View className="mt-4 rounded-[16px] border border-white/10 bg-black/20 px-4 py-3">
          <AppText className="text-xs leading-5 text-white/55">
            서버 여행방을 만들면 이 미리보기 후보 대신 동행자가 올린 사진, 곡,
            메모가 실시간으로 쌓여요.
          </AppText>
        </View>
      ) : null}

      <View className="mt-4 gap-2">
        {!room ? (
          <>
            <View className="gap-2 rounded-[16px] border border-white/10 bg-black/20 p-3">
              <TextInput
                autoCapitalize="characters"
                className="h-11 rounded-[14px] border border-white/10 bg-white/10 px-3 text-sm font-semibold text-white"
                editable={!isJoiningRoom}
                onChangeText={(text) => setJoinInviteCode(text.toUpperCase())}
                placeholder="초대 코드"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={joinInviteCode}
              />
              <TextInput
                className="h-11 rounded-[14px] border border-white/10 bg-white/10 px-3 text-sm text-white"
                editable={!isJoiningRoom}
                onChangeText={setJoinDisplayName}
                placeholder="표시 이름"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={joinDisplayName}
              />
              <SoundlogButton
                disabled={!canUseRoom || isJoiningRoom || !normalizedInviteCode}
                iconName="log-in"
                label={isJoiningRoom ? "참여 중" : "초대 코드로 참여"}
                onPress={() => void handleJoinRoom()}
                variant="ghost"
              />
            </View>
            <Pressable
              accessibilityRole="button"
              className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-full bg-soundlog-lime px-4"
              disabled={!canUseRoom || isCreatingRoom}
              onPress={() => void handleCreateRoom()}
              style={{ opacity: !canUseRoom || isCreatingRoom ? 0.55 : 1 }}
            >
              <Feather color="#050916" name="plus" size={16} />
              <AppText className="text-sm font-semibold text-soundlog-inverse">
                {isCreatingRoom ? "여행방 생성 중" : "새 여행방 만들기"}
              </AppText>
            </Pressable>
          </>
        ) : (
          <View className="gap-2">
            <View className="flex-row gap-2">
              <SoundlogButton
                fullWidth
                iconName="list"
                label="여행방 자세히"
                onPress={handleOpenRoomDetail}
                variant="ghost"
              />
              <SoundlogButton
                disabled={isSharingInvite}
                fullWidth
                iconName="send"
                label={isSharingInvite ? "공유 중" : "초대 공유"}
                onPress={() => void handleShareInvite()}
                variant="ghost"
              />
            </View>
            <SoundlogButton
              disabled={isAddingMoment || !currentTrack}
              iconName="music"
              label={isAddingMoment ? "후보 추가 중" : "현재 곡 후보 추가"}
              onPress={() => void handleAddCurrentTrack()}
              variant="ghost"
            />
            <SoundlogButton
              disabled={isCreatingRecap || room.momentCount === 0}
              iconName="image"
              label={isCreatingRecap ? "Recap 생성 중" : "공동 Recap 생성"}
              onPress={() => void handleCreateRecap()}
            />
          </View>
        )}
      </View>
    </SoundlogSurface>
  );
}
