import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PermissionStatusRow } from '@/components/my/PermissionStatusRow';
import type { NativePermissionItem, NativePermissionKind } from '@/utils/nativePermissions';

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
    <View className="mt-6 rounded-[22px] border border-white/10 bg-white/10 p-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <AppText className="text-sm font-semibold text-white/45">권한 설정</AppText>
          <AppText className="mt-2 text-[20px] font-semibold text-white">
            여행 기록에 필요한 접근 권한
          </AppText>
          <AppText className="mt-2 text-xs leading-5 text-white/50">
            권한 요청은 버튼을 눌렀을 때만 실행돼요.
          </AppText>
        </View>
        <Pressable
          accessibilityLabel="권한 상태 다시 확인"
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
          onPress={onRefresh}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Feather color="rgba(255,255,255,0.75)" name="refresh-cw" size={16} />
          )}
        </Pressable>
      </View>

      {errorMessage ? (
        <View className="mt-4 rounded-[14px] border border-amber-300/20 bg-amber-300/10 px-4 py-3">
          <AppText className="text-xs leading-5 text-amber-100">{errorMessage}</AppText>
        </View>
      ) : null}

      {isUnavailable ? (
        <View className="mt-4 rounded-[14px] bg-white/5 px-4 py-3">
          <AppText className="text-xs leading-5 text-white/50">
            웹에서는 실제 기기 권한을 확인할 수 없어요. 모바일 앱에서 확인해주세요.
          </AppText>
        </View>
      ) : null}

      <View className="mt-3">
        {items.map((item, index) => (
          <View
            key={item.kind}
            className={index > 0 ? 'border-t border-white/10' : ''}
          >
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
