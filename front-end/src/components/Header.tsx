import React from 'react';
import { Zap, Server, Home } from 'lucide-react';

interface HeaderProps {
  bestBlock: number;
  finalizedBlock: number;
  evmBlock: number;
  delta: number;
  syncStatus: string;
  activeNode: string;
  onNavigateHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  bestBlock,
  finalizedBlock,
  evmBlock,
  delta,
  syncStatus,
  activeNode,
  onNavigateHome
}) => {
  const isHealthy = delta <= 2;

  return (
    <header className="h-12 border-b border-[#261B42] bg-[#0B0616] px-4 flex items-center justify-between select-none">
      {/* Brand & Home Navigation */}
      <div className="flex items-center gap-3">
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
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-none border border-[#4C2889] bg-[#140C2B] text-[#C084FC]">
          Portaldot V3.0
        </span>
      </div>

      {/* Cluster Telemetry Micro-Badges */}
      <div className="hidden sm:flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500 text-[11px]">WASM:</span>
          <span className="text-zinc-200 tabular-nums">#{bestBlock.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-1.5">
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
          <span className="w-1.5 h-1.5 rounded-none bg-[#10B981] animate-ping" />
        </div>

        {/* Node Active Indicator */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-none border border-[#4C2889] bg-[#140C2B]">
          <Server className="w-3 h-3 text-[#A855F7]" />
          <span className="text-[11px] text-[#C084FC] font-semibold">{activeNode}</span>
        </div>
      </div>

      {/* Right Actions: Back to Landing / Live Status */}
      <div className="flex items-center gap-3">
        {onNavigateHome && (
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-[#C084FC] px-2.5 py-1 rounded-none border border-transparent hover:border-[#4C2889] hover:bg-[#140C2B] transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Homepage</span>
          </button>
        )}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
          <span className="w-2 h-2 rounded-none bg-[#10B981]" />
          <span>SOCKET 9944</span>
        </div>
      </div>
    </header>
  );
};
