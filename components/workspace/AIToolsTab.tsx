import React, { useState } from 'react';
import { generateSpeech, generateVideo, animateImage, thinkDeeply } from '../../lib/ai-tools';
import { Play, Video, Image as ImageIcon, Loader2, LayoutDashboard, Sparkles, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip } from '../Tooltip';
import { useUI } from '../../lib/state';
import { marked } from 'marked';

export const AIToolsTab: React.FC = () => {
  const { documentContent } = useUI();
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

  return (
    <div className="ai-tools-tab" style={{ padding: '20px', overflowY: 'auto', height: '100%' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>AI Co-Founder Tools</h2>
      <p style={{ marginBottom: '20px', color: 'var(--theme-text)', opacity: 0.7, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>POWERFUL TOOLS TO ACCELERATE YOUR STARTUP.</p>

      {/* Text to Speech */}
      <div className="tool-section" style={{ marginBottom: '40px', padding: '20px', border: '2px solid var(--theme-accent)', backgroundColor: 'var(--theme-surface)', boxShadow: '4px 4px 0px var(--theme-accent)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', marginBottom: '15px' }}><Play size={18} style={{ display: 'inline', marginRight: '8px' }} /> Generate Speech (TTS)</h3>
        <p style={{ fontSize: '12px', color: 'var(--theme-text)', marginBottom: '15px', fontFamily: 'var(--font-mono)' }}>CONVERT TEXT TO HIGH-QUALITY SPEECH USING GEMINI 2.5 FLASH TTS.</p>
        <textarea
          value={speechText}
          onChange={e => setSpeechText(e.target.value)}
          placeholder="ENTER TEXT TO SPEAK..."
          className="brutalist-textarea"
          style={{ width: '100%', minHeight: '80px', marginBottom: '15px' }}
        />
        <Tooltip content="Generate Speech from Text" position="top">
          <button
            onClick={handleGenerateSpeech}
            disabled={isGeneratingSpeech || !speechText.trim()}
            className={`brutalist-button ${isGeneratingSpeech || !speechText.trim() ? '' : 'primary'}`}
            style={{ width: '100%' }}
          >
            {isGeneratingSpeech ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {isGeneratingSpeech ? 'GENERATING...' : 'GENERATE SPEECH'}
          </button>
        </Tooltip>
        {speechUrl && (
          <div style={{ marginTop: '20px', border: '2px solid var(--theme-accent)', padding: '10px' }}>
            <audio src={speechUrl} controls style={{ width: '100%' }} />
          </div>
        )}
      </div>

      {/* Video Generation */}
      <div className="tool-section" style={{ marginBottom: '40px', padding: '20px', border: '2px solid var(--theme-accent)', backgroundColor: 'var(--theme-surface)', boxShadow: '4px 4px 0px var(--theme-accent)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', marginBottom: '15px' }}><Video size={18} style={{ display: 'inline', marginRight: '8px' }} /> Prompt-Based Video Generation</h3>
        <p style={{ fontSize: '12px', color: 'var(--theme-text)', marginBottom: '15px', fontFamily: 'var(--font-mono)' }}>GENERATE 16:9 VIDEOS USING VEO 3.1 FAST GENERATE.</p>
        <textarea
          value={videoPrompt}
          onChange={e => setVideoPrompt(e.target.value)}
          placeholder="DESCRIBE THE VIDEO YOU WANT TO GENERATE..."
          className="brutalist-textarea"
          style={{ width: '100%', minHeight: '80px', marginBottom: '15px' }}
        />
        <Tooltip content="Generate Video from Prompt" position="top">
          <button
            onClick={handleGenerateVideo}
            disabled={isGeneratingVideo || !videoPrompt.trim()}
            className={`brutalist-button ${isGeneratingVideo || !videoPrompt.trim() ? '' : 'primary'}`}
            style={{ width: '100%' }}
          >
            {isGeneratingVideo ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />}
            {isGeneratingVideo ? 'GENERATING VIDEO...' : 'GENERATE VIDEO'}
          </button>
        </Tooltip>
        {videoUrl && (
          <div style={{ marginTop: '20px', border: '2px solid var(--theme-accent)', boxShadow: '4px 4px 0px var(--theme-accent)' }}>
            <video src={videoUrl} controls style={{ width: '100%', display: 'block' }} />
          </div>
        )}
      </div>

      {/* Image Animation */}
      <div className="tool-section" style={{ marginBottom: '40px', padding: '20px', border: '2px solid var(--theme-accent)', backgroundColor: 'var(--theme-surface)', boxShadow: '4px 4px 0px var(--theme-accent)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', marginBottom: '15px' }}><ImageIcon size={18} style={{ display: 'inline', marginRight: '8px' }} /> Animate Images with Veo</h3>
        <p style={{ fontSize: '12px', color: 'var(--theme-text)', marginBottom: '15px', fontFamily: 'var(--font-mono)' }}>UPLOAD AN IMAGE AND DESCRIBE HOW TO ANIMATE IT.</p>
        
        <input type="file" accept="image/*" onChange={handleImageUpload} className="brutalist-input" style={{ marginBottom: '15px', width: '100%' }} />
        {animateImageBase64 && (
          <div style={{ marginBottom: '15px', border: '2px solid var(--theme-accent)', display: 'inline-block', padding: '4px' }}>
            <img src={`data:${animateMimeType};base64,${animateImageBase64}`} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px', display: 'block' }} referrerPolicy="no-referrer" />
          </div>
        )}
        
        <textarea
          value={animatePrompt}
          onChange={e => setAnimatePrompt(e.target.value)}
          placeholder="DESCRIBE HOW TO ANIMATE THE IMAGE..."
          className="brutalist-textarea"
          style={{ width: '100%', minHeight: '80px', marginBottom: '15px' }}
        />
        <Tooltip content="Animate Uploaded Image" position="top">
          <button
            onClick={handleAnimateImage}
            disabled={isAnimatingImage || !animatePrompt.trim() || !animateImageBase64}
            className={`brutalist-button ${isAnimatingImage || !animatePrompt.trim() || !animateImageBase64 ? '' : 'primary'}`}
            style={{ width: '100%' }}
          >
            {isAnimatingImage ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />}
            {isAnimatingImage ? 'ANIMATING IMAGE...' : 'ANIMATE IMAGE'}
          </button>
        </Tooltip>
        {animatedVideoUrl && (
          <div style={{ marginTop: '20px', border: '2px solid var(--theme-accent)', boxShadow: '4px 4px 0px var(--theme-accent)' }}>
            <video src={animatedVideoUrl} controls style={{ width: '100%', display: 'block' }} />
          </div>
        )}
      </div>

      {/* Pitch Deck Orchestrator */}
      <div className="tool-section" style={{ marginBottom: '40px', padding: '20px', border: '2px solid var(--theme-accent)', backgroundColor: 'var(--theme-surface)', boxShadow: '4px 4px 0px var(--theme-accent)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', marginBottom: '15px' }}><LayoutDashboard size={18} style={{ display: 'inline', marginRight: '8px' }} /> Pitch Deck Orchestrator</h3>
        <p style={{ fontSize: '12px', color: 'var(--theme-text)', marginBottom: '15px', fontFamily: 'var(--font-mono)' }}>GENERATE A PROFESSIONAL PITCH DECK OUTLINE AND SLIDE CONTENT BASED ON YOUR CURRENT PROJECT.</p>
        <Tooltip content="Generate Pitch Deck Outline" position="top">
          <button
            onClick={handleGeneratePitchDeck}
            disabled={isGeneratingPitchDeck || !documentContent.trim()}
            className={`brutalist-button ${isGeneratingPitchDeck || !documentContent.trim() ? '' : 'primary'}`}
            style={{ width: '100%' }}
          >
            {isGeneratingPitchDeck ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isGeneratingPitchDeck ? 'ORCHESTRATING...' : 'GENERATE PITCH DECK'}
          </button>
        </Tooltip>
        {pitchDeck && (
          <div style={{ marginTop: '20px', border: '2px solid var(--theme-accent)', padding: '15px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <div className="markdown-body" dangerouslySetInnerHTML={{ __html: marked.parse(pitchDeck) as string }} />
          </div>
        )}
      </div>

      {/* Competitor Intelligence Hub */}
      <div className="tool-section" style={{ marginBottom: '40px', padding: '20px', border: '2px solid var(--theme-accent)', backgroundColor: 'var(--theme-surface)', boxShadow: '4px 4px 0px var(--theme-accent)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', marginBottom: '15px' }}><Search size={18} style={{ display: 'inline', marginRight: '8px' }} /> Competitor Intelligence Hub</h3>
        <p style={{ fontSize: '12px', color: 'var(--theme-text)', marginBottom: '15px', fontFamily: 'var(--font-mono)' }}>ANALYZE YOUR COMPETITORS AND IDENTIFY YOUR UNIQUE VALUE PROPOSITION.</p>
        <input
          type="text"
          value={competitorQuery}
          onChange={e => setCompetitorQuery(e.target.value)}
          placeholder="ENTER COMPETITOR NAMES OR INDUSTRY..."
          className="brutalist-input"
          style={{ width: '100%', marginBottom: '15px' }}
        />
        <Tooltip content="Analyze Competitors" position="top">
          <button
            onClick={handleAnalyzeCompetitors}
            disabled={isAnalyzingCompetitors || !competitorQuery.trim()}
            className={`brutalist-button ${isAnalyzingCompetitors || !competitorQuery.trim() ? '' : 'primary'}`}
            style={{ width: '100%' }}
          >
            {isAnalyzingCompetitors ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {isAnalyzingCompetitors ? 'ANALYZING...' : 'ANALYZE COMPETITORS'}
          </button>
        </Tooltip>
        {competitorAnalysis && (
          <div style={{ marginTop: '20px', border: '2px solid var(--theme-accent)', padding: '15px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <div className="markdown-body" dangerouslySetInnerHTML={{ __html: marked.parse(competitorAnalysis) as string }} />
          </div>
        )}
      </div>

    </div>
  );
};
