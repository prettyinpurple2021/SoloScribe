import React, { useState, useMemo } from 'react';
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
  Info
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { toast } from 'sonner';

export const ProjectionsTab: React.FC = () => {
  const { documentContent } = useUI();
  const [isLoading, setIsLoading] = useState(false);
  const [scenario, setScenario] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
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
    monthlyGrowthRate: 15, // percentage
    churnRate: 5, // percentage
    arpu: 20, // Average Revenue Per User
    cac: 50, // Customer Acquisition Cost
    fixedCosts: 5000, // Monthly fixed costs
    months: 24
  });

  const scenarios = {
    conservative: { growth: 0.6, churn: 1.5, cac: 1.2 },
    moderate: { growth: 1.0, churn: 1.0, cac: 1.0 },
    aggressive: { growth: 1.8, churn: 0.8, cac: 0.8 }
  };

  const handleGenerateProjections = async () => {
    setIsLoading(true);
    try {
      const activeScenario = scenarios[scenario];
      const adjustedGrowth = params.monthlyGrowthRate * activeScenario.growth;
      const adjustedChurn = params.churnRate * activeScenario.churn;
      const adjustedCac = params.cac * activeScenario.cac;

      const prompt = `Analyze this startup plan for a ${scenario} growth scenario:\n\n${documentContent}\n\nParameters:
      - Growth: ${adjustedGrowth.toFixed(1)}%
      - Churn: ${adjustedChurn.toFixed(1)}%
      - ARPU: $${params.arpu}
      - CAC: $${adjustedCac.toFixed(1)}
      - Fixed Costs: $${params.fixedCosts}
      
      Provide a concise financial health assessment (max 150 words). Focus on unit economics and scalability.`;
      
      const summary = await thinkDeeply(prompt);

      const timeline = [];
      let currentUsers = params.initialUsers;
      let cumulativeRevenue = 0;
      
      for (let i = 0; i < params.months; i++) {
        const mrr = Math.round(currentUsers * params.arpu);
        const newUsers = currentUsers * (adjustedGrowth / 100);
        const marketingSpend = newUsers * adjustedCac;
        const totalExpenses = marketingSpend + params.fixedCosts;
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

      const ltv = params.arpu / (adjustedChurn / 100);
      const paybackPeriod = adjustedCac / (params.arpu * (1 - adjustedChurn / 100));

      const lastMonth = timeline[timeline.length - 1];
      const lastNetProfit = lastMonth.profit;

      setProjectionData({
        timeline,
        cac: adjustedCac,
        ltv,
        churn: adjustedChurn,
        growthRate: adjustedGrowth,
        summary,
        metrics: {
          paybackPeriod,
          runway: lastNetProfit < 0 ? Math.abs(100000 / lastNetProfit) : Infinity, // Assuming 100k starting capital for runway calc
          burnRate: Math.max(0, -lastNetProfit)
        }
      });
      toast.success(`${scenario.charAt(0).toUpperCase() + scenario.slice(1)} projections generated!`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate projections.');
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = ['#00f3ff', '#ff00ff', '#00ff00', '#ffff00'];

  return (
    <div className="projections-tab" style={{ 
      padding: '24px', 
      overflowY: 'auto', 
      height: '100%',
      backgroundColor: '#0a0a0a',
      color: '#fff'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--theme-accent)' }}>Advanced Growth Engine</h2>
          <p style={{ opacity: 0.6, fontSize: '14px' }}>Simulate market scenarios and visualize your startup's trajectory.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
          {(['conservative', 'moderate', 'aggressive'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScenario(s)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'capitalize',
                backgroundColor: scenario === s ? 'var(--theme-accent)' : 'transparent',
                color: scenario === s ? '#000' : '#fff',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', marginBottom: '32px' }}>
        <div style={{ 
          backgroundColor: 'rgba(255,255,255,0.03)', 
          padding: '24px', 
          borderRadius: '16px', 
          border: '1px solid rgba(255,255,255,0.1)',
          height: 'fit-content'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} className="text-theme-accent" /> Model Parameters
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'Initial Users', key: 'initialUsers', icon: <Users size={14} /> },
              { label: 'Growth Rate (%)', key: 'monthlyGrowthRate', icon: <TrendingUp size={14} /> },
              { label: 'Churn Rate (%)', key: 'churnRate', icon: <ArrowDownRight size={14} /> },
              { label: 'ARPU ($)', key: 'arpu', icon: <DollarSign size={14} /> },
              { label: 'CAC ($)', key: 'cac', icon: <ArrowUpRight size={14} /> },
              { label: 'Fixed Costs ($)', key: 'fixedCosts', icon: <Info size={14} /> },
              { label: 'Months', key: 'months', icon: <LineChartIcon size={14} /> },
            ].map((field) => (
              <div key={field.key}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', opacity: 0.5, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {field.icon} {field.label}
                </label>
                <input 
                  type="number" 
                  value={(params as any)[field.key]} 
                  onChange={e => setParams({...params, [field.key]: Number(e.target.value)})} 
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '8px', 
                    backgroundColor: 'rgba(255,255,255,0.05)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '14px'
                  }} 
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleGenerateProjections}
            disabled={isLoading || !documentContent.trim()}
            style={{ 
              marginTop: '24px', 
              width: '100%', 
              padding: '14px', 
              borderRadius: '12px', 
              backgroundColor: 'var(--theme-accent)', 
              color: '#000', 
              fontWeight: 700,
              border: 'none', 
              cursor: 'pointer', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '8px',
              boxShadow: '0 4px 20px rgba(0, 243, 255, 0.3)'
            }}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <BarChart3 size={18} />}
            {isLoading ? 'Processing...' : 'Run Simulation'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {projectionData ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {[
                  { label: 'LTV:CAC', value: `${(projectionData.ltv / projectionData.cac).toFixed(1)}x`, sub: projectionData.ltv / projectionData.cac >= 3 ? 'Healthy' : 'Low', color: '#00f3ff' },
                  { label: 'Final MRR', value: `$${projectionData.timeline[projectionData.timeline.length - 1].mrr.toLocaleString()}`, sub: 'Month 24', color: '#00ff00' },
                  { label: 'Payback', value: `${projectionData.metrics.paybackPeriod.toFixed(1)}mo`, sub: 'Recovery', color: '#ff00ff' },
                  { label: 'Burn Rate', value: `$${projectionData.metrics.burnRate.toLocaleString()}`, sub: 'Monthly', color: '#ff4444' }
                ].map((stat, i) => (
                  <div key={i} style={{ 
                    backgroundColor: 'rgba(255,255,255,0.03)', 
                    padding: '20px', 
                    borderRadius: '16px', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: '11px', opacity: 0.4 }}>{stat.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ 
                backgroundColor: 'rgba(255,255,255,0.03)', 
                padding: '24px', 
                borderRadius: '16px', 
                border: '1px solid rgba(255,255,255,0.1)' 
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} className="text-theme-accent" /> Revenue & Profitability
                </h3>
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectionData.timeline}>
                      <defs>
                        <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00f3ff" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00ff00" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00ff00" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="mrr" stroke="#00f3ff" fillOpacity={1} fill="url(#colorMrr)" name="MRR" />
                      <Area type="monotone" dataKey="profit" stroke="#00ff00" fillOpacity={1} fill="url(#colorProfit)" name="Net Profit" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.02)',
              borderRadius: '24px',
              border: '2px dashed rgba(255,255,255,0.05)',
              padding: '60px'
            }}>
              <LineChartIcon size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
              <h3 style={{ opacity: 0.3 }}>Run a simulation to see projections</h3>
            </div>
          )}
        </div>
      </div>

      {projectionData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ 
            backgroundColor: 'rgba(255,255,255,0.03)', 
            padding: '24px', 
            borderRadius: '16px', 
            border: '1px solid rgba(255,255,255,0.1)' 
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>User Acquisition</h3>
            <div style={{ height: '250px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectionData.timeline.filter((_, i) => i % 3 === 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="users" fill="#ff00ff" radius={[4, 4, 0, 0]} name="Active Users" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ 
            backgroundColor: 'rgba(255,255,255,0.03)', 
            padding: '24px', 
            borderRadius: '16px', 
            border: '1px solid rgba(255,255,255,0.1)' 
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>AI Strategic Analysis</h3>
            <div style={{ 
              fontSize: '14px', 
              lineHeight: '1.7', 
              opacity: 0.8, 
              backgroundColor: 'rgba(0,243,255,0.03)', 
              padding: '20px', 
              borderRadius: '12px',
              borderLeft: '4px solid var(--theme-accent)',
              fontStyle: 'italic'
            }}>
              {projectionData.summary}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
