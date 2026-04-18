import React, { useState } from 'react';
import { Shield, CheckSquare, Bell, FileText, AlertTriangle, Search, Plus, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

const BUSINESS_TYPES = [
  'Creator / Influencer',
  'E-commerce Seller',
  'Agency',
  'SaaS Founder',
  'Newsletter Operator',
  'Course Creator'
];

const COMPLIANCE_CHECKLISTS: Record<string, string[]> = {
  'Creator / Influencer': [
    'FTC Affiliate Disclosure on all posts',
    'AI-Generated Content Labeling',
    'Privacy Policy for link-in-bio',
    'Terms of Service for digital products',
    'GDPR/CCPA Cookie Consent'
  ],
  'E-commerce Seller': [
    'Refund & Return Policy',
    'Shipping Policy',
    'Sales Tax Nexus Review',
    'Product Safety Disclosures',
    'PCI Compliance for payments'
  ],
  'Agency': [
    'Client Service Agreement',
    'Data Processing Agreement (DPA)',
    'Sub-processor Disclosures',
    'Confidentiality (NDA) Clauses',
    'Liability Insurance Review'
  ],
  'SaaS Founder': [
    'Privacy Policy (GDPR/CCPA)',
    'Terms of Service',
    'SLA (Service Level Agreement)',
    'Security Policy',
    'Vulnerability Disclosure Program'
  ]
};

export default function ComplianceTab() {
  const [selectedType, setSelectedType] = useState(BUSINESS_TYPES[0]);
  const [reminders, setReminders] = useState([
    { id: '1', text: 'Renew Privacy Policy for 2026', date: '2026-05-01', urgent: true },
    { id: '2', text: 'Update Affiliate Disclosures on YouTube', date: '2026-04-20', urgent: false },
  ]);

  const checklists = COMPLIANCE_CHECKLISTS[selectedType] || COMPLIANCE_CHECKLISTS['SaaS Founder'];

  return (
    <div className="compliance-tab p-6 space-y-8">
      <header className="flex justify-between items-center border-b-4 border-black pb-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-2">
            <Shield size={32} />
            Compliance Protocol
          </h2>
          <p className="text-sm font-mono opacity-60 uppercase">Operational Guidance // Not Legal Advice</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Checklists */}
        <section className="paper-notebook p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold uppercase flex items-center gap-2">
              <CheckSquare size={24} />
              Compliance Checklists
            </h3>
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="brutalist-input py-1 px-2 text-xs"
            >
              {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <ul className="space-y-3">
            {checklists.map((item, i) => (
              <li key={i} className="flex items-start gap-3 p-3 bg-white border-2 border-black hover:translate-x-1 hover:-translate-y-1 transition-transform cursor-pointer">
                <input type="checkbox" className="mt-1 w-5 h-5 border-2 border-black rounded-none checked:bg-theme-accent appearance-none cursor-pointer" />
                <span className="font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Reminders */}
        <section className="paper-notebook p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-theme-surface">
          <h3 className="text-xl font-bold uppercase flex items-center gap-2 mb-6">
            <Bell size={24} />
            Policy Reminders
          </h3>
          <div className="space-y-4">
            {reminders.map(r => (
              <div key={r.id} className={`p-4 border-2 border-black flex justify-between items-center ${r.urgent ? 'bg-red-100' : 'bg-white'}`}>
                <div>
                  <p className="font-bold uppercase text-sm">{r.text}</p>
                  <p className="text-xs font-mono opacity-60">DUE: {r.date}</p>
                </div>
                {r.urgent && <AlertTriangle size={20} className="text-red-600 animate-pulse" />}
              </div>
            ))}
            <button className="w-full brutalist-button py-2 text-xs flex items-center justify-center gap-2">
              <Plus size={16} /> ADD REMINDER
            </button>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Disclosure Generator */}
        <section className="paper-notebook p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-xl font-bold uppercase flex items-center gap-2 mb-6">
            <FileText size={24} />
            Disclosure Generator
          </h3>
          <div className="space-y-4">
            <div className="input-group">
              <label className="input-label">Content Type</label>
              <select className="brutalist-input w-full">
                <option>Sponsored Social Post</option>
                <option>Affiliate Blog Link</option>
                <option>AI-Generated Image/Video</option>
                <option>Paid Partnership Video</option>
              </select>
            </div>
            <div className="p-4 bg-gray-50 border-2 border-dashed border-black font-mono text-sm">
              [AD] This post contains affiliate links. If you use these links to buy something we may earn a commission. Thanks.
            </div>
            <button className="brutalist-button w-full py-2">GENERATE DISCLOSURE</button>
          </div>
        </section>

        {/* Risk Alerts */}
        <section className="paper-notebook p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-yellow-50">
          <h3 className="text-xl font-bold uppercase flex items-center gap-2 mb-6">
            <AlertTriangle size={24} />
            Platform Risk Alerts
          </h3>
          <div className="space-y-4">
            <div className="p-3 border-2 border-black bg-white flex gap-3">
              <div className="bg-black text-white p-2 flex items-center justify-center">
                <span className="font-bold text-xs">NEW</span>
              </div>
              <div>
                <p className="font-bold text-sm uppercase">YouTube AI Disclosure Rule</p>
                <p className="text-xs opacity-70">Creators must now label realistic AI-generated content.</p>
              </div>
            </div>
            <div className="p-3 border-2 border-black bg-white flex gap-3">
              <div className="bg-black text-white p-2 flex items-center justify-center opacity-30">
                <span className="font-bold text-xs">OLD</span>
              </div>
              <div>
                <p className="font-bold text-sm uppercase">TikTok Music Licensing</p>
                <p className="text-xs opacity-70">Universal Music Group tracks removed from platform.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Audit Prompts */}
      <section className="paper-notebook p-8 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-black text-white">
        <h3 className="text-2xl font-black uppercase flex items-center gap-3 mb-6">
          <Search size={32} />
          Pre-Launch Audit
        </h3>
        <p className="mb-8 opacity-80 font-mono">Run these prompts through your AI Co-founder before publishing:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border-2 border-white/20 hover:border-theme-accent transition-colors cursor-pointer group">
            <p className="text-theme-accent font-bold mb-2 uppercase text-xs tracking-widest">PROMPT // 01</p>
            <p className="italic group-hover:text-theme-accent transition-colors">"Audit this landing page for dark patterns and ensure all pricing disclosures are clear and conspicuous."</p>
          </div>
          <div className="p-4 border-2 border-white/20 hover:border-theme-accent transition-colors cursor-pointer group">
            <p className="text-theme-accent font-bold mb-2 uppercase text-xs tracking-widest">PROMPT // 02</p>
            <p className="italic group-hover:text-theme-accent transition-colors">"Review this affiliate blog post. Are the disclosures placed correctly according to the latest FTC guidelines?"</p>
          </div>
          <div className="p-4 border-2 border-white/20 hover:border-theme-accent transition-colors cursor-pointer group">
            <p className="text-theme-accent font-bold mb-2 uppercase text-xs tracking-widest">PROMPT // 03</p>
            <p className="italic group-hover:text-theme-accent transition-colors">"Check this AI-generated marketing copy for potential trademark infringements or over-promises."</p>
          </div>
          <div className="p-4 border-2 border-white/20 hover:border-theme-accent transition-colors cursor-pointer group">
            <p className="text-theme-accent font-bold mb-2 uppercase text-xs tracking-widest">PROMPT // 04</p>
            <p className="italic group-hover:text-theme-accent transition-colors">"Does our privacy policy accurately reflect the data we are collecting through this new lead magnet?"</p>
          </div>
        </div>
      </section>
    </div>
  );
}
