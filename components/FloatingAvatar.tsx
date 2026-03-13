/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import { useAgent, useUI } from '../lib/state';
import BasicFace from './demo/basic-face/BasicFace';
import cn from 'classnames';

// Minimum volume level that indicates audio output is occurring.
const AUDIO_OUTPUT_DETECTION_THRESHOLD = 0.05;

// Amount of delay in milliseconds after audio output stops before the avatar
// is considered "not talking".
const TALKING_STATE_COOLDOWN_MS = 2000;

export default function FloatingAvatar() {
  const { agentState, speechBubbleText, setSpeechBubbleText } = useUI();
  const { current } = useAgent();
  const { volumeRef, connected } = useLiveAPIContext();

  const [isTalking, setIsTalking] = useState(false);
  const [visibleText, setVisibleText] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: -1000, y: -1000 }); // Start off-screen until mount
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const talkingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bubbleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle speech bubble visibility
  useEffect(() => {
    if (speechBubbleText) {
      setVisibleText(speechBubbleText);
      if (bubbleTimeoutRef.current) {
        clearTimeout(bubbleTimeoutRef.current);
      }
      bubbleTimeoutRef.current = setTimeout(() => {
        setVisibleText(null);
        setSpeechBubbleText(null);
      }, 5000);
    }
  }, [speechBubbleText, setSpeechBubbleText]);

  // Set initial position after mount to ensure window.innerWidth is correct
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    // Position it at top-center (or top-center-right on mobile), slightly higher
    setPosition({ 
      x: isMobile ? window.innerWidth / 2 + 40 : window.innerWidth / 2 - 50, 
      y: -15 
    });
  }, []);

  // Handle window resize to keep the avatar on screen
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        // If it's the initial off-screen state, don't do anything yet
        if (prev.x === -1000) return prev;

        const avatarWidth = 100;
        const avatarHeight = 100;

        // Check if the avatar is off-screen
        const isOffScreen = 
          prev.x < -avatarWidth / 2 || 
          prev.x > window.innerWidth - avatarWidth / 2 ||
          prev.y < -avatarHeight || 
          prev.y > window.innerHeight - avatarHeight / 2;

        if (isOffScreen) {
          const isMobile = window.innerWidth < 768;
          // Snap back to top-center (or top-center-right on mobile) if pushed off-screen
          return {
            x: isMobile ? window.innerWidth / 2 + 40 : window.innerWidth / 2 - 50,
            y: -15,
          };
        }

        // Otherwise, just ensure it stays within reasonable bounds
        return {
          x: Math.min(Math.max(0, prev.x), window.innerWidth - avatarWidth),
          y: Math.min(Math.max(0, prev.y), window.innerHeight - avatarHeight),
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Detect if the agent is talking based on audio output volume using a stable loop.
  useEffect(() => {
    let frameId: number;
    const checkTalking = () => {
      if (volumeRef.current > AUDIO_OUTPUT_DETECTION_THRESHOLD) {
        setIsTalking(true);
        if (talkingTimeoutRef.current) {
          clearTimeout(talkingTimeoutRef.current);
        }
        talkingTimeoutRef.current = setTimeout(() => {
          setIsTalking(false);
        }, TALKING_STATE_COOLDOWN_MS);
      }
      frameId = requestAnimationFrame(checkTalking);
    };
    frameId = requestAnimationFrame(checkTalking);
    return () => cancelAnimationFrame(frameId);
  }, [volumeRef]);

  // Handle the start of a drag operation (mouse).
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  }, [position]);

  // Handle the start of a drag operation (touch).
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    dragOffset.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    };
  }, [position]);

  // Global event listeners for dragging.
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        const touch = e.touches[0];
        setPosition({
          x: touch.clientX - dragOffset.current.x,
          y: touch.clientY - dragOffset.current.y,
        });
      }
    };

    const handleMouseUp = () => setIsDragging(false);
    const handleTouchEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  return (
    <div
      className={cn('basic-face-container-top', {
        dragging: isDragging,
        talking: isTalking,
      })}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <BasicFace
        canvasRef={canvasRef}
        radius={50}
        color={current.bodyColor}
        isTalking={isTalking}
      />
      {/* Display the agent's current state (e.g., "Thinking...", "Listening...") or "INACTIVE" if disconnected */}
      {(agentState || !connected) && (
        <div className="face-status-label">{connected ? agentState : 'INACTIVE'}</div>
      )}

      {/* Speech Bubble */}
      {visibleText && (
        <div className="agent-speech-bubble">
          <div className="bubble-content">{visibleText}</div>
          <div className="bubble-arrow"></div>
        </div>
      )}
    </div>
  );
}
