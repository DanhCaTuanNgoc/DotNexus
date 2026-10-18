import React, { useState } from 'react';
import { Zap, Server, Home, Menu, X, ChevronDown, ChevronUp, Activity } from 'lucide-react';

interface HeaderProps {
  bestBlock: number;
  finalizedBlock: number;
  evmBlock: number;
  delta: number;
  syncStatus: string;
  activeNode: string;
  onNavigateHome?: () => void;
  isMobileNavOpen?: boolean;
  onToggleMobileNav?: () => void;
  onStartTour?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  bestBlock,
  finalizedBlock,
  evmBlock,
  delta,
  syncStatus,
  activeNode,
  onNavigateHome,
  isMobileNavOpen,
  onToggleMobileNav,
  onStartTour
}) => {
  const [showMobileTelemetry, setShowMobileTelemetry] = useState(false);
  const isHealthy = delta <= 2;

  return (
    <>
      <header className="h-12 border-b border-[#261B42] bg-[#0B0616] px-3 sm:px-4 flex items-center justify-between select-none relative z-30">
        {/* Brand & Mobile Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onToggleMobileNav && (
            <button
              onClick={onToggleMobileNav}
              className="md:hidden p-1.5 text-zinc-400 hover:text-white hover:bg-[#1E113E] border border-transparent hover:border-[#3B2564] transition-colors"
              title={isMobileNavOpen ? 'Close Menu' : 'Open Operations Menu'}
              aria-label="Toggle operations navigation"
            >
              {isMobileNavOpen ? (
                <X className="w-4 h-4 text-[#C084FC]" />
              ) : (
                <Menu className="w-4 h-4 text-zinc-300" />
              )}
            </button>
          )}

          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer group"
            title="Return to Landing Page"
          >
            <div className="w-6 h-6 rounded-none bg-[#8B5CF6]/20 border border-[#8B5CF6] flex items-center justify-center text-[#8B5CF6] group-hover:scale-105 transition-transform">
              <Zap className="w-3.5 h-3.5 fill-[#8B5CF6]" />
            </div>
            <span className="font-bold text-sm tracking-wider text-white font-mono">DOTNEXUS</span>
          </button>
          <span className="hidden xs:inline-block text-[10px] uppercase font-mono px-2 py-0.5 rounded-none border border-[#4C2889] bg-[#140C2B] text-[#C084FC]">
            Portaldot V3.0
          </span>
        </div>

        {/* Desktop Cluster Telemetry Micro-Badges */}
        <div data-tour="header-telemetry" className="hidden sm:flex items-center gap-3 lg:gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 text-[11px]">WASM:</span>
            <span className="text-zinc-200 tabular-nums">#{bestBlock.toLocaleString()}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5">
            <span className="text-zinc-500 text-[11px]">FINALIZED:</span>
            <span className="text-zinc-300 tabular-nums">#{finalizedBlock.toLocaleString()}</span>
            <span className="text-[10px] text-zinc-500">(-{bestBlock - finalizedBlock})</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 text-[11px]">EVM:</span>
            <span className="text-[#818CF8] tabular-nums">#{evmBlock.toLocaleString()}</span>
          </div>

          {/* Delta Chip */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-none border border-[#261B42] bg-[#110A24]">
            <span className="text-zinc-500 text-[11px]">DELTA:</span>
            <span className={`font-semibold ${isHealthy ? 'text-[#10B981]' : 'text-[#F59E0B]'}`}>
              {delta} {delta === 1 ? 'blk' : 'blks'}
            </span>
          </div>

          {/* Node Active Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-none border border-[#4C2889] bg-[#140C2B]">
            <Server className="w-3 h-3 text-[#A855F7]" />
            <span className="text-[11px] text-[#C084FC] font-semibold">{activeNode}</span>
          </div>
        </div>

        {/* Mobile Compact Telemetry Toggle Button */}
        <button
          onClick={() => setShowMobileTelemetry((prev) => !prev)}
          className="sm:hidden flex items-center gap-1 px-2 py-1 rounded-none border border-[#3B2564] bg-[#140C2B] text-[10px] font-mono text-zinc-200"
          title="Toggle telemetry details"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-[#C084FC] font-bold tabular-nums">#{bestBlock.toLocaleString()}</span>
          <span className={`font-bold ${isHealthy ? 'text-[#10B981]' : 'text-[#F59E0B]'}`}>Δ{delta}</span>
          {showMobileTelemetry ? (
            <ChevronUp className="w-3 h-3 text-zinc-400" />
          ) : (
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          )}
        </button>

        {/* Right Actions: Tour Guide / Back to Landing / Live Status */}
        <div className="flex items-center gap-2">
          {onStartTour && (
            <button
              onClick={onStartTour}
              className="flex items-center gap-1.5 text-[11px] font-mono text-[#C084FC] bg-[#180E30] hover:bg-[#261B42] px-2 sm:px-2.5 py-1 rounded-none border border-[#4C2889] hover:border-[#8B5CF6] transition-all cursor-pointer"
              title="Launch Guided Mission Tour"
            >
              <Activity className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span className="hidden sm:inline">TOUR GUIDE</span>
            </button>
          )}

          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 hover:text-white px-2 sm:px-2.5 py-1 rounded-none border border-[#261B42] hover:border-[#8B5CF6] hover:bg-[#140C2B] transition-colors cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span className="hidden md:inline">HOMEPAGE</span>
            </button>
          )}
          <div className="hidden xs:flex items-center gap-1.5 text-[10px] font-mono border border-[#10B981]/40 bg-[#0E2820]/40 px-2 py-0.5 text-[#10B981] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span>:9944</span>
          </div>
        </div>
      </header>

      {/* Mobile Telemetry Dropdown Card */}
      {showMobileTelemetry && (
        <div className="sm:hidden bg-[#0D081D] border-b border-[#261B42] px-4 py-2.5 font-mono text-[11px] space-y-1.5 z-20 shadow-xl">
          <div className="flex justify-between items-center text-zinc-400">
            <span>WASM Best Block:</span>
            <span className="text-white font-bold tabular-nums">#{bestBlock.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-400">
            <span>Finalized Block:</span>
            <span className="text-zinc-300 tabular-nums">#{finalizedBlock.toLocaleString()} (-{bestBlock - finalizedBlock})</span>
          </div>
          <div className="flex justify-between items-center text-zinc-400">
            <span>EVM JSON-RPC Block:</span>
            <span className="text-[#818CF8] font-bold tabular-nums">#{evmBlock.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-400">
            <span>Sync Status:</span>
            <span className={isHealthy ? 'text-[#10B981] font-bold' : 'text-[#F59E0B] font-bold'}>
              {syncStatus} (Delta: {delta} blk)
            </span>
          </div>
          <div className="flex justify-between items-center text-zinc-400 pt-1 border-t border-[#1F143D]">
            <span>Active Signer Node:</span>
            <span className="text-[#C084FC] font-semibold">{activeNode}</span>
          </div>
        </div>
      )}
    </>
  );
};
