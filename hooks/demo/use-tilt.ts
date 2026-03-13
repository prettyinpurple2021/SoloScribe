/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useEffect, useRef, useState } from 'react';

export type UseTiltProps = {
  /** Maximum tilt angle (degrees) in either direction. */
  maxAngle: number;
  /** How quickly the tilt occurs. Lower values create slower, gentler movement. */
  speed?: number;
  /** Whether tilt mode is currently active. */
  isActive: boolean;
};

/**
 * Maps a value from one numerical range to another.
 * e.g., scalemap(0.5, 0, 1, 0, 100) would return 50.
 */
export function scalemap(
  value: number,
  start1: number,
  stop1: number,
  start2: number,
  stop2: number
): number {
  return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}

/**
 * A custom hook that creates a subtle, randomized tilting animation.
 * The element will gently tilt back and forth to random angles within the specified `maxAngle`.
 */
export default function useTilt({
  maxAngle = 5,
  speed = 0.1,
  isActive = false,
}: UseTiltProps) {
  const angleRef = useRef<number>(0);
  const targetAngleRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) {
      targetAngleRef.current = 0;
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    const scheduleNextTilt = () => {
      const delay = 1000 + Math.random() * 2000;
      timeoutRef.current = setTimeout(() => {
        if (Math.abs(targetAngleRef.current) > 0.1) {
          targetAngleRef.current = 0;
        } else {
          const newAngle =
            (Math.random() > 0.5 ? 1 : -1) *
            (maxAngle * 0.3 + Math.random() * maxAngle * 0.7);
          targetAngleRef.current = newAngle;
        }
        scheduleNextTilt();
      }, delay);
    };

    scheduleNextTilt();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [maxAngle, isActive]);

  useEffect(() => {
    const animate = () => {
      const diff = targetAngleRef.current - angleRef.current;
      const delta = diff * speed;
      angleRef.current += delta;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [speed]);

  return angleRef;
}
