import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon, 
  Clock, 
  Bell, 
  BellOff,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Edit2,
  Flag,
  Sparkles,
  Loader2,
  Check
} from 'lucide-react';
import { useUI, useTaskStore, Task } from '../../lib/state';
import { useAuth } from '../../contexts/AuthContext';
import { db, OperationType, handleFirestoreError } from '../../firebase';
import { Tooltip } from '../Tooltip';
import { thinkDeeply } from '../../lib/ai-tools';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { toast } from 'sonner';
import c from 'classnames';

export default function TasksTab() {
  const { currentProjectId, notificationPreferences, setNotificationPreferences, documentContent } = useUI();
  const { tasks } = useTaskStore();
  const { user } = useAuth();
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const projectTasks = tasks.filter(t => t.projectId === currentProjectId);
  const filteredTasks = projectTasks.filter(t => priorityFilter === 'all' || t.priority === priorityFilter);
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    
    // Sort by priority
    const priorityMap = { high: 0, medium: 1, low: 2 };
    if (a.priority !== b.priority) return priorityMap[a.priority] - priorityMap[b.priority];
    
    const aMillis = a.dueDate instanceof Timestamp ? a.dueDate.toMillis() : new Date(a.dueDate).getTime();
    const bMillis = b.dueDate instanceof Timestamp ? b.dueDate.toMillis() : new Date(b.dueDate).getTime();
    return aMillis - bMillis;
  });

  const handleAddTask = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user || !currentProjectId || !newTaskTitle || !newTaskDueDate) return;

    setIsAdding(true);
    try {
      const tasksRef = collection(db, 'users', user.uid, 'projects', currentProjectId, 'tasks');
      const dueDate = new Date(newTaskDueDate);
      
      const newId = `task_${Date.now()}`;
      await addDoc(tasksRef, {
        id: newId, // We set it here but addDoc will also give its own. Better use setDoc if we want custom ID but consistent with existing pattern
        projectId: currentProjectId,
        userId: user.uid,
        title: newTaskTitle,
        description: newTaskDescription,
        priority: newTaskPriority,
        dueDate: Timestamp.fromDate(dueDate),
        completed: false,
        notified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('medium');
      setNewTaskDueDate('');
      toast.success('TASK_COMMITTED: Mission updated.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/projects/${currentProjectId}/tasks`);
    } finally {
      setIsAdding(false);
    }
  };

  const toggleTaskCompletion = async (task: Task) => {
    if (!user || !currentProjectId) return;

    try {
      const taskRef = doc(db, 'users', user.uid, 'projects', currentProjectId, 'tasks', task.id);
      await updateDoc(taskRef, {
        completed: !task.completed,
        updatedAt: serverTimestamp(),
      });
      toast.success(task.completed ? 'TASK_REOPENED' : 'TASK_COMPLETED: Well done, founder.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/projects/${currentProjectId}/tasks/${task.id}`);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentProjectId || !editingTask) return;

    try {
      const taskRef = doc(db, 'users', user.uid, 'projects', currentProjectId, 'tasks', editingTask.id);
      await updateDoc(taskRef, {
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        dueDate: editingTask.dueDate,
        updatedAt: serverTimestamp(),
      });
      setEditingTask(null);
      toast.success('TASK_SYNCHRONIZED');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/projects/${currentProjectId}/tasks/${editingTask.id}`);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user || !currentProjectId) return;

    try {
      const taskRef = doc(db, 'users', user.uid, 'projects', currentProjectId, 'tasks', taskId);
      await deleteDoc(taskRef);
      toast.success('TASK_PURGED');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/projects/${currentProjectId}/tasks/${taskId}`);
    }
  };

  const suggestTasksWithAi = async () => {
    if (!documentContent || isAiGenerating || !user || !currentProjectId) return;
    setIsAiGenerating(true);
    toast.info('CONSULTING_INTELLIGENCE: Mining task list...');
    
    try {
      const prompt = `Act as a precision-focused startup advisor. 
Based on the following startup document, identify the next 3 most critical, high-impact tasks the founder must complete.
Be specific and actionable. Avoid generic advice.

DOCUMENT CONTENT:
"""
${documentContent.substring(0, 10000)}
"""

Format your response as a JSON array of exactly 3 objects. 
Each object must have these exact keys:
- title (string, max 50 chars)
- description (string, max 200 chars)
- priority (string, one of: "high", "medium", "low")

Example:
[
  { "title": "Finalize UVP", "description": "Draft 3 versions of the UVP and test with target users.", "priority": "high" },
  ...
]

Return ONLY the JSON array.`;
      
      const response = await thinkDeeply(prompt);
      // Clean the response in case the model wrapped it in markdown code blocks
      const cleanJson = response.replace(/```json|```/g, '').trim();
      const suggestions = JSON.parse(cleanJson);
      
      if (!Array.isArray(suggestions)) throw new Error('Invalid AI response format');

      const tasksRef = collection(db, 'users', user.uid, 'projects', currentProjectId, 'tasks');
      const now = new Date();

      for (let i = 0; i < suggestions.length; i++) {
        const s = suggestions[i];
        const dueDate = new Date(now);
        dueDate.setDate(now.getDate() + (i + 2)); // Stagger due dates starting 2 days from now
        
        await addDoc(tasksRef, {
          id: `task_ai_${Date.now()}_${i}`,
          projectId: currentProjectId,
          userId: user.uid,
          title: s.title,
          description: s.description,
          priority: s.priority || 'medium',
          dueDate: Timestamp.fromDate(dueDate),
          completed: false,
          notified: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      
      toast.success('AI_SUGGESTIONS_DEPLOYED: Mission expanded.');
      setIsAiGenerating(false);

    } catch (error) {
      console.error('AI Suggestion error:', error);
      toast.error('FAILED_TO_CONSULT_AI: Communication line noisy.');
      setIsAiGenerating(false);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('NOTIFICATIONS_UNSUPPORTED: Get a better browser, founder.');
      return;
    }

    if (Notification.permission === 'granted') {
      setNotificationPreferences({ browserNotifications: true });
      toast.success('ALERTS_ACTIVE');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationPreferences({ browserNotifications: true });
      toast.success('ALERTS_ACTIVE');
    } else {
      toast.error('ALERTS_DENIED');
    }
  };

  const isOverdue = (dueDate: any) => {
    const millis = dueDate instanceof Timestamp ? dueDate.toMillis() : new Date(dueDate).getTime();
    return millis < Date.now();
  };

  const formatDueDate = (dueDate: any) => {
    const date = dueDate instanceof Timestamp ? dueDate.toDate() : new Date(dueDate);
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high': return { color: '#ef4444', border: '2px solid #ef4444', backgroundColor: '#fef2f2' };
      case 'medium': return { color: '#f59e0b', border: '2px solid #f59e0b', backgroundColor: '#fffbe7' };
      case 'low': return { color: '#3b82f6', border: '2px solid #3b82f6', backgroundColor: '#eff6ff' };
      default: return { color: '#666', border: '2px solid #666', backgroundColor: '#f9f9f9' };
    }
  };

  return (
    <div className="tasks-tab scrollbar-brutalist" style={{ padding: '40px', overflowY: 'auto', height: '100%', backgroundColor: 'var(--theme-bg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px', borderLeft: '12px solid var(--theme-accent-tertiary)', paddingLeft: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-2px', margin: 0 }}>
            Ops Console
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Mission objectives, tactical reminders, & execution logs.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={suggestTasksWithAi}
            disabled={isAiGenerating}
            className="brutalist-button"
            style={{ backgroundColor: 'var(--theme-accent)', color: '#000', fontSize: '12px' }}
          >
            {isAiGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={16} />}
            <span style={{ marginLeft: '8px' }}>AI_AUTO_TASK</span>
          </button>
          <button
            onClick={() => setNotificationPreferences({ enabled: !notificationPreferences.enabled })}
            className={`brutalist-button ${notificationPreferences.enabled ? 'primary' : ''}`}
            style={{ padding: '12px' }}
          >
            {notificationPreferences.enabled ? <Bell size={20} /> : <BellOff size={20} />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-10">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {/* Quick Add Form */}
          <div style={{ backgroundColor: 'var(--theme-surface)', border: '4px solid #000', padding: '32px', boxShadow: '8px 8px 0px #000' }}>
            <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '24px', borderBottom: '2px solid #000', paddingBottom: '8px' }}>
              [ NEW_OBJECTIVE ]
            </h2>
            <form onSubmit={handleAddTask} style={{ display: 'grid', gap: '24px' }}>
              <div>
                <label className="brutalist-label">Mission Title</label>
                <input
                  className="brutalist-input"
                  placeholder="DEPLOY_LANDING_PAGE_V1"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label className="brutalist-label">Priority</label>
                  <select
                    className="brutalist-input"
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                  >
                    <option value="low">LOW_PRIORITY</option>
                    <option value="medium">MED_PRIORITY</option>
                    <option value="high">HIGH_PRIORITY</option>
                  </select>
                </div>
                <div>
                  <label className="brutalist-label">Deadline</label>
                  <input
                    type="datetime-local"
                    className="brutalist-input"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isAdding}
                className="brutalist-button primary"
                style={{ width: '100%', padding: '16px' }}
              >
                {isAdding ? 'COMMITTING...' : 'ADD_TO_QUEUE'}
              </button>
            </form>
          </div>

          {/* Task List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #000', paddingBottom: '16px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>Active Manifest</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['all', 'high', 'medium', 'low'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    style={{ 
                      fontFamily: 'var(--font-mono)', 
                      fontSize: '10px', 
                      padding: '4px 12px', 
                      border: '2px solid #000',
                      backgroundColor: priorityFilter === p ? '#000' : 'transparent',
                      color: priorityFilter === p ? '#fff' : '#000',
                      cursor: 'pointer',
                      textTransform: 'uppercase'
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {sortedTasks.length === 0 ? (
              <div style={{ padding: '64px', textAlign: 'center', backgroundColor: 'var(--theme-surface-light)', border: '4px dashed #000' }}>
                <CheckCircle2 size={48} style={{ margin: '0 auto 24px', opacity: 0.3 }} />
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700 }}>EMPTY_LOG: All objectives clear.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {sortedTasks.map((task) => (
                  <div 
                    key={task.id}
                    style={{ 
                      backgroundColor: 'var(--theme-surface)', 
                      border: '3px solid #000', 
                      padding: '20px', 
                      display: 'flex', 
                      gap: '20px', 
                      alignItems: 'center',
                      boxShadow: '4px 4px 0px #000',
                      opacity: task.completed ? 0.6 : 1,
                      transition: 'all 0.2s',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <button 
                      onClick={() => toggleTaskCompletion(task)}
                      style={{ 
                        background: 'none', 
                        border: '3px solid #000', 
                        width: '32px', 
                        height: '32px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        cursor: 'pointer',
                        backgroundColor: task.completed ? '#000' : '#fff',
                        color: task.completed ? 'var(--theme-accent)' : '#000'
                      }}
                    >
                      {task.completed ? <Check size={20} /> : null}
                    </button>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <h3 style={{ 
                          fontFamily: 'var(--theme-font-document)', 
                          fontSize: '18px', 
                          margin: 0, 
                          textDecoration: task.completed ? 'line-through' : 'none',
                          fontWeight: 700 
                        }}>
                          {task.title}
                        </h3>
                        <span style={{ 
                          fontFamily: 'var(--font-mono)', 
                          fontSize: '9px', 
                          fontWeight: 900, 
                          padding: '2px 8px', 
                          ...getPriorityStyles(task.priority),
                          textTransform: 'uppercase'
                        }}>
                          {task.priority}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: isOverdue(task.dueDate) && !task.completed ? '#ef4444' : '#666' }}>
                          <Clock size={12} />
                          {formatDueDate(task.dueDate)}
                          {isOverdue(task.dueDate) && !task.completed && ' [OVERDUE]'}
                        </div>
                        {task.description && (
                          <button 
                            onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                            style={{ background: 'none', border: 'none', textDecoration: 'underline', fontFamily: 'var(--font-mono)', fontSize: '11px', cursor: 'pointer' }}
                          >
                            {expandedTaskId === task.id ? 'HIDE_DETAILS' : 'VIEW_DETAILS'}
                          </button>
                        )}
                      </div>
                      
                      {expandedTaskId === task.id && task.description && (
                        <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f3f4f6', border: '1px solid #000', fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.5 }}>
                          {task.description}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setEditingTask(task)} className="brutalist-button-sm">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => deleteTask(task.id)} className="brutalist-button-sm destructive">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ border: '4px solid #000', padding: '24px', backgroundColor: '#fff', boxShadow: '8px 8px 0px #000' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', textTransform: 'uppercase', marginBottom: '16px', borderBottom: '2px solid #000', paddingBottom: '8px' }}>System Preferences</h3>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label className="brutalist-label">Alert Interval</label>
                <select
                  value={(notificationPreferences.reminderTimings || [])[0] || 30}
                  onChange={(e) => {
                    const mins = parseInt(e.target.value);
                    const current = notificationPreferences.reminderTimings || [];
                    if (!current.includes(mins)) {
                      setNotificationPreferences({ reminderTimings: [mins, ...current.filter(m => m !== mins)].sort((a, b) => a - b) });
                    }
                  }}
                  className="brutalist-input"
                  style={{ padding: '8px' }}
                >
                  <option value={5}>5M BEFORE</option>
                  <option value={15}>15M BEFORE</option>
                  <option value={30}>30M BEFORE</option>
                  <option value={60}>1H BEFORE</option>
                  <option value={1440}>24H BEFORE</option>
                </select>
              </div>

              {!notificationPreferences.browserNotifications && (
                <button
                  onClick={requestNotificationPermission}
                  className="brutalist-button primary"
                  style={{ fontSize: '11px', width: '100%' }}
                >
                  ACTIVATE_BROWSER_ALERTS
                </button>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: 'var(--theme-surface-light)', border: '2px solid #000' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: notificationPreferences.enabled ? '#22c55e' : '#666' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 900 }}>REMINDER_ENGINE: {notificationPreferences.enabled ? 'ONLINE' : 'OFFLINE'}</span>
              </div>
            </div>
          </div>

          <div style={{ border: '4px solid #000', padding: '24px', backgroundColor: '#000', color: 'var(--theme-accent)', boxShadow: '8px 8px 0px #000' }}>
            <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>[ EXECUTION_STATS ]</h4>
            <div style={{ display: 'grid', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                <span>TOTAL_OBJECTIVES:</span>
                <span>{projectTasks.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                <span>SUCCESS_RATE:</span>
                <span>{projectTasks.length > 0 ? Math.round((projectTasks.filter(t => t.completed).length / projectTasks.length) * 100) : 0}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Component remains similar but with brutalist styles */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div style={{ backgroundColor: 'var(--theme-surface)', border: '5px solid #000', padding: '32px', width: '100%', maxWidth: '600px', boxShadow: '12px 12px 0px #000' }}>
             <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', textTransform: 'uppercase', marginBottom: '24px' }}>EDIT_MISSION_PARAMETERS</h2>
             <form onSubmit={handleUpdateTask} style={{ display: 'grid', gap: '20px' }}>
                <div>
                   <label className="brutalist-label">Title</label>
                   <input
                    className="brutalist-input"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                   <label className="brutalist-label">Intelligence (Description)</label>
                   <textarea
                    className="brutalist-textarea"
                    style={{ minHeight: '100px' }}
                    value={editingTask.description || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label className="brutalist-label">Priority</label>
                    <select
                      className="brutalist-input"
                      value={editingTask.priority}
                      onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as any })}
                    >
                      <option value="low">LOW</option>
                      <option value="medium">MEDIUM</option>
                      <option value="high">HIGH</option>
                    </select>
                  </div>
                  <div>
                    <label className="brutalist-label">Deadline</label>
                    <input
                      type="datetime-local"
                      className="brutalist-input"
                      value={editingTask.dueDate instanceof Timestamp ? editingTask.dueDate.toDate().toISOString().slice(0, 16) : editingTask.dueDate}
                      onChange={(e) => setEditingTask({ ...editingTask, dueDate: Timestamp.fromDate(new Date(e.target.value)) })}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                  <button type="button" onClick={() => setEditingTask(null)} className="brutalist-button" style={{ flex: 1 }}>ABORT</button>
                  <button type="submit" className="brutalist-button primary" style={{ flex: 2 }}>SYNC_CHANGES</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
