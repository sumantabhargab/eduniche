"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error("PadhaiShuru error:", error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const error = this.state.error;
      const isDev = process.env.NODE_ENV === "development";

      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6">
          <div className="max-w-md text-center">
            <h2 className="text-2xl font-bold mb-3">Something went wrong</h2>
            <p className="text-sm text-muted mb-4">
              We encountered an unexpected error. Please refresh the page or go back.
            </p>
            {isDev && error && (
              <div className="text-left bg-foreground/5 border border-border rounded-xl p-4 mb-6 text-xs">
                <p className="font-mono text-red-500 mb-2">{error.message}</p>
                <pre className="text-muted whitespace-pre-wrap break-words">{error.stack}</pre>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  window.location.reload();
                }}
                className="inline-flex px-6 py-3 bg-foreground text-background rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
              >
                Refresh
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  window.location.href = "/";
                }}
                className="inline-flex px-6 py-3 border border-border rounded-xl font-medium text-sm hover:border-foreground/40 transition-colors"
              >
                Go to Homepage
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
