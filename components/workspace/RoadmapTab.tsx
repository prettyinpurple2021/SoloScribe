import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, CheckSquare, Clock, Flag, Layout, Download, Zap, TrendingUp, Activity } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { useAppStore } from '../../lib/state';

const RoadmapTab = () => {
  const { 
    setIsProcessing, 
    setInkloMode, 
    roadmapTasks: tasks, 
    toggleRoadmapTask,
    setRoadmapTasks
  } = useAppStore();

  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<'Planned' | 'In-Progress' | 'Done' | null>(null);
  const [draggedOverTaskId, setDraggedOverTaskId] = useState<number | null>(null);

  const normalizedTasks = tasks.map(t => ({
    id: t.id,
    task: t.task,
    done: t.done,
    status: (t.status || (t.done ? 'Done' : 'Planned')) as 'Planned' | 'In-Progress' | 'Done'
  }));

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: 'Planned' | 'In-Progress' | 'Done', targetTaskId?: number) => {
    e.preventDefault();
    setDraggedOverColumn(status);
    if (targetTaskId !== undefined) {
      setDraggedOverTaskId(targetTaskId);
    } else {
      setDraggedOverTaskId(null);
    }
  };

  const handleDragLeave = () => {
    setDraggedOverTaskId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDraggedOverColumn(null);
    setDraggedOverTaskId(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: 'Planned' | 'In-Progress' | 'Done', targetTaskId?: number) => {
    e.preventDefault();
    const idStr = e.dataTransfer.getData('text/plain');
    const id = parseInt(idStr, 10) || draggedId;
    if (!id) return;

    setIsProcessing(true);
    setInkloMode('BUILDING');

    const currentTasks = [...normalizedTasks];
    const draggedIndex = currentTasks.findIndex(t => t.id === id);
    if (draggedIndex === -1) {
      setIsProcessing(false);
      setInkloMode('DEFAULT');
      return;
    }

    const draggedTask = { ...currentTasks[draggedIndex] };
    draggedTask.status = targetStatus;
    draggedTask.done = targetStatus === 'Done';

    // Remove from old position
    currentTasks.splice(draggedIndex, 1);

    // Insert at new position
    if (targetTaskId !== undefined && targetTaskId !== id) {
      const targetIndex = currentTasks.findIndex(t => t.id === targetTaskId);
      if (targetIndex !== -1) {
        currentTasks.splice(targetIndex, 0, draggedTask);
      } else {
        currentTasks.push(draggedTask);
      }
    } else {
      // Find the last item of the same status and insert after it, or just push
      const statusTasks = currentTasks.filter(t => t.status === targetStatus);
      if (statusTasks.length > 0) {
        const lastStatusTask = statusTasks[statusTasks.length - 1];
        const lastIndex = currentTasks.findIndex(t => t.id === lastStatusTask.id);
        currentTasks.splice(lastIndex + 1, 0, draggedTask);
      } else {
        currentTasks.push(draggedTask);
      }
    }

    setRoadmapTasks(currentTasks);

    setTimeout(() => {
      setIsProcessing(false);
      setInkloMode('DEFAULT');
      toast.success('ROADMAP_UPDATED_SUCCESSFULLY', { icon: '⚡' });
    }, 400);

    handleDragEnd();
  };

  const milestones = [
    { phase: 'PHASE_01', title: 'CORE_ATTRIBUTES', status: 'COMPLETED', date: 'MAY 2026' },
    { phase: 'PHASE_02', title: 'INKLO_NET_EXPANSION', status: 'ACTIVE', date: 'JUNE 2026' },
    { phase: 'PHASE_03', title: 'SOVEREIGN_REVENUE', status: 'PLANNED', date: 'JULY 2026' },
    { phase: 'PHASE_04', title: 'MARKET_DOMINATION', status: 'LOCKED', date: 'AUG 2026' },
  ];

  const toggleTask = (id: number) => {
    setIsProcessing(true);
    setInkloMode('BUILDING');
    
    toggleRoadmapTask(id);
    
    setTimeout(() => {
      setIsProcessing(false);
      setInkloMode('DEFAULT');
      toast.success('CORE_ROADMAP_SYNCHRONIZED', { icon: '⚡' });
    }, 800);
  };

  const completedCount = tasks.filter(t => t.done).length;
  const totalCount = tasks.length || 1;
  const progressPercent = Math.min(100, Math.round((completedCount / totalCount) * 100));

  const prevTasksRef = useRef(tasks);
  
  useEffect(() => {
    const prevTasks = prevTasksRef.current;
    
    // Find tasks that just became 'Done'
    const newlyDoneTasks = tasks.filter(t => t.done && !prevTasks.find(pt => pt.id === t.id)?.done);
    
    if (newlyDoneTasks.length > 0) {
      newlyDoneTasks.forEach(t => {
        toast.success('TASK_SECURED', { description: `Completed: ${t.task}`, icon: '✅' });
      });
    }
  
    // Check milestones
    const prevCompleted = prevTasks.filter(t => t.done).length;
    const prevTotal = prevTasks.length || 1;
    const prevProgress = Math.min(100, Math.round((prevCompleted / prevTotal) * 100));
  
    if (progressPercent > prevProgress) {
      if (progressPercent === 100 && prevProgress < 100) {
        toast('MISSION_ACCOMPLISHED', { description: 'Launch Sequence Initiated. 100% Secured.', icon: '🏁' });
      } else if (progressPercent >= 75 && prevProgress < 75) {
        toast('HYPER_STREAK_UNLOCKED', { description: '75% completion reached. Incredible momentum.', icon: '🔥' });
      } else if (progressPercent >= 50 && prevProgress < 50) {
        toast('BETA_BUILD_SECURED', { description: 'Halfway there. Core momentum established.', icon: '⚡' });
      } else if (progressPercent >= 25 && prevProgress < 25) {
        toast('TRACTION_INITIATED', { description: 'First major milestone. 25% completed.', icon: '📈' });
      }
    }
  
    prevTasksRef.current = tasks;
  }, [tasks, progressPercent]);

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

      {/* FOUNDER PROJECT MOMENTUM SYSTEM */}
      <div className="bg-white border-4 border-neo-black p-6 neo-shadow relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-neo-black/5 opacity-10 pointer-events-none -skew-x-12" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-neo-black text-neo-cyan font-mono text-[9px] font-black px-2 py-0.5 uppercase tracking-wider">
                ⚡ PROJECT_MOMENTUM_INTEGRITY
              </span>
              <span className="font-mono text-[10px] font-bold text-zinc-400">TRACKER v5.0</span>
            </div>
            <h3 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2">
              <TrendingUp className="text-neo-pink shrink-0" size={28} />
              {progressPercent}% SECURED
            </h3>
            <p className="font-mono text-xs text-zinc-500 uppercase font-bold">
              {completedCount} OF {tasks.length} MISSION-CRITICAL ROADMAP MILESTONES COMPLETED
            </p>
          </div>

          <div className="flex-1 max-w-xl w-full space-y-3">
            <div className="flex justify-between items-end">
              <span className="font-mono text-[10px] font-black text-zinc-500 flex items-center gap-1">
                <Activity size={12} className="text-neo-pink" /> 
                VELOCITY_COEFFICIENT: {
                  progressPercent === 100 ? 'MAXIMUM_MOMENTUM_STABLE' :
                  progressPercent >= 75 ? '🔥 HYPER_STREAK' :
                  progressPercent >= 50 ? '⚡ OPTIMAL_ACCELERATION' :
                  progressPercent >= 25 ? '📈 INITIAL_TRACTION_SECURED' :
                  '💤 SYSTEM_WARMING_UP'
                }
              </span>
              <span className="font-mono text-xs font-black bg-neo-black text-neo-lime px-2 py-0.5 rounded-sm">
                STATUS: {
                  progressPercent === 100 ? 'LAUNCH_READY' :
                  progressPercent >= 75 ? 'ALPHA_STABLE' :
                  progressPercent >= 50 ? 'BETA_BUILD' :
                  progressPercent >= 25 ? 'INFRASTRUCTURE_BOOT' :
                  'CONCEPT_PROVING'
                }
              </span>
            </div>

            {/* Neo-brutalist custom textured progress bar */}
            <div className="w-full bg-zinc-100 border-4 border-neo-black h-10 relative neo-shadow-sm overflow-hidden flex items-center">
              <div 
                className="bg-neo-lime h-full border-r-4 border-neo-black transition-all duration-500 ease-out flex items-center pl-4 relative"
                style={{ width: `${progressPercent}%` }}
              >
                {/* Vintage retro diagonal lines overlay for filled portion */}
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,rgba(0,0,0,0.15)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.15)_50%,rgba(0,0,0,0.15)_75%,transparent_75%,transparent)] bg-[size:16px_16px]" />
              </div>
              <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-black text-neo-black select-none z-10 drop-shadow-sm">
                {progressPercent === 100 ? '🏁 MISSION_ACCOMPLISHED_LAUNCH_SEQUENCE_INITIATED' : `${progressPercent}% SECURED`}
              </span>
            </div>

            {/* Smart actionable strategy feedback depending on progress */}
            <div className="bg-zinc-50 border-2 border-neo-black p-3 font-mono text-[10px] font-bold text-zinc-600 flex items-center gap-2">
              <Zap size={14} className="text-neo-yellow shrink-0" />
              <span>
                {progressPercent === 100 ? (
                  "FOUNDER_ALERT: Core integrity is at 100%. All scheduled tasks have been fulfilled. Excellent execution, prepare for deployment and sovereign client onboarding."
                ) : progressPercent >= 75 ? (
                  "INKLO_ADVICE: High traction detected. Remaining steps focus on scaling loops and monetization mechanisms. Do not lose key product focus now."
                ) : progressPercent >= 50 ? (
                  "INKLO_ADVICE: Over halfway to state stabilization. Solid core momentum has been established. Refine your market strategy as you finalize active items."
                ) : progressPercent >= 25 ? (
                  "INKLO_ADVICE: Bootstrapping process successfully in motion. Maintain discipline, ensure feature creep is contained, and proceed to high-leverage milestones."
                ) : (
                  "INKLO_ADVICE: Fresh blueprint detected. Let's clear the initial cold-start hurdle by selecting high-impact tasks and checking off your first items to build momentum."
                )}
              </span>
            </div>
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'Planned' as const, title: 'PLANNED', color: 'bg-white', badge: 'bg-neo-yellow' },
                { id: 'In-Progress' as const, title: 'IN_PROGRESS', color: 'bg-neo-cyan/5', badge: 'bg-neo-cyan' },
                { id: 'Done' as const, title: 'DONE', color: 'bg-neo-lime/5', badge: 'bg-neo-lime' }
              ].map((col) => {
                const columnTasks = normalizedTasks.filter(t => t.status === col.id);
                const isOverColumn = draggedOverColumn === col.id && draggedOverTaskId === null;

                return (
                  <div
                    key={col.id}
                    onDragOver={(e) => handleDragOver(e, col.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, col.id)}
                    className={`border-4 border-neo-black p-4 flex flex-col min-h-[350px] transition-all relative ${col.color} ${
                      isOverColumn ? 'bg-neo-pink/10 ring-4 ring-neo-black' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between border-b-2 border-neo-black pb-2 mb-3">
                      <h4 className="font-black text-xs uppercase tracking-tighter flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full border border-neo-black ${col.badge}`} />
                        {col.title}
                      </h4>
                      <span className="font-mono text-[9px] font-black bg-neo-black text-white px-1.5 py-0.5">
                        {columnTasks.length}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1 flex flex-col">
                      {columnTasks.length === 0 ? (
                        <div className="flex-1 border-2 border-dashed border-neo-black/10 flex items-center justify-center p-4 text-center">
                          <p className="font-mono text-[8px] font-bold text-zinc-400 uppercase leading-normal">
                            DRAG_TASKS_HERE
                          </p>
                        </div>
                      ) : (
                        <AnimatePresence mode="popLayout">
                          {columnTasks.map((t) => {
                            const isBeingDragged = draggedId === t.id;
                            const isDraggedOver = draggedOverTaskId === t.id;

                            return (
                              <motion.div
                                key={t.id}
                                layout
                                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ 
                                  opacity: 0, 
                                  scale: 0.88, 
                                  x: col.id === 'Done' ? 24 : -24, 
                                  transition: { duration: 0.22, ease: 'easeOut' } 
                                }}
                                transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                                draggable
                                onDragStart={(e) => handleDragStart(e, t.id)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => handleDragOver(e, col.id, t.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, col.id, t.id)}
                                onClick={() => toggleTask(t.id)}
                                className={`p-3 border-2 border-neo-black cursor-grab active:cursor-grabbing group transition-all relative ${
                                  t.done ? 'bg-neo-lime/10' : 'bg-white hover:bg-neo-cyan/10'
                                } ${isBeingDragged ? 'opacity-40 border-dashed bg-zinc-50' : 'neo-shadow-xs'} ${
                                  isDraggedOver ? 'border-neo-pink ring-2 ring-neo-pink/20 scale-[1.02]' : ''
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <div className={`w-4 h-4 border-2 border-neo-black flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                                    t.done ? 'bg-neo-lime' : 'bg-white'
                                  }`}>
                                    {t.done && <div className="w-1.5 h-1.5 bg-neo-black" />}
                                  </div>
                                  <span className={`font-black uppercase text-[10px] leading-tight flex-1 select-none ${
                                    t.done ? 'line-through opacity-50' : ''
                                  }`}>
                                    {t.task}
                                  </span>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      )}
                    </div>
                  </div>
                );
              })}
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
