import React, { useState, useEffect } from 'react';
import { useUI } from '../../lib/state';
import { thinkDeeply } from '../../lib/ai-tools';
import { Users, Loader2, Plus, Link as LinkIcon, MessageSquare, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Tooltip } from '../Tooltip';
import { db, OperationType, handleFirestoreError } from '../../firebase';
import { collection, doc, setDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { MarkdownRenderer } from '../MarkdownRenderer';

export const ValidationEngineTab: React.FC = () => {
  const { documentContent } = useUI();
  const { user } = useAuth();
  const [activeTool, setActiveTool] = useState<'mom-test' | 'interviews' | 'plan-reviewer' | 'hypothesis-tester' | null>('interviews');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hypothesis, setHypothesis] = useState('');

  // Interview Campaign State
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ title: '', goal: '', questions: '' });
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [campaignResponses, setCampaignResponses] = useState<any[]>([]);

  useEffect(() => {
    if (user && activeTool === 'interviews') {
      fetchCampaigns();
    }
  }, [user, activeTool]);

  const fetchCampaigns = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'interviews'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const fetchedCampaigns = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCampaigns(fetchedCampaigns);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `interviews?userId=${user.uid}`);
    }
  };

  const fetchResponses = async (interviewId: string) => {
    try {
      const q = query(collection(db, `interviews/${interviewId}/responses`));
      const querySnapshot = await getDocs(q);
      const responses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCampaignResponses(responses);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `interviews/${interviewId}/responses`);
    }
  };

  const handleCreateCampaign = async () => {
    if (!user) {
      toast.error("Please sign in to create an interview campaign.");
      return;
    }
    if (!newCampaign.title || !newCampaign.goal || !newCampaign.questions) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    try {
      const interviewId = crypto.randomUUID();
      const interviewRef = doc(db, 'interviews', interviewId);
      
      await setDoc(interviewRef, {
        id: interviewId,
        userId: user.uid,
        title: newCampaign.title,
        goal: newCampaign.goal,
        questions: newCampaign.questions,
        createdAt: serverTimestamp()
      });

      setShowCreateCampaign(false);
      setNewCampaign({ title: '', goal: '', questions: '' });
      fetchCampaigns();
      toast.success("Campaign created successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `interviews`);
      toast.error("Failed to create campaign.");
    } finally {
      setIsLoading(false);
    }
  };

  const runValidation = async (tool: 'mom-test' | 'plan-reviewer' | 'hypothesis-tester') => {
    setActiveTool(tool);
    setIsLoading(true);
    setResult(null);

    let prompt = '';
    const context = `Here is my current startup business plan / document:\n\n${documentContent}\n\n`;

    if (tool === 'mom-test') {
      prompt = `${context}Based on the book "The Mom Test", analyze my business plan. Highlight areas where I am making assumptions instead of relying on hard facts or past user behavior. Suggest 3 specific, non-leading questions I should ask potential customers to validate this idea without them lying to me to spare my feelings. Format your response in Markdown.`;
    } else if (tool === 'plan-reviewer') {
      prompt = `${context}Act as an expert startup advisor and investor. Review the following business plan for completeness, clarity, and potential weaknesses. Provide a structured analysis with actionable feedback and specific suggestions for improvement. Break down your review into sections like Executive Summary, Market Analysis, Product/Service, Business Model, and Risks. Format your response in Markdown.`;
    } else if (tool === 'hypothesis-tester') {
      prompt = `${context}My core hypothesis to test is: "${hypothesis}".\n\nAct as an expert user researcher. Create a comprehensive validation plan for this hypothesis. Include:\n1. **Qualitative Testing (Customer Interviews):** 5 non-leading, open-ended questions to ask in user interviews (following the Mom Test principles).\n2. **Quantitative Testing (Survey):** 5 survey questions (mix of multiple choice, Likert scale, and short answer) that I can put into a Google Form to gather statistically significant data.\n3. **Success Metric:** What specific signal or metric would prove this hypothesis is true?\n\nFormat in Markdown.`;
    }

    try {
      const response = await thinkDeeply(prompt);
      setResult(response);
    } catch (error) {
      console.error(error);
      setResult('Failed to run validation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/?interview=${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Interview link copied to clipboard!');
  };

  return (
    <div className="validation-engine-tab scrollbar-brutalist" style={{ padding: '40px', overflowY: 'auto', height: '100%', backgroundColor: 'var(--theme-bg)' }}>
      <div style={{ marginBottom: '40px', borderLeft: '8px solid var(--theme-accent)', paddingLeft: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-2px', margin: 0 }}>
          Evidence Locker
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Stop guessing. Start knowing. Market validation lab.
        </p>
      </div>

      {/* Primary Navigation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {[
          { id: 'interviews', label: 'Interview Campaigns', icon: <Users size={20} />, activeColor: 'var(--theme-accent)' },
          { id: 'hypothesis-tester', label: 'Hypothesis Lab', icon: <Loader2 size={20} />, activeColor: '#a855f7' },
          { id: 'plan-reviewer', label: 'Pitch Stress-Test', icon: <Plus size={20} />, activeColor: '#22c55e' },
          { id: 'mom-test', label: 'The Mom Test', icon: <Send size={20} />, activeColor: '#f59e0b' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => { 
              if (item.id === 'plan-reviewer' || item.id === 'mom-test') runValidation(item.id as any);
              else { setActiveTool(item.id as any); setResult(null); }
            }}
            className={`brutalist-button ${activeTool === item.id ? 'active' : ''}`}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '24px',
              backgroundColor: activeTool === item.id ? item.activeColor : 'var(--theme-surface)',
              color: activeTool === item.id ? '#000' : 'var(--theme-text)',
              transform: activeTool === item.id ? 'translate(4px, 4px)' : 'none',
              boxShadow: activeTool === item.id ? 'none' : '4px 4px 0px #000'
            }}
          >
            {item.icon}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}>{item.label}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>
        {/* Active Tool Workspace */}
        <div style={{ backgroundColor: 'var(--theme-surface)', border: '4px solid #000', padding: '40px', boxShadow: '12px 12px 0px #000', position: 'relative' }}>
          
          {activeTool === 'interviews' && (
            <div className="interview-manager">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '2px solid #000', paddingBottom: '16px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', margin: 0, fontSize: '24px' }}>Live Campaigns</h2>
                <button 
                  onClick={() => setShowCreateCampaign(!showCreateCampaign)}
                  className="brutalist-button primary"
                  style={{ fontSize: '12px' }}
                >
                  <Plus size={16} /> Deploy New Agent
                </button>
              </div>

              {!user && (
                <div style={{ padding: '24px', backgroundColor: '#fef3c7', border: '3px solid #f59e0b', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Users size={24} style={{ color: '#f59e0b' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700 }}>AUTHENTICATION_REQUIRED: Sign in to manage interview bots.</span>
                </div>
              )}

              {showCreateCampaign && user && (
                <div style={{ padding: '32px', backgroundColor: 'var(--theme-surface-light)', border: '2px dashed #000', marginBottom: '32px' }}>
                  <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '24px' }}>[ NEW_CAMPAIGN_PROTOCOL ]</h3>
                  
                  <div style={{ display: 'grid', gap: '24px' }}>
                    <div>
                      <label className="brutalist-label">Codename / Title</label>
                      <input 
                        className="brutalist-input"
                        placeholder="e.g., PH_EARLY_ADOPTERS_01"
                        value={newCampaign.title}
                        onChange={e => setNewCampaign({...newCampaign, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="brutalist-label">Intelligence Goal</label>
                      <textarea 
                        className="brutalist-textarea"
                        placeholder="Define the specific insight we are mining for..."
                        style={{ minHeight: '100px' }}
                        value={newCampaign.goal}
                        onChange={e => setNewCampaign({...newCampaign, goal: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="brutalist-label">Core Interrogation Suite (Questions)</label>
                      <textarea 
                        className="brutalist-textarea"
                        placeholder="1. How do you current solve X?&#10;2. What was the last time you bought Y?"
                        style={{ minHeight: '120px' }}
                        value={newCampaign.questions}
                        onChange={e => setNewCampaign({...newCampaign, questions: e.target.value})}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setShowCreateCampaign(false)} className="brutalist-button">Abort</button>
                      <button onClick={handleCreateCampaign} disabled={isLoading} className="brutalist-button primary">Execute Deployment</button>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gap: '20px' }}>
              {campaigns.map(campaign => (
                <div key={campaign.id} style={{ border: '3px solid #000', padding: '24px', backgroundColor: selectedCampaign?.id === campaign.id ? 'var(--theme-surface-light)' : 'var(--theme-surface)', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '20px', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>{campaign.title}</h4>
                      <p style={{ margin: 0, fontSize: '14px', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>GOAL: {campaign.goal}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => copyLink(campaign.id)} className="brutalist-button-sm">
                        <LinkIcon size={14} /> <span>Link</span>
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedCampaign(selectedCampaign?.id === campaign.id ? null : campaign);
                          if (selectedCampaign?.id !== campaign.id) fetchResponses(campaign.id);
                        }}
                        className={`brutalist-button-sm ${selectedCampaign?.id === campaign.id ? 'active' : ''}`}
                      >
                        <MessageSquare size={14} /> <span>Data</span>
                      </button>
                    </div>
                  </div>

                  {selectedCampaign?.id === campaign.id && (
                    <div style={{ marginTop: '24px', padding: '24px', backgroundColor: '#fff', border: '2px solid #000', boxShadow: '4px 4px 0px #000' }}>
                      <h5 style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', textTransform: 'uppercase', marginBottom: '16px' }}>RECOVERED_DATA:</h5>
                      {campaignResponses.length === 0 ? (
                        <p style={{ fontSize: '13px', color: '#666', fontStyle: 'italic' }}>PENDING_RESPONSE... No incoming transmissions yet.</p>
                      ) : (
                        <div style={{ display: 'grid', gap: '24px' }}>
                          {campaignResponses.map((response, idx) => (
                            <div key={response.id} style={{ borderLeft: '4px solid #000', paddingLeft: '20px' }}>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 900, marginBottom: '8px' }}>EVIDENCE_LOG_#{idx + 1}</div>
                              <div style={{ fontSize: '14px', marginBottom: '12px', lineHeight: 1.6 }}>
                                <strong style={{ textTransform: 'uppercase', fontSize: '11px' }}>AI_INTEL:</strong> {response.summary}
                              </div>
                              <details style={{ cursor: 'pointer' }}>
                                <summary style={{ fontSize: '11px', fontWeight: 900, color: 'var(--theme-accent)' }}>[ VIEW_FULL_RAW_TRANSCRIPT ]</summary>
                                <div style={{ marginTop: '12px', padding: '16px', background: 'var(--theme-surface-light)', fontFamily: 'var(--font-mono)', fontSize: '12px', maxHeight: '300px', overflowY: 'auto', border: '1px solid #000' }}>
                                  {response.transcript.map((t: any, i: number) => (
                                    <div key={i} style={{ marginBottom: '12px' }}>
                                      <span style={{ color: t.role === 'model' ? 'var(--theme-accent)' : '#ef4444' }}>{t.role === 'model' ? '[BOT]' : '[USER]'}: </span>
                                      {t.text}
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              </div>
            </div>
          )}

          {activeTool === 'hypothesis-tester' && (
            <div className="hypothesis-tester">
              <h2 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', margin: '0 0 32px 0', fontSize: '24px' }}>Hypothesis Stress Test</h2>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', marginBottom: '32px' }}>Define a falsifiable business assumption. We will generate a scientific validation protocol.</p>
              
              <div style={{ display: 'grid', gap: '24px', marginBottom: '32px' }}>
                <div>
                  <label className="brutalist-label">Core Assumption</label>
                  <textarea
                    className="brutalist-textarea"
                    placeholder="e.g., 'Target users will switch from Paper to Digital if the app has a pen-feel-shading feature...'"
                    style={{ minHeight: '120px' }}
                    value={hypothesis}
                    onChange={e => setHypothesis(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => runValidation('hypothesis-tester')}
                  disabled={isLoading || !hypothesis.trim()}
                  className="brutalist-button primary"
                  style={{ width: '100%', padding: '20px' }}
                >
                  {isLoading ? 'PROTOCOL_RUNNING...' : 'GENERATE_VALIDATION_MATRIX'}
                </button>
              </div>
            </div>
          )}

          {/* Results Area for AI Tools */}
          {(activeTool === 'mom-test' || activeTool === 'plan-reviewer' || activeTool === 'hypothesis-tester') && (
            <div style={{ marginTop: activeTool === 'hypothesis-tester' ? '0' : '32px' }}>
              {isLoading && (
                <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', backgroundColor: 'var(--theme-surface-light)', border: '3px solid #000' }}>
                  <div style={{ width: '40px', height: '40px', border: '4px solid #000', borderTopColor: 'var(--theme-accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, textTransform: 'uppercase' }}>Analyzing Current Business State...</span>
                </div>
              )}

              {result && !isLoading && (
                <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '3px solid #000' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '20px', margin: 0 }}>
                      {activeTool === 'mom-test' ? 'Mom Test Analysis' : activeTool === 'hypothesis-tester' ? 'Validation Protocol' : 'Structural Review'}
                    </h3>
                  </div>
                  <div className="markdown-body" style={{ fontSize: '15px' }}>
                    <MarkdownRenderer content={result} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Global Evidence Sidebar / Tips */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div style={{ border: '3px solid #000', padding: '24px', backgroundColor: 'var(--theme-surface)' }}>
            <h4 style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontSize: '13px', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '16px' }}>Validation Status</h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                <span>Interviews Conducted:</span>
                <span style={{ fontWeight: 900 }}>{campaignResponses.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                <span>Evidence Grade:</span>
                <span style={{ fontWeight: 900, color: campaignResponses.length > 5 ? 'var(--theme-accent-tertiary)' : '#ef4444' }}>
                  {campaignResponses.length === 0 ? 'UNVERIFIED' : campaignResponses.length < 5 ? 'WEAK' : 'STRENGTHENING'}
                </span>
              </div>
            </div>
          </div>
          <div style={{ border: '3px solid #000', padding: '24px', backgroundColor: 'var(--theme-surface)' }}>
            <h4 style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontSize: '13px', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '16px' }}>Pro Tip</h4>
            <p style={{ fontSize: '13px', lineHeight: 1.5, margin: 0 }}>
              Build an audience before you build a product. Use the <strong>Interviews</strong> tab to find where your users hang out and what they really struggle with.
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .brutalist-button.active {
          background-color: var(--theme-accent);
          transform: translate(2px, 2px);
          box-shadow: 1px 1px 0px #000;
        }
      `}} />
    </div>
  );
};

