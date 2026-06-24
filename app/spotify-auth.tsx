import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';

export default function SpotifyAuthCallbackScreen() {
  return (
    <Screen>
      <View className="flex-1 items-center justify-center px-8">
        <AppText className="text-center text-lg font-semibold text-white">
          Spotify 연결을 확인하고 있어요.
        </AppText>
      </View>
    </Screen>
  );
}
