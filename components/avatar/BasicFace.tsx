/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { RefObject } from 'react';

type BasicFaceProps = {
  /** The canvas element on which to render the face (unused in image version). */
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** The radius of the face. */
  radius?: number;
  /** The color of the face (unused in image version). */
  color?: string;
  /** Whether the agent is currently talking. */
  isTalking: boolean;
};

/**
 * A component that renders a high-quality 3D emoji face for InkLo.
 */
export default function BasicFace({
  radius = 50,
  isTalking,
}: BasicFaceProps) {
  return (
    <img
      src="https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f62e.png"
      alt="InkLo"
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        objectFit: 'cover',
        transform: isTalking ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.1s ease-in-out',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3), inset 0 -4px 6px rgba(0,0,0,0.2)', // 3D effect
      }}
    />
  );
}
