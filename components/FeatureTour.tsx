import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, ArrowLeft, Zap, Info } from 'lucide-react';
import { createPortal } from 'react-dom';

interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    target: '[data-tour="nav-strategy"]',
    title: "STRATEGY_CORE",
    content: "This is where you dump your thoughts. Inklo's deep reasoning engine starts here.",
    side: 'bottom'
  },
  {
    target: '[data-tour="founder-stream"]',
    title: "FOUNDER_STREAM",
    content: "High-bandwidth thought capture. Type or use the Mic to feed your brain-dump into the engine.",
    side: 'right'
  },
  {
    target: '[data-tour="run-strategy"]',
    title: "EXECUTION_GATE",
    content: "Hit this to trigger Inklo's contextual reasoning modules over your raw input.",
    side: 'left'
  },
  {
    target: '[data-tour="notebook-area"]',
    title: "THE_NOTEBOOK",
    content: "Your refined strategy manifests here. Fully editable and grounded in your identity core.",
    side: 'top'
  },
  {
    target: '[data-tour="nav-keynote"]',
    title: "POLISH_PROTOCOL",
    content: "Once analyzed, move here to refine tone and prepare for external sharing.",
    side: 'bottom'
  }
];

interface FeatureTourProps {
  onComplete: () => void;
}

const FeatureTour = ({ onComplete }: FeatureTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const step = tourSteps[currentStep];

  useEffect(() => {
    const updateCoords = () => {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateCoords();
    window.addEventListener('resize', updateCoords);
    return () => window.removeEventListener('resize', updateCoords);
  }, [step]);

  const next = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const prev = () => {
     if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] pointer-events-none">
      {/* SCOPE HIGHLIGHT */}
      <motion.div 
        animate={{ 
          top: coords.top - 8, 
          left: coords.left - 8, 
          width: coords.width + 16, 
          height: coords.height + 16 
        }}
        className="absolute border-4 border-neo-pink bg-neo-pink/10 neo-shadow-sm z-0 pointer-events-none"
      />

      {/* OVERLAY CUTOUT EFFECT (Simulated by 4 rects) */}
      <div className="absolute inset-0 bg-neo-black/40 backdrop-blur-[2px] pointer-events-auto" onClick={(e) => e.stopPropagation()} />

      {/* TOOLTIP CARD */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          top: coords.top + coords.height + 24,
          left: Math.max(20, Math.min(window.innerWidth - 340, coords.left + (coords.width/2) - 160))
        }}
        className="absolute w-80 bg-white border-4 border-neo-black p-6 neo-shadow-lg z-1 pointer-events-auto"
      >
        <div className="flex items-center gap-2 mb-4">
           <div className="bg-neo-black text-neo-white px-2 py-1 font-mono text-[10px]">
             STEP_{currentStep + 1}/{tourSteps.length}
           </div>
           <Zap size={14} className="text-neo-pink animate-pulse" />
        </div>

        <h3 className="text-xl font-black uppercase mb-2 tracking-tighter">
          {step.title}
        </h3>
        
        <p className="text-sm font-bold text-zinc-600 mb-6 leading-tight">
          {step.content}
        </p>

        <div className="flex justify-between items-center">
          <button 
            onClick={prev}
            disabled={currentStep === 0}
            className="p-2 border-2 border-neo-black hover:bg-zinc-100 disabled:opacity-0 transition-all font-black text-[10px]"
          >
            <ArrowLeft size={16} />
          </button>
          
          <div className="flex gap-4 items-center">
            <button 
              onClick={onComplete}
              className="text-[10px] font-black underline uppercase hover:text-neo-pink"
            >
              Skip
            </button>
            <button
              onClick={next}
              className="bg-neo-black text-neo-white px-4 py-2 font-black text-[10px] flex items-center gap-2 neo-shadow-hover active:translate-y-1 active:shadow-none"
            >
              {currentStep === tourSteps.length - 1 ? 'FINISH' : 'NEXT'}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Pointer Arrow */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-l-4 border-t-4 border-neo-black rotate-45" />
      </motion.div>
    </div>,
    document.body
  );
};

export default FeatureTour;
