import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Brain, Mic, MicOff, Sparkles, Wand2, History, Languages, X, Save, Copy, Zap, Download, FileText, FileCode } from 'lucide-react';
import { thinkDeeply, quickPolish } from '../../lib/ai-tools';
import { toast } from 'sonner';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc as firestoreDoc } from 'firebase/firestore';
import { useAppStore } from '../../lib/state';
import { jsPDF } from 'jspdf';

const KeynoteCompanion = () => {
  const [input, setInput] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { 
    founderMood, 
    currentDocument, 
    setCurrentDocument, 
    founderIdentity,
    isProcessing,
    setIsProcessing,
    setInkloMode
  } = useAppStore();

  const recognitionRef = useRef<any>(null);

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
                onClick={handleSaveStrategy}
                disabled={isSaving || !analysis}
                className="p-2 border-2 border-neo-white hover:bg-neo-pink hover:text-neo-black transition-all disabled:opacity-30"
                title="Save Strategy"
              >
                {isSaving ? <Zap className="animate-spin" size={16} /> : <Save size={16} />}
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
