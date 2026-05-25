import { PlaceContext } from '@/types/domain';

type TourLocationItem = Record<string, unknown>;

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : undefined;
}

function getNumber(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getCategory(item: TourLocationItem) {
  return (
    getString(item.lclsSystm3) ??
    getString(item.lclsSystm2) ??
    getString(item.lclsSystm1) ??
    getString(item.cat3) ??
    getString(item.cat2) ??
    getString(item.cat1)
  );
}

export function mapTourLocationItem(item: TourLocationItem): PlaceContext | undefined {
  const title = getString(item.title);

  if (!title) {
    return undefined;
  }

  const mapx = getNumber(item.mapx);
  const mapy = getNumber(item.mapy);
  const address = [getString(item.addr1), getString(item.addr2)].filter(Boolean).join(' ');

  return {
    address: address || undefined,
    category: getCategory(item),
    contentType: getString(item.contenttypeid),
    distanceMeters: getNumber(item.dist),
    id: getString(item.contentid) ?? title,
    imageUrl: getString(item.firstimage) ?? getString(item.firstimage2),
    location: mapx !== undefined && mapy !== undefined ? { lat: mapy, lng: mapx } : undefined,
    overview: getString(item.overview),
    source: 'tour-api',
    title,
  };
}

export function mapTourLocationItems(items: unknown): PlaceContext[] {
  if (!items) {
    return [];
  }

  const normalizedItems = Array.isArray(items) ? items : [items];

  return normalizedItems
    .map((item) => (item && typeof item === 'object' ? mapTourLocationItem(item as TourLocationItem) : undefined))
    .filter((item): item is PlaceContext => Boolean(item));
}
