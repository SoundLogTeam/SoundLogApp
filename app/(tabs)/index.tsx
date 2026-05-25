import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useFeaturedPlaylistsQuery,
  useMoodRecommendationsQuery,
  useRecentMusicLogsQuery,
} from '@/api/homeQueries';
import { MiniPlayer } from '@/components/MiniPlayer';
import { FeaturedPlaylistSection } from '@/components/home/FeaturedPlaylistSection';
import { HomeHeader } from '@/components/home/HomeHeader';
import { MoodRecommendationSection } from '@/components/home/MoodRecommendationSection';
import { MusicLogSection } from '@/components/home/MusicLogSection';
import { Screen } from '@/components/Screen';
import { getHomeContentBottomPadding } from '@/constants/layout';
import { useHomeFilterStore } from '@/store/homeFilterStore';
import { momentLogToMusicLogItem, useMomentLogStore } from '@/store/momentLogStore';
import { usePlayerStore } from '@/store/playerStore';
import { MoodRecommendation } from '@/types/domain';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { selectedMoodFilter, selectedTopFilter, setSelectedMoodFilter, setSelectedTopFilter } =
    useHomeFilterStore();
  const { currentTrack, setTrack } = usePlayerStore();
  const momentLogs = useMomentLogStore((state) => state.logs);

  const featuredPlaylistsQuery = useFeaturedPlaylistsQuery();
  const moodRecommendationsQuery = useMoodRecommendationsQuery({
    moodFilter: selectedMoodFilter,
    topFilter: selectedTopFilter,
  });
  const recentMusicLogsQuery = useRecentMusicLogsQuery();
  const musicLogs = [
    ...momentLogs.slice(0, 6).map(momentLogToMusicLogItem),
    ...(recentMusicLogsQuery.data ?? []),
  ].slice(0, 10);

  const handleSelectRecommendation = (item: MoodRecommendation) => {
    setTrack(item.track);
  };

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          gap: 32,
          paddingBottom: getHomeContentBottomPadding(insets.bottom, Boolean(currentTrack)),
          paddingHorizontal: 20,
          paddingTop: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader
          onSelectTopFilter={setSelectedTopFilter}
          selectedTopFilter={selectedTopFilter}
        />

        <FeaturedPlaylistSection
          data={featuredPlaylistsQuery.data}
          isError={featuredPlaylistsQuery.isError}
          isLoading={featuredPlaylistsQuery.isLoading}
          onRetry={() => void featuredPlaylistsQuery.refetch()}
        />

        <MoodRecommendationSection
          data={moodRecommendationsQuery.data}
          isError={moodRecommendationsQuery.isError}
          isLoading={moodRecommendationsQuery.isLoading}
          onSelectMoodFilter={setSelectedMoodFilter}
          onSelectRecommendation={handleSelectRecommendation}
          selectedMoodFilter={selectedMoodFilter}
        />

        <MusicLogSection
          data={musicLogs}
          isError={recentMusicLogsQuery.isError}
          isLoading={recentMusicLogsQuery.isLoading && momentLogs.length === 0}
        />
      </ScrollView>
      {currentTrack ? <MiniPlayer /> : null}
    </Screen>
  );
}
