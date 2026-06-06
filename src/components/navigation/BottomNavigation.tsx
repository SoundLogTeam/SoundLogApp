import { Feather } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import { Alert, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { getTabBarHeight } from '@/constants/layout';
import { useTravelSessionStore } from '@/store/travelSessionStore';

type TabIconName = keyof typeof Feather.glyphMap;

const webGlassTabBarStyle = {
  backdropFilter: 'blur(22px) saturate(150%)',
  WebkitBackdropFilter: 'blur(22px) saturate(150%)',
};

function TabIcon({ name, color }: { name: TabIconName; color: string }) {
  return <Feather color={color} name={name} size={22} />;
}

function CameraTabButton() {
  const { session, startSession } = useTravelSessionStore();
  const openCamera = () => router.push('/camera');
  const handlePress = () => {
    if (session.status === 'active') {
      openCamera();
      return;
    }

    Alert.alert('여행을 시작할까요?', '순간 저장은 현재 여행에 연결돼요.', [
      { style: 'cancel', text: '취소' },
      {
        onPress: () => {
          startSession();
          openCamera();
        },
        text: '시작하고 촬영',
      },
    ]);
  };

  return (
    <Pressable
      accessibilityLabel="순간 저장 카메라 열기"
      accessibilityRole="button"
      className="-mt-6 h-[70px] w-[70px] items-center justify-center rounded-full border border-white/15 bg-soundlog-bg"
      onPress={handlePress}
    >
      <View className="h-[58px] w-[58px] items-center justify-center rounded-full border-[3px] border-soundlog-lime bg-black/25">
        <View className="h-[44px] w-[44px] rounded-full bg-soundlog-lime" />
      </View>
    </Pressable>
  );
}

export function BottomNavigation() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#B7E628',
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarShowLabel: true,
        tabBarStyle: {
          position: 'absolute',
          height: getTabBarHeight(insets.bottom),
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.24)',
          backgroundColor: colors.surface.tab,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          boxShadow: '0 -18px 42px rgba(0,0,0,0.34)',
          shadowColor: '#000',
          shadowOffset: { height: -14, width: 0 },
          shadowOpacity: 0.34,
          shadowRadius: 24,
          ...(Platform.OS === 'web' ? webGlassTabBarStyle : {}),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => <TabIcon color={String(color)} name="home" />,
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="travel"
        options={{
          tabBarIcon: ({ color }) => <TabIcon color={String(color)} name="map" />,
          title: 'Travel',
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          tabBarButton: () => <CameraTabButton />,
          title: 'Camera',
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          tabBarIcon: ({ color }) => <TabIcon color={String(color)} name="heart" />,
          title: 'Library',
        }}
      />
      <Tabs.Screen
        name="my"
        options={{
          tabBarIcon: ({ color }) => <TabIcon color={String(color)} name="user" />,
          title: 'My',
        }}
      />
      <Tabs.Screen
        name="recap"
        options={{
          href: null,
          title: 'Recap',
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
        name="recap-share/[id]"
        options={{
          href: null,
          title: '리캡 공유',
        }}
      />
    </Tabs>
  );
}
