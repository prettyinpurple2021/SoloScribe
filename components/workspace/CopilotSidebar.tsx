import React, { useState, useEffect } from 'react';
import { useUI } from '../../lib/state';
import { thinkDeeply } from '../../lib/ai-tools';
import { Loader2, Lightbulb, Sparkles } from 'lucide-react';
import { marked } from 'marked';

export const CopilotSidebar: React.FC = () => {
  const { documentContent } = useUI();
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [goals, setGoals] = useState('');

  // Proactive suggestion generation when document changes significantly
  useEffect(() => {
    const timer = setTimeout(() => {
      if (documentContent.trim().length > 100 && !suggestions && !isLoading) {
        generateSuggestions(true);
      }
    }, 5000); // 5 seconds after typing stops
    return () => clearTimeout(timer);
  }, [documentContent]);

  const generateSuggestions = async (isProactive = false) => {
    if (!documentContent.trim()) return;
    setIsLoading(true);
    if (!isProactive) setSuggestions(null); // Keep old suggestions while loading if proactive
    try {
      const prompt = `You are an expert AI Co-pilot for a startup founder. Review the following business plan/document.
      
User Goals: ${goals || 'Make the document more persuasive, complete, and professional.'}

Document Content:
${documentContent}

Provide 3 specific, actionable suggestions for improvements or content additions. For each suggestion, provide a brief explanation of WHY it's needed, and a short snippet of WHAT to add. Format your response in Markdown.`;
      
      const response = await thinkDeeply(prompt);
      setSuggestions(response);
    } catch (error) {
      console.error(error);
      if (!isProactive) setSuggestions('Failed to generate suggestions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="copilot-sidebar" style={{ width: '300px', borderLeft: '1px solid rgba(0, 243, 255, 0.2)', backgroundColor: 'var(--theme-surface)', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', color: 'var(--theme-text)' }}>
      <div style={{ padding: '15px', borderBottom: '1px solid rgba(0, 243, 255, 0.2)', backgroundColor: 'rgba(5, 5, 16, 0.8)', display: 'flex', alignItems: 'center', gap: '8px', position: 'sticky', top: 0, zIndex: 10 }}>
        <Sparkles size={18} color="var(--theme-accent)" />
        <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--theme-accent)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px' }}>AI Co-pilot</h3>
      </div>
      
      <div style={{ padding: '15px', flex: 1 }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '5px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Goals (Optional)</label>
          <textarea 
            value={goals}
            onChange={e => setGoals(e.target.value)}
            placeholder="e.g., I want to sound more technical, or I need to focus on monetization..."
            style={{ width: '100%', padding: '8px', borderRadius: 'var(--border-radius)', border: '1px solid rgba(0, 243, 255, 0.3)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'var(--theme-text)', minHeight: '60px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
          />
        </div>
        
        <button 
          onClick={() => generateSuggestions(false)}
          disabled={isLoading || !documentContent.trim()}
          style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(0, 243, 255, 0.1)', color: 'var(--theme-accent)', border: '1px solid var(--theme-accent)', borderRadius: 'var(--border-radius)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: (!documentContent.trim() || isLoading) ? 0.5 : 1, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s ease' }}
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Lightbulb size={16} />}
          {isLoading ? 'Analyzing...' : 'Get Suggestions'}
        </button>

        {!documentContent.trim() && (
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '10px', textAlign: 'center', fontStyle: 'italic' }}>Write some content to get suggestions.</p>
        )}

        {suggestions && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '10px', color: 'var(--theme-accent-secondary)', borderBottom: '1px solid rgba(176, 38, 255, 0.3)', paddingBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>Suggestions</h4>
            <div className="markdown-body copilot-markdown" style={{ fontSize: '13px', color: 'var(--theme-text)' }} dangerouslySetInnerHTML={{ __html: marked.parse(suggestions) as string }} />
          </div>
        )}
      </div>
    </div>
  );
};
