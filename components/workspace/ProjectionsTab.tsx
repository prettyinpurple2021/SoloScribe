import React, { useState, useMemo, useRef } from 'react';
import { useUI } from '../../lib/state';
import { thinkDeeply } from '../../lib/ai-tools';
import { 
  LineChart as LineChartIcon, 
  Loader2, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Zap, 
  BarChart3, 
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  AlertCircle,
  RefreshCcw,
  Sparkles,
  Download,
  FileDown,
  Printer
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar
} from 'recharts';
import { toast } from 'sonner';
import { Tooltip as AppTooltip } from '../Tooltip';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export const ProjectionsTab: React.FC = () => {
  const { documentContent } = useUI();
  const [isLoading, setIsLoading] = useState(false);
  const [scenario, setScenario] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [activeWhatIf, setActiveWhatIf] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const [projectionData, setProjectionData] = useState<{
    timeline: any[];
    cac: number;
    ltv: number;
    churn: number;
    growthRate: number;
    summary: string;
    metrics: {
      paybackPeriod: number;
      runway: number;
      burnRate: number;
    };
  } | null>(null);

  const [params, setParams] = useState({
    initialUsers: 100,
    monthlyGrowthRate: 15,
    churnRate: 5,
    arpu: 20,
    cac: 50,
    fixedCosts: 5000,
    months: 24
  });

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    const toastId = toast.loading('Generating Financial Report...');
    try {
      const dataUrl = await toPng(reportRef.current, { quality: 0.95, backgroundColor: '#0a0a0a' });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Full_Projections_Report_${new Date().getTime()}.pdf`);
      toast.success('Report downloaded!', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Export failed.', { id: toastId });
    }
  };

  const scenarios = {
    conservative: { growth: 0.5, churn: 1.5, cac: 1.5 },
    moderate: { growth: 1.0, churn: 1.0, cac: 1.0 },
    aggressive: { growth: 2.0, churn: 0.7, cac: 0.8 }
  };

  const whatIfScenarios = [
    { id: 'hiring', label: 'Hire a VA/Assistant', impact: { fixedCosts: 1500, growth: 1.2 }, description: '+$1.5k/mo costs, 20% growth boost' },
    { id: 'cac_spike', label: 'Ad Cost Spike', impact: { cac: 2.0 }, description: 'Marketing costs double' },
    { id: 'viral', label: 'Viral Growth', impact: { growth: 3.0, cac: 0.5 }, description: '3x growth, 50% lower CAC' },
    { id: 'retention', label: 'Retention Focus', impact: { churn: 0.5, arpu: 1.2 }, description: '50% lower churn, 20% higher ARPU' },
  ];

  const handleGenerateProjections = async (isStressTest = false) => {
    setIsLoading(true);
    try {
      const activeScenario = scenarios[scenario];
      let adjustedGrowth = params.monthlyGrowthRate * activeScenario.growth;
      let adjustedChurn = params.churnRate * activeScenario.churn;
      let adjustedCac = params.cac * activeScenario.cac;
      let adjustedFixedCosts = params.fixedCosts;
      let adjustedArpu = params.arpu;

      if (isStressTest) {
        adjustedGrowth *= 0.3;
        adjustedChurn *= 2.5;
        adjustedCac *= 2.0;
      } else if (activeWhatIf) {
        const whatIf = whatIfScenarios.find(w => w.id === activeWhatIf);
        if (whatIf) {
          if (whatIf.impact.growth) adjustedGrowth *= whatIf.impact.growth;
          if (whatIf.impact.churn) adjustedChurn *= whatIf.impact.churn;
          if (whatIf.impact.cac) adjustedCac *= whatIf.impact.cac;
          if (whatIf.impact.fixedCosts) adjustedFixedCosts += whatIf.impact.fixedCosts;
          if (whatIf.impact.arpu) adjustedArpu *= whatIf.impact.arpu;
        }
      }

      const prompt = `Analyze this startup plan for a ${isStressTest ? 'WORST CASE STRESS TEST' : scenario + (activeWhatIf ? ' with ' + activeWhatIf : '')} scenario.
      Document: ${documentContent.slice(0, 5000)}
      Growth: ${adjustedGrowth.toFixed(1)}% | Churn: ${adjustedChurn.toFixed(1)}% | ARPU: $${adjustedArpu} | CAC: $${adjustedCac.toFixed(1)} | Fixed Costs: $${adjustedFixedCosts}
      Provide a concise 3-5 point strategic assessment. Use terminal-style language.`;
      
      const summary = await thinkDeeply(prompt);

      const timeline = [];
      let currentUsers = params.initialUsers;
      let cumulativeRevenue = 0;
      
      for (let i = 0; i < params.months; i++) {
        const mrr = Math.round(currentUsers * adjustedArpu);
        const newUsers = currentUsers * (adjustedGrowth / 100);
        const marketingSpend = newUsers * adjustedCac;
        const totalExpenses = marketingSpend + adjustedFixedCosts;
        const netProfit = mrr - totalExpenses;
        cumulativeRevenue += mrr;

        timeline.push({
          month: i + 1,
          users: Math.round(currentUsers),
          mrr,
          expenses: Math.round(totalExpenses),
          profit: Math.round(netProfit),
          cumulativeRevenue: Math.round(cumulativeRevenue)
        });
        
        const churnedUsers = currentUsers * (adjustedChurn / 100);
        currentUsers = currentUsers + newUsers - churnedUsers;
      }

      const ltv = adjustedArpu / (adjustedChurn / 100);
      const paybackPeriod = adjustedCac / (adjustedArpu * (1 - adjustedChurn / 100));
      const lastMonth = timeline[timeline.length - 1];

      setProjectionData({
        timeline,
        cac: adjustedCac,
        ltv,
        churn: adjustedChurn,
        growthRate: adjustedGrowth,
        summary,
        metrics: {
          paybackPeriod,
          runway: lastMonth.profit < 0 ? Math.abs(100000 / lastMonth.profit) : Infinity,
          burnRate: Math.max(0, -lastMonth.profit)
        }
      });
      toast.success('Simulation Successful');
    } catch (error) {
      console.error(error);
      toast.error('Simulation Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="projections-tab p-6 pb-40 overflow-y-auto h-full bg-[#0a0a0a] text-white scrollbar-hidden">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-display uppercase tracking-widest text-theme-accent">Growth_Orchestrator</h2>
          <p className="font-mono text-xs opacity-50 uppercase mt-1">Multi-scenario financial modeling & unit economics.</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex gap-1 bg-white/5 p-1 border border-white/10">
            {(['conservative', 'moderate', 'aggressive'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScenario(s)}
                className={`px-4 py-1.5 font-mono text-[9px] uppercase font-bold transition-all ${scenario === s ? 'bg-theme-accent text-black' : 'text-white/50 hover:text-white'}`}
              >
                {s}
              </button>
            ))}
          </div>
          {projectionData && (
            <button 
              onClick={handleExportPDF}
              className="p-2 border-2 border-theme-accent text-theme-accent hover:bg-theme-accent hover:text-black transition-colors"
            >
              <FileDown size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" ref={reportRef}>
        <div className="lg:col-span-4 space-y-8 no-export">
          <div className="bg-white/5 border border-white/10 p-6 shadow-[4px_4px_0px_rgba(255,255,255,0.05)]">
            <h3 className="font-display uppercase mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
              <Zap size={16} className="text-theme-accent" /> Control_Parameters
            </h3>
            
            <div className="space-y-4">
              {[
                { label: 'Initial Users', key: 'initialUsers' },
                { label: 'Growth % (MoM)', key: 'monthlyGrowthRate' },
                { label: 'Churn %', key: 'churnRate' },
                { label: 'Avg MRR / User', key: 'arpu' },
                { label: 'CAC ($)', key: 'cac' },
                { label: 'OPEX / Month', key: 'fixedCosts' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-[9px] uppercase font-mono opacity-50 mb-1">{f.label}</label>
                  <input 
                    type="number" 
                    value={(params as any)[f.key]} 
                    onChange={e => setParams({...params, [f.key]: Number(e.target.value)})} 
                    className="w-full bg-black border border-white/10 p-2 font-mono text-sm text-theme-accent focus:border-theme-accent focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => handleGenerateProjections(false)}
              disabled={isLoading || !documentContent.trim()}
              className="w-full mt-6 bg-theme-accent text-black p-4 font-display uppercase font-bold text-sm border-2 border-black hover:bg-white transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Run_Simulation'}
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 p-6">
            <h3 className="font-mono text-[10px] uppercase opacity-50 mb-4 tracking-widest italic">Stress_Test_Protocols</h3>
            <div className="space-y-2">
              {whatIfScenarios.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setActiveWhatIf(activeWhatIf === w.id ? null : w.id)}
                  className={`w-full p-3 text-left font-mono text-[10px] uppercase transition-all border ${activeWhatIf === w.id ? 'bg-theme-accent/20 border-theme-accent text-theme-accent' : 'bg-black/20 border-white/5 opacity-60 hover:opacity-100'}`}
                >
                  <div className="font-bold">{w.label}</div>
                  <div className="text-[8px] opacity-60">{w.description}</div>
                </button>
              ))}
              <button
                onClick={() => handleGenerateProjections(true)}
                disabled={isLoading}
                className="w-full mt-4 p-3 font-mono text-[10px] uppercase font-bold text-red-500 border border-red-500/30 hover:bg-red-500/10 transition-colors"
              >
                Simulate_Total_Market_Crash
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          {projectionData ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Unit Efficiency', value: `${(projectionData.ltv / projectionData.cac).toFixed(1)}x`, sub: 'LTV:CAC', color: 'text-theme-accent' },
                  { label: 'End Horizon MRR', value: `$${projectionData.timeline[projectionData.timeline.length - 1].mrr.toLocaleString()}`, sub: 'Month 24', color: 'text-green-400' },
                  { label: 'CAC Recovery', value: `${projectionData.metrics.paybackPeriod.toFixed(1)}mo`, sub: 'Payback', color: 'text-purple-400' },
                  { label: 'Cash Exhaustion', value: projectionData.metrics.runway === Infinity ? '∞' : `${Math.round(projectionData.metrics.runway)}mo`, sub: 'Est Runway', color: 'text-red-400' }
                ].map((stat, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-5 shadow-[4px_4px_0px_rgba(255,255,255,0.02)]">
                    <div className="text-[8px] uppercase font-mono opacity-40 mb-1">{stat.label}</div>
                    <div className={`text-2xl font-display uppercase tracking-tight ${stat.color}`}>{stat.value}</div>
                    <div className="text-[9px] font-mono opacity-30 mt-1">{stat.sub}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 border border-white/10 p-6">
                <h3 className="font-display uppercase text-sm mb-6 flex items-center gap-2">
                  <TrendingUp size={16} className="text-theme-accent" /> Traction_Forecast_v2.1
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectionData.timeline}>
                      <defs>
                        <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00f3ff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#000', border: '2px solid var(--theme-accent)', borderRadius: '0' }}
                        labelStyle={{ color: 'var(--theme-accent)', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="mrr" stroke="#00f3ff" strokeWidth={3} fillOpacity={1} fill="url(#colorMrr)" name="MRR" />
                      <Area type="monotone" dataKey="profit" stroke="#4ade80" strokeWidth={2} fill="transparent" name="Net Profit" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-black border-2 border-theme-accent p-6 shadow-[8px_8px_0px_rgba(0,243,255,0.1)]">
                <h3 className="font-display uppercase text-xs mb-4 flex items-center gap-2 text-theme-accent">
                  <Sparkles size={14} /> AI_STRATEGIC_OVERLAY
                </h3>
                <div className="font-mono text-xs leading-relaxed text-theme-accent/80 whitespace-pre-wrap">
                  {projectionData.summary}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border-4 border-dashed border-white/5 rounded-3xl opacity-20">
              <BarChart3 size={80} />
              <p className="font-display text-xl uppercase mt-4 italic tracking-widest">Awaiting Simulation Data...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
