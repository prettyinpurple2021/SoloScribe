import React, { useState, useMemo } from 'react';
import { Shield, CheckCircle, AlertTriangle, HelpCircle, RefreshCw, Sparkles, ScrollText, CheckSquare, Square } from 'lucide-react';
import { useAppStore } from '../../lib/state';
import { thinkDeeply } from '../../lib/ai-tools';
import { toast } from 'sonner';

const ComplianceTab = () => {
  const { founderIdentity, isProcessing, setIsProcessing, setInkloMode } = useAppStore();

  // Jurisdictions targeting checklist
  const [targetEU, setTargetEU] = useState(true);
  const [targetCA, setTargetCA] = useState(false);
  const [targetBR, setTargetBR] = useState(false);

  // Operational capabilities tracking
  const [useTrackers, setUseTrackers] = useState(true);
  const [useAuthEmails, setUseAuthEmails] = useState(true);
  const [useGenerativeAI, setUseGenerativeAI] = useState(true);
  const [useNotionSync, setUseNotionSync] = useState(true);

  // AI advisory report container
  const [advisoryReport, setAdvisoryReport] = useState<string | null>(null);

  // Dynamically calculate compliance rating
  const dynamicRating = useMemo(() => {
    let score = 100;
    const activeRiskFactors = [];

    if (targetEU) {
      if (useTrackers) {
        score -= 15;
        activeRiskFactors.push('EU_GDPR: Direct cookie and browser telemetry tracking without cookie consent manager flag.');
      }
      if (useNotionSync) {
        score -= 10;
        activeRiskFactors.push('EU_GDPR: Cross-border data transfers to third-party automation software (Notion Integration).');
      }
    }

    if (targetCA) {
      if (useTrackers) {
        score -= 10;
        activeRiskFactors.push('US_CCPA: Lack of strict "Do Not Sell My Info" and automated data discovery consent settings.');
      }
    }

    if (useGenerativeAI) {
      score -= 10;
      activeRiskFactors.push('AI_ETHICS: Generated strategizing outputs should be strictly disclosed as AI-assisted under modern standards.');
    }

    if (score < 50) score = 50; // clamp lowest raw score

    let grade = 'EXCELLENT';
    let gradeColor = 'text-neo-lime border-neo-lime bg-neo-lime/10';
    if (score < 90) {
      grade = 'WARNING';
      gradeColor = 'text-neo-yellow border-neo-yellow bg-neo-yellow/10';
    }
    if (score < 75) {
      grade = 'CRITICAL';
      gradeColor = 'text-neo-pink border-neo-pink bg-neo-pink/10';
    }

    return {
      score,
      grade,
      gradeColor,
      activeRiskFactors
    };
  }, [targetEU, targetCA, targetBR, useTrackers, useAuthEmails, useGenerativeAI, useNotionSync]);

  const handleGenerateAdvisory = async () => {
    setIsProcessing(true);
    setInkloMode('FIXING');
    const toastId = toast.loading('COMPILING_REGULATORY_CROSS_BORDER_MAPS...');

    try {
      const activeTargets = [];
      if (targetEU) activeTargets.push('European Union (GDPR)');
      if (targetCA) activeTargets.push('California (CCPA)');
      if (targetBR) activeTargets.push('Brazil (LGPD)');

      const activeOps = [];
      if (useTrackers) activeOps.push('Third-party telemetry/tracking widgets');
      if (useAuthEmails) activeOps.push('Authentication email collection');
      if (useGenerativeAI) activeOps.push('Active Generative AI model capabilities');
      if (useNotionSync) activeOps.push('Dynamic integration data pipeline (Notion Bridge)');

      const prompt = `
Generate an Elite Regulatory Compliance and Privacy Advisory Report for our founder's project:
TARGET JURISDICTIONS: ${activeTargets.join(', ')}
OPERATIONAL DATA PIPELINES: ${activeOps.join(', ')}
CURRENT CORE COMPLIANCE SCAN SCORE: ${dynamicRating.score}%

Please analyze our liabilities, describe terms-of-service items we need to draft immediately, define user privacy rights (e.g. Right to erasure/rectification), and recommend specific technical shielding. Print in a bold, clean, neo-brutalist markdown format. Avoid corporate boilerplate phrases.
      `;

      const result = await thinkDeeply(prompt, founderIdentity);
      setAdvisoryReport(result);
      toast.success('COMPLIANCE_ADVISORY_ISSUED', { id: toastId });
    } catch (error: any) {
      console.error(error);
      toast.error('ADVISORY_COMPILATION_FAIL', { id: toastId });
    } finally {
      setIsProcessing(false);
      setInkloMode('DEFAULT');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* HEADER SECTION */}
      <div className="bg-neo-black text-neo-white p-6 border-4 border-neo-black neo-shadow-lg flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-2">
             <Shield className="text-neo-cyan" size={32} />
             COMPLIANCE_SHIELD
          </h2>
          <p className="font-mono text-[10px] text-neo-cyan font-bold uppercase">AUTOMATED REGULATORY MATRIX ASSESSOR</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="font-mono text-xs font-black uppercase text-zinc-400">Scan Status:</div>
          <div className="bg-neo-lime text-neo-black px-4 py-2 border-2 border-neo-black font-black text-xl">
             {dynamicRating.score}% OK
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* PARAMS CONTROL PANEL */}
        <div className="space-y-6">
          
          {/* TARGET MARKETS */}
          <section className="bg-white border-4 border-neo-black p-6 neo-shadow space-y-4">
            <h3 className="font-extrabold text-sm uppercase border-b-2 border-neo-black pb-1.5 flex items-center gap-2">
               <span>Jurisdictions</span>
            </h3>
            
            <div className="space-y-3 font-mono text-[11px] font-black uppercase">
               <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={targetEU} 
                    onChange={e => setTargetEU(e.target.checked)}
                    className="w-5 h-5 border-2 border-neo-black accent-neo-black focus:outline-none cursor-pointer"
                  />
                  <span>EU Target (GDPR)</span>
               </label>
               <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={targetCA} 
                    onChange={e => setTargetCA(e.target.checked)}
                    className="w-5 h-5 border-2 border-neo-black accent-neo-black focus:outline-none cursor-pointer"
                  />
                  <span>California Target (CCPA)</span>
               </label>
               <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={targetBR} 
                    onChange={e => setTargetBR(e.target.checked)}
                    className="w-5 h-5 border-2 border-neo-black accent-neo-black focus:outline-none cursor-pointer"
                  />
                  <span>Brazil Target (LGPD)</span>
               </label>
            </div>
          </section>

          {/* VENDORS & INTEGRATIONS */}
          <section className="bg-neutral-50 border-4 border-neo-black p-6 neo-shadow space-y-4">
            <h3 className="font-extrabold text-sm uppercase border-b-2 border-neo-black pb-1.5">
               <span>Risk Vectors</span>
            </h3>
            
            <div className="space-y-3 font-mono text-[11px] font-black uppercase">
               <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={useTrackers} 
                    onChange={e => setUseTrackers(e.target.checked)}
                    className="w-5 h-5 border-2 border-neo-black accent-neo-black focus:outline-none cursor-pointer"
                  />
                  <span>Third-Party Trackers</span>
               </label>
               <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={useAuthEmails} 
                    onChange={e => setUseAuthEmails(e.target.checked)}
                    className="w-5 h-5 border-2 border-neo-black accent-neo-black focus:outline-none cursor-pointer"
                  />
                  <span>Auth Email Sync</span>
               </label>
               <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={useGenerativeAI} 
                    onChange={e => setUseGenerativeAI(e.target.checked)}
                    className="w-5 h-5 border-2 border-neo-black accent-neo-black focus:outline-none cursor-pointer"
                  />
                  <span>Generative Content</span>
               </label>
               <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={useNotionSync} 
                    onChange={e => setUseNotionSync(e.target.checked)}
                    className="w-5 h-5 border-2 border-neo-black accent-neo-black focus:outline-none cursor-pointer"
                  />
                  <span>Notion Bridge Pipeline</span>
               </label>
            </div>
          </section>

        </div>

        {/* COMPLIANCE RATING & RISK SCANS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border-4 border-neo-black p-6 neo-shadow">
             <div className="flex justify-between items-center border-b-2 border-neo-black pb-3 mb-4">
                <h3 className="font-black text-lg uppercase flex items-center gap-2">
                   <ScrollText size={20} className="text-neo-pink" />
                   SOVEREIGNTY Risk Evaluation
                </h3>
                <span className={`px-3 py-1 border-2 border-neo-black text-[10px] font-mono font-black uppercase tracking-wider ${dynamicRating.gradeColor}`}>
                   {dynamicRating.grade} State
                </span>
             </div>

             {/* RISK LIST */}
             {dynamicRating.activeRiskFactors.length > 0 ? (
                <div className="space-y-3">
                   {dynamicRating.activeRiskFactors.map((risk, index) => (
                      <div key={index} className="flex gap-3 justify-between bg-zinc-50 border border-zinc-200 p-3 items-start">
                         <AlertTriangle className="text-neo-yellow shrink-0 mt-0.5" size={16} />
                         <span className="font-mono text-[9px] uppercase font-bold text-zinc-600 leading-tight flex-1">
                            {risk}
                         </span>
                      </div>
                   ))}
                </div>
             ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-neo-lime/5 border-2 border-dashed border-neo-lime/30 text-neo-black/60 font-mono text-[10px] space-y-2 uppercase font-black">
                   <CheckCircle className="text-neo-lime" size={32} />
                   <span>No active risk compliance factors detected in current setup.</span>
                </div>
             )}
          </div>
          
          <button
             onClick={handleGenerateAdvisory}
             disabled={isProcessing}
             className="w-full bg-neo-black text-neo-white border-4 border-neo-black py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-zinc-800 transition-all cursor-pointer neo-shadow-hover"
          >
             <Sparkles size={16} />
             {isProcessing ? 'COMPILING_SHIELD_ADVISORY_REPORT...' : 'DISPATCH_COMPLIANCE_ADVISORY'}
          </button>
        </div>

      </div>

      {/* ADVISORY REPORT BLOCK */}
      {advisoryReport && (
         <div className="notebook-bg border-4 border-neo-black p-8 neo-shadow relative animate-in zoom-in-95 leading-relaxed">
            <h3 className="font-black text-2xl uppercase border-b-4 border-neo-black pb-2 text-neo-cyan flex justify-between items-center">
               <span>Strategic_Regulatory_Brief</span>
               <span className="text-xs text-zinc-500 font-mono font-normal uppercase select-none">[0x92f8_AUDIT]</span>
            </h3>
            <div className="font-mono text-xs leading-relaxed whitespace-pre-wrap mt-6 text-zinc-700 font-bold uppercase space-y-4">
               {advisoryReport}
            </div>
            
            <button
               onClick={() => setAdvisoryReport(null)}
               className="mt-6 text-[10px] font-mono font-black underline uppercase text-neo-pink hover:text-rose-600 block transition-colors"
            >
               FLUSH_LOCAL_REGULATORY_BUFFER
            </button>
         </div>
      )}

    </div>
  );
};

export default ComplianceTab;
