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

const TRANSLITERATIONS = [
  { text: 'Co-founder', lang: 'English' },
  { text: 'Cofundador', lang: 'Spanish' },
  { text: 'Mitgründer', lang: 'German' },
  { text: 'Cofondateur', lang: 'French' },
  { text: 'Сооснователь', lang: 'Russian' },
  { text: '共同創業者', lang: 'Japanese' },
  { text: '联合创始人', lang: 'Chinese' },
  { text: 'شريك مؤسس', lang: 'Arabic' },
  { text: 'सह-संस्थापक', lang: 'Hindi' },
  { text: 'Συνιδρυτής', lang: 'Greek' },
  { text: 'מייסד שותף', lang: 'Hebrew' },
  { text: '공동 창립자', lang: 'Korean' },
  { text: 'Đồng sáng lập', lang: 'Vietnamese' },
  { text: 'ผู้ร่วมก่อตั้ง', lang: 'Thai' },
  { text: 'Mede-oprichter', lang: 'Dutch' },
  { text: 'Medgrundare', lang: 'Swedish' },
  { text: 'Kurucu Ortak', lang: 'Turkish' },
  { text: 'Cofondatore', lang: 'Italian' },
  { text: 'Cofundador', lang: 'Portuguese' },
];

const ONBOARDING_STEPS = [
  {
    title: 'Your AI Co-founder',
    description: 'SoloScribe is more than a chatbot. It\'s an intelligent partner designed to help solo founders brainstorm, refine ideas, and build business documents.',
    icon: <Sparkles size={48} className="text-amber-400" />,
    color: 'var(--theme-accent)'
  },
  {
    title: 'Multimodal Collaboration',
    description: 'Talk to your agent using voice or text. SoloScribe uses the Gemini Live API for low-latency, natural conversations that feel like talking to a real partner.',
    icon: <div className="flex gap-4"><Volume2 size={40} /><MessageSquare size={40} /></div>,
    color: '#60a5fa'
  },
  {
    title: 'Dynamic Documents',
    description: 'Watch as your agent builds and refines documents in real-time. From business plans to technical specs, your ideas take shape instantly.',
    icon: <Edit3 size={48} />,
    color: '#34d399'
  },
  {
    title: 'Specialist Agents',
    description: 'Choose from a diverse team of specialist agents, each with their own personality and expertise, to tackle different aspects of your business.',
    icon: <Users size={48} />,
    color: '#f472b6'
  }
];

export default function WelcomeScreen() {
  const { setShowWelcomeScreen, setShowDisclaimer, hasCompletedOnboarding, setHasCompletedOnboarding } = useUI();
  const { user, signIn } = useAuth();
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(hasCompletedOnboarding ? -1 : 0); // -1 means splash, 0+ means onboarding

  const floatingElements = useMemo(() => {
    return TRANSLITERATIONS.map((item, i) => ({
      ...item,
      id: i,
      top: `${Math.random() * 80 + 10}%`,
      left: `${Math.random() * 80 + 10}%`,
      fontSize: `${Math.random() * 1.5 + 1}rem`,
      delay: `${Math.random() * 5}s`,
      duration: `${Math.random() * 10 + 10}s`,
      opacity: Math.random() * 0.2 + 0.05,
    }));
  }, []);

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
      <div className="floating-container">
        {floatingElements.map((el) => (
          <div
            key={el.id}
            className="floating-text"
            style={{
              top: el.top,
              left: el.left,
              fontSize: el.fontSize,
              animationDelay: el.delay,
              animationDuration: el.duration,
              opacity: el.opacity,
            } as React.CSSProperties}
          >
            {el.text}
          </div>
        ))}
      </div>

      <div className="welcome-screen">
        <AnimatePresence mode="wait">
          {step === -1 ? (
            <motion.div 
              key="splash"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="welcome-content"
            >
              <div className="welcome-header">
                <h1 className="welcome-title">SOLOSCRIBE</h1>
                <p className="welcome-subtitle">
                  Your AI co-founder and ideation partner
                </p>
              </div>

              {user ? (
                <div className="flex flex-col gap-4 items-center">
                  <button onClick={() => setStep(0)} className="start-button glass-button">
                    <span>What's new?</span>
                    <Sparkles size={20} className="ml-2" />
                  </button>
                  <button onClick={handleClose} className="text-sm opacity-60 hover:opacity-100 transition-opacity">
                    Skip to session
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                  <button onClick={signIn} className="start-button glass-button" style={{ backgroundColor: 'var(--theme-accent)', color: '#000' }}>
                    <LogIn size={20} className="arrow-icon" style={{ marginRight: '8px' }} />
                    <span>Sign up / Log in with Google</span>
                  </button>
                  <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '8px' }}>
                    You must be logged in to use Soloscribe.
                  </p>
                </div>
              )}

              <div className="powered-by-gemini welcome-footer">
                <svg
                  className="gemini-star"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"
                    fill="currentColor"
                  />
                </svg>
                <span>Powered by Gemini</span>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key={`step-${step}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="onboarding-card"
              style={{
                maxWidth: '500px',
                padding: '40px',
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '24px'
              }}
            >
              <div 
                className="onboarding-icon-container"
                style={{ 
                  color: ONBOARDING_STEPS[step].color,
                  filter: `drop-shadow(0 0 20px ${ONBOARDING_STEPS[step].color}44)`
                }}
              >
                {ONBOARDING_STEPS[step].icon}
              </div>
              
              <div>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '12px', letterSpacing: '-0.02em' }}>
                  {ONBOARDING_STEPS[step].title}
                </h2>
                <p style={{ fontSize: '1.1rem', opacity: 0.8, lineHeight: 1.6 }}>
                  {ONBOARDING_STEPS[step].description}
                </p>
              </div>

              <div className="flex items-center gap-2 mt-4">
                {ONBOARDING_STEPS.map((_, i) => (
                  <div 
                    key={i}
                    style={{
                      width: i === step ? '24px' : '8px',
                      height: '8px',
                      borderRadius: '4px',
                      backgroundColor: i === step ? ONBOARDING_STEPS[step].color : 'rgba(255, 255, 255, 0.2)',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>

              <div className="flex justify-between w-full mt-8">
                <button 
                  onClick={prevStep}
                  className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft size={20} />
                  <span>Back</span>
                </button>
                
                <button 
                  onClick={nextStep}
                  className="start-button glass-button"
                  style={{ 
                    padding: '12px 24px', 
                    fontSize: '1rem',
                    backgroundColor: ONBOARDING_STEPS[step].color,
                    color: '#000',
                    border: 'none'
                  }}
                >
                  <span>{step === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next'}</span>
                  <ChevronRight size={20} className="ml-2" />
                </button>
              </div>

              <button 
                onClick={skipOnboarding}
                className="absolute top-4 right-6 text-sm opacity-40 hover:opacity-100 transition-opacity"
              >
                Skip
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

