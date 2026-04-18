/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { RefObject, MutableRefObject, useRef, useEffect } from 'react';

type BasicFaceProps = {
  /** The canvas element on which to render the face (unused in SVG version). */
  canvasRef?: RefObject<HTMLCanvasElement | null>;
  /** The radius of the face. */
  radius?: number;
  /** The color of the face (unused in SVG version). */
  color?: string;
  /** Whether the agent is currently talking. */
  isTalking: boolean;
  /** Ref to the current audio output volume. Used to drive lip-sync. */
  volumeRef?: MutableRefObject<number>;
};

/**
 * A component that renders a high-quality 3D vector avatar for InkLo,
 * matching the specific video reference: yellow sphere, thick black glasses, little arms.
 */
export default function BasicFace({
  radius = 50,
  isTalking,
  volumeRef,
}: BasicFaceProps) {
  const mouthRef = useRef<SVGEllipseElement>(null);

  // High-performance DOM lip-syncing loop mapped to real-time audio volume
  useEffect(() => {
    if (!volumeRef) return;
    
    let frameId: number;
    let currentVol = 0;
    
    const animateMouth = () => {
      if (mouthRef.current && volumeRef.current !== undefined) {
        // Raw volume from audio worklet is extremely sensitive; amplify it for definition
        const targetVol = Math.min(Math.max(volumeRef.current * 6, 0), 1);
        
        // Smoothly interpolate towards the target volume to eliminate jittering
        currentVol += (targetVol - currentVol) * 0.25;
        
        // Update raw SVG attributes outside the React rendering tree to hit crisp 60fps
        const rx = 4 + (currentVol * 3);
        const ry = 4 + (currentVol * 8);
        const cy = 68 + (currentVol * 3.5);
        
        mouthRef.current.setAttribute('rx', rx.toFixed(2));
        mouthRef.current.setAttribute('ry', ry.toFixed(2));
        mouthRef.current.setAttribute('cy', cy.toFixed(2));
      }
      frameId = requestAnimationFrame(animateMouth);
    };
    
    frameId = requestAnimationFrame(animateMouth);
    
    return () => cancelAnimationFrame(frameId);
  }, [volumeRef]);
  return (
    <div
      style={{
        width: radius * 2,
        height: radius * 2,
        position: 'relative',
        transform: isTalking ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.1s ease-in-out',
        // Make sure it looks 3D by adding a subtle shadow to the container itself if needed,
        // but the SVG has its own drop-shadow filter.
      }}
    >
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
        <defs>
          <radialGradient id="inkloSphere" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#fffaca" />
            <stop offset="15%" stopColor="#ffe600" />
            <stop offset="60%" stopColor="#d19c00" />
            <stop offset="90%" stopColor="#8a6700" />
            <stop offset="100%" stopColor="#543e00" />
          </radialGradient>
          
          <linearGradient id="lensReflect" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
            <stop offset="25%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.4" />
          </filter>
          
          <filter id="glassesShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.7" />
          </filter>
        </defs>

        {/* Arms */}
        {/* Left Arm */}
        <path d="M 6 55 Q 2 65 6 82" fill="none" stroke="#d19c00" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="6" cy="82" r="2" fill="#d19c00" />
        
        {/* Right Arm */}
        <path d="M 94 55 Q 98 65 94 82" fill="none" stroke="#d19c00" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="94" cy="82" r="2" fill="#d19c00" />

        {/* Body */}
        <circle cx="50" cy="50" r="44" fill="url(#inkloSphere)" filter="url(#shadow)" />

        {/* Eyebrows */}
        <path d="M 26 26 Q 32 22 38 26" fill="none" stroke="#8a6700" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 62 26 Q 68 22 74 26" fill="none" stroke="#8a6700" strokeWidth="2.5" strokeLinecap="round" />

        {/* Eyes */}
        <ellipse cx="32" cy="45" rx="5" ry="8" fill="#111" />
        <circle cx="31" cy="42" r="1.5" fill="#fff" />

        <ellipse cx="68" cy="45" rx="5" ry="8" fill="#111" />
        <circle cx="67" cy="42" r="1.5" fill="#fff" />

        {/* Mouth */}
        <ellipse 
          ref={mouthRef}
          cx="50" 
          cy="68" 
          rx="4" 
          ry="4" 
          fill="#111" 
        />

        {/* Glasses */}
        <g filter="url(#glassesShadow)">
          {/* Left Lens Rim */}
          <rect x="12" y="30" width="34" height="28" rx="8" fill="none" stroke="#111" strokeWidth="6" strokeLinejoin="round" />
          {/* Right Lens Rim */}
          <rect x="54" y="30" width="34" height="28" rx="8" fill="none" stroke="#111" strokeWidth="6" strokeLinejoin="round" />
          {/* Bridge */}
          <path d="M 46 40 L 54 40" fill="none" stroke="#111" strokeWidth="6" strokeLinecap="round" />
          {/* Temples */}
          <path d="M 12 40 Q 6 38 4 34" fill="none" stroke="#111" strokeWidth="5" strokeLinecap="round" />
          <path d="M 88 40 Q 94 38 96 34" fill="none" stroke="#111" strokeWidth="5" strokeLinecap="round" />
        </g>
        
        {/* Lens Reflections */}
        <rect x="15" y="33" width="28" height="22" rx="5" fill="url(#lensReflect)" pointerEvents="none" />
        <rect x="57" y="33" width="28" height="22" rx="5" fill="url(#lensReflect)" pointerEvents="none" />

      </svg>
    </div>
  );
}
