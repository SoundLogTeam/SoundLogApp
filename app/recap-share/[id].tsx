import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { recapShare } from '@/mocks/recapMocks';

const actions = [
  { label: 'Instagram', icon: 'instagram', color: '#E34788' },
  { label: 'Messages', icon: 'message-circle', color: '#2DDC64' },
  { label: 'Save', icon: 'download', color: '#2B2B2F' },
  { label: 'Share', icon: 'more-horizontal', color: '#2B2B2F' },
] as const;

export default function RecapShareScreen() {
  return (
    <Screen contentClassName="items-center px-5 pt-20">
      <AppText className="text-center text-[24px] font-semibold text-white">
        Share Your Music
      </AppText>

      <View className="mt-8 h-[400px] w-[300px] overflow-hidden rounded-[20px] bg-black/60 p-5">
        <AppText className="text-base font-semibold text-white">{recapShare.placeName}</AppText>
        <View className="mt-8 h-[220px] w-[220px] self-center rounded-full bg-white/20">
          <View className="m-auto h-[72px] w-[72px] rounded-full bg-[#1A111D]" />
        </View>
        <View className="mt-auto">
          <AppText className="text-[22px] font-semibold text-white">
            {recapShare.trackTitle}
          </AppText>
          <AppText className="text-xs text-white">{recapShare.artistName}</AppText>
        </View>
      </View>

      <AppText className="mt-5 text-sm text-white/70">{recapShare.recordedAt}</AppText>

      <View className="mt-12 flex-row gap-5">
        {actions.map((action) => (
          <View key={action.label} className="w-[64px] items-center gap-2">
            <View
              className="h-[54px] w-[54px] items-center justify-center rounded-full"
              style={{ backgroundColor: action.color }}
            >
              <Feather color="#fff" name={action.icon} size={24} />
            </View>
            <AppText className="text-xs text-white">{action.label}</AppText>
          </View>
        ))}
      </View>
    </Screen>
  );
}
