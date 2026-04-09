import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Smile, Meh, Frown, Zap, Coffee, Moon, Sun, Sparkles, Brain, Target, MessageSquare } from 'lucide-react';
import { useUI } from '../../lib/state';
import { Tooltip } from '../Tooltip';

const MOODS: { id: 'great' | 'good' | 'neutral' | 'tired' | 'stressed' | 'overwhelmed'; icon: any; label: string; color: string; suggestion: string; }[] = [
  { id: 'great', icon: Smile, label: 'Great', color: '#00f3ff', suggestion: "You're in the flow! Use this momentum for high-impact tasks." },
  { id: 'good', icon: Zap, label: 'Productive', color: '#4ade80', suggestion: "Solid energy. Focus on clearing your priority list." },
  { id: 'tired', icon: Coffee, label: 'Tired', color: '#fbbf24', suggestion: "Take a 15-minute break. Your brain needs a recharge." },
  { id: 'stressed', icon: Frown, label: 'Stressed', color: '#f87171', suggestion: "Breathe. Let's break down one big task into three tiny ones." },
  { id: 'overwhelmed', icon: Brain, label: 'Overwhelmed', color: '#a78bfa', suggestion: "Step away from the screen. A short walk will clear the fog." },
];

export const FounderHealthCheck: React.FC = () => {
  const { founderMood, setFounderMood } = useUI();
  const [showSuggestions, setShowSuggestions] = useState(false);

  const currentMood = MOODS.find(m => m.id === founderMood);

  return (
    <div className="founder-health-container" style={{
      padding: '16px',
      backgroundColor: 'rgba(255,255,255,0.03)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.05)',
      marginBottom: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Heart size={14} color="#ff4444" />
        <span style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Founder Health</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '16px' }}>
        {MOODS.map((mood) => {
          const Icon = mood.icon;
          const isActive = founderMood === mood.id;
          return (
            <Tooltip key={mood.id} content={mood.label}>
              <button
                onClick={() => {
                  setFounderMood(mood.id);
                  setShowSuggestions(true);
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: '1px solid',
                  borderColor: isActive ? mood.color : 'rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={18} color={isActive ? mood.color : 'rgba(255,255,255,0.4)'} />
              </button>
            </Tooltip>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {currentMood && (
          <motion.div
            key={currentMood.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              padding: '12px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              borderLeft: `3px solid ${currentMood.color}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Sparkles size={12} color={currentMood.color} />
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: currentMood.color }}>CO-FOUNDER NOTE</span>
            </div>
            <p style={{ fontSize: '12px', lineHeight: '1.4', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
              {currentMood.suggestion}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {!founderMood && (
        <div style={{ textAlign: 'center', padding: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
          How are you feeling today, Founder?
        </div>
      )}
    </div>
  );
};
