import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';

const musicFilters = ['전체', '드라이브', '산책', '시원한 바람', '신나는'];

export function PlaylistMusicFilter() {
  const [selectedFilter, setSelectedFilter] = useState(musicFilters[0]);

  return (
    <ScrollView
      className="-mx-5"
      contentContainerClassName="gap-2 px-5"
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {musicFilters.map((filter) => {
        const isSelected = selectedFilter === filter;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            className="h-[26px] justify-center rounded-full border px-3"
            key={filter}
            onPress={() => setSelectedFilter(filter)}
            style={{
              backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.09)',
              borderColor: isSelected ? 'rgba(255, 255, 255, 0.42)' : 'rgba(255, 255, 255, 0.22)',
            }}
          >
            <View
              className="absolute inset-0 rounded-full"
              style={{
                backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(128, 128, 128, 0.05)',
              }}
            />
            <AppText
              className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-white/85'}`}
              numberOfLines={1}
            >
              {filter}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
