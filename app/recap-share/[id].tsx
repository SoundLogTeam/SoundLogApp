import { useLocalSearchParams } from 'expo-router';

import { RecapShareScreen } from '@/components/recap-share/RecapShareScreen';

export default function RecapShareRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <RecapShareScreen recapId={id} />;
}
