import { router } from 'expo-router';
import { Linking, ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { SettingsRow } from '@/components/SettingsRow';
import { SOUNDLOG_SUPPORT_EMAIL } from '@/constants/legal';

type LegalSection = {
  body: string;
  title: string;
};

type LegalDocumentScreenProps = {
  sections: LegalSection[];
  subtitle: string;
  title: string;
  updatedAt: string;
};

function openSupportEmail() {
  const subject = encodeURIComponent('Soundlog 문의');
  void Linking.openURL(`mailto:${SOUNDLOG_SUPPORT_EMAIL}?subject=${subject}`);
}

export function LegalDocumentScreen({
  sections,
  subtitle,
  title,
  updatedAt,
}: LegalDocumentScreenProps) {
  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 48,
          paddingHorizontal: 20,
          paddingTop: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          leftContent={
            <IconButton label="뒤로가기" name="arrow-left" onPress={() => router.back()} />
          }
          title={title}
        />

        <View className="ml-12 mt-3">
          <AppText className="text-xs font-semibold text-soundlog-lime">
            {updatedAt}
          </AppText>
          <AppText className="mt-2 text-sm leading-6 text-white/48">
            {subtitle}
          </AppText>
        </View>

        <View className="mt-8 gap-7">
          {sections.map((section) => (
            <View key={section.title}>
              <SectionTitle title={section.title} />
              <AppText className="mt-3 text-sm leading-6 text-white/58">
                {section.body}
              </AppText>
            </View>
          ))}
        </View>

        <View className="mt-7">
          <SectionTitle title="고객지원" />
          <SettingsRow
            description={SOUNDLOG_SUPPORT_EMAIL}
            icon="mail"
            label="문의 메일 보내기"
            onPress={openSupportEmail}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
