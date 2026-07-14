import { PageHeader } from '@/components/PageHeader';
import type { MusicRecommendationMode } from '@/types/domain';

type HomeHeaderProps = {
  recommendationMode?: MusicRecommendationMode;
  onSelectRecommendationMode?: (mode: MusicRecommendationMode) => void;
};

export function HomeNavigationBar() {
  return <PageHeader title="음악추천" />;
}

export function HomeHeader(_props: HomeHeaderProps) {
  return <HomeNavigationBar />;
}
