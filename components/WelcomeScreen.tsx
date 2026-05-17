import React from 'react';
import { motion } from 'motion/react';
import { Rocket, Sparkles, Brain, Mic, MessageSquare } from 'lucide-react';
import Inklo from './Inklo';

const WelcomeScreen = () => {
  const cards = [
    {
      title: 'FOUNDER STRATEGY',
      description: 'Battle-tested frameworks for early-stage visionaries. No fluff, just leverage.',
      icon: <Brain size={48} className="text-neo-pink" />,
      color: 'bg-neo-cyan'
    },
    {
      title: 'INKLO INTELLIGENCE',
      description: 'Access the latest market data and trends instantly. Grounded AI for real-world wins.',
      icon: <Inklo />,
      color: 'bg-neo-lime'
    },
    {
      title: 'VOICE_LINK',
      description: 'High-bandwidth streaming for your thoughts. Capture the vision as it happens.',
      icon: <div className="flex gap-2 text-neo-black"><Mic size={32} /><MessageSquare size={32} /></div>,
      color: 'bg-neo-pink'
    }
  ];

  return (
    <div className="flex flex-col items-center py-12">
      <motion.div 
        initial={{ rotate: -5, scale: 0.9, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        className="bg-neo-yellow border-4 border-neo-black p-8 neo-shadow-lg mb-16 text-center max-w-2xl transform rotate-1 relative"
      >
        <div className="absolute -top-12 -right-8">
           <Inklo />
        </div>
        <Rocket className="w-16 h-16 mx-auto mb-4 text-neo-black" />
        <h1 className="text-6xl font-black tracking-tighter mb-4 uppercase">SOLOSCRIBE CORE</h1>
        <p className="text-xl font-bold uppercase tracking-widest text-neo-black leading-none">
          SYSTEM_ACCESS: GRANTED <br />
          VERSION: 5.0.0_INKLO
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        {cards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`${card.color} border-4 border-neo-black p-6 neo-shadow-hover transition-all cursor-pointer`}
          >
            <div className="mb-6">{card.icon}</div>
            <h3 className="text-2xl font-black mb-2">{card.title}</h3>
            <p className="font-bold text-sm leading-tight">{card.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-16 bg-white border-4 border-neo-black p-6 neo-shadow max-w-xl text-center">
         <p className="font-mono text-xs font-bold text-zinc-500 uppercase">
           [SECURITY_NOTICE]
           <br />
           ALL DATA ENCRYPTED BY INKLO_PROTOCOLS. YOUR STRATEGY IS SOVEREIGN.
         </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
