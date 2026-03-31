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
    <div className="copilot-sidebar">
      <div className="copilot-header">
        <Sparkles size={18} color="var(--theme-accent)" />
        <h3>AI Co-pilot</h3>
      </div>
      
      <div className="copilot-content">
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="brutalist-label">YOUR GOALS (OPTIONAL)</label>
          <textarea 
            value={goals}
            onChange={e => setGoals(e.target.value)}
            placeholder="E.G., I WANT TO SOUND MORE TECHNICAL, OR I NEED TO FOCUS ON MONETIZATION..."
            className="brutalist-textarea"
            style={{ minHeight: '80px' }}
          />
        </div>
        
        <button 
          onClick={() => generateSuggestions(false)}
          disabled={isLoading || !documentContent.trim()}
          className={`brutalist-button ${isLoading || !documentContent.trim() ? '' : 'primary'}`}
          style={{ width: '100%' }}
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Lightbulb size={16} />}
          {isLoading ? 'ANALYZING...' : 'GET SUGGESTIONS'}
        </button>

        {!documentContent.trim() && (
          <p style={{ fontSize: '12px', color: 'var(--theme-text)', opacity: 0.6, marginTop: '1.5rem', textAlign: 'center', fontStyle: 'italic', fontFamily: 'var(--font-mono)' }}>
            WRITE SOME CONTENT TO INITIALIZE SUGGESTIONS.
          </p>
        )}

        {suggestions && (
          <div style={{ marginTop: '2rem' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '1rem', color: 'var(--theme-accent)', borderBottom: '2px solid var(--theme-accent)', paddingBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-display)' }}>
              SUGGESTIONS_LOG
            </h4>
            <div className="markdown-body copilot-markdown" style={{ color: 'var(--theme-text)' }} dangerouslySetInnerHTML={{ __html: marked.parse(suggestions) as string }} />
          </div>
        )}
      </div>
    </div>
  );
};
