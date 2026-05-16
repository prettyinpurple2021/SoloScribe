import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, CheckSquare, Clock, Flag, Layout, Download, Zap } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { useAppStore } from '../../lib/state';

const RoadmapTab = () => {
  const { setIsProcessing, setInkloMode } = useAppStore();
  const [tasks, setTasks] = useState([
    { id: 1, task: 'Refine GPT-4o context window for strategy generation', done: true },
    { id: 2, task: 'Implement high-fidelity revenue simulation models', done: false },
    { id: 3, task: 'Audit V5 logic for GDPR/CCPA data sovereignty', done: true },
    { id: 4, task: 'Optimize Inklo mascot 3D rendering path', done: false }
  ]);

  const milestones = [
    { phase: 'PHASE_01', title: 'CORE_ATTRIBUTES', status: 'COMPLETED', date: 'MAY 2026' },
    { phase: 'PHASE_02', title: 'INKLO_NET_EXPANSION', status: 'ACTIVE', date: 'JUNE 2026' },
    { phase: 'PHASE_03', title: 'SOVEREIGN_REVENUE', status: 'PLANNED', date: 'JULY 2026' },
    { phase: 'PHASE_04', title: 'MARKET_DOMINATION', status: 'LOCKED', date: 'AUG 2026' },
  ];

  const toggleTask = (id: number) => {
    setIsProcessing(true);
    setInkloMode('BUILDING');
    
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    
    setTimeout(() => {
      setIsProcessing(false);
      setInkloMode('DEFAULT');
      toast.success('CORE_ROADMAP_SYNCHRONIZED', { icon: '⚡' });
    }, 800);
  };

  const completedCount = tasks.filter(t => t.done).length;

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.text('STRATEGIC_ROADMAP_V5.0', 10, 25);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`SOLOSCRIBE INTERNAL_DOCUMENT - GENERATED: ${new Date().toLocaleString()}`, 10, 50);
      
      doc.line(10, 55, 200, 55);
      
      // Milestones
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('MILESTONES:', 10, 70);
      
      let yPos = 85;
      doc.setFontSize(12);
      milestones.forEach((m) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${m.phase}: ${m.title}`, 15, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`STATUS: ${m.status} | DATE: ${m.date}`, 15, yPos + 7);
        yPos += 20;
      });
      
      // Tasks
      yPos += 10;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('CURRENT_TASKS:', 10, yPos);
      yPos += 15;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      tasks.forEach((t, i) => {
        doc.text(`${t.done ? '[X]' : '[ ]'} ${t.task}`, 15, yPos);
        yPos += 10;
      });
      
      doc.save('SoloScribe_Roadmap.pdf');
      toast.success('ROADMAP_EXPORT_SUCCESS');
    } catch (error) {
      console.error('Roadmap PDF Error:', error);
      toast.error('EXPORT_FAILURE');
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8">
      <div className="bg-neo-black text-neo-white p-8 border-4 border-neo-black neo-shadow-lg flex items-center justify-between overflow-hidden relative">
        <div className="relative z-10">
          <h2 className="text-5xl font-black tracking-tighter uppercase">STRATEGIC_ROADMAP</h2>
          <p className="font-mono text-xs text-neo-lime uppercase tracking-widest">Growth_Trajectory_v5.0</p>
        </div>
        <div className="flex items-center gap-4 relative z-10">
           <button 
              onClick={handleExportPDF}
              className="p-3 bg-white text-neo-black border-4 border-neo-black neo-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2 font-black text-xs uppercase"
           >
              <Download size={16} />
              Export_PDF
           </button>
           <Flag className="text-neo-pink w-16 h-16 opacity-40 -rotate-12 hidden md:block" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {milestones.map((m, i) => (
          <div key={m.phase} className="bg-white border-4 border-neo-black p-6 neo-shadow flex flex-col justify-between hover:rotate-1 transition-transform cursor-pointer">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="font-mono text-[10px] font-black bg-neo-black text-white px-2 py-1">{m.phase}</span>
                {m.status === 'COMPLETED' ? <CheckSquare className="text-neo-lime" size={16} /> : <Clock className="text-neo-yellow" size={16} />}
              </div>
              <h3 className="font-black text-lg uppercase leading-tight mb-2">{m.title}</h3>
              <p className="font-bold text-[10px] text-zinc-400 uppercase">{m.date}</p>
            </div>
            <div className="mt-6 pt-4 border-t-2 border-neo-black/10">
               <div className={`h-2 w-full border-2 border-neo-black ${m.status === 'COMPLETED' ? 'bg-neo-lime' : m.status === 'ACTIVE' ? 'bg-neo-cyan anim-pulse' : 'bg-neo-black/10'}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 notebook-bg border-4 border-neo-black p-10 neo-shadow relative">
          <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-around py-4">
            {[...Array(10)].map((_, i) => <div key={i} className="w-3 h-3 rounded-full bg-white border-2 border-neo-black mx-auto" />)}
          </div>
          <div className="ml-8">
            <div className="flex justify-between items-center mb-6 border-b-4 border-neo-black pb-4">
               <h3 className="font-black text-2xl uppercase flex items-center gap-3">
                 <Layout className="text-neo-pink" /> CURRENT_TASKS
               </h3>
               <div className="font-mono text-xs font-black">
                 {completedCount}/{tasks.length} COMPLETED
               </div>
            </div>
            <div className="space-y-4">
                {tasks.map((t) => (
                  <div 
                    key={t.id} 
                    onClick={() => toggleTask(t.id)}
                    className={`flex items-center gap-4 p-4 border-2 border-neo-black cursor-pointer group transition-all ${t.done ? 'bg-neo-lime/10' : 'bg-white hover:bg-neo-cyan/10'}`}
                  >
                    <div className={`w-8 h-8 border-4 border-neo-black flex items-center justify-center transition-colors ${t.done ? 'bg-neo-lime' : 'bg-white'}`}>
                        {t.done && <CheckSquare size={20} />}
                    </div>
                    <span className={`font-black uppercase text-sm flex-1 ${t.done ? 'line-through opacity-50' : ''}`}>{t.task}</span>
                    <Zap className={`text-neo-black opacity-0 group-hover:opacity-100 transition-opacity ${t.done ? 'text-neo-lime opacity-40' : ''}`} size={16} />
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="bg-neo-black text-neo-white p-8 border-4 border-neo-black neo-shadow-lg flex flex-col justify-between">
           <div>
              <h4 className="text-neo-cyan font-black text-xl mb-4 uppercase tracking-widest">Inklo_Review</h4>
              <p className="font-mono text-xs opacity-80 leading-relaxed italic border-l-4 border-neo-pink pl-4">
                "VELOCITY IS GOOD, FOUNDER. BUT YOUR 'PHASE_02' RELIES HEAVILY ON THE MONETIZATION MODEL REFINEMENT. KEEP THE HYPER-LOCAL TARGETING AS A FAILSAFE."
              </p>
           </div>
           
           <div className="mt-8">
              <div className="h-40 w-full border-2 border-neo-white/30 flex items-center justify-center relative overflow-hidden group">
                 <div className="absolute inset-0 bg-neo-pink/10 group-hover:bg-neo-pink/20 transition-colors" />
                 <div className="text-[60px] font-black opacity-10 animate-pulse pointer-events-none">INKLO</div>
                 <div className="relative z-10 text-center">
                    <div className="text-4xl font-black">{Math.round((completedCount/tasks.length)*100)}%</div>
                    <div className="text-[10px] font-mono font-black uppercase">Core_Integrity</div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapTab;
