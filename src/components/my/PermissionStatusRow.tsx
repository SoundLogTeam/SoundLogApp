import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PermissionStatusBadge } from '@/components/my/PermissionStatusBadge';
import type { NativePermissionItem, NativePermissionKind } from '@/utils/nativePermissions';

type PermissionStatusRowProps = {
  isRequesting: boolean;
  item: NativePermissionItem;
  onOpenSettings: () => void;
  onRefresh: () => void;
  onRequest: (kind: NativePermissionKind) => void;
};

const permissionIcons: Record<NativePermissionKind, keyof typeof Feather.glyphMap> = {
  camera: 'camera',
  location: 'map-pin',
  mediaLibrary: 'image',
};

function getAction(item: NativePermissionItem) {
  if (item.status === 'undetermined') {
    return {
      label: '권한 요청',
      type: 'request' as const,
    };
  }

  if (item.status === 'denied') {
    return item.canAskAgain
      ? {
          label: '다시 요청',
          type: 'request' as const,
        }
      : {
          label: '설정 열기',
          type: 'settings' as const,
        };
  }

  if (item.status === 'limited') {
    return {
      label: '설정에서 변경',
      type: 'settings' as const,
    };
  }

  if (item.status === 'error') {
    return {
      label: '다시 확인',
      type: 'refresh' as const,
    };
  }

  return undefined;
}

export function PermissionStatusRow({
  isRequesting,
  item,
  onOpenSettings,
  onRefresh,
  onRequest,
}: PermissionStatusRowProps) {
  const action = getAction(item);

  const handlePress = () => {
    if (!action || isRequesting) {
      return;
    }

    if (action.type === 'settings') {
      onOpenSettings();
      return;
    }

    if (action.type === 'refresh') {
      onRefresh();
      return;
    }

    onRequest(item.kind);
  };

  return (
    <View className="flex-row items-center gap-3 py-4">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
        <Feather color="#fff" name={permissionIcons[item.kind]} size={18} />
      </View>

      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2">
          <AppText className="text-base font-semibold text-white">{item.title}</AppText>
          <PermissionStatusBadge status={item.status} />
        </View>
        <AppText className="mt-1 text-xs leading-5 text-white/45">
          {item.description}
        </AppText>
      </View>

      {action ? (
        <Pressable
          accessibilityLabel={`${item.title} ${action.label}`}
          accessibilityRole="button"
          className="min-w-[78px] items-center rounded-full border border-white/10 px-3 py-2"
          disabled={isRequesting}
          onPress={handlePress}
        >
          {isRequesting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <AppText className="text-xs font-semibold text-white/70">{action.label}</AppText>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}
