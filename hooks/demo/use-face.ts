/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useEffect, useRef, useState } from 'react';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';

export type FaceResults = {
  /** A value that represents how open the eyes are. */
  eyesScale: number;
  /** A value that represents how open the mouth is. */
  mouthScale: number;
};

/* Easing function examples - uncomment to experiment with different animation curves.
function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}
// ... other easing functions ...
*/

/**
 * An easing function that produces a quintic ease-out curve.
 * This creates a natural-looking deceleration effect for animations.
 */
function easeOutQuint(x: number): number {
  return 1 - Math.pow(1 - x, 5);
}

/**
 * Constrains a value to be within a specified range.
 */
function clamp(x: number, lowerlimit: number, upperlimit: number) {
  if (x < lowerlimit) x = lowerlimit;
  if (x > upperlimit) x = upperlimit;
  return x;
}

/**
 * A smoothstep function that interpolates smoothly between 0 and 1.
 * It's used here to create a more natural transition for eye blinking.
 */
function smoothstep(edge0: number, edge1: number, x: number) {
  // Scale, bias, and saturate to the range [0, 1].
  x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  // Apply cubic polynomial smoothing.
  return x * x * (3 - 2 * x);
}

type BlinkProps = {
  speed: number;
  isActive: boolean;
};

/**
 * A custom hook that generates a continuous, natural-looking blinking animation.
 * It returns a ref containing the current eye scale.
 */
export function useBlink({ speed, isActive }: BlinkProps) {
  const eyeScaleRef = useRef(1);
  const frameRef = useRef(0);
  const frameId = useRef(-1);

  useEffect(() => {
    if (!isActive) {
      if (frameId.current) {
        window.cancelAnimationFrame(frameId.current);
      }
      return;
    }

    function nextFrame() {
      frameId.current = window.requestAnimationFrame(() => {
        frameRef.current += 1;
        let s = easeOutQuint((Math.sin(frameRef.current * speed) + 1) * 2);
        s = smoothstep(0.1, 0.25, s);
        eyeScaleRef.current = Math.min(1, s);
        nextFrame();
      });
    }

    nextFrame();

    return () => {
      window.cancelAnimationFrame(frameId.current);
    };
  }, [speed, isActive]);

  return eyeScaleRef;
}

/**
 * A custom hook that combines different animation effects for the face.
 * @param isActive Controls whether the face animations are running.
 * @returns An object with refs for `eyeScale` and `mouthScale`.
 */
export default function useFace({ isActive = true }) {
  const { volumeRef } = useLiveAPIContext();
  const eyeScaleRef = useBlink({ speed: 0.0125, isActive });

  return { eyeScaleRef, volumeRef };
}
