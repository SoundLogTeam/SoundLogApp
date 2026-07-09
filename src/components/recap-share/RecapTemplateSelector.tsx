import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { RecapTemplateId } from '@/types/domain';

const templateOptions: Array<{
  id: RecapTemplateId;
  label: string;
}> = [
  { id: 'album', label: '앨범' },
  { id: 'lp', label: 'LP' },
  { id: 'film', label: '필름' },
  { id: 'map', label: '지도' },
];

type RecapTemplateSelectorProps = {
  selectedTemplate: RecapTemplateId;
  onSelect: (template: RecapTemplateId) => void;
};

export function RecapTemplateSelector({
  selectedTemplate,
  onSelect,
}: RecapTemplateSelectorProps) {
  return (
    <View className="flex-row rounded-full border border-white/10 bg-white/[0.06] p-1">
      {templateOptions.map((option) => {
        const isSelected = selectedTemplate === option.id;

        return (
          <Pressable
            key={option.id}
            accessibilityLabel={`${option.label} 리캡 템플릿 선택`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            className={`min-w-[74px] items-center rounded-full px-4 py-2 ${
              isSelected ? 'bg-white' : 'bg-transparent'
            }`}
            onPress={() => onSelect(option.id)}
          >
            <AppText
              className={`text-xs font-semibold ${isSelected ? 'text-soundlog-bg' : 'text-white/65'}`}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
