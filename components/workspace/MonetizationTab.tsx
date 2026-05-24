import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, BarChart3, Zap, Sparkles, HelpCircle, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppStore } from '../../lib/state';
import { thinkDeeply } from '../../lib/ai-tools';
import { toast } from 'sonner';

const MonetizationTab = () => {
  const { founderIdentity, isProcessing, setIsProcessing, setInkloMode } = useAppStore();
  
  // Interactive Sandbox parameters
  const [traffic, setTraffic] = useState(15000); // monthly visitors
  const [conversion, setConversion] = useState(2.2); // conversion % (0.1 to 10)
  const [arpu, setArpu] = useState(29); // monthly pricing ($)
  const [churn, setChurn] = useState(6); // monthly churn % (1 to 25)

  // AI assessment state
  const [aiAuditReport, setAiAuditReport] = useState<string | null>(null);

  // Dynamic calculations
  const mathProjections = useMemo(() => {
    const monthlyAcquisitions = Math.round(traffic * (conversion / 100));
    
    // Simulate active cohort growth over 6 months
    // Month 1: acquisitions
    // Month 2: customers(M1)*(1 - Churn) + acquisitions
    const customerProjections = [];
    let activeCustomers = 0;
    
    for (let month = 1; month <= 6; month++) {
      activeCustomers = Math.round(activeCustomers * (1 - churn / 100) + monthlyAcquisitions);
      customerProjections.push({
        month: `Month_0${month}`,
        customers: activeCustomers,
        Revenue: Math.round(activeCustomers * arpu),
      });
    }

    const peakMRR = customerProjections[5].Revenue;
    const peakARR = peakMRR * 12;
    const ltv = Math.round(arpu / (churn / 100));

    return {
      monthlyAcquisitions,
      customerProjections,
      peakMRR,
      peakARR,
      ltv
    };
  }, [traffic, conversion, arpu, churn]);

  const handleRevenueAudit = async () => {
    setIsProcessing(true);
    setInkloMode('BUILDING');
    const toastId = toast.loading('ANALYZING_SAAS_LEVERS...');
    
    try {
      const prompt = `
Perform a critical SaaS pricing and revenue feasibility analysis for the following metrics:
- Monthly organic traffic: ${traffic} visitors
- Landing page checkout conversion: ${conversion}%
- Average Pricing (ARPU): $${arpu}/month
- Monthly user churn: ${churn}%

Calculated 6-month MRR target: $${mathProjections.peakMRR}
Calculated Customer Lifetime Value (LTV): $${mathProjections.ltv}

Please evaluate if these ratios are stable, suggest specific viral growth hacks, recommend a premium upgrade tier structure, and flag key structural risks. Keep the layout neo-brutalist, ultra-concise, professional and clean, outputting markdown blocks.
      `;
      
      const response = await thinkDeeply(prompt, founderIdentity);
      setAiAuditReport(response);
      toast.success('INKLO_REVENUE_REPORT_COMPILED', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error('REVENUE_AUDIT_FAIL', { id: toastId });
    } finally {
      setIsProcessing(false);
      setInkloMode('DEFAULT');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* HEADER SECTION */}
      <div className="bg-neo-black text-neo-white p-6 border-4 border-neo-black neo-shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-3">
             <DollarSign className="text-neo-yellow" size={36} />
             REVENUE_ENGINE
          </h2>
          <p className="font-mono text-xs text-neo-yellow">INTEGRATED MONETIZATION SIMULATOR</p>
        </div>
        <div className="bg-neo-yellow text-neo-black px-4 py-1.5 border-2 border-slate-900 font-mono text-[10px] font-black uppercase">
           MODEL: COHORT_PROJECTION_v1.2
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* PARAMS SLIDER BOARD */}
        <div className="bg-neo-yellow border-4 border-neo-black p-6 neo-shadow space-y-6">
          <h3 className="text-xl font-black border-b-2 border-neo-black pb-2 flex items-center gap-2">
             <TrendingUp size={20} />
             LEVER_CALIBRATION
          </h3>

          {/* TRAFFIC */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-black">
               <span className="uppercase">Traffic (Monthly)</span>
               <span className="bg-white border-2 border-neo-black px-2 py-0.5">{traffic.toLocaleString()}</span>
            </div>
            <input 
              type="range" 
              min="1000" 
              max="100000" 
              step="1000"
              value={traffic} 
              onChange={e => setTraffic(Number(e.target.value))}
              className="w-full accent-neo-black h-2 bg-white rounded-lg border-2 border-neo-black cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-mono opacity-60">
              <span>1K</span>
              <span>100K users</span>
            </div>
          </div>

          {/* CONVERSION % */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-black">
               <span className="uppercase">Checkout Conver. (%)</span>
               <span className="bg-white border-2 border-neo-black px-2 py-0.5">{conversion}%</span>
            </div>
            <input 
              type="range" 
              min="0.1" 
              max="10" 
              step="0.1"
              value={conversion} 
              onChange={e => setConversion(Number(e.target.value))}
              className="w-full accent-neo-black h-2 bg-white rounded-lg border-2 border-neo-black cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-mono opacity-60">
              <span>0.1%</span>
              <span>10% rate</span>
            </div>
          </div>

          {/* ARPU */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-black">
               <span className="uppercase">Pricing (ARPU $)</span>
               <span className="bg-white border-2 border-neo-black px-2 py-0.5">${arpu}/mo</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="200" 
              step="5"
              value={arpu} 
              onChange={e => setArpu(Number(e.target.value))}
              className="w-full accent-neo-black h-2 bg-white rounded-lg border-2 border-neo-black cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-mono opacity-60">
              <span>$5</span>
              <span>$200/mo</span>
            </div>
          </div>

          {/* CHURN % */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-black">
               <span className="uppercase">Cohort Churn (%)</span>
               <span className="bg-white border-2 border-neo-black px-2 py-0.5">{churn}%/mo</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="25" 
              step="1"
              value={churn} 
              onChange={e => setChurn(Number(e.target.value))}
              className="w-full accent-neo-black h-2 bg-white rounded-lg border-2 border-neo-black cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-mono opacity-60">
              <span>1% (Good)</span>
              <span>25% (Extreme)</span>
            </div>
          </div>
        </div>

        {/* MATH OUTCOMES & RECHARTS INTERACTION */}
        <div className="bg-white border-4 border-neo-black p-6 neo-shadow lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-black text-xl mb-6 uppercase border-b-2 border-neo-black pb-2 text-neutral-800">
              6-Month Cohort Trajectory
            </h3>
            
            <div className="h-52 w-full font-mono text-[10px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mathProjections.customerProjections}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                  <XAxis dataKey="month" stroke="#333" tickLine={false} />
                  <YAxis stroke="#333" tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                  <Bar dataKey="Revenue" fill="#000" radius={[4, 4, 0, 0]} label={{ position: 'top', fill: '#000', fontSize: 9 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SUMMARY GRID METRICS */}
          <div className="grid grid-cols-3 gap-2 mt-6 border-t-2 border-neo-black pt-4">
             <div className="text-center">
                <span className="block text-[9px] font-mono font-black text-zinc-500 uppercase">PEAK_MRR</span>
                <span className="text-xl font-black text-neo-black">${mathProjections.peakMRR.toLocaleString()}</span>
             </div>
             <div className="text-center border-x-2 border-neo-black/10">
                <span className="block text-[9px] font-mono font-black text-zinc-500 uppercase">RUN_RATE</span>
                <span className="text-xl font-black text-neo-black">${mathProjections.peakARR.toLocaleString()}</span>
             </div>
             <div className="text-center">
                <span className="block text-[9px] font-mono font-black text-zinc-500 uppercase">USER_LTV</span>
                <span className="text-xl font-black text-neo-black">${mathProjections.ltv.toLocaleString()}</span>
             </div>
          </div>
        </div>

      </div>

      {/* AI ASSESSMENT BOX */}
      <div className="bg-neo-black text-neo-white p-8 border-4 border-neo-black neo-shadow-lg space-y-6">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h4 className="text-neo-lime font-black text-2xl flex items-center gap-2">
               <Zap size={24} className="text-neo-yellow animate-pulse" />
               INKLO_INSIGHT: DYNAMIC_FEASIBILITY_AUDITOR
            </h4>
            
            <button 
              onClick={handleRevenueAudit}
              disabled={isProcessing}
              className="bg-neo-lime text-neo-black hover:bg-lime-400 border-2 border-neo-black px-5 py-2 font-black text-xs uppercase flex items-center gap-2 transiton-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:shadow-none"
            >
              <Sparkles size={14} />
              {isProcessing ? 'RUNNING_AUDITING...' : 'RUN_FEASIBILITY_AUDIT'}
            </button>
         </div>

         {aiAuditReport ? (
            <div className="bg-zinc-900 border-2 border-zinc-700 p-6 font-medium text-xs leading-relaxed max-w-4xl text-neutral-200 uppercase font-mono border-l-4 border-l-neo-lime animate-in slide-in-from-top-2">
               <div className="whitespace-pre-wrap leading-relaxed">
                  {aiAuditReport}
               </div>
               <button
                 onClick={() => setAiAuditReport(null)}
                 className="mt-4 text-[9px] text-neo-pink font-bold underline hover:text-rose-400 transition-colors uppercase block"
               >
                 CLEAR_AUDIT_DUMP
               </button>
            </div>
         ) : (
            <p className="font-mono text-xs opacity-80 leading-relaxed max-w-3xl">
              FEEDBACK: ACTIVE SIMULATION LEVERS IMPACT PROJECTED COMPLIANT VALUATION. SET YOUR GROWTH PARAMS ABOVE AND DISPATCH THE AUDITING PROTOCOL GENERATOR FOR BENCHMARK ADVICE.
            </p>
         )}
      </div>

    </div>
  );
};

export default MonetizationTab;
