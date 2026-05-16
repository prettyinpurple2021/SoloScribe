import React, { useEffect, useState } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, query, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Trash2, Send, Archive, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../lib/state';

interface StrategyRecord {
  id: string;
  title: string;
  content: string;
  founderMood: string;
  createdAt: any;
}

const StrategyVaultTab = () => {
  const [strategies, setStrategies] = useState<StrategyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyRecord | null>(null);
  const { setCurrentDocument, setFounderMood, setActiveTab } = useAppStore();

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'strategies'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StrategyRecord[];
      setStrategies(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter for unique latest versions for the sidebar
  const uniqueLatest = Array.from(
    strategies.reduce((map, s) => {
      const existing = map.get(s.title);
      if (!existing || s.createdAt?.toMillis() > existing.createdAt?.toMillis()) {
        map.set(s.title, s);
      }
      return map;
    }, new Map<string, StrategyRecord>()).values()
  );

  const filtered = uniqueLatest.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Versions of the selected strategy title
  const versions = selectedStrategy 
    ? strategies
        .filter(s => s.title === selectedStrategy.title)
        .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
    : [];

  const handleReload = () => {
    if (!selectedStrategy) return;
    
    setCurrentDocument(selectedStrategy.content);
    setFounderMood(selectedStrategy.founderMood);
    setActiveTab('keynote');
    toast.success('STRATEGY_RELOADED_TO_EDITOR', {
      description: `Loaded: ${selectedStrategy.title}`,
      icon: '🔄'
    });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.currentUser || !window.confirm('PURGE_STRATEGY_FROM_INKLO_VAULT?')) return;

    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'strategies', id));
      toast.success('STRATEGY_PURGED');
      if (selectedStrategy?.id === id) setSelectedStrategy(null);
    } catch (error: any) {
      toast.error('PURGE_FAILED: ' + error.message);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-8">
      {/* SIDEBAR LIST */}
      <div className="w-full lg:w-96 flex flex-col gap-6">
        <div className="bg-neo-black text-neo-white p-6 border-4 border-neo-black neo-shadow-lg flex items-center justify-between">
           <div className="flex items-center gap-3">
             <Archive className="text-neo-pink" />
             <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Intelligence <br/> Vault</h2>
           </div>
           <div className="bg-neo-lime text-neo-black px-2 py-1 font-mono text-[10px] font-black">
             {uniqueLatest.length}_CONCEPTS
           </div>
        </div>

        <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
           <input 
             type="text" 
             placeholder="SEARCH_INTELLIGENCE..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full bg-white border-4 border-neo-black p-4 pl-12 font-black uppercase text-xs neo-shadow-sm outline-none focus:bg-zinc-50"
           />
        </div>

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
           {loading ? (
             [...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white/50 border-4 border-neo-black animate-pulse" />)
           ) : filtered.length === 0 ? (
             <div className="p-10 border-4 border-dashed border-neo-black/20 text-center font-mono text-xs uppercase opacity-40">
                NO_INTEL_LOADED
             </div>
           ) : (
             filtered.map((s) => {
               const versionCount = strategies.filter(x => x.title === s.title).length;
               return (
                 <motion.div 
                   key={s.id}
                   layoutId={s.id}
                   onClick={() => setSelectedStrategy(s)}
                   className={`
                      bg-white border-4 border-neo-black p-4 cursor-pointer transition-all neo-shadow-hover
                      ${selectedStrategy?.title === s.title ? 'bg-neo-cyan translate-x-2' : ''}
                   `}
                 >
                   <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-[8px] font-black bg-neo-black text-white px-1">
                        {s.createdAt?.toDate().toLocaleDateString() || 'RECENT'}
                      </span>
                      <button onClick={(e) => handleDelete(s.id, e)} className="text-neo-black/20 hover:text-neo-pink">
                        <Trash2 size={14} />
                      </button>
                   </div>
                   <h3 className="font-black text-sm uppercase truncate mb-2">{s.title || 'UNTITLED_STRATEGY'}</h3>
                   <div className="flex justify-between items-center">
                      <div className="px-2 py-0.5 bg-neo-black/10 font-mono text-[8px] font-bold">MOOD: {s.founderMood}</div>
                      {versionCount > 1 && (
                        <div className="font-mono text-[8px] font-black bg-neo-yellow px-1 border border-neo-black">
                          v{versionCount}
                        </div>
                      )}
                   </div>
                 </motion.div>
               );
             })
           )}
        </div>
      </div>

      {/* DETAIL VIEW */}
      <div className="flex-1 min-h-[600px] flex flex-col gap-6">
        <AnimatePresence mode="wait">
          {selectedStrategy ? (
            <motion.div 
              key={selectedStrategy.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white border-4 border-neo-black neo-shadow-lg flex-1 flex flex-col relative"
            >
              <div className="p-8 border-b-4 border-neo-black bg-neo-black text-white flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <Book className="text-neo-cyan" />
                    <div>
                       <h2 className="text-3xl font-black uppercase tracking-tighter">{selectedStrategy.title}</h2>
                       <p className="font-mono text-[10px] text-neo-cyan font-bold">SYSTEM_UUID: {selectedStrategy.id}</p>
                    </div>
                 </div>
                 <div className="flex gap-2">
                   <button 
                     onClick={handleReload}
                     className="bg-neo-pink text-neo-black px-6 py-2 border-4 border-neo-black font-black flex items-center gap-2 hover:translate-y-1 transition-transform"
                   >
                      <RefreshCw size={16} />
                      RELOAD_INTEL
                   </button>
                   <button className="bg-neo-yellow text-neo-black px-6 py-2 border-4 border-neo-black font-black flex items-center gap-2 hover:translate-y-1 transition-transform">
                      <Send size={16} />
                      PUBLISH_EXT
                   </button>
                 </div>
              </div>

              {/* VERSION HISTORY NAVIGATION */}
              {versions.length > 1 && (
                <div className="bg-neo-yellow/20 border-b-4 border-neo-black p-4 flex items-center gap-4 overflow-x-auto">
                   <h4 className="font-black text-[10px] uppercase shrink-0">VERSION_HISTORY //</h4>
                   <div className="flex gap-2">
                     {versions.map((v, i) => (
                       <button
                         key={v.id}
                         onClick={() => setSelectedStrategy(v)}
                         className={`
                            px-3 py-1 border-2 border-neo-black font-mono text-[10px] whitespace-nowrap transition-all uppercase
                            ${selectedStrategy.id === v.id ? 'bg-neo-black text-white' : 'bg-white hover:bg-neo-cyan'}
                         `}
                       >
                         v{versions.length - i} : {v.createdAt?.toDate().toLocaleDateString()}
                       </button>
                     ))}
                   </div>
                </div>
              )}

              {/* SNAPSHOT PREVIEW SECTION */}
              <div className="bg-neo-black/5 p-8 border-b-4 border-neo-black grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="md:col-span-2">
                    <h4 className="font-mono text-[10px] font-black uppercase text-zinc-400 mb-2">QUICK_SNAPSHOT //</h4>
                    <p className="font-bold text-sm italic line-clamp-3 opacity-70">
                      "{selectedStrategy.content.substring(0, 240)}..."
                    </p>
                 </div>
                 <div className="flex flex-col gap-4">
                    <div className="bg-white border-2 border-neo-black p-3 neo-shadow-sm">
                       <h4 className="font-mono text-[8px] font-black uppercase text-zinc-400 mb-1">FOUNDER_MOOD</h4>
                       <div className="font-black text-xs uppercase">{selectedStrategy.founderMood}</div>
                    </div>
                    <div className="bg-white border-2 border-neo-black p-3 neo-shadow-sm">
                       <h4 className="font-mono text-[8px] font-black uppercase text-zinc-400 mb-1">STRATEGY_TIMESTAMP</h4>
                       <div className="font-black text-xs uppercase">
                         {selectedStrategy.createdAt?.toDate().toLocaleString() || 'PENDING_TIMESTAMP'}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex-1 p-8 notebook-bg overflow-y-auto whitespace-pre-wrap font-sans font-bold text-lg leading-relaxed text-zinc-700">
                 {selectedStrategy.content}
              </div>

              {/* Notebook Holes */}
              <div className="absolute left-2 top-0 bottom-0 w-4 flex flex-col justify-around py-20 pointer-events-none opacity-20">
                {[...Array(12)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full border-2 border-neo-black bg-white" />)}
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border-4 border-dashed border-neo-black/10 bg-neo-black/5 p-20 text-center">
               <Archive size={64} className="text-neo-black/10 mb-6" />
               <h3 className="text-2xl font-black uppercase opacity-20">SELECT_INTEL_FOR_ANALYSIS</h3>
               <p className="max-w-md font-bold text-sm opacity-20 mt-2 uppercase">Your strategic history is fully encrypted and stored per-session. Select a record from the vault to review or export.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StrategyVaultTab;
