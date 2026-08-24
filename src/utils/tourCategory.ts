const contentTypeLabels: Record<string, string> = {
  '12': '관광지',
  '14': '문화시설',
  '15': '축제·공연·행사',
  '25': '여행코스',
  '28': '레포츠',
  '32': '숙박',
  '38': '쇼핑',
  '39': '음식점',
};

const categoryPrefixLabels: Array<[prefix: string, label: string]> = [
  ['A0305', '수상 레포츠'],
  ['A0302', '육상 레포츠'],
  ['A0303', '복합 레포츠'],
  ['A0207', '축제·공연·행사'],
  ['A0206', '문화시설'],
  ['A0203', '체험 관광지'],
  ['A0202', '휴양 관광지'],
  ['A0201', '역사 관광지'],
  ['A01', '자연 관광지'],
  ['A02', '인문 관광지'],
  ['A03', '레포츠'],
  ['A04', '쇼핑'],
  ['A05', '음식점'],
  ['B02', '숙박'],
  ['C01', '여행코스'],
];

function isTourCategoryCode(value?: string) {
  return Boolean(value && /^[A-Z]\d{2,}$/.test(value));
}

export function getTourCategoryLabel(category?: string, contentType?: string) {
  if (category && !isTourCategoryCode(category)) {
    return category;
  }

  if (category) {
    const prefixMatch = categoryPrefixLabels.find(([prefix]) =>
      category.startsWith(prefix),
    );

    if (prefixMatch) {
      return prefixMatch[1];
    }
  }

  return contentType ? contentTypeLabels[contentType] : undefined;
}
