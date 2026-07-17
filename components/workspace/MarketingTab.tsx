import React, { useState } from 'react';
import posthog from 'posthog-js';
import { Target, Users, Share2, MessageCircle, Zap } from 'lucide-react';
import { useAppStore } from '../../lib/state';
import { thinkDeeply } from '../../lib/ai-tools';
import { toast } from 'sonner';

const MarketingTab = () => {
  const { founderIdentity, isProcessing, setIsProcessing, setInkloMode } = useAppStore();
  const [copy, setCopy] = useState<string | null>(null);

  const generateMarketingCopy = async () => {
    setIsProcessing(true);
    setInkloMode('BUILDING');
    try {
      const prompt = `Generate a high-velocity, neo-brutalist marketing campaign copy for this founder's project. Focus on 3 viral channel headlines and a short 100-word elevator pitch that avoids cliches.`;
      const result = await thinkDeeply(prompt, founderIdentity);
      setCopy(result);
      posthog.capture('marketing_copy_generated');
      toast.success('MARKETING_INTEL_SYNCHRONIZED');
    } catch (error) {
      posthog.captureException(error);
      toast.error('GENERATION_FAILURE');
    } finally {
      setIsProcessing(false);
      setInkloMode('DEFAULT');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
      {/* CHANNEL STRATEGY */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-neo-pink text-neo-white p-10 border-4 border-neo-black neo-shadow-lg transform rotate-1">
          <h2 className="text-6xl font-black tracking-tighter mb-6 uppercase leading-none">Market <br/>Domination</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white text-neo-black border-4 border-neo-black p-6 neo-shadow">
               <Share2 className="mb-2 text-neo-pink" />
               <h4 className="font-black uppercase tracking-widest text-sm">Viral Loops</h4>
               <p className="text-xs font-bold leading-tight">Leverage SoloScribe share tokens to drive organic user expansion.</p>
            </div>
            <div className="bg-neo-black text-neo-white border-2 border-neo-white p-6">
               <Target className="mb-2 text-neo-cyan" />
               <h4 className="font-black uppercase tracking-widest text-sm">Target ICP</h4>
               <p className="text-xs font-mono leading-tight">SOLO_FOUNDERS // SERIES_A_CEOS // DESIGN_LEADS</p>
            </div>
          </div>
        </div>

        {copy ? (
          <div className="bg-white border-4 border-neo-black p-8 neo-shadow relative animate-in zoom-in-95">
             <h3 className="font-black text-2xl mb-4 uppercase border-b-4 border-neo-black pb-2 text-neo-pink">Generated_Copy</h3>
             <div className="font-bold text-lg leading-relaxed whitespace-pre-wrap">
               {copy}
             </div>
             <button 
               onClick={() => setCopy(null)}
               className="mt-6 text-[10px] font-mono font-black underline uppercase opacity-50 hover:opacity-100"
             >
               RESET_GEN_BUFFER
             </button>
          </div>
        ) : (
          <div className="notebook-bg border-4 border-neo-black p-8 neo-shadow">
            <h3 className="font-black text-2xl mb-4 uppercase border-b-4 border-neo-black pb-2">Campaign Flow</h3>
            <ul className="space-y-4 font-bold text-lg">
              <li className="flex items-center gap-4"><div className="w-6 h-6 bg-neo-black text-white flex items-center justify-center text-[10px]">1</div> Awareness Stage: Inklo Intelligence Teasers</li>
              <li className="flex items-center gap-4"><div className="w-6 h-6 bg-neo-black text-white flex items-center justify-center text-[10px]">2</div> Conversion Stage: Keynote Strategy Demos</li>
              <li className="flex items-center gap-4"><div className="w-6 h-6 bg-neo-black text-white flex items-center justify-center text-[10px]">3</div> Retention: Weekly Founder Performance Audits</li>
            </ul>
          </div>
        )}
      </div>

      {/* AUDIENCE INSIGHTS */}
      <div className="bg-neo-cyan border-4 border-neo-black p-8 neo-shadow-lg flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b-4 border-neo-black pb-4">
           <Users className="text-neo-black" size={32} />
           <h3 className="font-black text-2xl uppercase tracking-tighter">Audience</h3>
        </div>
        <div className="flex-1 bg-white border-2 border-neo-black p-4 font-mono text-[10px] uppercase font-bold overflow-y-auto">
          [SENTIMENT_ANALYSIS]
          <br/><br/>
          &gt; High demand for "Leverage"
          <br/>
          &gt; Skepticism towards "Boilerplate"
          <br/>
          &gt; Deep desire for "Inklo_Net" connectivity
          <br/><br/>
          [HOT_KEYWORDS]
          <br/>
          #SOLO_POWER #INKLO_DRIVE #STRATEGY_CORE
        </div>
        <button 
          onClick={generateMarketingCopy}
          disabled={isProcessing}
          className="bg-neo-black text-neo-white py-4 font-black uppercase tracking-widest neo-shadow-hover flex items-center justify-center gap-2 disabled:bg-zinc-700"
        >
           {isProcessing ? <Zap className="animate-spin text-neo-yellow" /> : <MessageCircle size={20} />}
           {isProcessing ? 'GENERATING...' : 'GENERATE_COPY'}
        </button>
      </div>
    </div>
  );
};

export default MarketingTab;
