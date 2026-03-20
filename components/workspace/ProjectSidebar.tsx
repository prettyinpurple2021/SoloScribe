import React, { useEffect, useState } from 'react';
import { useUI, Project } from '../../lib/state';
import { useAuth } from '../../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  doc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { 
  Folder, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  ChevronRight, 
  FileText,
  MoreVertical,
  Check,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export const ProjectSidebar: React.FC = () => {
  const { user } = useAuth();
  const { 
    showProjectSidebar, 
    setShowProjectSidebar, 
    currentProjectId, 
    setCurrentProjectId,
    setDocumentContent,
    setTranscript,
    projects,
    setProjects
  } = useUI();

  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'projects'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(projectsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/projects`);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateProject = async () => {
    if (!user || !newProjectName.trim()) return;

    try {
      const projectData = {
        name: newProjectName.trim(),
        documentContent: '# ' + newProjectName.trim() + '\n\nStart planning your startup here...',
        transcript: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: user.uid
      };

      const docRef = await addDoc(collection(db, 'users', user.uid, 'projects'), projectData);
      setCurrentProjectId(docRef.id);
      setDocumentContent(projectData.documentContent);
      setTranscript([]);
      setNewProjectName('');
      setIsCreating(false);
      toast.success('Project created!');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  const handleSelectProject = (project: Project) => {
    setCurrentProjectId(project.id);
    setDocumentContent(project.documentContent);
    setTranscript(project.transcript || []);
    setShowProjectSidebar(false);
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user || !window.confirm('Are you sure you want to delete this project?')) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'projects', id));
      if (currentProjectId === id) {
        setCurrentProjectId(null);
        setDocumentContent('');
        setTranscript([]);
      }
      toast.success('Project deleted');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleStartEdit = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingId(project.id);
    setEditName(project.name);
  };

  const handleSaveEdit = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user || !editName.trim()) return;

    try {
      await setDoc(doc(db, 'users', user.uid, 'projects', id), {
        name: editName.trim(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      setEditingId(null);
      toast.success('Project renamed');
    } catch (error) {
      console.error('Error renaming project:', error);
      toast.error('Failed to rename project');
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {showProjectSidebar && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowProjectSidebar(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
            }}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="sidebar-container"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '320px',
              zIndex: 1001,
            }}
          >
            {/* Header */}
            <div className="sidebar-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Folder size={20} color="var(--theme-accent)" />
                <h2>Workspace</h2>
              </div>
              <button 
                onClick={() => setShowProjectSidebar(false)}
                className="project-action-btn"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div style={{ padding: '15px' }}>
              <div style={{ 
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', color: 'rgba(255,255,255,0.4)' }} />
                <input 
                  type="text"
                  placeholder="SEARCH PROJECTS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="brutalist-input"
                  style={{ paddingLeft: '32px' }}
                />
              </div>
            </div>

            {/* Project List */}
            <div className="sidebar-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 5px' }}>
                <span className="brutalist-label" style={{ margin: 0 }}>Your Documents</span>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="brutalist-button"
                  style={{ padding: '4px 12px', fontSize: '11px' }}
                >
                  <Plus size={12} /> NEW
                </button>
              </div>

              {isCreating && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="brutalist-card"
                  style={{ marginBottom: '1rem', padding: '1rem' }}
                >
                  <input 
                    autoFocus
                    type="text"
                    placeholder="PROJECT NAME..."
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                    className="brutalist-input"
                    style={{ marginBottom: '0.75rem' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={handleCreateProject}
                      className="brutalist-button primary"
                      style={{ flex: 1, padding: '8px' }}
                    >
                      CREATE
                    </button>
                    <button 
                      onClick={() => setIsCreating(false)}
                      className="brutalist-button"
                      style={{ padding: '8px 12px' }}
                    >
                      CANCEL
                    </button>
                  </div>
                </motion.div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredProjects.map((project) => (
                  <div 
                    key={project.id}
                    onClick={() => handleSelectProject(project)}
                    className={`project-item ${currentProjectId === project.id ? 'active' : ''}`}
                  >
                    <FileText size={18} color={currentProjectId === project.id ? 'var(--theme-accent)' : 'rgba(255,255,255,0.4)'} />
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {editingId === project.id ? (
                        <input 
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={(e) => handleSaveEdit(e as any, project.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(e as any, project.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="brutalist-input"
                          style={{ padding: '2px 8px' }}
                        />
                      ) : (
                        <div style={{ 
                          fontSize: '13px', 
                          fontWeight: currentProjectId === project.id ? '700' : '400',
                          color: currentProjectId === project.id ? 'var(--theme-accent)' : 'rgba(255,255,255,0.8)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {project.name}
                        </div>
                      )}
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                        {project.updatedAt?.toDate ? new Date(project.updatedAt.toDate()).toLocaleDateString() : 'JUST NOW'}
                      </div>
                    </div>

                    <div className="project-actions">
                      <button 
                        onClick={(e) => handleStartEdit(e, project)}
                        className="project-action-btn"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteProject(e, project.id)}
                        className="project-action-btn"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredProjects.length === 0 && !isCreating && (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)' }}>
                    <Folder size={32} style={{ marginBottom: '10px', opacity: 0.2 }} />
                    <p style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>NO PROJECTS FOUND. INITIALIZE NEW STARTUP DOCUMENT.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sidebar-footer">
              SOLOSCRIBE_WORKSPACE_V1.0 // SYSTEM_READY
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
