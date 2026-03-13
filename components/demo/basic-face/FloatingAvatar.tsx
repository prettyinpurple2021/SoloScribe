/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import BasicFace from './BasicFace';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';
import { useAgent, useUI } from '../../../lib/state';
import cn from 'classnames';

// Minimum volume level that indicates audio output is occurring.
const AUDIO_OUTPUT_DETECTION_THRESHOLD = 0.05;

// Amount of delay in milliseconds after audio output stops before the avatar
// is considered "not talking".
const TALKING_STATE_COOLDOWN_MS = 2000;

/**
 * A floating, draggable component that houses the agent's avatar (BasicFace).
 * It reacts to audio output from the Live API to show a "talking" state.
 */
export default function FloatingAvatar() {
  const { volume, connected } = useLiveAPIContext();
  const { current: agent } = useAgent();
  const { agentState } = useUI();
  const [isTalking, setIsTalking] = useState(false);
  const talkingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Detect if the agent is talking based on audio output volume.
  useEffect(() => {
    if (volume > AUDIO_OUTPUT_DETECTION_THRESHOLD) {
      setIsTalking(true);
      if (talkingTimeoutRef.current) {
        clearTimeout(talkingTimeoutRef.current);
      }
      talkingTimeoutRef.current = setTimeout(() => {
        setIsTalking(false);
      }, TALKING_STATE_COOLDOWN_MS);
    }
  }, [volume]);

  const size = 64;

  return (
    <motion.div
      drag
      dragMomentum={false}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95, cursor: 'grabbing' }}
      className={cn('basic-face-container-top', {
        talking: isTalking && connected,
      })}
      style={{
        width: size,
        height: size,
        backgroundColor: agent.bodyColor,
        boxShadow: `0 4px 15px rgba(0,0,0,0.2)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 20,
        left: 'calc(50% - 32px)',
        zIndex: 6000,
      }}
    >
      <div style={{ pointerEvents: 'none' }}>
        <BasicFace
          canvasRef={canvasRef}
          radius={size / 2}
          color={agent.bodyColor}
          isTalking={isTalking && connected}
        />
      </div>
      <AnimatePresence>
        {(agentState || !connected) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            className="face-status-label"
            style={{
              position: 'absolute',
              bottom: '15%',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            {agentState || 'Inactive'}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
