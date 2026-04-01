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
  CheckCircle
} from 'lucide-react';
import { useUI, useTaskStore, Task } from '../../lib/state';
import { useAuth } from '../../contexts/AuthContext';
import { db, OperationType, handleFirestoreError } from '../../firebase';
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
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const projectTasks = tasks.filter(t => t.projectId === currentProjectId);
  const sortedTasks = [...projectTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
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
        dueDate: Timestamp.fromDate(dueDate),
        completed: false,
        notified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setNewTaskTitle('');
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

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks & Notifications</h2>
          <p className="text-muted-foreground">Manage your project milestones and deadlines.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setNotificationPreferences({ enabled: !notificationPreferences.enabled })}
            className={c(
              "p-2 rounded-full transition-colors",
              notificationPreferences.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}
            title={notificationPreferences.enabled ? "Disable Notifications" : "Enable Notifications"}
          >
            {notificationPreferences.enabled ? <Bell size={20} /> : <BellOff size={20} />}
          </button>
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
      <form onSubmit={handleAddTask} className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="What needs to be done?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full bg-transparent border-b border-border focus:border-primary outline-none py-2 text-lg"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon size={18} className="text-muted-foreground" />
            <input
              type="datetime-local"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="bg-transparent border border-border rounded-md px-2 py-1 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isAdding}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
          >
            <Plus size={18} />
            Add Task
          </button>
        </div>
      </form>

      {/* Task List */}
      <div className="space-y-3">
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
                "group flex items-center justify-between p-4 bg-card border border-border rounded-xl transition-all hover:shadow-md",
                task.completed && "opacity-60"
              )}
            >
              <div className="flex items-center gap-4 flex-1">
                <button 
                  onClick={() => toggleTaskCompletion(task)}
                  className="text-primary hover:scale-110 transition-transform"
                >
                  {task.completed ? <CheckCircle size={24} /> : <Circle size={24} />}
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className={c(
                    "font-medium truncate",
                    task.completed && "line-through text-muted-foreground"
                  )}>
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={c(
                      "flex items-center gap-1 text-xs",
                      !task.completed && isOverdue(task.dueDate) ? "text-destructive font-semibold" : "text-muted-foreground"
                    )}>
                      <Clock size={12} />
                      {formatDueDate(task.dueDate)}
                      {!task.completed && isOverdue(task.dueDate) && " (Overdue)"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>

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
