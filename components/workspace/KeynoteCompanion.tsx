import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Brain, Mic, MicOff, Sparkles, Wand2, History, Languages, X, Save, Copy, Zap, Download, FileText, FileCode, Share2, Globe } from 'lucide-react';
import { thinkDeeply, quickPolish } from '../../lib/ai-tools';
import { toast } from 'sonner';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc as firestoreDoc } from 'firebase/firestore';
import { useAppStore } from '../../lib/state';
import { jsPDF } from 'jspdf';

const PLAYBOOK_TEMPLATES = [
  {
    id: 'MVP_SPEC',
    name: '🛠️ MVP Spec Blueprint',
    description: 'Structure a zero-fluff MVP roadmap, feature set, and out-of-scope boundaries.',
    content: `# MVP FEATURE SPECIFICATION: [PROJECT_NAME]
## 🎯 Core Problem & ICP Match
- **What is the single most painful frustration our target users face daily?**
  *Enter 1-2 sentences of specific user pain.*
- **Who is the ideal customer profile (ICP) that will register and pay immediately?**
  *Define the exact niche (e.g., solo founders with <$1k MRR).*

## 🚀 True Minimal Feature Set (The 1-Week Scope)
- [ ] **Crucial Value Hook:** [Feature 1] - Explain the exact action that solves the core pain.
- [ ] **Simple Onboarding:** [Feature 2] - Minimize registration friction (e.g., passwordless login, offline-first direct entry).
- [ ] **Fast Value Loop:** [Feature 3] - What triggers the "aha" moment in under 15 seconds?

## 🚫 Strictly Out of Scope for Phase 1 (The Prevention List)
- **Deferred Complexity:** What complex systems are strictly forbidden (e.g., custom billing systems, native apps, heavy visualizers)?
- **Alternative Manual Hacks:** How can we substitute automated code with a simple manual email action initially?

## ⚙️ Direct Technology Stack Choices
- **Frontend / Client UI:** React 18 / Vite / Tailwind
- **Persistency Engine:** LocalStorage fallback + Firebase client-side stores
- **Compute Server:** lightweight Single-Node Engine`
  },
  {
    id: 'PRICING_DECK',
    name: '💸 Value Pricing Blueprint',
    description: 'Design monetization channels, conversion triggers, product tiers, and credit math.',
    content: `# MONETIZATION & VALUE PRICING: [PROJECT_NAME]
## 🎯 Hook Tier (Free Engagement Utility)
- **High-Value Lead Generator:** What interactive micro-app or checklist is 100% free with no wall?
  *This builds distribution power & search visibility.*

## 💳 Core Premium Tier ($29/mo or $49/mo)
- **Rigid Conversion Event:** What exact action prompts the paywall (e.g., exporting a full PDF plan, running a 5th AI deep think)?
- **Hard Cost Mitigation:** How does our pricing scale match our cloud compute expenses?

## 🚀 Enterprise Sovereign Tier
- **High-Trust Access:** For corporate users or security-conscious nodes.
  - Custom backup endpoints
  - Encrypted local vault transfers
  - Self-hosting configuration assets`
  },
  {
    id: 'LAUNCH_PH',
    name: '🐱 Launch Program Playbook',
    description: 'Map out copy and targeting for Product Hunt, HackerNews, and software directories.',
    content: `# LAUNCH COPYBOOK: [PROJECT_NAME]
## ⚡ The High-Energy Hook
- **The Short Tagline:** 10-12 words highlighting direct benefit. Eliminate general fluff ("the next-generation AI platform").
  *Example: "Create highly secure strategy matrices for solo creators, grounded in your capital constraints."*

## 🚀 Product Hunt Launch Kit
- **The First Comment:** Explain the raw genesis story. Keep it human: Why did you build this alone? Who is it for? Share a special discount code.
- **Visual Asset List:** High-contrast retro mockups showing actual utility with zero device frame noise.

## 🗣️ HackerNews "Show HN" Pitch
- **Raw Architectural Honesty:** Explain the technical setup transparently. What was hard to build? Why does this matter?`
  },
  {
    id: 'COMP_GAP',
    name: '🦁 Competitor Gap Mapping',
    description: 'Locate competitor loopholes and specify your asymmetric unfair advantage.',
    content: `# COMPETITIVE INTEGRATION GAP: [PROJECT_NAME]
## 👥 Main Competitors (VC-Funded / Big Tech)
- **Competitor A (The Corporate Giant):** VC-backed, heavy sales cycles, complex configurations.
- **Competitor B (The Generic AI Chat):** Linear stream, lacks grounding, exposes keys to client log lines.

## 💥 Loopholes & Structural Weaknesses
- **Bloated Headcounts:** They must charge $150+/seat just to sustain their heavy sales overhead.
- **Cookie-cutter Workflows:** They target enterprise teams, leaving solo operators stranded with slow templates.

## ⚡ Asymmetric Unfair Advantage
- **Hyper-velocity:** We can ship live core revisions in 5 minutes with zero committee approvals.
- **Offline Integrity:** All strategies persist locally on our client-first state engine.`
  }
];

const KeynoteCompanion = () => {
  const [input, setInput] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingNotion, setIsExportingNotion] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { 
    founderMood, 
    currentDocument, 
    setCurrentDocument, 
    founderIdentity,
    isProcessing,
    setIsProcessing,
    setInkloMode,
    notionToken,
    notionParentId,
    notionParentType
  } = useAppStore();

  const recognitionRef = useRef<any>(null);
  const [isPublishingCommunity, setIsPublishingCommunity] = useState(false);

  const handlePublishToCommunity = async () => {
    if (!analysis) {
      toast.error('NO_CONTENT_TO_PUBLISH');
      return;
    }
    if (!auth.currentUser) {
      toast.error('AUTHENTICATION_REQUIRED');
      return;
    }

    setIsPublishingCommunity(true);
    const toastId = toast.loading('PUBLISHING_TO_COMMUNITY_FEED...');
    try {
      const lines = analysis.trim().split('\n');
      let docTitle = 'Strategic Thought Dump';
      if (lines.length > 0 && lines[0].startsWith('#')) {
        docTitle = lines[0].replace(/^#+\s*/, '').trim();
      } else if (lines.length > 0) {
        docTitle = lines[0].slice(0, 50);
      }

      const customPost = {
        userId: auth.currentUser.uid,
        userDisplayName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Anonymous Founder',
        userEmail: auth.currentUser.email || 'unknown',
        title: docTitle,
        content: analysis,
        founderMood: founderMood || 'HYPER-FOCUSED',
        likesCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'posts'), customPost);
      toast.success('PUBLISHED_TO_COMMUNITY_FEED', {
        id: toastId,
        description: `Successfully broadcast: "${docTitle}"`
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
    if (!analysis) {
      toast.error('NO_CONTENT_TO_EXPORT', { description: 'Please process a strategy stream first.' });
      return;
    }
    if (!notionToken || !notionParentId) {
      toast.error('NOTION_CREDENTIALS_MISSING', {
        description: 'Please configure your Notion integration parameters under SETTINGS first.'
      });
      return;
    }

    setIsExportingNotion(true);
    const toastId = toast.loading('EXPORTING_STRATEGY_TO_NOTION_PAGES...');
    try {
      const { sendToNotion } = await import('../../lib/notion');
      const lines = analysis.trim().split('\n');
      let docTitle = 'SoloScribe Strategy Plan';
      if (lines.length > 0 && lines[0].startsWith('#')) {
        docTitle = lines[0].replace(/^#+\s*/, '').trim();
      } else if (lines.length > 0) {
        docTitle = lines[0].slice(0, 50);
      }

      const { url } = await sendToNotion({
        token: notionToken,
        parentId: notionParentId,
        parentType: notionParentType,
        title: docTitle,
        content: analysis
      });

      toast.success('EXPORT_TO_NOTION_SUCCESS', {
        id: toastId,
        description: `Published: "${docTitle}"`,
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

  useEffect(() => {
    if (currentDocument) {
      setAnalysis(currentDocument);
    }
  }, [currentDocument]);

  const handleExportMarkdown = () => {
    if (!analysis) return;
    const element = document.createElement("a");
    const file = new Blob([analysis], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `SoloScribe_Strategy_${Date.now()}.md`;
    document.body.appendChild(element);
    element.click();
    toast.success('MARKDOWN_EXPORT_SUCCESS');
  };

  const handleExportTXT = () => {
    if (!analysis) return;
    const element = document.createElement("a");
    const file = new Blob([analysis], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `SoloScribe_Strategy_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    toast.success('PLAIN_TEXT_EXPORT_SUCCESS');
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput(prev => prev + ' ' + transcript);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
  };

  const handleAction = async (type: 'think' | 'polish') => {
    setIsProcessing(true);
    setInkloMode(type === 'think' ? 'STRATEGIZING' : 'DEFAULT');
    try {
      if (type === 'think') {
        const thoughts = await thinkDeeply(input, founderIdentity);
        setAnalysis(thoughts);
        toast.success('INKLO ENGINE: ANALYSIS COMPLETE', {
           style: { border: '4px solid black', borderRadius: 0, fontWeight: 'bold' }
        });
      } else {
        const polished = await quickPolish(analysis, founderIdentity);
        setAnalysis(polished);
        toast.success('INKLO ENGINE: CONTENT REFINED');
      }
    } catch (error) {
      toast.error('ENGINE ERROR: RECALIBRATING...');
    } finally {
      setIsProcessing(false);
      setInkloMode('DEFAULT');
    }
  };

  const handleSaveStrategy = async () => {
    if (!analysis) {
      toast.error('NO_CONTENT_TO_SAVE');
      return;
    }

    if (!auth.currentUser) {
      toast.error('AUTHENTICATION_REQUIRED: PLEASE SIGN IN');
      return;
    }

    const title = input.trim().slice(0, 40) || 'UNTITLED_STRATEGY';
    setIsSaving(true);
    const toastId = toast.loading('ANALYZING_VAULT_COLLISIONS...');

    try {
      const strategyData: any = {
        userId: auth.currentUser.uid,
        title: title,
        content: analysis,
        founderMood: founderMood,
        updatedAt: serverTimestamp(),
      };

      // Check for duplicates
      const q = query(
        collection(db, 'users', auth.currentUser.uid, 'strategies'),
        where('title', '==', title)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        toast.dismiss(toastId);
        const choice = window.confirm(`EXISTING_STRATEGY_FOUND: "${title}"\n\nOK = SAVE_AS_NEW_VERSION (History preserved)\nCANCEL = OVERWRITE_MOST_RECENT (Clean slate)`);
        
        if (choice) {
          // SAVE AS NEW VERSION
          strategyData.createdAt = serverTimestamp();
          await addDoc(collection(db, 'users', auth.currentUser.uid, 'strategies'), strategyData);
          toast.success('NEW_VERSION_COMMITTED', { id: toastId });
        } else {
          // OVERWRITE (Update the most recent one with this name)
          const docToUpdate = snapshot.docs[0]; // Usually the first one found
          await updateDoc(firestoreDoc(db, 'users', auth.currentUser.uid, 'strategies', docToUpdate.id), strategyData);
          toast.success('STRATEGY_OVERWRITTEN', { id: toastId });
        }
      } else {
        // NORMAL SAVE
        strategyData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'users', auth.currentUser.uid, 'strategies'), strategyData);
        toast.success('STRATEGY_PERSISTED_SUCCESSFULLY', { id: toastId });
      }
    } catch (error: any) {
      console.error('Save Strategy Error:', error);
      toast.error('PERSISTENCE_FAILURE: ' + (error.message || 'UNKNOWN_ERROR'), { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    if (!analysis) return;
    navigator.clipboard.writeText(analysis);
    toast.success('CONTENT_COPIED_TO_CLIPBOARD');
  };

  const handleExportPDF = () => {
    if (!analysis) {
      toast.error('NO_CONTENT_TO_EXPORT');
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text('SOLOSCRIBE: STRATEGY_INTEL', 10, 25);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`EXPORTED_ON: ${new Date().toLocaleString()}`, 10, 50);
      doc.text(`MOOD_CONTEXT: ${founderMood}`, 150, 50);
      
      doc.setLineWidth(1);
      doc.line(10, 55, 200, 55);
      
      // Content
      doc.setFontSize(12);
      const splitText = doc.splitTextToSize(analysis, 180);
      doc.text(splitText, 10, 70);
      
      doc.save(`SoloScribe_Strategy_${Date.now()}.pdf`);
      toast.success('PDF_EXPORT_SUCCESSFUL');
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('EXPORT_FAILURE: MODULE_CRITICAL_ERROR');
    }
  };

  const handleExportObsidian = () => {
    if (!analysis) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    const obsidianContent = `---
tags: [soloscribe, strategy, decisions, run_${dateStr}]
created: ${dateStr}
status: verified
---

# [[SoloScribe Intelligence Vault]]
*Grounded by: [[Founder Identity Core]]*

${analysis}

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
    if (!analysis) return;
    const lines = analysis.split('\n');
    let title = 'SoloScribe Strategy Plan';
    if (lines.length > 0 && lines[0].startsWith('#')) {
      title = lines[0].replace(/^#+\s*/, '').trim();
    }
    const ghContent = `### :shield: SECURE STRATEGY RUN: ${title}
> Grounded with hyper-local operational constraints under the **Inklo Engine**.

<details>
<summary><b>:bar_chart: EXPEND CORE DEPLOYMENT SCHEMAS</b> (Click to inspect)</summary>

${analysis}

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
    if (!analysis) return;
    const lines = analysis.split('\n');
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

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-12rem)] pb-8 pt-4">
      {/* INPUT PANEL - NEO-BRUTALIST */}
      <div className="w-full lg:w-2/5 flex flex-col gap-6" data-tour="founder-stream">
        <div className="bg-neo-white border-4 border-neo-black neo-shadow-lg flex-1 flex flex-col p-6 overflow-hidden transform hover:-rotate-1 transition-transform">
          <div className="flex items-center justify-between mb-4 border-b-4 border-neo-black pb-4">
             <div className="flex items-center gap-2">
                <Brain className="text-neo-pink" />
                <h3 className="font-black text-lg tracking-tighter">FOUNDER_STREAM</h3>
             </div>
             <div className={`px-2 py-1 text-[10px] font-black border-2 border-neo-black ${isListening ? 'bg-neo-lime' : 'bg-neo-yellow'}`}>
                {isListening ? 'LIVE_VOICE' : 'STANDBY'}
             </div>
          </div>

          {/* STRATEGIC PLAYBOOK PRESETS */}
          <div className="mb-4 bg-zinc-50 border-2 border-neo-black p-3.5">
             <div className="text-[9px] font-mono font-black text-zinc-650 uppercase mb-2 flex justify-between items-center">
               <span>SELECT_STRATEGIC_PLAYBOOK_BLUEPRINT:</span>
               <span className="text-neo-pink font-mono text-[7px] animate-pulse">// OFFLINE_CAPABLE</span>
             </div>
             <div className="flex flex-wrap gap-1.5">
               {PLAYBOOK_TEMPLATES.map((tmpl) => (
                 <button
                   key={tmpl.id}
                   type="button"
                   onClick={() => {
                     if (input.trim() && !window.confirm("APPEND_PRESET_BLUEPRINT? Current stream will be preserved.")) {
                       return;
                     }
                     setInput((prev) => prev ? prev + "\n\n" + tmpl.content : tmpl.content);
                     toast.success('BLUEPRINT_INJECTED', {
                       description: `Loaded: ${tmpl.name}`
                     });
                   }}
                   className="text-[9px] font-mono font-black uppercase bg-white hover:bg-neo-cyan hover:text-neo-black text-neo-black border-2 border-neo-black px-2.5 py-1.5 cursor-pointer hover:-translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
                   title={tmpl.description}
                 >
                   {tmpl.name}
                 </button>
               ))}
             </div>
          </div>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="FEED THE INKLO ENGINE..."
            className="flex-1 bg-transparent border-none resize-none focus:ring-0 text-xl font-mono font-bold placeholder:text-zinc-300 scrollbar-hide"
          />

          <div className="flex items-center gap-4 mt-4">
             <button
                onClick={toggleListening}
                className={`p-5 border-4 border-neo-black neo-shadow-hover transition-all active:translate-x-1 active:translate-y-1 active:shadow-none
                   ${isListening ? 'bg-neo-pink' : 'bg-neo-cyan'}`}
             >
                {isListening ? <MicOff size={28} /> : <Mic size={28} />}
             </button>
             
             <button
                onClick={() => handleAction('think')}
                disabled={isProcessing || !input.trim()}
                className="flex-1 py-5 bg-neo-black text-neo-white font-black text-xl tracking-widest flex items-center justify-center gap-3 neo-shadow-hover disabled:bg-zinc-500"
              >
                {isProcessing ? <Zap className="animate-spin text-neo-yellow" /> : <Sparkles />}
                RUN_STRATEGY
              </button>
          </div>
        </div>

        {/* STATS / INFO CARD */}
        <div className="bg-neo-lime border-4 border-neo-black p-4 neo-shadow font-mono text-[10px] font-black flex justify-between uppercase">
           <div>BUFFER: {input.length} CHRS</div>
           <div>MODULE: INKLO_CORE_V1</div>
           <div>STS: OK</div>
        </div>
      </div>

      {/* ANALYSIS PANEL - NOTEBOOK PAPER STYLE */}
      <div className="w-full lg:w-3/5 flex flex-col gap-6 relative" data-tour="notebook-area">
        <div className="notebook-bg border-4 border-neo-black neo-shadow-lg flex-1 flex flex-col overflow-hidden transform hover:rotate-1 transition-transform">
          <div className="flex items-center justify-between p-4 bg-neo-black text-neo-white border-b-4 border-neo-black">
            <div className="flex items-center gap-3">
              <Sparkles className="text-neo-cyan" size={20} />
              <h3 className="font-black tracking-widest text-sm uppercase">Inklo Strategist Output</h3>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => handleAction('polish')}
                disabled={isProcessing || !analysis}
                className="p-2 border-2 border-neo-white hover:bg-neo-cyan hover:text-neo-black transition-all"
                title="Polish"
              >
                <Wand2 size={16} />
              </button>
              <button 
                onClick={() => { setAnalysis(''); setInput(''); setCurrentDocument(''); }}
                className="p-2 border-2 border-neo-white hover:bg-neo-pink hover:text-neo-black transition-all"
                title="New Strategy / Clear"
              >
                <X size={16} />
              </button>
              <button 
                onClick={handleCopy}
                disabled={!analysis}
                className="p-2 border-2 border-neo-white hover:bg-neo-lime hover:text-neo-black transition-all disabled:opacity-30"
                title="Copy to Clipboard"
              >
                <Copy size={16} />
              </button>
              <button 
                onClick={handleExportMarkdown}
                disabled={!analysis}
                className="p-2 border-2 border-neo-white hover:bg-neo-cyan hover:text-neo-black transition-all disabled:opacity-30"
                title="Export as Markdown"
              >
                <FileCode size={16} />
              </button>
              <button 
                onClick={handleExportTXT}
                disabled={!analysis}
                className="p-2 border-2 border-neo-white hover:bg-neo-lime hover:text-neo-black transition-all disabled:opacity-30"
                title="Export as Plain Text"
              >
                <FileText size={16} />
              </button>
              <button 
                onClick={handleExportPDF}
                disabled={!analysis}
                className="p-2 border-2 border-neo-white hover:bg-neo-yellow hover:text-neo-black transition-all disabled:opacity-30"
                title="Export as PDF"
              >
                <Download size={16} />
              </button>
              <button 
                onClick={handleExportNotion}
                disabled={isExportingNotion || !analysis}
                className="p-2 border-2 border-neo-white hover:bg-neo-cyan hover:text-neo-black transition-all disabled:opacity-30"
                title="Export directly to Notion"
              >
                {isExportingNotion ? <Zap className="animate-spin" size={16} /> : <Share2 size={16} />}
              </button>
              <button 
                onClick={handlePublishToCommunity}
                disabled={isPublishingCommunity || !analysis}
                className="p-2 border-2 border-neo-white hover:bg-neo-lime hover:text-neo-black transition-all disabled:opacity-30"
                title="Broadcast package to Inklo Community Feed"
              >
                {isPublishingCommunity ? <Zap className="animate-spin" size={16} /> : <Globe size={16} />}
              </button>
              <button 
                onClick={handleSaveStrategy}
                disabled={isSaving || !analysis}
                className="p-2 border-2 border-neo-white hover:bg-neo-pink hover:text-neo-black transition-all disabled:opacity-30"
                title="Save Strategy"
              >
                {isSaving ? <Zap className="animate-spin" size={16} /> : <Save size={16} />}
              </button>
            </div>
          </div>

          {/* DYNAMIC MULTI-TARGET EXPORTERS PRO BANNER */}
          <div className="bg-neo-yellow border-b-4 border-neo-black p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-black uppercase text-neo-black font-mono relative z-20">
             <div className="flex items-center gap-2">
                <span className="bg-neo-black text-neo-lime px-2 py-0.5 text-[8px] animate-pulse">// INTEGRATION ENGINE_v5</span>
                <span className="tracking-tighter">SOVEREIGN EXPORT DEPLOYMENT DESTINATIONS:</span>
             </div>
             <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleExportObsidian}
                  disabled={!analysis}
                   className="bg-white hover:bg-neo-cyan border-2 border-neo-black px-2.5 py-1 text-[9px] font-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all disabled:opacity-30 disabled:pointer-events-none"
                  title="Export styled Obsidian Vault markdown with backlink wikilinks"
                >
                  🟣 OBSIDIAN [WIKI]
                </button>
                <button
                  type="button"
                  onClick={handleExportGitHub}
                  disabled={!analysis}
                   className="bg-white hover:bg-neo-pink border-2 border-neo-black px-2.5 py-1 text-[9px] font-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all disabled:opacity-30 disabled:pointer-events-none"
                  title="Export developer-ready issue checklist with task boxes"
                >
                  🐙 GITHUB [ISSUE]
                </button>
                <button
                  type="button"
                  onClick={handleExportTrello}
                  disabled={!analysis}
                   className="bg-white hover:bg-neo-lime border-2 border-neo-black px-2.5 py-1 text-[9px] font-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all disabled:opacity-30 disabled:pointer-events-none"
                  title="Export Trello Kanban group JSON import matrix"
                >
                  📋 TRELLO [KANBAN]
                </button>
             </div>
          </div>

          <div 
            className="flex-1 overflow-y-auto p-10 pr-6 relative z-10 scrollbar-thin scrollbar-thumb-neo-black scrollbar-track-transparent"
            ref={scrollRef}
          >
            {analysis ? (
              <div className="animate-in fade-in zoom-in-95 duration-500 whitespace-pre-wrap font-sans text-xl font-bold leading-relaxed text-black">
                {analysis}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                <Brain size={80} className="mb-6 text-neo-black animate-pulse" />
                <p className="text-xl font-black tracking-[0.3em] uppercase transform -rotate-12">Waiting for Feed...</p>
              </div>
            )}
          </div>

          {/* DECORATIVE HOLES FOR NOTEBOOK */}
          <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-around py-8 pointer-events-none z-20">
             {[...Array(12)].map((_, i) => (
                <div key={i} className="w-5 h-5 rounded-full bg-[#f0f0f0] border-2 border-neo-black mx-auto shadow-inner" />
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeynoteCompanion;
