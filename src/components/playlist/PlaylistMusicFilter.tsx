import { Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';

const moodAdjustments = [
  { filter: '잔잔한', label: '더 잔잔하게' },
  { filter: '신나는', label: '더 신나게' },
];

type PlaylistMusicFilterProps = {
  onSelectMoodFilter: (filter: string) => void;
  selectedMoodFilter: string;
};

export function PlaylistMusicFilter({
  onSelectMoodFilter,
  selectedMoodFilter,
}: PlaylistMusicFilterProps) {
  return (
    <ScrollView
      className="-mx-5"
      contentContainerClassName="gap-2 px-5"
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {moodAdjustments.map(({ filter, label }) => {
        const isSelected = selectedMoodFilter === filter;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            className="h-9 justify-center rounded-full border px-4"
            key={filter}
            onPress={() => onSelectMoodFilter(filter)}
            style={{
              backgroundColor: isSelected ? '#B7E628' : 'rgba(255, 255, 255, 0.09)',
              borderColor: isSelected ? '#B7E628' : 'rgba(255, 255, 255, 0.22)',
            }}
          >
            <View
              className="absolute inset-0 rounded-full"
              style={{
                backgroundColor: isSelected
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(128, 128, 128, 0.05)',
              }}
            />
            <AppText
              className={`text-xs font-semibold ${
                isSelected ? 'text-[#050916]' : 'text-white/85'
              }`}
              numberOfLines={1}
            >
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
