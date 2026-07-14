import type { GeoPoint, RecapMapMarker } from '@/types/domain';

export type RecapMarkerCluster = {
  id: string;
  location: GeoPoint;
  markers: RecapMapMarker[];
};

export type RecapMapRegion = {
  latitude: number;
  latitudeDelta: number;
  longitude: number;
  longitudeDelta: number;
};

export type RecapMapClusteringViewport = {
  height: number;
  region: RecapMapRegion;
  width: number;
};

export const RECAP_MAP_PIN_DIAMETER_PX = 44;

const MAX_MERCATOR_LATITUDE = 85.051_128_78;

function clampLatitude(latitude: number) {
  return Math.max(
    -MAX_MERCATOR_LATITUDE,
    Math.min(MAX_MERCATOR_LATITUDE, latitude),
  );
}

function toMercatorY(latitude: number) {
  const radians = (clampLatitude(latitude) * Math.PI) / 180;

  return Math.log(Math.tan(Math.PI / 4 + radians / 2));
}

function getWrappedLongitudeDelta(from: number, to: number) {
  const rawDelta = Math.abs(from - to) % 360;

  return Math.min(rawDelta, 360 - rawDelta);
}

function normalizeLongitude(longitude: number) {
  return ((((longitude + 180) % 360) + 360) % 360) - 180;
}

function isValidViewport(
  viewport: RecapMapClusteringViewport | undefined,
): viewport is RecapMapClusteringViewport {
  if (!viewport) {
    return false;
  }

  const { height, region, width } = viewport;

  return (
    Number.isFinite(height) &&
    Number.isFinite(width) &&
    Number.isFinite(region.latitude) &&
    Number.isFinite(region.latitudeDelta) &&
    Number.isFinite(region.longitude) &&
    Number.isFinite(region.longitudeDelta) &&
    height > 0 &&
    width > 0 &&
    region.latitudeDelta > 0 &&
    region.longitudeDelta > 0
  );
}

function getVerticalPixelDistance(
  from: GeoPoint,
  to: GeoPoint,
  viewport: RecapMapClusteringViewport,
) {
  const northLatitude =
    viewport.region.latitude + viewport.region.latitudeDelta / 2;
  const southLatitude =
    viewport.region.latitude - viewport.region.latitudeDelta / 2;
  const mercatorSpan = Math.abs(
    toMercatorY(northLatitude) - toMercatorY(southLatitude),
  );

  if (mercatorSpan === 0) {
    return Number.POSITIVE_INFINITY;
  }

  return (
    (Math.abs(toMercatorY(from.lat) - toMercatorY(to.lat)) / mercatorSpan) *
    viewport.height
  );
}

function doMarkerPinsOverlap(
  from: RecapMapMarker,
  to: RecapMapMarker,
  viewport: RecapMapClusteringViewport,
  pinDiameterPx: number,
) {
  const horizontalPixelDistance =
    (getWrappedLongitudeDelta(from.location.lng, to.location.lng) /
      viewport.region.longitudeDelta) *
    viewport.width;
  const verticalPixelDistance = getVerticalPixelDistance(
    from.location,
    to.location,
    viewport,
  );

  return (
    Math.hypot(horizontalPixelDistance, verticalPixelDistance) <= pinDiameterPx
  );
}

function getClusterCenter(markers: RecapMapMarker[]): GeoPoint {
  const referenceLongitude = markers[0].location.lng;
  const total = markers.reduce(
    (sum, marker) => ({
      lat: sum.lat + marker.location.lat,
      lng:
        sum.lng +
        referenceLongitude +
        normalizeLongitude(marker.location.lng - referenceLongitude),
    }),
    { lat: 0, lng: 0 },
  );

  return {
    lat: total.lat / markers.length,
    lng: normalizeLongitude(total.lng / markers.length),
  };
}

function createStableClusterId(markers: RecapMapMarker[]) {
  const value = markers
    .map((marker) => marker.id)
    .sort((left, right) => left.localeCompare(right))
    .join('|');
  let hash = 2_166_136_261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return `recap-cluster-${(hash >>> 0).toString(36)}`;
}

export function clusterRecapMarkers(
  markers: RecapMapMarker[],
  viewport?: RecapMapClusteringViewport,
  pinDiameterPx = RECAP_MAP_PIN_DIAMETER_PX,
): RecapMarkerCluster[] {
  if (
    markers.length <= 1 ||
    !isValidViewport(viewport) ||
    !Number.isFinite(pinDiameterPx) ||
    pinDiameterPx <= 0
  ) {
    return markers.map((marker) => ({
      id: marker.id,
      location: marker.location,
      markers: [marker],
    }));
  }

  const parents = markers.map((_, index) => index);

  function findRoot(index: number): number {
    if (parents[index] !== index) {
      parents[index] = findRoot(parents[index]);
    }

    return parents[index];
  }

  function merge(leftIndex: number, rightIndex: number) {
    const leftRoot = findRoot(leftIndex);
    const rightRoot = findRoot(rightIndex);

    if (leftRoot !== rightRoot) {
      parents[rightRoot] = leftRoot;
    }
  }

  for (let leftIndex = 0; leftIndex < markers.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < markers.length;
      rightIndex += 1
    ) {
      if (
        doMarkerPinsOverlap(
          markers[leftIndex],
          markers[rightIndex],
          viewport,
          pinDiameterPx,
        )
      ) {
        merge(leftIndex, rightIndex);
      }
    }
  }

  const buckets = new Map<number, RecapMapMarker[]>();

  markers.forEach((marker, index) => {
    const root = findRoot(index);
    const bucket = buckets.get(root);

    if (bucket) {
      bucket.push(marker);
      return;
    }

    buckets.set(root, [marker]);
  });

  return Array.from(buckets.values()).map((bucket) => ({
    id: createStableClusterId(bucket),
    location: getClusterCenter(bucket),
    markers: bucket,
  }));
}
