import React, { useState } from 'react';
import { generateSpeech, generateVideo, animateImage } from '../../lib/ai-tools';
import { Play, Video, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip } from '../Tooltip';

export const AIToolsTab: React.FC = () => {
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
            <img src={`data:${animateMimeType};base64,${animateImageBase64}`} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px', display: 'block' }} />
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

    </div>
  );
};
