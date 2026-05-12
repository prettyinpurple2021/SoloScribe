/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Agent,
  Inklo,
  Amelie,
  Ari,
  Defne,
  Hans,
  Hiro,
  Ines,
  Irene,
  Jiwon,
  Karim,
  Luca,
  Mei,
  Newton,
  Olga,
  Rahul,
  Ramon,
  Reza,
  Sam,
  Tom,
  Gauss,
  Vance,
} from './presets/agents';
import { themes } from './themes';
import { FONT_OPTIONS, PLACEHOLDER_DOC } from './constants';

/**
 * ===================================================================
 *  ZUSTAND STATE MANAGEMENT
 * ===================================================================
 * This file centralizes the application's global state using Zustand.
 * Each "slice" of the state is managed by its own store.
 * ===================================================================
 */

/**
 * `useUser` Store
 * Manages all settings and context related to the end-user.
 */
export type ContextFile = {
  name: string;
  text: string;
  type: 'pdf' | 'text' | 'markdown';
};

export type User = {
  name?: string;
  info?: string;
  topic?: string;
  format: 'Markdown' | 'HTML';
  contextFiles: ContextFile[];
  profilePicture?: string;
  webhookUrl?: string;
  memory?: string;
};

export const useUser = create<
  {
    setName: (name: string) => void;
    setInfo: (info: string) => void;
    setTopic: (topic: string) => void;
    setFormat: (format: 'Markdown' | 'HTML') => void;
    setProfilePicture: (data: string | undefined) => void;
    addContextFile: (file: ContextFile) => void;
    removeContextFile: (name: string) => void;
    clearContextFiles: () => void;
    setMemory: (memory: string) => void;
    resetUser: () => void;
  } & User
>(set => ({
  name: '',
  info: '',
  topic: '',
  format: 'Markdown',
  profilePicture: undefined,
  contextFiles: [],
  memory: '',
  setName: name => set({ name }),
  setInfo: info => set({ info }),
  setTopic: topic => set({ topic }),
  setFormat: format => set({ format }),
  setProfilePicture: profilePicture => set({ profilePicture }),
  addContextFile: file => set(state => ({ contextFiles: [...state.contextFiles, file] })),
  removeContextFile: name => set(state => ({ contextFiles: state.contextFiles.filter(f => f.name !== name) })),
  clearContextFiles: () => set({ contextFiles: [] }),
  setMemory: memory => set({ memory }),
  resetUser: () => set({ info: '', topic: '', contextFiles: [] }),
}));

/**
 * `useAgent` Store
 * Manages the state of the AI agents, including the currently active agent
 * and the list of available agents.
 */
function getAgentById(id: string) {
  const { availablePersonal, availablePresets } = useAgent.getState();
  return (
    availablePersonal.find(agent => agent.id === id) ||
    availablePresets.find(agent => agent.id === id)
  );
}

export const useAgent = create<{
  current: Agent;
  availablePresets: Agent[];
  availablePersonal: Agent[];
  setCurrent: (agent: Agent | string) => void;
  addAgent: (agent: Agent) => void;
  update: (agentId: string, adjustments: Partial<Agent>) => void;
}>()(
  persist(
    (set) => ({
      current: Inklo,
      availablePresets: [
        Inklo,
        Sam,
        Irene,
        Tom,
        Rahul,
        Ramon,
        Amelie,
        Ari,
        Mei,
        Hiro,
        Jiwon,
        Hans,
        Newton,
        Defne,
        Karim,
        Reza,
        Ines,
        Olga,
        Luca,
        Gauss,
        Vance,
      ],
      availablePersonal: [],

      addAgent: (agent: Agent) => {
        set(state => ({
          availablePersonal: [...state.availablePersonal, agent],
          current: agent,
        }));
      },
      setCurrent: (agent: Agent | string) =>
        set({ current: typeof agent === 'string' ? getAgentById(agent) : agent }),
      update: (agentId: string, adjustments: Partial<Agent>) => {
        let agent = getAgentById(agentId);
        if (!agent) return;
        const updatedAgent = { ...agent, ...adjustments };
        set(state => ({
          availablePresets: state.availablePresets.map(a =>
            a.id === agentId ? updatedAgent : a
          ),
          availablePersonal: state.availablePersonal.map(a =>
            a.id === agentId ? updatedAgent : a
          ),
          current: state.current.id === agentId ? updatedAgent : state.current,
        }));
      },
    }),
    {
      name: 'agent-storage',
      merge: (persistedState: any, currentState: any) => {
        // Find the updated preset for the current agent if it exists
        let updatedCurrent = persistedState?.current;
        if (updatedCurrent) {
          const matchingPreset = currentState.availablePresets.find((a: any) => a.id === updatedCurrent.id);
          if (matchingPreset) {
            updatedCurrent = matchingPreset;
          }
        }

        return {
          ...currentState,
          ...persistedState,
          // Always use the latest presets from code to reflect name changes
          availablePresets: currentState.availablePresets,
          // Update current agent with preset changes if applicable
          current: updatedCurrent || currentState.current,
        };
      },
    }
  ) as any
);

/**
 * `useUI` Store
 * Manages the state of the user interface, such as the visibility of modals,
 * the selected theme, and other UI-related flags.
 */
export type TranscriptEntry = {
  speaker: string;
  text: string;
};

/**
 * Workspace Data Models
 */
export type GlobalVariable = {
  id: string;
  name: string;
  value: string;
  description?: string;
};

export type UserTemplate = {
  id: string;
  name: string;
  description: string;
  content: string;
  createdAt: number;
};

export type WikiLink = {
  sourceProjectId: string;
  targetProjectId: string;
  title: string;
};

export type Project = {
  id: string;
  name: string;
  documentContent: string;
  transcript: TranscriptEntry[];
  updatedAt: any;
  createdAt: any;
  userId?: string;
  isPublic?: boolean;
  shareId?: string;
  viewCount?: number;
  lastViewedAt?: any;
};

/**
 * `useWorkspaceStore` Store
 * Manages global variables, user templates, and cross-project links.
 */
export const useWorkspaceStore = create<{
  variables: GlobalVariable[];
  setVariables: (variables: GlobalVariable[]) => void;
  updateVariable: (id: string, value: string) => void;
  addVariable: (variable: GlobalVariable) => void;
  removeVariable: (id: string) => void;
  
  userTemplates: UserTemplate[];
  setUserTemplates: (templates: UserTemplate[]) => void;
  addUserTemplate: (template: UserTemplate) => void;
  removeUserTemplate: (id: string) => void;

  wikiLinks: WikiLink[];
  addWikiLink: (link: WikiLink) => void;
  removeWikiLink: (source: string, target: string) => void;
}>()(
  persist(
    (set) => ({
      variables: [
        { id: 'var_company', name: 'COMPANY_NAME', value: 'My Startup', description: 'Your startup name' },
        { id: 'var_mission', name: 'MISSION', value: 'To solve X using Y', description: 'Your core mission' }
      ],
      setVariables: (variables) => set({ variables }),
      updateVariable: (id, value) => set(state => ({
        variables: state.variables.map(v => v.id === id ? { ...v, value } : v)
      })),
      addVariable: (v) => set(state => ({ variables: [...state.variables, v] })),
      removeVariable: (id) => set(state => ({ variables: state.variables.filter(v => v.id !== id) })),

      userTemplates: [],
      setUserTemplates: (userTemplates) => set({ userTemplates }),
      addUserTemplate: (t) => set(state => ({ userTemplates: [...state.userTemplates, t] })),
      removeUserTemplate: (id) => set(state => ({ userTemplates: state.userTemplates.filter(t => t.id !== id) })),

      wikiLinks: [],
      addWikiLink: (link) => set(state => ({ wikiLinks: [...state.wikiLinks, link] })),
      removeWikiLink: (source, target) => set(state => ({
        wikiLinks: state.wikiLinks.filter(l => !(l.sourceProjectId === source && l.targetProjectId === target))
      })),
    }),
    {
      name: 'workspace-storage'
    }
  ) as any
);

export type Feedback = {
  id: string;
  projectId: string;
  ownerId: string;
  content: string;
  authorName: string;
  createdAt: any;
};

export type Task = {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: any; // Firestore Timestamp
  completed: boolean;
  notified?: boolean;
  notifiedTimings?: number[];
  createdAt?: any;
  updatedAt?: any;
};

export type NotificationPreferences = {
  enabled: boolean;
  browserNotifications: boolean;
  reminderTimings: number[]; // Array of minutes before due date to notify
};

export const useUI = create<{
  showWelcomeScreen: boolean;
  setShowWelcomeScreen: (show: boolean) => void;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (completed: boolean) => void;
  showUserConfig: boolean;
  setShowUserConfig: (show: boolean) => void;
  showAgentEdit: boolean;
  setShowAgentEdit: (show: boolean) => void;
  showDebugModal: boolean;
  setShowDebugModal: (show: boolean) => void;
  showHelpModal: boolean;
  setShowHelpModal: (show: boolean) => void;
  showDisclaimer: boolean;
  setShowDisclaimer: (show: boolean) => void;
  showChatHistory: boolean;
  setShowChatHistory: (show: boolean) => void;
  showCopilot: boolean;
  setShowCopilot: (show: boolean) => void;
  showProjectSidebar: boolean;
  setShowProjectSidebar: (show: boolean) => void;
  theme: string;
  setTheme: (themeName: string) => void;
  font: string;
  setFont: (fontName: string) => void;
  exportTheme: 'brutalist' | 'corporate' | 'modern';
  setExportTheme: (theme: 'brutalist' | 'corporate' | 'modern') => void;
  suppressRedundantLogs: boolean;
  setSuppressRedundantLogs: (suppress: boolean) => void;
  suppressStaleAgentResponses: boolean;
  setSuppressStaleAgentResponses: (suppress: boolean) => void;
  suppressPostFlushAudio: boolean;
  setSuppressPostFlushAudio: (suppress: boolean) => void;
  changeCount: number;
  incrementChangeCount: () => void;
  agentState: string | null;
  setAgentState: (state: string | null) => void;
  founderMood: 'great' | 'good' | 'neutral' | 'tired' | 'stressed' | 'overwhelmed' | null;
  setFounderMood: (mood: 'great' | 'good' | 'neutral' | 'tired' | 'stressed' | 'overwhelmed' | null) => void;
  mainTab: 'document' | 'transcript' | 'minutes' | 'audio-log' | 'chatbot' | 'tools' | 'validation' | 'projections' | 'roadmap' | 'tasks' | 'marketing' | 'search' | 'compliance' | 'monetization';
  setMainTab: (tab: 'document' | 'transcript' | 'minutes' | 'audio-log' | 'chatbot' | 'tools' | 'validation' | 'projections' | 'roadmap' | 'tasks' | 'marketing' | 'search' | 'compliance' | 'monetization') => void;
  documentTab: 'editor' | 'rendered';
  setDocumentTab: (tab: 'editor' | 'rendered') => void;
  speechBubbleText: string | null;
  setSpeechBubbleText: (text: string | null) => void;
  documentContent: string;
  setDocumentContent: (content: string | ((prev: string) => string)) => void;
  outputModality: 'audio' | 'text' | 'both';
  setOutputModality: (modality: 'audio' | 'text' | 'both') => void;
  useSearch: boolean;
  setUseSearch: (useSearch: boolean) => void;
  liveApiModel: string;
  setLiveApiModel: (model: string) => void;
  transcript: TranscriptEntry[];
  setTranscript: (transcript: TranscriptEntry[] | ((prev: TranscriptEntry[]) => TranscriptEntry[])) => void;
  resetDocument: () => void;
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  notificationPreferences: NotificationPreferences;
  setNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void;
  webhookUrl: string;
  setWebhookUrl: (url: string) => void;
  showTutorial: boolean;
  setShowTutorial: (show: boolean) => void;
  tutorialStep: number;
  setTutorialStep: (step: number) => void;
}>()(
  persist(
    (set) => ({
      showWelcomeScreen: true,
      setShowWelcomeScreen: (show: boolean) => set({ showWelcomeScreen: show }),
      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: (completed: boolean) => set({ hasCompletedOnboarding: completed }),
      showUserConfig: false,
      setShowUserConfig: (show: boolean) => set({ showUserConfig: show }),
      showAgentEdit: false,
      setShowAgentEdit: (show: boolean) => set({ showAgentEdit: show }),
      showDebugModal: false,
      setShowDebugModal: (show: boolean) => set({ showDebugModal: show }),
      showHelpModal: false,
      setShowHelpModal: (show: boolean) => set({ showHelpModal: show }),
      showDisclaimer: false,
      setShowDisclaimer: (show: boolean) => set({ showDisclaimer: show }),
      showChatHistory: false,
      setShowChatHistory: (show: boolean) => set({ showChatHistory: show }),
      showCopilot: false,
      setShowCopilot: (show: boolean) => set({ showCopilot: show }),
      showProjectSidebar: false,
      setShowProjectSidebar: (show: boolean) => set({ showProjectSidebar: show }),
      theme: themes[0].name,
      setTheme: (themeName: string) => set({ theme: themeName }),
      font: 'Rajdhani',
      setFont: (fontName: string) => set({ font: fontName }),
      exportTheme: 'brutalist',
      setExportTheme: (exportTheme) => set({ exportTheme }),
      suppressRedundantLogs: false,
      setSuppressRedundantLogs: (suppress: boolean) => set({ suppressRedundantLogs: suppress }),
      suppressStaleAgentResponses: false,
      setSuppressStaleAgentResponses: (suppress: boolean) => set({ suppressStaleAgentResponses: suppress }),
      suppressPostFlushAudio: true,
      setSuppressPostFlushAudio: (suppress: boolean) => set({ suppressPostFlushAudio: suppress }),
      changeCount: 0,
      incrementChangeCount: () => set(state => ({ changeCount: state.changeCount + 1 })),
      agentState: null,
      setAgentState: (state: string | null) => set({ agentState: state }),
      founderMood: null,
      setFounderMood: (mood) => set({ founderMood: mood }),
      mainTab: 'document',
      setMainTab: (tab) => set({ mainTab: tab }),
      documentTab: 'rendered',
      setDocumentTab: (tab) => set({ documentTab: tab }),
      speechBubbleText: null,
      setSpeechBubbleText: (text) => set({ speechBubbleText: text }),
      documentContent: PLACEHOLDER_DOC,
      setDocumentContent: (content) =>
        set(state => ({
          documentContent: typeof content === 'function' ? content(state.documentContent) : content,
        })),
      outputModality: 'audio',
      setOutputModality: (modality) => set({ outputModality: modality }),
      useSearch: true,
      setUseSearch: (useSearch) => set({ useSearch }),
      liveApiModel: 'gemini-2.5-flash-native-audio-preview-09-2025',
      setLiveApiModel: (model) => set({ liveApiModel: model }),
      transcript: [],
      setTranscript: (transcript) =>
        set(state => ({
          transcript: typeof transcript === 'function' ? transcript(state.transcript) : transcript,
        })),
      resetDocument: () => set({ documentContent: PLACEHOLDER_DOC, transcript: [], changeCount: 0, currentProjectId: null }),
      currentProjectId: null,
      setCurrentProjectId: (id) => set({ currentProjectId: id }),
      projects: [],
      setProjects: (projects) => set({ projects }),
      notificationPreferences: {
        enabled: true,
        browserNotifications: false,
        reminderTimings: [30], // Default to 30 minutes
      },
      setNotificationPreferences: (prefs) =>
        set(state => ({
          notificationPreferences: { 
            enabled: true,
            browserNotifications: false,
            reminderTimings: [30],
            ...state.notificationPreferences, 
            ...prefs 
          },
        })),
      webhookUrl: '',
      setWebhookUrl: (url: string) => set({ webhookUrl: url }),
      showTutorial: false,
      setShowTutorial: (show: boolean) => set({ showTutorial: show }),
      tutorialStep: 0,
      setTutorialStep: (step: number) => set({ tutorialStep: step }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        theme: state.theme,
        font: state.font,
        exportTheme: state.exportTheme,
        outputModality: state.outputModality,
        currentProjectId: state.currentProjectId,
        notificationPreferences: state.notificationPreferences,
        founderMood: state.founderMood,
        webhookUrl: state.webhookUrl,
      }),
    }
  )
);

/**
 * `useTaskStore` Store
 * Manages the state of tasks related to projects.
 */
export const useTaskStore = create<{
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
}>((set) => ({
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  toggleTask: (id) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    })),
  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),
}));

/**
 * `useLogStore` Store
 * Manages a rolling list of log entries for the debug modal.
 */
export type LogEntry = {
  timestamp: Date;
  endTimestamp?: Date;
  turn?: number;
  api: string;
  inputSize: number | string;
  outputSize: number | string;
  status: 'success' | 'error';
  error?: string;
  prompt?: string;
  response?: string;
  audioSize?: number;
  audioBlob?: Blob;
  promptVersion?: number;
};

const MAX_LOG_ENTRIES = 50;

export const useLogStore = create<{
  logs: LogEntry[];
  suppressedLogs: LogEntry[];
  suppressedAudioCount: number;
  addLog: (log: Omit<LogEntry, 'timestamp'> & { timestamp?: Date }) => void;
  addSuppressedLog: (log: Omit<LogEntry, 'timestamp'> & { timestamp?: Date }) => void;
  incrementSuppressedAudioCount: () => void;
}>(set => ({
  logs: [],
  suppressedLogs: [],
  suppressedAudioCount: 0,
  addLog: log => {
    set(state => {
      const { timestamp, ...rest } = log;
      const newLog: LogEntry = { ...rest, timestamp: timestamp || new Date() };
      const updatedLogs = [newLog, ...state.logs];
      // Keep the log array from growing indefinitely.
      if (updatedLogs.length > MAX_LOG_ENTRIES) {
        updatedLogs.pop();
      }
      // Sort logs by timestamp descending (latest first)
      updatedLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return { logs: updatedLogs };
    });
  },
  addSuppressedLog: log => {
    set(state => {
      const { timestamp, ...rest } = log;
      const newLog: LogEntry = { ...rest, timestamp: timestamp || new Date() };
      const updatedLogs = [newLog, ...state.suppressedLogs];
      if (updatedLogs.length > MAX_LOG_ENTRIES) {
        updatedLogs.pop();
      }
      updatedLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return { suppressedLogs: updatedLogs };
    });
  },
  incrementSuppressedAudioCount: () =>
    set(state => ({ suppressedAudioCount: state.suppressedAudioCount + 1 })),
}));

/**
 * `usePerfLogStore` Store
 * Manages a rolling list of high-precision performance log entries for debugging latency.
 */
export type PerfLogEntry = {
  timestamp: number; // For display (Date.now())
  perfTimestamp: number; // For calculation (performance.now())
  sessionId: string;
  turn: number;
  event: string;
  delta?: number; // Time in ms since the previous performance log entry
  details?: any;
};

const MAX_PERF_LOG_ENTRIES = 200;

export const usePerfLogStore = create<{
  logs: PerfLogEntry[];
  sessionId: string | null;
  startNewSession: () => void;
  addLog: (log: Omit<PerfLogEntry, 'timestamp' | 'perfTimestamp' | 'delta' | 'sessionId'>) => void;
  clearLogs: () => void;
}>(set => ({
  logs: [],
  sessionId: null,
  startNewSession: () => set({ sessionId: `session_${Date.now()}` }),
  addLog: log => {
    set(state => {
      const nowPerf = performance.now();
      const nowReal = Date.now();
      const lastLog = state.logs[0];
      // Find the last log with the same session ID to calculate delta correctly
      const lastLogThisSession = state.logs.find(l => l.sessionId === state.sessionId);
      const delta = lastLogThisSession ? nowPerf - lastLogThisSession.perfTimestamp : undefined;

      const newLog: PerfLogEntry = {
        ...log,
        timestamp: nowReal,
        perfTimestamp: nowPerf,
        delta,
        sessionId: state.sessionId || 'session_unknown',
      };
      const updatedLogs = [newLog, ...state.logs];
      if (updatedLogs.length > MAX_PERF_LOG_ENTRIES) {
        updatedLogs.pop();
      }
      return { logs: updatedLogs };
    });
  },
  clearLogs: () => set({ logs: [], sessionId: null }),
}));


/**
 * Represents the state of a dynamic insert (like an image) in the document.
 */
export interface Insert {
  id: string; // The unique ID matching the placeholder tag, e.g., "img_12345"
  type: 'image'; // The type of insert.
  prompt: string; // The initial request, e.g., "a cat in a hat"
  status: 'loading' | 'done' | 'error'; // The current state
  data?: string | null; // The final data for rendering (e.g., base64 string for images)
  error?: string; // An error message, if applicable
}


/**
 * `useInsertStore` Store
 * Manages the state of all dynamic inserts within the document.
 */
export const useInsertStore = create<{
  inserts: Insert[];
  addInsert: (insert: Insert) => void;
  updateInsert: (id: string, updates: Partial<Insert>) => void;
  clearInserts: () => void;
}>(set => ({
  inserts: [],
  addInsert: (insert: Insert) =>
    set(state => ({ inserts: [...state.inserts, insert] })),
  updateInsert: (id: string, updates: Partial<Insert>) =>
    set(state => ({
      inserts: state.inserts.map(insert =>
        insert.id === id ? { ...insert, ...updates } : insert
      ),
    })),
  clearInserts: () => set({ inserts: [] }),
}));