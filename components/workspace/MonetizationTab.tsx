import React from 'react';
import { DollarSign, TrendingUp, BarChart3, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Freemium', value: 400 },
  { name: 'Pro', value: 300 },
  { name: 'Enterprise', value: 200 },
  { name: 'Ads', value: 100 },
];

const MonetizationTab = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* REVENUE MODEL */}
        <div className="bg-neo-yellow border-4 border-neo-black p-8 neo-shadow-lg transform -rotate-1">
          <div className="flex items-center gap-4 mb-6">
            <DollarSign className="text-neo-black" size={40} />
            <h2 className="text-4xl font-black tracking-tighter">REVENUE_ENGINE</h2>
          </div>
          <div className="space-y-4">
            {['DYNAMIC_PRICING', 'TIERED_ACCESS', 'DATA_SYNDICATION'].map(model => (
              <div key={model} className="bg-white border-2 border-neo-black p-4 flex justify-between items-center neo-shadow">
                <span className="font-black text-sm tracking-widest">{model}</span>
                <TrendingUp size={16} className="text-neo-lime" />
              </div>
            ))}
          </div>
        </div>

        {/* PROJECTIONS */}
        <div className="bg-white border-4 border-neo-black p-6 neo-shadow">
          <h3 className="font-black text-xl mb-6 uppercase border-b-2 border-neo-black pb-2 text-center">Growth Projections</h3>
          <div className="h-48 w-full font-mono text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#000" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-neo-black text-neo-white p-8 border-4 border-neo-black neo-shadow-lg">
         <h4 className="text-neo-lime font-black text-2xl mb-4 flex items-center gap-2">
           <Zap /> INKLO_INSIGHT: UPSIDE_DETECTED
         </h4>
         <p className="font-mono text-xs opacity-80 leading-relaxed max-w-2xl">
           ANALYSIS OF THE CURRENT STRATEGY SUGGESTS A 14% LIFT IN CONVERSION IF THE 'KEYNOTE' VALUE PROPOSITION IS ALIGNED WITH THE 'ENTERPRISE' TIER FEATURES.
         </p>
      </div>
    </div>
  );
};

export default MonetizationTab;
