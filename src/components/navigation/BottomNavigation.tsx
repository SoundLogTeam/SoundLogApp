import { Feather } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import {
  Platform,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { getTabBarHeight } from '@/constants/layout';

type TabIconName = keyof typeof Feather.glyphMap;
type CameraTabButtonProps = {
  accessibilityState?: {
    selected?: boolean;
  };
};

const webGlassTabBarStyle = {
  backdropFilter: 'blur(22px) saturate(150%)',
  WebkitBackdropFilter: 'blur(22px) saturate(150%)',
};

function TabIcon({ name, color }: { name: TabIconName; color: string }) {
  return <Feather color={color} name={name} size={22} />;
}

function CameraTabButton({ accessibilityState }: CameraTabButtonProps) {
  return (
    <View className="flex-1 items-center" pointerEvents="box-none">
      <Pressable
        accessibilityLabel="카메라로 로그 만들기"
        accessibilityRole="button"
        accessibilityState={{ selected: Boolean(accessibilityState?.selected) }}
        className="-mt-6 h-[70px] w-[70px] items-center justify-center rounded-full border border-white/15 bg-soundlog-bg"
        onPress={() => {
          router.push({
            params: { returnTo: 'tabs' },
            pathname: '/camera',
          } as never);
        }}
        style={{
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { height: 12, width: 0 },
          shadowOpacity: 0.32,
          shadowRadius: 18,
        }}
      >
        <View className="h-[58px] w-[58px] items-center justify-center rounded-full border-[3px] border-soundlog-lime bg-black/25">
          <View className="h-[44px] w-[44px] rounded-full bg-soundlog-lime" />
        </View>
      </Pressable>
    </View>
  );
}

export function BottomNavigation() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent.lime,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarShowLabel: true,
        tabBarItemStyle: {
          flex: 1,
          overflow: 'visible',
        },
        tabBarStyle: {
          position: 'absolute',
          overflow: 'visible',
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
          tabBarIcon: ({ color }) => <TabIcon color={String(color)} name="map" />,
          title: '지도',
        }}
      />
      <Tabs.Screen
        name="music"
        options={{
          tabBarIcon: ({ color }) => <TabIcon color={String(color)} name="music" />,
          title: '음악추천',
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          tabBarButton: (props) => <CameraTabButton {...props} />,
          tabBarIcon: () => null,
          tabBarLabel: '',
          title: '카메라',
        }}
      />
      <Tabs.Screen
        name="recap"
        options={{
          tabBarIcon: ({ color }) => <TabIcon color={String(color)} name="disc" />,
          title: '로그',
        }}
      />
      <Tabs.Screen
        name="my"
        options={{
          tabBarIcon: ({ color }) => <TabIcon color={String(color)} name="user" />,
          title: '마이',
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          href: null,
          title: '보관함',
        }}
      />
      <Tabs.Screen
        name="travel-room/[roomId]"
        options={{
          href: null,
          title: '여행방',
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
