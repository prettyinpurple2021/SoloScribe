import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: 'var(--theme-bg)',
          color: 'var(--theme-text)',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h1 style={{ marginBottom: '1rem', color: 'var(--theme-accent)' }}>Oops, something went wrong.</h1>
          <p style={{ marginBottom: '2rem', opacity: 0.8 }}>We've encountered an unexpected error.</p>
          <pre style={{
            background: 'var(--theme-surface)',
            padding: '1rem',
            borderRadius: '8px',
            overflowX: 'auto',
            maxWidth: '100%',
            fontSize: '12px',
            textAlign: 'left'
          }}>
            {this.state.error?.message}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '2rem',
              padding: '10px 20px',
              backgroundColor: 'var(--theme-accent)',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
