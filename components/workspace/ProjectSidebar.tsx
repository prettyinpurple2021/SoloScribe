import React, { useEffect, useState } from 'react';
import { useUI, Project, useTaskStore, Task } from '../../lib/state';
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
  addDoc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { 
  Folder, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  FileText,
  Search,
  CheckCircle2,
  Circle,
  Flag,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { ConfirmModal } from '../Modal';
import { Tooltip } from '../Tooltip';
import c from 'classnames';

const SidebarTasks: React.FC<{ projectId: string; userId: string }> = ({ projectId, userId }) => {
  const { tasks } = useTaskStore();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  const projectTasks = tasks.filter(t => t.projectId === projectId);
  
  const sortedTasks = [...projectTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const priorityMap = { high: 0, medium: 1, low: 2 };
    if (a.priority !== b.priority) return priorityMap[a.priority] - priorityMap[b.priority];
    return a.dueDate.toMillis() - b.dueDate.toMillis();
  });

  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setNewTaskTitle(task.title);
    setNewTaskPriority(task.priority);
    setNewTaskDueDate(task.dueDate instanceof Timestamp ? task.dueDate.toDate().toISOString().slice(0, 16) : task.dueDate);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskDueDate) return;
    try {
      if (editingTaskId) {
        const taskRef = doc(db, 'users', userId, 'projects', projectId, 'tasks', editingTaskId);
        await updateDoc(taskRef, {
          title: newTaskTitle,
          priority: newTaskPriority,
          dueDate: Timestamp.fromDate(new Date(newTaskDueDate)),
          updatedAt: serverTimestamp(),
        });
        setEditingTaskId(null);
        toast.success('Task updated');
      } else {
        const tasksRef = collection(db, 'users', userId, 'projects', projectId, 'tasks');
        await addDoc(tasksRef, {
          projectId,
          userId,
          title: newTaskTitle,
          priority: newTaskPriority,
          dueDate: Timestamp.fromDate(new Date(newTaskDueDate)),
          completed: false,
          notified: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setIsAddingTask(false);
        toast.success('Task added');
      }
      setNewTaskTitle('');
      setNewTaskDueDate('');
    } catch (error) {
      handleFirestoreError(error, editingTaskId ? OperationType.UPDATE : OperationType.CREATE, `users/${userId}/projects/${projectId}/tasks`);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const taskRef = doc(db, 'users', userId, 'projects', projectId, 'tasks', taskId);
      await deleteDoc(taskRef);
      toast.success('Task deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}/projects/${projectId}/tasks/${taskId}`);
    }
  };

  const toggleTaskCompletion = async (task: Task) => {
    try {
      const taskRef = doc(db, 'users', userId, 'projects', projectId, 'tasks', task.id);
      await updateDoc(taskRef, {
        completed: !task.completed,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/projects/${projectId}/tasks/${task.id}`);
    }
  };

  const isOverdue = (dueDate: any) => dueDate.toMillis() < Date.now();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div style={{ marginTop: '20px', borderTop: '1px solid var(--theme-border)', paddingTop: '20px' }}>
      <div className="sidebar-content-header" style={{ padding: '0 20px', marginBottom: '10px' }}>
        <span className="theme-label" style={{ fontSize: '10px' }}>Current Project Tasks</span>
        <Tooltip content="Add Task" position="left">
          <button 
            onClick={() => {
              setEditingTaskId(null);
              setNewTaskTitle('');
              setNewTaskDueDate('');
              setIsAddingTask(!isAddingTask);
            }}
            className="brutalist-button mini"
          >
            <Plus size={12} /> ADD
          </button>
        </Tooltip>
      </div>

      {(isAddingTask || editingTaskId) && (
        <form onSubmit={handleSaveTask} className="theme-card creation-card" style={{ margin: '0 20px 10px' }}>
          <input 
            autoFocus
            type="text"
            placeholder="TASK TITLE..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="brutalist-input mini"
            style={{ marginBottom: '8px' }}
            required
          />
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <select 
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value as any)}
              className="brutalist-input mini"
              style={{ flex: 1 }}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <input 
              type="datetime-local"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="brutalist-input mini"
              style={{ flex: 1 }}
              required
            />
          </div>
          <div className="creation-actions">
            <button type="submit" className="brutalist-button primary">SAVE</button>
            <button type="button" onClick={() => {
              setIsAddingTask(false);
              setEditingTaskId(null);
            }} className="brutalist-button secondary">CANCEL</button>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {sortedTasks.map(task => (
          <div 
            key={task.id}
            className="project-item group"
            style={{ opacity: task.completed ? 0.6 : 1, padding: '10px 20px', borderBottom: '1px solid var(--theme-border)', cursor: 'default', display: 'flex', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={() => toggleTaskCompletion(task)} style={{ cursor: 'pointer', flexShrink: 0 }}>
                {task.completed ? <CheckCircle2 size={16} className="text-primary" /> : <Circle size={16} />}
              </button>
              <div className="project-item-content" style={{ marginLeft: '10px' }}>
                <div className="project-name" style={{ textDecoration: task.completed ? 'line-through' : 'none', fontSize: '13px' }}>
                  {task.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', marginTop: '4px' }}>
                  <span className={getPriorityColor(task.priority)} style={{ display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 'bold' }}>
                    <Flag size={10} /> {task.priority.toUpperCase()}
                  </span>
                  <span className={!task.completed && isOverdue(task.dueDate) ? "text-destructive font-bold" : "text-muted-foreground"} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <Clock size={10} />
                    {task.dueDate.toDate().toLocaleDateString([], { hour: '2-digit', minute:'2-digit' })}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="project-actions" style={{ flexShrink: 0 }}>
              <Tooltip content="Edit Task" position="top">
                <button 
                  onClick={() => startEditTask(task)}
                  className="project-action-btn"
                >
                  <Edit3 size={14} />
                </button>
              </Tooltip>
              <Tooltip content="Delete Task" position="top">
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="project-action-btn"
                >
                  <Trash2 size={14} />
                </button>
              </Tooltip>
            </div>
          </div>
        ))}
        {sortedTasks.length === 0 && !isAddingTask && (
          <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5, fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            NO TASKS FOUND FOR THIS PROJECT.
          </div>
        )}
      </div>
    </div>
  );
};

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

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
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/projects`);
      toast.error('Failed to create project');
    }
  };

  const handleSelectProject = (project: Project) => {
    setCurrentProjectId(project.id);
    setDocumentContent(project.documentContent);
    setTranscript(project.transcript || []);
    setShowProjectSidebar(false);
  };

  const handleDeleteProject = async (id: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'projects', id));
      if (currentProjectId === id) {
        setCurrentProjectId(null);
        setDocumentContent('');
        setTranscript([]);
      }
      toast.success('Project deleted');
      setShowDeleteConfirm(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/projects/${id}`);
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
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/projects/${id}`);
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
              backgroundColor: 'rgba(0,0,0,0.2)',
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
            className="sidebar-container paper-dots"
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
              <Tooltip content="Close Workspace" position="left">
                <button 
                  onClick={() => setShowProjectSidebar(false)}
                  className="project-action-btn"
                >
                  <X size={20} />
                </button>
              </Tooltip>
            </div>

            {/* Search */}
            <div className="sidebar-search-container">
              <div className="sidebar-search-wrapper">
                <Search size={14} className="search-icon" />
                <input 
                  type="text"
                  placeholder="SEARCH PROJECTS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="brutalist-input"
                />
              </div>
            </div>

            {/* Project List */}
            <div className="sidebar-content">
              <div className="sidebar-content-header">
                <span className="theme-label">Your Documents</span>
                <Tooltip content="Create New Project" position="left">
                  <button 
                    onClick={() => setIsCreating(true)}
                    className="brutalist-button mini"
                  >
                    <Plus size={12} /> NEW
                  </button>
                </Tooltip>
              </div>

              {isCreating && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="theme-card creation-card"
                >
                  <input 
                    autoFocus
                    type="text"
                    placeholder="PROJECT NAME..."
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                    className="brutalist-input"
                  />
                  <div className="creation-actions">
                    <button 
                      onClick={handleCreateProject}
                      className="brutalist-button primary"
                    >
                      CREATE
                    </button>
                    <button 
                      onClick={() => setIsCreating(false)}
                      className="brutalist-button secondary"
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
                    <FileText size={18} color={currentProjectId === project.id ? 'var(--theme-accent)' : 'rgba(0,0,0,0.4)'} />
                    
                    <div className="project-item-content">
                      {editingId === project.id ? (
                        <input 
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={(e) => handleSaveEdit(e as any, project.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(e as any, project.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="brutalist-input mini"
                        />
                      ) : (
                        <div className="project-name">
                          {project.name}
                        </div>
                      )}
                      <div className="project-date">
                        {project.updatedAt?.toDate ? new Date(project.updatedAt.toDate()).toLocaleDateString() : 'JUST NOW'}
                      </div>
                    </div>

                    <div className="project-actions">
                      <Tooltip content="Rename Project" position="top">
                        <button 
                          onClick={(e) => handleStartEdit(e, project)}
                          className="project-action-btn"
                        >
                          <Edit3 size={14} />
                        </button>
                      </Tooltip>
                      <Tooltip content="Delete Project" position="top">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(project.id); }}
                          className="project-action-btn"
                        >
                          <Trash2 size={14} />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                ))}

                {filteredProjects.length === 0 && !isCreating && (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(0,0,0,0.3)' }}>
                    <Folder size={32} style={{ marginBottom: '10px', opacity: 0.2 }} />
                    <p style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>NO PROJECTS FOUND. INITIALIZE NEW STARTUP DOCUMENT.</p>
                  </div>
                )}
              </div>
              
              {currentProjectId && user && (
                <SidebarTasks projectId={currentProjectId} userId={user.uid} />
              )}
            </div>

            {/* Footer */}
            <div className="sidebar-footer">
              SOLOSCRIBE_WORKSPACE_V1.0 // SYSTEM_READY
            </div>
          </motion.div>

          {showDeleteConfirm && (
            <ConfirmModal 
              title="Delete Project?"
              message="Are you sure you want to delete this project? This action cannot be undone and all document content will be lost."
              onConfirm={() => handleDeleteProject(showDeleteConfirm)}
              onCancel={() => setShowDeleteConfirm(null)}
              confirmText="Delete Project"
              variant="danger"
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
};
