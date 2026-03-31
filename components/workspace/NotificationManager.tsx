import React, { useEffect, useRef } from 'react';
import { useUI, useTaskStore, Task } from '../../lib/state';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  where, 
  Timestamp,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { toast } from 'sonner';

export function NotificationManager() {
  const { user } = useAuth();
  const { currentProjectId, notificationPreferences } = useUI();
  const { tasks, setTasks, updateTask } = useTaskStore();
  const notifiedTasksRef = useRef<Set<string>>(new Set());

  // 1. Fetch tasks for the current project
  useEffect(() => {
    if (!user || !currentProjectId) {
      setTasks([]);
      return;
    }

    const tasksRef = collection(db, 'users', user.uid, 'projects', currentProjectId, 'tasks');
    const q = query(tasksRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks: Task[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(fetchedTasks);
    }, (error) => {
      console.error("Error fetching tasks:", error);
    });

    return () => unsubscribe();
  }, [user, currentProjectId, setTasks]);

  // 2. Check for upcoming tasks and notify
  useEffect(() => {
    if (!notificationPreferences.enabled || tasks.length === 0) return;

    const checkNotifications = () => {
      const now = Date.now();
      const reminderMs = notificationPreferences.reminderMinutes * 60 * 1000;

      tasks.forEach(async (task) => {
        if (task.completed || task.notified) return;
        if (notifiedTasksRef.current.has(task.id)) return;

        const dueDateMs = task.dueDate.toMillis();
        const timeUntilDue = dueDateMs - now;

        // If task is due within the reminder window OR is overdue
        if (timeUntilDue <= reminderMs) {
          notifiedTasksRef.current.add(task.id);
          
          const message = timeUntilDue <= 0 
            ? `Task Overdue: ${task.title}` 
            : `Upcoming Task: ${task.title} (Due in ${Math.round(timeUntilDue / 60000)}m)`;

          // In-app toast
          toast.info(message, {
            description: `Due at ${task.dueDate.toDate().toLocaleString()}`,
            duration: 10000,
          });

          // Browser notification
          if (notificationPreferences.browserNotifications && Notification.permission === 'granted') {
            new Notification('SoloScribe Task Reminder', {
              body: message,
              icon: '/favicon.ico', // Fallback icon
            });
          }

          // Mark as notified in Firestore to prevent duplicate alerts
          if (user && currentProjectId) {
            try {
              const taskRef = doc(db, 'users', user.uid, 'projects', currentProjectId, 'tasks', task.id);
              await updateDoc(taskRef, {
                notified: true,
                updatedAt: serverTimestamp(),
              });
            } catch (error) {
              console.error("Error updating task notified status:", error);
            }
          }
        }
      });
    };

    // Check every 30 seconds
    const interval = setInterval(checkNotifications, 30000);
    
    // Also check immediately
    checkNotifications();

    return () => clearInterval(interval);
  }, [tasks, notificationPreferences, user, currentProjectId]);

  return null; // This component doesn't render anything
}
