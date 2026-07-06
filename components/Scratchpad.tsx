import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Edit3, Type, Maximize2, Minimize2 } from 'lucide-react';
import { useAppStore } from '../lib/state';
import { toast } from 'sonner';

export default function Scratchpad() {
  const { isScratchpadOpen, setIsScratchpadOpen, scratchpadContent, setScratchpadContent } = useAppStore();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(scratchpadContent);
    toast.success('SCRATCHPAD_COPIED');
  };

  return (
    <AnimatePresence>
      {isScratchpadOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300, y: 50, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            x: 0, 
            y: 0, 
            scale: 1,
            width: isExpanded ? '400px' : '300px',
            height: isExpanded ? '500px' : '350px'
          }}
          style={{
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 140px)'
          }}
          exit={{ opacity: 0, x: 300, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-20 md:bottom-24 right-4 md:right-8 z-40 bg-neo-yellow border-4 border-neo-black neo-shadow flex flex-col"
        >
          {/* Header */}
          <div className="bg-neo-black text-neo-white px-3 py-2 flex items-center justify-between border-b-4 border-neo-black cursor-move">
            <div className="flex items-center gap-2">
              <Edit3 size={16} className="text-neo-pink" />
              <span className="font-black text-xs uppercase tracking-widest">IDEA_SCRATCHPAD</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="hover:text-neo-yellow transition-colors"
                aria-label={isExpanded ? "Minimize scratchpad" : "Maximize scratchpad"}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button 
                onClick={() => setIsScratchpadOpen(false)} 
                className="hover:text-neo-pink transition-colors"
                aria-label="Close scratchpad"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Editor */}
          <textarea
            value={scratchpadContent}
            onChange={(e) => setScratchpadContent(e.target.value)}
            placeholder="Log fleeting thoughts here. They'll survive tab switches and refreshes..."
            aria-label="Scratchpad text area"
            className="flex-1 w-full bg-[#fefce8] p-4 font-sans text-sm outline-none resize-none placeholder-zinc-400 font-medium leading-relaxed"
          />

          {/* Footer */}
          <div className="bg-white border-t-4 border-neo-black p-2 flex justify-between items-center">
            <span className="font-mono text-[9px] font-black uppercase text-zinc-500">
              {scratchpadContent.length} CHARS
            </span>
            <button
              onClick={handleCopy}
              aria-label="Copy scratchpad content to clipboard"
              className="bg-neo-black text-neo-white px-3 py-1 font-black text-[9px] uppercase hover:bg-neo-cyan hover:text-neo-black transition-colors"
            >
              COPY_TO_CLIPBOARD
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
