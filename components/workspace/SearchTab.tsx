import React, { useState } from 'react';
import { Search, FileText, Calendar, ArrowRight, Brain, Sparkles, Loader2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUI, Project } from '../../lib/state';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import { toast } from 'sonner';

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
      const projectsRef = collection(db, 'users', user.uid, 'projects');
      const q = query(projectsRef, orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const allProjects: Project[] = [];
      querySnapshot.forEach((doc) => {
        allProjects.push({ id: doc.id, ...doc.data() } as Project);
      });

      if (allProjects.length === 0) {
        toast.info("EMPTY_REPOSITORY: No projects found.");
        setIsSearching(false);
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API_KEY_UNAVAILABLE");
      const client = new GoogleGenAI({ apiKey });

      const projectsContext = allProjects.map(p => ({
        id: p.id,
        name: p.name,
        content: p.documentContent?.substring(0, 1000) || '',
        updatedAt: p.updatedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'
      }));

      const prompt = `
        You are the "Founder's Brain" semantic search engine.
        User Query: "${searchQuery}"
        Projects: ${JSON.stringify(projectsContext)}
        Return a JSON array of: {projectId, matchReason, snippet, score (0-1)}.
      `;

      const result = await client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt
      });
      const responseText = result.text || '';
      
      const jsonStr = responseText.replace(/```json\n?|\n?```/g, '').trim();
      const searchResults = JSON.parse(jsonStr);
      
      const enrichedResults = searchResults.map((res: any) => {
        const project = allProjects.find(p => p.id === res.projectId);
        return {
          ...res,
          projectName: project?.name || 'Unknown',
          updatedAt: project?.updatedAt
        };
      }).sort((a: any, b: any) => b.score - a.score);

      setResults(enrichedResults);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("SEARCH_FAILURE: Intelligence link offline.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="search-tab-container scrollbar-brutalist" style={{ padding: '40px', height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '64px', borderLeft: '12px solid var(--theme-accent)', paddingLeft: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#000', color: 'var(--theme-accent)', padding: '4px 12px', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 900 }}>[ SEMANTIC_ANALYSIS ]</div>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-2px', margin: 0 }}>
            NEURAL_SEARCH
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Query your entire brain. Find patterns across parallel missions.
          </p>
        </div>

        <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: '64px' }}>
          <div style={{ display: 'flex', gap: '0' }}>
            <input
              className="brutalist-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. 'PRICING_STRATEGY' or 'GTM_PLAN'"
              style={{ fontSize: '24px', padding: '24px', flex: 1, backgroundColor: '#fff' }}
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="brutalist-button primary"
              style={{ width: '80px', padding: 0 }}
            >
              {isSearching ? <Loader2 size={32} className="animate-spin mx-auto" /> : <Search size={32} className="mx-auto" />}
            </button>
          </div>
        </form>

        <div className="search-results">
          <AnimatePresence mode="popLayout">
            {results.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
              >
                <div style={{ borderBottom: '4px solid #000', paddingBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Zap size={20} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}>
                    MATCHES_FOUND: {results.length}
                  </span>
                </div>
                
                {results.map((result, index) => (
                  <motion.div
                    key={result.projectId + index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                    style={{
                      padding: '32px',
                      backgroundColor: 'var(--theme-surface)',
                      border: '4px solid #000',
                      boxShadow: '8px 8px 0px #000',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                    onClick={() => {
                      setCurrentProjectId(result.projectId);
                      setMainTab('document');
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ padding: '12px', backgroundColor: '#000', color: 'var(--theme-accent)' }}>
                          <FileText size={24} />
                        </div>
                        <div>
                          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>{result.projectName}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#666', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                            <span>REC_UPDATED: {result.updatedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}</span>
                            <span style={{ padding: '2px 8px', backgroundColor: 'var(--theme-accent)', color: '#000', fontWeight: 900 }}>{Math.round(result.score * 100)}%_CONFIDENCE</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={24} />
                    </div>
                    
                    <div style={{ 
                      padding: '20px', 
                      backgroundColor: '#fff', 
                      border: '2px solid #000',
                      marginBottom: '20px',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      color: '#000',
                      fontFamily: 'var(--theme-font-document)'
                    }}>
                      "{result.snippet}"
                    </div>

                    <div style={{ fontSize: '12px', color: '#666', fontFamily: 'var(--font-mono)', borderTop: '1px solid #000', paddingTop: '12px' }}>
                      <span style={{ fontWeight: 900, color: '#000' }}>RELEVANCE:</span> {result.matchReason}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : searchQuery && !isSearching ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ textAlign: 'center', padding: '64px', backgroundColor: 'var(--theme-surface-light)', border: '4px dashed #000' }}
              >
                 <Sparkles size={48} style={{ margin: '0 auto 24px', opacity: 0.3 }} />
                 <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700 }}>NULL_RESULT: No patterns detected for query.</p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

