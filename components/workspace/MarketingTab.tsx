import React, { useState } from 'react';
import { useUI, useUser } from '../../lib/state';
import { 
  Megaphone, 
  Send, 
  Layout, 
  Mail, 
  Share2, 
  Loader2, 
  Sparkles, 
  Copy, 
  Check,
  Rocket,
  ArrowRight
} from 'lucide-react';
import { thinkDeeply } from '../../lib/ai-tools';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import c from 'classnames';
import { MarkdownRenderer } from '../MarkdownRenderer';

interface MarketingAsset {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  prompt: string;
}

const ASSETS: MarketingAsset[] = [
  {
    id: 'social_countdown',
    title: '7-Day Social Countdown',
    description: 'A series of 7 posts to build hype before your launch.',
    icon: <Share2 size={20} />,
    prompt: 'Generate a 7-day social media countdown campaign. For each day, provide a catchy headline, the main post body, and 3 relevant hashtags. Focus on building curiosity and excitement.'
  },
  {
    id: 'email_waitlist',
    title: 'Waitlist Email Sequence',
    description: '3 emails to nurture leads and convert them at launch.',
    icon: <Mail size={20} />,
    prompt: 'Generate a 3-email waitlist nurture sequence. Email 1: Welcome & The Problem. Email 2: The Solution & Benefits. Email 3: The Launch Announcement & Call to Action. Make them personal and persuasive.'
  },
  {
    id: 'landing_hero',
    title: 'Landing Page Hero Section',
    description: '3 high-converting variants for your website header.',
    icon: <Layout size={20} />,
    prompt: 'Generate 3 different variants for a landing page hero section. Each variant should include a bold H1 headline, a supportive sub-headline, and a primary Call to Action (CTA) button text. Focus on different value propositions: speed, cost-savings, and ease of use.'
  },
  {
    id: 'product_hunt',
    title: 'Product Hunt Launch Kit',
    description: 'Tagline, description, and first comment for PH.',
    icon: <Rocket size={20} />,
    prompt: 'Generate a Product Hunt launch kit. Include a punchy tagline (max 60 chars), a compelling description (max 260 chars), and a thoughtful "maker\'s first comment" that explains the "why" behind the product.'
  }
];

export default function MarketingTab() {
  const { documentContent } = useUI();
  const { name, topic, info } = useUser();
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleGenerate = async (asset: MarketingAsset) => {
    if (!documentContent.trim()) {
      toast.error('Please add some content to your project document first.');
      return;
    }

    setIsGenerating(asset.id);
    try {
      const context = `
        Project Name: ${name || 'Untitled Project'}
        Topic: ${topic || 'General Startup'}
        Founder Background: ${info || 'Not specified'}
        Project Document:
        ---
        ${documentContent}
        ---
      `;

      const fullPrompt = `
        ${context}
        
        Act as a world-class growth marketer. Based on the project details above, ${asset.prompt}
        
        Format the output in clean Markdown. Use headings, lists, and bold text for readability.
      `;

      const result = await thinkDeeply(fullPrompt);
      setGeneratedContent(prev => ({ ...prev, [asset.id]: result }));
      toast.success(`${asset.title} generated!`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate marketing assets.');
    } finally {
      setIsGenerating(null);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="marketing-tab scrollbar-brutalist" style={{ padding: '40px', overflowY: 'auto', height: '100%', backgroundColor: 'var(--theme-bg)' }}>
      <div style={{ marginBottom: '48px', borderLeft: '8px solid var(--theme-accent-secondary)', paddingLeft: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-2px', margin: 0 }}>
          Growth Engine
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Viral generation suite & high-velocity launch kit.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px', marginBottom: '48px' }}>
        {ASSETS.map((asset) => (
          <div 
            key={asset.id}
            style={{ 
              backgroundColor: 'var(--theme-surface)', 
              border: '4px solid #000', 
              boxShadow: '8px 8px 0px #000',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.2s',
              position: 'relative'
            }}
          >
            <div style={{ padding: '24px', borderBottom: '2px solid #000', backgroundColor: 'var(--theme-surface-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ padding: '12px', background: '#000', color: 'var(--theme-accent)', border: '2px solid var(--theme-accent)' }}>
                  {asset.icon}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '18px', margin: 0 }}>{asset.title}</h3>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', margin: 0, opacity: 0.6 }}>{asset.description}</p>
                </div>
              </div>
              <button
                onClick={() => handleGenerate(asset)}
                disabled={!!isGenerating}
                className={`brutalist-button ${isGenerating === asset.id ? '' : 'primary'}`}
                style={{ padding: '8px 16px', fontSize: '11px' }}
              >
                {isGenerating === asset.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                <span style={{ marginLeft: '8px' }}>{isGenerating === asset.id ? 'COOKING...' : 'GENERATE'}</span>
              </button>
            </div>

            <div style={{ flex: 1, padding: '24px', backgroundColor: '#fff', position: 'relative', minHeight: '250px', maxHeight: '400px', overflowY: 'auto' }} className="scrollbar-brutalist">
              <AnimatePresence mode="wait">
                {generatedContent[asset.id] ? (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    style={{ position: 'relative' }}
                  >
                    <div style={{ position: 'sticky', top: 0, right: 0, display: 'flex', justifyContent: 'flex-end', zIndex: 10 }}>
                      <button
                        onClick={() => copyToClipboard(asset.id, generatedContent[asset.id])}
                        style={{ background: 'var(--theme-accent)', border: '2px solid #000', padding: '8px', cursor: 'pointer', boxShadow: '2px 2px 0px #000' }}
                      >
                        {copiedId === asset.id ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                    <div style={{ paddingRight: '40px' }}>
                      <MarkdownRenderer content={generatedContent[asset.id]} />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '16px' }}
                  >
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--theme-surface-light)', border: '2px dashed #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Send size={20} style={{ opacity: 0.4 }} />
                    </div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                      Awaiting deployment...
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 bg-[#a855f7] border-4 border-black shadow-[12px_12px_0px_#000]">
        <div style={{ color: '#000' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Rocket size={24} />
            Ready to Launch?
          </h3>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', margin: 0, fontWeight: 700 }}>
            Consistency is the only competitive advantage you can control. Stick to the sequence.
          </p>
        </div>
        <button 
          onClick={() => toast.info('Advanced distribution hacks arriving in v2.0')}
          className="brutalist-button"
          style={{ backgroundColor: '#fff', color: '#000', padding: '16px 32px', fontSize: '14px' }}
        >
          GO PREMIUM
          <ArrowRight size={20} style={{ marginLeft: '12px' }} />
        </button>
      </div>
    </div>
  );
}
