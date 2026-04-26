import React, { useState, useEffect } from 'react';
import { useUI } from '../../lib/state';
import { thinkDeeply } from '../../lib/ai-tools';
import { ShieldAlert, Heart, Loader2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { marked } from 'marked';

export const AIAuditorTab: React.FC = () => {
  const { documentContent } = useUI();
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [healthReport, setHealthReport] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [activeMode, setActiveMode] = useState<'health' | 'advocate'>('health');
  
  const runAudit = async (mode: 'health' | 'advocate') => {
    setIsAuditing(true);
    setActiveMode(mode);
    setHealthReport(null);

    const context = `DOCUMENT CONTENT:\n${documentContent}\n\n`;
    let prompt = '';

    if (mode === 'health') {
      prompt = `${context}Act as a strict Silicon Valley VC and Product Auditor. Analyze the completeness and health of this documentation. 
      1. Give me a "Documentation Health Score" from 0-100.
      2. Identify at least 3 critical missing sections or weaknesses.
      3. Provide 3 actionable steps to reach a score of 90+.
      Format the response and include a prominent line at the top: "HEALTH_SCORE: [number]" followed by the report in Markdown.`;
    } else {
      prompt = `${context}Act as a "Devil's Advocate" and a brutal skeptics strategist. Your goal is to find the logical flaws, unproven assumptions, and market risks in this plan. 
      Don't be polite. Be constructive but critical. List the "Top 5 Risks" and how the founder should attempt to disprove them. 
      Format in Markdown.`;
    }

    try {
      const response = await thinkDeeply(prompt);
      
      if (mode === 'health') {
        const scoreMatch = response.match(/HEALTH_SCORE:\s*(\d+)/);
        if (scoreMatch) {
          setHealthScore(parseInt(scoreMatch[1]));
        }
      }
      setHealthReport(response.replace(/HEALTH_SCORE:\s*\d+/, '').trim());
    } catch (error) {
      setHealthReport('Audit failed. Communication with strategic brain lost.');
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="auditor-tab p-6 font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-display uppercase text-xl">AI_STRATEGY_AUDITOR</h2>
          <p className="text-xs text-white/50 font-mono italic">REAL-TIME RISK & COMPLETENESS ANALYSIS</p>
        </div>
        <div className="flex gap-2">
          <button 
            className={`px-4 py-2 text-xs font-bold border-2 border-black ${activeMode === 'health' ? 'bg-[#00f3ff] text-black shadow-[4px_4px_0px_#000000]' : 'bg-transparent text-white'}`}
            onClick={() => setActiveMode('health')}
          >
            HEALTH_SCORE
          </button>
          <button 
            className={`px-4 py-2 text-xs font-bold border-2 border-black ${activeMode === 'advocate' ? 'bg-[#ff00ff] text-white shadow-[4px_4px_0px_#000000]' : 'bg-transparent text-white'}`}
            onClick={() => setActiveMode('advocate')}
          >
            DEVIL'S_ADVOCATE
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-black/40 border-4 border-black p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-2 left-2 text-[10px] font-mono text-[#00f3ff]">METRIC_STABILITY: 98%</div>
          
          <div className="relative w-32 h-32 flex items-center justify-center">
            {isAuditing ? (
              <Loader2 className="animate-spin text-[#00f3ff]" size={48} />
            ) : (
              <div className="text-5xl font-display text-[#00f3ff]">{healthScore || '--'}</div>
            )}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
               <circle cx="64" cy="64" r="60" fill="none" stroke="#222" strokeWidth="8" />
               <circle 
                  cx="64" cy="64" r="60" 
                  fill="none" 
                  stroke="#00f3ff" 
                  strokeWidth="8" 
                  strokeDasharray={`${(healthScore || 0) * 3.77} 377`}
                  className="transition-all duration-1000"
               />
            </svg>
          </div>
          <span className="mt-4 font-mono text-sm uppercase">OVERALL_RATING</span>
        </div>

        <div className="bg-black/40 border-4 border-black p-6">
          <h4 className="font-display uppercase mb-4 flex items-center gap-2">
            <RefreshCw size={16} /> QUICK_ACTIONS
          </h4>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => runAudit(activeMode)}
              disabled={isAuditing}
              className="w-full py-3 bg-[#00f3ff] text-black font-bold uppercase text-sm border-2 border-black shadow-[4px_4px_0px_#000000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <Heart size={18} /> RUN_DOCUMENT_AUDIT
            </button>
            <p className="text-[10px] font-mono text-white/40 italic">
              * Audit factors in market viability, section completeness, and clarity of vision.
            </p>
          </div>
        </div>
      </div>

      <div className="audit-output border-4 border-black bg-white p-8 text-black min-h-[400px]">
        {isAuditing ? (
          <div className="flex flex-col items-center justify-center h-full py-12 gap-4">
             <Loader2 className="animate-spin" size={48} />
             <span className="font-display animate-pulse uppercase">AI IS ANALYZING SYSTEM FLUX...</span>
          </div>
        ) : healthReport ? (
          <div className="prose prose-slate max-w-none">
            <div dangerouslySetInnerHTML={{ __html: marked.parse(healthReport) as string }} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 opacity-30">
             <ShieldAlert size={64} />
             <span className="font-display uppercase mt-4">NO_AUDIT_DATA_FOUND</span>
          </div>
        )}
      </div>
    </div>
  );
};
