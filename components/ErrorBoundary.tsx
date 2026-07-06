import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
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
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-neo-yellow p-4">
          <div className="bg-neo-white border-4 border-neo-black p-8 max-w-xl w-full neo-shadow relative">
            <div className="absolute -top-4 -right-4 bg-neo-pink text-neo-black border-4 border-neo-black px-4 py-1 font-black transform rotate-6">
              ERROR
            </div>
            
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 text-neo-black">
              System Fault
            </h2>
            
            <p className="font-mono text-sm text-zinc-700 mb-6 font-medium leading-relaxed">
              We encountered an unexpected error processing your request. 
            </p>

            {this.state.error && (
              <div className="bg-zinc-100 border-2 border-neo-black p-4 mb-6 overflow-x-auto">
                <code className="text-xs font-mono text-neo-red font-bold">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-neo-black text-neo-white font-black uppercase text-sm py-4 hover:bg-neo-cyan hover:text-neo-black transition-colors"
            >
              REBOOT_SYSTEM
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
