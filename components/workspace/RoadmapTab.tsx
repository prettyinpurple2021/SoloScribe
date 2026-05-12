import React, { useState, useMemo, useEffect } from 'react';
import { useUI, useUser, useTaskStore } from '../../lib/state';
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Rocket, 
  Target, 
  TrendingUp, 
  Calendar, 
  Award, 
  Loader2, 
  Sparkles,
  Lightbulb,
  Plus,
  Shield,
  Zap,
  Flag,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { thinkDeeply } from '../../lib/ai-tools';
import { toast } from 'sonner';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  stage: 'Idea' | 'Planning' | 'Launch' | 'Growth' | 'Legacy';
  complexity: 'Low' | 'Medium' | 'High';
}

const ROADMAP_ITEMS: RoadmapItem[] = [
  { id: 'problem-solution', title: 'Problem/Solution Fit', description: 'Validate the core problem & solution hypothesis.', stage: 'Idea', complexity: 'Medium' },
  { id: 'lean-canvas', title: 'Lean Canvas', description: '1-page business model for rapid iteration.', stage: 'Idea', complexity: 'Medium' },
  { id: 'pitch-deck', title: 'Pitch Deck', description: 'Narrative-driven deck for stakeholders.', stage: 'Planning', complexity: 'High' },
  { id: 'gtm-strategy', title: 'Go-To-Market', description: 'Acquisition channels and launch plan.', stage: 'Planning', complexity: 'High' },
  { id: 'launch-checklist', title: 'Launch Protocol', description: 'Critical operations for Day 0.', stage: 'Launch', complexity: 'Medium' },
  { id: 'okrs', title: 'Strategic OKRs', description: 'Objectives & Key Results for scale.', stage: 'Growth', complexity: 'Medium' },
  { id: 'long-vision', title: '10-Year Legacy', description: 'Long-term impact and exit vision.', stage: 'Legacy', complexity: 'High' }
];

export const RoadmapTab: React.FC = () => {
  const { setDocumentContent, setMainTab, setTranscript, documentContent, currentProjectId } = useUI();
  const { name, info, topic } = useUser();
  const { tasks, toggleTask } = useTaskStore();
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [customItems, setCustomItems] = useState<RoadmapItem[]>([]);

  const projectTasks = useMemo(() => 
    tasks.filter(t => t.projectId === currentProjectId),
    [tasks, currentProjectId]
  );

  const completedCount = projectTasks.filter(t => t.completed).length;
  const progress = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;

  const handleAIDraft = async (item: RoadmapItem) => {
    setIsGenerating(item.id);
    const toastId = toast.loading(`InkLo is drafting ${item.title}...`);
    try {
      const prompt = `Act as a world-class strategic consultant. Generate a first draft for: ${item.title}. 
      Context: ${topic}. User Info: ${info}.
      Current Doc: ${documentContent.slice(0, 2000)}.
      Output high-density Markdown with actionable headers and placeholder variables like [INSERT_DATA].`;

      const draft = await thinkDeeply(prompt);
      setDocumentContent(draft);
      setMainTab('document');
      toast.success('Draft Generated', { id: toastId });
    } catch (error) {
      toast.error('Draft Failed', { id: toastId });
    } finally {
      setIsGenerating(null);
    }
  };

  const stages = ['Idea', 'Planning', 'Launch', 'Growth', 'Legacy'] as const;
  const allItems = [...ROADMAP_ITEMS, ...customItems];

  return (
    <div className="roadmap-tab p-6 pb-40 overflow-y-auto h-full bg-[#0a0a0a] text-white scrollbar-brutalist">
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} className="text-theme-accent" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-theme-accent">Mission_Protocol_v4</span>
          </div>
          <h2 className="text-4xl font-display uppercase tracking-tighter leading-none mb-4">Strategic_Roadmap</h2>
          <p className="font-mono text-xs opacity-50 uppercase leading-relaxed">
            Transition from loose ideas to a battle-hardened legacy. Orchestrate your milestones through AI-assisted documentation.
          </p>
        </div>

        <div className="w-full md:w-64 bg-white/5 border-2 border-white/10 p-4 shadow-[4px_4px_0px_rgba(255,255,255,0.05)]">
          <div className="flex justify-between items-center mb-2">
            <span className="font-mono text-[9px] uppercase font-bold opacity-40 italic">Global_Readiness</span>
            <span className="font-mono text-xs font-bold text-theme-accent">{progress}%</span>
          </div>
          <div className="h-2 bg-black border border-white/10 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-theme-accent shadow-[0_0_15px_rgba(0,243,255,0.5)]"
            />
          </div>
          <div className="mt-2 text-[10px] font-mono opacity-50 uppercase text-center tracking-widest">
            {completedCount} / {projectTasks.length} Milestones Sync'd
          </div>
        </div>
      </div>

      <div className="mb-12">
         <button
          onClick={async () => {
            setIsSuggesting(true);
            try {
              const res = await thinkDeeply(`Suggest 1 unique roadmap item for: ${topic}. Return JSON: {title, description, stage, complexity}`);
              const item = JSON.parse(res.replace(/```json|```/g, ''));
              setCustomItems(prev => [...prev, { ...item, id: Date.now().toString() }]);
              toast.success('Custom Milestone Added');
            } finally { setIsSuggesting(false); }
          }}
          disabled={isSuggesting}
          className="flex items-center gap-2 px-6 py-3 bg-theme-accent/10 border-2 border-theme-accent text-theme-accent font-display text-xs uppercase hover:bg-theme-accent hover:text-black transition-all"
        >
          {isSuggesting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Generate_Expansion_Pack
        </button>
      </div>

      <div className="space-y-16 relative">
        <div className="absolute left-[20px] top-4 bottom-4 w-1 bg-white/5" />
        
        {stages.map((stage) => {
          const stageItems = allItems.filter(item => item.stage === stage);
          if (stageItems.length === 0) return null;

          return (
            <section key={stage} className="relative pl-12">
              <div className="absolute left-0 top-0 w-10 h-10 bg-black border-2 border-white/20 flex items-center justify-center z-10">
                 {stage === 'Idea' && <Lightbulb size={20} className="text-theme-accent" />}
                 {stage === 'Planning' && <Zap size={20} className="text-yellow-400" />}
                 {stage === 'Launch' && <Rocket size={20} className="text-green-400" />}
                 {stage === 'Growth' && <TrendingUp size={20} className="text-purple-400" />}
                 {stage === 'Legacy' && <Award size={20} className="text-orange-400" />}
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-display uppercase tracking-widest italic flex items-center gap-3">
                  {stage}_Phase
                  <span className="h-px flex-1 bg-white/10" />
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {stageItems.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    className="group relative bg-white/5 border-2 border-white/10 p-6 transition-all hover:border-theme-accent/50 shadow-[4px_4px_0px_rgba(255,255,255,0.02)]"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`px-2 py-0.5 border text-[8px] font-mono uppercase font-black tracking-tighter
                        ${item.complexity === 'High' ? 'border-red-500/50 text-red-400' : 
                          item.complexity === 'Medium' ? 'border-yellow-500/50 text-yellow-400' : 'border-green-500/50 text-green-400'}
                      `}>
                        {item.complexity}_Load
                      </div>
                      <Flag size={14} className="opacity-20 group-hover:opacity-100 group-hover:text-theme-accent transition-all" />
                    </div>

                    <h4 className="text-lg font-display uppercase tracking-tight mb-2 group-hover:text-theme-accent transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[10px] font-mono opacity-50 uppercase leading-relaxed mb-8 h-8 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="mt-auto flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                      <button 
                        onClick={() => {
                          setDocumentContent(`# ${item.title}\n\n[START_TYPING_HERE]`);
                          setMainTab('document');
                        }}
                        className="font-mono text-[9px] uppercase font-bold text-white/40 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        Template <ChevronRight size={10} />
                      </button>
                      <button 
                        onClick={() => handleAIDraft(item)}
                        disabled={isGenerating === item.id}
                        className="flex items-center gap-1.5 bg-theme-accent text-black px-3 py-1.5 text-[9px] font-display uppercase font-bold hover:bg-white transition-colors"
                      >
                        {isGenerating === item.id ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                        AI_Draft
                      </button>
                    </div>

                    {item.id.startsWith('custom-') && (
                      <div className="absolute -top-2 -right-2 bg-theme-accent text-black p-1 text-[8px] font-black uppercase tracking-tighter">
                        Proprietary
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
