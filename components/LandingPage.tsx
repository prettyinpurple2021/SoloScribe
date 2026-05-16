import React from 'react';
import { motion } from 'motion/react';
import { Rocket, Sparkles, Brain, Zap, ArrowRight, Disc, Shield, TrendingUp, BarChart3, Globe, MessageSquare } from 'lucide-react';
import Inklo from './Inklo';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage = ({ onStart }: LandingPageProps) => {
  const features = [
    { 
      title: 'STRATEGY_ENGINE', 
      desc: 'Turn raw founder thoughts into battle-tested frameworks instantly.', 
      icon: <Brain className="text-neo-pink" /> 
    },
    { 
      title: 'KEYNOTE_MODULE', 
      desc: 'Refine analysis into board-ready decks and high-impact pitch narratives.', 
      icon: <Sparkles className="text-neo-cyan" /> 
    },
    { 
      title: 'REVENUE_PROJECTION', 
      desc: 'Simulate growth trajectories and monetization models with AI precision.', 
      icon: <TrendingUp className="text-neo-lime" /> 
    },
    { 
      title: 'COMPLIANCE_SHIELD', 
      desc: 'Automated regulatory and ethical auditing for your market plans.', 
      icon: <Shield className="text-neo-yellow" /> 
    }
  ];

  return (
    <div className="flex flex-col items-center py-12">
      {/* HERO SECTION */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative mb-24 w-full"
      >
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
           <div className="mb-8 scale-150 transform hover:rotate-12 transition-transform cursor-pointer">
              <Inklo />
           </div>
           <div className="bg-neo-cyan border-4 border-neo-black p-8 neo-shadow-lg transform -rotate-2 relative z-10 w-full">
             <h1 className="text-8xl md:text-9xl font-black tracking-tighter leading-none mb-4 uppercase">SOLOSCRIBE</h1>
             <p className="text-xl md:text-3xl font-black uppercase tracking-[0.2em] text-neo-black bg-white/50 inline-block px-4">
               CORE ATTRIBUTE: STRATEGIC_LEVERAGE
             </p>
           </div>
           <div className="absolute top-4 left-4 w-full h-full bg-neo-pink border-4 border-neo-black -z-10 transform rotate-1" />
        </div>
      </motion.div>

      {/* VALUE PROP GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl w-full mb-32 px-6">
        <div className="space-y-8 flex flex-col justify-center">
           <h2 className="text-6xl font-black tracking-tight leading-none uppercase">
             THE CO-FOUNDER <br />
             <span className="bg-neo-yellow px-4 italic">YOU CAN FEED.</span>
           </h2>
           <p className="text-2xl font-bold text-zinc-800 leading-tight max-w-lg">
             Solo founders are drowning in execution. SoloScribe gives you the 
             cognitive space to breathe and the strategic depth to win. 
             Stop generating "content" and start building <span className="underline decoration-neo-pink decoration-4">LEVERAGE.</span>
           </p>
           
           <button 
             onClick={onStart}
             className="group flex items-center gap-4 bg-neo-black text-neo-white px-10 py-6 text-3xl font-black neo-shadow-hover transition-all self-start"
           >
             BOOT_CORE_ENGINE
             <ArrowRight className="group-hover:translate-x-2 transition-transform" />
           </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
           {features.map((f, i) => (
             <motion.div 
               key={f.title}
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: i * 0.1 }}
               className="bg-white border-4 border-neo-black p-6 neo-shadow hover:bg-neo-cyan transition-colors group"
             >
                <div className="mb-4 transform group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h4 className="font-black text-sm mb-2 uppercase tracking-tighter">{f.title}</h4>
                <p className="text-[10px] font-bold leading-tight opacity-70 uppercase">{f.desc}</p>
             </motion.div>
           ))}
        </div>
      </div>

      {/* DETAILED FUNC SECTION */}
      <section className="w-full bg-neo-black text-neo-white py-20 px-6 border-y-8 border-neo-black mb-32">
         <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
               <div className="w-12 h-12 bg-neo-pink border-2 border-white" />
               <h3 className="text-3xl font-black tracking-widest uppercase">INKLO_NET_READY</h3>
               <p className="font-mono text-xs opacity-60">Connected to the global strategic feed. Real-time market auditing at the speed of thought.</p>
            </div>
            <div className="space-y-4">
               <div className="w-12 h-12 bg-neo-lime border-2 border-white" />
               <h3 className="text-3xl font-black tracking-widest uppercase">SOVEREIGN_ID</h3>
               <p className="font-mono text-xs opacity-60">Your data, your strategy. End-to-end encryption for the founder who values privacy as power.</p>
            </div>
            <div className="space-y-4">
               <div className="w-12 h-12 bg-neo-cyan border-2 border-white" />
               <h3 className="text-3xl font-black tracking-widest uppercase">REVENUE_ORBIT</h3>
               <p className="font-mono text-xs opacity-60">Not just text—math. Every strategy is backed by high-fidelity monetization Simulations.</p>
            </div>
         </div>
      </section>

      {/* FINAL CTA */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="bg-neo-yellow border-4 border-neo-black p-12 neo-shadow-lg text-center max-w-3xl transform rotate-1 mb-20"
      >
         <h2 className="text-5xl font-black mb-6 uppercase">READY TO INITIALIZE?</h2>
         <p className="text-xl font-bold mb-8 uppercase tracking-widest">JOIN 5,000+ FOUNDERS ALREADY RUNNING ON INKLOCORE.</p>
         <button 
           onClick={onStart}
           className="bg-neo-black text-neo-white px-12 py-5 text-2xl font-black neo-shadow-hover transition-all"
         >
           GET_ACCESS_NOW
         </button>
      </motion.div>

      <footer className="w-full flex justify-center items-center py-12 border-t-4 border-neo-black gap-8 font-black text-xs uppercase tracking-widest opacity-50">
         <span>© 2026 SOLOSCRIBE_PROTOCOLS</span>
         <span className="hidden md:inline">BY INKLO_SYSTEMS</span>
         <div className="flex gap-4">
            <MessageSquare size={16} />
            <Globe size={16} />
            <Zap size={16} />
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;
