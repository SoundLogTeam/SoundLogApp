import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { MusicLogItem } from '@/types/domain';

type MusicLogCardProps = {
  index: number;
  item: MusicLogItem;
};

export function MusicLogCard({ index, item }: MusicLogCardProps) {
  return (
    <View
      className="mr-3 h-[170px] w-[116px] justify-end rounded-[18px] bg-[#f4f4f4] p-3"
      style={{
        transform: [{ rotate: index === 0 ? '-8deg' : index === 2 ? '8deg' : '0deg' }],
      }}
    >
      <AppText className="text-[12px] font-semibold text-[#111827]" numberOfLines={1}>
        {item.placeName}
      </AppText>
      <AppText className="text-[10px] text-[#4b5563]" numberOfLines={1}>
        {item.trackTitle}
      </AppText>
    </View>
  );
}
