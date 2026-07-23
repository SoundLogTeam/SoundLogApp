import { AppText } from '@/components/AppText';

type MomentSaveStateProps = {
  message?: string;
  type?: 'error' | 'info' | 'success';
};

export function MomentSaveState({ message, type = 'info' }: MomentSaveStateProps) {
  if (!message) {
    return null;
  }

  return (
    <AppText
      className="mt-4 text-center text-sm leading-5"
      style={{
        color:
          type === 'error'
            ? '#FECACA'
            : type === 'success'
              ? '#B7E628'
              : 'rgba(255,255,255,0.62)',
      }}
    >
      {message}
    </AppText>
  );
}
