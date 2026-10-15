import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import { storage } from '../services/storage';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[DotNexus Subsystem Error]:', error, errorInfo);
  }

  handleResetState = (): void => {
    try {
      storage.clearCanvasState();
      this.props.onReset?.();
    } catch (e) {
      console.warn('Failed to clear canvas state:', e);
    }
    this.setState({ hasError: false, error: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[420px] flex items-center justify-center p-6 bg-[#080512]">
          <div className="w-full max-w-lg border border-[#7C3AED]/40 bg-[#0E071F] p-6 shadow-2xl shadow-black/90 tech-corner-accent">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="p-2.5 bg-[#2E1065] border border-[#A855F7]/50 text-[#C084FC] shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold font-mono tracking-tight text-white uppercase">
                  {this.props.fallbackTitle || 'Subsystem Execution Interrupted'}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 font-mono leading-relaxed">
                  An unexpected render exception was caught. The visual engine prevented an application crash.
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="mb-5 p-3 bg-[#06030D] border border-[#261845] text-[11px] font-mono text-rose-300 break-words max-h-32 overflow-y-auto">
                <span className="text-rose-400 font-semibold">[EXCEPTION]: </span>
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2 border-t border-[#261845]">
              <button
                type="button"
                onClick={this.handleResetState}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono font-medium text-white bg-[#7C3AED] hover:bg-[#6D28D9] border border-[#A855F7] transition-all cursor-pointer shadow-md shadow-[#7C3AED]/30"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Safe Defaults</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono font-medium text-zinc-300 hover:text-white bg-[#150B2E] hover:bg-[#1E113E] border border-[#3B2564] transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
