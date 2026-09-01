const { readFileSync, readdirSync, statSync } = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const appRoot = path.join(projectRoot, 'app');
const sourceRoot = path.resolve(__dirname, '..', 'src');
const allowedRawImageFiles = new Map([
  ['src/components/BrandLogo.tsx', '앱 번들 로고 자산'],
  ['src/components/onboarding/OnboardingScreen.tsx', '앱 번들 온보딩 자산'],
  [
    'src/components/moment-capture/MomentPhotoCanvas.tsx',
    '오류 처리가 포함된 사용자 촬영 원본',
  ],
  [
    'src/components/media/ResilientImage.tsx',
    '원격 이미지 공통 오류 처리 컴포넌트',
  ],
]);

function collectFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    return statSync(fullPath).isDirectory() ? collectFiles(fullPath) : [fullPath];
  });
}

const failures = [];
let resilientUsageCount = 0;
const sourceFiles = [appRoot, sourceRoot].flatMap(collectFiles).filter((file) =>
  /\.(?:js|jsx|ts|tsx)$/.test(file),
);
const routeFiles = collectFiles(appRoot).filter((file) => file.endsWith('.tsx'));

for (const filePath of sourceFiles) {
  const source = readFileSync(filePath, 'utf8');
  const importsRawImage =
    /import\s*\{[^}]*\bImage\b[^}]*\}\s*from\s*['"](?:expo-image|react-native)['"]/s.test(
      source,
    );
  const rawImageCount = importsRawImage
    ? (source.match(/<Image(?:\s|>)/g)?.length ?? 0)
    : 0;
  const resilientCount = source.match(/<ResilientImage(?:\s|>)/g)?.length ?? 0;
  const relativePath = path.relative(projectRoot, filePath);

  resilientUsageCount += resilientCount;

  if (source.includes('tong.visitkorea.or.kr/cms2/website/')) {
    failures.push(`${relativePath}: 검증되지 않은 관광 이미지 URL 사용`);
  }

  if (rawImageCount > 0 && !allowedRawImageFiles.has(relativePath)) {
    failures.push(`${relativePath}: 공통 오류 처리 없는 Image 사용`);
  }

  if (relativePath === 'src/components/moment-capture/MomentPhotoCanvas.tsx') {
    if (rawImageCount !== 1 || !source.includes('onError={() => setHasPhotoError(true)}')) {
      failures.push(`${relativePath}: 사용자 촬영 원본의 오류 처리가 변경됨`);
    }
  }
}

if (routeFiles.length < 17) {
  failures.push(`검사한 라우트 파일이 예상보다 적음: ${routeFiles.length}`);
}

if (resilientUsageCount < 20) {
  failures.push(`ResilientImage 적용 수가 예상보다 적음: ${resilientUsageCount}`);
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `[image-components] 라우트 ${routeFiles.length}개와 원격 이미지 ${resilientUsageCount}곳 공통 오류 처리 확인 완료`,
  );
}
