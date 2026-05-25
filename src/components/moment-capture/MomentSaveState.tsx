import { View } from 'react-native';

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
    <View
      className="mt-4 rounded-[16px] border px-4 py-3"
      style={{
        backgroundColor:
          type === 'error'
            ? 'rgba(248,113,113,0.12)'
            : type === 'success'
              ? 'rgba(34,197,94,0.12)'
              : 'rgba(255,255,255,0.1)',
        borderColor:
          type === 'error'
            ? 'rgba(248,113,113,0.22)'
            : type === 'success'
              ? 'rgba(34,197,94,0.22)'
              : 'rgba(255,255,255,0.1)',
      }}
    >
      <AppText className="text-center text-sm leading-5 text-white/75">{message}</AppText>
    </View>
  );
}
