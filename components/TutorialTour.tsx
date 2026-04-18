import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUI } from '../lib/state';
import { ChevronRight, ChevronLeft, X, Sparkles, MessageSquare, Edit3, Layout, Folder, Settings } from 'lucide-react';

const TUTORIAL_STEPS = [
  {
    targetId: null,
    title: 'Welcome to SoloScribe',
    description: 'Let\'s take a quick tour of your new AI-powered workspace. We\'ll show you how to collaborate with your co-founder and manage your documents.',
    icon: <Sparkles size={24} />,
    position: 'center'
  },
  {
    targetId: 'tour-avatar',
    title: 'Your AI Co-Founder',
    description: 'This is your AI partner. You can talk to them using voice or text. Drag them anywhere on the screen that feels comfortable.',
    icon: <MessageSquare size={24} />,
    position: 'left'
  },
  {
    targetId: 'tour-editor',
    title: 'Dynamic Document Editor',
    description: 'Your co-founder writes directly into this editor. You can also edit manually at any time. Changes are saved automatically to your project.',
    icon: <Edit3 size={24} />,
    position: 'right'
  },
  {
    targetId: 'tour-view-menu',
    title: 'Specialized Views',
    description: 'Switch between different views like the Roadmap, Tasks, or the new Compliance and Monetization tabs to manage every aspect of your startup.',
    icon: <Layout size={24} />,
    position: 'bottom'
  },
  {
    targetId: 'tour-workspace',
    title: 'Project Workspace',
    description: 'Manage all your startup documents here. Create new projects, rename them, or switch between different business plans.',
    icon: <Folder size={24} />,
    position: 'right'
  },
  {
    targetId: 'tour-settings',
    title: 'System Configuration',
    description: 'Customize your identity, choose your AI agent, and manage your SoloScribe Pro subscription settings here.',
    icon: <Settings size={24} />,
    position: 'bottom'
  }
];

export const TutorialTour: React.FC = () => {
  const { showTutorial, setShowTutorial, tutorialStep, setTutorialStep } = useUI();
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!showTutorial) return;

    const updateHighlight = () => {
      const step = TUTORIAL_STEPS[tutorialStep];
      if (!step.targetId) {
        setHighlightRect(null);
        setTooltipPos({ 
          top: window.innerHeight / 2 - 150, 
          left: window.innerWidth / 2 - 160 
        });
        return;
      }

      const element = document.getElementById(step.targetId);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightRect(rect);

        // Calculate tooltip position
        let top = 0;
        let left = 0;

        switch (step.position) {
          case 'left':
            top = rect.top + rect.height / 2 - 100;
            left = rect.left - 340;
            break;
          case 'right':
            top = rect.top + rect.height / 2 - 100;
            left = rect.right + 20;
            break;
          case 'bottom':
            top = rect.bottom + 20;
            left = rect.left + rect.width / 2 - 160;
            break;
          case 'top':
            top = rect.top - 220;
            left = rect.left + rect.width / 2 - 160;
            break;
          default:
            top = window.innerHeight / 2 - 150;
            left = window.innerWidth / 2 - 160;
        }

        // Keep on screen
        top = Math.max(20, Math.min(top, window.innerHeight - 250));
        left = Math.max(20, Math.min(left, window.innerWidth - 340));

        setTooltipPos({ top, left });
      }
    };

    updateHighlight();
    window.addEventListener('resize', updateHighlight);
    return () => window.removeEventListener('resize', updateHighlight);
  }, [showTutorial, tutorialStep]);

  if (!showTutorial) return null;

  const currentStep = TUTORIAL_STEPS[tutorialStep];

  const handleNext = () => {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setShowTutorial(false);
      setTutorialStep(0);
    }
  };

  const handlePrev = () => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1);
    }
  };

  const handleClose = () => {
    setShowTutorial(false);
    setTutorialStep(0);
  };

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-backdrop" onClick={handleClose} />
      
      <AnimatePresence>
        {highlightRect && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              top: highlightRect.top - 8,
              left: highlightRect.left - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16
            }}
            exit={{ opacity: 0 }}
            className="tutorial-highlight"
          />
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          top: tooltipPos.top,
          left: tooltipPos.left
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="tutorial-tooltip"
      >
        <button className="absolute top-4 right-4 opacity-30 hover:opacity-100" onClick={handleClose}>
          <X size={16} />
        </button>

        <div className="tutorial-tooltip-header">
          {currentStep.icon}
          <span>Step {tutorialStep + 1} of {TUTORIAL_STEPS.length}</span>
        </div>

        <h3 className="tutorial-tooltip-title">{currentStep.title}</h3>
        <p className="tutorial-tooltip-description">{currentStep.description}</p>

        <div className="tutorial-tooltip-actions">
          <div className="tutorial-step-indicator">
            {tutorialStep + 1} / {TUTORIAL_STEPS.length}
          </div>
          
          <div className="flex gap-2">
            {tutorialStep > 0 && (
              <button onClick={handlePrev} className="brutalist-button-outline mini py-1 px-3 text-[10px]">
                <ChevronLeft size={14} /> BACK
              </button>
            )}
            <button onClick={handleNext} className="brutalist-button mini py-1 px-4 text-[10px]">
              {tutorialStep === TUTORIAL_STEPS.length - 1 ? 'FINISH' : 'NEXT'} <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
