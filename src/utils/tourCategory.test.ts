import { describe, expect, it } from 'vitest';

import { getTourCategoryLabel } from '@/utils/tourCategory';

describe('getTourCategoryLabel', () => {
  it('keeps a human-readable category from TourAPI', () => {
    expect(getTourCategoryLabel('해변', '12')).toBe('해변');
  });

  it('turns a raw category code into a useful Korean label', () => {
    expect(getTourCategoryLabel('A03050100', '28')).toBe('수상 레포츠');
  });

  it('falls back to the TourAPI content type label', () => {
    expect(getTourCategoryLabel(undefined, '14')).toBe('문화시설');
  });
});
