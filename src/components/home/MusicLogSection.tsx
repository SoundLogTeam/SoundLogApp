import { ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { MusicLogCard } from '@/components/home/MusicLogCard';
import { MusicLogItem } from '@/types/domain';

type MusicLogSectionProps = {
  data?: MusicLogItem[];
  isError?: boolean;
  isLoading?: boolean;
  onSelectLog?: (item: MusicLogItem) => void;
};

function MusicLogSkeleton() {
  return (
    <View className="flex-row">
      {[0, 1, 2].map((item) => (
        <View key={item} className="mr-3 h-[170px] w-[116px] rounded-[18px] bg-white/10" />
      ))}
    </View>
  );
}

export function MusicLogSection({
  data = [],
  isError = false,
  isLoading = false,
  onSelectLog,
}: MusicLogSectionProps) {
  return (
    <View className="gap-4">
      <AppText className="text-[22px] font-semibold text-white">Music Log</AppText>

      {isLoading ? (
        <MusicLogSkeleton />
      ) : isError ? (
        <View className="rounded-[16px] bg-white/10 p-4">
          <AppText className="text-sm font-semibold text-white">
            Music Log를 불러오지 못했어요
          </AppText>
        </View>
      ) : data.length === 0 ? (
        <View className="rounded-[16px] bg-white/10 p-4">
          <AppText className="text-sm font-semibold text-white">
            오늘의 여행 순간을 저장해보세요.
          </AppText>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row pr-5">
            {data.map((item, index) => (
              <MusicLogCard
                key={item.id}
                index={index}
                item={item}
                onPress={onSelectLog ? () => onSelectLog(item) : undefined}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
