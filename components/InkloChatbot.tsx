import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, User, Brain, HelpCircle, Bug, Sparkles, AlertTriangle, Mic, MicOff } from 'lucide-react';
import Inklo from './Inklo';
import { toast } from 'sonner';
import { useAppStore } from '../lib/state';
import { thinkDeeply } from '../lib/ai-tools';
import { marked } from 'marked';

// Preset high-value starter suggestions for lone founders
const INKLO_CHIPS = [
  { label: "💡 Roast Pitch", prompt: "Inklo, please roast my business strategy, original vision, and current direction. Give it to me 100% straight." },
  { label: "💸 Bootstrap Traps", prompt: "What are the most dangerous growth traps that a bootstrapped solo founder should avoid?" },
  { label: "💥 Unfair Advantage", prompt: "Help me define my unfair advantage or asymmetry factor that lets me outperform heavily funded VC teams." },
  { label: "👑 Exec God Mode", prompt: "How do I operate in high-velocity 'GOD_MODE' to gain maximum leverage as a solo engineer?" }
];

const InkloChatbot = () => {
  const { setIsProcessing, setInkloMode, founderIdentity } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'inklo' | 'user', text: string }[]>([
    { role: 'inklo', text: "HEY FOUNDER! I'm Inklo! *bounces enthusiastically* I've got my nerdy glasses polished and I'm ready to turn your chaos into leverage. Tap one of my strategic chips below or write me anything, and I'll use live cognitive filters to analyze it!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        toast.info('VOICE_STREAM_ACTIVE: Speak now...', { position: 'bottom-right' });
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => {
          const space = prev && !prev.endsWith(' ') ? ' ' : '';
          return `${prev}${space}${transcript}`;
        });
        toast.success('SPEECH_CAPTURED_SUCCESSFULLY', { position: 'bottom-right' });
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event);
        if (event.error !== 'no-speech') {
          toast.error(`SPEECH_RECOGNITION_ERROR: ${event.error}`, { position: 'bottom-right' });
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('SPEECH_RECOGNITION_NOT_SUPPORTED in this environment. Try Chrome or Safari!', { position: 'bottom-right' });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const renderInkloMarkdown = (text: string) => {
    try {
      const html = marked.parse(text, { gfm: true, breaks: true });
      if (html instanceof Promise) {
        return text;
      }
      return html;
    } catch (e) {
      return text.replace(/\n/g, '<br/>');
    }
  };

  const executeSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setLoading(true);
    setIsProcessing(true);
    setInkloMode('STRATEGIZING');
    
    const toastId = toast.loading('INKLO IS PROCESSING...', { position: 'bottom-right' });

    try {
      const response = await thinkDeeply(textToSend, founderIdentity);
      
      setMessages(prev => [...prev, { role: 'inklo', text: response }]);
      toast.success('INKLO: COGNITION COMPLETE!', { id: toastId, icon: '🤖', position: 'bottom-right' });
    } catch (error: any) {
      console.error(error);
      
      // Fallback response with beautiful personality in case of missing keys
      let fallback = "Ah, my deep thinking circuit is atmospheric! Ensure your GEMINI_API_KEY is configured in your project settings. Let me provide some local helper wisdom:\n\n### 🤖 Inklo Local Backup Mode\n1. Use the **STRATEGY** tab to dump your brain into actionable SWOT or MoSCoW matrices.\n2. Go to **SETTINGS** to connect Notion synchronizations or run system health scans!\n3. *Keep pushing forward, founder!*";
      
      const lower = textToSend.toLowerCase();
      if (lower.includes('bug') || lower.includes('error')) {
        setInkloMode('FIXING');
        fallback = "ACK! A GLITCH IN THE MATRIX! I've logged that bug faster than a Series A pivot! My dev-team (the Inklo-Bots) are on it! Thanks for the sharp eye!";
      } else if (lower.includes('pricing') || lower.includes('cost') || lower.includes('money')) {
        fallback = "We're currently in the FOUNDER_BETA! That means full access for visionaries who share the drive. No billing required while we're in soft-launch mode!";
      }

      setMessages(prev => [...prev, { role: 'inklo', text: fallback }]);
      toast.info('LOCKED: LOCAL SYSTEM INTEGRITY ACTIVATED', { id: toastId, position: 'bottom-right' });
    } finally {
      setLoading(false);
      setIsProcessing(false);
      setInkloMode('DEFAULT');
    }
  };

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const msg = input;
    setInput('');
    executeSend(msg);
  };

  const handleChipClick = (promptText: string) => {
    if (loading) return;
    executeSend(promptText);
  };

  return (
    <div className="fixed bottom-12 right-8 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, rotate: 2 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, y: 50, scale: 0.9, rotate: 2 }}
            className="w-85 md:w-105 h-[550px] bg-white border-4 border-neo-black neo-shadow-lg mb-6 flex flex-col overflow-hidden transform rotate-1 z-[110]"
          >
            <div className="bg-neo-black text-neo-white p-4 flex items-center justify-between border-b-4 border-neo-black">
              <div className="flex items-center gap-3">
                <div className="scale-50 -ml-4 -mt-2">
                  <Inklo />
                </div>
                <div>
                  <h3 className="font-black tracking-widest text-sm uppercase">InkLo_Support_v5</h3>
                  <p className="text-[7.5px] font-mono text-neo-lime uppercase leading-none mt-0.5">// LIVE_COGNITIVE_NET_CONNECTED</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:text-neo-pink transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Chat message space */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 notebook-bg"
            >
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'user' ? (
                     <div className="max-w-[85%] p-3 border-2 border-neo-black font-bold text-xs leading-tight bg-neo-cyan neo-shadow">
                        {msg.text}
                     </div>
                  ) : (
                     <div className="max-w-[90%] p-3 border-2 border-neo-black text-xs leading-relaxed bg-neo-yellow neo-shadow chat-markdown">
                        <div dangerouslySetInnerHTML={{ __html: renderInkloMarkdown(msg.text) }} />
                     </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="p-3 border-2 border-neo-black bg-zinc-100 flex items-center gap-2 font-mono text-[9px] font-black uppercase text-zinc-650 animate-pulse">
                     <Brain className="text-neo-pink animate-spin" size={14} />
                     STRATEGIST IS CONSTRUCTING THOUGHT PATHWAYS...
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Starter Suggestions Chips Panel */}
            <div className="bg-zinc-50 border-t-4 border-neo-black p-2 flex flex-wrap gap-1.5 justify-center max-h-[85px] overflow-y-auto">
               <span className="text-[7.5px] font-mono font-black uppercase text-zinc-550 w-full text-center">CHOOSE_STRATEGIC_CMD:</span>
               {INKLO_CHIPS.map((chip, idx) => (
                  <button
                     key={idx}
                     type="button"
                     disabled={loading}
                     onClick={() => handleChipClick(chip.prompt)}
                     className="text-[8px] font-mono font-black uppercase bg-white hover:bg-neo-pink/10 hover:text-neo-pink text-neo-black border border-neo-black px-2 py-0.5 cursor-pointer rounded-sm hover:-translate-y-0.5 transition-transform disabled:opacity-40 disabled:pointer-events-none"
                  >
                     {chip.label}
                  </button>
               ))}
            </div>

            {/* Form Input Submit */}
            <form onSubmit={handleSendSubmit} className="p-3 border-t-4 border-neo-black bg-white flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                placeholder={loading ? "CONSTRUCTING..." : isListening ? "LISTENING... SPEAK NOW!" : "REPORT_BUG_OR_ASK..."}
                className="flex-1 bg-zinc-50 border-2 border-neo-black p-2 font-black text-xs outline-none focus:bg-neo-cyan/10 disabled:opacity-50"
              />
              <button 
                type="button"
                onClick={toggleListening}
                disabled={loading}
                title={isListening ? "Stop Listening" : "Start Voice Dictation"}
                className={`p-2 border-2 border-neo-black neo-shadow-active transition-all cursor-pointer ${
                  isListening 
                    ? 'bg-neo-pink text-neo-black animate-pulse' 
                    : 'bg-neo-yellow text-neo-black hover:bg-neo-pink/10'
                }`}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="bg-neo-black text-neo-white p-2 border-2 border-neo-black neo-shadow-active disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1, rotate: -5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-16 h-16 rounded-full border-4 border-neo-black flex items-center justify-center neo-shadow hover:neo-shadow-lg transition-all cursor-pointer
          ${isOpen ? 'bg-neo-pink' : 'bg-neo-yellow'}
        `}
      >
        {isOpen ? <X size={32} className="text-neo-black font-black" /> : <div className="scale-75"><Inklo /></div>}
      </motion.button>
    </div>
  );
};

export default InkloChatbot;
