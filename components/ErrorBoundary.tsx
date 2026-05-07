import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError } from './AppError';

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
        <AppError
          title={title}
          message={description}
          error={this.state.error}
          onRetry={() => window.location.reload()}
          showHomeButton={true}
        />
      );
    }

    return this.props.children;
  }
}
