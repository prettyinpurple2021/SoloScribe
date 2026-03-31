/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { useUI } from '../lib/state';
import { ArrowRight, LogIn, MessageSquare, Volume2, Edit3, Users, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

const ONBOARDING_STEPS = [
  {
    title: 'YOUR AI CO-FOUNDER',
    description: 'SoloScribe is more than a chatbot. It\'s an intelligent partner designed to help solo founders brainstorm, refine ideas, and build business documents.',
    icon: <Sparkles size={64} />,
    color: 'var(--theme-accent)'
  },
  {
    title: 'MULTIMODAL PROTOCOL',
    description: 'Talk to your agent using voice or text. SoloScribe uses the Gemini Live API for low-latency, natural conversations that feel like talking to a real partner.',
    icon: <div className="flex gap-4"><Volume2 size={48} /><MessageSquare size={48} /></div>,
    color: 'var(--theme-accent-secondary)'
  },
  {
    title: 'DYNAMIC ORCHESTRATION',
    description: 'Watch as your agent builds and refines documents in real-time. From business plans to technical specs, your ideas take shape instantly.',
    icon: <Edit3 size={64} />,
    color: 'var(--theme-accent-tertiary)'
  },
  {
    title: 'SPECIALIST SQUAD',
    description: 'Choose from a diverse team of specialist agents, each with their own personality and expertise, to tackle different aspects of your business.',
    icon: <Users size={64} />,
    color: 'var(--theme-accent)'
  }
];

export default function WelcomeScreen() {
  const { setShowWelcomeScreen, setShowDisclaimer, hasCompletedOnboarding, setHasCompletedOnboarding } = useUI();
  const { user, signIn } = useAuth();
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(-1); // Always start at splash for cinematic impact

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  function handleClose() {
    setIsExiting(true);
    setHasCompletedOnboarding(true);
    setTimeout(() => {
      setShowWelcomeScreen(false);
      setShowDisclaimer(true);
    }, 800);
  }

  const nextStep = () => {
    if (step < ONBOARDING_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      if (user) {
        handleClose();
      } else {
        setStep(-1);
      }
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      setStep(-1);
    }
  };

  const skipOnboarding = () => {
    if (user) {
      handleClose();
    } else {
      setStep(-1);
    }
  };

  return (
    <div
      className={`welcome-screen-shroud ${isVisible ? 'visible' : ''} ${
        isExiting ? 'exiting' : ''
      }`}
    >
      <div className="grid-overlay" />
      
      <div className="welcome-screen">
        <AnimatePresence mode="wait">
          {step === -1 ? (
            <motion.div 
              key="splash"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="welcome-content"
            >
              <div className="welcome-meta-label">SYSTEM_INITIALIZATION_v5.5 // CORE_OS</div>
              <h1 className="welcome-title-massive">SoloScribe</h1>
              <p className="welcome-subtitle-editorial">THE_NEXT_GENERATION_OF_SOLO_FOUNDER_ORCHESTRATION</p>

              <div className="action-zone">
                {user ? (
                  <div className="flex flex-col gap-6 items-center">
                    <button onClick={() => setStep(0)} className="brutalist-button-massive">
                      <span>INITIALIZE_ONBOARDING</span>
                      <ChevronRight size={24} />
                    </button>
                    <button onClick={handleClose} className="bypass-link">
                      BYPASS_TO_SESSION
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 items-center">
                    <button onClick={signIn} className="brutalist-button-massive">
                      <LogIn size={24} />
                      <span>AUTHENTICATE_WITH_GOOGLE</span>
                    </button>
                    <p className="auth-notice">
                      ACTIVE AUTHENTICATION REQUIRED FOR SYSTEM ACCESS
                    </p>
                  </div>
                )}
              </div>

              <div className="welcome-footer-meta">
                <span>v2.4.0_STABLE</span>
                <span className="mx-4">|</span>
                <span>ENCRYPTION_ACTIVE</span>
                <span className="mx-4">|</span>
                <span>GEMINI_3.1_PRO</span>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key={`step-${step}`}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="onboarding-card-editorial"
            >
              <div className="onboarding-layout">
                <div className="onboarding-visual">
                  <div 
                    className="onboarding-icon-massive"
                    style={{ color: ONBOARDING_STEPS[step].color, filter: `drop-shadow(0 0 20px ${ONBOARDING_STEPS[step].color}44)` }}
                  >
                    {ONBOARDING_STEPS[step].icon}
                  </div>
                  <div className="step-number">0{step + 1}</div>
                </div>
                
                <div className="onboarding-text">
                  <div className="meta-label">MODULE_0{step + 1} // {ONBOARDING_STEPS[step].title}</div>
                  <h2 className="onboarding-title">{ONBOARDING_STEPS[step].title}</h2>
                  <p className="onboarding-description">
                    {ONBOARDING_STEPS[step].description}
                  </p>
                  
                  <div className="onboarding-progress">
                    {ONBOARDING_STEPS.map((_, i) => (
                      <div 
                        key={i}
                        className={`progress-dot ${i === step ? 'active' : ''}`}
                        style={{ 
                          backgroundColor: i === step ? ONBOARDING_STEPS[step].color : 'rgba(255,255,255,0.05)',
                          boxShadow: i === step ? `0 0 10px ${ONBOARDING_STEPS[step].color}` : 'none'
                        }}
                      />
                    ))}
                  </div>

                  <div className="onboarding-actions">
                    <button onClick={prevStep} className="brutalist-button-outline">
                      <ChevronLeft size={20} />
                      <span>BACK</span>
                    </button>
                    
                    <button 
                      onClick={nextStep}
                      className="brutalist-button"
                      style={{ backgroundColor: ONBOARDING_STEPS[step].color, color: '#000' }}
                    >
                      <span>{step === ONBOARDING_STEPS.length - 1 ? 'INITIALIZE' : 'NEXT'}</span>
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </div>

              <button onClick={skipOnboarding} className="bypass-btn-top">
                BYPASS_ONBOARDING
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

