import React, { useState } from 'react';
import { generateSpeech, generateVideo, animateImage } from '../../../lib/ai-tools';
import { Play, Video, Image as ImageIcon, Loader2 } from 'lucide-react';

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
    } catch (error) {
      console.error(error);
      alert('Failed to generate speech.');
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
    } catch (error) {
      console.error(error);
      alert('Failed to generate video.');
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
    } catch (error) {
      console.error(error);
      alert('Failed to animate image.');
    } finally {
      setIsAnimatingImage(false);
    }
  };

  return (
    <div className="ai-tools-tab" style={{ padding: '20px', overflowY: 'auto', height: '100%' }}>
      <h2>AI Co-Founder Tools</h2>
      <p style={{ marginBottom: '20px', color: '#666' }}>Powerful tools to accelerate your startup.</p>

      {/* Text to Speech */}
      <div className="tool-section" style={{ marginBottom: '40px', padding: '20px', border: '1px solid #eee', borderRadius: '12px' }}>
        <h3><Play size={18} style={{ display: 'inline', marginRight: '8px' }} /> Generate Speech (TTS)</h3>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>Convert text to high-quality speech using Gemini 2.5 Flash TTS.</p>
        <textarea
          value={speechText}
          onChange={e => setSpeechText(e.target.value)}
          placeholder="Enter text to speak..."
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', minHeight: '80px', marginBottom: '10px' }}
        />
        <button
          onClick={handleGenerateSpeech}
          disabled={isGeneratingSpeech || !speechText.trim()}
          style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {isGeneratingSpeech ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          {isGeneratingSpeech ? 'Generating...' : 'Generate Speech'}
        </button>
        {speechUrl && (
          <div style={{ marginTop: '15px' }}>
            <audio src={speechUrl} controls style={{ width: '100%' }} />
          </div>
        )}
      </div>

      {/* Video Generation */}
      <div className="tool-section" style={{ marginBottom: '40px', padding: '20px', border: '1px solid #eee', borderRadius: '12px' }}>
        <h3><Video size={18} style={{ display: 'inline', marginRight: '8px' }} /> Prompt-Based Video Generation</h3>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>Generate 16:9 videos using Veo 3.1 Fast Generate.</p>
        <textarea
          value={videoPrompt}
          onChange={e => setVideoPrompt(e.target.value)}
          placeholder="Describe the video you want to generate..."
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', minHeight: '80px', marginBottom: '10px' }}
        />
        <button
          onClick={handleGenerateVideo}
          disabled={isGeneratingVideo || !videoPrompt.trim()}
          style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {isGeneratingVideo ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />}
          {isGeneratingVideo ? 'Generating Video (This may take a few minutes)...' : 'Generate Video'}
        </button>
        {videoUrl && (
          <div style={{ marginTop: '15px' }}>
            <video src={videoUrl} controls style={{ width: '100%', borderRadius: '8px' }} />
          </div>
        )}
      </div>

      {/* Image Animation */}
      <div className="tool-section" style={{ marginBottom: '40px', padding: '20px', border: '1px solid #eee', borderRadius: '12px' }}>
        <h3><ImageIcon size={18} style={{ display: 'inline', marginRight: '8px' }} /> Animate Images with Veo</h3>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>Upload an image and describe how to animate it.</p>
        
        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ marginBottom: '10px', display: 'block' }} />
        {animateImageBase64 && (
          <img src={`data:${animateMimeType};base64,${animateImageBase64}`} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', marginBottom: '10px' }} />
        )}
        
        <textarea
          value={animatePrompt}
          onChange={e => setAnimatePrompt(e.target.value)}
          placeholder="Describe how to animate the image..."
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', minHeight: '80px', marginBottom: '10px' }}
        />
        <button
          onClick={handleAnimateImage}
          disabled={isAnimatingImage || !animatePrompt.trim() || !animateImageBase64}
          style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {isAnimatingImage ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />}
          {isAnimatingImage ? 'Animating Image (This may take a few minutes)...' : 'Animate Image'}
        </button>
        {animatedVideoUrl && (
          <div style={{ marginTop: '15px' }}>
            <video src={animatedVideoUrl} controls style={{ width: '100%', borderRadius: '8px' }} />
          </div>
        )}
      </div>

    </div>
  );
};
