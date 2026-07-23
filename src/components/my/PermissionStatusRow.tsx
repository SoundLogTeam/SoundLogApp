import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PermissionStatusBadge } from '@/components/my/PermissionStatusBadge';
import type {
  NativePermissionItem,
  NativePermissionKind,
} from '@/utils/nativePermissions';

type PermissionStatusRowProps = {
  isRequesting: boolean;
  item: NativePermissionItem;
  onOpenSettings: () => void;
  onRefresh: () => void;
  onRequest: (kind: NativePermissionKind) => void;
};

const permissionIcons: Record<
  NativePermissionKind,
  keyof typeof Feather.glyphMap
> = {
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

  const content = (
    <>
      <View className="w-9 items-center justify-center">
        <Feather
          color="rgba(255,255,255,0.76)"
          name={permissionIcons[item.kind]}
          size={20}
        />
      </View>

      <View className="ml-3 min-w-0 flex-1">
        <AppText
          className="text-[15px] font-medium"
          style={{ color: '#FFFFFF' }}
        >
          {item.title}
        </AppText>
        <AppText
          className="mt-1 text-xs leading-5"
          numberOfLines={2}
          style={{ color: 'rgba(255,255,255,0.62)' }}
        >
          {item.description}
        </AppText>
      </View>

      <View className="ml-3 items-end gap-1">
        <PermissionStatusBadge status={item.status} />
        {isRequesting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : action ? (
          <View className="flex-row items-center">
            <AppText
              className="text-[11px]"
              style={{ color: 'rgba(255,255,255,0.62)' }}
            >
              {action.label}
            </AppText>
            <Feather
              color="rgba(255,255,255,0.54)"
              name="chevron-right"
              size={16}
              style={{ marginLeft: 4 }}
            />
          </View>
        ) : null}
      </View>
    </>
  );

  if (!action) {
    return (
      <View className="min-h-[60px] flex-row items-center py-2">{content}</View>
    );
  }

  return (
    <Pressable
      accessibilityLabel={`${item.title} ${action.label}`}
      accessibilityRole="button"
      className="min-h-[60px] flex-row items-center py-2"
      disabled={isRequesting}
      onPress={handlePress}
      style={({ pressed }) => ({
        opacity: isRequesting ? 0.5 : pressed ? 0.62 : 1,
      })}
    >
      {content}
    </Pressable>
  );
}
