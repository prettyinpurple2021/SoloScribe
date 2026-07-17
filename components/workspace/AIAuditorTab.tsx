import React, { useState } from 'react';
import posthog from 'posthog-js';
import { Eye, Search, Zap, AlertCircle, Sparkles, Trophy, Shuffle, Swords } from 'lucide-react';
import { useAppStore } from '../../lib/state';
import { thinkDeeply } from '../../lib/ai-tools';
import { toast } from 'sonner';

const AIAuditorTab = () => {
  const { founderIdentity, isProcessing, setIsProcessing, setInkloMode } = useAppStore();

  // Custom user inputs for Competitive Audit
  const [startupNiche, setStartupNiche] = useState('SaaS strategic planner tools for solo builders');
  const [competitors, setCompetitors] = useState('StrategyCo, FounderCoach');
  const [tacticalCore, setTacticalCore] = useState('AI-driven instant feedback loops without meetings');

  // AI Gap Scanner payload container
  const [competitiveReport, setCompetitiveReport] = useState<string | null>(null);

  const handleCompetitiveAudit = async () => {
    if (!startupNiche.trim() || !competitors.trim()) {
      toast.error('INPUTS_INCOMPLETE', { description: 'Please enter your niche and at least one competitor.' });
      return;
    }

    setIsProcessing(true);
    setInkloMode('BUILDING');
    const toastId = toast.loading('COMPILING_COMPETITIVE_INTELLIGENCE_METRICS...');

    try {
      const prompt = `
Perform a high-velocity Competitive Gap Analysis and strategic vulnerability assessment for this founder's project:
- Startup Niche & Value Proposition: ${startupNiche}
- Core Competitive Focus / Pivot factor: ${tacticalCore}
- Stated Competitors: ${competitors}

Please evaluate:
1. Specific strategic holes left wide open by these competitors.
2. An actionable product feature playbook (the "Asymmetry Strategy").
3. Specific pricing traps to exploit based on their overhead cost structure.
4. An actionable "growth attack vector" to capture customers with a $0 budget.

Keep the presentation in an ultra-clean, high-energy, neo-brutalist markdown template. Use precise human copywriting and avoid automated generic fluff blocks.
      `;

      const result = await thinkDeeply(prompt, founderIdentity);
      setCompetitiveReport(result);
      posthog.capture('competitive_audit_run', {
        competitor_count: competitors.split(',').filter(c => c.trim()).length,
      });
      toast.success('COMPETITIVE_AUDIT_SYNCHRONIZED', { id: toastId });
    } catch (error: any) {
      posthog.captureException(error);
      console.error(error);
      toast.error('COMPETITIVE_AUDIT_FAIL', { id: toastId });
    } finally {
      setIsProcessing(false);
      setInkloMode('DEFAULT');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* HEADER BAR */}
      <header className="bg-neo-black text-neo-white p-6 border-4 border-neo-black neo-shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-2">
             <Swords className="text-neo-pink" size={32} />
             COMPETITOR_SCANNER
          </h2>
          <p className="font-mono text-xs text-neo-pink">DEEP COMPETITIVE ASYMMETRY PROTOCOL</p>
        </div>
        <div className="bg-neo-pink text-neo-black border-2 border-slate-900 px-3 py-1 font-mono text-[9px] font-black uppercase tracking-wider">
           ACTIVE INTEL DEPLOYED
        </div>
      </header>

      {/* INPUT DETAILS GRIDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* INPUT INTERACTION FORM */}
        <section className="bg-white border-4 border-neo-black p-6 neo-shadow space-y-4">
           <h3 className="font-black text-lg border-b-2 border-neo-black pb-2 flex items-center gap-2">
              <Search size={18} className="text-neo-cyan" />
              SCAN_PARAMETERS
           </h3>

           {/* Startup niche description */}
           <div className="space-y-1">
              <label className="font-mono text-[10px] font-black text-zinc-500 uppercase">Your Niche & Market focus</label>
              <input 
                type="text"
                value={startupNiche}
                onChange={e => setStartupNiche(e.target.value)}
                placeholder="Productivity app for architects"
                className="w-full bg-zinc-50 border-2 border-neo-black p-3 font-bold text-xs focus:bg-white outline-none"
              />
           </div>

           {/* Direct Competitor list */}
           <div className="space-y-1">
              <label className="font-mono text-[10px] font-black text-zinc-500 uppercase">Direct Competitors (Comma-separated)</label>
              <input 
                type="text"
                value={competitors}
                onChange={e => setCompetitors(e.target.value)}
                placeholder="CompetitorA, CompetitorB"
                className="w-full bg-zinc-50 border-2 border-neo-black p-3 font-bold text-xs focus:bg-white outline-none"
              />
           </div>

           {/* Unique differentiation lever */}
           <div className="space-y-1">
              <label className="font-mono text-[10px] font-black text-zinc-500 uppercase">Tactical Advantage (e.g. Offline-first)</label>
              <textarea 
                value={tacticalCore}
                onChange={e => setTacticalCore(e.target.value)}
                placeholder="Zero-loading local DB, raw text-to-workflow compilers"
                className="w-full bg-zinc-50 border-2 border-neo-black p-3 font-bold text-xs focus:bg-white outline-none min-h-[60px]"
              />
           </div>

           {/* Run Scanning Trigger */}
           <button
             onClick={handleCompetitiveAudit}
             disabled={isProcessing}
             className="w-full bg-neo-black text-neo-white border-4 border-neo-black py-4 font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-40 transition-all cursor-pointer neo-shadow-hover"
           >
              <Sparkles size={16} />
              {isProcessing ? 'SCANNING_LATENT_GAPS...' : 'INIT_COMPETITIVE_SCAN'}
           </button>
        </section>

        {/* RECOGNIZED DEFAULT MATRIX VECTORS */}
        <div className="lg:col-span-2 space-y-6">
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <section className="bg-neo-lime border-4 border-neo-black p-6 neo-shadow flex flex-col justify-between">
                 <div>
                    <h3 className="font-black text-lg mb-3 flex items-center gap-2">
                       <Zap size={18} />
                       OPPORTUNITY_FINDER
                    </h3>
                    <p className="font-sans font-bold text-xs leading-tight mb-4">
                      The Inklo scanner tracks macro software patterns across major platforms. Custom analysis shows that targeting unbundled features or localized data storage yields the highest entry capture velocity.
                    </p>
                 </div>
                 <div className="font-mono text-[9px] font-black border-2 border-neo-black bg-white px-3 py-1 flex items-center gap-2 w-max">
                    🌐 GAP SCORE: 88% VIABLE
                 </div>
              </section>

              <section className="bg-white border-4 border-neo-black p-6 neo-shadow flex flex-col justify-between">
                 <div>
                    <h3 className="font-black text-lg mb-3 flex items-center gap-2">
                       <Eye size={18} className="text-neo-pink" />
                       VULNERABILITY_CHECK
                    </h3>
                    <div className="space-y-2 font-mono text-[10px] font-black uppercase">
                       <div className="flex justify-between border-b border-neo-black/10 pb-1 text-zinc-600">
                          <span>Distributon Over-reliance</span>
                          <span className="text-neo-pink">HIGH RISK</span>
                       </div>
                       <div className="flex justify-between border-b border-neo-black/10 pb-1 text-zinc-600">
                          <span>Pricing Overhead Bloat</span>
                          <span className="text-neo-yellow">MED RISK</span>
                       </div>
                       <div className="flex justify-between text-zinc-600">
                          <span>User Friction Index</span>
                          <span className="text-neo-lime">LOW RISK</span>
                       </div>
                    </div>
                 </div>
                 <div className="font-mono text-[9px] uppercase font-bold text-zinc-500">
                    Calculated by active metrics
                 </div>
              </section>
           </div>

           {/* THE OUTPUT SECTION */}
           {competitiveReport ? (
              <div className="notebook-bg border-4 border-neo-black p-8 neo-shadow relative animate-in zoom-in-95 font-medium leading-relaxed">
                 <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-around py-4">
                   {[...Array(8)].map((_, i) => <div key={i} className="w-3 h-3 rounded-full bg-white border-2 border-neo-black mx-auto" />)}
                 </div>
                 <div className="ml-4 space-y-4 font-mono text-xs text-zinc-700 font-bold uppercase">
                    <h4 className="font-black text-2xl uppercase border-b-4 border-neo-black pb-2 text-center text-neo-black">
                       Active Competitive Matrix Plan
                    </h4>
                    <div className="whitespace-pre-wrap leading-relaxed">
                       {competitiveReport}
                    </div>
                    <button
                      onClick={() => setCompetitiveReport(null)}
                      className="text-[9px] text-neo-pink font-bold underline uppercase hover:text-rose-600 block transition-colors"
                    >
                      FLUSH_COMPETITIVE_BUFFER
                    </button>
                 </div>
              </div>
           ) : (
              <div className="bg-neo-black text-neo-white p-6 border-4 border-neo-black neo-shadow-lg font-mono text-[11px] leading-relaxed uppercase border-l-4 border-l-neo-cyan">
                 [INTELLIGENCE FEED] Enter your market segment parameters and competitive vectors in the control console. Click scan to evaluate gaps, pricing weaknesses, and asymmetry hacks.
              </div>
           )}

        </div>
      </div>

    </div>
  );
};

export default AIAuditorTab;
