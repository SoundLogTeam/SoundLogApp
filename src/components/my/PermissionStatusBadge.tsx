import { AppText } from '@/components/AppText';
import type { NativePermissionStatus } from '@/utils/nativePermissions';

type PermissionStatusBadgeProps = {
  status: NativePermissionStatus;
};

const statusMeta: Record<
  NativePermissionStatus,
  { color: string; label: string }
> = {
  denied: {
    color: '#FCA5A5',
    label: '꺼짐',
  },
  error: {
    color: '#FCD34D',
    label: '확인 실패',
  },
  granted: {
    color: '#86EFAC',
    label: '허용됨',
  },
  limited: {
    color: '#93C5FD',
    label: '제한됨',
  },
  unavailable: {
    color: 'rgba(255,255,255,0.55)',
    label: '미지원',
  },
  undetermined: {
    color: '#C4B5FD',
    label: '확인 필요',
  },
};

export function PermissionStatusBadge({ status }: PermissionStatusBadgeProps) {
  const meta = statusMeta[status];

  return (
    <AppText className="text-xs font-medium" style={{ color: meta.color }}>
      {meta.label}
    </AppText>
  );
}
