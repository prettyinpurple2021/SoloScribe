import React, { useState, useEffect } from 'react';
import { useUI } from '../../lib/state';
import { thinkDeeply } from '../../lib/ai-tools';
import { Loader2, Lightbulb, Sparkles, Brain, Zap } from 'lucide-react';
import { Tooltip } from '../Tooltip';
import { FounderHealthCheck } from './FounderHealthCheck';
import { MarkdownRenderer } from '../MarkdownRenderer';

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
    }, 10000);
    return () => clearTimeout(timer);
  }, [documentContent]);

  const generateSuggestions = async (isProactive = false) => {
    if (!documentContent.trim()) return;
    setIsLoading(true);
    if (!isProactive) setSuggestions(null);
    try {
      const prompt = `Review this business plan.
User Goals: ${goals || 'Make the document more persuasive, complete, and professional.'}
Content:
${documentContent}
Provide 3 actionable suggestions in Markdown.`;
      
      const response = await thinkDeeply(prompt);
      setSuggestions(response);
    } catch (error) {
      console.error(error);
      if (!isProactive) setSuggestions('FAILED_TO_SYNC_CO_FOUNDER_BRAIN');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="copilot-sidebar scrollbar-brutalist" style={{ height: '100%', overflowY: 'auto', backgroundColor: '#000', color: '#fff' }}>
      <div style={{ padding: '24px', borderBottom: '4px solid var(--theme-accent)', backgroundColor: '#111' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Brain size={24} color="var(--theme-accent)" />
          <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '20px', margin: 0, letterSpacing: '-1px' }}>AI_CO_PILOT</h3>
        </div>
      </div>
      
      <div style={{ padding: '24px' }}>
        <FounderHealthCheck />
        
        <div style={{ marginBottom: '32px' }}>
          <label className="brutalist-label" style={{ color: 'var(--theme-accent)', borderColor: 'var(--theme-accent)' }}>TACTICAL_GOALS</label>
          <textarea 
            value={goals}
            onChange={e => setGoals(e.target.value)}
            placeholder="Focus on monetization... Technical audit..."
            className="brutalist-textarea"
            style={{ minHeight: '80px', backgroundColor: '#222', color: '#fff', border: '2px solid #444' }}
          />
        </div>
        
        <Tooltip content="Get AI Suggestions" position="top">
          <button 
            onClick={() => generateSuggestions(false)}
            disabled={isLoading || !documentContent.trim()}
            className="brutalist-button primary"
            style={{ width: '100%', padding: '16px' }}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
            <span style={{ marginLeft: '12px' }}>{isLoading ? 'ANALYZING...' : 'SYNC_INTELLIGENCE'}</span>
          </button>
        </Tooltip>

        {!documentContent.trim() && (
          <p style={{ fontSize: '10px', color: '#666', marginTop: '24px', textAlign: 'center', fontFamily: 'var(--font-mono)', border: '1px dashed #444', padding: '16px' }}>
            AWAITING_DATA_INPUT...
          </p>
        )}

        {suggestions && (
          <div style={{ marginTop: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '2px solid #333', paddingBottom: '8px' }}>
               <Sparkles size={14} color="var(--theme-accent)" />
               <h4 style={{ fontSize: '12px', margin: 0, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-mono)' }}>
                SUGGESTIONS_TRANSCRIPT
               </h4>
            </div>
            <div className="copilot-results" style={{ fontSize: '13px', borderLeft: '2px solid var(--theme-accent)', paddingLeft: '16px' }}>
              <MarkdownRenderer content={suggestions} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
