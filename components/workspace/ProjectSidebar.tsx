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
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '320px',
              backgroundColor: 'var(--theme-surface)',
              borderRight: '1px solid rgba(0, 243, 255, 0.2)',
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '10px 0 30px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div style={{ 
              padding: '20px', 
              borderBottom: '1px solid rgba(0, 243, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(0, 243, 255, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Folder size={20} color="var(--theme-accent)" />
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '18px', 
                  fontFamily: 'var(--font-display)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: 'var(--theme-accent)'
                }}>Workspace</h2>
              </div>
              <button 
                onClick={() => setShowProjectSidebar(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
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
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 8px 8px 32px',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(0, 243, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            {/* Project List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 5px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>Your Documents</span>
                <button 
                  onClick={() => setIsCreating(true)}
                  style={{ 
                    background: 'rgba(0, 243, 255, 0.1)', 
                    border: '1px solid rgba(0, 243, 255, 0.3)', 
                    color: 'var(--theme-accent)',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={12} /> New
                </button>
              </div>

              {isCreating && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ 
                    padding: '10px', 
                    backgroundColor: 'rgba(0, 243, 255, 0.05)', 
                    borderRadius: '8px',
                    marginBottom: '10px',
                    border: '1px solid rgba(0, 243, 255, 0.2)'
                  }}
                >
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Project name..."
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(0, 243, 255, 0.4)',
                      borderRadius: '4px',
                      color: 'white',
                      marginBottom: '8px',
                      fontSize: '13px'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={handleCreateProject}
                      style={{ 
                        flex: 1, 
                        padding: '6px', 
                        backgroundColor: 'var(--theme-accent)', 
                        color: 'black', 
                        border: 'none', 
                        borderRadius: '4px', 
                        fontSize: '12px', 
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      Create
                    </button>
                    <button 
                      onClick={() => setIsCreating(false)}
                      style={{ 
                        padding: '6px 10px', 
                        backgroundColor: 'rgba(255,255,255,0.1)', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {filteredProjects.map((project) => (
                  <div 
                    key={project.id}
                    onClick={() => handleSelectProject(project)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: currentProjectId === project.id ? 'rgba(0, 243, 255, 0.15)' : 'transparent',
                      border: currentProjectId === project.id ? '1px solid rgba(0, 243, 255, 0.3)' : '1px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      group: 'true'
                    } as any}
                    className="project-item"
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
                          style={{
                            width: '100%',
                            background: 'rgba(0,0,0,0.5)',
                            border: '1px solid var(--theme-accent)',
                            color: 'white',
                            padding: '2px 4px',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                        />
                      ) : (
                        <div style={{ 
                          fontSize: '13px', 
                          fontWeight: currentProjectId === project.id ? '600' : '400',
                          color: currentProjectId === project.id ? 'white' : 'rgba(255,255,255,0.8)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {project.name}
                        </div>
                      )}
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                        {project.updatedAt?.toDate ? new Date(project.updatedAt.toDate()).toLocaleDateString() : 'Just now'}
                      </div>
                    </div>

                    <div className="project-actions" style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        onClick={(e) => handleStartEdit(e, project)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '4px' }}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteProject(e, project.id)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredProjects.length === 0 && !isCreating && (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)' }}>
                    <Folder size={32} style={{ marginBottom: '10px', opacity: 0.2 }} />
                    <p style={{ fontSize: '12px' }}>No projects found. Create your first startup document!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{ 
              padding: '15px', 
              borderTop: '1px solid rgba(0, 243, 255, 0.1)',
              fontSize: '10px',
              color: 'rgba(255,255,255,0.3)',
              textAlign: 'center'
            }}>
              SoloScribe Workspace v1.0
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
