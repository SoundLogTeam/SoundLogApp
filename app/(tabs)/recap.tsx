import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { recapItems } from '@/mocks/recapMocks';

export default function RecapScreen() {
  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-4 px-5 pb-36 pt-8">
        <AppText className="text-[26px] font-semibold text-white">Recap</AppText>
        {recapItems.map((recap) => (
          <Pressable
            key={recap.id}
            className="min-h-[120px] rounded-[18px] bg-white/10 p-5"
            onPress={() => router.push(`/recap-share/${recap.id}`)}
          >
            <AppText className="text-[20px] font-semibold text-white">{recap.title}</AppText>
            <AppText className="mt-2 text-[13px] text-white/70">{recap.placeName}</AppText>
            <View className="mt-5 h-2 w-28 rounded-full bg-soundlog-purple" />
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}
