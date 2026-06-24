import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, View } from 'react-native';

import { useRecapListQuery } from '@/api/recapQueries';
import { AppText } from '@/components/AppText';
import { RecapEmptyState } from '@/components/recap/RecapEmptyState';
import { RecapListCard } from '@/components/recap/RecapListCard';
import { Screen } from '@/components/Screen';
import { useMomentLogStore } from '@/store/momentLogStore';
import {
  createMomentLogGroups,
  momentLogGroupToRecapItem,
} from '@/utils/recapMappers';

type RecapListEntry = {
  imageUrl?: string;
  item: ReturnType<typeof momentLogGroupToRecapItem>;
  shareId: string;
};

export function RecapListScreen() {
  const momentLogs = useMomentLogStore((state) => state.logs);
  const {
    data: serverRecapItems = [],
    isError,
    isLoading,
  } = useRecapListQuery();
  const serverRecaps: RecapListEntry[] = serverRecapItems.map((item) => ({
    imageUrl: item.representativeTrack.albumImageUrl,
    item,
    shareId: item.id,
  }));
  const serverSessionIds = new Set(serverRecaps.map(({ item }) => item.sessionId).filter(Boolean));
  const localRecaps: RecapListEntry[] = createMomentLogGroups(momentLogs)
    .filter((group) => !group.sessionId || !serverSessionIds.has(group.sessionId))
    .map((group) => ({
      imageUrl: group.logs[0]?.photoUri,
      item: momentLogGroupToRecapItem(group),
      shareId: group.id,
    }));
  const recaps = [...localRecaps, ...serverRecaps];
  const hasRecaps = recaps.length > 0;
  const savedMomentCount = recaps.reduce(
    (sum, { item }) => sum + (item.momentCount ?? 1),
    0,
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          gap: 18,
          paddingBottom: 132,
          paddingHorizontal: 20,
          paddingTop: 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="overflow-hidden rounded-[28px] border border-white/10">
          <LinearGradient
            colors={[
              'rgba(91,45,255,0.42)',
              'rgba(11,16,31,0.96)',
              'rgba(6,9,19,1)',
            ]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={{ paddingHorizontal: 20, paddingVertical: 24 }}
          >
            <View className="self-start rounded-full border border-white/15 bg-white/10 px-3 py-1">
              <AppText className="text-[11px] font-semibold text-white/70">
                SOUNDLOG ARCHIVE
              </AppText>
            </View>
            <AppText className="mt-5 text-[32px] font-semibold leading-9 text-white">
              여행이 끝난 뒤에도{'\n'}음악은 남아요.
            </AppText>
            <AppText className="mt-3 text-sm leading-6 text-white/62">
              저장한 장소, 사진, 음악을 하나의 앨범처럼 다시 꺼내보세요.
            </AppText>

            <View className="mt-6 flex-row gap-3">
              <View className="flex-1 rounded-[18px] bg-white/10 p-4">
                <AppText className="text-[24px] font-semibold text-white">
                  {recaps.length}
                </AppText>
                <AppText className="mt-1 text-[11px] text-white/55">
                  Recap
                </AppText>
              </View>
              <View className="flex-1 rounded-[18px] bg-white/10 p-4">
                <AppText className="text-[24px] font-semibold text-white">
                  {savedMomentCount}
                </AppText>
                <AppText className="mt-1 text-[11px] text-white/55">
                  Saved moments
                </AppText>
              </View>
            </View>
          </LinearGradient>
        </View>

        {isLoading ? (
          <AppText className="text-sm text-white/55">
            Recap 데이터를 불러오는 중이에요.
          </AppText>
        ) : null}

        {isError && !hasRecaps ? (
          <AppText className="text-sm text-white/55">
            Recap 데이터를 불러오지 못했어요. 잠시 후 다시 확인해주세요.
          </AppText>
        ) : null}

        {!isLoading && !hasRecaps ? <RecapEmptyState /> : null}

        <View className="gap-3">
          {hasRecaps ? (
            <AppText className="mb-1 text-[18px] font-semibold text-white">
              최근 Recap
            </AppText>
          ) : null}
          {recaps.map(({ imageUrl, item, shareId }) => (
            <RecapListCard
              key={item.id}
              imageUrl={imageUrl}
              item={item}
              onPress={() => router.push(`/recap-share/${shareId}`)}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
