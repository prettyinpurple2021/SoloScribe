import React, { useState } from 'react';
import posthog from 'posthog-js';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Brain, Sparkles, ArrowRight, X, Mic, Zap } from 'lucide-react';
import Inklo from './Inklo';

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const steps: TutorialStep[] = [
  {
    title: "MEET YOUR AI CO-FOUNDER",
    description: "Welcome back! I'm Inklo, your metallic yellow 3D strategist. I've got my nerdy glasses on and I'm ready to turn your chaos into leverage.",
    icon: <Inklo />,
    color: "bg-neo-cyan"
  },
  {
    title: "HIGH-BANDWIDTH FEED",
    description: "Use the Voice Link or the Founder Stream text area to dump your thoughts. Don't worry about being messy—I thrive in the chaos of early-stage ideas.",
    icon: <Mic size={48} className="text-neo-black" />,
    color: "bg-neo-yellow"
  },
  {
    title: "RUN STRATEGY",
    description: "Hit the 'RUN_STRATEGY' button to activate my deep reasoning module. I'll analyze your input and provide structured, high-leverage outputs.",
    icon: <Zap size={48} className="text-neo-black" />,
    color: "bg-neo-lime"
  },
  {
    title: "THE NOTEBOOK",
    description: "Your strategy lives in the Notebook. Use the polish and save tools to refine the output until it's ready for your board or keynote.",
    icon: <Sparkles size={48} className="text-neo-pink" />,
    color: "bg-neo-pink"
  }
];

interface OnboardingProps {
  onComplete: (startTour: boolean) => void;
}

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      posthog.capture('onboarding_completed', { method: 'finished', started_tour: false });
      onComplete(false); // finish modal, don't start tour
    }
  };

  const startTour = () => {
    posthog.capture('onboarding_completed', { method: 'finished', started_tour: true });
    onComplete(true); // start full tour
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-neo-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, rotate: -2 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        className={`max-w-2xl w-full border-4 border-neo-black ${step.color} p-10 neo-shadow-lg relative overflow-hidden`}
      >
        {/* Decorative Grid Background for Step */}
        <div className="absolute inset-0 opacity-10 pointer-events-none y2k-grid" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div className="p-4 bg-white border-4 border-neo-black neo-shadow transform transition-transform hover:scale-110 cursor-pointer">
              {step.icon}
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="font-mono text-xs font-black bg-neo-black text-white px-2 py-1">
                STEP_{currentStep + 1}/{steps.length}
              </div>
              {currentStep === 0 && (
                <div className="bg-neo-pink text-white text-[10px] font-black px-2 py-1 animate-bounce">
                  NEW_FOUNDER_DETECTED
                </div>
              )}
            </div>
          </div>

          <h2 className="text-5xl font-black tracking-tighter mb-4 uppercase leading-none">
            {step.title}
          </h2>
          
          <p className="text-xl font-bold text-neo-black mb-10 leading-tight">
            {step.description}
          </p>

          {/* Interactive Preview Area */}
          <div className="mb-10 bg-white/30 border-2 border-dashed border-neo-black/40 p-4 rounded-lg flex items-center gap-4">
             <Rocket className="text-neo-black animate-pulse" />
             <div className="flex-1 overflow-hidden">
                <div className="h-2 bg-neo-black/20 mb-2 w-full" />
                <div className="h-2 bg-neo-black/20 w-3/4" />
             </div>
             <motion.div 
               animate={{ x: [0, 10, 0] }}
               transition={{ repeat: Infinity, duration: 1.5 }}
               className="text-[10px] font-mono font-black border-2 border-neo-black p-1"
             >
               INKLO_SCANNING...
             </motion.div>
          </div>

          <div className="flex justify-between items-center gap-4">
            <button
              onClick={() => {
                posthog.capture('onboarding_completed', { method: 'skipped', step_reached: currentStep });
                onComplete(false);
              }}
              className="text-sm font-black underline uppercase hover:text-neo-pink transition-colors"
            >
              Skip All
            </button>
            <div className="flex gap-4">
              {currentStep === steps.length - 1 && (
                <button
                  onClick={startTour}
                  className="group flex items-center gap-3 bg-neo-pink text-neo-white px-8 py-4 font-black transition-all neo-shadow-hover active:translate-y-1 active:shadow-none border-4 border-neo-black"
                >
                  INTERACTIVE_TOUR
                  <Sparkles size={20} className="animate-spin-slow" />
                </button>
              )}
              <button
                onClick={next}
                className="group flex items-center gap-3 bg-neo-black text-neo-white px-8 py-4 font-black transition-all neo-shadow-hover active:translate-y-1 active:shadow-none"
              >
                {currentStep === steps.length - 1 ? 'LAUNCH ENGINE' : 'NEXT STEP'}
                <ArrowRight className="group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Notebook Holes Decoration */}
        <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-around py-4 opacity-50">
           {[...Array(8)].map((_, i) => (
             <div key={i} className="w-3 h-3 rounded-full bg-white border-2 border-neo-black mx-auto" />
           ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
