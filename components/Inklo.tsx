import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, AlertCircle, Target, Flame, HardHat, Plus, Crosshair, Brain } from 'lucide-react';
import { useAppStore } from '../lib/state';

const INKLO_QUOTES = [
  "DEPLOYING VALUE ENGINE v5.0!",
  "LTV > 3 * CAC OR WE BOOTSTRAP!",
  "WARNING: MEETINGS ARE VALUE DEBT!",
  "AHA! HIGH-LEVERAGE PIRATE METRICS SYNCED!",
  "SAY NO TO BLOATED VC HEADCOUNTS!",
  "INKLO NETWORK IS 100% OPERATIONAL!",
  "MAXIMIZED FOR INDEPENDENT CASH FLOW!",
  "SAY YES TO CUSTOMER-FUNDED RUNWAY!",
  "PIVOTING IS JUST LEARNING AT HIGH SPEED!",
  "LET'S REDUCE MEETINGS TO ZERO!",
  "COFFEE INTAKE LEVEL: MAXIMUM!"
];

const Inklo = () => {
  const { founderMood, isProcessing, inkloMode } = useAppStore();
  const [pokeCount, setPokeCount] = React.useState(0);
  const [activeQuote, setActiveQuote] = React.useState<string | null>(null);

  const handlePoke = () => {
    setPokeCount(prev => prev + 1);
    const randomQuote = INKLO_QUOTES[Math.floor(Math.random() * INKLO_QUOTES.length)];
    setActiveQuote(randomQuote);
    setTimeout(() => {
      setActiveQuote(curr => curr === randomQuote ? null : curr);
    }, 3000);
  };

  const getMoodConfig = () => {
    switch (founderMood) {
      case 'GOD_MODE':
        return {
          color: 'bg-neo-yellow',
          animation: { y: [0, -25, 0], scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] },
          icon: <Flame className="text-neo-pink absolute -top-4 animate-bounce" />,
          glow: 'shadow-[0_0_40px_rgba(252,211,77,0.6)] border-neo-pink border-4'
        };
      case 'CHAOTIC':
        return {
          color: 'bg-neo-yellow',
          animation: { rotate: [-10, 10, -15, 5, 0], x: [-5, 5, -5] },
          icon: <AlertCircle className="text-neo-pink absolute -top-4 animate-pulse" />,
          glow: 'shadow-[0_0_20px_rgba(255,105,180,0.2)]'
        };
      case 'STRATEGIC':
        return {
          color: 'bg-neo-yellow',
          animation: { y: [0, -15, 0], scale: [1, 1.1, 1] },
          icon: <Brain className="text-neo-lime absolute -top-4" />,
          glow: 'shadow-[0_0_30px_rgba(163,230,53,0.4)]'
        };
       case 'HYPER-FOCUSED':
        return {
          color: 'bg-neo-yellow',
          animation: { scale: [1, 0.95, 1], y: [0, -5, 0] },
          icon: <Target className="text-neo-cyan absolute -top-4" />,
          glow: 'shadow-[0_0_20px_rgba(34,211,238,0.4)]'
        };
      default:
        return {
          color: 'bg-neo-yellow',
          animation: { y: [0, -15, 0], rotate: [-2, 2, -2], scale: [1, 1.05, 1] },
          icon: <Sparkles className="text-neo-yellow/60 absolute -top-2 animate-pulse" />,
          glow: ''
        };
    }
  };

  const config = getMoodConfig();

  const mouthVariants = {
    idle: {
      height: "16px",
      width: "32px",
      borderRadius: "0 0 40px 40px",
      borderBottom: "4px solid #000000",
      backgroundColor: "transparent",
      scaleX: 1,
      scaleY: 1
    },
    processing: {
      height: ["4px", "12px", "4px"],
      width: ["12px", "20px", "12px"],
      borderRadius: "50%",
      backgroundColor: "#000000",
      borderBottom: "0px solid transparent",
      scaleX: 1,
      scaleY: 1
    }
  };

  // ACCESSORY COMPONENT
  const Accessory = () => {
    if (inkloMode === 'DEFAULT' && founderMood === 'GOD_MODE') {
      return (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-[100] transform -rotate-6">
          <div className="bg-neo-yellow border-4 border-neo-black px-2 py-1 neo-shadow-sm text-[7px] font-mono font-black uppercase tracking-widest rounded-md animate-bounce flex items-center gap-1">
            <span>👑</span> GOD_MODE
          </div>
        </div>
      );
    }

    switch (inkloMode) {
      case 'BUILDING':
        return (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-[100] transform -rotate-6">
            <div className="bg-neo-yellow border-4 border-neo-black p-1 neo-shadow-sm rounded-t-full relative">
              <HardHat size={32} className="text-neo-black" />
            </div>
          </div>
        );
      case 'FIXING':
        return (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-[100]">
            <div className="bg-white border-4 border-neo-black w-10 h-8 rounded-t-lg flex items-center justify-center neo-shadow-sm">
               <Plus size={20} className="text-neo-pink font-black" />
            </div>
          </div>
        );
      case 'STRATEGIZING':
        return (
          <div className="absolute top-[35%] right-2 z-[100]">
              <div className="w-8 h-8 rounded-full border-4 border-neo-black bg-neo-lime/30 backdrop-blur-sm neo-shadow-sm" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative group select-none cursor-pointer flex items-center justify-center" onClick={handlePoke}>
      {/* FLOATING SPEECH BUBBLE */}
      <AnimatePresence>
        {activeQuote && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            className="absolute -top-20 left-1/2 -translate-x-1/2 z-[110] bg-white border-4 border-neo-black px-3 py-2 neo-shadow-sm pointer-events-none w-48 text-center"
          >
            <p className="font-mono text-[9px] font-black uppercase leading-tight text-neo-black">
              {activeQuote}
            </p>
            {/* TRIANGLE */}
            <div className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-4 border-b-4 border-neo-black transform rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        animate={config.animation}
        transition={{ 
          repeat: Infinity, 
          duration: founderMood === 'CHAOTIC' ? 0.5 : 2.5, 
          ease: "easeInOut" 
        }}
        className="relative w-32 h-32 flex items-center justify-center p-4"
      >
        {/* SHADOW FOR 3D EFFECT */}
        <motion.div 
          animate={{ scale: [1, 0.8, 1], opacity: [0.2, 0.1, 0.2] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-full blur-xl"
        />

        <Accessory />
        
        {/* THE BODY - METALLIC SPHERE (SPINS AND BOUNCES ON POKE) */}
        <motion.div 
          animate={{ 
            rotate: pokeCount * 360,
            scale: activeQuote ? [1, 0.9, 1.1, 1] : 1
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`w-28 h-28 rounded-full ${config.color} ${config.glow} border-4 border-neo-black relative overflow-hidden transition-colors duration-500 shadow-[inset_-10px_-10px_20px_rgba(0,0,0,0.2),_inset_10px_10px_20px_rgba(255,255,255,0.5)]`}
        >
          {/* METALLIC SHINE */}
          <div className="absolute top-4 left-6 w-10 h-10 bg-white/40 rounded-full blur-sm" />
          <div className="absolute top-2 left-10 w-4 h-4 bg-white/60 rounded-full blur-[2px]" />
          
          {/* EYEBROWS */}
          <motion.div 
             animate={isProcessing ? { y: [-2, 2, -2] } : { y: 0 }}
             transition={{ repeat: Infinity, duration: 0.5 }}
             className="absolute top-6 left-1/2 -translate-x-1/2 w-full flex justify-around px-6 z-30"
          >
             <div className={`w-4 h-1 bg-neo-black rounded-full ${inkloMode === 'STRATEGIZING' ? '-rotate-12 translate-y-1' : ''}`} />
             <div className={`w-4 h-1 bg-neo-black rounded-full ${inkloMode === 'STRATEGIZING' ? 'rotate-12 translate-y-1' : ''}`} />
          </motion.div>

          {/* NERDY GLASSES */}
          <div className="absolute top-[35%] left-1/2 -translate-x-1/2 z-20 flex items-center">
             {/* LEFT LENS */}
             <div className={`w-11 h-11 bg-neo-black rounded-lg p-1 neo-shadow ${founderMood === 'CHAOTIC' ? 'animate-bounce' : ''}`}>
                <div className="w-full h-full bg-sky-200/40 rounded-md border-2 border-neo-black relative overflow-hidden">
                   <div className="absolute top-1 left-1 w-2 h-2 bg-white/80 rounded-full" />
                   {/* EYE */}
                   <motion.div 
                     animate={founderMood === 'CHAOTIC' ? { scale: [1, 1.5, 1] } : isProcessing ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                     transition={{ repeat: isProcessing ? Infinity : 0, duration: 0.3 }}
                     className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-neo-black rounded-full" 
                   />
                </div>
             </div>
             
             {/* BRIDGE */}
             <div className="w-4 h-2 bg-neo-black -mx-1 relative z-30 flex items-center justify-center">
                <div className="w-full h-1 bg-neo-black" />
             </div>

             {/* RIGHT LENS */}
             <div className={`w-11 h-11 bg-neo-black rounded-lg p-1 neo-shadow ${founderMood === 'CHAOTIC' ? 'animate-bounce [animation-delay:0.2s]' : ''}`}>
                <div className="w-full h-full bg-sky-200/40 rounded-md border-2 border-neo-black relative overflow-hidden">
                   <div className="absolute top-1 left-1 w-2 h-2 bg-white/80 rounded-full" />
                   {/* EYE */}
                   <motion.div 
                     animate={founderMood === 'CHAOTIC' ? { scale: [1, 1.5, 1] } : isProcessing ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                     transition={{ repeat: isProcessing ? Infinity : 0, duration: 0.3 }}
                     className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-neo-black rounded-full" 
                   />
                </div>
             </div>
          </div>

          {/* MOUTH - ANIMATED WHEN PROCESSING */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center">
             <motion.div 
               variants={mouthVariants}
               initial="idle"
               animate={isProcessing ? "processing" : "idle"}
               transition={{ 
                 duration: isProcessing ? 0.2 : 0.4,
                 repeat: isProcessing ? Infinity : 0,
                 ease: "easeInOut"
               }}
               className={founderMood === 'GOD_MODE' && !isProcessing ? 'border-neo-white' : ''}
             />
          </div>
          
          {/* BLUSH FOR CUTENESS */}
          <div className="absolute bottom-8 left-4 w-4 h-2 bg-neo-pink/30 rounded-full blur-[2px]" />
          <div className="absolute bottom-8 right-4 w-4 h-2 bg-neo-pink/30 rounded-full blur-[2px]" />
        </motion.div>

        {/* GLASSES ARMS WRAPPING AROUND */}
        <div className="absolute top-[42%] left-1 w-4 h-2 bg-neo-black rounded-full -rotate-12" />
        <div className="absolute top-[42%] right-1 w-4 h-2 bg-neo-black rounded-full rotate-12" />

        {/* HIGHLIGHT FLOATING ELEMENTS */}
        <div className="absolute inset-0 pointer-events-none flex justify-center">
          {!isProcessing && config.icon}
        </div>
      </motion.div>
    </div>
  );
};

export default Inklo;
