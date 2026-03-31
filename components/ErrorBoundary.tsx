import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Copy, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, showDetails: false, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleCopy = () => {
    const { error, errorInfo } = this.state;
    const details = `
Error: ${error?.message}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
    `.trim();

    navigator.clipboard.writeText(details).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  private parseErrorMessage = (message: string) => {
    try {
      // Try to parse as FirestoreErrorInfo JSON
      const parsed = JSON.parse(message);
      if (parsed && typeof parsed === 'object' && 'operationType' in parsed) {
        const op = parsed.operationType;
        const path = parsed.path || 'unknown path';
        
        if (parsed.error?.includes('permission-denied')) {
          return {
            title: 'Access Denied',
            description: `You don't have permission to ${op} data at "${path}". Please check your project access or contact the owner.`,
            isFirestore: true
          };
        }
        
        return {
          title: `Database Error (${op})`,
          description: `An error occurred while trying to ${op} data at "${path}": ${parsed.error}`,
          isFirestore: true
        };
      }
    } catch (e) {
      // Not JSON, continue with standard handling
    }

    if (message.includes('network') || message.includes('fetch') || message.includes('offline')) {
      return {
        title: 'Network Connection Issue',
        description: 'It looks like there is a problem with your internet connection or our servers. Please check your connection and try again.',
        isFirestore: false
      };
    }

    return {
      title: 'Unexpected Application Error',
      description: 'SoloScribe encountered an internal error that it couldn\'t recover from.',
      isFirestore: false
    };
  };

  public render() {
    if (this.state.hasError) {
      const { title, description } = this.parseErrorMessage(this.state.error?.message || '');

      return (
        <div className="error-boundary-container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'var(--theme-bg)',
          color: 'var(--theme-text)',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'var(--font-body, sans-serif)'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            padding: '40px',
            backgroundColor: 'var(--theme-surface)',
            border: '2px solid var(--theme-accent)',
            boxShadow: '8px 8px 0px var(--theme-accent)',
            borderRadius: '0px' // Brutalist style
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginBottom: '24px',
              color: 'var(--theme-accent)'
            }}>
              <AlertTriangle size={64} />
            </div>

            <h1 style={{ 
              marginBottom: '16px', 
              color: 'var(--theme-accent)',
              fontSize: '28px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              fontFamily: 'var(--font-display, sans-serif)'
            }}>
              {title}
            </h1>

            <p style={{ 
              marginBottom: '32px', 
              opacity: 0.9,
              fontSize: '16px',
              lineHeight: '1.6'
            }}>
              {description}
            </p>

            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '32px'
            }}>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  backgroundColor: 'var(--theme-accent)',
                  color: 'var(--theme-bg)',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  fontSize: '14px',
                  transition: 'transform 0.1s ease'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <RefreshCw size={18} />
                Reload App
              </button>

              <button 
                onClick={this.handleCopy}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: 'var(--theme-text)',
                  border: '2px solid var(--theme-text)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  fontSize: '14px'
                }}
              >
                <Copy size={18} />
                {this.state.copied ? 'Copied!' : 'Copy Details'}
              </button>
            </div>

            <div style={{ textAlign: 'left' }}>
              <button 
                onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--theme-text)',
                  opacity: 0.6,
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '0',
                  marginBottom: '8px'
                }}
              >
                {this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {this.state.showDetails ? 'Hide Technical Details' : 'Show Technical Details'}
              </button>

              {this.state.showDetails && (
                <div style={{
                  background: 'rgba(0,0,0,0.2)',
                  padding: '16px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono, monospace)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}>
                  <strong>Error:</strong> {this.state.error?.message}
                  <br /><br />
                  <strong>Stack Trace:</strong>
                  <br />
                  {this.state.error?.stack}
                  {this.state.errorInfo && (
                    <>
                      <br /><br />
                      <strong>Component Stack:</strong>
                      <br />
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <p style={{ marginTop: '24px', opacity: 0.5, fontSize: '12px' }}>
            If this problem persists, please contact support with the copied error details.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
