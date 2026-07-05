import { LegalDocumentScreen } from '@/components/legal/LegalDocumentScreen';
import { SOUNDLOG_SUPPORT_EMAIL } from '@/constants/legal';

const privacySections = [
  {
    title: '수집하는 정보',
    body: 'Soundlog는 자체 계정 가입과 로그인을 위해 사용자가 입력한 이름, 이메일, 비밀번호 인증 정보를 처리할 수 있습니다. 사용자가 입력한 음악 취향, 여행 스타일, 동행 유형, 좋아요와 저장한 음악, 여행 순간 기록, Recap 생성에 필요한 사진, 위치, 시간, 장소, 음악 정보를 저장할 수 있습니다.',
  },
  {
    title: '위치와 사진 권한',
    body: '위치 권한은 현재 장소에 맞는 추천과 여행 순간의 장소 기록을 위해 사용합니다. 카메라와 사진 보관함 권한은 사용자가 직접 촬영한 순간을 저장하고 Recap 이미지를 보관함에 저장하기 위해 사용합니다. 백그라운드 위치 추적은 사용하지 않습니다.',
  },
  {
    title: '이용 목적',
    body: '수집된 정보는 위치 기반 음악 추천, 여행 로그 저장, Recap 생성, 계정 동기화, 오류 대응, 서비스 안정성 개선에 사용됩니다. 광고 추적이나 제3자 광고 목적의 판매에는 사용하지 않습니다.',
  },
  {
    title: '제3자 서비스',
    body: '로그인에는 Soundlog 자체 계정이 사용되고, 장소 정보에는 공공 관광 데이터 API가 사용될 수 있습니다. Soundlog는 음악 추천과 기록 UI를 앱 안에서 제공하며, 음원 재생 서비스 계정 정보는 수집하지 않습니다.',
  },
  {
    title: '보관과 삭제',
    body: '계정 데이터와 여행 기록은 사용자가 서비스를 이용하는 동안 보관됩니다. 삭제를 원하면 My 화면의 계정 삭제 요청 또는 문의 메일을 통해 요청할 수 있으며, 확인 후 처리됩니다.',
  },
  {
    title: '문의',
    body: `개인정보와 데이터 삭제 문의는 ${SOUNDLOG_SUPPORT_EMAIL} 으로 보낼 수 있습니다.`,
  },
];

export default function PrivacyScreen() {
  return (
    <LegalDocumentScreen
      sections={privacySections}
      subtitle="Soundlog가 어떤 데이터를 어떤 목적으로 다루는지 사용자가 앱 안에서 바로 확인할 수 있도록 정리했습니다."
      title="개인정보 처리방침"
      updatedAt="시행일 2026.06.24"
    />
  );
}
