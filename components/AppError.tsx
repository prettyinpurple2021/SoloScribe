import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  Search, 
  Lock, 
  WifiOff, 
  ArrowLeft, 
  RefreshCcw,
  Ghost
} from 'lucide-react';
import { motion } from 'motion/react';
import BasicFace from './avatar/BasicFace';
import { getFriendlyErrorMessage } from '../firebase';

interface AppErrorProps {
  title?: string;
  message?: string;
  type?: '404' | 'permission' | 'offline' | 'error';
  error?: any;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

export const AppError: React.FC<AppErrorProps> = ({
  title,
  message,
  type = 'error',
  error,
  onRetry,
  showHomeButton = true
}) => {
  const navigate = useNavigate();
  
  // Parse error if it's a Firestore JSON error
  let parsedErrorMessage = message || getFriendlyErrorMessage(error);
  let errorType = type;

  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed.error) {
        const lowerError = parsed.error.toLowerCase();
        if (lowerError.includes('permission-denied')) errorType = 'permission';
        if (lowerError.includes('not-found')) errorType = '404';
        if (lowerError.includes('unavailable')) errorType = 'offline';
        parsedErrorMessage = getFriendlyErrorMessage(new Error(parsed.error));
      }
    } catch (e) {
      // Not a JSON error
    }
  }

  const getIcon = () => {
    switch (errorType) {
      case '404': return <Search size={48} />;
      case 'permission': return <Lock size={48} />;
      case 'offline': return <WifiOff size={48} />;
      default: return <AlertTriangle size={48} />;
    }
  };

  const getMascotPhrase = () => {
    switch (errorType) {
      case '404': 
        return [
          "I looked everywhere, even under my hat!",
          "It's not here. Did it grow legs and walk away?",
          "Error 404: Reality not found.",
          "This page has entered the witness protection program."
        ][Math.floor(Math.random() * 4)];
      case 'permission':
        return [
          "Hey! Who said you could go in there?",
          "That's a strictly 'No InkAllowed' zone.",
          "Access denied. Maybe try a secret handshake?",
          "Internal protocol 7-B: You're not on the list."
        ][Math.floor(Math.random() * 4)];
      case 'offline':
        return [
          "The internet went to get some coffee.",
          "I'm feeling a bit disconnected. Are you?",
          "Signal lost! Paging all satellites...",
          "Did someone trip over the router cable?"
        ][Math.floor(Math.random() * 4)];
      default:
        return [
          "Oops, I think I spilled some ink on the logic gate.",
          "Something broke, but I'm looking cute anyway, right?",
          "The gears are jamming. Give it a kick?",
          "I didn't do it! I swear!"
        ][Math.floor(Math.random() * 4)];
    }
  };

  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  return (
    <div className="fullscreen-error animate-fade-in" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--theme-bg)',
      color: 'var(--theme-text)',
      padding: '40px',
      textAlign: 'center'
    }}>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: '500px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Mascot Integration */}
        <div style={{ position: 'relative', marginBottom: '40px' }}>
          <div style={{
            width: '120px',
            height: '120px',
            backgroundColor: 'var(--theme-surface)',
            border: '4px solid var(--line-color)',
            borderRadius: '0', // Brutalist style
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '8px 8px 0px var(--line-color)',
            position: 'relative'
          }}>
            <BasicFace 
              canvasRef={canvasRef}
              radius={50}
              color="var(--theme-accent)"
              isTalking={false}
              volumeRef={{ current: 0 }}
              agentId="inklo-error"
            />
          </div>
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              position: 'absolute',
              top: '-60px',
              right: '-120px',
              backgroundColor: 'white',
              color: 'black',
              padding: '12px 16px',
              border: '2px solid black',
              boxShadow: '4px 4px 0px black',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 'bold',
              fontFamily: 'var(--font-mono)',
              width: '180px',
              zIndex: 1
            }}
          >
            {getMascotPhrase()}
            <div style={{
              position: 'absolute',
              bottom: '-10px',
              left: '20px',
              width: '15px',
              height: '15px',
              backgroundColor: 'white',
              borderBottom: '2px solid black',
              borderLeft: '2px solid black',
              transform: 'rotate(-45deg)',
              zIndex: -1
            }} />
          </motion.div>
        </div>

        <div style={{
          color: 'var(--theme-accent)',
          marginBottom: '20px'
        }}>
          {getIcon()}
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '32px',
          marginBottom: '16px',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>
          {title || (errorType === '404' ? 'NOT_FOUND' : 'SYSTEM_MALFUNCTION')}
        </h1>

        <p style={{
          fontSize: '16px',
          lineHeight: '1.6',
          opacity: 0.8,
          marginBottom: '40px',
          fontFamily: 'var(--font-mono)'
        }}>
          {parsedErrorMessage}
        </p>

        <div style={{
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginBottom: '40px'
        }}>
          {onRetry && (
            <button
              onClick={onRetry}
              className="brutalist-button"
              style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <RefreshCcw size={18} /> RETRY_CONNECTION
            </button>
          )}

          {showHomeButton && (
            <Link
              to="/"
              className="brutalist-button-outline"
              style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
            >
              <ArrowLeft size={18} /> RETURN_TO_BASE
            </Link>
          )}
        </div>

        {error && (
          <details className="error-technical-box">
            <summary>
              <Ghost size={14} /> VIEW_TECHNICAL_DIAGNOSTICS
            </summary>
            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', opacity: 0.7 }}>
              {error.stack || JSON.stringify(error, null, 2)}
            </div>
          </details>
        )}
      </motion.div>
    </div>
  );
};
