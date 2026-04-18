import React, { useState, useRef, useEffect } from 'react';
import { useUI, useUser } from '../../lib/state';
import { thinkDeeply } from '../../lib/ai-tools';
import { Send } from 'lucide-react';
import { Tooltip } from '../Tooltip';

export const ChatbotTab: React.FC = () => {
  const { setDocumentContent, setMainTab, setTranscript, documentContent } = useUI();
  const { name, info, topic } = useUser();
  const [messages, setMessages] = useState<{ role: 'user' | 'agent'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const chatHistory = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
      const systemContext = `You are a strategic InkLo. 
User Name: ${name || 'User'}
User Background: ${info || 'None'}
Current Topic: ${topic || 'Not specified'}
Current Document State:
---
${documentContent}
---
Use this context to provide highly relevant and strategic advice.`;

      const prompt = `${systemContext}\n\nChat History:\n${chatHistory}\nUser: ${userMessage}\nAssistant:`;
      
      const response = await thinkDeeply(prompt);
      setMessages(prev => [...prev, { role: 'agent', text: response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'agent', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-tab" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
      <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--theme-text)', marginTop: '40px', opacity: 0.8 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>InkLo Chat</h3>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>ASK ME ANYTHING ABOUT YOUR STARTUP, STRATEGY, OR IDEAS.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: msg.role === 'user' ? 'var(--theme-accent)' : 'var(--theme-surface)',
              color: msg.role === 'user' ? 'var(--theme-bg)' : 'var(--theme-text)',
              padding: '12px 18px',
              border: '2px solid var(--theme-accent)',
              boxShadow: msg.role === 'user' ? '-4px 4px 0px rgba(0,0,0,0.2)' : '4px 4px 0px var(--theme-accent)',
              maxWidth: '85%',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              lineHeight: '1.5'
            }}>
              {msg.text}
            </div>
          ))
        )}
        {isLoading && (
          <div style={{ 
            alignSelf: 'flex-start', 
            backgroundColor: 'var(--theme-surface)', 
            padding: '10px 15px', 
            border: '2px solid var(--theme-accent)',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontStyle: 'italic'
          }}>
            THINKING...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input" style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="TYPE YOUR MESSAGE..."
          className="brutalist-input"
          style={{ flex: 1 }}
          disabled={isLoading}
        />
        <Tooltip content="Send Message" position="top">
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`brutalist-button ${isLoading || !input.trim() ? '' : 'primary'}`}
            style={{ padding: '0 20px' }}
          >
            <Send size={18} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
