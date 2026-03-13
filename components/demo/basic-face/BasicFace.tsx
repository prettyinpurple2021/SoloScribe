/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { RefObject, useEffect, useState, useRef } from 'react';

import { renderBasicFace } from './basic-face-render';

import useFace from '../../../hooks/demo/use-face';
import useHover from '../../../hooks/demo/use-hover';
import useTilt from '../../../hooks/demo/use-tilt';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';

type BasicFaceProps = {
  /** The canvas element on which to render the face. */
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** The radius of the face. */
  radius?: number;
  /** The color of the face. */
  color?: string;
  /** Whether the agent is currently talking. */
  isTalking: boolean;
};

/**
 * A component that renders an animated, expressive face on a canvas.
 * It uses custom hooks to manage its state and animations, driven by
 * data from the LiveAPIContext.
 */
export default function BasicFace({
  canvasRef,
  radius = 250,
  color,
  isTalking,
}: BasicFaceProps) {
  // Audio output volume from the Live API, used to control mouth movement.
  const { connected } = useLiveAPIContext();

  // Custom hooks to manage different aspects of the face's animation.
  const { eyeScaleRef, volumeRef } = useFace({ isActive: connected });
  const hoverPositionRef = useHover({ isActive: connected });
  const tiltAngleRef = useTilt({
    maxAngle: 5,
    speed: 0.075,
    isActive: connected && isTalking,
  });

  const colorRef = useRef(color);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  // This effect manages the animation loop for the face.
  // Using requestAnimationFrame ensures that rendering is synced with the
  // browser's refresh rate, preventing unnecessary work and potential audio glitches.
  useEffect(() => {
    let frameId: number;

    const render = () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        renderBasicFace({
          ctx,
          mouthScale: volumeRef.current / 2,
          eyeScale: eyeScaleRef.current,
          color: colorRef.current,
        });

        // Apply hover and tilt transforms directly to the canvas element.
        if (canvasRef.current) {
          canvasRef.current.style.transform = `translateY(${hoverPositionRef.current}px) rotate(${tiltAngleRef.current}deg)`;
        }
      }
      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [canvasRef, volumeRef, eyeScaleRef, hoverPositionRef, tiltAngleRef]);

  return (
    <canvas
      className="basic-face"
      ref={canvasRef}
      width={radius * 2}
      height={radius * 2}
      style={{
        display: 'block',
        borderRadius: '50%',
      }}
    />
  );
}
