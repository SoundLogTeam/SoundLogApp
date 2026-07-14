import { useLocalSearchParams } from 'expo-router';

import { TravelRoomDetailScreen } from '@/components/travel/TravelRoomDetailScreen';

export default function TravelRoomDetailRoute() {
  const { roomId } = useLocalSearchParams<{ roomId?: string }>();

  return <TravelRoomDetailScreen roomId={roomId ?? ''} />;
}
