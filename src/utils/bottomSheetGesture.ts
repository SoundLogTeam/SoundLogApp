type DismissGestureInput = {
  distance?: number;
  translationY: number;
  velocity?: number;
};

type SnapGestureInput = {
  collapsedOffset: number;
  currentOffset: number;
  expandedOffset?: number;
  translationY: number;
  velocity?: number;
};

export function getDismissibleBottomSheetOffset(translationY: number) {
  return translationY < 0 ? translationY * 0.18 : translationY;
}

export function shouldDismissBottomSheet({
  distance = 84,
  translationY,
  velocity = 0,
}: DismissGestureInput) {
  return translationY > distance || (velocity > 0.72 && translationY > 20);
}

export function getResistedBottomSheetOffset(
  offset: number,
  expandedOffset: number,
  collapsedOffset: number,
) {
  if (offset < expandedOffset) {
    return expandedOffset + (offset - expandedOffset) * 0.22;
  }

  if (offset > collapsedOffset) {
    return collapsedOffset + (offset - collapsedOffset) * 0.28;
  }

  return offset;
}

export function resolveBottomSheetSnapOffset({
  collapsedOffset,
  currentOffset,
  expandedOffset = 0,
  translationY,
  velocity = 0,
}: SnapGestureInput) {
  if (velocity < -0.32) {
    return expandedOffset;
  }

  if (velocity > 0.32) {
    return collapsedOffset;
  }

  const nextOffset = currentOffset + translationY;
  const midpoint = expandedOffset + (collapsedOffset - expandedOffset) / 2;
  return nextOffset <= midpoint ? expandedOffset : collapsedOffset;
}
