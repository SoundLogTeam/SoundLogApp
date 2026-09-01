import { describe, expect, it } from 'vitest';

import {
  getDismissibleBottomSheetOffset,
  getResistedBottomSheetOffset,
  resolveBottomSheetSnapOffset,
  shouldDismissBottomSheet,
} from '@/utils/bottomSheetGesture';

describe('bottom sheet gesture helpers', () => {
  it('resists upward dragging on a dismissible sheet', () => {
    expect(getDismissibleBottomSheetOffset(-100)).toBe(-18);
    expect(getDismissibleBottomSheetOffset(48)).toBe(48);
  });

  it('dismisses only after enough downward distance or velocity', () => {
    expect(shouldDismissBottomSheet({ translationY: 90 })).toBe(true);
    expect(shouldDismissBottomSheet({ translationY: 24, velocity: 0.8 })).toBe(true);
    expect(shouldDismissBottomSheet({ translationY: 20, velocity: 0.8 })).toBe(false);
  });

  it('resists movement beyond expanded and collapsed snap points', () => {
    expect(getResistedBottomSheetOffset(-20, 0, 120)).toBe(-4.4);
    expect(getResistedBottomSheetOffset(150, 0, 120)).toBe(128.4);
  });

  it('snaps based on velocity before falling back to the midpoint', () => {
    expect(
      resolveBottomSheetSnapOffset({
        collapsedOffset: 120,
        currentOffset: 120,
        translationY: -10,
        velocity: -0.5,
      }),
    ).toBe(0);
    expect(
      resolveBottomSheetSnapOffset({
        collapsedOffset: 120,
        currentOffset: 0,
        translationY: 10,
        velocity: 0.5,
      }),
    ).toBe(120);
    expect(
      resolveBottomSheetSnapOffset({
        collapsedOffset: 120,
        currentOffset: 120,
        translationY: -70,
      }),
    ).toBe(0);
    expect(
      resolveBottomSheetSnapOffset({
        collapsedOffset: 120,
        currentOffset: 0,
        translationY: 70,
      }),
    ).toBe(120);
  });
});
