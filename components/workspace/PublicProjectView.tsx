import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { Project, Feedback } from '../../lib/state';
import { 
  MessageSquare, 
  Send, 
  User, 
  Calendar, 
  FileText, 
  ArrowLeft,
  Globe,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { marked } from 'marked';

export const PublicProjectView: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newFeedback, setNewFeedback] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!shareId) return;

    const fetchProject = async () => {
      setIsLoading(true);
      try {
        const q = query(collection(db, 'public_projects'), where('shareId', '==', shareId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const projectData = querySnapshot.docs[0].data() as Project;
          setProject(projectData);
          
          // Fetch feedback
          const feedbackQuery = query(
            collection(db, 'projects', projectData.id, 'feedback'),
            orderBy('createdAt', 'desc')
          );
          
          const unsubscribe = onSnapshot(feedbackQuery, (snapshot) => {
            const feedbackData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Feedback[];
            setFeedback(feedbackData);
          });

          return () => unsubscribe();
        } else {
          toast.error('Project not found or no longer public.');
        }
      } catch (error) {
        console.error('Error fetching public project:', error);
        toast.error('Failed to load project');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [shareId]);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !newFeedback.trim() || !authorName.trim()) {
      toast.error('Please provide both your name and feedback.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'projects', project.id, 'feedback'), {
        projectId: project.id,
        ownerId: project.userId,
        content: newFeedback.trim(),
        authorName: authorName.trim(),
        createdAt: serverTimestamp()
      });
      
      setNewFeedback('');
      toast.success('Feedback submitted! Thank you.');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'var(--theme-bg)',
        color: 'var(--theme-accent)'
      }}>
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'var(--theme-bg)',
        color: 'white',
        padding: '20px',
        textAlign: 'center'
      }}>
        <Globe size={64} color="rgba(255,255,255,0.1)" style={{ marginBottom: '20px' }} />
        <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: '10px' }}>Project Not Found</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', width: '100%', marginBottom: '30px' }}>
          The project you're looking for might have been made private or deleted by the owner.
        </p>
        <Link to="/" style={{ 
          padding: '12px 30px', 
          backgroundColor: 'var(--theme-accent)', 
          color: 'black', 
          borderRadius: '30px',
          textDecoration: 'none',
          fontWeight: 'bold'
        }}>
          Go to SoloScribe
        </Link>
      </div>
    );
  }

  return (
    <div className="public-project-container paper-notebook">
      {/* Public Header */}
      <header className="public-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--theme-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--line-color)'
          }}>
            <FileText size={24} color="var(--theme-accent)" />
          </div>
          <div>
            <h1>{project.name}</h1>
            <div style={{ fontSize: '12px', color: 'var(--theme-bg)', opacity: 0.7, fontFamily: 'var(--font-mono)' }}>
              SHARED_VIA_SOLOSCRIBE_PROTOCOL
            </div>
          </div>
        </div>
        
        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--theme-bg)',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: 'bold',
          fontFamily: 'var(--font-mono)'
        }}>
          <ArrowLeft size={16} /> RETURN_TO_BASE
        </Link>
      </header>

      <main className="public-main">
        {/* Document Content */}
        <section className="public-document-section">
          <div 
            className="markdown-body"
            style={{
              fontSize: '16px',
              lineHeight: '1.8',
              color: 'var(--theme-text)',
              fontFamily: 'var(--font-sans)'
            }}
            dangerouslySetInnerHTML={{ __html: marked(project.documentContent) }}
          />
        </section>

        {/* Feedback Sidebar */}
        <aside className="public-feedback-sidebar">
          <div style={{ 
            position: 'sticky', 
            top: '100px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              marginBottom: '20px' 
            }}>
              <MessageSquare size={20} color="var(--theme-accent)" />
              <h2 style={{ 
                margin: 0, 
                fontSize: '18px', 
                fontFamily: 'var(--font-display)',
                textTransform: 'uppercase'
              }}>Feedback Loop</h2>
            </div>

            {/* Feedback Form */}
            <form 
              onSubmit={handleSubmitFeedback}
              className="public-card"
              style={{ marginBottom: '30px' }}
            >
              <div style={{ marginBottom: '15px' }}>
                <label className="brutalist-label">Your Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="brutalist-input"
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label className="brutalist-label">Your Feedback</label>
                <textarea 
                  placeholder="What do you think about this plan?"
                  value={newFeedback}
                  onChange={(e) => setNewFeedback(e.target.value)}
                  className="brutalist-textarea"
                  style={{ height: '100px' }}
                />
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="brutalist-button w-full"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                Submit Feedback
              </button>
            </form>

            {/* Feedback List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h3 className="brutalist-label">
                Recent Comments ({feedback.length})
              </h3>
              
              <AnimatePresence>
                {feedback.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="public-card"
                    style={{ padding: '15px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                        <User size={14} color="var(--theme-accent)" />
                        {item.authorName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--theme-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        <Calendar size={10} />
                        {item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--theme-text)', lineHeight: '1.5' }}>
                      {item.content}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>

              {feedback.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--theme-text-muted)' }}>
                  <p style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>NO_FEEDBACK_DETECTED</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>

      <footer style={{
        padding: '40px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        color: 'rgba(255,255,255,0.3)',
        fontSize: '12px'
      }}>
        Powered by SoloScribe — The AI Documentation Orchestrator for Solo Founders
      </footer>
    </div>
  );
};
