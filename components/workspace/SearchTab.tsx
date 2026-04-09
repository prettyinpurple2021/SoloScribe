import React, { useState, useEffect } from 'react';
import { Search, FileText, Calendar, ArrowRight, Brain, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUI, Project } from '../../lib/state';
import { useAuth } from '../../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import { toast } from 'sonner';

const getApiKey = () => {
  if (typeof window !== 'undefined' && window.process?.env?.API_KEY && window.process.env.API_KEY !== '{{API_KEY}}') {
    return window.process.env.API_KEY;
  }
  if (typeof process !== 'undefined' && process.env) {
    const key = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (key && key !== '{{API_KEY}}') {
      return key;
    }
  }
  return undefined;
};

const API_KEY = getApiKey() as string;

export const SearchTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { user } = useAuth();
  const { setCurrentProjectId, setMainTab } = useUI();

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || !user) return;

    setIsSearching(true);
    setResults([]);

    try {
      // 1. Fetch all projects for the user
      const projectsRef = collection(db, 'users', user.uid, 'projects');
      const q = query(projectsRef, orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const allProjects: Project[] = [];
      querySnapshot.forEach((doc) => {
        allProjects.push({ id: doc.id, ...doc.data() } as Project);
      });

      if (allProjects.length === 0) {
        toast.info("No projects found to search through.");
        setIsSearching(false);
        return;
      }

      // 2. Use Gemini to perform "Semantic Search"
      // We'll send the query and a summary of projects to Gemini
      const apiKey = process.env.API_KEY || (window as any).process?.env?.API_KEY;
      if (!apiKey) throw new Error("API key not found");
      const genAI = new GoogleGenAI({ apiKey });

      const projectsContext = allProjects.map(p => ({
        id: p.id,
        name: p.name,
        content: p.documentContent?.substring(0, 1000) || '', // Send first 1000 chars for context
        updatedAt: p.updatedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'
      }));

      const prompt = `
        You are the "Founder's Brain" semantic search engine for SoloScribe.
        The user is searching for: "${searchQuery}"
        
        Here are the user's projects:
        ${JSON.stringify(projectsContext, null, 2)}
        
        TASK:
        1. Identify which projects are most relevant to the search query.
        2. For each relevant project, provide a brief "Semantic Match" explanation (why it matches).
        3. Extract a relevant snippet from the project content that matches the query.
        4. Return a JSON array of objects with these fields: projectId, matchReason, snippet, score (0-1).
        5. Only return the JSON array, nothing else.
      `;

      const result = await genAI.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const responseText = result.text;
      
      try {
        // Clean up response if it contains markdown code blocks
        const jsonStr = responseText.replace(/```json\n?|\n?```/g, '').trim();
        const searchResults = JSON.parse(jsonStr);
        
        const enrichedResults = searchResults.map((res: any) => {
          const project = allProjects.find(p => p.id === res.projectId);
          return {
            ...res,
            projectName: project?.name || 'Unknown Project',
            updatedAt: project?.updatedAt
          };
        }).sort((a: any, b: any) => b.score - a.score);

        setResults(enrichedResults);
      } catch (parseError) {
        console.error("Error parsing Gemini search response:", parseError, responseText);
        toast.error("Failed to process semantic search results.");
      }

    } catch (error) {
      console.error("Search error:", error);
      toast.error("An error occurred during search.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="search-tab-container" style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '16px',
            padding: '8px 16px',
            backgroundColor: 'rgba(0, 243, 255, 0.1)',
            borderRadius: '20px',
            border: '1px solid rgba(0, 243, 255, 0.2)'
          }}>
            <Brain size={20} color="var(--theme-accent)" />
            <span style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '1px', color: 'var(--theme-accent)' }}>FOUNDER'S BRAIN</span>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '12px' }}>Semantic Search</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>
            Search across all your projects, ideas, and transcripts using natural language.
          </p>
        </div>

        <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: '40px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g., 'What did I decide about the pricing model?' or 'Find my notes on AI ethics'"
            style={{
              width: '100%',
              padding: '20px 60px 20px 24px',
              fontSize: '18px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '2px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              color: 'white',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--theme-accent)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              padding: '12px',
              backgroundColor: isSearching ? 'transparent' : 'var(--theme-accent)',
              color: 'black',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isSearching ? <Loader2 size={24} className="animate-spin" color="var(--theme-accent)" /> : <Search size={24} />}
          </button>
        </form>

        <div className="search-results">
          <AnimatePresence mode="popLayout">
            {results.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Sparkles size={16} color="var(--theme-accent)" />
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                    Found {results.length} relevant matches
                  </span>
                </div>
                {results.map((result, index) => (
                  <motion.div
                    key={result.projectId + index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    style={{
                      padding: '24px',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    whileHover={{ 
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderColor: 'rgba(0, 243, 255, 0.3)',
                      transform: 'translateY(-2px)'
                    }}
                    onClick={() => {
                      setCurrentProjectId(result.projectId);
                      setMainTab('document');
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          padding: '8px', 
                          backgroundColor: 'rgba(0, 243, 255, 0.1)', 
                          borderRadius: '8px' 
                        }}>
                          <FileText size={18} color="var(--theme-accent)" />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>{result.projectName}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={12} />
                              {result.updatedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                            </span>
                            <span style={{ 
                              padding: '2px 8px', 
                              backgroundColor: 'rgba(0, 243, 255, 0.1)', 
                              color: 'var(--theme-accent)',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}>
                              {Math.round(result.score * 100)}% MATCH
                            </span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={20} color="rgba(255,255,255,0.2)" />
                    </div>
                    
                    <div style={{ 
                      padding: '12px', 
                      backgroundColor: 'rgba(0,0,0,0.2)', 
                      borderRadius: '8px', 
                      marginBottom: '12px',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      color: 'rgba(255,255,255,0.8)',
                      borderLeft: '3px solid var(--theme-accent)'
                    }}>
                      "{result.snippet}"
                    </div>

                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--theme-accent)' }}>Why it matches:</span> {result.matchReason}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : searchQuery && !isSearching ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}
              >
                No relevant matches found in your brain. Try a different query.
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
