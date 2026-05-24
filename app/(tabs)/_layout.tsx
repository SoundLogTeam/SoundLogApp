import { Feather } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { getTabBarHeight } from '@/constants/layout';

type TabIconName = keyof typeof Feather.glyphMap;

function TabIcon({ name, color }: { name: TabIconName; color: string }) {
  return <Feather color={color} name={name} size={22} />;
}

function CameraTabButton() {
  return (
    <Pressable
      accessibilityLabel="순간 저장 카메라 열기"
      accessibilityRole="button"
      className="-mt-6 h-[68px] w-[68px] items-center justify-center rounded-full border-4 border-white/40 bg-[#f4f4f4]"
      onPress={() => router.push('/camera')}
    >
      <View className="h-[58px] w-[58px] rounded-full bg-white" />
    </Pressable>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#ffffff',
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          height: getTabBarHeight(insets.bottom),
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.08)',
          backgroundColor: colors.surface.tab,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => <TabIcon color={String(color)} name="home" />,
          title: '홈',
        }}
      />
      <Tabs.Screen
        name="recap"
        options={{
          tabBarIcon: ({ color }) => <TabIcon color={String(color)} name="map-pin" />,
          title: 'Recap',
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          href: null,
          tabBarButton: () => <CameraTabButton />,
          title: '기록',
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          tabBarIcon: ({ color }) => <TabIcon color={String(color)} name="heart" />,
          title: '보관함',
        }}
      />
      <Tabs.Screen
        name="playlist/[id]"
        options={{
          href: null,
          title: '플레이리스트',
        }}
      />
      <Tabs.Screen
        name="my"
        options={{
          tabBarIcon: ({ color }) => <TabIcon color={String(color)} name="user" />,
          title: '마이',
        }}
      />
    </Tabs>
  );
}
