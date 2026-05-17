import React from 'react';
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';

const ComplianceTab = () => {
  const checks = [
    { id: 1, title: 'GDPR Data Processing', status: 'PASS', score: 98 },
    { id: 2, title: 'Term of Service Sync', status: 'WARN', score: 72 },
    { id: 3, title: 'AI Ethics Boundary', status: 'PASS', score: 100 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-neo-black text-neo-white p-6 border-4 border-neo-black neo-shadow-lg flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight">INKLO COMPLIANCE_SHIELD</h2>
          <p className="font-mono text-[10px] text-neo-cyan font-bold uppercase">Automated Regulatory Audit v1.0.4</p>
        </div>
        <div className="bg-neo-lime text-neo-black px-6 py-2 border-4 border-neo-black font-black text-2xl">
          90% OK
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {checks.map(check => (
          <div key={check.id} className="bg-white border-4 border-neo-black p-6 neo-shadow flex flex-col justify-between hover:rotate-1 transition-transform">
            <div className="flex justify-between items-start mb-4">
               <h3 className="font-black text-lg leading-tight uppercase">{check.title}</h3>
               {check.status === 'PASS' ? <CheckCircle className="text-neo-lime" /> : <AlertTriangle className="text-neo-yellow" />}
            </div>
            <div className="mt-4">
               <div className="flex justify-between font-mono text-[10px] font-black mb-1">
                 <span>SCORE</span>
                 <span>{check.score}%</span>
               </div>
               <div className="h-4 w-full bg-neo-black/10 border-2 border-neo-black">
                 <div 
                   className={`h-full border-r-2 border-neo-black ${check.status === 'PASS' ? 'bg-neo-lime' : 'bg-neo-yellow'}`} 
                   style={{ width: `${check.score}%` }} 
                 />
               </div>
            </div>
          </div>
        ))}
      </div>

      <div className="notebook-bg border-4 border-neo-black p-8 neo-shadow relative overflow-hidden">
        <h3 className="font-black text-xl mb-4 uppercase border-b-4 border-neo-black pb-4">Strategy Implications</h3>
        <p className="font-sans font-bold text-lg leading-relaxed text-zinc-700">
          Your current strategy aligns with primary EU data regulations. However, the proposed monetization expansion in the 'Keynote' section requires additional disclosure layers to maintain 100% compliance.
        </p>
        {/* Decorative Hole */}
        <div className="absolute left-2 top-0 bottom-0 w-4 flex flex-col justify-around py-4">
           {[...Array(6)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full border-2 border-neo-black bg-[#f0f0f0]" />)}
        </div>
      </div>
    </div>
  );
};

export default ComplianceTab;
