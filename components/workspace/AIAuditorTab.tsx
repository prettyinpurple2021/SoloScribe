import React, { useState } from 'react';
import { Eye, Search, Zap, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../lib/state';
import { toast } from 'sonner';

const AIAuditorTab = () => {
  const { isProcessing, setIsProcessing, setInkloMode } = useAppStore();
  
  const handleAudit = () => {
    setIsProcessing(true);
    setInkloMode('FIXING');
    toast.info('DEEP_CLEANING: SCANNING FOR STRATEGY_BLOAT...');
    
    setTimeout(() => {
       setIsProcessing(false);
       setInkloMode('DEFAULT');
       toast.success('AUDIT_COMPLETE: NO_CRITICAL_FAILURES_DETECTED');
    }, 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
      <header className="bg-neo-black text-neo-white p-8 border-4 border-neo-black neo-shadow-lg flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tighter uppercase">AI_AUDIT_ENGINE</h2>
          <p className="font-mono text-xs text-neo-pink">DEEP_SCANNING STRATEGY INTEGRITY...</p>
        </div>
        <button 
          onClick={handleAudit}
          disabled={isProcessing}
          className="bg-neo-pink text-neo-black px-6 py-4 font-black uppercase text-xl neo-shadow-hover disabled:bg-zinc-600"
        >
          {isProcessing ? 'SCANNING...' : 'INIT_AUDIT'}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <section className="bg-white border-4 border-neo-black p-6 neo-shadow hover:-translate-y-1 transition-transform">
            <h3 className="font-black text-xl mb-4 flex items-center gap-2">
               <Eye className="text-neo-cyan" />
               VULNERABILITY_CHECK
            </h3>
            <div className="space-y-4">
               {[
                 { label: 'Market Saturation Risk', level: 'LOW' },
                 { label: 'Technical Debt Projection', level: 'MED' },
                 { label: 'Resource Exhaustion', level: 'HEAVY' },
               ].map(item => (
                 <div key={item.label} className="flex justify-between border-b-2 border-neo-black pb-2 font-bold text-sm">
                    <span>{item.label}</span>
                    <span className={`${item.level === 'LOW' ? 'text-neo-lime' : item.level === 'MED' ? 'text-neo-yellow' : 'text-neo-pink'}`}>
                      {item.level}
                    </span>
                 </div>
               ))}
            </div>
         </section>

         <section className="bg-neo-lime border-4 border-neo-black p-6 neo-shadow">
            <h3 className="font-black text-xl mb-4 flex items-center gap-2">
               <Zap size={20} />
               OPPORTUNITY_FINDER
            </h3>
            <p className="font-sans font-bold leading-tight mb-6">
              The Inklo engine has identified a gap in your 'Marketing' strategy: 
              Hyper-local community targeting is currently underutilized by 92% of your competitors.
            </p>
            <button className="w-full bg-neo-black text-neo-white py-3 font-black uppercase text-xs neo-shadow-hover">
              EXECUTE_PIVOT_ADVICE
            </button>
         </section>
      </div>

      <div className="notebook-bg border-4 border-neo-black p-10 neo-shadow relative">
         <h4 className="font-black text-2xl mb-6 uppercase border-b-4 border-neo-black pb-4 text-center">Founder Audit Report</h4>
         <div className="max-w-2xl mx-auto space-y-4 font-bold text-zinc-600 leading-relaxed italic">
            "The current trajectory is aggressive. Your 'Monetization' logic holds up under stress-testing, but the 'Keynote' needs more emphasis on late-stage scalability to satisfy the Inklo growth model."
         </div>
         <div className="mt-10 flex justify-center">
            <div className="px-6 py-2 bg-neo-black text-white font-mono text-[10px] uppercase">
               SCAN_HASH: 0x9f22...e88b
            </div>
         </div>
         {/* Notebook Holes */}
         <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-around py-4">
           {[...Array(10)].map((_, i) => <div key={i} className="w-3 h-3 rounded-full bg-white border-2 border-neo-black mx-auto" />)}
        </div>
      </div>
    </div>
  );
};

export default AIAuditorTab;
