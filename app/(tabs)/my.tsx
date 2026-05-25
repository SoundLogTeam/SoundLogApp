import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { useUserProfileStore } from '@/store/userProfileStore';

type MyMenuItem = {
  description?: string;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress?: () => void;
};

export default function MyScreen() {
  const { profile, resetOnboarding } = useUserProfileStore();
  const selectedSummary = [
    ...profile.preferredGenres.slice(0, 2),
    ...profile.preferredMoods.slice(0, 1),
    ...profile.travelStyles.slice(0, 1),
  ].join(' · ');

  const menuItems: MyMenuItem[] = [
    {
      description: 'Spotify, Melon 연결은 다음 단계에서 붙일 예정이에요.',
      icon: 'music',
      label: '음악 플랫폼 연동',
    },
    {
      description: selectedSummary || '아직 저장된 취향 정보가 없어요.',
      icon: 'sliders',
      label: '취향 정보 수정',
      onPress: () => router.push('/onboarding' as never),
    },
    {
      description: profile.locationRecommendationEnabled ? '위치 기반 추천 사용 중' : '위치 추천 꺼짐',
      icon: 'map-pin',
      label: '위치/카메라 권한',
    },
    {
      description: '온보딩을 다시 볼 수 있도록 초기화합니다.',
      icon: 'rotate-ccw',
      label: '온보딩 초기화',
      onPress: () => {
        resetOnboarding();
        router.replace('/onboarding' as never);
      },
    },
  ];

  return (
    <Screen contentClassName="px-5 pt-8">
      <AppText className="text-[26px] font-semibold text-white">My</AppText>

      <View className="mt-5 rounded-[22px] border border-white/10 bg-white/10 p-5">
        <AppText className="text-sm font-semibold text-white/45">내 추천 프로필</AppText>
        <AppText className="mt-3 text-[20px] font-semibold text-white">
          {profile.completedOnboarding ? '취향 설정 완료' : '취향 설정 전'}
        </AppText>
        <AppText className="mt-2 text-sm leading-6 text-white/60">
          {selectedSummary || '취향을 입력하면 홈 추천 필터가 더 자연스럽게 맞춰져요.'}
        </AppText>
      </View>

      <View className="mt-6 gap-3">
        {menuItems.map((item) => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            className="flex-row items-center rounded-[16px] bg-white/10 px-5 py-4"
            onPress={item.onPress}
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <Feather color="#fff" name={item.icon} size={18} />
            </View>
            <View className="ml-3 min-w-0 flex-1">
              <AppText className="text-base font-medium text-white">{item.label}</AppText>
              {item.description ? (
                <AppText className="mt-1 text-xs leading-5 text-white/45">
                  {item.description}
                </AppText>
              ) : null}
            </View>
            {item.onPress ? <Feather color="rgba(255,255,255,0.5)" name="chevron-right" size={18} /> : null}
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
