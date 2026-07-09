import { Platform, Share } from 'react-native';

import type { TravelRoom } from '@/types/domain';

export type TravelRoomInviteShareResult = 'copied' | 'shared';

export function createTravelRoomInviteMessage(room: TravelRoom) {
  return [
    `${room.title}에 초대했어요.`,
    `Soundlog 공동 Recap 초대 코드: ${room.inviteCode}`,
    '앱의 공동 Recap 카드에서 초대 코드로 참여할 수 있어요.',
  ].join('\n');
}

export async function shareTravelRoomInvite(
  room: TravelRoom,
): Promise<TravelRoomInviteShareResult> {
  const message = createTravelRoomInviteMessage(room);

  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(message);
    return 'copied';
  }

  await Share.share({ message });
  return 'shared';
}
