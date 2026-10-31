import React, { useState } from 'react';
import { Zap, Server, Home, Menu, X, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import dotnexusIcon from '../assets/Icon.png';

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
  isLiveChain?: boolean;
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
  onStartTour,
  isLiveChain
}) => {
  const [showMobileTelemetry, setShowMobileTelemetry] = useState(false);
  const isHealthy = delta <= 2;

  return (
    <>
      <header className="h-12 border-b border-[#1C142E] bg-[#06040A] px-3 sm:px-4 flex items-center justify-between select-none relative z-30 font-mono">
        {/* Brand & Mobile Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onToggleMobileNav && (
            <button
              onClick={onToggleMobileNav}
              className="md:hidden p-1 text-zinc-400 hover:text-white hover:bg-[#110C1E] border border-[#1C142E] transition-colors"
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
            className="flex items-center gap-2.5 cursor-pointer"
            title="Return to Landing Page"
          >
            <img
              src={dotnexusIcon}
              alt="DotNexus"
              className="w-8 h-8 object-contain rounded-none border border-[#1C142E]"
            />
            <span className="font-bold text-xs tracking-widest text-white font-mono uppercase">DOTNEXUS</span>
          </button>

          <span className="hidden xs:inline-block text-[9px] uppercase font-mono px-1.5 py-0.5 border border-[#2E1F4A] bg-[#0E091B] text-[#C084FC] tracking-wider">
            PORTALDOT V3.0
          </span>
        </div>

        {/* Desktop Cluster Telemetry Micro-Badges */}
        <div data-tour="header-telemetry" className="hidden sm:flex items-center gap-3 lg:gap-4 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 border-r border-[#1C142E] pr-3">
            <span className="w-1.5 h-1.5 bg-[#E6007A]" title="Substrate WASM Runtime" />
            <span className="text-zinc-500 text-[10px]">WASM:</span>
            <span className="text-zinc-100 font-bold tabular-nums">#{bestBlock.toLocaleString()}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 border-r border-[#1C142E] pr-3">
            <span className="text-zinc-500 text-[10px]">FIN:</span>
            <span className="text-zinc-300 tabular-nums">#{finalizedBlock.toLocaleString()}</span>
            <span className="text-[10px] text-zinc-600">(-{bestBlock - finalizedBlock})</span>
          </div>

          <div className="flex items-center gap-1.5 border-r border-[#1C142E] pr-3">
            <span className="w-1.5 h-1.5 bg-[#6366F1]" title="Frontier EVM Engine" />
            <span className="text-zinc-500 text-[10px]">EVM:</span>
            <span className="text-[#818CF8] font-bold tabular-nums">#{evmBlock.toLocaleString()}</span>
          </div>

          {/* Delta Chip */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 border border-[#1C142E] bg-[#0B0813]">
            <span className="text-zinc-500 text-[10px]">DELTA:</span>
            <span className={`font-bold tabular-nums ${isHealthy ? 'text-[#00FF9D]' : 'text-[#F59E0B]'}`}>
              {delta} {delta === 1 ? 'BLK' : 'BLKS'}
            </span>
          </div>

          {/* Node Active Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 border border-[#1C142E] bg-[#0B0813]">
            <Server className="w-3 h-3 text-[#A855F7]" />
            <span className="text-[10px] text-zinc-300 font-bold uppercase">{activeNode}</span>
          </div>
        </div>

        {/* Mobile Compact Telemetry Toggle Button */}
        <button
          onClick={() => setShowMobileTelemetry((prev) => !prev)}
          className="sm:hidden flex items-center gap-1 px-2 py-1 border border-[#1C142E] bg-[#0B0813] text-[10px] font-mono text-zinc-200"
          title="Toggle telemetry details"
        >
          <span className="w-1.5 h-1.5 bg-[#00FF9D] animate-pulse" />
          <span className="text-[#C084FC] font-bold tabular-nums">#{bestBlock.toLocaleString()}</span>
          <span className={`font-bold ${isHealthy ? 'text-[#00FF9D]' : 'text-[#F59E0B]'}`}>Δ{delta}</span>
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
              className="flex items-center gap-1.5 text-[10px] font-mono text-[#C084FC] bg-[#110C1E] hover:bg-[#1A102E] px-2 sm:px-2.5 py-1 border border-[#2E1F4A] hover:border-[#8B5CF6] transition-colors cursor-pointer"
              title="Launch Guided Mission Tour"
            >
              <Activity className="w-3 h-3 text-[#8B5CF6]" />
              <span className="hidden sm:inline">TOUR GUIDE</span>
            </button>
          )}

          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 hover:text-white px-2 sm:px-2.5 py-1 border border-[#1C142E] hover:border-[#2E1F4A] hover:bg-[#110C1E] transition-colors cursor-pointer"
            >
              <Home className="w-3 h-3 text-zinc-400" />
              <span className="hidden md:inline">HOMEPAGE</span>
            </button>
          )}
          <div className={`hidden xs:flex items-center gap-1.5 text-[10px] font-mono border px-2 py-0.5 font-bold ${
            isLiveChain 
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' 
              : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
          }`}>
            <span className={`w-1.5 h-1.5 ${isLiveChain ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{isLiveChain ? 'PORTALDOT V3 LIVE RPC' : 'SANDBOX SIMULATION'}</span>
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
