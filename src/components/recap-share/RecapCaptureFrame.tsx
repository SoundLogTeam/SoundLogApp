import { ComponentRef, forwardRef, PropsWithChildren, useImperativeHandle, useRef } from 'react';
import ViewShot from 'react-native-view-shot';

export type RecapCaptureFrameHandle = {
  capture: () => Promise<string | undefined>;
};

type RecapCaptureFrameProps = PropsWithChildren;

export const RecapCaptureFrame = forwardRef<RecapCaptureFrameHandle, RecapCaptureFrameProps>(
  function RecapCaptureFrame({ children }, ref) {
    const viewShotRef = useRef<ComponentRef<typeof ViewShot>>(null);

    useImperativeHandle(ref, () => ({
      capture: () => viewShotRef.current?.capture?.() ?? Promise.resolve(undefined),
    }));

    return (
      <ViewShot
        ref={viewShotRef}
        options={{ format: 'png', quality: 1, result: 'tmpfile' }}
        style={{ alignSelf: 'center', aspectRatio: 3 / 4, maxWidth: 320, width: '88%' }}
      >
        {children}
      </ViewShot>
    );
  },
);
