import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Sparkles, Brain, Mic, MessageSquare, Wand2, ArrowRight, BookOpen, Clock, AlertTriangle, Activity, CheckSquare, FileText } from 'lucide-react';
import Inklo from './Inklo';
import { useAppStore } from '../lib/state';
import { thinkDeeply } from '../lib/ai-tools';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';

const WelcomeScreen = () => {
  const { founderIdentity, founderMood, setInkloMode, isProcessing, setIsProcessing, setActiveTab, roadmapTasks } = useAppStore();
  const [brainDump, setBrainDump] = useState('');
  const [selectedFramework, setSelectedFramework] = useState<'SWOT' | 'MOSCOW' | 'LEAN_CANVAS' | 'GROWTH_LOOPS'>('SWOT');
  
  // Auto-Save Draft Recovery System
  const [cachedDraft, setCachedDraft] = useState('');
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'TYPING' | 'SAVED'>('IDLE');

  useEffect(() => {
    // Check for cached draft on mount
    const saved = localStorage.getItem('soloscribe_active_draft');
    if (saved && saved.trim()) {
      setCachedDraft(saved);
    }
  }, []);

  useEffect(() => {
    if (!brainDump.trim()) {
      setSaveStatus('IDLE');
      return;
    }

    setSaveStatus('TYPING');
    const delayDebounceFn = setTimeout(() => {
      localStorage.setItem('soloscribe_active_draft', brainDump);
      setSaveStatus('SAVED');
    }, 2500);

    return () => clearTimeout(delayDebounceFn);
  }, [brainDump]);

  const recoverDraft = () => {
    setBrainDump(cachedDraft);
    setCachedDraft('');
    toast.success('DRAFT_RECOVERED', { description: 'Loaded your last uncommitted strategic thoughts.' });
  };

  const discardDraft = () => {
    localStorage.removeItem('soloscribe_active_draft');
    setCachedDraft('');
    toast.info('DRAFT_PURGED_FROM_CACHE');
  };

  // Recent activity / snapshot states
  const [recentStrategies, setRecentStrategies] = useState<any[]>([]);
  const [strategiesLoading, setStrategiesLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setStrategiesLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'strategies'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentStrategies(data);
      setStrategiesLoading(false);
    }, (error) => {
      console.error("Error fetching recent strategies:", error);
      setStrategiesLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Pulse State
  const [focusLevel, setFocusLevel] = useState(5);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [isLoggingPulse, setIsLoggingPulse] = useState(false);

  const handleLogPulse = async () => {
    if (!auth.currentUser) {
      toast.error('AUTHENTICATION_REQUIRED', { description: 'Please authenticate to log your pulse.' });
      return;
    }

    setIsLoggingPulse(true);
    const toastId = toast.loading('LOGGING_FOUNDER_PULSE...');

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'pulses'), {
        userId: auth.currentUser.uid,
        focus: focusLevel,
        energy: energyLevel,
        createdAt: serverTimestamp()
      });

      toast.success('PULSE_LOGGED_SUCCESSFULLY', {
        id: toastId,
        description: `Focus: ${focusLevel}/10 | Energy: ${energyLevel}/10 logged securely.`,
      });
    } catch (error: any) {
      console.error(error);
      toast.error('PULSE_LOG_FAILED', {
        id: toastId,
        description: error.message || 'Failed to sync pulse to the vault.'
      });
    } finally {
      setIsLoggingPulse(false);
    }
  };
  
  const frameworks = [
    {
      id: 'SWOT',
      name: 'SWOT Matrix',
      description: 'Strengths, Weaknesses, Opportunities, and Threats assessment grounded in your constraints.',
      accent: 'bg-neo-cyan'
    },
    {
      id: 'MOSCOW',
      name: 'MoSCoW Prioritization',
      description: 'Must-have, Should-have, Could-have, and Won\'t-have boundaries for MVP scoping.',
      accent: 'bg-neo-yellow'
    },
    {
      id: 'LEAN_CANVAS',
      name: 'Lean Canvas Matrix',
      description: 'Speed-run of Problem, Solution, Key Metrics, Channels, and Unfair Advantages.',
      accent: 'bg-neo-pink'
    },
    {
      id: 'GROWTH_LOOPS',
      name: 'Viral Growth Loops',
      description: 'Inbound acquisition, retention triggers, and organic amplification loops.',
      accent: 'bg-neo-lime'
    }
  ];

  const handleCompileStrategy = async () => {
    if (!brainDump.trim()) {
      toast.error('INPUT_REQUIRED', { description: 'Please enter your thoughts first to allow parsing.' });
      return;
    }
    
    if (!auth.currentUser) {
      toast.error('AUTHENTICATION_REQUIRED', { description: 'Please authenticate with your founder credentials.' });
      return;
    }

    setIsProcessing(true);
    setInkloMode('STRATEGIZING');
    const toastId = toast.loading('INKLO_REASONING_CORE_INITIALIZED...');

    try {
      const frameworkInfo = frameworks.find(f => f.id === selectedFramework);
      const query = `
Please analyze the following raw brain dump from a founder and format it into a comprehensive business strategic output under the "${frameworkInfo?.name}" model.
${frameworkInfo?.description}

FOUNDER RAW BRAIN DUMP:
"${brainDump}"

FORMAT: Please use clear markdown presentation format with elegant headers, bullets, and strong neo-brutalist high-leverage copywriting. Avoid corporate buzzword cliche's. Output markdown only.
      `;

      const parsedOutput = await thinkDeeply(query, founderIdentity);
      
      // Save strategy directly to Firestore user collection
      const docTitle = `${selectedFramework}_MATRIX_${new Date().toLocaleDateString().replace(/\//g, '-')}`;
      
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'strategies'), {
        title: docTitle,
        content: parsedOutput,
        founderMood: founderMood || 'HYPER-FOCUSED',
        createdAt: serverTimestamp()
      });

      toast.success('STRATEGY_COMPILED_AND_VAULTED', {
        id: toastId,
        description: `Successfully stored "${docTitle}" under your Strategy Vault.`,
      });

      // Clear dump index
      setBrainDump('');
      localStorage.removeItem('soloscribe_active_draft');
    } catch (error: any) {
      console.error(error);
      toast.error('STRATEGY_COMPILATION_FAIL', {
        id: toastId,
        description: error.message || 'Verification of Gemini parameters failed.'
      });
    } finally {
      setIsProcessing(false);
      setInkloMode('DEFAULT');
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      {/* LANDING GREETER */}
      <div className="flex flex-col items-center py-4">
        <motion.div 
          initial={{ rotate: -2, scale: 0.95, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          className="bg-neo-yellow border-4 border-neo-black p-8 neo-shadow-lg text-center max-w-2xl transform relative w-full"
        >
          <div className="absolute -top-12 -right-8">
             <Inklo />
          </div>
          <Rocket className="w-12 h-12 mx-auto mb-4 text-neo-black animate-bounce" />
          <h1 className="text-5xl font-black tracking-tighter mb-4 uppercase">SOLOSCRIBE CORE</h1>
          <p className="text-sm font-black uppercase tracking-widest text-neo-black leading-none">
            SYSTEM_ACCESS: ACTIVE // STRATEGY EXECUTIVE ENGINE <br />
            MOOD STATE: {founderMood} // GROUNDING PROFILE: v5
          </p>
        </motion.div>
      </div>

      {/* CORE WORKSPACE INPUT FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* INPUT AND FRAMEWORK FORM BLOCK */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border-4 border-neo-black p-6 neo-shadow">
            <h3 className="text-xl font-black mb-4 flex items-center gap-2 border-b-2 border-neo-black pb-2 text-neo-pink">
              <Brain className="text-neo-pink" size={24} />
              CHAOTIC_THOUGHTS_STREAM
            </h3>
            
            <p className="font-mono text-[10px] text-zinc-500 uppercase font-bold mb-4 leading-tight">
              Paste your raw thoughts, midnight ideas, or coffee-induced epiphanies below. Inklo will compile it into high-fidelity tactical strategy.
            </p>

            {cachedDraft && (
              <div className="bg-neo-pink border-4 border-neo-black p-4 mb-4 neo-shadow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300 text-neo-black">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[8px] font-black animate-pulse bg-neo-black text-neo-lime px-2 py-0.5 rounded-sm">🔌 RESILIENCE_SAFE_MODE</span>
                    <span className="font-black text-xs uppercase text-neo-black leading-none">UNCOMMITTED STRATEGY RECOVERED //</span>
                  </div>
                  <span className="font-mono text-[9px] font-bold text-neo-black/60 uppercase">An unsaved strategic brainstorm session was recovered from local memory cache.</span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={recoverDraft} 
                    className="bg-white hover:bg-neo-lime text-neo-black border-2 border-neo-black px-3 py-1 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all cursor-pointer"
                  >
                    RECOVER_DRAFT
                  </button>
                  <button 
                    onClick={discardDraft} 
                    className="bg-white hover:bg-neo-yellow text-neo-black border-2 border-neo-black px-3 py-1 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all cursor-pointer"
                  >
                    DISCARD
                  </button>
                </div>
              </div>
            )}

            <textarea
              value={brainDump}
              onChange={(e) => setBrainDump(e.target.value)}
              disabled={isProcessing}
              placeholder="Dump your strategic thoughts here (e.g., 'I want to build a newsletter for solo developers selling SaaS ideas, charging $10/mo but offering premium micro-credits. I'm afraid competitors like IndyHackers have too much content, so I want to focus strictly on real-time feedback widgets...')"
              className="w-full bg-zinc-50 border-2 border-neo-black p-4 font-bold text-sm focus:bg-white outline-none min-h-[180px] font-sans"
            />

            <div className="flex justify-between items-center mt-3 font-mono text-[9px] font-black uppercase text-zinc-500">
              <span className="flex items-center gap-1.5">
                {saveStatus === 'SAVED' && (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-neo-lime animate-pulse inline-block" />
                    <span className="text-neo-lime font-black">● OFFLINE_HANDSHAKE_READY: SAVED_DRAFT_TO_DISK_CACHE</span>
                  </>
                )}
                {saveStatus === 'TYPING' && (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-neo-yellow animate-ping inline-block" />
                    <span className="text-neo-yellow font-black animate-pulse">● WRITING: STABILIZING_PENDING_2.5s_AUTO_SAVE...</span>
                  </>
                )}
                {saveStatus === 'IDLE' && (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 inline-block" />
                    <span>● READY: AWAITING_COFFEE_INDUCED_EPIPHANIES...</span>
                  </>
                )}
              </span>
              <span>BUFFER_STATUS: 100% HEALTHY //</span>
            </div>
          </section>

          {/* FRAMEWORK EXPANSIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {frameworks.map((f) => (
              <div 
                key={f.id}
                onClick={() => setSelectedFramework(f.id as any)}
                className={`border-4 border-neo-black p-4 transition-all cursor-pointer select-none flex flex-col justify-between hover:scale-[1.02]
                  ${selectedFramework === f.id 
                    ? `${f.accent} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]` 
                    : 'bg-white hover:bg-zinc-50 shadow-none'
                  }
                `}
              >
                <div>
                  <h4 className="font-black text-sm uppercase tracking-wider">{f.name}</h4>
                  <p className="text-[10px] uppercase font-bold text-zinc-600 mt-2 leading-snug">{f.description}</p>
                </div>
                <div className="flex justify-end mt-4">
                  <div className={`w-4 h-4 rounded-full border-2 border-neo-black ${selectedFramework === f.id ? 'bg-neo-black' : 'bg-white'}`} />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleCompileStrategy}
            disabled={isProcessing}
            className="w-full bg-neo-black text-neo-white border-4 border-neo-black py-4 font-black uppercase text-md tracking-wider hover:bg-zinc-850 transform active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-3 transition-all cursor-pointer neo-shadow-hover"
          >
            {isProcessing ? (
              <>
                <Sparkles className="animate-spin text-neo-yellow" />
                <span>PROCESSING_STRATEGIC_INCUBATION...</span>
              </>
            ) : (
              <>
                <Wand2 className="text-neo-cyan" />
                <span>COMPILE_STRATEGIC_PLAN</span>
              </>
            )}
          </button>
        </div>

        {/* CURRENT SYSTEM STATS / QUICK ACTIONS */}
        <div className="space-y-6">
          {/* QUICK SNAPSHOT WIDGET */}
          <section className="bg-white border-4 border-neo-black p-6 neo-shadow">
            <div className="flex items-center justify-between border-b-2 border-neo-black pb-3 mb-4">
              <h3 className="font-black text-xl uppercase tracking-tighter flex items-center gap-2">
                <Activity className="text-neo-pink" size={22} />
                QUICK_SNAPSHOT
              </h3>
              <span className="font-mono text-[9px] font-black bg-neo-black text-white px-2 py-0.5 rounded-sm">
                LIVE_FEED
              </span>
            </div>

            <div className="space-y-4">
              {/* ROADMAP SNAPSHOT */}
              <div 
                onClick={() => setActiveTab('roadmap')}
                className="border-2 border-neo-black p-3 hover:bg-neo-cyan/10 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckSquare className="text-neo-lime" size={16} />
                  <span className="font-mono text-[10px] font-black uppercase text-zinc-500">ROADMAP_STATUS</span>
                </div>
                <div className="flex justify-between items-end mb-1">
                  <span className="font-black uppercase text-xs">
                    {roadmapTasks.filter(t => !t.done).length} Active Tasks
                  </span>
                  <span className="font-mono text-[10px] font-black text-zinc-600">
                    {roadmapTasks.filter(t => t.done).length}/{roadmapTasks.length} Done
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-zinc-150 border-2 border-neo-black h-4 overflow-hidden flex">
                  <div 
                    className="bg-neo-lime h-full border-r-2 border-neo-black transition-all duration-500"
                    style={{ width: `${roadmapTasks.length > 0 ? (roadmapTasks.filter(t => t.done).length / roadmapTasks.length) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-end mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="font-mono text-[9px] font-black uppercase text-neo-pink flex items-center gap-1">
                    Manage Tasks <ArrowRight size={10} />
                  </span>
                </div>
              </div>

              {/* RECENT DOCUMENT SNAPSHOT */}
              <div 
                onClick={() => setActiveTab('vault')}
                className="border-2 border-neo-black p-3 hover:bg-neo-pink/10 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="text-neo-cyan" size={16} />
                  <span className="font-mono text-[10px] font-black uppercase text-zinc-500">LAST_COMPILED_STRATEGY</span>
                </div>
                {strategiesLoading ? (
                  <div className="h-10 flex items-center justify-center">
                    <span className="font-mono text-[10px] animate-pulse">QUERYING_VAULT...</span>
                  </div>
                ) : recentStrategies.length > 0 ? (
                  <div>
                    <h4 className="font-black text-sm uppercase truncate text-neo-black mb-1">
                      {recentStrategies[0].title}
                    </h4>
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span>Mood: {recentStrategies[0].founderMood || 'N/A'}</span>
                      <span>
                        {recentStrategies[0].createdAt?.toDate 
                          ? new Date(recentStrategies[0].createdAt.toDate()).toLocaleDateString() 
                          : 'Recent'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold uppercase text-zinc-400 italic">No strategies compiled yet.</p>
                  </div>
                )}
                <div className="flex justify-end mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="font-mono text-[9px] font-black uppercase text-neo-cyan flex items-center gap-1">
                    Open Vault <ArrowRight size={10} />
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-neo-lime border-4 border-neo-black p-6 neo-shadow flex flex-col justify-between">
            <div>
              <h3 className="font-black text-2xl uppercase tracking-tighter flex items-center gap-2 mb-3">
                 <Sparkles size={20} />
                 FOUNDER_PULSE
              </h3>
              <p className="text-[11px] font-bold uppercase leading-tight mb-4">
                Log your real-time focus and energy levels to track your daily execution limits.
              </p>
              
              <div className="space-y-4 mb-4">
                <div>
                  <label className="font-mono text-[10px] font-black uppercase text-neo-black flex justify-between">
                    <span>FOCUS_LEVEL</span>
                    <span>{focusLevel}/10</span>
                  </label>
                  <input 
                    type="range" min="1" max="10" 
                    value={focusLevel} 
                    onChange={(e) => setFocusLevel(parseInt(e.target.value))}
                    className="w-full accent-neo-black h-2 bg-white border border-neo-black appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] font-black uppercase text-neo-black flex justify-between">
                    <span>ENERGY_RESERVES</span>
                    <span>{energyLevel}/10</span>
                  </label>
                  <input 
                    type="range" min="1" max="10" 
                    value={energyLevel} 
                    onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                    className="w-full accent-neo-black h-2 bg-white border border-neo-black appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
            
            <button
               onClick={handleLogPulse}
               disabled={isLoggingPulse}
               className="w-full bg-neo-black text-white border-2 border-neo-black p-3 font-black text-xs uppercase hover:bg-zinc-800 transition-all text-center flex items-center justify-center gap-2 cursor-pointer neo-shadow-sm disabled:opacity-50"
             >
                {isLoggingPulse ? 'LOGGING_PULSE...' : 'LOG_CURRENT_STATE'}
                {!isLoggingPulse && <ArrowRight size={14} />}
             </button>
          </section>

          <section className="bg-neo-cyan border-4 border-neo-black p-6 neo-shadow flex flex-col justify-between min-h-[220px]">
             <div>
                <h3 className="font-black text-2xl uppercase tracking-tighter flex items-center gap-2 mb-3">
                   <BookOpen size={20} />
                   VAULT_STATUS
                </h3>
                <p className="text-[11px] font-bold uppercase leading-tight mb-4">
                  All successfully processed thought streams are written into your personal, secure Strategy Vault to support keynote synthesis and audits.
                </p>
             </div>
             
             <button
               onClick={() => setActiveTab('vault')}
               className="w-full bg-white border-2 border-neo-black p-3 font-black text-xs uppercase hover:bg-zinc-105 transition-all text-center flex items-center justify-center gap-2 cursor-pointer neo-shadow-sm"
             >
                <span>OPEN_STRATEGY_VAULT</span>
                <ArrowRight size={14} />
             </button>
          </section>

          <section className="bg-neo-pink text-white border-4 border-neo-black p-6 neo-shadow relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-10">
                <AlertTriangle size={80} />
             </div>
             <h4 className="font-mono text-[10px] font-black uppercase tracking-widest text-[#ffe4e6] mb-2">[SECURE_INKLO_NET]</h4>
             <p className="font-sans font-black text-sm leading-snug uppercase mb-4">
               "Strategic inputs are processed strictly on model: Gemini 2.0 Thinking EXP. This provides advanced latent reasoning to map competitor gaps and revenue parameters."
             </p>
             <div className="flex gap-2 items-center text-[10px] font-mono uppercase bg-zinc-900 text-neo-lime py-1.5 px-3 border border-zinc-700">
                <Clock size={12} />
                <span>SYNC: OK 100% SOVEREIGN</span>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
