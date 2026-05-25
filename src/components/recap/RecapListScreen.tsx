import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { RecapEmptyState } from '@/components/recap/RecapEmptyState';
import { RecapListCard } from '@/components/recap/RecapListCard';
import { Screen } from '@/components/Screen';
import { recapItems } from '@/mocks/recapMocks';
import { useMomentLogStore } from '@/store/momentLogStore';
import { momentLogToRecapItem } from '@/utils/recapMappers';

export function RecapListScreen() {
  const momentLogs = useMomentLogStore((state) => state.logs);
  const localRecaps = momentLogs.map((log) => ({
    imageUrl: log.photoUri,
    item: momentLogToRecapItem(log),
  }));
  const sampleRecaps = recapItems.map((item) => ({
    imageUrl: item.representativeTrack.albumImageUrl,
    item,
  }));
  const hasLocalRecaps = localRecaps.length > 0;
  const recaps = [...localRecaps, ...sampleRecaps];

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ gap: 18, paddingBottom: 132, paddingHorizontal: 20, paddingTop: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <AppText className="text-[28px] font-semibold text-white">Recap</AppText>
          <AppText className="mt-2 text-sm leading-6 text-white/55">
            저장한 음악 여행 순간을 다시 확인해요.
          </AppText>
        </View>

        {!hasLocalRecaps ? <RecapEmptyState /> : null}

        <View className="gap-3">
          {recaps.map(({ imageUrl, item }) => (
            <RecapListCard
              key={item.id}
              imageUrl={imageUrl}
              item={item}
              onPress={() => router.push(`/recap-share/${item.id}`)}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
