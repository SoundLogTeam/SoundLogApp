import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { communityApi } from '@/api/communityApi';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { getTabBarHeight } from '@/constants/layout';
import { SoundlogButton, SoundlogMetric, SoundlogSurface } from '@/design-system';
import { useAuthStore } from '@/store/authStore';
import { usePlayerStore } from '@/store/playerStore';
import { useTravelRoomStore } from '@/store/travelRoomStore';
import { useTravelSessionStore } from '@/store/travelSessionStore';
import type { TravelRoom, TravelRoomMoment } from '@/types/domain';
import { shareTravelRoomInvite } from '@/utils/travelRoomInvite';

type TravelRoomDetailScreenProps = {
  roomId: string;
};

type TravelRoomMomentComment = NonNullable<TravelRoomMoment['comments']>[number];

function replaceRoomMoment(room: TravelRoom, updatedMoment: TravelRoomMoment): TravelRoom {
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

function createMemberLabel(member: TravelRoom['members'][number], currentUserId?: string) {
  if (member.userId === currentUserId) {
    return '나';
  }

  return member.displayName ?? '동행자';
}

function createMomentTrackLabel(moment: TravelRoomMoment) {
  if (!moment.track) {
    return moment.note ?? '음악 없이 남긴 후보';
  }

  return `${moment.track.title} - ${moment.track.artist}`;
}

function createStatusLabel(status: TravelRoomMoment['status']) {
  if (status === 'accepted') {
    return '채택됨';
  }

  if (status === 'rejected') {
    return '보류';
  }

  return '채택 후보';
}

function sortMoments(moments: TravelRoomMoment[]) {
  return [...moments].sort((first, second) => {
    if (first.status === second.status) {
      return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
    }

    return first.status === 'accepted' ? -1 : 1;
  });
}

export function TravelRoomDetailScreen({ roomId }: TravelRoomDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const authStatus = useAuthStore((state) => state.status);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const cachedRoom = useTravelRoomStore((state) => state.roomsById[roomId]);
  const setRoomById = useTravelRoomStore((state) => state.setRoomById);
  const { currentTrack } = usePlayerStore();
  const currentPlace = useTravelSessionStore((state) => state.currentPlace);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [isAddingMoment, setIsAddingMoment] = useState(false);
  const [isCreatingRecap, setIsCreatingRecap] = useState(false);
  const [isLoading, setIsLoading] = useState(!cachedRoom);
  const [isSharingInvite, setIsSharingInvite] = useState(false);
  const [message, setMessage] = useState<string>();
  const [pendingCommentMomentId, setPendingCommentMomentId] = useState<string>();
  const [pendingStatusMomentId, setPendingStatusMomentId] = useState<string>();
  const room = cachedRoom;
  const hasCachedRoom = Boolean(cachedRoom);
  const sortedMoments = useMemo(() => sortMoments(room?.moments ?? []), [room?.moments]);
  const acceptedMomentCount = sortedMoments.filter((moment) => moment.status === 'accepted').length;
  const myMemberRole = room?.members.find((member) => member.userId === currentUserId)?.role;
  const canModerate = myMemberRole === 'owner';
  const canUseServerRoom = authStatus === 'authenticated';

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
          setMessage('여행방을 불러오지 못했어요. 초대 코드나 로그인 상태를 확인해주세요.');
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
        result === 'copied'
          ? '초대 메시지를 클립보드에 복사했어요.'
          : '초대 메시지를 공유했어요.',
      );
    } catch {
      setMessage('초대 메시지를 공유하지 못했어요. 초대 코드를 직접 전달해주세요.');
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
        setMessage('로그인된 서버 세션에서 후보를 추가할 수 있어요.');
        return;
      }

      setRoomById({
        ...room,
        momentCount: room.momentCount + 1,
        moments: [moment, ...room.moments],
      });
      setMessage('현재 곡을 공동 Recap 후보에 추가했어요.');
    } catch {
      setMessage('후보를 추가하지 못했어요. 현재 곡이나 네트워크 상태를 확인해주세요.');
    } finally {
      setIsAddingMoment(false);
    }
  };

  const handleToggleMomentStatus = async (moment: TravelRoomMoment) => {
    if (!room || !canModerate || pendingStatusMomentId) {
      return;
    }

    const nextStatus = moment.status === 'accepted' ? 'candidate' : 'accepted';

    setPendingStatusMomentId(moment.id);
    setMessage(undefined);

    try {
      const updatedMoment = await communityApi.updateTravelRoomMomentStatus(
        room.id,
        moment.id,
        nextStatus,
      );

      if (!updatedMoment) {
        setMessage('방장 계정으로 로그인하면 후보 채택 상태를 바꿀 수 있어요.');
        return;
      }

      setRoomById(replaceRoomMoment(room, updatedMoment));
      setMessage(nextStatus === 'accepted' ? '후보 Moment를 채택했어요.' : '후보로 되돌렸어요.');
    } catch {
      setMessage('후보 상태를 변경하지 못했어요. 방장 권한이나 네트워크 상태를 확인해주세요.');
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
      const comment = await communityApi.addTravelRoomMomentComment(room.id, moment.id, body);

      if (!comment) {
        setMessage('로그인 후 후보 Moment에 댓글을 남길 수 있어요.');
        return;
      }

      setRoomById(appendRoomMomentComment(room, moment.id, comment));
      setCommentDrafts((drafts) => ({ ...drafts, [moment.id]: '' }));
      setMessage('후보 Moment에 댓글을 남겼어요.');
    } catch {
      setMessage('댓글을 저장하지 못했어요. 여행방 참여 상태나 네트워크를 확인해주세요.');
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
        sortedMoments.find((moment) => moment.status === 'accepted' && moment.track)?.track?.id ??
        sortedMoments.find((moment) => moment.track)?.track?.id;
      const recap = await communityApi.createTravelRoomRecap(room.id, {
        representativeTrackId,
        templateId: 'album',
        title: `${room.title} 공동 Recap`,
      });

      if (!recap) {
        setMessage('공동 Recap 생성은 로그인된 서버 세션에서 사용할 수 있어요.');
        return;
      }

      router.push(`/recap-share/${recap.id}` as never);
    } catch {
      setMessage('공동 Recap 생성에 실패했어요. 채택 후보나 대표 곡을 확인해주세요.');
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
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10"
            onPress={() => router.back()}
          >
            <Feather color="#FFFFFF" name="chevron-left" size={20} />
          </Pressable>
          <AppText className="text-xs font-semibold text-white/45">공동 Recap</AppText>
        </View>

        {isLoading ? (
          <SoundlogSurface className="mt-6 p-5" variant="glass">
            <AppText className="text-base font-semibold text-white">여행방을 불러오고 있어요</AppText>
            <AppText className="mt-2 text-sm leading-6 text-white/55">
              동행자가 올린 후보와 댓글을 최신 상태로 확인하고 있어요.
            </AppText>
          </SoundlogSurface>
        ) : !room ? (
          <SoundlogSurface className="mt-6 p-5" variant="glass">
            <AppText className="text-[22px] font-semibold text-white">여행방을 찾지 못했어요</AppText>
            <AppText className="mt-3 text-sm leading-6 text-white/55">
              초대 코드로 먼저 참여하거나 네트워크 상태를 확인해주세요.
            </AppText>
            {message ? (
              <AppText className="mt-3 text-xs leading-5 text-white/45">{message}</AppText>
            ) : null}
          </SoundlogSurface>
        ) : (
          <>
            <SoundlogSurface className="mt-6 p-5" variant="hero">
              <View className="flex-row items-start justify-between gap-4">
                <View className="min-w-0 flex-1">
                  <AppText className="text-xs font-semibold text-soundlog-lime">
                    Travel Room
                  </AppText>
                  <AppText className="mt-2 text-[28px] font-semibold leading-9 text-white">
                    {room.title}
                  </AppText>
                  <AppText className="mt-3 text-sm leading-6 text-white/58">
                    초대 코드로 모인 동행자의 사진, 곡, 메모를 하나의 사운드트랙 앨범으로 정리해요.
                  </AppText>
                </View>
                <View className="rounded-full bg-soundlog-lime px-3 py-1.5">
                  <AppText className="text-[11px] font-semibold text-soundlog-inverse">
                    {canModerate ? '방장' : '참여자'}
                  </AppText>
                </View>
              </View>

              <View className="mt-5 flex-row flex-wrap gap-3">
                <SoundlogMetric compact label="참여자" value={`${room.memberCount}명`} />
                <SoundlogMetric compact label="후보" value={`${room.momentCount}개`} />
                <SoundlogMetric compact label="채택" value={`${acceptedMomentCount}개`} />
              </View>

              <View className="mt-5 rounded-[18px] border border-white/10 bg-black/20 p-4">
                <AppText className="text-[11px] font-semibold text-white/40">초대 코드</AppText>
                <View className="mt-2 flex-row items-center justify-between gap-3">
                  <AppText className="text-[28px] font-semibold text-white">
                    {room.inviteCode}
                  </AppText>
                  <SoundlogButton
                    iconName="send"
                    label={isSharingInvite ? '공유 중' : '공유'}
                    onPress={() => void handleShareInvite()}
                    size="compact"
                    variant="ghost"
                  />
                </View>
              </View>

              {message ? (
                <View className="mt-4 rounded-[16px] bg-black/20 px-4 py-3">
                  <AppText className="text-xs leading-5 text-white/60">{message}</AppText>
                </View>
              ) : null}

              <View className="mt-4 flex-row gap-2">
                <SoundlogButton
                  disabled={!currentTrack || isAddingMoment}
                  fullWidth
                  iconName="music"
                  label={isAddingMoment ? '추가 중' : '현재 곡 후보 추가'}
                  onPress={() => void handleAddCurrentTrack()}
                  variant="ghost"
                />
                <SoundlogButton
                  disabled={isCreatingRecap || room.momentCount === 0}
                  fullWidth
                  iconName="image"
                  label={isCreatingRecap ? '생성 중' : 'Recap 생성'}
                  onPress={() => void handleCreateRecap()}
                />
              </View>
            </SoundlogSurface>

            <View className="mt-7">
              <AppText className="text-[20px] font-semibold text-white">참여자</AppText>
              <View className="mt-3 gap-2">
                {room.members.map((member) => (
                  <View
                    className="flex-row items-center justify-between rounded-[16px] border border-white/10 bg-white/10 px-4 py-3"
                    key={member.id}
                  >
                    <View className="min-w-0 flex-1">
                      <AppText className="text-sm font-semibold text-white">
                        {createMemberLabel(member, currentUserId)}
                      </AppText>
                      <AppText className="mt-1 text-xs text-white/45">
                        {member.role === 'owner' ? '방장' : '참여자'}
                      </AppText>
                    </View>
                    {member.userId === currentUserId ? (
                      <View className="rounded-full bg-soundlog-lime px-2.5 py-1">
                        <AppText className="text-[10px] font-semibold text-soundlog-inverse">
                          나
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>

            <View className="mt-7">
              <View className="flex-row items-end justify-between gap-3">
                <View>
                  <AppText className="text-[20px] font-semibold text-white">Recap 후보</AppText>
                  <AppText className="mt-1 text-xs leading-5 text-white/45">
                    채택된 후보가 있으면 채택 후보만 Recap에 우선 반영돼요.
                  </AppText>
                </View>
              </View>

              <View className="mt-3 gap-3">
                {sortedMoments.length === 0 ? (
                  <SoundlogSurface className="p-4" variant="glass">
                    <AppText className="text-sm font-semibold text-white">아직 후보가 없어요</AppText>
                    <AppText className="mt-2 text-xs leading-5 text-white/50">
                      현재 곡을 먼저 올리거나 초대 코드로 동행자를 초대해보세요.
                    </AppText>
                  </SoundlogSurface>
                ) : (
                  sortedMoments.map((moment) => {
                    const isPendingStatus = pendingStatusMomentId === moment.id;
                    const isPendingComment = pendingCommentMomentId === moment.id;
                    const commentDraft = commentDrafts[moment.id] ?? '';

                    return (
                      <SoundlogSurface className="p-4" key={moment.id} variant="glass">
                        <View className="flex-row items-start justify-between gap-3">
                          <View className="min-w-0 flex-1">
                            <AppText className="text-base font-semibold text-white" numberOfLines={1}>
                              {moment.placeName ?? '장소 미정'}
                            </AppText>
                            <AppText className="mt-1 text-xs leading-5 text-white/55" numberOfLines={2}>
                              {createMomentTrackLabel(moment)}
                              {moment.note ? ` · ${moment.note}` : ''}
                            </AppText>
                          </View>
                          <View
                            className={`rounded-full px-2.5 py-1 ${
                              moment.status === 'accepted' ? 'bg-soundlog-lime' : 'bg-white/10'
                            }`}
                          >
                            <AppText
                              className={`text-[10px] font-semibold ${
                                moment.status === 'accepted'
                                  ? 'text-soundlog-inverse'
                                  : 'text-white/60'
                              }`}
                            >
                              {createStatusLabel(moment.status)}
                            </AppText>
                          </View>
                        </View>

                        {moment.comments?.length ? (
                          <View className="mt-3 gap-2 rounded-[14px] bg-black/20 px-3 py-3">
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
                          className="mt-3 min-h-[42px] rounded-[14px] border border-white/10 bg-white/10 px-3 py-2 text-xs text-white"
                          editable={!isPendingComment}
                          multiline
                          onChangeText={(value) =>
                            setCommentDrafts((drafts) => ({ ...drafts, [moment.id]: value }))
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
                              iconName={moment.status === 'accepted' ? 'rotate-ccw' : 'check'}
                              label={
                                isPendingStatus
                                  ? '변경 중'
                                  : moment.status === 'accepted'
                                    ? '후보로'
                                    : '채택'
                              }
                              onPress={() => void handleToggleMomentStatus(moment)}
                              size="compact"
                              variant={moment.status === 'accepted' ? 'ghost' : 'primary'}
                            />
                          ) : null}
                          <SoundlogButton
                            disabled={isPendingComment || !commentDraft.trim()}
                            fullWidth
                            iconName="message-circle"
                            label={isPendingComment ? '댓글 저장 중' : '댓글 추가'}
                            onPress={() => void handleSubmitComment(moment)}
                            size="compact"
                            variant="ghost"
                          />
                        </View>
                      </SoundlogSurface>
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
