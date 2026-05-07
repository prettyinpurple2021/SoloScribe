import React, { useState } from 'react';
import { DollarSign, TrendingUp, Users, Layers, Zap, Target, BarChart3, Calculator } from 'lucide-react';
import { motion } from 'motion/react';

const VERTICALS = [
  { id: 'creator', name: 'Creator', icon: Users, color: 'bg-purple-100' },
  { id: 'ecommerce', name: 'E-commerce', icon: Zap, color: 'bg-yellow-100' },
  { id: 'agency', name: 'Agency', icon: Target, color: 'bg-blue-100' },
  { id: 'saas', name: 'SaaS Founder', icon: Layers, color: 'bg-green-100' },
];

const STRATEGIES = {
  creator: [
    { title: 'Premium Newsletter', description: 'Move top 5% of audience to a paid Substack/Beehiiv.', potential: 'High' },
    { title: 'Digital Workshops', description: 'Run monthly 90-minute deep dives on specialized topics.', potential: 'Medium' },
    { title: 'Affiliate Ecosystem', description: 'Build a curated "stack" of tools with recurring commissions.', potential: 'High' },
  ],
  ecommerce: [
    { title: 'Subscription Box', description: 'Convert one-time buyers into monthly recurring subscribers.', potential: 'Very High' },
    { title: 'VIP Loyalty Program', description: 'Paid tier for early access and free shipping.', potential: 'Medium' },
    { title: 'Upsell Automation', description: 'Post-purchase one-click upsells for related accessories.', potential: 'High' },
  ],
  agency: [
    { title: 'Productized Service', description: 'Fixed-price, scoped offerings instead of hourly billing.', potential: 'High' },
    { title: 'Retainer Model', description: 'Transition project work into ongoing maintenance/strategy.', potential: 'Very High' },
    { title: 'White-label Tools', description: 'Resell SaaS tools to clients with a management markup.', potential: 'Medium' },
  ],
  saas: [
    { title: 'Tiered Subscriptions', description: 'Standard, Pro, and Enterprise tiers based on usage.', potential: 'Very High' },
    { title: 'Add-on Marketplace', description: 'Sell specialized plugins or modules separately.', potential: 'Medium' },
    { title: 'API Access', description: 'Charge for high-volume data access and integrations.', potential: 'High' },
  ]
};

export default function MonetizationTab() {
  const [selectedVertical, setSelectedVertical] = useState('saas');
  const [cac, setCac] = useState(50);
  const [ltv, setLtv] = useState(500);

  const strategies = STRATEGIES[selectedVertical as keyof typeof STRATEGIES] || STRATEGIES.saas;

  return (
    <div className="monetization-tab p-6 pb-24 space-y-8 overflow-y-auto h-full">
      <header className="flex justify-between items-center border-b-4 border-black pb-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-2">
            <DollarSign size={32} />
            Revenue Architect
          </h2>
          <p className="text-sm font-mono opacity-60 uppercase">Monetization Strategy // Growth Engine</p>
        </div>
      </header>

      {/* Vertical Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {VERTICALS.map(v => (
          <button
            key={v.id}
            onClick={() => setSelectedVertical(v.id)}
            className={`p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-2 transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${selectedVertical === v.id ? v.color : 'bg-white'}`}
          >
            <v.icon size={24} />
            <span className="font-bold uppercase text-xs">{v.name}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Strategy Suggestions */}
        <section className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-bold uppercase flex items-center gap-2 mb-4">
            <TrendingUp size={24} />
            Growth Strategies
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategies.map((s, i) => (
              <div key={i} className="paper-notebook p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-black uppercase text-lg leading-tight">{s.title}</h4>
                  <span className="bg-black text-white text-[10px] px-2 py-0.5 font-bold uppercase">{s.potential}</span>
                </div>
                <p className="text-sm opacity-70 mb-4">{s.description}</p>
                <button className="text-xs font-bold uppercase underline hover:text-theme-accent">Analyze Implementation</button>
              </div>
            ))}
          </div>
        </section>

        {/* Unit Economics */}
        <section className="paper-notebook p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-theme-surface">
          <h3 className="text-xl font-bold uppercase flex items-center gap-2 mb-6">
            <BarChart3 size={24} />
            Unit Economics
          </h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span>CAC (Acquisition Cost)</span>
                <span>${cac}</span>
              </div>
              <input 
                type="range" min="0" max="500" value={cac} 
                onChange={(e) => setCac(Number(e.target.value))}
                className="w-full h-2 bg-black rounded-none appearance-none cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span>LTV (Lifetime Value)</span>
                <span>${ltv}</span>
              </div>
              <input 
                type="range" min="0" max="5000" value={ltv} 
                onChange={(e) => setLtv(Number(e.target.value))}
                className="w-full h-2 bg-black rounded-none appearance-none cursor-pointer"
              />
            </div>
            <div className="pt-4 border-t-2 border-black">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-60">LTV/CAC Ratio</p>
                  <p className={`text-3xl font-black ${(ltv/cac) >= 3 ? 'text-green-600' : 'text-red-600'}`}>
                    {(ltv / (cac || 1)).toFixed(1)}x
                  </p>
                </div>
                <p className="text-[10px] font-mono opacity-60 text-right">
                  {(ltv/cac) >= 3 ? 'HEALTHY // SCALE UP' : 'RISKY // OPTIMIZE'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Subscription Tier Builder */}
      <section className="paper-notebook p-8 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-white">
        <h3 className="text-2xl font-black uppercase flex items-center gap-3 mb-8">
          <Calculator size={32} />
          Tiered Pricing Builder
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Tier */}
          <div className="p-6 border-4 border-black bg-gray-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-black text-white px-3 py-1 text-[10px] font-bold uppercase">FREE</div>
            <h4 className="font-black text-xl mb-4 uppercase">Starter</h4>
            <ul className="space-y-2 text-sm mb-8">
              <li className="flex items-center gap-2"><Zap size={14} /> Basic Tools</li>
              <li className="flex items-center gap-2"><Zap size={14} /> 1 Project</li>
              <li className="flex items-center gap-2 opacity-30"><Zap size={14} /> Advanced AI</li>
            </ul>
            <p className="text-3xl font-black">$0<span className="text-sm font-normal">/mo</span></p>
          </div>
          {/* Pro Tier */}
          <div className="p-6 border-4 border-black bg-theme-accent shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] -translate-y-2">
            <div className="absolute top-0 right-0 bg-black text-white px-3 py-1 text-[10px] font-bold uppercase">POPULAR</div>
            <h4 className="font-black text-xl mb-4 uppercase">Professional</h4>
            <ul className="space-y-2 text-sm mb-8">
              <li className="flex items-center gap-2"><Zap size={14} /> All Tools</li>
              <li className="flex items-center gap-2"><Zap size={14} /> Unlimited Projects</li>
              <li className="flex items-center gap-2"><Zap size={14} /> Priority AI Support</li>
            </ul>
            <p className="text-3xl font-black">$29<span className="text-sm font-normal">/mo</span></p>
          </div>
          {/* Enterprise Tier */}
          <div className="p-6 border-4 border-black bg-black text-white">
            <h4 className="font-black text-xl mb-4 uppercase">Enterprise</h4>
            <ul className="space-y-2 text-sm mb-8">
              <li className="flex items-center gap-2"><Zap size={14} /> Custom Workflows</li>
              <li className="flex items-center gap-2"><Zap size={14} /> Team Collaboration</li>
              <li className="flex items-center gap-2"><Zap size={14} /> Dedicated Co-founder</li>
            </ul>
            <p className="text-3xl font-black">$99<span className="text-sm font-normal">/mo</span></p>
          </div>
        </div>
      </section>
    </div>
  );
}
