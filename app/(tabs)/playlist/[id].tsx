import { useLocalSearchParams } from 'expo-router';

import { PlaylistCurationScreen } from '@/components/playlist/PlaylistCurationScreen';

export default function PlaylistDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <PlaylistCurationScreen playlistId={id} />;
}
