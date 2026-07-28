import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  user: any | null;
  setUser: (user: any | null) => void;
  founderMood: string;
  setFounderMood: (mood: string) => void;
  currentDocument: string;
  setCurrentDocument: (doc: string) => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  hasSeenTutorial: boolean;
  setHasSeenTutorial: (seen: boolean) => void;
  notificationPreferences: any;
  founderIdentity: {
    why: string;
    vision: string;
    constraints: string;
  };
  setFounderIdentity: (identity: { why: string; vision: string; constraints: string }) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  inkloMode: 'DEFAULT' | 'BUILDING' | 'FIXING' | 'STRATEGIZING';
  setInkloMode: (mode: 'DEFAULT' | 'BUILDING' | 'FIXING' | 'STRATEGIZING') => void;
  notionToken: string;
  setNotionToken: (token: string) => void;
  notionParentId: string;
  setNotionParentId: (id: string) => void;
  notionParentType: 'page' | 'database';
  setNotionParentType: (type: 'page' | 'database') => void;
  scratchpadContent: string;
  setScratchpadContent: (content: string) => void;
  isScratchpadOpen: boolean;
  setIsScratchpadOpen: (isOpen: boolean) => void;
  roadmapTasks: Array<{ id: number; task: string; done: boolean; status?: 'Planned' | 'In-Progress' | 'Done' }>;
  setRoadmapTasks: (tasks: Array<{ id: number; task: string; done: boolean; status?: 'Planned' | 'In-Progress' | 'Done' }>) => void;
  toggleRoadmapTask: (id: number) => void;
  updateRoadmapTaskStatus: (id: number, status: 'Planned' | 'In-Progress' | 'Done') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      founderMood: 'HYPER-FOCUSED',
      setFounderMood: (founderMood) => set({ founderMood }),
      currentDocument: '',
      setCurrentDocument: (currentDocument) => set({ currentDocument }),
      activeTab: 'strategy',
      setActiveTab: (activeTab) => set({ activeTab }),
      hasSeenTutorial: false,
      setHasSeenTutorial: (hasSeenTutorial) => set({ hasSeenTutorial }),
      notificationPreferences: {
        reminderTimings: [15, 30, 60]
      },
      founderIdentity: {
        why: 'To achieve absolute creative independence and build tools that empower lone founders.',
        vision: 'Inklo becomes the default operating system for high-velocity solo enterprise builders.',
        constraints: 'Zero external VC funding. No bloating the headcount. Maintain a lean $0 marketing budget through high-utility virality.'
      },
      setFounderIdentity: (founderIdentity) => set({ founderIdentity }),
      isProcessing: false,
      setIsProcessing: (isProcessing) => set({ isProcessing }),
      inkloMode: 'DEFAULT',
      setInkloMode: (inkloMode) => set({ inkloMode }),
      notionToken: '',
      setNotionToken: (notionToken) => set({ notionToken }),
      notionParentId: '',
      setNotionParentId: (notionParentId) => set({ notionParentId }),
      notionParentType: 'page',
      setNotionParentType: (notionParentType) => set({ notionParentType }),
      scratchpadContent: '',
      setScratchpadContent: (scratchpadContent) => set({ scratchpadContent }),
      isScratchpadOpen: false,
      setIsScratchpadOpen: (isScratchpadOpen) => set({ isScratchpadOpen }),
      roadmapTasks: [
        { id: 1, task: 'Refine GPT-4o context window for strategy generation', done: true, status: 'Done' },
        { id: 2, task: 'Implement high-fidelity revenue simulation models', done: false, status: 'In-Progress' },
        { id: 3, task: 'Audit V5 logic for GDPR/CCPA data sovereignty', done: true, status: 'Done' },
        { id: 4, task: 'Optimize Inklo mascot 3D rendering path', done: false, status: 'Planned' }
      ],
      setRoadmapTasks: (roadmapTasks) => set({ roadmapTasks }),
      toggleRoadmapTask: (id) => set((state) => ({
        roadmapTasks: state.roadmapTasks.map(t => {
          if (t.id === id) {
            const nextDone = !t.done;
            return {
              ...t,
              done: nextDone,
              status: nextDone ? 'Done' : 'Planned'
            };
          }
          return t;
        })
      })),
      updateRoadmapTaskStatus: (id, status) => set((state) => ({
        roadmapTasks: state.roadmapTasks.map(t => t.id === id ? { ...t, status, done: status === 'Done' } : t)
      }))
    }),
    {
      name: 'soloscribe-v5-storage',
    }
  )
);
