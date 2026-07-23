const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const sourcePath = path.join(process.cwd(), 'src/utils/recapMapClustering.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: sourcePath,
});
const moduleRef = { exports: {} };

vm.runInNewContext(transpiled.outputText, {
  exports: moduleRef.exports,
  module: moduleRef,
});

const { clusterRecapMarkers, RECAP_MAP_PIN_DIAMETER_PX } = moduleRef.exports;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function marker(id, lat, lng) {
  return {
    artistName: 'Soundlog',
    createdAt: '2026-07-13T00:00:00.000Z',
    id,
    location: { lat, lng },
    ownerAlias: '나',
    placeName: id,
    recapId: id,
    templateId: 'album',
    title: id,
    trackTitle: id,
    visibility: 'private',
  };
}

const viewport = {
  height: 780,
  region: {
    latitude: 37.5665,
    latitudeDelta: 0.16,
    longitude: 126.978,
    longitudeDelta: 0.16,
  },
  width: 390,
};
const longitudePerPixel = viewport.region.longitudeDelta / viewport.width;
const overlapMarkers = [
  marker('a', 37.5665, 126.978),
  marker(
    'b',
    37.5665,
    126.978 + longitudePerPixel * (RECAP_MAP_PIN_DIAMETER_PX - 1),
  ),
  marker(
    'c',
    37.5665,
    126.978 + longitudePerPixel * (RECAP_MAP_PIN_DIAMETER_PX + 1),
  ),
];
const grouped = clusterRecapMarkers(
  [overlapMarkers[0], overlapMarkers[1], marker('far', 37.5665, 127.08)],
  viewport,
);

assert(grouped.length === 2, '화면에서 겹친 핀만 같은 클러스터여야 합니다.');
assert(
  grouped.some((cluster) => cluster.markers.length === 2),
  '핀 지름보다 중심 간격이 작은 두 핀이 숫자 클러스터가 되어야 합니다.',
);

assert(
  clusterRecapMarkers([overlapMarkers[0], overlapMarkers[2]], viewport)
    .length === 2,
  '핀 지름보다 중심 간격이 큰 두 핀은 가까워도 묶이지 않아야 합니다.',
);

const sameCoordinates = [
  marker('same-a', 37.5665, 126.978),
  marker('same-b', 37.5665, 126.978),
];
assert(
  clusterRecapMarkers(sameCoordinates, viewport).length === 1,
  '같은 좌표의 핀은 반드시 하나의 클러스터로 묶여야 합니다.',
);

const zoomSensitiveMarkers = [
  marker('zoom-a', 37.5665, 126.978),
  marker('zoom-b', 37.5665, 126.979),
];
assert(
  clusterRecapMarkers(zoomSensitiveMarkers, viewport).length === 1,
  '축소 화면에서 실제로 겹치는 핀은 하나의 클러스터여야 합니다.',
);
assert(
  clusterRecapMarkers(zoomSensitiveMarkers, {
    ...viewport,
    region: {
      ...viewport.region,
      latitudeDelta: 0.002,
      longitudeDelta: 0.002,
    },
  }).length === 2,
  '확대해 핀이 떨어지면 같은 좌표 간격도 개별 핀으로 분리되어야 합니다.',
);

const transitiveMarkers = [
  marker('chain-a', 37.5665, 126.978),
  marker('chain-b', 37.5665, 126.978 + longitudePerPixel * 40),
  marker('chain-c', 37.5665, 126.978 + longitudePerPixel * 80),
];
assert(
  clusterRecapMarkers(transitiveMarkers, viewport).length === 1,
  '서로 이어져 겹치는 핀들은 하나의 클러스터로 묶여야 합니다.',
);

assert(
  clusterRecapMarkers(sameCoordinates, {
    ...viewport,
    width: 0,
  }).length === 2,
  '지도 크기를 모를 때는 핀을 임의로 묶지 않아야 합니다.',
);

const antimeridianMarkers = [
  marker('east', 0, 179.999),
  marker('west', 0, -179.999),
];
const antimeridianClusters = clusterRecapMarkers(antimeridianMarkers, {
  ...viewport,
  region: {
    latitude: 0,
    latitudeDelta: 0.1,
    longitude: 180,
    longitudeDelta: 0.1,
  },
});
assert(
  antimeridianClusters.length === 1,
  '날짜 변경선 양쪽의 화면상 인접 핀도 정상적으로 묶여야 합니다.',
);
assert(
  Math.abs(Math.abs(antimeridianClusters[0].location.lng) - 180) < 0.001,
  '날짜 변경선 클러스터 중심이 반대편 경도로 이동하지 않아야 합니다.',
);

console.log('Recap map screen-overlap clustering check passed.');
