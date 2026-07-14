import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PermissionStatusRow } from '@/components/my/PermissionStatusRow';
import { SectionTitle } from '@/components/SectionTitle';
import type {
  NativePermissionItem,
  NativePermissionKind,
} from '@/utils/nativePermissions';

type PermissionSettingsCardProps = {
  errorMessage?: string;
  isLoading: boolean;
  isRequestingKind: NativePermissionKind | null;
  items: NativePermissionItem[];
  onOpenSettings: () => void;
  onRefresh: () => void;
  onRequest: (kind: NativePermissionKind) => void;
};

export function PermissionSettingsCard({
  errorMessage,
  isLoading,
  isRequestingKind,
  items,
  onOpenSettings,
  onRefresh,
  onRequest,
}: PermissionSettingsCardProps) {
  const isUnavailable = items.every((item) => item.status === 'unavailable');

  return (
    <View className="mt-7">
      <SectionTitle
        rightContent={
          <Pressable
            accessibilityLabel="권한 상태 다시 확인"
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center"
            onPress={onRefresh}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Feather
                color="rgba(255,255,255,0.75)"
                name="refresh-cw"
                size={16}
              />
            )}
          </Pressable>
        }
        title="권한 설정"
      />

      {errorMessage ? (
        <AppText className="ml-12 mt-2 text-xs leading-5 text-amber-200">
          {errorMessage}
        </AppText>
      ) : null}

      {isUnavailable ? (
        <AppText className="ml-12 mt-2 text-xs leading-5 text-white/42">
          웹에서는 실제 기기 권한을 확인할 수 없어요. 모바일 앱에서
          확인해주세요.
        </AppText>
      ) : null}

      <View className="mt-2">
        {items.map((item) => (
          <View key={item.kind}>
            <PermissionStatusRow
              isRequesting={isRequestingKind === item.kind}
              item={item}
              onOpenSettings={onOpenSettings}
              onRefresh={onRefresh}
              onRequest={onRequest}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
