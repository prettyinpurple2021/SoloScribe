/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useEffect, useRef, useState } from 'react';

interface HoverProps {
  /** Maximum distance in pixels that the element will move up and down from its initial position. */
  amplitude?: number;
  /** Number of complete hover cycles per second. Lower values create slower, gentler movement. */
  frequency?: number;
  /** Whether the hover animation is currently active. */
  isActive?: boolean;
}

/**
 * A custom hook that creates a gentle, continuous up-and-down hovering animation.
 * It returns a vertical offset value that can be applied to a component's `transform` style.
 */
export default function useHover({
  amplitude = 10,
  frequency = 0.5,
  isActive = true,
}: HoverProps = {}) {
  const offsetRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      offsetRef.current = Math.sin(elapsed * frequency * Math.PI) * amplitude;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [amplitude, frequency, isActive]);

  return offsetRef;
}
