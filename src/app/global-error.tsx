/**
 * Global error boundary for the root layout.
 * Catches errors that bubble past the root layout's ErrorBoundary.
 */

"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error("[GlobalError]", error.message, error.stack, errorInfo.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <html lang="en">
          <body className="min-h-screen flex items-center justify-center bg-background px-6">
            <div className="max-w-md text-center">
              <h2 className="text-2xl font-bold mb-3">Something went wrong</h2>
              <p className="text-sm text-muted mb-4">
                We encountered an unexpected error. Our team has been notified.
              </p>
              <p className="text-xs text-muted mb-6 font-mono">
                {this.state.error.message}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    this.setState({ error: null });
                    window.location.reload();
                  }}
                  className="inline-flex px-6 py-3 bg-foreground text-background rounded-xl font-medium text-sm"
                >
                  Refresh
                </button>
                <a
                  href="/"
                  className="inline-flex px-6 py-3 border border-border rounded-xl font-medium text-sm"
                >
                  Go to Homepage
                </a>
              </div>
            </div>
          </body>
        </html>
      );
    }

    return this.props.children;
  }
}
