import React, { useState } from 'react';
import { generateSpeech, generateVideo, animateImage, thinkDeeply, quickPolish, deepEnhance } from '../../lib/ai-tools';
import { Play, Video, Image as ImageIcon, Loader2, LayoutDashboard, Sparkles, Search, Wand2, BrainCircuit, Share2, ShieldAlert, Zap, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip } from '../Tooltip';
import { useUI } from '../../lib/state';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { motion, AnimatePresence } from 'motion/react';

export const AIToolsTab: React.FC = () => {
  const { documentContent, setDocumentContent, incrementChangeCount } = useUI();
  const [speechText, setSpeechText] = useState('');
  const [speechUrl, setSpeechUrl] = useState<string | null>(null);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);

  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  const [animatePrompt, setAnimatePrompt] = useState('');
  const [animateImageBase64, setAnimateImageBase64] = useState<string | null>(null);
  const [animateMimeType, setAnimateMimeType] = useState<string | null>(null);
  const [animatedVideoUrl, setAnimatedVideoUrl] = useState<string | null>(null);
  const [isAnimatingImage, setIsAnimatingImage] = useState(false);

  const [isGeneratingPitchDeck, setIsGeneratingPitchDeck] = useState(false);
  const [pitchDeck, setPitchDeck] = useState<string | null>(null);

  const [competitorQuery, setCompetitorQuery] = useState('');
  const [competitorAnalysis, setCompetitorAnalysis] = useState<string | null>(null);
  const [isAnalyzingCompetitors, setIsAnalyzingCompetitors] = useState(false);

  const [isPolishing, setIsPolishing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const [isGeneratingViral, setIsGeneratingViral] = useState(false);
  const [viralIdeas, setViralIdeas] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<'all' | 'creative' | 'strategic' | 'docs'>('all');

  const handleQuickPolish = async () => {
    if (!documentContent.trim()) return;
    setIsPolishing(true);
    try {
      const polished = await quickPolish(documentContent);
      setDocumentContent(polished);
      incrementChangeCount();
      toast.success('Document polished successfully!', { icon: '✨' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to polish document.');
    } finally {
      setIsPolishing(false);
    }
  };

  const handleDeepEnhance = async () => {
    if (!documentContent.trim()) return;
    setIsEnhancing(true);
    try {
      const enhanced = await deepEnhance(documentContent);
      setDocumentContent(enhanced);
      incrementChangeCount();
      toast.success('Document deeply enhanced!', { icon: '🧠' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to enhance document.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGeneratePitchDeck = async () => {
    if (!documentContent.trim()) return;
    setIsGeneratingPitchDeck(true);
    try {
      const prompt = `You are an expert pitch deck consultant. Based on the following business document, generate a professional 10-12 slide pitch deck outline. For each slide, provide a title, key bullet points, and a suggestion for a visual/illustration.
      
      Document Content:
      ${documentContent}
      
      Format your response in Markdown.`;
      const response = await thinkDeeply(prompt);
      setPitchDeck(response);
      toast.success('Pitch deck outline generated!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate pitch deck.');
    } finally {
      setIsGeneratingPitchDeck(false);
    }
  };

  const handleAnalyzeCompetitors = async () => {
    if (!competitorQuery.trim()) return;
    setIsAnalyzingCompetitors(true);
    try {
      const prompt = `You are a market intelligence analyst. Perform a deep competitive analysis for the following query: "${competitorQuery}". 
      Identify top 3-5 competitors, their strengths, weaknesses, and key differentiators. 
      Then, suggest a "Blue Ocean" strategy or a unique value proposition that a startup could use to win.
      Format your response in Markdown.`;
      const response = await thinkDeeply(prompt);
      setCompetitorAnalysis(response);
      toast.success('Competitor analysis complete!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to analyze competitors.');
    } finally {
      setIsAnalyzingCompetitors(false);
    }
  };

  const handleGenerateViralContent = async () => {
    if (!documentContent.trim()) return;
    setIsGeneratingViral(true);
    try {
      const prompt = `You are a viral growth hacker. Based on the following startup concept, generate 10 high-impact viral content ideas for TikTok, Reels, and X (formerly Twitter). 
      Include hooks, storyboards, and distribution strategies.
      
      Business Details:
      ${documentContent}
      
      Format your response in Markdown.`;
      const response = await thinkDeeply(prompt);
      setViralIdeas(response);
      toast.success('Viral strategy generated!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate viral content.');
    } finally {
      setIsGeneratingViral(false);
    }
  };

  const handleGenerateSpeech = async () => {
    if (!speechText.trim()) return;
    setIsGeneratingSpeech(true);
    try {
      const url = await generateSpeech(speechText);
      setSpeechUrl(url);
      toast.success('Speech generated successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate speech.');
    } finally {
      setIsGeneratingSpeech(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) return;
    setIsGeneratingVideo(true);
    try {
      const url = await generateVideo(videoPrompt);
      setVideoUrl(url);
      toast.success('Video generated successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate video.');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setAnimateImageBase64(base64);
      setAnimateMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleAnimateImage = async () => {
    if (!animatePrompt.trim() || !animateImageBase64 || !animateMimeType) return;
    setIsAnimatingImage(true);
    try {
      const url = await animateImage(animatePrompt, animateImageBase64, animateMimeType);
      setAnimatedVideoUrl(url);
      toast.success('Image animated successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to animate image.');
    } finally {
      setIsAnimatingImage(false);
    }
  };

  const filterTools = (category: typeof activeCategory) => {
    if (activeCategory === 'all') return true;
    return activeCategory === category;
  };

  return (
    <div className="ai-tools-tab p-6 pb-40 overflow-y-auto h-full scrollbar-hidden">
      <header className="mb-10">
        <h2 className="text-3xl font-display uppercase tracking-widest text-theme-accent mb-2">Neural_Engine_v2</h2>
        <p className="font-mono text-xs opacity-50 uppercase tracking-tighter">Accelerate your trajectory with Gemini-powered execution layers.</p>
        
        <div className="flex gap-4 mt-8 overflow-x-auto pb-2 border-b-2 border-theme-accent/20">
          {(['all', 'creative', 'strategic', 'docs'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                px-6 py-2 font-mono text-[10px] uppercase font-bold border-2 transition-all
                ${activeCategory === cat ? 'bg-theme-accent text-black border-black translate-x-1 -translate-y-1 shadow-[-4px_4px_0px_var(--theme-text)]' : 'border-theme-accent/30 text-theme-accent hover:border-theme-accent'}
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-12">
        {/* Document Enhancement Tools */}
        {filterTools('docs') && (
          <section className="bg-theme-surface border-4 border-black p-8 shadow-[8px_8px_0px_var(--theme-accent)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-black text-theme-accent">
                <Wand2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-display uppercase">Document Layers</h3>
                <p className="text-[10px] font-mono opacity-60">OPTIMIZE_INPUT_STRUCTURE_AND_VOICE</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={handleQuickPolish}
                disabled={isPolishing || isEnhancing || !documentContent.trim()}
                className="group p-6 border-2 border-black bg-white/5 hover:bg-theme-accent hover:text-black transition-all flex flex-col items-center text-center gap-4 relative overflow-hidden"
              >
                {isPolishing ? <Loader2 size={32} className="animate-spin" /> : <Sparkles size={32} className="group-hover:scale-110 transition-transform" />}
                <div className="z-10">
                  <span className="block font-display text-lg uppercase mb-1">QUICK POLISH</span>
                  <span className="block font-mono text-[9px] opacity-70">GRAMMAR // CLARITY // IMPACT</span>
                </div>
              </button>

              <button
                onClick={handleDeepEnhance}
                disabled={isPolishing || isEnhancing || !documentContent.trim()}
                className="group p-6 border-2 border-black bg-white/5 hover:bg-theme-accent hover:text-black transition-all flex flex-col items-center text-center gap-4 relative overflow-hidden"
              >
                {isEnhancing ? <Loader2 size={32} className="animate-spin" /> : <BrainCircuit size={32} className="group-hover:scale-110 transition-transform" />}
                <div className="z-10">
                  <span className="block font-display text-lg uppercase mb-1">DEEP ENHANCE</span>
                  <span className="block font-mono text-[9px] opacity-70">RESTRUCTURING // EXPANSION // DATA_DRIVEN</span>
                </div>
              </button>
            </div>
          </section>
        )}

        {/* Strategic Analysis */}
        {filterTools('strategic') && (
          <section className="bg-theme-surface border-4 border-black p-8 shadow-[8px_8px_0px_var(--theme-accent)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-black text-theme-accent">
                <Search size={24} />
              </div>
              <div>
                <h3 className="text-xl font-display uppercase">Strategic Core</h3>
                <p className="text-[10px] font-mono opacity-60">IDENTIFY_COMPETITIVE_EDGES_AND_MARKET_GAPS</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={competitorQuery}
                  onChange={e => setCompetitorQuery(e.target.value)}
                  placeholder="INDUSTRY OR COMPETITOR NAMES..."
                  className="flex-1 bg-black/20 border-2 border-black p-4 font-mono text-sm uppercase focus:outline-none focus:border-theme-accent"
                />
                <button
                  onClick={handleAnalyzeCompetitors}
                  disabled={isAnalyzingCompetitors || !competitorQuery.trim()}
                  className="bg-theme-accent text-black p-4 border-2 border-black hover:bg-white font-bold uppercase text-xs"
                >
                  {isAnalyzingCompetitors ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={handleGeneratePitchDeck}
                  disabled={isGeneratingPitchDeck || !documentContent.trim()}
                  className="p-4 border-2 border-black bg-white/5 hover:bg-theme-accent hover:text-black transition-all flex items-center gap-4"
                >
                  <LayoutDashboard size={20} />
                  <span className="font-display text-sm uppercase">PITCH DECK ORCHESTRATOR</span>
                </button>

                <button
                  onClick={handleGenerateViralContent}
                  disabled={isGeneratingViral || !documentContent.trim()}
                  className="p-4 border-2 border-black bg-white/5 hover:bg-theme-accent hover:text-black transition-all flex items-center gap-4"
                >
                  <Share2 size={20} />
                  <span className="font-display text-sm uppercase">VIRAL_GROWTH_ENGINE</span>
                </button>
              </div>

              {(competitorAnalysis || pitchDeck || viralIdeas) && (
                <div className="mt-8 p-6 bg-black text-theme-accent border-2 border-theme-accent overflow-auto max-h-[500px] scrollbar-brutalist">
                  <div className="markdown-body">
                    <MarkdownRenderer content={competitorAnalysis || pitchDeck || viralIdeas || ''} />
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Creative Assets */}
        {filterTools('creative') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Speech Generation */}
            <section className="bg-theme-surface border-4 border-black p-8 shadow-[8px_8px_0px_var(--theme-accent)]">
              <h4 className="flex items-center gap-2 font-display uppercase mb-6"><Play size={18} /> VOCAL_SYNTHESIS</h4>
              <textarea
                value={speechText}
                onChange={e => setSpeechText(e.target.value)}
                placeholder="INPUT_VOICE_OVER_TEXT..."
                className="w-full bg-black/10 border-2 border-black p-4 font-mono text-xs mb-4 min-h-[120px] focus:outline-none"
              />
              <button
                onClick={handleGenerateSpeech}
                disabled={isGeneratingSpeech || !speechText.trim()}
                className="w-full bg-black text-theme-accent p-4 border-2 border-black hover:bg-theme-accent hover:text-black font-bold uppercase transition-all"
              >
                {isGeneratingSpeech ? 'GENERATING...' : 'GENERATE AUDIO'}
              </button>
              {speechUrl && (
                <div className="mt-6 border-2 border-black p-2 bg-white/5">
                  <audio src={speechUrl} controls className="w-full h-8" />
                </div>
              )}
            </section>

            {/* Video Generation */}
            <section className="bg-theme-surface border-4 border-black p-8 shadow-[8px_8px_0px_var(--theme-accent)]">
              <h4 className="flex items-center gap-2 font-display uppercase mb-6"><Video size={18} /> CINEMATIC_GEN</h4>
              <textarea
                value={videoPrompt}
                onChange={e => setVideoPrompt(e.target.value)}
                placeholder="DESCRIBE_THE_SCENE..."
                className="w-full bg-black/10 border-2 border-black p-4 font-mono text-xs mb-4 min-h-[120px] focus:outline-none"
              />
              <button
                onClick={handleGenerateVideo}
                disabled={isGeneratingVideo || !videoPrompt.trim()}
                className="w-full bg-black text-theme-accent p-4 border-2 border-black hover:bg-theme-accent hover:text-black font-bold uppercase transition-all"
              >
                {isGeneratingVideo ? 'PROCESSING...' : 'GENERATE VIDEO'}
              </button>
              {videoUrl && (
                <div className="mt-6 border-4 border-black bg-black">
                  <video src={videoUrl} controls className="w-full" />
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
