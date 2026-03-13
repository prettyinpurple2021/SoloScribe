/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { motion } from 'motion/react';

const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const MinutesLoadingAnimation = () => {
  const columns = 12;
  const rows = 3;

  return (
    <div className="flex flex-col items-center justify-center p-12 w-full h-full min-h-[400px] bg-white/50 backdrop-blur-sm rounded-xl">
      <div className="relative w-full max-w-lg h-48 flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 400 120" className="w-full h-full">
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--theme-accent)" stopOpacity="0.2" />
              <stop offset="50%" stopColor="var(--theme-accent)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--theme-accent)" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {Array.from({ length: columns }).map((_, i) => (
            Array.from({ length: rows }).map((_, j) => {
              const char = CHARS[(i * 7 + j * 3) % CHARS.length];
              const x = (i / (columns - 1)) * 340 + 30;
              const yBase = 60;
              const delay = i * 0.15 + j * 0.3;
              
              return (
                <motion.text
                  key={`${i}-${j}`}
                  x={x}
                  y={yBase}
                  fontSize={14 - j * 2}
                  fontWeight="600"
                  fill="var(--theme-accent)"
                  textAnchor="middle"
                  initial={{ y: yBase, opacity: 0.2 }}
                  animate={{ 
                    y: [yBase - 25, yBase + 25, yBase - 25],
                    opacity: [0.2, 1, 0.2],
                    scale: [0.8, 1.2, 0.8],
                    rotate: [-10, 10, -10]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: delay,
                    ease: "easeInOut"
                  }}
                  style={{ filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.1))' }}
                >
                  {char}
                </motion.text>
              );
            })
          ))}
          
          {/* Oscillating background wave */}
          <motion.path
            d="M 0 60 Q 100 10 200 60 T 400 60"
            fill="none"
            stroke="url(#waveGradient)"
            strokeWidth="2"
            strokeDasharray="5,5"
            animate={{
              d: [
                "M 0 60 Q 100 10 200 60 T 400 60",
                "M 0 60 Q 100 110 200 60 T 400 60",
                "M 0 60 Q 100 10 200 60 T 400 60"
              ],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </svg>
      </div>
      
      <div className="mt-12 text-center max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-xl font-bold text-gray-800 tracking-tight">
            Analyzing ...
          </h3>
          
          <div className="mt-8 flex items-center justify-center gap-2">
            <motion.div 
              className="w-2 h-2 rounded-full bg-blue-500"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
            />
            <motion.div 
              className="w-2 h-2 rounded-full bg-blue-500"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div 
              className="w-2 h-2 rounded-full bg-blue-500"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};
