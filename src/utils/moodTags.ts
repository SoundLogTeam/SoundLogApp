import { MoodTag } from '@/types/domain';

const moodFilterToTags: Record<string, MoodTag[]> = {
  감성적인: ['emotional'],
  시원한: ['fresh'],
  '시원한 바람': ['fresh'],
  신나는: ['active'],
  잔잔한: ['calm'],
  전체: [],
  활기찬: ['active'],
};

export function getMoodTagsFromFilter(filter?: string): MoodTag[] {
  if (!filter) {
    return [];
  }

  return moodFilterToTags[filter] ?? [];
}
