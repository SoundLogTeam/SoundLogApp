import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { MusicPlatformId } from '@/types/domain';
import { getMusicPlatformOption, musicPlatformOptions } from '@/utils/musicPlatformLinks';

type MusicPlatformSettingsCardProps = {
  onSelectPlatform: (id: MusicPlatformId) => void;
  selectedPlatformId: MusicPlatformId;
};

export function MusicPlatformSettingsCard({
  onSelectPlatform,
  selectedPlatformId,
}: MusicPlatformSettingsCardProps) {
  const selectedPlatform = getMusicPlatformOption(selectedPlatformId);

  return (
    <View className="mt-6 rounded-[22px] border border-white/10 bg-white/10 p-5">
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
          <Feather color="#fff" name="music" size={18} />
        </View>
        <View className="min-w-0 flex-1">
          <AppText className="text-sm font-semibold text-white/45">음악 플랫폼</AppText>
          <AppText className="mt-2 text-[20px] font-semibold text-white">
            {selectedPlatform.label}
          </AppText>
          <AppText className="mt-2 text-xs leading-5 text-white/50">
            추천 음악은 선택한 플랫폼의 외부 링크로 열어요.
          </AppText>
        </View>
      </View>

      <View
        accessibilityLabel="음악 플랫폼 선택"
        accessibilityRole="radiogroup"
        className="mt-5 flex-row flex-wrap gap-2"
      >
        {musicPlatformOptions.map((option) => {
          const selected = option.id === selectedPlatformId;

          return (
            <Pressable
              key={option.id}
              accessibilityLabel={option.label}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              className={`rounded-full border px-4 py-2 ${
                selected
                  ? 'border-[#7A8CFF] bg-[#243A75]'
                  : 'border-white/10 bg-white/5'
              }`}
              onPress={() => onSelectPlatform(option.id)}
            >
              <AppText className="text-xs font-semibold text-white">{option.shortLabel}</AppText>
            </Pressable>
          );
        })}
      </View>

      <AppText className="mt-4 text-xs leading-5 text-white/40">
        {selectedPlatform.description}
      </AppText>
    </View>
  );
}
