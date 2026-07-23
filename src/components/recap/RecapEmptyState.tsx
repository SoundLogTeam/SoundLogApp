import { SettingsRow } from '@/components/SettingsRow';

export function RecapEmptyState() {
  return (
    <SettingsRow
      description="여행모드에서 남긴 기록과 공개된 여행 로그가 생기면 격자로 모아볼 수 있어요."
      icon="grid"
      label="아직 볼 수 있는 로그가 없어요"
    />
  );
}
