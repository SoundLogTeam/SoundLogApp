import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import type { NativePermissionStatus } from '@/utils/nativePermissions';

type PermissionStatusBadgeProps = {
  status: NativePermissionStatus;
};

const statusMeta: Record<NativePermissionStatus, { bg: string; color: string; label: string }> = {
  denied: {
    bg: 'rgba(248,113,113,0.14)',
    color: '#FCA5A5',
    label: '꺼짐',
  },
  error: {
    bg: 'rgba(251,191,36,0.14)',
    color: '#FCD34D',
    label: '확인 실패',
  },
  granted: {
    bg: 'rgba(34,197,94,0.14)',
    color: '#86EFAC',
    label: '허용됨',
  },
  limited: {
    bg: 'rgba(96,165,250,0.14)',
    color: '#93C5FD',
    label: '제한됨',
  },
  unavailable: {
    bg: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.55)',
    label: '미지원',
  },
  undetermined: {
    bg: 'rgba(196,181,253,0.14)',
    color: '#C4B5FD',
    label: '확인 필요',
  },
};

export function PermissionStatusBadge({ status }: PermissionStatusBadgeProps) {
  const meta = statusMeta[status];

  return (
    <View className="rounded-full px-3 py-1" style={{ backgroundColor: meta.bg }}>
      <AppText className="text-[11px] font-semibold" style={{ color: meta.color }}>
        {meta.label}
      </AppText>
    </View>
  );
}
