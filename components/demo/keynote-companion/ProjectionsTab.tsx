import React, { useState } from 'react';
import { useUI } from '../../../lib/state';
import { thinkDeeply } from '../../../lib/ai-tools';
import { LineChart as LineChartIcon, Loader2, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const ProjectionsTab: React.FC = () => {
  const { documentContent } = useUI();
  const [isLoading, setIsLoading] = useState(false);
  const [projectionData, setProjectionData] = useState<{
    months: number[];
    users: number[];
    revenue: number[];
    cac: number;
    ltv: number;
    churn: number;
    growthRate: number;
    summary: string;
  } | null>(null);

  const [params, setParams] = useState({
    initialUsers: 100,
    monthlyGrowthRate: 15, // percentage
    churnRate: 5, // percentage
    arpu: 20, // Average Revenue Per User
    cac: 50, // Customer Acquisition Cost
    months: 24
  });

  const handleGenerateProjections = async () => {
    setIsLoading(true);
    try {
      // We can use AI to analyze the document and suggest parameters, or just calculate based on inputs.
      // Let's use AI to generate a summary of the financial model based on the inputs and document.
      const prompt = `Based on the following startup business plan:\n\n${documentContent}\n\nAnd the following financial parameters:\nInitial Users: ${params.initialUsers}\nMonthly Growth Rate: ${params.monthlyGrowthRate}%\nChurn Rate: ${params.churnRate}%\nARPU: $${params.arpu}\nCAC: $${params.cac}\nMonths: ${params.months}\n\nGenerate a brief, 2-paragraph financial summary and viability assessment. Is this a healthy SaaS model? What are the biggest risks?`;
      
      const summary = await thinkDeeply(prompt);

      // Calculate projections
      const months = Array.from({ length: params.months }, (_, i) => i + 1);
      const users = [];
      const revenue = [];
      
      let currentUsers = params.initialUsers;
      for (let i = 0; i < params.months; i++) {
        users.push(Math.round(currentUsers));
        revenue.push(Math.round(currentUsers * params.arpu));
        
        // Calculate next month's users
        const newUsers = currentUsers * (params.monthlyGrowthRate / 100);
        const churnedUsers = currentUsers * (params.churnRate / 100);
        currentUsers = currentUsers + newUsers - churnedUsers;
      }

      setProjectionData({
        months,
        users,
        revenue,
        cac: params.cac,
        ltv: params.arpu / (params.churnRate / 100), // Basic LTV calculation
        churn: params.churnRate,
        growthRate: params.monthlyGrowthRate,
        summary
      });
    } catch (error) {
      console.error(error);
      alert('Failed to generate projections.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="projections-tab" style={{ padding: '20px', overflowY: 'auto', height: '100%' }}>
      <h2>Interactive Financial & Growth Projections</h2>
      <p style={{ marginBottom: '20px', color: '#666' }}>Model your startup's growth and revenue over time.</p>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
        <div style={{ flex: 1, minWidth: '300px', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid #eee' }}>
          <h3>Parameters</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>Initial Users</label>
              <input type="number" value={params.initialUsers} onChange={e => setParams({...params, initialUsers: Number(e.target.value)})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>Monthly Growth (%)</label>
              <input type="number" value={params.monthlyGrowthRate} onChange={e => setParams({...params, monthlyGrowthRate: Number(e.target.value)})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>Monthly Churn (%)</label>
              <input type="number" value={params.churnRate} onChange={e => setParams({...params, churnRate: Number(e.target.value)})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>ARPU ($)</label>
              <input type="number" value={params.arpu} onChange={e => setParams({...params, arpu: Number(e.target.value)})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>CAC ($)</label>
              <input type="number" value={params.cac} onChange={e => setParams({...params, cac: Number(e.target.value)})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '5px' }}>Projection Months</label>
              <input type="number" value={params.months} onChange={e => setParams({...params, months: Number(e.target.value)})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
          </div>
          <button
            onClick={handleGenerateProjections}
            disabled={isLoading || !documentContent.trim()}
            style={{ marginTop: '20px', width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <LineChartIcon size={18} />}
            {isLoading ? 'Calculating...' : 'Generate Projections'}
          </button>
          {!documentContent.trim() && (
            <p style={{ fontSize: '12px', color: '#d93025', marginTop: '10px' }}>Please write your business plan in the Document tab first.</p>
          )}
        </div>

        {projectionData && (
          <div style={{ flex: 2, minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1, backgroundColor: '#e8f0fe', padding: '15px', borderRadius: '8px', border: '1px solid #cce5ff' }}>
                <div style={{ fontSize: '12px', color: '#1a73e8', textTransform: 'uppercase', fontWeight: 'bold' }}>LTV:CAC Ratio</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#004085' }}>
                  {(projectionData.ltv / projectionData.cac).toFixed(1)}x
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>{projectionData.ltv / projectionData.cac >= 3 ? 'Healthy (>3x)' : 'Needs Improvement (<3x)'}</div>
              </div>
              <div style={{ flex: 1, backgroundColor: '#d4edda', padding: '15px', borderRadius: '8px', border: '1px solid #c3e6cb' }}>
                <div style={{ fontSize: '12px', color: '#155724', textTransform: 'uppercase', fontWeight: 'bold' }}>Month {params.months} MRR</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>
                  ${projectionData.revenue[projectionData.revenue.length - 1].toLocaleString()}
                </div>
              </div>
              <div style={{ flex: 1, backgroundColor: '#fff3cd', padding: '15px', borderRadius: '8px', border: '1px solid #ffeeba' }}>
                <div style={{ fontSize: '12px', color: '#856404', textTransform: 'uppercase', fontWeight: 'bold' }}>Month {params.months} Users</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#856404' }}>
                  {projectionData.users[projectionData.users.length - 1].toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={18} /> AI Financial Summary</h3>
              <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#333' }}>
                {projectionData.summary}
              </div>
            </div>
          </div>
        )}
      </div>

      {projectionData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginBottom: '15px' }}>Growth Trajectory (Users over Time)</h3>
            <div style={{ height: '400px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projectionData.users.map((u, i) => ({ month: i + 1, users: u }))} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" label={{ value: 'Months', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Active Users', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value: number) => value.toLocaleString()} />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="monotone" dataKey="users" stroke="#007bff" strokeWidth={2} activeDot={{ r: 8 }} name="Active Users" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginBottom: '15px' }}>Revenue Trajectory (MRR over Time)</h3>
            <div style={{ height: '400px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projectionData.revenue.map((r, i) => ({ month: i + 1, revenue: r }))} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" label={{ value: 'Months', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'MRR ($)', angle: -90, position: 'insideLeft' }} tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="monotone" dataKey="revenue" stroke="#28a745" strokeWidth={2} activeDot={{ r: 8 }} name="Monthly Recurring Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
