import React, { useEffect, useRef } from 'react';
import { useUI, useTaskStore, Task } from '../../lib/state';
import { useAuth } from '../../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  where, 
  Timestamp,
  doc,
  updateDoc,
  serverTimestamp,
  arrayUnion
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
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/projects/${currentProjectId}/tasks`);
    });

    return () => unsubscribe();
  }, [user, currentProjectId, setTasks]);

  // 2. Check for upcoming tasks and notify
  useEffect(() => {
    if (!notificationPreferences.enabled || tasks.length === 0) return;

    const checkNotifications = async () => {
      const now = Date.now();
      
      for (const task of tasks) {
        if (task.completed) continue;

        const dueDateMs = task.dueDate.toMillis();
        const timeUntilDue = dueDateMs - now;

        // Check each reminder timing
        for (const minutes of (notificationPreferences.reminderTimings || [])) {
          const reminderMs = minutes * 60 * 1000;
          const notificationKey = `${task.id}_${minutes}`;

          // Check session cache OR firestore record
          if (notifiedTasksRef.current.has(notificationKey)) continue;
          if (task.notifiedTimings?.includes(minutes)) continue;

          // If task is due within the reminder window
          if (timeUntilDue <= reminderMs && timeUntilDue > reminderMs - 60000) {
            notifiedTasksRef.current.add(notificationKey);
            
            const message = `Upcoming Task: ${task.title} (Due in ${minutes}m)`;

            // In-app toast
            toast.info(message, {
              description: `Due at ${task.dueDate.toDate().toLocaleString()}`,
              duration: 10000,
            });

            // Browser notification
            if (notificationPreferences.browserNotifications && Notification.permission === 'granted') {
              new Notification('SoloScribe Task Reminder', {
                body: message,
                icon: '/favicon.ico',
              });
            }

            // Mark as notified in Firestore for this timing
            if (user && currentProjectId) {
              try {
                const taskRef = doc(db, 'users', user.uid, 'projects', currentProjectId, 'tasks', task.id);
                await updateDoc(taskRef, {
                  notifiedTimings: arrayUnion(minutes),
                  updatedAt: serverTimestamp(),
                });
              } catch (error) {
                handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/projects/${currentProjectId}/tasks/${task.id}`);
              }
            }
          }
        }

        // Special check for overdue or exactly due (0m)
        if (timeUntilDue <= 0 && !task.notified) {
          const notificationKey = `${task.id}_due`;
          if (notifiedTasksRef.current.has(notificationKey)) continue;
          
          notifiedTasksRef.current.add(notificationKey);
          const message = `Task Overdue: ${task.title}`;

          toast.error(message, {
            description: `Was due at ${task.dueDate.toDate().toLocaleString()}`,
            duration: 0, // Persistent until closed
          });

          if (notificationPreferences.browserNotifications && Notification.permission === 'granted') {
            new Notification('SoloScribe Task Overdue', {
              body: message,
              icon: '/favicon.ico',
            });
          }

          // Mark as notified in Firestore
          if (user && currentProjectId) {
            try {
              const taskRef = doc(db, 'users', user.uid, 'projects', currentProjectId, 'tasks', task.id);
              await updateDoc(taskRef, {
                notified: true,
                updatedAt: serverTimestamp(),
              });
            } catch (error) {
              handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/projects/${currentProjectId}/tasks/${task.id}`);
            }
          }
        }
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkNotifications, 30000);
    
    // Also check immediately
    checkNotifications();

    return () => clearInterval(interval);
  }, [tasks, notificationPreferences, user, currentProjectId]);

  return null; // This component doesn't render anything
}
