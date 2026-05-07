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
    <div className="marketing-tab p-6 max-w-5xl mx-auto space-y-8 pb-32 overflow-y-auto h-full scrollbar-brutalist">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Megaphone size={24} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Marketing & Launch Kit</h2>
        </div>
        <p className="text-muted-foreground">Turn your business ideas into high-converting marketing assets instantly.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ASSETS.map((asset) => (
          <div 
            key={asset.id}
            className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
          >
            <div className="p-6 border-b border-border bg-muted/20">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-background rounded-lg border border-border text-primary">
                  {asset.icon}
                </div>
                <button
                  onClick={() => handleGenerate(asset)}
                  disabled={!!isGenerating}
                  className={c(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                    isGenerating === asset.id 
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:opacity-90 shadow-[3px_3px_0px_rgba(0,0,0,0.2)] active:translate-y-0.5 active:shadow-none"
                  )}
                >
                  {isGenerating === asset.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  {isGenerating === asset.id ? 'Generating...' : 'Generate'}
                </button>
              </div>
              <h3 className="text-lg font-bold mb-1">{asset.title}</h3>
              <p className="text-sm text-muted-foreground">{asset.description}</p>
            </div>

            <div className="flex-1 p-6 bg-background/50 relative min-h-[200px]">
              <AnimatePresence mode="wait">
                {generatedContent[asset.id] ? (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="prose prose-sm prose-invert max-w-none"
                  >
                    <div className="absolute top-4 right-4 z-10">
                      <button
                        onClick={() => copyToClipboard(asset.id, generatedContent[asset.id])}
                        className="p-2 bg-muted hover:bg-muted/80 rounded-md transition-colors"
                      >
                        {copiedId === asset.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed pr-8">
                      {generatedContent[asset.id]}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    className="h-full flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Send size={20} className="text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                      Ready to generate
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Rocket size={20} className="text-primary" />
            Ready to Launch?
          </h3>
          <p className="text-sm text-muted-foreground">
            Use these assets to announce your project to the world. Consistency is key for solo founders.
          </p>
        </div>
        <button 
          onClick={() => toast.info('More launch tools coming soon!')}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.2)]"
        >
          Explore More Tools
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
