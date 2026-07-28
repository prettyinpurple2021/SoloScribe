import React, { useEffect, useState, useRef } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, query, onSnapshot, orderBy, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Trash2, Send, Archive, Search, RefreshCw, Globe, Zap, Download, FileText, Filter, ListOrdered } from 'lucide-react';
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
  const [filterMood, setFilterMood] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyRecord | null>(null);
  const [isExportingNotion, setIsExportingNotion] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { 
    setCurrentDocument, 
    setFounderMood, 
    setActiveTab,
    notionToken,
    notionParentId,
    notionParentType
  } = useAppStore();

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

  const filtered = uniqueLatest
    .filter(s => {
      const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMood = filterMood === 'ALL' || s.founderMood === filterMood;
      return matchesSearch && matchesMood;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
      }
      if (sortBy === 'oldest') {
        return (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0);
      }
      if (sortBy === 'alphabetical') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });

  // Versions of the selected strategy title
  const versions = selectedStrategy 
    ? strategies
        .filter(s => s.title === selectedStrategy.title)
        .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
    : [];

  const [isPublishingCommunity, setIsPublishingCommunity] = useState(false);

  const handlePublishToCommunity = async () => {
    if (!selectedStrategy) return;
    if (!auth.currentUser) {
      toast.error('AUTHENTICATION_REQUIRED');
      return;
    }

    setIsPublishingCommunity(true);
    const toastId = toast.loading('PUBLISHING_VAULT_RECORD_TO_COMMUNITY_FEED...');
    try {
      const customPost = {
        userId: auth.currentUser.uid,
        userDisplayName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Anonymous Founder',
        userEmail: auth.currentUser.email || 'unknown',
        title: selectedStrategy.title,
        content: selectedStrategy.content,
        founderMood: selectedStrategy.founderMood || 'HYPER-FOCUSED',
        likesCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'posts'), customPost);
      toast.success('PUBLISHED_TO_COMMUNITY_FEED', {
        id: toastId,
        description: `Successfully broadcast: "${selectedStrategy.title}"`
      });
    } catch (err: any) {
      console.error(err);
      toast.error('COMMUNITY_PUBLISH_FAILED', {
        id: toastId,
        description: err.message
      });
    } finally {
      setIsPublishingCommunity(false);
    }
  };

  const handleExportNotion = async () => {
    if (!selectedStrategy) return;

    if (!notionToken || !notionParentId) {
      toast.error('NOTION_CREDENTIALS_MISSING', {
        description: 'Please configure your Notion integration parameters under SETTINGS first.'
      });
      return;
    }

    setIsExportingNotion(true);
    const toastId = toast.loading('PUBLISHING_VAULT_RECORD_TO_NOTION...');
    try {
      const { sendToNotion } = await import('../../lib/notion');
      const { url } = await sendToNotion({
        token: notionToken,
        parentId: notionParentId,
        parentType: notionParentType,
        title: selectedStrategy.title,
        content: selectedStrategy.content
      });

      toast.success('EXPORT_TO_NOTION_SUCCESS', {
        id: toastId,
        description: `Successfully published strategy "${selectedStrategy.title}" to Notion!`,
        action: {
          label: 'OPEN_NOTION',
          onClick: () => window.open(url, '_blank')
        }
      });
    } catch (err: any) {
      console.error(err);
      toast.error('NOTION_PUBLICATION_FAILED', {
        id: toastId,
        description: err.message || 'Check your target connectivity settings.'
      });
    } finally {
      setIsExportingNotion(false);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedStrategy || !contentRef.current) {
      toast.error('NO_CONTENT_TO_EXPORT');
      return;
    }

    try {
      const toastId = toast.loading('GENERATING_PDF_DOCUMENT...');
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Header Banner
      pdf.setFillColor(0, 0, 0);
      pdf.rect(0, 0, pdfWidth, 25, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text('SOLOSCRIBE INTEL VAULT', 10, 16);
      
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`TITLE: ${selectedStrategy.title.toUpperCase()}`, 10, 32);
      pdf.text(`EXPORTED: ${new Date().toLocaleString()}`, 10, 37);
      pdf.text(`FOUNDER MOOD: ${selectedStrategy.founderMood}`, pdfWidth - 80, 32);
      
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.line(10, 42, pdfWidth - 10, 42);

      const pageHeight = pdf.internal.pageSize.getHeight();
      let imgHeightLeft = pdfHeight;
      let position = 46; // initial position after header

      pdf.addImage(imgData, 'PNG', 10, position, pdfWidth - 20, pdfHeight - 20);
      imgHeightLeft -= (pageHeight - position);

      while (imgHeightLeft > 0) {
        pdf.addPage();
        position = 15; // padding on subsequent pages
        pdf.addImage(imgData, 'PNG', 10, position, pdfWidth - 20, pdfHeight - 20);
        imgHeightLeft -= pageHeight;
      }

      pdf.save(`SoloScribe_Strategy_${selectedStrategy.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
      toast.success('PDF_EXPORT_SUCCESS', { id: toastId });
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('PDF_EXPORT_FAILED');
    }
  };

  const handleExportHTML = () => {
    if (!selectedStrategy) return;
    const dateStr = new Date().toLocaleDateString();
    
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SoloScribe Strategic Document: ${selectedStrategy.title}</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #f3f4f6;
      color: #171717;
      margin: 0;
      padding: 40px 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 4px solid #171717;
      box-shadow: 8px 8px 0px 0px #171717;
      padding: 40px;
    }
    .header {
      border-bottom: 4px solid #171717;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .title {
      font-size: 2.5rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.05em;
      margin: 0 0 10px 0;
    }
    .metadata {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      font-family: monospace;
      font-size: 0.85rem;
      color: #4b5563;
    }
    .meta-tag {
      background: #e5e7eb;
      border: 1px solid #171717;
      padding: 3px 8px;
      font-weight: bold;
    }
    .content {
      white-space: pre-wrap;
      font-size: 1.1rem;
      color: #262626;
    }
    .footer {
      margin-top: 50px;
      border-top: 2px dashed #e5e7eb;
      padding-top: 20px;
      font-size: 0.8rem;
      text-align: center;
      color: #6b7280;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">${selectedStrategy.title}</h1>
      <div class="metadata">
        <span class="meta-tag">MOOD: ${selectedStrategy.founderMood}</span>
        <span class="meta-tag">EXPORTED: ${dateStr}</span>
        <span class="meta-tag">SYSTEM: SOLOSCRIBE_VAULT</span>
      </div>
    </div>
    <div class="content">${selectedStrategy.content}</div>
    <div class="footer">
      GENERATED BY SOLOSCRIBE INTEL SYSTEM &copy; ${new Date().getFullYear()} ALL RIGHTS RESERVED.
    </div>
  </div>
</body>
</html>`;

    const element = document.createElement("a");
    const file = new Blob([htmlContent], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `SoloScribe_Strategy_${selectedStrategy.title.replace(/\s+/g, '_')}_${Date.now()}.html`;
    document.body.appendChild(element);
    element.click();
    toast.success('HTML_PORTABLE_EXPORT_SUCCESS');
  };

  const handleExportObsidian = () => {
    if (!selectedStrategy) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    const obsidianContent = `---
tags: [soloscribe, strategy, decisions, run_${dateStr}]
created: ${dateStr}
status: verified
---

# [[SoloScribe Intelligence Vault]]
*Grounded by: [[Founder Identity Core]]*

${selectedStrategy.content}

---
*Generated by [[SoloScribe Strategic Co-pilot]] on ${new Date().toLocaleString()}*`;

    const element = document.createElement("a");
    const file = new Blob([obsidianContent], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `Obsidian_Vault_Strategy_${Date.now()}.md`;
    document.body.appendChild(element);
    element.click();
    toast.success('OBSIDIAN_VAULT_EXPORT_SUCCESS');
  };

  const handleExportGitHub = () => {
    if (!selectedStrategy) return;
    const ghContent = `### :shield: SECURE STRATEGY RUN: ${selectedStrategy.title}
> Grounded with hyper-local operational constraints under the **Inklo Engine**.

<details>
<summary><b>:bar_chart: EXPEND CORE DEPLOYMENT SCHEMAS</b> (Click to inspect)</summary>

${selectedStrategy.content}

</details>

- [ ] Connect Firestore security bounds
- [ ] Re-verify GDPR compliance vectors
- [ ] Review revenue audit advice
- [ ] Export production-ready documents

---
_Deployed via [SoloScribe](https://ai.studio/build)_`;

    const element = document.createElement("a");
    const file = new Blob([ghContent], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `GitHub_Issue_Strategy_${Date.now()}.md`;
    document.body.appendChild(element);
    element.click();
    toast.success('GITHUB_FLAVORED_EXPORT_SUCCESS');
  };

  const handleExportTrello = () => {
    if (!selectedStrategy) return;
    const lines = selectedStrategy.content.split('\n');
    let currentCategory = 'TO DO';
    const trelloJson: any = {
      lists: [
        { name: 'BACKLOG', cards: [] },
        { name: 'TO DO', cards: [] },
        { name: 'IN DEVELOPMENT', cards: [] },
        { name: 'DONE', cards: [] }
      ]
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) {
        const cleanCat = trimmed.replace(/^#+\s*/, '').trim().toUpperCase();
        if (cleanCat.length < 25) {
          currentCategory = cleanCat;
        }
      } else if (trimmed.startsWith('- [ ]') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const cleanCard = trimmed.replace(/^(-\s*\[\s*\]|-\s*|\*\s*)/, '').trim();
        if (cleanCard) {
          const targetList = trelloJson.lists.find((l: any) => l.name === 'TO DO');
          if (targetList) {
            targetList.cards.push({
              name: cleanCard,
              desc: `Extracted from Strategy section: ${currentCategory}`,
              labels: ['soloscribe']
            });
          }
        }
      }
    });

    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(trelloJson, null, 2)], {type: 'application/json'});
    element.href = URL.createObjectURL(file);
    element.download = `Trello_Kanban_Import_${Date.now()}.json`;
    document.body.appendChild(element);
    element.click();
    toast.success('KANBAN_TRELLO_EXPORT_SUCCESS');
  };

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

        {/* Advanced Sort & Mood Filters */}
        <div className="bg-white border-4 border-neo-black p-4 neo-shadow-sm space-y-4">
          <div>
            <span className="font-mono text-[9px] font-black text-zinc-400 block mb-2 uppercase flex items-center gap-1">
              <ListOrdered size={10} /> SORT_ORDER //
            </span>
            <div className="flex gap-1.5">
              {(['newest', 'oldest', 'alphabetical'] as const).map(order => (
                <button
                  key={order}
                  type="button"
                  onClick={() => setSortBy(order)}
                  className={`flex-1 py-1 px-1.5 border-2 border-neo-black font-mono text-[8px] font-black uppercase transition-all
                    ${sortBy === order ? 'bg-neo-yellow text-neo-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-zinc-100'}
                  `}
                >
                  {order}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="font-mono text-[9px] font-black text-zinc-400 block mb-2 uppercase flex items-center gap-1">
              <Filter size={10} /> FILTER_BY_MOOD //
            </span>
            <div className="flex flex-wrap gap-1">
              {['ALL', 'PRODUCTIVE', 'HYPER-FOCUSED', 'CHAOTIC', 'STRATEGIC', 'GOD_MODE'].map(mood => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => setFilterMood(mood)}
                  className={`px-1.5 py-0.5 border border-neo-black font-mono text-[8px] font-black uppercase transition-all
                    ${filterMood === mood ? 'bg-neo-cyan text-neo-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-zinc-100'}
                  `}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>
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
                   <button 
                     onClick={handleExportNotion}
                     disabled={isExportingNotion}
                     className="bg-neo-yellow text-neo-black px-6 py-2 border-4 border-neo-black font-black flex items-center gap-2 hover:translate-y-1 transition-transform disabled:opacity-40"
                    >
                       {isExportingNotion ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
                       EXPORT_TO_NOTION
                    </button>
                    <button 
                      onClick={handlePublishToCommunity}
                      disabled={isPublishingCommunity}
                      className="bg-neo-lime text-neo-black px-6 py-2 border-4 border-neo-black font-black flex items-center gap-2 hover:translate-y-1 transition-transform disabled:opacity-40"
                    >
                       {isPublishingCommunity ? <RefreshCw className="animate-spin" size={16} /> : <Globe size={16} />}
                       BROADCAST_COMMUNITY
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

              <div ref={contentRef} className="flex-1 p-8 notebook-bg overflow-y-auto whitespace-pre-wrap font-sans font-bold text-lg leading-relaxed text-zinc-700">
                 {selectedStrategy.content}
              </div>

              {/* DYNAMIC MULTI-TARGET EXPORTERS PRO BANNER v2 */}
              <div className="bg-neo-yellow border-t-4 border-neo-black p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-black uppercase text-neo-black font-mono relative z-20">
                 <div className="flex items-center gap-2">
                    <span className="bg-neo-black text-neo-lime px-2 py-0.5 text-[8px] animate-pulse">// VAULT RECOVERY SYSTEM_v5</span>
                    <span className="tracking-tighter">PORTABILITY ACTIONS (BEYOND NOTION):</span>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleExportPDF}
                      className="bg-white hover:bg-neo-cyan border-2 border-neo-black px-2.5 py-1 text-[9px] font-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all flex items-center gap-1"
                      title="Generate beautiful, print-ready PDF with letterhead"
                    >
                      🔴 DOWNLOAD [PDF]
                    </button>
                    <button
                      type="button"
                      onClick={handleExportHTML}
                      className="bg-white hover:bg-neo-lime border-2 border-neo-black px-2.5 py-1 text-[9px] font-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all flex items-center gap-1"
                      title="Download portable offline-ready HTML presentation slide"
                    >
                      🟢 DOWNLOAD [HTML]
                    </button>
                    <button
                      type="button"
                      onClick={handleExportObsidian}
                      className="bg-white hover:bg-neo-cyan border-2 border-neo-black px-2.5 py-1 text-[9px] font-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
                      title="Export styled Obsidian Vault markdown with backlink wikilinks"
                    >
                      🟣 OBSIDIAN [WIKI]
                    </button>
                    <button
                      type="button"
                      onClick={handleExportGitHub}
                      className="bg-white hover:bg-neo-pink border-2 border-neo-black px-2.5 py-1 text-[9px] font-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
                      title="Export developer-ready issue checklist with task boxes"
                    >
                      🐙 GITHUB [ISSUE]
                    </button>
                    <button
                      type="button"
                      onClick={handleExportTrello}
                      className="bg-white hover:bg-neo-lime border-2 border-neo-black px-2.5 py-1 text-[9px] font-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
                      title="Export Trello Kanban group JSON import matrix"
                    >
                      📋 TRELLO [KANBAN]
                    </button>
                 </div>
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
