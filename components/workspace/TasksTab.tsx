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
  Flag
} from 'lucide-react';
import { useUI, useTaskStore, Task } from '../../lib/state';
import { useAuth } from '../../contexts/AuthContext';
import { db, OperationType, handleFirestoreError } from '../../firebase';
import { Tooltip } from '../Tooltip';
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
  const { currentProjectId, notificationPreferences, setNotificationPreferences } = useUI();
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

  const projectTasks = tasks.filter(t => t.projectId === currentProjectId);
  const filteredTasks = projectTasks.filter(t => priorityFilter === 'all' || t.priority === priorityFilter);
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    
    // Sort by priority
    const priorityMap = { high: 0, medium: 1, low: 2 };
    if (a.priority !== b.priority) return priorityMap[a.priority] - priorityMap[b.priority];
    
    return a.dueDate.toMillis() - b.dueDate.toMillis();
  });

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentProjectId || !newTaskTitle || !newTaskDueDate) return;

    setIsAdding(true);
    try {
      const tasksRef = collection(db, 'users', user.uid, 'projects', currentProjectId, 'tasks');
      const dueDate = new Date(newTaskDueDate);
      
      await addDoc(tasksRef, {
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
      toast.success('Task added successfully');
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
      toast.success('Task updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/projects/${currentProjectId}/tasks/${editingTask.id}`);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user || !currentProjectId) return;

    try {
      const taskRef = doc(db, 'users', user.uid, 'projects', currentProjectId, 'tasks', taskId);
      await deleteDoc(taskRef);
      toast.success('Task deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/projects/${currentProjectId}/tasks/${taskId}`);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('This browser does not support desktop notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      setNotificationPreferences({ browserNotifications: true });
      toast.success('Notifications already enabled');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationPreferences({ browserNotifications: true });
      toast.success('Notifications enabled');
    } else {
      toast.error('Notification permission denied');
    }
  };

  const isOverdue = (dueDate: any) => {
    return dueDate.toMillis() < Date.now();
  };

  const formatDueDate = (dueDate: any) => {
    const date = dueDate.toDate();
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 border-red-500/30 bg-red-500/10';
      case 'medium': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
      case 'low': return 'text-blue-500 border-blue-500/30 bg-blue-500/10';
      default: return 'text-muted-foreground border-border bg-muted/30';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks & Notifications</h2>
          <p className="text-muted-foreground">Manage your project milestones and deadlines.</p>
        </div>
        <div className="flex items-center gap-4">
          <Tooltip content={notificationPreferences.enabled ? "Disable Notifications" : "Enable Notifications"} position="bottom">
            <button
              onClick={() => setNotificationPreferences({ enabled: !notificationPreferences.enabled })}
              className={c(
                "p-2 rounded-full transition-colors",
                notificationPreferences.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              {notificationPreferences.enabled ? <Bell size={20} /> : <BellOff size={20} />}
            </button>
          </Tooltip>
          {!notificationPreferences.browserNotifications && (
            <button
              onClick={requestNotificationPermission}
              className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-md hover:opacity-90 transition-opacity"
            >
              Enable Browser Alerts
            </button>
          )}
        </div>
      </div>

      {/* Notification Settings - Simplified since full settings are in UserSettings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border">
        <div className="space-y-2">
          <label className="text-sm font-medium">Primary Reminder</label>
          <div className="flex items-center gap-2">
            <select
              value={notificationPreferences.reminderTimings[0] || 30}
              onChange={(e) => {
                const mins = parseInt(e.target.value);
                const current = notificationPreferences.reminderTimings;
                if (!current.includes(mins)) {
                  setNotificationPreferences({ reminderTimings: [mins, ...current.filter(m => m !== mins)].sort((a, b) => a - b) });
                }
              }}
              className="bg-background border border-border rounded-md px-2 py-1 text-sm"
            >
              <option value={5}>5 minutes before</option>
              <option value={15}>15 minutes before</option>
              <option value={30}>30 minutes before</option>
              <option value={60}>1 hour before</option>
              <option value={1440}>1 day before</option>
            </select>
            <span className="text-xs text-muted-foreground">Quick set primary alert</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="browser-notif"
            checked={notificationPreferences.browserNotifications}
            onChange={(e) => setNotificationPreferences({ browserNotifications: e.target.checked })}
            className="rounded border-border"
          />
          <label htmlFor="browser-notif" className="text-sm font-medium">
            Enable Browser Notifications
          </label>
        </div>
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex-1">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Task Title</label>
              <input
                type="text"
                placeholder="What needs to be done?"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full bg-transparent border-b border-border focus:border-primary outline-none py-2 text-xl font-bold"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider block">Priority</label>
                <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-lg p-2">
                  <Flag size={18} className="text-muted-foreground ml-1" />
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="flex-1 bg-transparent outline-none text-sm font-medium cursor-pointer"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider block">Due Date & Time</label>
                <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-lg p-2 focus-within:border-primary transition-colors">
                  <CalendarIcon size={18} className="text-muted-foreground ml-1" />
                  <input
                    type="datetime-local"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm font-medium cursor-pointer"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider block">Description</label>
            <textarea
              placeholder="Add a description (optional)..."
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-lg p-4 text-sm min-h-[100px] focus:border-primary outline-none transition-colors resize-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isAdding}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-xl hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 font-bold text-lg shadow-[4px_4px_0px_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none"
            >
              <Plus size={20} />
              Save Task
            </button>
          </div>
        </div>
      </form>

      {/* Task List Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-xl font-bold">Your Tasks</h3>
        <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border">
          {(['all', 'high', 'medium', 'low'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={c(
                "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
                priorityFilter === p 
                  ? "bg-primary text-primary-foreground shadow-[2px_2px_0px_rgba(0,0,0,0.2)]" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
            <CheckCircle2 size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No tasks yet. Add one above to stay on track.</p>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <div 
              key={task.id}
              className={c(
                "group flex flex-col bg-card border border-border rounded-xl transition-all hover:shadow-md overflow-hidden",
                task.completed && "opacity-60"
              )}
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4 flex-1">
                  <button 
                    onClick={() => toggleTaskCompletion(task)}
                    className="text-primary hover:scale-110 transition-transform flex-shrink-0"
                  >
                    {task.completed ? <CheckCircle size={24} /> : <Circle size={24} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={c(
                        "font-semibold truncate",
                        task.completed && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </h3>
                      <div className={c(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter border",
                        getPriorityColor(task.priority)
                      )}>
                        {task.priority}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={c(
                        "flex items-center gap-1 text-xs",
                        !task.completed && isOverdue(task.dueDate) ? "text-destructive font-semibold" : "text-muted-foreground"
                      )}>
                        <Clock size={12} />
                        {formatDueDate(task.dueDate)}
                        {!task.completed && isOverdue(task.dueDate) && " (Overdue)"}
                      </span>
                      {task.description && (
                        <button 
                          onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          {expandedTaskId === task.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {expandedTaskId === task.id ? 'Hide Details' : 'Show Details'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Tooltip content="Edit Task" position="top">
                    <button
                      onClick={() => setEditingTask(task)}
                      className="p-2 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                  </Tooltip>
                  <Tooltip content="Delete Task" position="left">
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </Tooltip>
                </div>
              </div>

              {expandedTaskId === task.id && task.description && (
                <div className="px-12 pb-4 text-sm text-muted-foreground animate-in slide-in-from-top-2 duration-200">
                  <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                    {task.description}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-6">Edit Task</h3>
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full bg-muted/30 border border-border rounded-lg p-2 focus:border-primary outline-none"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full bg-muted/30 border border-border rounded-lg p-2 min-h-[100px] focus:border-primary outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as any })}
                    className="w-full bg-muted/30 border border-border rounded-lg p-2 focus:border-primary outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Due Date</label>
                  <input
                    type="datetime-local"
                    value={editingTask.dueDate instanceof Timestamp ? editingTask.dueDate.toDate().toISOString().slice(0, 16) : editingTask.dueDate}
                    onChange={(e) => setEditingTask({ ...editingTask, dueDate: Timestamp.fromDate(new Date(e.target.value)) })}
                    className="w-full bg-muted/30 border border-border rounded-lg p-2 focus:border-primary outline-none"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Legend/Info */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground pt-4 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-destructive" />
          <span>Overdue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span>Upcoming</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-muted-foreground" />
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
}
