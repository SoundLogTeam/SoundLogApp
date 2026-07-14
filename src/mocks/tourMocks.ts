import { GeoPoint, PlaceContext } from '@/types/domain';

const seoulPlaces: PlaceContext[] = [
  {
    address: '서울특별시 용산구 남산공원길 105',
    category: '야경 명소',
    contentType: '관광지',
    distanceMeters: 620,
    id: 'seed-namsan',
    imageUrl: 'https://tong.visitkorea.or.kr/cms2/website/75/2012175.jpg',
    location: { lat: 37.5512, lng: 126.9882 },
    overview: '서울의 야경과 도심 산책을 함께 즐길 수 있는 대표 관광지입니다.',
    source: 'seed',
    title: '남산서울타워',
  },
  {
    address: '서울특별시 종로구 세종대로 172',
    category: '문화시설',
    contentType: '관광지',
    distanceMeters: 940,
    id: 'seed-gwanghwamun',
    imageUrl: 'https://tong.visitkorea.or.kr/cms2/website/82/1870082.jpg',
    location: { lat: 37.5759, lng: 126.9768 },
    overview: '도시 산책과 역사 관광 맥락을 함께 제공하는 서울 중심 관광지입니다.',
    source: 'seed',
    title: '광화문광장',
  },
];

const busanPlaces: PlaceContext[] = [
  {
    address: '부산광역시 수영구 광안해변로 219',
    category: '해변',
    contentType: '관광지',
    distanceMeters: 360,
    id: 'seed-gwangalli',
    imageUrl: 'https://tong.visitkorea.or.kr/cms2/website/76/2012176.jpg',
    location: { lat: 35.1532, lng: 129.1186 },
    overview: '바다 산책과 야경을 함께 즐길 수 있는 부산 대표 해변입니다.',
    source: 'seed',
    title: '광안리해수욕장',
  },
  {
    address: '부산광역시 해운대구 우동',
    category: '바다',
    contentType: '관광지',
    distanceMeters: 1280,
    id: 'seed-haeundae',
    imageUrl: 'https://tong.visitkorea.or.kr/cms2/website/75/2012175.jpg',
    location: { lat: 35.1587, lng: 129.1604 },
    overview: '해변과 드라이브 맥락에 어울리는 부산 대표 관광지입니다.',
    source: 'seed',
    title: '해운대해수욕장',
  },
];

export function getMockNearbyPlaces(location?: GeoPoint): PlaceContext[] {
  if (!location) {
    return seoulPlaces;
  }

  return location.lat < 36.5 ? busanPlaces : seoulPlaces;
}
