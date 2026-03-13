'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
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
      let errorMessage = "Something went wrong. Please try again later.";
      
      try {
        // Check if it's a Firestore permission error (JSON string)
        if (this.state.error?.message.startsWith('{')) {
          const errData = JSON.parse(this.state.error.message);
          if (errData.error.includes('Missing or insufficient permissions')) {
            errorMessage = "Access Denied: You don't have permission to perform this action. Please contact the administrator.";
          }
        }
      } catch (e) {
        // Fallback to default message
      }

      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] text-center shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-rose-500/30">
              <AlertCircle className="text-rose-400 w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Application Error</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              {errorMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-cyan-500 text-slate-950 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
            >
              <RefreshCcw className="w-5 h-5" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
