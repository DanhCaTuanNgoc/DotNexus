import React from 'react';
import { Activity, ShieldCheck, Zap, Layers, Server } from 'lucide-react';

interface HeaderProps {
  bestBlock: number;
  finalizedBlock: number;
  evmBlock: number;
  delta: number;
  syncStatus: string;
  activeNode: string;
}

export const Header: React.FC<HeaderProps> = ({
  bestBlock,
  finalizedBlock,
  evmBlock,
  delta,
  syncStatus,
  activeNode
}) => {
  const isHealthy = delta <= 2;

  return (
    <header className="h-12 border-b border-[#261B42] bg-[#0F0A1F] px-4 flex items-center justify-between select-none">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#8B5CF6]/20 border border-[#8B5CF6] flex items-center justify-center text-[#8B5CF6]">
            <Zap className="w-3.5 h-3.5 fill-[#8B5CF6]" />
          </div>
          <span className="font-bold text-sm tracking-wider text-white font-mono">DOTNEXUS</span>
        </div>
        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border border-[#4C2889] bg-[#1A1333] text-[#C084FC]">
          Portaldot V3.0
        </span>
      </div>

      {/* Cluster Telemetry Micro-Badges */}
      <div className="flex items-center gap-4 text-xs font-mono">
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
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#261B42] bg-[#130E26]">
          <span className="text-zinc-500 text-[11px]">DELTA:</span>
          <span className={`font-semibold ${isHealthy ? 'text-[#10B981]' : 'text-[#F59E0B]'}`}>
            {delta} {delta === 1 ? 'blk' : 'blks'}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
        </div>

        {/* Node Active Indicator */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#4C2889] bg-[#1A1333]">
          <Server className="w-3 h-3 text-[#A855F7]" />
          <span className="text-[11px] text-[#C084FC] font-semibold">{activeNode}</span>
        </div>
      </div>

      {/* Live Status Pill */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span>SOCKET 9944</span>
        </div>
      </div>
    </header>
  );
};
