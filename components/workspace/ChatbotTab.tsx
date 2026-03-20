import React, { useState, useRef, useEffect } from 'react';
import { useUI, useUser } from '../../lib/state';
import { thinkDeeply } from '../../lib/ai-tools';
import { Send } from 'lucide-react';

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
      const systemContext = `You are a strategic AI co-founder. 
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
      <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
            <h3>AI Co-Founder Chat</h3>
            <p>Ask me anything about your startup, strategy, or ideas.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: msg.role === 'user' ? '#007bff' : '#f1f1f1',
              color: msg.role === 'user' ? 'white' : 'black',
              padding: '10px 15px',
              borderRadius: '15px',
              maxWidth: '80%'
            }}>
              {msg.text}
            </div>
          ))
        )}
        {isLoading && (
          <div style={{ alignSelf: 'flex-start', backgroundColor: '#f1f1f1', padding: '10px 15px', borderRadius: '15px' }}>
            Thinking...
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
          placeholder="Type your message..."
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
