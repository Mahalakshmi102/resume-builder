// ============================================================
// ErrorBoundary.tsx
// Class-based React Error Boundary that catches runtime errors
// across the component tree and shows a graceful error page.
// ============================================================
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home, ChevronDown, ChevronUp } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught runtime error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Red header bar */}
            <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <AlertTriangle size={28} />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold">Something Went Wrong</h1>
                  <p className="text-red-100 text-sm">An unexpected error occurred in the application</p>
                </div>
              </div>
            </div>

            {/* Error content */}
            <div className="p-6 space-y-5">
              {this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-800 font-bold text-sm">{this.state.error.name}</p>
                  <p className="text-red-700 text-sm mt-1 font-mono break-words">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="text-slate-600 text-sm space-y-2">
                <p>Here are some things you can try:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-500 text-xs">
                  <li>Reload the page to start fresh</li>
                  <li>Load the Demo Profile to restore default state</li>
                  <li>Clear your browser's local storage if the issue persists</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
                >
                  <Home size={16} />
                  Try Again
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors border border-slate-200"
                >
                  <RefreshCcw size={16} />
                  Reload Page
                </button>
              </div>

              {/* Collapsible developer details */}
              {this.state.errorInfo && (
                <div>
                  <button
                    onClick={() => this.setState((s) => ({ showDetails: !s.showDetails }))}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {this.state.showDetails ? 'Hide' : 'Show'} Technical Details
                  </button>
                  {this.state.showDetails && (
                    <pre className="mt-2 p-3 bg-slate-900 text-green-400 rounded-xl text-[10px] overflow-auto max-h-40 font-mono leading-relaxed">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}

// ──────────────────────────────────────────────────────────────
// NotFoundPage — shown when a route doesn't match
// ──────────────────────────────────────────────────────────────
export const NotFoundPage: React.FC<{ onGoHome?: () => void }> = ({ onGoHome }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
    <div className="max-w-md w-full text-center space-y-6">
      <div className="text-8xl font-black text-slate-200 select-none">404</div>
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">Page Not Found</h2>
        <p className="text-slate-500 text-sm mt-2">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      {onGoHome && (
        <button
          onClick={onGoHome}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
        >
          <Home size={16} /> Back to Home
        </button>
      )}
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────
// NetworkErrorPage — shown when backend is unreachable
// ──────────────────────────────────────────────────────────────
export const NetworkErrorPage: React.FC<{
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}> = ({ message, onRetry, onGoHome }) => (
  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-4">
    <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto">
      <AlertTriangle size={28} className="text-amber-600" />
    </div>
    <div>
      <h3 className="font-extrabold text-amber-900 text-lg">Connection Error</h3>
      <p className="text-amber-700 text-sm mt-1">
        {message || 'Unable to reach the AI backend server. Start the backend (npm run dev in /backend) and try again.'}
      </p>
    </div>
    <div className="flex gap-3 justify-center">
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-colors"
        >
          <RefreshCcw size={14} /> Retry
        </button>
      )}
      {onGoHome && (
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 px-4 py-2 bg-white text-amber-700 rounded-xl font-bold text-sm border border-amber-200 hover:bg-amber-50 transition-colors"
        >
          <Home size={14} /> Go Back
        </button>
      )}
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────
// InlineErrorCard — small inline error display for forms/cards
// ──────────────────────────────────────────────────────────────
export const InlineErrorCard: React.FC<{
  title?: string;
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}> = ({ title = 'Error', message, onDismiss, onRetry }) => (
  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-in slide-in-from-top-1">
    <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
    <div className="flex-1 min-w-0">
      <p className="text-red-800 font-bold text-sm">{title}</p>
      <p className="text-red-700 text-xs mt-0.5 break-words">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1"
        >
          <RefreshCcw size={11} /> Retry
        </button>
      )}
    </div>
    {onDismiss && (
      <button onClick={onDismiss} className="text-red-400 hover:text-red-600 shrink-0">
        ×
      </button>
    )}
  </div>
);

export default ErrorBoundary;
