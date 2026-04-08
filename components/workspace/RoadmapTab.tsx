import React, { useState, useMemo } from 'react';
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
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { thinkDeeply } from '../../lib/ai-tools';
import { toast } from 'sonner';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  stage: 'Idea' | 'Planning' | 'Launch' | 'Growth' | 'Anniversary';
  icon: React.ReactNode;
}

const ROADMAP_ITEMS: RoadmapItem[] = [
  {
    id: 'problem-solution',
    title: 'Problem/Solution Fit',
    description: 'Define the core problem you are solving and your unique solution.',
    stage: 'Idea',
    icon: <Target size={20} />
  },
  {
    id: 'lean-canvas',
    title: 'Lean Canvas',
    description: 'A 1-page business model that focuses on problems, solutions, key metrics, and competitive advantage.',
    stage: 'Idea',
    icon: <Target size={20} />
  },
  {
    id: 'pitch-deck',
    title: 'Pitch Deck',
    description: 'A visual presentation to tell your startup story and attract investors.',
    stage: 'Planning',
    icon: <Award size={20} />
  },
  {
    id: 'business-plan',
    title: 'Business Plan',
    description: 'A comprehensive document outlining your business goals and how you will achieve them.',
    stage: 'Planning',
    icon: <Award size={20} />
  },
  {
    id: 'gtm-strategy',
    title: 'Go-To-Market Strategy',
    description: 'How you will reach your target customers and achieve competitive advantage.',
    stage: 'Planning',
    icon: <Award size={20} />
  },
  {
    id: 'launch-checklist',
    title: 'Launch Checklist',
    description: 'The critical steps to take before your first launch day.',
    stage: 'Launch',
    icon: <Rocket size={20} />
  },
  {
    id: 'press-release',
    title: 'Press Release',
    description: 'Announce your launch to the world and get media attention.',
    stage: 'Launch',
    icon: <Rocket size={20} />
  },
  {
    id: 'okrs',
    title: 'OKRs (Objectives & Key Results)',
    description: 'Set ambitious goals and track your progress during the growth phase.',
    stage: 'Growth',
    icon: <TrendingUp size={20} />
  },
  {
    id: 'financial-projections',
    title: 'Financial Projections',
    description: 'Forecast your revenue, expenses, and cash flow for the next 3-5 years.',
    stage: 'Growth',
    icon: <TrendingUp size={20} />
  },
  {
    id: 'anniversary-1',
    title: '1-Year Retrospective',
    description: 'Review your first year, celebrate wins, and learn from failures.',
    stage: 'Anniversary',
    icon: <Calendar size={20} />
  },
  {
    id: 'anniversary-10',
    title: '10-Year Vision',
    description: 'Where do you want your business to be in a decade? Define your long-term legacy.',
    stage: 'Anniversary',
    icon: <Award size={20} />
  }
];

export const RoadmapTab: React.FC = () => {
  const { setDocumentContent, setMainTab, setTranscript, documentContent, currentProjectId } = useUI();
  const { name, info, topic } = useUser();
  const { tasks } = useTaskStore();
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [customItems, setCustomItems] = useState<RoadmapItem[]>([]);

  const projectTasks = useMemo(() => 
    tasks.filter(t => t.projectId === currentProjectId),
    [tasks, currentProjectId]
  );

  const completedTasksCount = projectTasks.filter(t => t.completed).length;
  const totalTasksCount = projectTasks.length;
  const progressPercentage = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const handleStartDocument = (item: RoadmapItem) => {
    const initialContent = `# ${item.title}\n\n## Overview\n${item.description}\n\n## Let's get started...\n`;
    setDocumentContent(initialContent);
    setTranscript([]);
    setMainTab('document');
    toast.success(`Started drafting: ${item.title}`);
  };

  const handleAIDraft = async (item: RoadmapItem) => {
    setIsGenerating(item.id);
    try {
      const context = `User Name: ${name || 'User'}
User Background: ${info || 'None'}
Current Topic: ${topic || 'Not specified'}
Current Document State:
---
${documentContent}
---`;

      const prompt = `${context}\n\nAct as a strategic AI co-founder. Generate a comprehensive and professional draft for the document: "${item.title}". 
The goal of this document is: ${item.description}.
Use the current project context provided above to make it highly relevant and actionable. 
Format the response in Markdown. Include sections like Executive Summary, Key Objectives, and Next Steps where appropriate.`;

      const draft = await thinkDeeply(prompt);
      setDocumentContent(draft);
      setTranscript([]);
      setMainTab('document');
      toast.success(`AI generated a draft for: ${item.title}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate AI draft.');
    } finally {
      setIsGenerating(null);
    }
  };

  const handleSuggestCustomItem = async () => {
    if (!documentContent.trim()) {
      toast.error('Add some content to your document first so I can suggest something relevant.');
      return;
    }

    setIsSuggesting(true);
    try {
      const prompt = `Based on this project document, suggest ONE unique, highly strategic roadmap item that is missing but crucial for this specific venture.
      
      Document:
      ${documentContent}
      
      Return ONLY a JSON object with:
      {
        "title": "Short Title",
        "description": "One sentence description",
        "stage": "Idea" | "Planning" | "Launch" | "Growth"
      }`;

      const result = await thinkDeeply(prompt);
      const suggestion = JSON.parse(result.replace(/```json|```/g, ''));
      
      const newItem: RoadmapItem = {
        id: `custom-${Date.now()}`,
        title: suggestion.title,
        description: suggestion.description,
        stage: suggestion.stage,
        icon: <Lightbulb size={20} />
      };

      setCustomItems(prev => [...prev, newItem]);
      toast.success('AI suggested a new roadmap milestone!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate suggestion.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const stages = ['Idea', 'Planning', 'Launch', 'Growth', 'Anniversary'] as const;

  const allItems = [...ROADMAP_ITEMS, ...customItems];

  return (
    <div className="roadmap-tab" style={{ padding: '30px', height: '100%', overflowY: 'auto' }}>
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontFamily: 'var(--font-display)', color: 'var(--theme-accent)', marginBottom: '10px' }}>Startup Roadmap</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Orchestrate your startup documentation from idea to legacy.</p>
        </div>
        
        <div style={{ textAlign: 'right', minWidth: '200px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>OVERALL PROGRESS</div>
          <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              style={{ height: '100%', backgroundColor: 'var(--theme-accent)', boxShadow: '0 0 10px var(--theme-accent)' }}
            />
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--theme-accent)', marginTop: '8px' }}>
            {completedTasksCount} / {totalTasksCount} Tasks Completed ({progressPercentage}%)
          </div>
        </div>
      </header>

      <div style={{ marginBottom: '40px' }}>
        <button
          onClick={handleSuggestCustomItem}
          disabled={isSuggesting}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 20px',
            borderRadius: '12px',
            backgroundColor: 'rgba(0, 243, 255, 0.1)',
            border: '1px solid var(--theme-accent)',
            color: 'var(--theme-accent)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {isSuggesting ? <Loader2 size={18} className="animate-spin" /> : <Lightbulb size={18} />}
          {isSuggesting ? 'Analyzing Project...' : 'Suggest Custom Milestone'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {stages.map((stage) => (
          <section key={stage}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(0, 243, 255, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '1px solid rgba(0, 243, 255, 0.3)'
              }}>
                {stage === 'Idea' && <Target size={20} color="var(--theme-accent)" />}
                {stage === 'Planning' && <Award size={20} color="var(--theme-accent)" />}
                {stage === 'Launch' && <Rocket size={20} color="var(--theme-accent)" />}
                {stage === 'Growth' && <TrendingUp size={20} color="var(--theme-accent)" />}
                {stage === 'Anniversary' && <Calendar size={20} color="var(--theme-accent)" />}
              </div>
              <h3 style={{ fontSize: '18px', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>{stage} Stage</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {allItems.filter(item => item.stage === stage).map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(0, 243, 255, 0.05)' }}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    backgroundColor: item.id.startsWith('custom-') ? 'rgba(0,243,255,0.05)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${item.id.startsWith('custom-') ? 'var(--theme-accent)' : 'rgba(255,255,255,0.1)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => handleStartDocument(item)}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', color: 'white' }}>{item.title}</h4>
                      {item.id.startsWith('custom-') ? <Lightbulb size={16} color="var(--theme-accent)" /> : <Circle size={16} color="rgba(255,255,255,0.2)" />}
                    </div>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5', marginBottom: '20px' }}>
                      {item.description}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div 
                      onClick={(e) => { e.stopPropagation(); handleStartDocument(item); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      TEMPLATE <ArrowRight size={14} />
                    </div>
                    <div 
                      onClick={(e) => { e.stopPropagation(); handleAIDraft(item); }}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '5px', 
                        color: 'var(--theme-accent)', 
                        fontSize: '11px', 
                        fontWeight: 'bold', 
                        cursor: isGenerating ? 'not-allowed' : 'pointer',
                        opacity: isGenerating ? 0.5 : 1
                      }}
                    >
                      {isGenerating === item.id ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      AI DRAFT <ArrowRight size={14} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
