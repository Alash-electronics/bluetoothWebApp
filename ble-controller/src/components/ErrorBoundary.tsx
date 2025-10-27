import { Component } from 'react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-red-900/20 backdrop-blur-sm border border-red-500/50 rounded-2xl p-8 text-center">
            <div className="mb-6">
              <svg className="w-20 h-20 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h1 className="text-white text-2xl font-bold mb-4">
              Application Error
            </h1>

            <p className="text-gray-300 mb-4">
              Something went wrong. Please try refreshing the page.
            </p>

            {this.state.error && (
              <div className="bg-black/30 rounded-lg p-4 mb-6 text-left">
                <p className="text-red-400 text-sm font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-lg transition w-full mb-3"
            >
              Reload Page
            </button>

            <a
              href="https://github.com/Alash-electronics/bluetoothWebApp/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-300 text-sm underline"
            >
              Report Issue
            </a>

            <p className="text-gray-500 text-xs mt-6">
              BLE Controller v1.0.0
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
