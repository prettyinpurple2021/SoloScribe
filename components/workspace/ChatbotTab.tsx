import React, { useState, useRef, useEffect } from 'react';
import { useUI, useUser } from '../../lib/state';
import { thinkDeeply } from '../../lib/ai-tools';
import { Send, User, Bot, Sparkles, RefreshCcw, Trash2 } from 'lucide-react';
import { Tooltip } from '../Tooltip';
import { motion, AnimatePresence } from 'motion/react';
import { MarkdownRenderer } from '../MarkdownRenderer';

export const ChatbotTab: React.FC = () => {
  const { documentContent } = useUI();
  const { name, info, topic } = useUser();
  const [messages, setMessages] = useState<{ role: 'user' | 'agent'; text: string; timestamp: Date }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const chatHistory = messages.slice(-5).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
      const systemContext = `You are a strategic InkLo, a co-founder AI partner. 
User Name: ${name || 'User'}
User Background: ${info || 'None'}
Current Topic: ${topic || 'Not specified'}
Current Document State:
---
${documentContent}
---
Use this context to provide highly relevant and strategic advice. Be concise, bold, and helpful.`;

      const prompt = `${systemContext}\n\nChat History:\n${chatHistory}\nUser: ${userMessage}\nAssistant:`;
      
      const response = await thinkDeeply(prompt);
      setMessages(prev => [...prev, { role: 'agent', text: response, timestamp: new Date() }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'agent', text: 'ERROR: CONNECTION_FAILED. RETRYING_IN_0ms...', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm('Clear all session messages?')) {
      setMessages([]);
    }
  };

  return (
    <div className="chatbot-tab flex flex-col h-full p-6 pb-32">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-display uppercase tracking-widest text-theme-accent">Terminal_InkLo</h2>
          <p className="text-[10px] font-mono opacity-50">v5.5 // ACTIVE_SESSION</p>
        </div>
        <div className="flex gap-2">
          <Tooltip content="Clear Console" position="bottom">
            <button 
              onClick={clearChat}
              className="p-2 border-2 border-theme-accent hover:bg-theme-accent hover:text-black transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </Tooltip>
        </div>
      </header>

      <div className="chat-messages flex-1 overflow-y-auto mb-6 flex flex-col gap-6 scrollbar-brutalist pr-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-30 text-center py-20">
            <Bot size={64} className="mb-4" />
            <h3 className="font-display text-2xl uppercase italic">Waiting for Input...</h3>
            <p className="font-mono text-xs max-w-xs mt-4">ESTABLISHING_LINK_WITH_SUBCONSCIOUS... SYSTEM_STATUS: READY</p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`p-2 h-10 w-10 border-2 border-black flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-theme-accent text-black' : 'bg-black text-theme-accent'}`}>
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className={`relative group max-w-[85%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`
                    p-4 border-2 border-black font-mono text-sm leading-relaxed
                    ${msg.role === 'user' ? 'bg-theme-accent/10 border-theme-accent/30' : 'bg-theme-surface border-theme-accent shadow-[4px_4px_0px_var(--theme-accent)]'}
                  `}>
                    <MarkdownRenderer content={msg.text} />
                  </div>
                  <div className="mt-1 text-[8px] opacity-30 font-mono tracking-tighter">
                    {msg.timestamp.toLocaleTimeString()} // {msg.role.toUpperCase()}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        {isLoading && (
          <div className="flex gap-4 animate-pulse">
            <div className="p-2 h-10 w-10 border-2 border-black bg-black text-theme-accent flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div className="p-4 border-2 border-theme-accent bg-theme-surface shadow-[4px_4px_0px_var(--theme-accent)] font-mono text-[10px] italic">
              THINKING_DEEPLY... CONSULTING_GEMINI_MODELS...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-container bg-black p-1 border-t-4 border-theme-accent">
        <div className="flex gap-1">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="TYPE COMMAND OR QUERY..."
            className="flex-1 bg-transparent border-2 border-white/10 p-4 font-mono text-sm uppercase text-theme-accent focus:outline-none focus:border-theme-accent transition-colors"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-theme-accent text-black p-4 border-2 border-black hover:bg-white transition-colors disabled:opacity-50"
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};
