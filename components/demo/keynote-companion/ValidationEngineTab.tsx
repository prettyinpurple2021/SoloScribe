import React, { useState, useEffect } from 'react';
import { useUI } from '../../../lib/state';
import { thinkDeeply } from '../../../lib/ai-tools';
import { Users, Loader2, Plus, Link as LinkIcon, MessageSquare } from 'lucide-react';
import { marked } from 'marked';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../firebase';
import { collection, doc, setDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

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
      console.error("Error fetching campaigns:", error);
    }
  };

  const fetchResponses = async (interviewId: string) => {
    try {
      const q = query(collection(db, `interviews/${interviewId}/responses`));
      const querySnapshot = await getDocs(q);
      const responses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCampaignResponses(responses);
    } catch (error) {
      console.error("Error fetching responses:", error);
    }
  };

  const handleCreateCampaign = async () => {
    if (!user) {
      alert("Please sign in to create an interview campaign.");
      return;
    }
    if (!newCampaign.title || !newCampaign.goal || !newCampaign.questions) {
      alert("Please fill in all fields.");
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
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert("Failed to create campaign.");
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
    alert('Interview link copied to clipboard! Share this on social media or with potential users.');
  };

  return (
    <div className="validation-engine-tab" style={{ padding: '20px', overflowY: 'auto', height: '100%' }}>
      <h2>Market Research & Validation Engine</h2>
      <p style={{ marginBottom: '20px', color: '#666' }}>Ensure you are building something people actually want.</p>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '15px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTool('interviews')}
          style={{ padding: '10px 20px', borderRadius: '20px', backgroundColor: activeTool === 'interviews' ? '#e8f0fe' : 'transparent', color: activeTool === 'interviews' ? '#1a73e8' : '#666', border: 'none', cursor: 'pointer', fontWeight: activeTool === 'interviews' ? 'bold' : 'normal' }}
        >
          AI Interview Campaigns
        </button>
        <button
          onClick={() => { setActiveTool('hypothesis-tester'); setResult(null); }}
          style={{ padding: '10px 20px', borderRadius: '20px', backgroundColor: activeTool === 'hypothesis-tester' ? '#e8f0fe' : 'transparent', color: activeTool === 'hypothesis-tester' ? '#1a73e8' : '#666', border: 'none', cursor: 'pointer', fontWeight: activeTool === 'hypothesis-tester' ? 'bold' : 'normal' }}
        >
          Hypothesis Tester
        </button>
        <button
          onClick={() => runValidation('plan-reviewer')}
          style={{ padding: '10px 20px', borderRadius: '20px', backgroundColor: activeTool === 'plan-reviewer' ? '#e8f0fe' : 'transparent', color: activeTool === 'plan-reviewer' ? '#1a73e8' : '#666', border: 'none', cursor: 'pointer', fontWeight: activeTool === 'plan-reviewer' ? 'bold' : 'normal' }}
        >
          Business Plan Reviewer
        </button>
        <button
          onClick={() => runValidation('mom-test')}
          style={{ padding: '10px 20px', borderRadius: '20px', backgroundColor: activeTool === 'mom-test' ? '#e8f0fe' : 'transparent', color: activeTool === 'mom-test' ? '#1a73e8' : '#666', border: 'none', cursor: 'pointer', fontWeight: activeTool === 'mom-test' ? 'bold' : 'normal' }}
        >
          The Mom Test
        </button>
      </div>

      {activeTool === 'interviews' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Your Interview Campaigns</h3>
            <button 
              onClick={() => setShowCreateCampaign(!showCreateCampaign)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              <Plus size={16} /> New Campaign
            </button>
          </div>

          {!user && (
            <div style={{ padding: '20px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '8px', marginBottom: '20px' }}>
              <strong>Note:</strong> You must be signed in to create and manage AI Interview Campaigns.
            </div>
          )}

          {showCreateCampaign && user && (
            <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd' }}>
              <h4>Create New AI Interview Campaign</h4>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>Create a custom AI interviewer. Share the link, and the AI will conduct real interviews with people and report back to you.</p>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Campaign Title</label>
                <input 
                  type="text" 
                  value={newCampaign.title}
                  onChange={e => setNewCampaign({...newCampaign, title: e.target.value})}
                  placeholder="e.g., Freelancer Pain Points Interview"
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Interview Goal</label>
                <textarea 
                  value={newCampaign.goal}
                  onChange={e => setNewCampaign({...newCampaign, goal: e.target.value})}
                  placeholder="What are you trying to learn? e.g., I want to understand the biggest challenges freelancers face when managing their invoices."
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '80px' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Key Questions for the AI to Ask</label>
                <textarea 
                  value={newCampaign.questions}
                  onChange={e => setNewCampaign({...newCampaign, questions: e.target.value})}
                  placeholder="1. How do you currently track your invoices?&#10;2. What is the most frustrating part of getting paid?&#10;3. Have you ever paid for a tool to solve this?"
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '100px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowCreateCampaign(false)} style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleCreateCampaign} disabled={isLoading} style={{ padding: '8px 16px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {isLoading ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </div>
          )}

          {campaigns.length === 0 && !showCreateCampaign && user && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <Users size={48} style={{ opacity: 0.5, marginBottom: '10px' }} />
              <p>You haven't created any interview campaigns yet.</p>
              <p style={{ fontSize: '14px', marginTop: '5px' }}>Create one to start gathering real user feedback via AI.</p>
            </div>
          )}

          <div style={{ display: 'grid', gap: '15px' }}>
            {campaigns.map(campaign => (
              <div key={campaign.id} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>{campaign.title}</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{campaign.goal}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => copyLink(campaign.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', backgroundColor: '#f1f3f4', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      <LinkIcon size={14} /> Copy Public Link
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedCampaign(selectedCampaign?.id === campaign.id ? null : campaign);
                        if (selectedCampaign?.id !== campaign.id) {
                          fetchResponses(campaign.id);
                        }
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', backgroundColor: '#e8f0fe', color: '#1a73e8', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      <MessageSquare size={14} /> View Responses
                    </button>
                  </div>
                </div>

                {selectedCampaign?.id === campaign.id && (
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                    <h5 style={{ marginBottom: '15px' }}>Interview Responses</h5>
                    {campaignResponses.length === 0 ? (
                      <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>No responses yet. Share your link to get started!</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {campaignResponses.map((response, idx) => (
                          <div key={response.id} style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' }}>Participant #{idx + 1}</div>
                            <div style={{ fontSize: '14px', marginBottom: '10px' }}>
                              <strong>AI Summary:</strong> {response.summary}
                            </div>
                            <details>
                              <summary style={{ cursor: 'pointer', fontSize: '12px', color: '#1a73e8' }}>View Full Transcript</summary>
                              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff', borderRadius: '4px', fontSize: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                                {response.transcript.map((t: any, i: number) => (
                                  <div key={i} style={{ marginBottom: '8px' }}>
                                    <strong style={{ color: t.role === 'model' ? '#1a73e8' : '#333' }}>{t.role === 'model' ? 'AI Interviewer' : 'Participant'}:</strong> {t.text}
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
        <div style={{ marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '10px' }}>Test a Business Hypothesis</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>Enter a core assumption about your business (e.g., "Freelancers will pay $10/mo for automated invoice chasing"). We'll generate a complete validation plan including interview and survey questions.</p>
            <textarea
              value={hypothesis}
              onChange={e => setHypothesis(e.target.value)}
              placeholder="Enter your hypothesis here..."
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '80px', marginBottom: '15px' }}
            />
            <button
              onClick={() => runValidation('hypothesis-tester')}
              disabled={isLoading || !hypothesis.trim()}
              style={{ padding: '8px 16px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: (!hypothesis.trim() || isLoading) ? 0.5 : 1 }}
            >
              {isLoading ? 'Generating Plan...' : 'Generate Validation Plan'}
            </button>
          </div>
        </div>
      )}

      {(activeTool === 'mom-test' || activeTool === 'plan-reviewer' || activeTool === 'hypothesis-tester') && (
        <>
          {!documentContent.trim() && (
            <div style={{ padding: '20px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '8px', marginBottom: '20px' }}>
              <strong>Note:</strong> You need to write some details about your startup in the Document tab first before running validations.
            </div>
          )}

          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <Loader2 className="animate-spin" /> {activeTool === 'hypothesis-tester' ? 'Generating validation plan...' : 'Analyzing your business plan...'}
            </div>
          )}

          {result && !isLoading && (
            <div className="validation-result" style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                {activeTool === 'mom-test' ? 'Mom Test Validation' : activeTool === 'hypothesis-tester' ? 'Hypothesis Validation Plan' : 'Business Plan Review'}
              </h3>
              <div className="markdown-body" dangerouslySetInnerHTML={{ __html: marked.parse(result) as string }} />
            </div>
          )}
        </>
      )}
    </div>
  );
};
