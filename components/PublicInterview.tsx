import React, { useState, useEffect, useRef } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Send, CheckCircle, Shield, Bot, User, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface PublicInterviewProps {
  interviewId: string;
}

export const PublicInterview: React.FC<PublicInterviewProps> = ({ interviewId }) => {
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string; timestamp: Date }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const chatRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const docRef = doc(db, 'interviews', interviewId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setInterview(data);
          initializeChat(data);
        } else {
          setError('CRITICAL_ERROR: INTERVIEW_NOT_FOUND // 404');
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `interviews/${interviewId}`);
        setError('CRITICAL_ERROR: CONNECTION_TIMEOUT // RETRY_LATER');
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [interviewId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const initializeChat = async (interviewData: any) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API key not found");

      const ai = new GoogleGenAI({ apiKey });
      
      const systemInstruction = `You are a strategic AI researcher conducted a user interview for a solo founder. 
Project Title: ${interviewData.title}
Your objective: ${interviewData.goal}
Specific questions to cover: ${interviewData.questions}

CONSTRAINTS:
1. Maintain a bold, professional, and curious persona.
2. Ask ONE question at a time.
3. Drill down into "the why" behind their actions. Avoid theoretical questions; ask about past experiences.
4. Keep responses under 200 characters.
5. If the user mentions a specific pain point, acknowledge it before asking the next question.
6. When insights are exhausted, say "INTERVIEW_PROTOCOL_COMPLETE" and thank them.`;

      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction,
          temperature: 0.8,
        }
      });

      chatRef.current = chat;
      
      setIsTyping(true);
      const response = await chat.sendMessage({ message: "INITIATE_INTERVIEW_PROTOCOL" });
      
      setMessages([{ role: 'model', text: response.text || '', timestamp: new Date() }]);
      setIsTyping(false);
    } catch (err) {
      console.error("Failed to initialize chat:", err);
      setError("FAILED_TO_SYNC_WITH_NEURON_SERVER");
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping || isFinished) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage, timestamp: new Date() }]);
    setIsTyping(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMessage });
      const aiText = response.text || '';
      
      if (aiText.includes('INTERVIEW_PROTOCOL_COMPLETE') || aiText.includes('INTERVIEW_COMPLETE')) {
        const finalText = aiText.replace(/INTERVIEW_PROTOCOL_COMPLETE|INTERVIEW_COMPLETE/g, '').trim();
        if (finalText) {
          setMessages(prev => [...prev, { role: 'model', text: finalText, timestamp: new Date() }]);
        }
        setTimeout(() => handleFinishInterview(), 2000);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: aiText, timestamp: new Date() }]);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages(prev => [...prev, { role: 'model', text: "ERROR: RESPONSE_INTERRUPTED. PLEASE_REPEAT.", timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFinishInterview = async () => {
    if (isFinished) return;
    setIsFinished(true);
    setIsSaving(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey: apiKey as string });
      
      const transcriptText = messages.map(m => `${m.role === 'model' ? 'Researcher' : 'Participant'}: ${m.text}`).join('\n');
      const summaryPrompt = `Analyze this user interview transcript. Act as a world-class strategic researcher. 
Provide a high-density summary of user pain points, behavior patterns, and surprising insights discovered.
Transcript:
${transcriptText}`;
      
      const summaryResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: summaryPrompt
      });

      const responseId = crypto.randomUUID();
      const responseRef = doc(db, `interviews/${interviewId}/responses`, responseId);
      
      await setDoc(responseRef, {
        id: responseId,
        transcript: messages.map(m => ({ role: m.role, text: m.text })),
        summary: summaryResponse.text || 'No summary generated.',
        createdAt: serverTimestamp()
      });

    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `interviews/${interviewId}/responses`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-theme-accent font-mono p-10 text-center">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="animate-pulse">ESTABLISHING_ENCRYPTED_LINK...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-red-500 font-mono p-10 text-center">
        <div className="border-4 border-red-500 p-8 shadow-[8px_8px_0px_red]">
          <h2 className="text-2xl font-bold mb-4">CRITICAL_SYSTEM_FAILURE</h2>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-theme-accent font-mono p-6 text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-theme-surface border-4 border-theme-accent p-12 max-w-lg shadow-[12px_12px_0px_var(--theme-accent)]"
        >
          {isSaving ? (
            <>
              <Loader2 className="animate-spin mx-auto mb-6" size={48} />
              <h2 className="text-2xl font-bold mb-2 uppercase">UPLOADING_DATA...</h2>
              <p className="text-xs opacity-60 uppercase">Finalizing transcript and generating strategic insights.</p>
            </>
          ) : (
            <>
              <CheckCircle size={64} className="mx-auto mb-6 text-theme-accent" />
              <h2 className="text-3xl font-bold mb-2 uppercase">MISSION_COMPLETE</h2>
              <p className="text-sm opacity-80 mb-8 uppercase tracking-widest leading-relaxed">
                Your insights have been securely transmitted to the founder. You have played a vital role in our growth trajectory.
              </p>
              <div className="text-[10px] opacity-40">SESSION_CLOSED // ID: {interviewId.slice(0,8)}</div>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white font-mono overflow-hidden">
      <header className="bg-theme-accent text-black p-4 flex justify-between items-center border-b-4 border-black">
        <div className="flex items-center gap-3">
          <Shield size={20} />
          <div>
            <h1 className="text-sm font-bold uppercase tracking-tight line-clamp-1">{interview.title}</h1>
            <p className="text-[8px] font-bold opacity-70 uppercase tracking-tighter">AI_RESEARCH_PROTOCOL_v5.01</p>
          </div>
        </div>
        <div className="px-3 py-1 border-2 border-black text-[10px] font-bold">
          LIVE_CONNECT
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-brutalist bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
               <div className={`p-2 h-8 w-8 border-2 border-black flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-theme-accent text-black' : 'bg-white text-black'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`
                p-4 border-2 border-black max-w-[80%] text-sm
                ${msg.role === 'user' ? 'bg-theme-accent/20 border-theme-accent text-theme-accent' : 'bg-white text-black shadow-[4px_4px_0px_var(--theme-accent)]'}
              `}>
                <MarkdownRenderer content={msg.text} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && (
          <div className="flex gap-3">
            <div className="p-2 h-8 w-8 border-2 border-black bg-white text-black flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="p-4 border-2 border-theme-accent bg-black text-theme-accent animate-pulse text-xs italic">
              AI_THINKING...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-zinc-900 border-t-4 border-theme-accent">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            placeholder="INPUT_RESPONSE..."
            className="flex-1 bg-black border-2 border-white/10 p-4 font-mono text-sm text-theme-accent uppercase focus:outline-none focus:border-theme-accent transition-colors"
            disabled={isTyping || isFinished}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isTyping || isFinished}
            className="bg-theme-accent text-black px-6 border-2 border-black hover:bg-white transition-all disabled:opacity-30"
          >
            <Send size={24} />
          </button>
        </form>
        <div className="mt-4 flex justify-center">
          <button 
            onClick={() => {
              if (window.confirm('TERMINATE_SESSION_AND_UPLOAD_PARTIAL_DATA?')) {
                handleFinishInterview();
              }
            }}
            className="text-[10px] opacity-30 hover:opacity-100 hover:text-red-500 transition-all uppercase tracking-widest font-bold"
          >
            Terminal_Exit // Upload
          </button>
        </div>
      </div>
    </div>
  );
};
