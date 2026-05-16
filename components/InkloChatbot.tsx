import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, User, Brain, HelpCircle, Bug, Sparkles } from 'lucide-react';
import Inklo from './Inklo';
import { toast } from 'sonner';
import { useAppStore } from '../lib/state';

const InkloChatbot = () => {
  const { setIsProcessing, setInkloMode } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'inklo' | 'user', text: string }[]>([
    { role: 'inklo', text: "HEY FOUNDER! I'm Inklo! *bounces enthusiastically* I've got my nerdy glasses polished and I'm ready to turn your chaos into leverage. Need a hand with the strategy engine?" }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setIsProcessing(true);
    setInkloMode('STRATEGIZING');
    
    // Friendly, nerdy response logic
    setTimeout(() => {
      let response = "Interesting! My cognitive circuits are firing! *adjusts glasses* I'm processing that through the Inklo_Net filters. What else is on your mind, founder?";
      
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes('bug') || lowerInput.includes('error')) {
        setInkloMode('FIXING');
        response = "ACK! A GLITCH IN THE MATRIX! I've logged that bug faster than a Series A pivot! My dev-team (the Inklo-Bots) are on it! Thanks for the sharp eye!";
      } else if (lowerInput.includes('pricing') || lowerInput.includes('cost') || lowerInput.includes('money')) {
        response = "We're currently in the FOUNDER_BETA! That means full access for visions who share the drive. No credits needed while we're in soft-launch mode!";
      } else if (lowerInput.includes('help') || lowerInput.includes('how') || lowerInput.includes('where')) {
        response = "It's easy-peasy! Use STRATEGY to dump your brain, MARKET to find your loop, and KEYNOTE to polish it into a masterpiece! I'm here at every step!";
      } else if (lowerInput.includes('strategy')) {
        response = "Strategy is my specialty! *bounces* We use a Grounded AI model to ensure your plans aren't just fluff, but real, battle-tested leverage!";
      } else if (lowerInput.includes('build') || lowerInput.includes('create')) {
        setInkloMode('BUILDING');
      }

      setMessages(prev => [...prev, { role: 'inklo', text: response }]);
      setIsProcessing(false);
      // Wait a bit before resetting mode to see the accessory in the chat
      setTimeout(() => setInkloMode('DEFAULT'), 2000);

      toast.success('INKLO: RESPONSE DISPATCHED', { 
        position: 'bottom-right',
        icon: '🤖'
      });
    }, 1500);

    setInput('');
  };

  return (
    <div className="fixed bottom-12 right-8 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, rotate: 2 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, y: 50, scale: 0.9, rotate: 2 }}
            className="w-80 md:w-96 h-[500px] bg-white border-4 border-neo-black neo-shadow-lg mb-6 flex flex-col overflow-hidden transform rotate-1"
          >
            <div className="bg-neo-black text-neo-white p-4 flex items-center justify-between border-b-4 border-neo-black">
              <div className="flex items-center gap-3">
                <div className="scale-50 -ml-4 -mt-2">
                  <Inklo />
                </div>
                <h3 className="font-black tracking-widest text-sm uppercase">InkLo_Support_v5</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:text-neo-pink transition-colors">
                <X size={20} />
              </button>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 notebook-bg"
            >
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`
                    max-w-[80%] p-3 border-2 border-neo-black font-bold text-xs leading-tight
                    ${msg.role === 'user' ? 'bg-neo-cyan neo-shadow' : 'bg-neo-yellow neo-shadow'}
                  `}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t-4 border-neo-black bg-white flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="REPORT_BUG_OR_ASK..."
                className="flex-1 bg-zinc-50 border-2 border-neo-black p-2 font-black text-xs outline-none focus:bg-neo-cyan/10"
              />
              <button type="submit" className="bg-neo-black text-neo-white p-2 border-2 border-neo-black neo-shadow-active">
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
          w-16 h-16 rounded-full border-4 border-neo-black flex items-center justify-center neo-shadow hover:neo-shadow-lg transition-all
          ${isOpen ? 'bg-neo-pink' : 'bg-neo-yellow'}
        `}
      >
        {isOpen ? <X size={32} /> : <div className="scale-75"><Inklo /></div>}
      </motion.button>
    </div>
  );
};

export default InkloChatbot;
