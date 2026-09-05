import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, PanResponder } from 'react-native';

import {
  getDismissibleBottomSheetOffset,
  getResistedBottomSheetOffset,
  resolveBottomSheetSnapOffset,
  shouldDismissBottomSheet,
} from '@/utils/bottomSheetGesture';

type DismissibleBottomSheetGestureParams = {
  onDismiss: () => void;
  visible?: boolean;
};

type SnappingBottomSheetGestureParams = {
  collapsedOffset: number;
  expandedOffset?: number;
};

function isVerticalSheetDrag(dx: number, dy: number) {
  return Math.abs(dy) > 4 && Math.abs(dy) > Math.abs(dx);
}

export function useDismissibleBottomSheetGesture({
  onDismiss,
  visible = true,
}: DismissibleBottomSheetGestureParams) {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(360)).current;

  useEffect(() => {
    if (!visible) {
      backdropOpacity.stopAnimation();
      translateY.stopAnimation();
      backdropOpacity.setValue(0);
      translateY.setValue(360);
      return;
    }

    backdropOpacity.stopAnimation();
    translateY.stopAnimation();
    backdropOpacity.setValue(0);
    translateY.setValue(360);

    const animationFrame = requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          duration: 150,
          easing: Easing.out(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          damping: 24,
          mass: 0.82,
          stiffness: 230,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [backdropOpacity, translateY, visible]);

  const restore = useCallback(() => {
    Animated.spring(translateY, {
      damping: 22,
      stiffness: 240,
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }, [translateY]);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        duration: 150,
        easing: Easing.in(Easing.quad),
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
        toValue: 360,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onDismiss();
        backdropOpacity.setValue(0);
        translateY.setValue(360);
      }
    });
  }, [backdropOpacity, onDismiss, translateY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => isVerticalSheetDrag(gesture.dx, gesture.dy),
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          isVerticalSheetDrag(gesture.dx, gesture.dy),
        onPanResponderMove: (_, gesture) => {
          translateY.setValue(getDismissibleBottomSheetOffset(gesture.dy));
        },
        onPanResponderRelease: (_, gesture) => {
          if (
            shouldDismissBottomSheet({
              translationY: gesture.dy,
              velocity: gesture.vy,
            })
          ) {
            dismiss();
            return;
          }

          restore();
        },
        onPanResponderTerminate: restore,
        onPanResponderTerminationRequest: () => false,
      }),
    [dismiss, restore, translateY],
  );

  return {
    backdropOpacity,
    dismiss,
    panHandlers: panResponder.panHandlers,
    translateY,
  };
}

export function useSnappingBottomSheetGesture({
  collapsedOffset,
  expandedOffset = 0,
}: SnappingBottomSheetGestureParams) {
  const translateY = useRef(new Animated.Value(collapsedOffset)).current;
  const currentOffset = useRef(collapsedOffset);
  const dragStartOffset = useRef(collapsedOffset);

  useEffect(() => {
    currentOffset.current = collapsedOffset;
    dragStartOffset.current = collapsedOffset;
    translateY.setValue(collapsedOffset);
  }, [collapsedOffset, expandedOffset, translateY]);

  const snapTo = useCallback(
    (offset: number) => {
      currentOffset.current = offset;
      Animated.spring(translateY, {
        damping: 22,
        stiffness: 240,
        toValue: offset,
        useNativeDriver: true,
      }).start();
    },
    [translateY],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => isVerticalSheetDrag(gesture.dx, gesture.dy),
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          isVerticalSheetDrag(gesture.dx, gesture.dy),
        onPanResponderGrant: () => {
          translateY.stopAnimation();
          dragStartOffset.current = currentOffset.current;
        },
        onPanResponderMove: (_, gesture) => {
          translateY.setValue(
            getResistedBottomSheetOffset(
              dragStartOffset.current + gesture.dy,
              expandedOffset,
              collapsedOffset,
            ),
          );
        },
        onPanResponderRelease: (_, gesture) => {
          snapTo(
            resolveBottomSheetSnapOffset({
              collapsedOffset,
              currentOffset: dragStartOffset.current,
              expandedOffset,
              translationY: gesture.dy,
              velocity: gesture.vy,
            }),
          );
        },
        onPanResponderTerminate: () => snapTo(currentOffset.current),
        onPanResponderTerminationRequest: () => false,
      }),
    [collapsedOffset, expandedOffset, snapTo, translateY],
  );

  return {
    panHandlers: panResponder.panHandlers,
    translateY,
  };
}
