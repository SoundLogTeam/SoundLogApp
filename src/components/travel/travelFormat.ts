export function formatKoreanDateTime(value?: string) {
  if (!value) {
    return '아직 없음';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '확인 불가';
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

export function formatShortEndedAt(value?: string) {
  if (!value) {
    return '종료 시간 확인 중';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '종료 시간 확인 중';
  }

  const hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, '0');
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')} | ${displayHour}:${minute} ${period} 종료`;
}

export function formatElapsedTime(startedAt?: string, endedAt?: string) {
  if (!startedAt) {
    return '00:00:00';
  }

  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return '00:00:00';
  }

  const seconds = Math.floor((end - start) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds,
  ).padStart(2, '0')}`;
}

export function formatDurationText(startedAt?: string, endedAt?: string) {
  if (!startedAt || !endedAt) {
    return '2시간 00분';
  }

  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return '2시간 00분';
  }

  const minutes = Math.max(1, Math.round((end - start) / 60000));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours <= 0) {
    return `${remainingMinutes}분`;
  }

  return `${hours}시간 ${String(remainingMinutes).padStart(2, '0')}분`;
}
