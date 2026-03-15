import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Send, CheckCircle } from 'lucide-react';

interface PublicInterviewProps {
  interviewId: string;
}

export const PublicInterview: React.FC<PublicInterviewProps> = ({ interviewId }) => {
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
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
          setError('Interview not found. The link may be invalid or expired.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load interview.');
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
      
      const systemInstruction = `You are an AI researcher conducting a user interview for a startup. 
Your goal is to learn: ${interviewData.goal}
The key questions you need to ask are: ${interviewData.questions}

Rules:
1. Be conversational, friendly, and empathetic. Do NOT sound like a robot.
2. Ask ONE question at a time. Wait for their response before moving on.
3. Dig deeper into their answers. If they give a short answer, ask "Why?" or "Can you give me an example?"
4. Keep your responses relatively short (1-3 sentences).
5. Start the conversation by introducing yourself briefly and asking the first question.
6. When you feel you have gathered enough information to answer the key questions, thank them for their time and say "INTERVIEW_COMPLETE".`;

      const chat = ai.chats.create({
        model: 'gemini-2.0-flash',
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      chatRef.current = chat;
      
      // Trigger the first message from the AI
      setIsTyping(true);
      const response = await chat.sendMessage({ message: "Hello! I'm ready to start the interview." });
      
      setMessages([{ role: 'model', text: response.text || '' }]);
      setIsTyping(false);
    } catch (err) {
      console.error("Failed to initialize chat:", err);
      setError("Failed to connect to the AI interviewer.");
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping || isFinished) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMessage });
      const aiText = response.text || '';
      
      if (aiText.includes('INTERVIEW_COMPLETE')) {
        const finalText = aiText.replace('INTERVIEW_COMPLETE', '').trim();
        if (finalText) {
          setMessages(prev => [...prev, { role: 'model', text: finalText }]);
        }
        handleFinishInterview();
      } else {
        setMessages(prev => [...prev, { role: 'model', text: aiText }]);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I encountered an error processing your response. Could you try again?" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFinishInterview = async () => {
    setIsFinished(true);
    setIsSaving(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey: apiKey as string });
      
      // Generate a summary of the interview
      const transcriptText = messages.map(m => `${m.role === 'model' ? 'Interviewer' : 'Participant'}: ${m.text}`).join('\n');
      const summaryPrompt = `Summarize the following user interview transcript. Focus on the key insights related to the goal: "${interview.goal}".\n\nTranscript:\n${transcriptText}`;
      
      const summaryResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: summaryPrompt
      });

      const responseId = crypto.randomUUID();
      const responseRef = doc(db, `interviews/${interviewId}/responses`, responseId);
      
      await setDoc(responseRef, {
        id: responseId,
        transcript: messages,
        summary: summaryResponse.text || 'No summary generated.',
        createdAt: serverTimestamp()
      });

    } catch (err) {
      console.error("Failed to save interview response:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8f9fa' }}>
        <Loader2 className="animate-spin" size={32} color="#1a73e8" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8f9fa' }}>
        <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ color: '#d93025', marginBottom: '10px' }}>Oops!</h2>
          <p style={{ color: '#666' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8f9fa' }}>
        <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '500px' }}>
          {isSaving ? (
            <>
              <Loader2 className="animate-spin" size={48} color="#1a73e8" style={{ margin: '0 auto 20px' }} />
              <h2 style={{ marginBottom: '10px' }}>Saving your responses...</h2>
              <p style={{ color: '#666' }}>Please don't close this window just yet.</p>
            </>
          ) : (
            <>
              <CheckCircle size={64} color="#1e8e3e" style={{ margin: '0 auto 20px' }} />
              <h2 style={{ marginBottom: '10px' }}>Thank you!</h2>
              <p style={{ color: '#666' }}>Your feedback has been recorded. You can now close this tab.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ backgroundColor: '#fff', padding: '20px', borderBottom: '1px solid #e0e0e0', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', zIndex: 10 }}>
        <h1 style={{ margin: 0, fontSize: '18px', color: '#333' }}>{interview.title}</h1>
        <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#666' }}>AI Research Interview</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ 
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            backgroundColor: msg.role === 'user' ? '#1a73e8' : '#fff',
            color: msg.role === 'user' ? '#fff' : '#333',
            padding: '12px 16px',
            borderRadius: '16px',
            borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
            borderBottomLeftRadius: msg.role === 'model' ? '4px' : '16px',
            maxWidth: '80%',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            lineHeight: '1.5',
            fontSize: '15px'
          }}>
            {msg.text}
          </div>
        ))}
        {isTyping && (
          <div style={{ alignSelf: 'flex-start', backgroundColor: '#fff', padding: '12px 16px', borderRadius: '16px', borderBottomLeftRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
            <Loader2 className="animate-spin" size={16} color="#666" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ backgroundColor: '#fff', padding: '20px', borderTop: '1px solid #e0e0e0' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your answer here..."
              disabled={isTyping || isFinished}
              style={{ flex: 1, padding: '15px', borderRadius: '24px', border: '1px solid #ccc', fontSize: '15px', outline: 'none' }}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isTyping || isFinished}
              style={{ backgroundColor: input.trim() && !isTyping ? '#1a73e8' : '#ccc', color: '#fff', border: 'none', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: input.trim() && !isTyping ? 'pointer' : 'default', transition: 'background-color 0.2s' }}
            >
              <Send size={20} style={{ marginLeft: '2px' }} />
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <button 
              onClick={handleFinishInterview}
              style={{ background: 'none', border: 'none', color: '#666', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              End interview early
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
