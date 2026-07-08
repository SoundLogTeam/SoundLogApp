import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { View } from 'react-native';

import { communityApi } from '@/api/communityApi';
import { AppText } from '@/components/AppText';
import { SoundlogButton, SoundlogMetric, SoundlogSurface } from '@/design-system';
import type { PlaceContext, RecapItem, Track, TravelRoom } from '@/types/domain';

type CommunityRecapCardProps = {
  currentPlace?: PlaceContext;
  currentTrack?: Track;
  momentCount: number;
  onRecapCreated: (recap: RecapItem) => void;
  sessionId: string;
  sessionStatus: 'active' | 'ended' | 'idle';
};

export function CommunityRecapCard({
  currentPlace,
  currentTrack,
  momentCount,
  onRecapCreated,
  sessionId,
  sessionStatus,
}: CommunityRecapCardProps) {
  const [room, setRoom] = useState<TravelRoom>();
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isAddingMoment, setIsAddingMoment] = useState(false);
  const [isCreatingRecap, setIsCreatingRecap] = useState(false);
  const [message, setMessage] = useState<string>();

  const placeName = currentPlace?.title ?? '이번 여행';
  const canUseRoom = sessionStatus !== 'idle';

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
        visibility: 'invite_only',
      });

      if (!nextRoom) {
        setMessage('로그인 후 공동 Recap 여행방을 만들 수 있어요.');
        return;
      }

      setRoom(nextRoom);
      setMessage('초대 코드를 공유하면 동행자가 Moment 후보를 함께 올릴 수 있어요.');
    } catch {
      setMessage('공동 여행방을 만들지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsCreatingRoom(false);
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
        setMessage('서버에 연결된 로그인 상태에서 후보를 추가할 수 있어요.');
        return;
      }

      setRoom({
        ...room,
        momentCount: room.momentCount + 1,
        moments: [moment, ...room.moments],
      });
      setMessage('현재 선택 곡을 공동 Recap 후보에 추가했어요.');
    } catch {
      setMessage('후보 추가에 실패했어요. 현재 곡이나 네트워크 상태를 확인해주세요.');
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
        templateId: 'album',
        title: `${placeName} 공동 Recap`,
      });

      if (!recap) {
        setMessage('공동 Recap 생성은 로그인된 서버 세션에서 사용할 수 있어요.');
        return;
      }

      setMessage('공동 Recap을 만들었어요.');
      onRecapCreated(recap);
    } catch {
      setMessage('공동 Recap 생성에 실패했어요. 후보 Moment가 있는지 확인해주세요.');
    } finally {
      setIsCreatingRecap(false);
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
            같이 간 사람과 사운드트랙을 모아요
          </AppText>
          <AppText className="mt-2 text-sm leading-6 text-white/58">
            한 명이 만든 플레이리스트가 아니라, 각자 고른 곡과 순간을 하나의 Recap 후보로
            합칠 수 있어요.
          </AppText>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-3">
        <SoundlogMetric compact label="초대 코드" value={room?.inviteCode ?? '방 생성 전'} />
        <SoundlogMetric compact label="동행자" value={`${room?.memberCount ?? 1}명`} />
        <SoundlogMetric compact label="내 Moment" value={`${momentCount}개`} />
        <SoundlogMetric compact label="공동 후보" value={`${room?.momentCount ?? 0}개`} />
      </View>

      {message ? (
        <View className="mt-4 rounded-[16px] bg-black/20 px-4 py-3">
          <AppText className="text-xs leading-5 text-white/62">{message}</AppText>
        </View>
      ) : null}

      <View className="mt-4 gap-2">
        {!room ? (
          <SoundlogButton
            disabled={!canUseRoom || isCreatingRoom}
            iconName="plus"
            label={isCreatingRoom ? '여행방 생성 중' : '공동 여행방 만들기'}
            onPress={() => void handleCreateRoom()}
          />
        ) : (
          <View className="gap-2">
            <SoundlogButton
              disabled={isAddingMoment || !currentTrack}
              iconName="music"
              label={isAddingMoment ? '후보 추가 중' : '현재 곡 후보 추가'}
              onPress={() => void handleAddCurrentTrack()}
              variant="ghost"
            />
            <SoundlogButton
              disabled={isCreatingRecap || room.momentCount === 0}
              iconName="image"
              label={isCreatingRecap ? 'Recap 생성 중' : '공동 Recap 만들기'}
              onPress={() => void handleCreateRecap()}
            />
          </View>
        )}
      </View>
    </SoundlogSurface>
  );
}
