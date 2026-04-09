/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {
  ChangeEvent,
  memo,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import ReactDOM from 'react-dom';
import {
  FunctionDeclaration,
  GoogleGenAI,
  LiveServerToolCall,
  Modality,
  Type,
  FunctionResponse,
} from '@google/genai';
import c from 'classnames';
import { MdEditor, MdPreview } from 'md-editor-rt';
import 'md-editor-rt/lib/style.css';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import { marked } from 'marked';
import * as htmlToImage from 'html-to-image';
import { diffChars } from 'diff';
import { jsPDF } from 'jspdf';

import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import { createSystemInstructions } from '../../lib/prompts';
import { FONT_OPTIONS, PLACEHOLDER_DOC, DOCUMENT_TEMPLATES } from '../../lib/constants';
import {
  useAgent,
  useInsertStore,
  useLogStore,
  usePerfLogStore,
  useUI,
  useUser,
  Insert,
  Project,
} from '../../lib/state';
import { pcmToWav, combineArrayBuffers } from '../../lib/utils';
import Modal, { ConfirmModal, PromptModal } from '../Modal';
import FunctionPlotter from './FunctionPlotter';
import { ChatbotTab } from './ChatbotTab';
import { AIToolsTab } from './AIToolsTab';
import { ValidationEngineTab } from './ValidationEngineTab';
import { ProjectionsTab } from './ProjectionsTab';
import { RoadmapTab } from './RoadmapTab';
import TasksTab from './TasksTab';
import MarketingTab from './MarketingTab';
import { SearchTab } from './SearchTab';
import { CopilotSidebar } from './CopilotSidebar';
import { MinutesLoadingAnimation } from '../MinutesLoadingAnimation';
import { useAuth } from '../../contexts/AuthContext';
import { Tooltip } from '../Tooltip';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { doc, setDoc, getDoc, serverTimestamp, collection, addDoc, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { thinkDeeply } from '../../lib/ai-tools';
import { 
  Share2, 
  Sparkles, 
  Play, 
  Mic, 
  Search, 
  FileText, 
  BarChart2, 
  Image as ImageIcon, 
  Edit3,
  Save,
  Download,
  Copy,
  Wand2,
  History,
  LayoutDashboard,
  CloudUpload,
  Heading1,
  Heading2,
  List,
  Bold,
  ChevronDown,
  Trash2,
  X,
  MessageSquare,
  Pause,
  PlayCircle,
  PauseCircle,
  Clock,
  Eye,
  ClipboardList,
  Volume2,
  Wrench,
  ShieldAlert,
  LineChart,
  Map as MapIcon,
  Undo2,
  Redo2,
  Eraser,
  MoreVertical,
  Type as TypeIcon,
  Lightbulb,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { ShareModal } from './ShareModal';

// Defines the shape for an entry in the text-based conversation transcript.
type TranscriptEntry = {
  speaker: string;
  text: string;
};

// Defines the shape for an entry in the audio log, storing the raw audio blob.
type AudioLogEntry = {
  speaker: string;
  blob: Blob;
  timestamp: Date;
};

const getApiKey = () => {
  if (typeof window !== 'undefined' && window.process?.env?.API_KEY && window.process.env.API_KEY !== '{{API_KEY}}') {
    return window.process.env.API_KEY;
  }
  if (typeof process !== 'undefined' && process.env) {
    const key = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (key && key !== '{{API_KEY}}') {
      return key;
    }
  }
  return undefined;
};

const API_KEY = getApiKey() as string;

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const createWavHeader = (dataLength: number, sampleRate: number) => {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + dataLength, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataLength, true);
  return buffer;
};

declare const MathJax: any;

/**
 * The placeholder component shown when the document is empty.
 * It introduces the key features of the application.
 */
const WelcomePlaceholder = () => (
  <div className="welcome-placeholder">
    <h1 className="welcome-placeholder-title">
      <span className="welcome-prefix">SYSTEM_INITIALIZED // </span>SoloScribe
    </h1>
    <p className="welcome-placeholder-subtitle">
      PRESS THE{' '}
      <span className="icon">
        <Play size={18} fill="currentColor" />
      </span>{' '}
      BUTTON BELOW TO INITIALIZE SESSION.
    </p>
    <div className="placeholder-features-grid">
      <div className="placeholder-feature">
        <div className="icon">
          <Mic size={20} />
        </div>
        <div>
          <h3>CONVERSATIONAL_WRITING</h3>
          <p className="feature-desc">VOICE_INPUT_STREAM: REAL-TIME DOCUMENT SYNTHESIS VIA CO-FOUNDER AGENT.</p>
        </div>
      </div>
      <div className="placeholder-feature">
        <div className="icon">
          <Search size={20} />
        </div>
        <div>
          <h3>WEB_GROUNDING</h3>
          <p className="feature-desc">GOOGLE_SEARCH_INTEGRATION: LIVE KNOWLEDGE RETRIEVAL AND FACT_VERIFICATION.</p>
        </div>
      </div>
      <div className="placeholder-feature">
        <div className="icon">
          <FileText size={20} />
        </div>
        <div>
          <h3>PDF_CONTEXT_INJECTION</h3>
          <p className="feature-desc">DATA_UPLOAD: INGEST EXTERNAL DOCUMENTS FOR DEEP DOMAIN KNOWLEDGE.</p>
        </div>
      </div>
      <div className="placeholder-feature">
        <div className="icon">
          <BarChart2 size={20} />
        </div>
        <div>
          <h3>DYNAMIC_VISUALIZATION</h3>
          <p className="feature-desc">DATA_PLOTTING: INTERACTIVE MATHEMATICAL GRAPHS WITH REAL-TIME MANIPULATION.</p>
        </div>
      </div>
      <div className="placeholder-feature">
        <div className="icon">
          <ImageIcon size={20} />
        </div>
        <div>
          <h3>VISUAL_SYNTHESIS</h3>
          <p className="feature-desc">IMAGE_GENERATION: AI-DRIVEN ILLUSTRATIONS AND SCHEMATICS FOR YOUR CONCEPTS.</p>
        </div>
      </div>
      <div className="placeholder-feature">
        <div className="icon">
          <Edit3 size={20} />
        </div>
        <div>
          <h3>MANUAL_OVERRIDE</h3>
          <p className="feature-desc">DIRECT_EDIT_MODE: FULL CONTROL OVER DOCUMENT STATE AT ANY TIME.</p>
        </div>
      </div>
    </div>
    <div className="inklo-mascot-label">
      ASK INKLO, SOLOSCRIBE
    </div>
  </div>
);

/**
 * A memoized component to render HTML content and then apply MathJax typesetting.
 * By using `React.memo`, this component is protected from re-rendering due to
 * state changes in its parent, preserving the DOM modifications made by MathJax.
 * This prevents the "flashing" issue where rendered math would disappear.
 */
const MathJaxRenderer = memo(({ htmlContent }: { htmlContent: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mathJaxPromiseRef = useRef(Promise.resolve());

  useEffect(() => {
    if (htmlContent && containerRef.current) {
      if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
        const currentElement = containerRef.current;
        // The promise chain ensures sequential typesetting if content changes rapidly.
        mathJaxPromiseRef.current = mathJaxPromiseRef.current
          .then(() => {
            // Re-check for the element's existence before typesetting.
            if (currentElement && currentElement.isConnected) {
              return MathJax.typesetPromise([currentElement]);
            }
          })
          .catch((err: Error) =>
            console.error('MathJax typesetting error:', err),
          );
      }
    }
  }, [htmlContent]); // This effect re-runs only when the actual HTML content changes.

  return (
    <div
      ref={containerRef}
      className="mathjax_ignore"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
});

/**
 * Temporarily replaces LaTeX expressions with unique placeholders to protect
 * them from the Markdown parser.
 * @param text The raw string content.
 * @returns An object containing the text with placeholders and a map of the original LaTeX.
 */
const protectLatex = (
  text: string,
): { protectedText: string; latexMap: string[] } => {
  const latexMap: string[] = [];
  let placeholderIndex = 0;

  const protect = (match: string) => {
    // Use a custom HTML tag as a placeholder. Markdown parsers will treat this
    // as raw HTML and preserve it, preventing it from being escaped or
    // misinterpreted as Markdown syntax.
    const placeholder = `<mathjax-placeholder id="MATHJAX_PLACEHOLDER_${placeholderIndex++}"></mathjax-placeholder>`;
    latexMap.push(match);
    return placeholder;
  };

  // Protect display math first, then inline math.
  let protectedText = text.replace(/\$\$([\s\S]*?)\$\$/g, protect);
  protectedText = protectedText.replace(/\\\[([\s\S]*?)\\\]/g, protect);
  // Strict regex for inline math to avoid matching currency (e.g. $400 to $500, $10-$20, $5*10, #$100, \$100)
  protectedText = protectedText.replace(/\$([^\s$](?:[^\n$]*?[^~+\-*#\\\s$])?)\$/g, protect);
  protectedText = protectedText.replace(/\\\(([\s\S]*?)\\\)/g, protect);

  return { protectedText, latexMap };
};

/**
 * Restores the original LaTeX expressions from placeholders after Markdown parsing.
 * @param text The HTML string containing placeholders.
 * @param latexMap The array of original LaTeX expressions.
 * @returns The final HTML string with LaTeX restored.
 */
const restoreLatex = (text: string, latexMap: string[]): string => {
  return text.replace(
    /<mathjax-placeholder id="MATHJAX_PLACEHOLDER_(\d+)"><\/mathjax-placeholder>/g,
    (match, index) => {
      const latex = latexMap[parseInt(index, 10)];
      // Wrap in mathjax_process class so MathJax only processes these elements
      // and ignores the rest of the content (which is wrapped in mathjax_ignore).
      const isBlock = latex.startsWith('$$') || latex.startsWith('\\[');
      const tag = isBlock ? 'div' : 'span';
      return `<${tag} class="mathjax_process">${latex}</${tag}>`;
    },
  );
};

/**
 * Strips leading whitespace from lines that start with a block-level HTML tag.
 * This is a crucial formatting step. Markdown parsers will misinterpret indented
 * HTML as a code block, which breaks the rendered output. This function ensures
 * that block-level tags are always flush with the start of the line.
 * @param htmlString The raw string content from the document.
 * @returns The cleaned string with leading whitespace removed from HTML block lines.
 */
const stripLeadingWhitespace = (htmlString: string) => {
  if (!htmlString) return '';
  // This regex finds block-level tags (including <math>) at the start of a line
  // (preceded by whitespace) and removes the leading whitespace.
  return htmlString.replace(
    /^\s*(<(?:div|table|p|h[1-6]|ul|ol|li|blockquote|hr|pre|math)[^>]*>)/gm,
    '$1',
  );
};

/**
 * Parses a string representation of an array (e.g., "['sin(x)', 'cos(x)']") into a JS array.
 * This is used for parsing attributes in the [graph] tag.
 */
const parseArrayString = (str: string): string[] => {
  if (!str) return [];
  try {
    const trimmed = str.trim();
    if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return [];
    
    // Remove [ and ]
    const inner = trimmed.substring(1, trimmed.length - 1);
    if (!inner.trim()) return [];
    
    // Split by comma only if followed by a single quote (the start of the next item)
    // This is more robust than splitting by any comma which might be inside a function string.
    return inner.split(/,(?=\s*')/).map(p => {
      const item = p.trim();
      // Remove surrounding single quotes
      return item.replace(/^'|'$/g, '');
    });
  } catch (e) {
    console.error('Error parsing array string:', str, e);
    return [];
  }
};

/**
 * Evaluates a domain string (e.g., "[-2*pi, 2*pi]") into a numeric array.
 */
const evaluateDomain = (str: string): [number, number] => {
  if (!str) return [-10, 10];
  try {
    const trimmed = str.trim();
    if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return [-10, 10];
    
    const inner = trimmed.substring(1, trimmed.length - 1);
    const parts = inner.split(',');
    if (parts.length !== 2) return [-10, 10];
    
    const evaluated = parts.map(p => {
      const js = p.trim().toLowerCase()
        .replace(/pi/g, 'Math.PI')
        .replace(/e/g, 'Math.E');
      // Use Function constructor for a scoped evaluator
      try {
        return new Function(`return (${js});`)();
      } catch {
        return parseFloat(p);
      }
    });
    
    return [evaluated[0], evaluated[1]] as [number, number];
  } catch (e) {
    console.error('Error evaluating domain:', str, e);
    return [-10, 10];
  }
};

// Helper function to write a string to a DataView for WAV header creation.
function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Creates a Blob representing a WAV audio file from raw PCM audio data.
 * The browser cannot play raw PCM audio directly; it needs a file container
 * with a header that describes the audio format (sample rate, bit depth, etc.).
 * This function constructs that standard 44-byte WAV header.
 * @param pcmData The raw PCM audio data as an ArrayBuffer.
 * @param sampleRate The sample rate of the audio (e.g., 24000).
 * @returns A Blob object for the complete WAV file.
 */
function encodeWAV(pcmData: ArrayBuffer, sampleRate: number): Blob {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmData.byteLength;

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // (file size) - 8
  writeString(view, 8, 'WAVE');
  // "fmt" sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // 16 for PCM
  view.setUint16(20, 1, true); // Audio format 1 for PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true); // (Sample Rate * BitsPerSample * Channels) / 8
  view.setUint16(32, blockAlign, true); // (NumChannels * BitsPerSample) / 8
  view.setUint16(34, bitsPerSample, true);
  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  return new Blob([header, pcmData], { type: 'audio/wav' });
}

/**
 * Calculates the duration of a raw PCM audio blob in seconds.
 * This is used for display in the audio log UI.
 * @param blob The raw audio blob.
 * @returns A string representing the duration (e.g., "3.2s").
 */
const getAudioDuration = (blob: Blob) => {
  const bytesPerSample = 2; // 16-bit audio
  const sampleRate = 24000;
  const durationInSeconds = blob.size / (sampleRate * bytesPerSample);
  return `${durationInSeconds.toFixed(1)}s`;
};

// =================================================================
// DOCUMENT RENDERING COMPONENTS
// =================================================================
interface ResizableImageProps {
  id: string;
  src: string;
  alt: string;
  initialWidth: string | null; // e.g., "80%"
  onResize: (id: string, newWidth: string) => void;
}

const ResizableImage: React.FC<ResizableImageProps> = ({
  id,
  src,
  alt,
  initialWidth,
  onResize,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only handle left-clicks
      if (e.button !== 0) return;

      e.preventDefault();
      e.stopPropagation();

      const container = containerRef.current;
      const parent = container?.parentElement;
      if (!container || !parent) return;

      const startX = e.clientX;
      const startWidth = container.offsetWidth;
      const parentWidth = parent.offsetWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX;
        let newWidthPx = startWidth + dx;

        // Constrain width
        if (newWidthPx < 50) newWidthPx = 50; // min width
        if (newWidthPx > parentWidth) newWidthPx = parentWidth; // max width

        container.style.width = `${newWidthPx}px`;
      };

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);

        if (container) {
          const finalWidthPx = container.offsetWidth;
          const finalWidthPercent = (finalWidthPx / parentWidth) * 100;
          // Set container style back to percentage so it's responsive.
          container.style.width = `${finalWidthPercent.toFixed(2)}%`;
          onResize(id, `${finalWidthPercent.toFixed(2)}%`);
        }
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [id, onResize],
  );

  return (
    <div
      ref={containerRef}
      className="illustration-container resizable"
      style={{ width: initialWidth || '100%' }}
    >
      <img src={src} alt={alt} referrerPolicy="no-referrer" />
      <div className="resize-handle" onMouseDown={handleMouseDown}></div>
    </div>
  );
};

const TextPartRenderer = memo(({ text }: { text: string }) => {
  const [html, setHtml] = useState('');

  useEffect(() => {
    if (text.trim() === '') {
      setHtml('');
      return;
    }
    const cleanedWhitespace = stripLeadingWhitespace(text);
    // Strip backslashes before dollar signs (e.g. \$ -> $) to prevent rendering issues
    const cleanedText = cleanedWhitespace.replace(/\\(\$)/g, '$1');
    const { protectedText, latexMap } = protectLatex(cleanedText);
    const rawHtml = marked.parse(protectedText, {
      async: false,
      breaks: true,
      gfm: true,
    }) as string;
    const finalHtml = restoreLatex(rawHtml, latexMap);
    setHtml(finalHtml);
  }, [text]);

  return <MathJaxRenderer htmlContent={html} />;
});

const EmbedPortal: React.FC<{ id: string; children: React.ReactNode; content: string }> = ({ id, children, content }) => {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Reset target when content changes to force a re-find in the new DOM
    setTarget(null);
    
    const findTarget = () => {
      const el = document.getElementById(`soloscribe-embed-${id}`);
      if (el) {
        setTarget(el);
        return true;
      }
      return false;
    };

    if (!findTarget()) {
      const interval = setInterval(() => {
        if (findTarget()) {
          clearInterval(interval);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [id, content]);

  if (!target) return null;
  return ReactDOM.createPortal(children, target);
};

const DocumentRenderer = memo(
  ({
    content,
    inserts,
    onElementResize,
  }: {
    content: string;
    inserts: Insert[];
    onElementResize: (id: string, newWidth: string) => void;
  }) => {
    const { html, embeds } = useMemo(() => {
      if (!content) return { html: '', embeds: [] };

      const embeds: { type: string; id: string; width: string | null; prompt: string | null; part: string; title?: string; body?: string }[] = [];
      
      // "Smart" Content Splitter: Manual scan to find matching closing bracket
      // while ignoring brackets inside quotes.
      let processedContent = content;

      // Handle [collapse] blocks first
      const collapseRegex = /\[collapse\s+title=(["'])((?:\\\1|.)*?)\1\]([\s\S]*?)\[\/collapse\]/g;
      let collapseMatch;
      while ((collapseMatch = collapseRegex.exec(content)) !== null) {
        const id = `collapse_${embeds.length}`;
        const title = collapseMatch[2];
        const body = collapseMatch[3];
        embeds.push({ type: 'collapse', id, width: null, prompt: null, part: collapseMatch[0], title, body });
        processedContent = processedContent.replace(collapseMatch[0], `<div id="soloscribe-embed-${id}" class="soloscribe-embed-placeholder"></div>`);
      }

      const tagRegex = /\[(illustration|graph)\s/g;
      let match;
      const foundTags: { start: number; end: number; type: string; fullMatch: string }[] = [];

      while ((match = tagRegex.exec(content)) !== null) {
        let inQuotes = false;
        let quoteChar = '';
        let tagEnd = -1;
        const type = match[1];

        for (let i = match.index; i < content.length; i++) {
          const char = content[i];
          if ((char === '"' || char === "'") && (i === 0 || content[i-1] !== '\\')) {
            if (!inQuotes) {
              inQuotes = true;
              quoteChar = char;
            } else if (char === quoteChar) {
              inQuotes = false;
            }
          }
          if (char === ']' && !inQuotes) {
            tagEnd = i;
            break;
          }
        }

        if (tagEnd !== -1) {
          const fullMatch = content.substring(match.index, tagEnd + 1);
          foundTags.push({ start: match.index, end: tagEnd, type, fullMatch });
        }
      }

      // Replace tags with placeholders from back to front to preserve indices
      for (let i = foundTags.length - 1; i >= 0; i--) {
        const { start, end, type, fullMatch } = foundTags[i];
        const attrs = fullMatch.substring(type.length + 2, fullMatch.length - 1);
        
        const getAttr = (tag: string, attr: string) => {
          const regex = new RegExp(`${attr}\\s*=\\s*(["'])((?:\\\\\\1|.)*?)\\1`);
          const match = tag.match(regex);
          return match ? match[2] : null;
        };

        let id = getAttr(fullMatch, 'id');
        const width = getAttr(fullMatch, 'width');
        const prompt = getAttr(fullMatch, 'prompt');

        // Robustness: Generate a stable ID if missing based on its order in the document
        if (!id) {
          id = `gen_${type}_${i}`;
        }
        
        embeds.push({ type, id, width, prompt, part: fullMatch });
        processedContent = processedContent.substring(0, start) + 
                           `<div id="soloscribe-embed-${id}" class="soloscribe-embed-placeholder"></div>` + 
                           processedContent.substring(end + 1);
      }

      const cleanedWhitespace = stripLeadingWhitespace(processedContent);
      const { protectedText, latexMap } = protectLatex(cleanedWhitespace);
      
      // Configure marked with highlight.js
      marked.use({
        renderer: {
          code(code, lang) {
            const language = hljs.getLanguage(lang || '') ? (lang || '') : 'plaintext';
            const highlighted = hljs.highlight(code, { language }).value;
            return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
          }
        }
      });

      const rawHtml = marked.parse(protectedText) as string;
      const finalHtml = restoreLatex(rawHtml, latexMap);

      return { html: finalHtml, embeds: embeds.reverse() };
    }, [content]);

    return (
      <>
        <MathJaxRenderer htmlContent={html} />
        {embeds.map((embed) => (
          <EmbedPortal key={embed.id} id={embed.id} content={content}>
            {embed.type === 'collapse' ? (
              <details className="collapsible-section">
                <summary>{embed.title}</summary>
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: marked.parse(embed.body || '', { breaks: true, gfm: true }) as string 
                  }} 
                />
              </details>
            ) : embed.type === 'illustration' ? (() => {
              const insert = inserts.find(ins => ins.id === embed.id);
              if (!insert) {
                return (
                  <Tooltip content={`Preparing: ${embed.prompt}`}>
                    <div className="illustration-loading">
                      <div className="spinner"></div>
                      <span>Preparing image...</span>
                    </div>
                  </Tooltip>
                );
              }

              switch (insert.status) {
                case 'loading':
                  return (
                    <Tooltip content={`Generating: ${insert.prompt}`}>
                      <div className="illustration-loading">
                        <div className="spinner"></div>
                        <span>Generating image...</span>
                      </div>
                    </Tooltip>
                  );
                case 'error':
                  return (
                    <Tooltip content={insert.error || "Error generating image"}>
                      <div className="illustration-error">
                        <span className="icon">error</span>
                        <span>Error generating image.</span>
                      </div>
                    </Tooltip>
                  );
                case 'done':
                  return (
                    <ResizableImage
                      id={embed.id}
                      src={`data:image/png;base64,${insert.data}`}
                      alt={insert.prompt}
                      initialWidth={embed.width}
                      onResize={onElementResize}
                    />
                  );
                default:
                  return <span>{embed.part}</span>;
              }
            })() : (() => {
              const getAttr = (tag: string, attr: string) => {
                const regex = new RegExp(`${attr}\\s*=\\s*(["'])((?:\\\\\\1|.)*?)\\1`);
                const match = tag.match(regex);
                return match ? match[2] : null;
              };

              const graphData = {
                title: getAttr(embed.part, 'title')?.replace(/\\(["'])/g, '$1') || 'Graph',
                functions: parseArrayString(getAttr(embed.part, 'functions') || '[]'),
                labels: parseArrayString(getAttr(embed.part, 'labels') || '[]'),
                xDomain: evaluateDomain(getAttr(embed.part, 'xDomain') || '[-10, 10]'),
                yDomain: evaluateDomain(getAttr(embed.part, 'yDomain') || '[-10, 10]'),
                xLabel: getAttr(embed.part, 'xLabel') || 'x',
                yLabel: getAttr(embed.part, 'yLabel') || 'y',
                colors: parseArrayString(getAttr(embed.part, 'colors') || '[]'),
              };

              return (
                <FunctionPlotter
                  id={embed.id}
                  data={graphData}
                  initialWidth={embed.width}
                  onResize={onElementResize}
                />
              );
            })()}
          </EmbedPortal>
        ))}
      </>
    );
  },
);

// MarkdownHighlighter removed

/**
 * The primary component that orchestrates the collaborative writing experience.
 * It manages the document state, handles all communication with the Live API,
 * processes transcriptions and tool calls, and renders the tabbed interface
 * for the document, transcript, minutes, and audio log.
 */
export default function KeynoteCompanion() {
  const { client, setConfig, stopAudio, connected, setMuted, audioStreamerRef } = useLiveAPIContext();
  const user = useUser();
  const { current } = useAgent();
  const {
    incrementChangeCount,
    setAgentState,
    suppressStaleAgentResponses,
    suppressPostFlushAudio,
    mainTab,
    setMainTab,
    documentTab,
    setDocumentTab,
    font,
    setFont,
    setSpeechBubbleText,
    documentContent,
    setDocumentContent,
    outputModality,
    useSearch,
    showChatHistory,
    setShowChatHistory,
    showCopilot,
    setShowCopilot,
    transcript,
    setTranscript,
    currentProjectId,
    setCurrentProjectId,
    projects: userProjects,
    setProjects: setUserProjects,
  } = useUI();

  // Update muted state when outputModality changes
  useEffect(() => {
    setMuted(outputModality === 'text');
  }, [outputModality, setMuted]);
  const { inserts, addInsert, updateInsert } = useInsertStore();
  const { addLog: addPerfLog } = usePerfLogStore();
  const [documentHistory, setDocumentHistory] = useState<string[]>([]);
  const [redoHistory, setRedoHistory] = useState<string[]>([]);
  const [audioLog, setAudioLog] = useState<AudioLogEntry[]>([]);
  const [correctedTranscript, setCorrectedTranscript] = useState('');
  const [accurateTranscript, setAccurateTranscript] = useState('');
  const [isCorrectingTranscript, setIsCorrectingTranscript] = useState(false);
  const [isGeneratingAccurateTranscript, setIsGeneratingAccurateTranscript] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('Copy');
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'preparing' | 'generating'>('idle');
  const [isThinking, setIsThinking] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<{
    index: number;
    element: HTMLAudioElement;
    url: string;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileToolbar, setShowMobileToolbar] = useState(false);
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<Date | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [showConfirmReplaceModal, setShowConfirmReplaceModal] = useState<{ template: any } | null>(null);
  const [showPromptProjectName, setShowPromptProjectName] = useState<{ onConfirm: (name: string) => void } | null>(null);
  const [showPromptNewProject, setShowPromptNewProject] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [projectVersions, setProjectVersions] = useState<any[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [lastVersionSavedAt, setLastVersionSavedAt] = useState<Date | null>(null);
  const [confirmingVersionId, setConfirmingVersionId] = useState<string | null>(null);
  const lastSnapshotContentRef = useRef<string>('');
  const { user: authUser } = useAuth();
  const lastLoadedProjectIdRef = useRef<string | null>(null);

  // Load project from cloud on login or project change
  useEffect(() => {
    if (!authUser || !currentProjectId) {
      return;
    }
    
    if (lastLoadedProjectIdRef.current === currentProjectId) return;

    const loadProject = async () => {
      const projectId = currentProjectId;
      const projectRef = doc(db, 'users', authUser.uid, 'projects', projectId);
      try {
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
          const data = projectSnap.data();
          setDocumentContent(data.documentContent);
          setTranscript(data.transcript || []);
          toast.success(`Project "${data.name}" loaded.`);
        }
        lastLoadedProjectIdRef.current = projectId;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, projectRef.path);
      }
    };
    
    loadProject();
  }, [authUser, setDocumentContent, setTranscript, currentProjectId]);

  // Auto-save functionality
  useEffect(() => {
    if (!authUser || !currentProjectId) return;

    // Don't auto-save if content is just the placeholder
    if (documentContent === PLACEHOLDER_DOC && transcript.length === 0) return;

    const timer = setTimeout(async () => {
      const projectId = currentProjectId;
      const projectRef = doc(db, 'users', authUser.uid, 'projects', projectId);
      
      try {
        await setDoc(projectRef, {
          id: projectId,
          userId: authUser.uid,
          documentContent,
          transcript,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        
        setLastAutoSavedAt(new Date());
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, projectRef.path);
      }
    }, 5000); // Auto-save after 5 seconds of inactivity

    return () => clearTimeout(timer);
  }, [documentContent, transcript, authUser, currentProjectId]);

  // Periodic version snapshot functionality
  useEffect(() => {
    if (!authUser || !currentProjectId) return;
    
    // Don't save versions if content is just the placeholder
    if (documentContent === PLACEHOLDER_DOC && transcript.length === 0) return;

    // Initialize lastSnapshotContentRef if it's empty
    if (!lastSnapshotContentRef.current) {
      lastSnapshotContentRef.current = documentContent;
    }

    const interval = setInterval(async () => {
      const now = new Date();
      const timeSinceLastSave = lastVersionSavedAt ? now.getTime() - lastVersionSavedAt.getTime() : Infinity;
      
      // Save a version every 10 minutes if content has changed
      if (timeSinceLastSave >= 10 * 60 * 1000 && documentContent !== lastSnapshotContentRef.current) {
        await handleCreateVersion(`Auto-Snapshot - ${now.toLocaleString()}`);
        setLastVersionSavedAt(now);
        lastSnapshotContentRef.current = documentContent;
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [documentContent, transcript, authUser, currentProjectId, lastVersionSavedAt]);
  
  const handleSaveToCloud = async () => {
    if (!authUser) {
      toast.error('Please sign in to save your project to the cloud.');
      return;
    }
    setIsSavingToCloud(true);
    const projectId = currentProjectId;
    const path = `users/${authUser.uid}/projects/${projectId}`;
    try {
      const projectRef = doc(db, 'users', authUser.uid, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (projectSnap.exists()) {
        await setDoc(projectRef, {
          id: projectId,
          userId: authUser.uid,
          documentContent,
          transcript,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } else {
        setShowPromptProjectName({
          onConfirm: async (projectName) => {
            const finalName = projectName || 'Untitled Project';
            try {
              await setDoc(projectRef, {
                id: projectId,
                userId: authUser.uid,
                name: finalName,
                documentContent,
                transcript,
                updatedAt: serverTimestamp(),
                createdAt: serverTimestamp()
              });
              toast.success('Project saved to cloud successfully!');
              await handleCreateVersion(`Manual Save - ${new Date().toLocaleString()}`);
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, path);
            }
            setShowPromptProjectName(null);
          }
        });
        return; // Exit and wait for prompt
      }
      
      // Automatically create a version snapshot on manual save
      await handleCreateVersion(`Manual Save - ${new Date().toLocaleString()}`);
      
      toast.success('Project saved to cloud successfully!');
    } catch (error) {
      console.error('Error saving to cloud:', error);
      toast.error('Failed to save project to cloud.');
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setIsSavingToCloud(false);
    }
  };

  const handleCreateVersion = async (label?: string) => {
    if (!authUser || !currentProjectId) return;
    const projectId = currentProjectId;
    const versionsRef = collection(db, 'users', authUser.uid, 'projects', projectId, 'versions');
    try {
      await addDoc(versionsRef, {
        id: `v_${Date.now()}`,
        documentContent,
        createdAt: serverTimestamp(),
        label: label || `Snapshot ${new Date().toLocaleString()}`,
      });
      setLastVersionSavedAt(new Date());
      lastSnapshotContentRef.current = documentContent;
      if (showHistoryModal) {
        await fetchVersions();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, versionsRef.path);
    }
  };

  const fetchVersions = async () => {
    if (!authUser) return;
    setIsLoadingVersions(true);
    const projectId = currentProjectId;
    const versionsRef = collection(db, 'users', authUser.uid, 'projects', projectId, 'versions');
    const q = query(versionsRef, orderBy('createdAt', 'desc'));
    try {
      const querySnapshot = await getDocs(q);
      const versions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjectVersions(versions);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, versionsRef.path);
      toast.error('Failed to load version history.');
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const handleCloseHistoryModal = () => {
    setShowHistoryModal(false);
    setConfirmingVersionId(null);
  };

  const handleRestoreVersion = (version: any) => {
    setDocumentContent(version.documentContent);
    handleCloseHistoryModal();
    toast.success('Document restored to selected version.');
  };

  const fetchProjects = async () => {
    if (!authUser) return;
    setIsLoadingProjects(true);
    const projectsRef = collection(db, 'users', authUser.uid, 'projects');
    const q = query(projectsRef, orderBy('updatedAt', 'desc'));
    try {
      const querySnapshot = await getDocs(q);
      const projects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setUserProjects(projects);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, projectsRef.path);
      toast.error('Failed to load projects.');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleSwitchProject = async (projectId: string) => {
    setCurrentProjectId(projectId);
    lastLoadedProjectIdRef.current = null; // Trigger reload
    setShowDashboardModal(false);
  };

  const handleCreateNewProject = async () => {
    setShowPromptNewProject(true);
  };

  const executeCreateNewProject = async (name: string) => {
    if (!name || !authUser) return;

    const newProjectId = `project_${Date.now()}`;
    const projectRef = doc(db, 'users', authUser.uid, 'projects', newProjectId);
    
    try {
      await setDoc(projectRef, {
        id: newProjectId,
        userId: authUser.uid,
        name,
        documentContent: PLACEHOLDER_DOC,
        transcript: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      setCurrentProjectId(newProjectId);
      setDocumentContent(PLACEHOLDER_DOC);
      setTranscript([]);
      setShowDashboardModal(false);
      setShowPromptNewProject(false);
      toast.success(`Project "${name}" created.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, projectRef.path);
      toast.error('Failed to create project.');
    }
  };

  const handleSelectTemplate = (template: any) => {
    if (documentContent !== PLACEHOLDER_DOC && documentContent.trim() !== '') {
      setShowConfirmReplaceModal({ template });
      return;
    }
    setDocumentContent(template.content);
    setShowTemplatesModal(false);
    toast.success(`Template "${template.name}" applied.`);
  };

  const executeSelectTemplate = (template: any) => {
    setDocumentContent(template.content);
    setShowTemplatesModal(false);
    setShowConfirmReplaceModal(null);
    toast.success(`Template "${template.name}" applied.`);
  };

  const handleSlashCommand = (command: string) => {
    switch (command) {
      case 'template':
        setShowTemplatesModal(true);
        break;
      case 'history':
        fetchVersions();
        setShowHistoryModal(true);
        break;
      case 'dashboard':
        fetchProjects();
        setShowDashboardModal(true);
        break;
      case 'clear':
        handleClear();
        break;
      case 'save':
        handleSaveToCloud();
        break;
      case 'h1':
        setDocumentContent(prev => prev + '\n# ');
        break;
      case 'h2':
        setDocumentContent(prev => prev + '\n## ');
        break;
      case 'list':
        setDocumentContent(prev => prev + '\n- ');
        break;
      case 'bold':
        setDocumentContent(prev => prev + '**bold text**');
        break;
      case 'collapse':
        setDocumentContent(prev => prev + '\n[collapse title="Section Title"]\nContent goes here...\n[/collapse]\n');
        break;
      default:
        break;
    }
  };

  const renderedViewRef = useRef<HTMLDivElement>(null);
  const minutesViewRef = useRef<HTMLDivElement>(null);

  // =================================================================
  // STABLE REFS FOR EVENT HANDLERS
  // =================================================================
  const transcriptRef = useRef(transcript);
  transcriptRef.current = transcript;
  const documentContentRef = useRef(documentContent);
  documentContentRef.current = documentContent;
  const currentUserText = useRef('');
  const currentModelText = useRef('');
  const currentUserAudioChunks = useRef<ArrayBuffer[]>([]);
  const currentAgentAudioChunks = useRef<ArrayBuffer[]>([]);
  const docContentBeforeEditRef = useRef(documentContent);
  const promptVersionRef = useRef(0);
  const systemInstructionTextRef = useRef('');
  const lastTurnCompleteTimestampRef = useRef(0);
  const selfInterruptionDetectedRef = useRef(false);
  const lastSpeakerRef = useRef<'user' | 'agent' | null>(null);
  const hasSentGreetingRef = useRef(false);
  const turnCounterRef = useRef(0);
  const hasLoggedFirstUserTextThisTurnRef = useRef(false);
  const hasLoggedFirstAgentTextThisTurnRef = useRef(false);
  const hasLoggedFirstAgentAudioThisTurnRef = useRef(false);
  const currentAgentTurnStartTimeRef = useRef<Date | null>(null);
  const agentAudioPlaybackStartTimeRef = useRef<Date | null>(null);
  const agentAudioPlaybackEndTimeRef = useRef<Date | null>(null);
  const latestUserTurnIdRef = useRef(0);
  const currentUserTurnStartTimeRef = useRef<Date | null>(null);
  const processedAgentTurnIdRef = useRef(0);
  const isSuppressingAgentOutputRef = useRef(false);
  const hasFlushedThisTurnRef = useRef(false);
  const isStaleSuppressedThisTurnRef = useRef(false);
  const isPostFlushSuppressedThisTurnRef = useRef(false);
  const isAgentSpeakingRef = useRef(false);
  const hasSearchedThisTurnRef = useRef(false);
  const userRef = useRef(user);
  userRef.current = user;
  const agentRef = useRef(current);
  agentRef.current = current;

  const getAiClient = () => {
    const key = getApiKey();
    return key ? new GoogleGenAI({ apiKey: key }) : null;
  };

  const generatingIdsRef = useRef<Set<string>>(new Set());

  // This effect ensures all map containers and illustration/graph tags have a unique ID, 
  // which is necessary for tracking and persisting their resized dimensions.
  useEffect(() => {
    if (documentContent.includes('<div class="map-wrapper"')) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = documentContent;
      let modified = false;
      // Find all map wrappers that do NOT have an ID attribute.
      tempDiv.querySelectorAll('.map-wrapper:not([id])').forEach(mapWrapper => {
        mapWrapper.id = `map_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        modified = true;
      });

      if (modified) {
        // This is an automatic update to prepare for resizing, so it should not
        // be part of the undo history.
        setDocumentContent(tempDiv.innerHTML);
      }
    }

    // Also handle [graph] tags that are missing an ID
    if (documentContent.includes('[graph') && !documentContent.includes('id="')) {
      let modified = false;
      let lastIndex = 0;
      let newContent = '';
      const tagStartRegex = /\[graph\s/g;
      let match;

      while ((match = tagStartRegex.exec(documentContent)) !== null) {
        newContent += documentContent.substring(lastIndex, match.index);
        
        // Find end of tag
        let bracketIndex = -1;
        let inQuotes = false;
        let quoteChar = '';
        for (let i = match.index; i < documentContent.length; i++) {
          const char = documentContent[i];
          if ((char === '"' || char === "'") && (i === 0 || documentContent[i-1] !== '\\')) {
            if (!inQuotes) { inQuotes = true; quoteChar = char; }
            else if (char === quoteChar) { inQuotes = false; }
          } else if (char === ']' && !inQuotes) {
            bracketIndex = i;
            break;
          }
        }

        if (bracketIndex !== -1) {
          const fullTag = documentContent.substring(match.index, bracketIndex + 1);
          if (!fullTag.includes('id="')) {
            modified = true;
            const tagContent = fullTag.substring(6, fullTag.length - 1);
            newContent += `[graph id="graph_${Date.now()}_${Math.random().toString(36).substring(2, 5)}"${tagContent}]`;
          } else {
            newContent += fullTag;
          }
          lastIndex = bracketIndex + 1;
          tagStartRegex.lastIndex = lastIndex;
        } else {
          newContent += '[';
          lastIndex = match.index + 1;
          tagStartRegex.lastIndex = lastIndex;
        }
      }
      newContent += documentContent.substring(lastIndex);

      if (modified) {
        setDocumentContent(newContent);
      }
    }

    // Also handle [illustration] tags that are missing an ID
    if (documentContent.includes('[illustration') && !documentContent.includes('id="')) {
      let modified = false;
      let lastIndex = 0;
      let newContent = '';
      const tagStartRegex = /\[illustration\s/g;
      let match;

      while ((match = tagStartRegex.exec(documentContent)) !== null) {
        newContent += documentContent.substring(lastIndex, match.index);
        
        // Find end of tag
        let bracketIndex = -1;
        let inQuotes = false;
        let quoteChar = '';
        for (let i = match.index; i < documentContent.length; i++) {
          const char = documentContent[i];
          if ((char === '"' || char === "'") && (i === 0 || documentContent[i-1] !== '\\')) {
            if (!inQuotes) { inQuotes = true; quoteChar = char; }
            else if (char === quoteChar) { inQuotes = false; }
          } else if (char === ']' && !inQuotes) {
            bracketIndex = i;
            break;
          }
        }

        if (bracketIndex !== -1) {
          const fullTag = documentContent.substring(match.index, bracketIndex + 1);
          if (!fullTag.includes('id="')) {
            modified = true;
            const tagContent = fullTag.substring(13, fullTag.length - 1);
            newContent += `[illustration id="img_${Date.now()}_${Math.random().toString(36).substring(2, 5)}"${tagContent}]`;
          } else {
            newContent += fullTag;
          }
          lastIndex = bracketIndex + 1;
          tagStartRegex.lastIndex = lastIndex;
        } else {
          newContent += '[';
          lastIndex = match.index + 1;
          tagStartRegex.lastIndex = lastIndex;
        }
      }
      newContent += documentContent.substring(lastIndex);

      if (modified) {
        setDocumentContent(newContent);
      }
    }
  }, [documentContent]);

  // Trigger image generation for any [illustration] tags found in the document
  useEffect(() => {
    const tagRegex = /\[illustration\s/g;
    let match;
    const content = documentContent;
    
    while ((match = tagRegex.exec(content)) !== null) {
      let inQuotes = false;
      let quoteChar = '';
      let tagEnd = -1;
      for (let i = match.index; i < content.length; i++) {
        const char = content[i];
        if ((char === '"' || char === "'") && (i === 0 || content[i-1] !== '\\')) {
          if (!inQuotes) { inQuotes = true; quoteChar = char; }
          else if (char === quoteChar) { inQuotes = false; }
        } else if (char === ']' && !inQuotes) {
          tagEnd = i;
          break;
        }
      }

      if (tagEnd !== -1) {
        const fullTag = content.substring(match.index, tagEnd + 1);
        const getAttr = (tag: string, attr: string) => {
          const regex = new RegExp(`${attr}\\s*=\\s*(["'])((?:\\\\\\1|.)*?)\\1`);
          const match = tag.match(regex);
          return match ? match[2] : null;
        };

        const id = getAttr(fullTag, 'id');
        const prompt = getAttr(fullTag, 'prompt');

        if (id && prompt && !inserts.some(ins => ins.id === id) && !generatingIdsRef.current.has(id)) {
          generatingIdsRef.current.add(id);
          addInsert({ id, prompt, status: 'loading', type: 'image' });
          
          const isDiagram = prompt.toLowerCase().includes('diagram');
          const model = isDiagram ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
          const config = isDiagram ? {} : { responseModalities: [Modality.IMAGE] };

          const aiClient = getAiClient();
          if (aiClient) {
            aiClient.models.generateContent({
              model,
              contents: { parts: [{ text: prompt }] },
              config,
            }).then(response => {
              const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
              if (imagePart?.inlineData) {
                updateInsert(id, { status: 'done', data: imagePart.inlineData.data });
              } else {
                throw new Error('No image data received from API.');
              }
            }).catch(error => {
              console.error('Image generation failed:', error);
              updateInsert(id, { status: 'error', error: error.message });
            }).finally(() => {
              // We keep it in the set to avoid re-triggering if the store update is slow
              // but eventually the inserts.some check will catch it.
            });
          }
        }
      }
    }
  }, [documentContent, inserts, addInsert, updateInsert]);

  const pushToHistory = (content: string) => {
    setDocumentHistory(prev => [...prev, content]);
    setRedoHistory([]);
  };

  // This callback updates the document content string with new dimensions for a resized map.
  const handleMapResize = useCallback(
    (id: string, newWidth: string, newHeight: string) => {
      const resizeMessage = `The user has changed the map dimensions of ${id} to width: ${newWidth}; height: ${newHeight}`;

      setTranscript(prev => [
        ...prev,
        {
          speaker: userRef.current.name || 'User',
          text: resizeMessage,
        },
      ]);

      setDocumentContent(prevContent => {
        pushToHistory(prevContent);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = prevContent;
        const mapElement = tempDiv.querySelector(`#${id}`);

        if (mapElement && mapElement instanceof HTMLElement) {
          mapElement.style.width = newWidth;
          mapElement.style.height = newHeight;
          mapElement.style.paddingTop = '0'; // Override aspect ratio CSS
        }

        return tempDiv.innerHTML;
      });
    },
    [],
  );

  // A ref to store information about the map being resized.
  const resizeTargetRef = useRef<{
    id: string;
    initialWidth: number;
    initialHeight: number;
  } | null>(null);

  // This handler is attached to the window on mouseup to capture the final
  // dimensions of a resized map.
  const handleRenderedContentMouseUp = useCallback(() => {
    if (resizeTargetRef.current && renderedViewRef.current) {
      const { id, initialWidth, initialHeight } = resizeTargetRef.current;
      const element = renderedViewRef.current.querySelector(`#${id}`);
      if (element) {
        // Re-enable pointer events on the iframe so the map is interactive again.
        const iframe = element.querySelector('iframe');
        if (iframe) {
          iframe.style.pointerEvents = 'auto';
        }

        const newWidth = (element as HTMLElement).offsetWidth;
        const newHeight = (element as HTMLElement).offsetHeight;
        if (newWidth !== initialWidth || newHeight !== initialHeight) {
          handleMapResize(id, `${newWidth}px`, `${newHeight}px`);
        }
      }
    }
    resizeTargetRef.current = null;
    window.removeEventListener('mouseup', handleRenderedContentMouseUp);
  }, [handleMapResize]);

  // This handler listens for a mousedown on a map container to begin
  // tracking a resize operation.
  const handleRenderedContentMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const mapWrapper = target.closest('.map-wrapper');

      if (
        mapWrapper &&
        mapWrapper.id &&
        getComputedStyle(mapWrapper).resize !== 'none'
      ) {
        // Disable pointer events on the iframe to prevent it from stealing focus
        // during the resize drag, which would stop the drag operation.
        const iframe = mapWrapper.querySelector('iframe');
        if (iframe) {
          iframe.style.pointerEvents = 'none';
        }

        resizeTargetRef.current = {
          id: mapWrapper.id,
          initialWidth: (mapWrapper as HTMLElement).offsetWidth,
          initialHeight: (mapWrapper as HTMLElement).offsetHeight,
        };
        window.addEventListener('mouseup', handleRenderedContentMouseUp, {
          once: true,
        });
      }
    },
    [handleRenderedContentMouseUp],
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!connected) {
      lastSpeakerRef.current = null;
      setAgentState(null);
      latestUserTurnIdRef.current = 0;
      processedAgentTurnIdRef.current = 0;
      isSuppressingAgentOutputRef.current = false;
    } else {
      setAgentState('Waiting');
    }
  }, [connected, setAgentState]);

  useEffect(() => {
    if (connected && !hasSentGreetingRef.current) {
      const isWarmStart = documentContentRef.current !== PLACEHOLDER_DOC;
      const message = isWarmStart 
        ? `(System message: The session has been resumed. You already have the current document in your context. Please welcome the user back and ask how to continue.)`
        : `(System message: The conversation has just begun. Please greet the user now based on your instructions.)`;
      
      setAgentState('Thinking');
      client.send([{ text: message }]);
      
      useLogStore.getState().addLog({
        api: 'System Message',
        inputSize: message.length,
        outputSize: 'N/A',
        status: 'success',
        prompt: message,
        promptVersion: promptVersionRef.current,
        turn: turnCounterRef.current,
      });

      hasSentGreetingRef.current = true;
    } else if (!connected) {
      hasSentGreetingRef.current = false;
    }
  }, [connected, client]);

  // Declarations for the functions the agent can call.
  const getContextDeclaration: FunctionDeclaration = {
    name: 'getContext',
    description:
      "Gets the absolute source of truth for the current document state. You MUST call this before every edit to see what the user has changed or deleted. If the document is empty or sections are missing, it means the user has intentionally removed them. Do NOT restore them.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  };

  const updateDocumentDeclaration: FunctionDeclaration = {
    name: 'updateDocument',
    description:
      'Replaces the entire content of the document with new text. This is the primary way to edit the document.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        content: {
          type: Type.STRING,
          description: 'The full, new content of the document.',
        },
      },
      required: ['content'],
    },
  };

  const generateImageDeclaration: FunctionDeclaration = {
    name: 'generateImage',
    description: 'Generates an image based on a text prompt and returns a URL.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: {
          type: Type.STRING,
          description: 'The prompt to generate the image from.',
        },
      },
      required: ['prompt'],
    },
  };

  const generateVideoDeclaration: FunctionDeclaration = {
    name: 'generateVideo',
    description: 'Generates a video based on a text prompt and returns a URL to the video.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: {
          type: Type.STRING,
          description: 'The prompt to generate the video from.',
        },
      },
      required: ['prompt'],
    },
  };

  const thinkDeeplyDeclaration: FunctionDeclaration = {
    name: 'thinkDeeply',
    description: 'Uses an advanced reasoning model to think deeply about a complex query and returns the thoughts.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'The complex query to think about.',
        },
      },
      required: ['query'],
    },
  };

  const searchWebDeclaration: FunctionDeclaration = {
    name: 'searchWeb',
    description: 'Searches the web for up to date information using Google Search and returns the results.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'The query to search for.',
        },
      },
      required: ['query'],
    },
  };

  const createTaskDeclaration: FunctionDeclaration = {
    name: 'create_task',
    description: 'Creates a new task for the current project.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'The title of the task.',
        },
        description: {
          type: Type.STRING,
          description: 'A detailed description of the task.',
        },
        priority: {
          type: Type.STRING,
          enum: ['low', 'medium', 'high'],
          description: 'The priority of the task.',
        },
        dueDate: {
          type: Type.STRING,
          description: 'The due date of the task in ISO 8601 format (YYYY-MM-DD).',
        },
      },
      required: ['title', 'priority', 'dueDate'],
    },
  };

  useEffect(() => {
    // We only update the config when NOT connected to avoid interrupting an active session.
    // When the user pauses (disconnects), this will re-run and capture the latest document state
    // so it's ready for the next "Play" (connect).
    if (connected) return;

    promptVersionRef.current += 1;
    const systemInstructionText = createSystemInstructions(
      current,
      user,
      documentContentRef.current,
      promptVersionRef.current,
      useSearch,
    );
    systemInstructionTextRef.current = systemInstructionText;

    setConfig({
      responseModalities: [Modality.AUDIO],
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: current.voice },
        },
      },
      systemInstruction: systemInstructionText,
      thinkingConfig: { thinkingBudget: 0 },
      tools: [
        ...(useSearch ? [{ googleSearch: {} }] : []),
        {
          functionDeclarations: [
            getContextDeclaration,
            updateDocumentDeclaration,
            generateImageDeclaration,
            generateVideoDeclaration,
            thinkDeeplyDeclaration,
            searchWebDeclaration,
            createTaskDeclaration,
          ],
        },
      ],
    });
  }, [setConfig, user, current, connected, useSearch]);

  useEffect(() => {
    if (!client) return;
    const handleOpen = () => {
      useLogStore.getState().addLog({
        api: 'System Prompt',
        inputSize: systemInstructionTextRef.current.length,
        outputSize: 'N/A',
        status: 'success',
        prompt: systemInstructionTextRef.current,
        promptVersion: promptVersionRef.current,
        turn: turnCounterRef.current,
      });
    };
    client.on('open', handleOpen);
    return () => {
      client.off('open', handleOpen);
    };
  }, [client]);

  useEffect(() => {
    if (!connected || !client) return;

    const timeoutId = setTimeout(() => {
      const currentDoc = documentContent;
      const lastAgentDoc = docContentBeforeEditRef.current;

      // Only notify if there's a meaningful divergence
      if (currentDoc !== lastAgentDoc) {
        const isSignificantChange = Math.abs(currentDoc.length - lastAgentDoc.length) > 10 || currentDoc === '';
        
        if (isSignificantChange) {
          const isDeletion = currentDoc.length < lastAgentDoc.length * 0.5 || currentDoc === '';
          const message = isDeletion 
            ? `(System: The user has manually deleted or significantly reduced the document content. The document is now: "${currentDoc || '[Empty]'}". Respect this deletion and do not restore the old content.)`
            : `(System: The user has manually edited the document. Please take these changes into account for future edits.)`;
          
          // Add a note to the transcript so the conversation history reflects manual edits
          const changes = diffChars(lastAgentDoc, currentDoc);
          const added = changes.filter(c => c.added).map(c => c.value).join('');
          const removed = changes.filter(c => c.removed).map(c => c.value).join('');
          
          let transcriptText = '';
          if (isDeletion) {
            transcriptText = '[User manually deleted significant content]';
          } else if (added.length > 0 && added.length < 100 && removed.length === 0) {
            transcriptText = `[User manually added: "${added}"]`;
          } else if (removed.length > 0 && removed.length < 100 && added.length === 0) {
            transcriptText = `[User manually removed: "${removed}"]`;
          } else {
            transcriptText = '[User manually edited the document]';
          }

          setTranscript(prev => [
            ...prev,
            { speaker: user.name || 'User', text: transcriptText }
          ]);

          client.send([{ text: message }]);
          
          useLogStore.getState().addLog({
            api: 'System Message',
            inputSize: message.length,
            outputSize: 'N/A',
            status: 'success',
            prompt: message,
            promptVersion: promptVersionRef.current,
            turn: turnCounterRef.current,
          });

          addPerfLog({
            turn: turnCounterRef.current,
            event: 'System Action: Notified Agent of User Edit',
            details: { isDeletion, contentLength: currentDoc.length }
          });
        }
        // Sync the ref to avoid repeated notifications for the same state
        docContentBeforeEditRef.current = currentDoc;
      }
    }, 3000); // 3 second debounce to allow typing

    return () => clearTimeout(timeoutId);
  }, [documentContent, connected, client]);

  const handleDocumentChange = (value: string) => {
    setDocumentContent(prevContent => {
      pushToHistory(prevContent);
      return value;
    });
    incrementChangeCount();
  };

  const handleUndo = () => {
    if (documentHistory.length > 0) {
      const lastVersion = documentHistory[documentHistory.length - 1];
      setRedoHistory(prev => [documentContentRef.current, ...prev]);
      setDocumentHistory(prev => prev.slice(0, -1));
      setDocumentContent(lastVersion);
    }
  };

  const handleRedo = () => {
    if (redoHistory.length > 0) {
      const nextVersion = redoHistory[0];
      pushToHistory(documentContentRef.current);
      setRedoHistory(prev => prev.slice(1));
      setDocumentContent(nextVersion);
    }
  };

  const handleElementResize = useCallback((id: string, newWidth: string) => {
    setDocumentContent(prevContent => {
      pushToHistory(prevContent);
      
      let lastIndex = 0;
      let newContent = '';
      const tagStartRegex = /\[(illustration|graph)\s/g;
      let match;
      let found = false;

      while ((match = tagStartRegex.exec(prevContent)) !== null) {
        newContent += prevContent.substring(lastIndex, match.index);
        
        // Find end of tag
        let bracketIndex = -1;
        let inQuotes = false;
        let quoteChar = '';
        for (let i = match.index; i < prevContent.length; i++) {
          const char = prevContent[i];
          if ((char === '"' || char === "'") && (i === 0 || prevContent[i-1] !== '\\')) {
            if (!inQuotes) { inQuotes = true; quoteChar = char; }
            else if (char === quoteChar) { inQuotes = false; }
          } else if (char === ']' && !inQuotes) {
            bracketIndex = i;
            break;
          }
        }

        if (bracketIndex !== -1) {
          const fullTag = prevContent.substring(match.index, bracketIndex + 1);
          const elementType = match[1];
          
          // Check if this is the tag we're looking for
          if (fullTag.includes(`id="${id}"`)) {
            found = true;
            let tagBody = fullTag.substring(elementType.length + 2, fullTag.length - 1);
            if (tagBody.includes('width=')) {
              tagBody = tagBody.replace(/width="[^"]+"/, `width="${newWidth}"`);
            } else {
              tagBody += ` width="${newWidth}"`;
            }
            newContent += `[${elementType} ${tagBody.trim()}]`;
          } else {
            newContent += fullTag;
          }
          lastIndex = bracketIndex + 1;
          tagStartRegex.lastIndex = lastIndex;
        } else {
          newContent += '[';
          lastIndex = match.index + 1;
          tagStartRegex.lastIndex = lastIndex;
        }
      }
      newContent += prevContent.substring(lastIndex);

      return found ? newContent : prevContent;
    });
  }, []);

  useEffect(() => {
    const log = useLogStore.getState().addLog;
    const addSuppressedLog = useLogStore.getState().addSuppressedLog;

    const updateSuppressionState = () => {
      const isStale =
        suppressStaleAgentResponses &&
        processedAgentTurnIdRef.current < latestUserTurnIdRef.current - 1;
      const isPostFlush = suppressPostFlushAudio && hasFlushedThisTurnRef.current;

      const shouldSuppress = isStale || isPostFlush;

      // 1. Handle staleness (interruption) - requires stopAudio()
      if (isStale && !isStaleSuppressedThisTurnRef.current) {
        addPerfLog({
          turn: turnCounterRef.current,
          event: 'Agent Action: Starting Stale Response Suppression',
          details: {
            latestUserTurnId: latestUserTurnIdRef.current,
            processedAgentTurnId: processedAgentTurnIdRef.current,
          },
        });
        stopAudio();
        isStaleSuppressedThisTurnRef.current = true;
        useLogStore.getState().incrementSuppressedAudioCount();
      }

      // 2. Handle post-flush - just log and set flags, NO stopAudio()
      if (isPostFlush && !isPostFlushSuppressedThisTurnRef.current) {
        addPerfLog({
          turn: turnCounterRef.current,
          event: 'Agent Action: Starting Post-Flush Suppression',
          details: {
            hasFlushed: true,
          },
        });
        isPostFlushSuppressedThisTurnRef.current = true;
        useLogStore.getState().incrementSuppressedAudioCount();
      }

      isSuppressingAgentOutputRef.current = shouldSuppress;
      if (client) {
        client.suppressPlayback = shouldSuppress;
      }
    };

    // Initial check
    updateSuppressionState();

    const flushModelTextBuffer = (forceSuppressed = false) => {
      hasFlushedThisTurnRef.current = true;
      updateSuppressionState();
      if (isSuppressingAgentOutputRef.current || forceSuppressed) {
        const suppressedText = currentModelText.current.trim();
        const suppressedAudioChunks = currentAgentAudioChunks.current;

        if (suppressedText) {
          addSuppressedLog({
            api: 'Agent Response (Suppressed)',
            inputSize: 'N/A',
            outputSize: suppressedText.length,
            status: 'success',
            response: suppressedText,
            promptVersion: promptVersionRef.current,
            turn: turnCounterRef.current,
          });
        }

        if (suppressedAudioChunks.length > 0) {
          const combinedPCM = combineArrayBuffers(suppressedAudioChunks);
          const wav = pcmToWav(combinedPCM);
          addSuppressedLog({
            api: 'Agent Response (Audio - Suppressed)',
            inputSize: 'N/A',
            outputSize: 'N/A',
            audioSize: wav.size,
            status: 'success',
            response: `[Suppressed Audio Data: ${wav.size} bytes]`,
            promptVersion: promptVersionRef.current,
            timestamp: currentAgentTurnStartTimeRef.current || new Date(),
            endTimestamp: new Date(),
            audioBlob: wav,
            turn: turnCounterRef.current,
          });
        }

        currentModelText.current = '';
        currentAgentAudioChunks.current = [];
        return;
      }
      const pendingText = currentModelText.current.trim();
      const pendingAudioChunks = currentAgentAudioChunks.current;
      
      if (pendingText || pendingAudioChunks.length > 0) {
        addPerfLog({
          turn: turnCounterRef.current,
          event: 'Agent Action: Flushing Buffers',
          details: { text: pendingText, audioChunks: pendingAudioChunks.length },
        });
        
        if (pendingText) {
          setTranscript(prev => {
            const lastEntry = prev[prev.length - 1];
            if (lastEntry && lastEntry.speaker === agentRef.current.name) {
              return [
                ...prev.slice(0, -1),
                { ...lastEntry, text: lastEntry.text + ' ' + pendingText },
              ];
            } else {
              return [
                ...prev,
                { speaker: agentRef.current.name, text: pendingText },
              ];
            }
          });
          log({
            api: 'Agent Response (Flush)',
            inputSize: 'N/A',
            outputSize: pendingText.length,
            status: 'success',
            response: pendingText,
            promptVersion: promptVersionRef.current,
            turn: turnCounterRef.current,
          });
        }

        if (pendingAudioChunks.length > 0) {
          const combinedPCM = combineArrayBuffers(pendingAudioChunks);
          const wav = pcmToWav(combinedPCM);
          log({
            api: 'Agent Response (Audio - Flush)',
            inputSize: 'N/A',
            outputSize: 'N/A',
            audioSize: wav.size,
            status: 'success',
            response: `[Flushed Audio Data: ${wav.size} bytes]`,
            promptVersion: promptVersionRef.current,
            timestamp: currentAgentTurnStartTimeRef.current || new Date(),
            endTimestamp: new Date(),
            audioBlob: wav,
            turn: turnCounterRef.current,
          });
        }

        currentModelText.current = '';
        currentAgentAudioChunks.current = [];
        lastSpeakerRef.current = 'agent';
      }
    };

    const handleToolCall = async (toolCall: LiveServerToolCall) => {
      updateSuppressionState();
      const isStale =
        suppressStaleAgentResponses &&
        processedAgentTurnIdRef.current < latestUserTurnIdRef.current - 1;

      if (isStale) {
        addPerfLog({
          turn: turnCounterRef.current,
          event: 'Agent Action: Suppressed Stale Tool Call',
          details: {
            functionNames: toolCall.functionCalls.map(fc => fc.name),
            latestUserTurnId: latestUserTurnIdRef.current,
            processedAgentTurnId: processedAgentTurnIdRef.current,
          },
        });
        const functionResponses: FunctionResponse[] =
          toolCall.functionCalls.map(fc => ({
            id: fc.id,
            name: fc.name,
            response: { result: { status: 'OK - Suppressed by client' } },
          }));
        client.sendToolResponse({ functionResponses });
        log({
          api: 'Function Call (Response - Suppressed)',
          inputSize: 'N/A',
          outputSize: JSON.stringify(functionResponses).length,
          status: 'success',
          response: JSON.stringify(functionResponses),
          promptVersion: promptVersionRef.current,
          turn: turnCounterRef.current,
        });
        return;
      }
      log({
        api: 'Function Call (Received)',
        inputSize: 'N/A',
        outputSize: 'N/A',
        status: 'success',
        prompt: JSON.stringify(toolCall.functionCalls),
        promptVersion: promptVersionRef.current,
        turn: turnCounterRef.current,
      });
      addPerfLog({
        turn: turnCounterRef.current,
        event: 'Agent Action: Tool Call Received',
        details: { functionNames: toolCall.functionCalls.map(fc => fc.name) },
      });
      flushModelTextBuffer();
      const functionResponses: FunctionResponse[] = [];

      for (const fc of toolCall.functionCalls) {
        let result: Record<string, any> = { status: 'OK' };

        try {
          switch (fc.name) {
            case 'getContext': {
              setAgentState('Processing Context');
              const currentDoc = documentContentRef.current;
              const documentContext =
                currentDoc === PLACEHOLDER_DOC
                  ? '(The document is currently empty.)'
                  : currentDoc;
              const recentTranscript = transcriptRef.current
                .slice(-10)
                .map(t => `${t.speaker}: ${t.text}`)
                .join('\n');
              const fullContext = `
User: "${userRef.current.name}"
Writing Topic: "${userRef.current.topic}"
Output Format: ${userRef.current.format}
User's Background Info: "${userRef.current.info}"
Here is the current state of the document we are working on:
---
${documentContext}
---
Here is the recent conversation history:
${recentTranscript}`;
              result = { text: fullContext };
              break;
            }
            case 'updateDocument': {
              setAgentState(hasSearchedThisTurnRef.current ? 'Search based update' : 'Updating Document');
              const { content } = fc.args;
              if (typeof content === 'string') {
                pushToHistory(documentContentRef.current);
                setDocumentContent(content);
                incrementChangeCount();
                docContentBeforeEditRef.current = content;
              }
              break;
            }
            case 'googleSearch': {
              setAgentState('SEARCHING');
              hasSearchedThisTurnRef.current = true;
              break;
            }
            case 'generateImage': {
              setAgentState('Generating Image');
              const { prompt } = fc.args;
              if (typeof prompt === 'string') {
                const { generateImage } = await import('../../lib/ai-tools');
                const imageUrl = await generateImage(prompt);
                result = { imageUrl };
              }
              break;
            }
            case 'generateVideo': {
              setAgentState('Generating Video');
              const { prompt } = fc.args;
              if (typeof prompt === 'string') {
                const { generateVideo } = await import('../../lib/ai-tools');
                const videoUrl = await generateVideo(prompt);
                result = { videoUrl };
              }
              break;
            }
            case 'thinkDeeply': {
              setAgentState('Thinking Deeply');
              const { query } = fc.args;
              if (typeof query === 'string') {
                const { thinkDeeply } = await import('../../lib/ai-tools');
                const thoughts = await thinkDeeply(query);
                result = { thoughts };
              }
              break;
            }
            case 'searchWeb': {
              setAgentState('Searching Web');
              const { query } = fc.args;
              if (typeof query === 'string') {
                const { searchWeb } = await import('../../lib/ai-tools');
                const searchResults = await searchWeb(query);
                result = { searchResults };
              }
              break;
            }
            case 'create_task': {
              setAgentState('Creating Task');
              const { title, description, priority, dueDate } = fc.args;
              if (typeof title === 'string' && typeof priority === 'string' && typeof dueDate === 'string') {
                if (authUser && currentProjectId) {
                  const taskData = {
                    projectId: currentProjectId,
                    userId: authUser.uid,
                    title,
                    description: description || '',
                    priority: priority as 'low' | 'medium' | 'high',
                    dueDate: Timestamp.fromDate(new Date(dueDate)),
                    completed: false,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                  };
                  const tasksRef = collection(db, 'users', authUser.uid, 'projects', currentProjectId, 'tasks');
                  await addDoc(tasksRef, taskData);
                  toast.success(`Task created: ${title}`);
                  result = { status: 'Task created successfully' };
                } else {
                  result = { error: 'No active project or user not authenticated' };
                }
              }
              break;
            }
          }
        } catch (error) {
          console.error(`Error executing tool ${fc.name}:`, error);
          result = { error: error instanceof Error ? error.message : 'Unknown error' };
        }
        
        functionResponses.push({
          id: fc.id,
          name: fc.name,
          response: { result },
        });
      }

      if (functionResponses.length > 0) {
        client.sendToolResponse({ functionResponses });
        
        // Reset flush flag so that the model's response to the tool result is not suppressed.
        hasFlushedThisTurnRef.current = false;
        updateSuppressionState();

        log({
          api: 'Function Call (Response)',
          inputSize: 'N/A',
          outputSize: JSON.stringify(functionResponses).length,
          status: 'success',
          response: JSON.stringify(functionResponses),
          promptVersion: promptVersionRef.current,
          turn: turnCounterRef.current,
        });
        addPerfLog({
          turn: turnCounterRef.current,
          event: 'Agent Action: Tool Response Sent',
          details: { functionResponses },
        });
      }
    };

    if (audioStreamerRef.current) {
      audioStreamerRef.current.onStart = () => {
        agentAudioPlaybackStartTimeRef.current = new Date();
      };
      audioStreamerRef.current.onComplete = () => {
        agentAudioPlaybackEndTimeRef.current = new Date();
      };
    }

    const handleUserAudio = (data: ArrayBuffer) => {
      currentUserAudioChunks.current.push(data);
    };

    const handleAgentAudio = (data: ArrayBuffer) => {
      updateSuppressionState();
      
      // Always collect audio chunks for logging, even if playback is suppressed.
      currentAgentAudioChunks.current.push(data);

      if (isSuppressingAgentOutputRef.current) {
        return;
      }
      if (!currentAgentTurnStartTimeRef.current) {
        currentAgentTurnStartTimeRef.current = new Date();
      }
      if (!hasLoggedFirstAgentAudioThisTurnRef.current) {
        addPerfLog({
          turn: turnCounterRef.current,
          event: 'Agent Response: First Audio Chunk Received',
          details: { size: data.byteLength },
        });
        // We log the first chunk, but we'll update it later or just keep it as the start
        log({
          api: 'Agent Response (Audio)',
          inputSize: 'N/A',
          outputSize: 'N/A',
          audioSize: data.byteLength,
          status: 'success',
          response: `[Audio Data: ${data.byteLength} bytes]`,
          promptVersion: promptVersionRef.current,
          timestamp: currentAgentTurnStartTimeRef.current,
          turn: turnCounterRef.current,
        });
        hasLoggedFirstAgentAudioThisTurnRef.current = true;
      }
    };

    const handleInputTranscription = (text: string) => {
      if (!currentUserTurnStartTimeRef.current) {
        currentUserTurnStartTimeRef.current = new Date();
      }
      setAgentState('Listening');
      if (!hasLoggedFirstUserTextThisTurnRef.current && text.trim()) {
        turnCounterRef.current += 1;
        hasFlushedThisTurnRef.current = false;
        isStaleSuppressedThisTurnRef.current = false;
        isPostFlushSuppressedThisTurnRef.current = false;
        hasSearchedThisTurnRef.current = false;
        addPerfLog({
          turn: turnCounterRef.current,
          event: 'User Speech: First Text Chunk Received',
          details: { text },
        });
        hasLoggedFirstUserTextThisTurnRef.current = true;
      }
      if (isAgentSpeakingRef.current) {
        selfInterruptionDetectedRef.current = true;
      }
      currentUserText.current += text;
    };

    const handleOutputTranscription = (text: string) => {
      updateSuppressionState();
      
      const isSuppressed = isSuppressingAgentOutputRef.current;

      if (isSuppressed) {
        const isStale =
          suppressStaleAgentResponses &&
          processedAgentTurnIdRef.current < latestUserTurnIdRef.current - 1;
        addPerfLog({
          turn: turnCounterRef.current,
          event: isStale
            ? 'Agent Response: Suppressed Stale Text'
            : 'Agent Response: Suppressed Post-Flush Text',
          details: {
            text,
            latestUserTurnId: latestUserTurnIdRef.current,
            processedAgentTurnId: processedAgentTurnIdRef.current,
            hasFlushed: hasFlushedThisTurnRef.current,
          },
        });
      }

      if (!hasLoggedFirstAgentTextThisTurnRef.current && text.trim()) {
        if (!currentAgentTurnStartTimeRef.current) {
          currentAgentTurnStartTimeRef.current = new Date();
        }
        addPerfLog({
          turn: turnCounterRef.current,
          event: isSuppressed ? 'Agent Response: First Text Chunk Received (Suppressed)' : 'Agent Response: First Text Chunk Received',
          details: { text },
        });
        log({
          api: isSuppressed ? 'Agent Response (Text - Suppressed)' : 'Agent Response (Text)',
          inputSize: 'N/A',
          outputSize: text.length,
          status: 'success',
          response: text,
          promptVersion: promptVersionRef.current,
          timestamp: currentAgentTurnStartTimeRef.current,
          turn: turnCounterRef.current,
        });
        hasLoggedFirstAgentTextThisTurnRef.current = true;
      }

      if (!isAgentSpeakingRef.current) {
        isAgentSpeakingRef.current = true;
        setAgentState(null);
      }
      currentModelText.current += text;
      if (!isSuppressed && (outputModality === 'text' || outputModality === 'both')) {
        setSpeechBubbleText(currentModelText.current);
      }
    };

    const handleTurnComplete = () => {
      const now = Date.now();
      if (now - lastTurnCompleteTimestampRef.current < 500) {
        return;
      }
      lastTurnCompleteTimestampRef.current = now;
      const userFinal = currentUserText.current.trim();
      const agentFinal = currentModelText.current.trim();
      setTranscript(prev => {
        let nextTranscript = [...prev];
        if (userFinal) {
          nextTranscript.push({
            speaker: userRef.current.name || 'User',
            text: userFinal,
          });
        }
        if (agentFinal && !isSuppressingAgentOutputRef.current) {
          const lastEntry = nextTranscript[nextTranscript.length - 1];
          if (
            lastEntry &&
            lastEntry.speaker === agentRef.current.name &&
            !userFinal
          ) {
            nextTranscript[nextTranscript.length - 1] = {
              ...lastEntry,
              text: lastEntry.text + ' ' + agentFinal,
            };
          } else {
            nextTranscript.push({
              speaker: agentRef.current.name,
              text: agentFinal,
            });
          }
        }
        return nextTranscript;
      });

      if (userFinal) {
        latestUserTurnIdRef.current++;
        updateSuppressionState();
        hasLoggedFirstAgentAudioThisTurnRef.current = false;
        hasLoggedFirstAgentTextThisTurnRef.current = false;
        hasLoggedFirstUserTextThisTurnRef.current = false;
        addPerfLog({
          turn: turnCounterRef.current,
          event: 'User Turn: End Detected',
          details: { text: userFinal, turnId: latestUserTurnIdRef.current },
        });
        setAgentState('Thinking');
        const combinedUserAudioPCM = combineArrayBuffers(currentUserAudioChunks.current);
        const combinedUserAudioWav = pcmToWav(combinedUserAudioPCM);
        
        if (combinedUserAudioWav.size > 0) {
          setAudioLog(prev => [
            ...prev,
            {
              speaker: user.name || 'User',
              blob: combinedUserAudioWav,
              timestamp: new Date(),
            },
          ]);
        }
        log({
          api: 'User Speech (Final)',
          inputSize: userFinal.length,
          outputSize: 'N/A',
          audioSize: combinedUserAudioWav.size,
          status: 'success',
          prompt: userFinal,
          promptVersion: promptVersionRef.current,
          timestamp: currentUserTurnStartTimeRef.current || new Date(),
          endTimestamp: new Date(),
          audioBlob: combinedUserAudioWav,
          turn: turnCounterRef.current,
        });
        currentUserTurnStartTimeRef.current = null;
        lastSpeakerRef.current = 'user';
      }

      if (agentFinal || isSuppressingAgentOutputRef.current) {
        processedAgentTurnIdRef.current++;
        updateSuppressionState();
        setAgentState('Waiting');
        addPerfLog({
          turn: turnCounterRef.current,
          event: 'Agent Turn: End Detected',
          details: {
            text: agentFinal,
            processedTurnId: processedAgentTurnIdRef.current,
            wasSuppressed: isSuppressingAgentOutputRef.current,
          },
        });
        const combinedAgentAudioPCM = combineArrayBuffers(currentAgentAudioChunks.current);
        const combinedAgentAudioWav = pcmToWav(combinedAgentAudioPCM);
        
        const isSuppressed = isSuppressingAgentOutputRef.current;

        if (combinedAgentAudioWav.size > 0) {
          if (!isSuppressed) {
            setAudioLog(prev => [
              ...prev,
              {
                speaker: current.name,
                blob: combinedAgentAudioWav,
                timestamp: new Date(),
              },
            ]);
          }

          // Update the Agent Response (Audio) log with the full blob and playback timestamps
          const logFn = isSuppressed ? addSuppressedLog : log;
          logFn({
            api: isSuppressed ? 'Agent Response (Audio - Suppressed)' : 'Agent Response (Audio)',
            inputSize: 'N/A',
            outputSize: 'N/A',
            audioSize: combinedAgentAudioWav.size,
            status: 'success',
            response: `[Full Audio Data: ${combinedAgentAudioWav.size} bytes]${isSuppressed ? ' (Suppressed)' : ''}`,
            promptVersion: promptVersionRef.current,
            timestamp: agentAudioPlaybackStartTimeRef.current || currentAgentTurnStartTimeRef.current || new Date(),
            endTimestamp: agentAudioPlaybackEndTimeRef.current || new Date(),
            audioBlob: combinedAgentAudioWav,
            turn: turnCounterRef.current,
          });
        }
        // Also update Agent Response (Text) end timestamp if it exists
        if (agentFinal) {
          const logFn = isSuppressed ? addSuppressedLog : log;
          logFn({
            api: isSuppressed ? 'Agent Response (Text - Suppressed)' : 'Agent Response (Text)',
            inputSize: 'N/A',
            outputSize: agentFinal.length,
            status: 'success',
            response: agentFinal,
            promptVersion: promptVersionRef.current,
            timestamp: agentAudioPlaybackStartTimeRef.current || currentAgentTurnStartTimeRef.current || new Date(),
            endTimestamp: agentAudioPlaybackEndTimeRef.current || new Date(),
            turn: turnCounterRef.current,
          });
        }
        currentAgentTurnStartTimeRef.current = null;
        agentAudioPlaybackStartTimeRef.current = null;
        agentAudioPlaybackEndTimeRef.current = null;
        lastSpeakerRef.current = 'agent';
      }

      currentUserText.current = '';
      currentModelText.current = '';
      currentUserAudioChunks.current = [];
      currentAgentAudioChunks.current = [];
      selfInterruptionDetectedRef.current = false;
      isAgentSpeakingRef.current = false;
    };

    const handleGrounding = (metadata: any) => {
      addPerfLog({
        turn: turnCounterRef.current,
        event: 'Agent Response: Grounding Metadata Received',
        details: metadata,
      });
      hasSearchedThisTurnRef.current = true;
    };

    const handleInterrupted = () => {
      stopAudio();
      flushModelTextBuffer(true);
    };

    client.on('userAudio', handleUserAudio);
    client.on('audio', handleAgentAudio);
    client.on('toolcall', handleToolCall);
    client.on('inputTranscription', handleInputTranscription);
    client.on('outputTranscription', handleOutputTranscription);
    client.on('turncomplete', handleTurnComplete);
    client.on('interrupted', handleInterrupted);
    client.on('grounding', handleGrounding);

    return () => {
      client.off('userAudio', handleUserAudio);
      client.off('audio', handleAgentAudio);
      client.off('toolcall', handleToolCall);
      client.off('inputTranscription', handleInputTranscription);
      client.off('outputTranscription', handleOutputTranscription);
      client.off('turncomplete', handleTurnComplete);
      client.off('interrupted', handleInterrupted);
      client.off('grounding', handleGrounding);
    };
  }, [
    client,
    stopAudio,
    user.name,
    current.name,
    incrementChangeCount,
    setAgentState,
    documentContent,
    addPerfLog,
    suppressStaleAgentResponses,
    outputModality,
    setSpeechBubbleText,
  ]);

  const handleClear = () => {
    setDocumentContent(PLACEHOLDER_DOC);
    setDocumentHistory([]);
    setRedoHistory([]);
    setTranscript([]);
    setCorrectedTranscript('');
    setAccurateTranscript('');
  };

  const handleGetMinutes = async () => {
    const aiClient = getAiClient();
    if (!aiClient) return;
    setIsCorrectingTranscript(true);
    setCorrectedTranscript('Correcting and summarizing...');

    try {
      const fullTranscript = transcript
        .map(t => `${t.speaker}: ${t.text}`)
        .join('\n');
      const prompt = `Please correct any transcription errors in the following conversation and format it as clean, readable meeting minutes. Use markdown for formatting. Transcript:\n\n${fullTranscript}`;
      const response = await aiClient.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      const corrected = response.text;
      setCorrectedTranscript(corrected);
    } catch (error) {
      console.error('Error correcting transcript:', error);
      setCorrectedTranscript('Sorry, an error occurred while processing the transcript.');
    } finally {
      setIsCorrectingTranscript(false);
    }
  };

  const handleGetAccurateTranscript = async () => {
    const aiClient = getAiClient();
    if (!aiClient || audioLog.length === 0) {
      toast.error("No audio data available to transcribe. Please ensure you've spoken with your co-founder first.");
      return;
    }
    setIsGeneratingAccurateTranscript(true);
    
    try {
      const targetSampleRate = 16000;
      const audioBuffers: Int16Array[] = [];
      const logEntries: string[] = [];

      for (let i = 0; i < audioLog.length; i++) {
        const entry = audioLog[i];
        const arrayBuffer = await entry.blob.arrayBuffer();
        let int16Data = new Int16Array(arrayBuffer);
        
        // Resample agent audio (24k) to 16k if needed
        const isAgent = entry.speaker === current.name;
        if (isAgent) {
          const resampled = new Int16Array(Math.floor(int16Data.length * (16000 / 24000)));
          for (let j = 0; j < resampled.length; j++) {
            resampled[j] = int16Data[Math.floor(j * 1.5)];
          }
          int16Data = resampled;
        }
        
        audioBuffers.push(int16Data);
        logEntries.push(`Segment ${i + 1}: Speaker=${entry.speaker}, Timestamp=${entry.timestamp.toLocaleTimeString()}`);
      }

      // Combine all buffers into one large audio segment
      const totalLength = audioBuffers.reduce((acc, buf) => acc + buf.length, 0);
      const combinedInt16 = new Int16Array(totalLength);
      let offset = 0;
      for (const buf of audioBuffers) {
        combinedInt16.set(buf, offset);
        offset += buf.length;
      }

      // Create a single WAV file from the combined audio
      const wavHeader = createWavHeader(combinedInt16.byteLength, targetSampleRate);
      const wavBlob = new Blob([wavHeader, combinedInt16], { type: 'audio/wav' });
      const base64Audio = await blobToBase64(wavBlob);

      const speakerTimeLog = logEntries.join('\n');
      
      const response = await aiClient.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: base64Audio,
                  mimeType: 'audio/wav'
                }
              },
              {
                text: `
                  TASK: Provide a VERBATIM, HIGHLY ACCURATE transcript of the combined audio provided.
                  
                  SPEAKER-TIME LOG (for reference):
                  ${speakerTimeLog}
                  
                  STRICT RULES:
                  1. DO NOT summarize.
                  2. DO NOT hallucinate or invent dialogue.
                  3. Use the SPEAKER-TIME LOG to help identify who is speaking at different times in the audio.
                  4. Identify speakers as "${user.name || 'User'}" and "${current.name}".
                  5. Format the output as a clean dialogue using Markdown.
                  6. Use DOUBLE LINE BREAKS between each speaker turn to ensure clear separation.
                  7. Format each turn exactly as: **Speaker Name**: Dialogue text here...
                  
                  The audio is a continuous conversation. Transcribe it accurately.
                `.trim()
              }
            ]
          }
        ],
        config: {
          systemInstruction: "You are a professional verbatim transcriptionist. You use the provided speaker-time log to accurately attribute speech in the combined audio file. You never invent content not present in the audio.",
          temperature: 0.1,
        }
      });
      
      if (!response.text) {
        throw new Error("No text returned from model");
      }
      
      setAccurateTranscript(response.text);
      toast.success('Accurate transcript generated successfully!');
    } catch (error) {
      console.error('Error generating accurate transcript:', error);
      toast.error('Failed to generate accurate transcript. The audio might be too long or there was a connection issue.');
    } finally {
      setIsGeneratingAccurateTranscript(false);
    }
  };

  const handleReplaceTranscript = () => {
    if (!accurateTranscript) return;
    
    // Simple parsing logic for the formatted Markdown
    // Expected format: **Speaker**: Text
    const lines = accurateTranscript.split('\n').filter(l => l.trim() !== '');
    const newTranscript: TranscriptEntry[] = [];
    
    lines.forEach(line => {
      const match = line.match(/\*\*(.*?)\*\*:\s*(.*)/);
      if (match) {
        newTranscript.push({
          speaker: match[1],
          text: match[2].trim()
        });
      }
    });
    
    if (newTranscript.length > 0) {
      setTranscript(newTranscript);
      setAccurateTranscript('');
      toast.success('Transcript replaced successfully!');
    } else {
      toast.error('Could not parse the accurate transcript structure.');
    }
  };

  useEffect(() => {
    if (mainTab === 'minutes' && transcript.length > 0) {
      handleGetMinutes();
    }
  }, [mainTab, transcript]);

  const handleCopyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopyButtonText('Copied!');
      setTimeout(() => setCopyButtonText('Copy'), 2000);
    });
  };

  const handleDownloadPDF = async (ref: React.RefObject<HTMLDivElement>, defaultFilename: string) => {
    if (!ref.current) return;

    setPdfStatus('preparing');
    const element = ref.current;

    // Phase 2: Snapshot Setup
    const originalStyle = {
      height: element.style.height,
      overflow: element.style.overflow,
      maxHeight: element.style.maxHeight,
      backgroundColor: element.style.backgroundColor,
      color: element.style.color,
      position: element.style.position,
    };

    // Expansion & Theme Normalization
    element.style.height = 'auto';
    element.style.overflow = 'visible';
    element.style.maxHeight = 'none';
    element.style.backgroundColor = '#ffffff';
    element.style.color = '#000000';
    element.style.position = 'relative';
    
    // Explicitly set theme variables for html-to-image
    element.style.setProperty('--theme-bg', '#ffffff');
    element.style.setProperty('--theme-text', '#000000');

    // Handle cross-origin iframes (Maps)
    const iframes = element.querySelectorAll('iframe');
    const iframePlaceholders: { iframe: HTMLIFrameElement; placeholder: HTMLDivElement }[] = [];

    iframes.forEach((iframe) => {
      const parentWrapper = iframe.closest('.map-wrapper') as HTMLElement;
      if (parentWrapper) {
        parentWrapper.style.border = 'none';
      }

      const src = iframe.getAttribute('src') || '';
      let locationName = 'Map Location';
      
      // Try to extract location name from q= parameter
      try {
        const url = new URL(src);
        const q = url.searchParams.get('q');
        if (q) locationName = decodeURIComponent(q);
      } catch (e) {
        // Fallback to generic name
      }

      const placeholder = document.createElement('div');
      placeholder.className = 'map-pdf-placeholder';
      placeholder.style.position = 'absolute';
      placeholder.style.top = '0';
      placeholder.style.left = '0';
      placeholder.style.width = '100%';
      placeholder.style.height = '100%';
      placeholder.style.backgroundColor = '#f1f3f4';
      placeholder.style.border = '1px solid #dadce0';
      placeholder.style.borderRadius = '8px';
      placeholder.style.display = 'flex';
      placeholder.style.flexDirection = 'column';
      placeholder.style.alignItems = 'center';
      placeholder.style.justifyContent = 'center';
      placeholder.style.gap = '12px';
      placeholder.style.color = '#3c4043';
      placeholder.style.fontFamily = 'var(--font-document)';
      placeholder.style.zIndex = '1';

      placeholder.innerHTML = `
        <span class="material-symbols-outlined" style="font-size: 48px; color: #ea4335;">location_on</span>
        <div style="font-weight: 500; font-size: 16px; text-align: center; padding: 0 20px;">${locationName}</div>
        <div style="font-size: 12px; color: #70757a;">Interactive Map (See Online Version)</div>
      `;

      iframe.style.display = 'none';
      iframe.parentNode?.insertBefore(placeholder, iframe);
      iframePlaceholders.push({ iframe, placeholder });
    });

    // Wait for layout reflow
    await new Promise(resolve => setTimeout(resolve, 300));

    setPdfStatus('generating');

    try {
      // Calculate full dimensions after expansion
      const width = element.scrollWidth;
      const height = element.scrollHeight;

      const dataUrl = await htmlToImage.toJpeg(element, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
        width: width,
        height: height,
        filter: (node) => {
          if (node instanceof HTMLElement) {
            return !node.classList.contains('exclude-from-pdf');
          }
          return true;
        },
      });

      const img = new Image();
      img.src = dataUrl;
      await new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve; // Continue anyway
      });

      const pdf = new jsPDF({
        orientation: width > height ? 'l' : 'p',
        unit: 'px',
        format: [width, height],
      });

      pdf.addImage(dataUrl, 'JPEG', 0, 0, width, height);
      pdf.save(`${defaultFilename.replace(/\s/g, '_')}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      // Restore original styles
      element.style.height = originalStyle.height;
      element.style.overflow = originalStyle.overflow;
      element.style.maxHeight = originalStyle.maxHeight;
      element.style.backgroundColor = originalStyle.backgroundColor;
      element.style.color = originalStyle.color;
      element.style.position = originalStyle.position;
      element.style.removeProperty('--theme-bg');
      element.style.removeProperty('--theme-text');
      
      // Cleanup iframe placeholders
      iframePlaceholders.forEach(({ iframe, placeholder }) => {
        iframe.style.display = '';
        const parentWrapper = iframe.closest('.map-wrapper') as HTMLElement;
        if (parentWrapper) {
          parentWrapper.style.border = '';
        }
        placeholder.remove();
      });
      
      setPdfStatus('idle');
    }
  };
  
  const getRenderedHtmlString = (
    docContent: string,
    currentInserts: Insert[],
  ): string => {
    if (!docContent || docContent === PLACEHOLDER_DOC) return '';
    
    // "Smart" Content Splitter for export
    let processedContent = docContent;
    const tagRegex = /\[(illustration|graph)\s/g;
    let match;
    const foundTags: { start: number; end: number; type: string; fullMatch: string }[] = [];

    while ((match = tagRegex.exec(docContent)) !== null) {
      let inQuotes = false;
      let quoteChar = '';
      let tagEnd = -1;
      const type = match[1];

      for (let i = match.index; i < docContent.length; i++) {
        const char = docContent[i];
        if ((char === '"' || char === "'") && (i === 0 || docContent[i-1] !== '\\')) {
          if (!inQuotes) {
            inQuotes = true;
            quoteChar = char;
          } else if (char === quoteChar) {
            inQuotes = false;
          }
        }
        if (char === ']' && !inQuotes) {
          tagEnd = i;
          break;
        }
      }

      if (tagEnd !== -1) {
        const fullMatch = docContent.substring(match.index, tagEnd + 1);
        foundTags.push({ start: match.index, end: tagEnd, type, fullMatch });
      }
    }

    // Replace tags with placeholders from back to front
    for (let i = foundTags.length - 1; i >= 0; i--) {
      const { start, end, type, fullMatch } = foundTags[i];
      
      const getAttr = (tag: string, attr: string) => {
        const regex = new RegExp(`${attr}\\s*=\\s*(["'])((?:\\\\\\1|.)*?)\\1`);
        const match = tag.match(regex);
        return match ? match[2] : null;
      };

      const id = getAttr(fullMatch, 'id');
      const width = getAttr(fullMatch, 'width');
      let replacement = fullMatch;

      if (id) {
        if (type === 'illustration') {
          const insert = currentInserts.find(ins => ins.id === id);
          if (insert?.status === 'done') {
            const style = width
              ? `width: ${width}; max-width: 100%; display: block; margin: 0 auto;`
              : `max-width: 100%; display: block; margin: 0 auto;`;
            replacement = `<img src="data:image/png;base64,${insert.data}" alt="${insert.prompt}" style="${style}" />`;
          } else {
            replacement = `<!-- Image placeholder: ${id} -->`;
          }
        } else if (type === 'graph') {
          replacement = `<div style="padding: 20px; border: 1px dashed #ccc; text-align: center; background: #f9f9f9; border-radius: 8px;">
            <strong>Interactive Graph: ${id}</strong><br/>
            (View in SoloScribe app for interactive features)
          </div>`;
        }
      } else if (type === 'graph') {
        // Handle case where id is missing but it's a graph
        replacement = `<div style="padding: 20px; border: 1px dashed #ccc; text-align: center; background: #f9f9f9; border-radius: 8px;">
            <strong>Interactive Graph</strong><br/>
            (View in SoloScribe app for interactive features)
          </div>`;
      }

      processedContent = processedContent.substring(0, start) + replacement + processedContent.substring(end + 1);
    }

    const cleanedWhitespace = stripLeadingWhitespace(processedContent);
    const { protectedText, latexMap } = protectLatex(cleanedWhitespace);
    const rawHtml = marked.parse(protectedText, {
      async: false,
      breaks: true,
    }) as string;
    return restoreLatex(rawHtml, latexMap);
  };

  const toggleAudioPlayback = (index: number, blob: Blob) => {
    if (playingAudio && playingAudio.index === index) {
      playingAudio.element.pause();
      URL.revokeObjectURL(playingAudio.url);
      setPlayingAudio(null);
    } else {
      if (playingAudio) {
        playingAudio.element.pause();
        URL.revokeObjectURL(playingAudio.url);
      }
      const url = URL.createObjectURL(encodeWAV(blob as any, 24000));
      const audio = new Audio(url);
      audio.onended = () => setPlayingAudio(null);
      audio.play();
      setPlayingAudio({ index, element: audio, url });
    }
  };

  const handleStrategicReview = async () => {
    if (!documentContent.trim()) {
      toast.error('Please add some content to your document first.');
      return;
    }

    setIsThinking(true);
    setMainTab('chatbot');
    toast.info('AI Co-founder is reviewing your document...');

    try {
      const context = `User Name: ${user.name || 'User'}
User Background: ${user.info || 'None'}
Current Topic: ${user.topic || 'Not specified'}
Current Document Content:
---
${documentContent}
---`;

      const prompt = `${context}\n\nAct as a strategic AI co-founder. Review the current document content provided above. 
Identify potential weaknesses, missing elements, or strategic opportunities. 
Provide 3-5 actionable suggestions to improve the document and the overall business strategy. 
Format your response in Markdown.`;

      const review = await thinkDeeply(prompt);
      setTranscript(prev => [...prev, { speaker: 'Agent', text: review }]);
      toast.success('Strategic review complete! Check the Chatbot tab.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to perform strategic review.');
    } finally {
      setIsThinking(false);
    }
  };

  const handleSaveAudioLog = async () => {
    const blobs = audioLog.map(entry => entry.blob);
    const combinedBlob = new Blob(blobs);
    const arrayBuffer = await combinedBlob.arrayBuffer();
    const wavBlob = encodeWAV(arrayBuffer, 24000);
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soloscribe_audio_log_${new Date().toISOString()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([documentContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProjectId}_${new Date().toISOString()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Markdown file downloaded.');
  };

  return (
    <div className="keynote-companion paper-graph">
      <div className="document-view-container">
        {mainTab === 'document' && (
          <div style={{ display: 'flex', flexDirection: 'row', height: '100%', width: '100%' }}>
            <div className="document-editor-container" style={{ flex: 1, overflow: 'hidden' }}>
              {documentTab === 'editor' && (
              <>
                <div className="document-toolbar">
                  {isMobile ? (
                    <div className="mobile-toolbar-container">
                      <span className="mobile-toolbar-label">Actions</span>
                      <button
                        className="mobile-menu-trigger brutalist-button"
                        onClick={() => setShowMobileToolbar(!showMobileToolbar)}
                        title="Document Actions"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {showMobileToolbar && (
                        <>
                          <div 
                            className="mobile-menu-overlay" 
                            onClick={() => setShowMobileToolbar(false)} 
                          />
                          <div className="mobile-menu-dropdown brutalist-card">
                            <button className="mobile-menu-item" onClick={() => { handleUndo(); setShowMobileToolbar(false); }} disabled={documentHistory.length === 0}>
                              <Undo2 size={16} /> Undo
                            </button>
                            <button className="mobile-menu-item" onClick={() => { handleRedo(); setShowMobileToolbar(false); }} disabled={redoHistory.length === 0}>
                              <Redo2 size={16} /> Redo
                            </button>
                            <button className="mobile-menu-item" onClick={() => { handleClear(); setShowMobileToolbar(false); }}>
                              <Eraser size={16} /> Clear
                            </button>
                            <div className="mobile-menu-divider"></div>
                            <button className="mobile-menu-item" onClick={() => { handleSlashCommand('h1'); setShowMobileToolbar(false); }}>
                              <Heading1 size={16} /> H1
                            </button>
                            <button className="mobile-menu-item" onClick={() => { handleSlashCommand('h2'); setShowMobileToolbar(false); }}>
                              <Heading2 size={16} /> H2
                            </button>
                            <button className="mobile-menu-item" onClick={() => { handleSlashCommand('list'); setShowMobileToolbar(false); }}>
                              <List size={16} /> List
                            </button>
                            <button className="mobile-menu-item" onClick={() => { handleSlashCommand('bold'); setShowMobileToolbar(false); }}>
                              <Bold size={16} /> Bold
                            </button>
                            <button className="mobile-menu-item" onClick={() => { handleSlashCommand('collapse'); setShowMobileToolbar(false); }}>
                              <ChevronDown size={16} /> Collapsible
                            </button>
                            <div className="mobile-menu-divider"></div>
                            <button className="mobile-menu-item" onClick={() => { handleSaveToCloud(); setShowMobileToolbar(false); }} disabled={isSavingToCloud}>
                              <CloudUpload size={16} /> {isSavingToCloud ? 'Saving...' : 'Save to Cloud'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="toolbar-group">
                        <Tooltip content="Undo" position="bottom">
                          <button className="brutalist-button-sm" onClick={handleUndo} disabled={documentHistory.length === 0}>
                            <Undo2 size={14} />
                          </button>
                        </Tooltip>
                        <Tooltip content="Redo" position="bottom">
                          <button className="brutalist-button-sm" onClick={handleRedo} disabled={redoHistory.length === 0}>
                            <Redo2 size={14} />
                          </button>
                        </Tooltip>
                        <Tooltip content="Clear Document" position="bottom">
                          <button className="brutalist-button-sm" onClick={handleClear}>
                            <Eraser size={14} />
                          </button>
                        </Tooltip>
                      </div>

                      <div className="toolbar-divider"></div>

                      <div className="toolbar-group">
                        <Tooltip content="Heading 1" position="bottom">
                          <button className="brutalist-button-sm" onClick={() => handleSlashCommand('h1')}>
                            <Heading1 size={14} />
                          </button>
                        </Tooltip>
                        <Tooltip content="Heading 2" position="bottom">
                          <button className="brutalist-button-sm" onClick={() => handleSlashCommand('h2')}>
                            <Heading2 size={14} />
                          </button>
                        </Tooltip>
                        <Tooltip content="Bullet List" position="bottom">
                          <button className="brutalist-button-sm" onClick={() => handleSlashCommand('list')}>
                            <List size={14} />
                          </button>
                        </Tooltip>
                        <Tooltip content="Bold" position="bottom">
                          <button className="brutalist-button-sm" onClick={() => handleSlashCommand('bold')}>
                            <Bold size={14} />
                          </button>
                        </Tooltip>
                        <Tooltip content="Collapsible Section" position="bottom">
                          <button className="brutalist-button-sm" onClick={() => handleSlashCommand('collapse')}>
                            <ChevronDown size={14} />
                          </button>
                        </Tooltip>
                      </div>

                      <div className="toolbar-divider"></div>

                      <div className="toolbar-group">
                        <Tooltip content="Get AI Strategic Review" position="bottom">
                          <button 
                            className="brutalist-button-sm ai-button"
                            onClick={handleStrategicReview} 
                          >
                            <Sparkles size={14} />
                            <span>Strategic Review</span>
                          </button>
                        </Tooltip>
                        
                        <Tooltip content="Version History" position="bottom">
                          <button 
                            className="brutalist-button-sm"
                            onClick={() => {
                              fetchVersions();
                              setShowHistoryModal(true);
                            }}
                          >
                            <History size={14} />
                            <span>History</span>
                          </button>
                        </Tooltip>

                        <Tooltip content="Document Templates" position="bottom">
                          <button 
                            className="brutalist-button-sm"
                            onClick={() => setShowTemplatesModal(true)}
                          >
                            <FileText size={14} />
                            <span>Templates</span>
                          </button>
                        </Tooltip>

                        <Tooltip content="Project Dashboard" position="bottom">
                          <button 
                            className="brutalist-button-sm"
                            onClick={() => {
                              fetchProjects();
                              setShowDashboardModal(true);
                            }}
                          >
                            <LayoutDashboard size={14} />
                            <span>Dashboard</span>
                          </button>
                        </Tooltip>
                      </div>

                      <div className="toolbar-divider"></div>

                      <div className="toolbar-group">
                        <Tooltip content="Export as Markdown" position="bottom">
                          <button 
                            className="brutalist-button-sm"
                            onClick={handleDownloadMarkdown}
                          >
                            <Download size={14} />
                            <span>Export MD</span>
                          </button>
                        </Tooltip>

                        <Tooltip content="Save to Cloud" position="bottom">
                          <button 
                            className="brutalist-button-sm"
                            onClick={handleSaveToCloud} 
                            disabled={isSavingToCloud}
                          >
                            <CloudUpload size={14} />
                            <span>{isSavingToCloud ? 'Saving...' : 'Save to Cloud'}</span>
                          </button>
                        </Tooltip>
                      </div>

                      <div className="toolbar-group ml-auto">
                        {lastAutoSavedAt && (
                          <span className="auto-save-status">
                            Saved: {lastAutoSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        
                        <button 
                          className={c("brutalist-button-sm", { "active": showCopilot })}
                          onClick={() => setShowCopilot(!showCopilot)} 
                          title={showCopilot ? 'Hide Copilot' : 'Show AI Copilot'}
                        >
                          <Lightbulb size={14} />
                          <span>Copilot</span>
                        </button>

                        <div className="font-selector-container">
                          <TypeIcon size={14} className="font-icon" />
                          <select
                            className="font-selector-brutalist"
                            value={font}
                            onChange={e => setFont(e.target.value)}
                            title="Select document font"
                          >
                            {FONT_OPTIONS.map(fontName => (
                              <option key={fontName} value={fontName}>
                                {fontName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="document-editor-container">
                  <MdEditor
                    modelValue={documentContent}
                    onChange={handleDocumentChange}
                    theme="dark"
                    language="en-US"
                    toolbars={[
                      'bold',
                      'underline',
                      'italic',
                      '-',
                      'title',
                      'strikeThrough',
                      'sub',
                      'sup',
                      'quote',
                      'unorderedList',
                      'orderedList',
                      'task',
                      '-',
                      'codeRow',
                      'code',
                      'link',
                      'image',
                      'table',
                      'mermaid',
                      'katex',
                      '-',
                      'revoke',
                      'next',
                      'save',
                      '=',
                      'pageFullscreen',
                      'fullscreen',
                      'preview',
                      'htmlPreview',
                      'catalog',
                    ]}
                    style={{ 
                      height: '100%', 
                      backgroundColor: 'transparent',
                      fontFamily: font 
                    }}
                    editorId="soloscribe-editor"
                    placeholder="Start writing your solo venture documentation..."
                    noUploadImg
                    onSave={() => handleSaveToCloud()}
                  />
                </div>
              </>
            )}

            {documentTab === 'rendered' && (
              <>
                {documentContent !== PLACEHOLDER_DOC && (
                  <div className="document-actions exclude-from-pdf">
                    <Tooltip content="Share Project" position="bottom">
                      <button
                        className="brutalist-button-sm share-button"
                        onClick={() => setShowShareModal(true)}
                      >
                        <Share2 size={14} />
                        <span>Share</span>
                      </button>
                    </Tooltip>
                    <Tooltip content="Download PDF" position="bottom">
                      <button
                        className="brutalist-button-sm"
                        onClick={() => handleDownloadPDF(renderedViewRef, user.topic || 'soloscribe-document')}
                        disabled={pdfStatus !== 'idle'}
                      >
                        <Download size={14} />
                        <span>PDF</span>
                      </button>
                    </Tooltip>
                    <Tooltip content="Copy to clipboard" position="bottom">
                      <button
                        className="brutalist-button-sm"
                        onClick={() => handleCopyToClipboard(documentContent)}
                      >
                        <Copy size={14} />
                        <span>Copy</span>
                      </button>
                    </Tooltip>
                  </div>
                )}
                <div
                  ref={renderedViewRef}
                  className={c('document-content prose-view', {
                    'placeholder-active': documentContent === PLACEHOLDER_DOC,
                  })}
                  onMouseDown={handleRenderedContentMouseDown}
                >
                  {documentContent === PLACEHOLDER_DOC ? (
                    <WelcomePlaceholder />
                  ) : (
                    <DocumentRenderer
                      content={documentContent}
                      inserts={inserts}
                      onElementResize={handleElementResize}
                    />
                  )}
                </div>
              </>
            )}
            {showCopilot && <CopilotSidebar />}
            </div>
          </div>
        )}

        {mainTab === 'transcript' && (
          <div className="transcript-content p-6">
            <div className="flex gap-4 mb-6">
              <button 
                className="brutalist-button flex items-center gap-2 px-4 py-2 text-xs"
                onClick={handleGetAccurateTranscript}
                disabled={isGeneratingAccurateTranscript || audioLog.length === 0}
                title="Generate a more accurate transcript from audio"
              >
                <Wand2 size={16} />
                <span>{isGeneratingAccurateTranscript ? 'ANALYZING_AUDIO...' : 'ACCURATE_TRANSCRIPT'}</span>
              </button>
              {accurateTranscript && (
                <button 
                  className="brutalist-button px-4 py-2 text-xs"
                  onClick={() => handleCopyToClipboard(accurateTranscript)}
                  title="Copy accurate transcript"
                >
                  <Copy size={16} />
                </button>
              )}
            </div>

            <div className="border-4 border-black p-8 bg-black/40 overflow-y-auto max-h-[600px]">
              {isGeneratingAccurateTranscript ? (
                <MinutesLoadingAnimation />
              ) : accurateTranscript ? (
                <div className="accurate-transcript-view prose-view">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-theme-accent/20">
                    <h4 className="font-display text-xs text-theme-accent uppercase tracking-widest">ACCURATE_VERSION_SYNTHESIS</h4>
                    <button 
                      className="brutalist-button px-3 py-1.5 text-[10px]"
                      onClick={handleReplaceTranscript}
                    >
                      <Clock size={14} className="inline mr-1" />
                      REPLACE_LIVE_STREAM
                    </button>
                  </div>
                  <div className="accurate-content-body" dangerouslySetInnerHTML={{ __html: marked.parse(accurateTranscript) }} />
                  <button 
                    className="text-[10px] font-mono text-theme-accent mt-8 hover:text-white transition-all flex items-center gap-1 uppercase tracking-tighter"
                    onClick={() => setAccurateTranscript('')}
                  >
                    <X size={12} />
                    BACK_TO_LIVE_TRANSCRIPT
                  </button>
                </div>
              ) : transcript.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {transcript.map((entry, index) => (
                    <div key={index} className="flex flex-col gap-1">
                      <div className="font-mono text-[10px] uppercase text-theme-accent opacity-70">{entry.speaker}</div>
                      <div className="font-mono text-sm leading-relaxed">{entry.text}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-30 font-mono text-sm gap-4 py-20">
                  <MessageSquare size={48} />
                  <p>NO_TRANSCRIPT_DETECTED.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {mainTab === 'minutes' && (
          <div className="minutes-view p-6">
            <div className="flex gap-4 mb-6">
              <Tooltip content="Download PDF" position="bottom">
                <button
                  className="brutalist-button flex items-center gap-2 px-4 py-2 text-xs"
                  onClick={() => handleDownloadPDF(minutesViewRef, `${user.topic || 'soloscribe'}_minutes`)}
                  disabled={pdfStatus !== 'idle'}
                >
                  <Download size={16} />
                  DOWNLOAD_PDF
                </button>
              </Tooltip>
              <Tooltip content="Copy to clipboard" position="bottom">
                <button
                  className="brutalist-button px-4 py-2 text-xs"
                  onClick={() => handleCopyToClipboard(correctedTranscript)}
                >
                  <Copy size={16} />
                </button>
              </Tooltip>
            </div>
            <div ref={minutesViewRef} className="document-content prose-view border-4 border-black p-8 bg-black/40">
              {isCorrectingTranscript ? (
                <MinutesLoadingAnimation />
              ) : (
                <div
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(correctedTranscript, { breaks: true }),
                  }}
                />
              )}
            </div>
          </div>
        )}

        {mainTab === 'audio-log' && (
          <div className="audio-log-view">
            <div className="audio-log-controls mb-6">
               <button 
                 onClick={handleSaveAudioLog} 
                 disabled={audioLog.length === 0}
                 className="brutalist-button flex items-center gap-2 px-4 py-2 text-xs"
               >
                  <Save size={16} />
                  SAVE_AUDIO_LOG
                </button>
            </div>
            <div className="audio-log-content border-4 border-black bg-black/40 overflow-hidden">
              <div className="audio-log-header grid grid-cols-4 gap-4 p-4 border-b-2 border-theme-accent font-mono text-[10px] uppercase opacity-50">
                <div>TIMESTAMP</div>
                <div>SPEAKER</div>
                <div>DURATION</div>
                <div className="text-right">PLAYBACK</div>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {audioLog.length > 0 ? (
                  audioLog.map((entry, index) => (
                    <div key={index} className="audio-log-entry grid grid-cols-4 gap-4 p-4 border-b border-white/5 items-center hover:bg-white/5 transition-colors">
                      <div className="font-mono text-xs">{entry.timestamp.toLocaleTimeString()}</div>
                      <div className="font-mono text-xs text-theme-accent">{entry.speaker}</div>
                      <div className="font-mono text-xs opacity-70">{getAudioDuration(entry.blob)}</div>
                      <div className="flex justify-end">
                        <button 
                          className="brutalist-button p-2" 
                          onClick={() => toggleAudioPlayback(index, entry.blob)}
                        >
                          {playingAudio?.index === index ? (
                            <PauseCircle size={18} />
                          ) : (
                            <PlayCircle size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="audio-log-empty p-10 text-center opacity-50 font-mono text-sm">
                    <p>NO_AUDIO_RECORDED_IN_THIS_SESSION. INITIALIZE_STREAM.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {mainTab === 'chatbot' && (
          <ChatbotTab />
        )}

        {mainTab === 'tools' && (
          <AIToolsTab />
        )}

        {mainTab === 'validation' && (
          <ValidationEngineTab />
        )}

        {mainTab === 'projections' && (
          <ProjectionsTab />
        )}
        
        {mainTab === 'roadmap' && (
          <RoadmapTab />
        )}

        {mainTab === 'tasks' && (
          <TasksTab />
        )}

        {mainTab === 'marketing' && (
          <MarketingTab />
        )}

        {mainTab === 'search' && (
          <SearchTab />
        )}
      </div>

      {showHistoryModal && (
        <Modal onClose={handleCloseHistoryModal} title="VERSION_HISTORY_LOG">
          <div className="modalContent">
            <div className="flex justify-between items-center mb-6">
              <div className="grid-item-meta">DOCUMENT_SNAPSHOT_REPOSITORY</div>
              <button 
                onClick={() => handleCreateVersion()}
                className="brutalist-button px-4 py-2 text-xs"
              >
                TAKE_SNAPSHOT
              </button>
            </div>

            {isLoadingVersions ? (
              <div className="flex justify-center p-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent"></div>
              </div>
            ) : projectVersions.length === 0 ? (
              <div className="text-center p-10 opacity-50 font-mono text-sm">
                NO_VERSIONS_FOUND. INITIALIZE_SNAPSHOT_STREAM.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {projectVersions.map((version) => (
                  <div 
                    key={version.id}
                    className={c("grid-item", confirmingVersionId === version.id && "border-theme-accent")}
                    onClick={() => {
                      if (confirmingVersionId === version.id) {
                        handleRestoreVersion(version);
                        setConfirmingVersionId(null);
                      } else {
                        setConfirmingVersionId(version.id);
                      }
                    }}
                  >
                    <div className="flex justify-between items-center w-full">
                      <div>
                        <div className="grid-item-title">
                          {confirmingVersionId === version.id ? "CONFIRM_RESTORE?" : (version.label || `SNAPSHOT_${version.id.slice(0, 8)}`)}
                        </div>
                        <div className="grid-item-meta">
                          {confirmingVersionId === version.id ? "THIS_WILL_OVERWRITE_CURRENT_STATE" : `SYNC_TIME: ${version.createdAt?.toDate?.().toLocaleString() || 'TIMESTAMP_PENDING'}`}
                        </div>
                      </div>
                      <button className={c("brutalist-button px-3 py-1 text-xs", confirmingVersionId === version.id && "bg-theme-accent text-black")}>
                        {confirmingVersionId === version.id ? "YES_RESTORE" : "RESTORE"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {showTemplatesModal && (
        <Modal onClose={() => setShowTemplatesModal(false)} title="DOCUMENT_TEMPLATES">
          <div className="modalContent">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DOCUMENT_TEMPLATES.map((template) => (
                <div 
                  key={template.id}
                  className="grid-item"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="grid-item-title">{template.name}</div>
                  <div className="grid-item-desc">
                    {template.description}
                  </div>
                  <div className="grid-item-meta">
                    ACTION: CLICK_TO_APPLY
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {showDashboardModal && (
        <Modal onClose={() => setShowDashboardModal(false)} title="PROJECT_DASHBOARD">
          <div className="modalContent">
            <div className="flex justify-between items-center mb-6">
              <div className="grid-item-meta">WORKSPACE_MANAGEMENT_INTERFACE</div>
              <button 
                onClick={handleCreateNewProject}
                className="brutalist-button px-4 py-2 text-xs"
              >
                NEW_PROJECT
              </button>
            </div>

            {isLoadingProjects ? (
              <div className="flex justify-center p-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent"></div>
              </div>
            ) : userProjects.length === 0 ? (
              <div className="text-center p-10 opacity-50 font-mono text-sm">
                NO_PROJECTS_FOUND. INITIALIZE_FIRST_WORKSPACE.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {userProjects.map((project) => (
                  <div 
                    key={project.id}
                    className={c("grid-item", { "border-white": project.id === currentProjectId })}
                    onClick={() => handleSwitchProject(project.id)}
                  >
                    <div className="flex justify-between items-center w-full">
                      <div>
                        <div className={c("grid-item-title", { "text-white": project.id === currentProjectId })}>
                          {project.name}
                          {project.id === currentProjectId && <span className="ml-2 text-[10px] bg-white text-black px-1.5 py-0.5 uppercase">ACTIVE</span>}
                        </div>
                        <div className="grid-item-meta">
                          LAST_SYNC: {project.updatedAt?.toDate().toLocaleString() || 'TIMESTAMP_PENDING'}
                        </div>
                      </div>
                      <button 
                        disabled={project.id === currentProjectId}
                        className={c("brutalist-button px-3 py-1 text-xs", { "opacity-50 cursor-not-allowed": project.id === currentProjectId })}
                      >
                        {project.id === currentProjectId ? 'CURRENT' : 'OPEN'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Slash menu removed */}

      {showChatHistory && (
        <div className="chat-history-sidebar border-l-4 border-black bg-theme-surface shadow-[-8px_0_0_0_#000] z-[2000]">
          <div className="chat-history-header flex justify-between items-center p-6 border-b-4 border-black bg-black">
            <h3 className="font-display text-sm tracking-widest uppercase text-theme-accent">CHAT_HISTORY_STREAM</h3>
            <button 
              className="brutalist-button p-2" 
              onClick={() => setShowChatHistory(false)}
            >
              <X size={18} />
            </button>
          </div>
          <div className="chat-history-messages p-6 flex flex-col gap-6 overflow-y-auto h-[calc(100%-80px)]">
            {transcript.length > 0 ? (
              transcript.map((entry, index) => (
                <div key={index} className={`flex flex-col gap-2 ${entry.speaker === user.name ? 'items-end' : 'items-start'}`}>
                  <div className="font-mono text-[10px] uppercase opacity-50">{entry.speaker}</div>
                  <div className={c(
                    "p-4 border-2 font-mono text-sm max-w-[90%]",
                    entry.speaker === user.name 
                      ? "bg-theme-accent-secondary/10 border-theme-accent-secondary text-white shadow-[4px_4px_0_0_rgba(255,0,255,0.3)]" 
                      : "bg-theme-accent/10 border-theme-accent text-white shadow-[-4px_4px_0_0_rgba(0,243,255,0.3)]"
                  )}>
                    {entry.text}
                  </div>
                </div>
              ))
            ) : (
              <div className="chat-history-empty flex flex-col items-center justify-center h-full opacity-30 font-mono text-sm gap-4">
                <MessageSquare size={48} />
                <p>NO_MESSAGES_DETECTED.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {currentProjectId && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          project={userProjects.find(p => p.id === currentProjectId) || null}
        />
      )}

      {showConfirmReplaceModal && (
        <ConfirmModal 
          title="Replace Document Content?"
          message={`This will replace your current document content with the "${showConfirmReplaceModal.template.name}" template. This action cannot be undone.`}
          onConfirm={() => executeSelectTemplate(showConfirmReplaceModal.template)}
          onCancel={() => setShowConfirmReplaceModal(null)}
          confirmText="Replace Content"
          variant="danger"
        />
      )}

      {showPromptProjectName && (
        <PromptModal 
          title="Save Project"
          message="Enter a name for your project to save it to the cloud."
          defaultValue="My Startup Workspace"
          onConfirm={showPromptProjectName.onConfirm}
          onCancel={() => setShowPromptProjectName(null)}
          confirmText="Save Project"
          placeholder="e.g., My Awesome Startup"
        />
      )}

      {showPromptNewProject && (
        <PromptModal 
          title="New Project"
          message="Enter a name for your new startup project."
          onConfirm={executeCreateNewProject}
          onCancel={() => setShowPromptNewProject(false)}
          confirmText="Create Project"
          placeholder="e.g., Project Phoenix"
        />
      )}
    </div>
  );
}