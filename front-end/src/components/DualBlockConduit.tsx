import React, { useState } from 'react';
import { ArrowLeftRight, RefreshCw, Copy, Check, ShieldCheck, AlertTriangle, Layers, Zap } from 'lucide-react';
import { DualBlockConduitItem } from '../services/api';
import { CornerCrosshair } from './blueprint';

interface DualBlockConduitProps {
  items: DualBlockConduitItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

/**
 * DualBlockConduit: Real-time Parity Stream correlating Substrate WASM (:9944) and Frontier EVM (:8545).
 * Renders the 5 most recent block pairs side-by-side with fc-mapping-sync latency,
 * execution gas metrics, and instant cross-VM desync diagnosis.
 */
export const DualBlockConduit: React.FC<DualBlockConduitProps> = ({
  items,
  isLoading = false,
  onRefresh,
  className = '',
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleCopy = (hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1800);
  };

  const getStatusBadge = (status: DualBlockConduitItem['status'], delta: number) => {
    switch (status) {
      case 'LOCKSTEP':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold font-mono uppercase bg-emerald-950/40 text-[#00FF9D] border border-emerald-800/60 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9D] animate-pulse" />
            <span>100% LOCKSTEP</span>
          </span>
        );
      case 'PROPAGATION_LAG':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold font-mono uppercase bg-amber-950/40 text-amber-400 border border-amber-800/60 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>{delta}-BLK PROPAGATION LAG</span>
          </span>
        );
      case 'SLOW_INDEXING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold font-mono uppercase bg-orange-950/40 text-orange-400 border border-orange-800/60 shadow-sm">
            <AlertTriangle className="w-2.5 h-2.5 text-orange-400" />
            <span>SLOW FC-INDEXING</span>
          </span>
        );
      case 'DESYNC_CRITICAL':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold font-mono uppercase bg-rose-950/40 text-rose-400 border border-rose-800/60 shadow-sm">
            <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
            <span>CRITICAL DESYNC</span>
          </span>
        );
    }
  };

  return (
    <div className={`relative border border-white/[0.08] bg-[#07040E] rounded-none shadow-2xl font-mono overflow-hidden ${className}`}>
      {/* 4 Vector Corner Crosshairs */}
      <CornerCrosshair position="top-left" color="text-[#8B5CF6]" />
      <CornerCrosshair position="top-right" color="text-[#8B5CF6]" />
      <CornerCrosshair position="bottom-left" color="text-[#8B5CF6]" />
      <CornerCrosshair position="bottom-right" color="text-[#8B5CF6]" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.08] bg-[#0A0615]/95">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#8B5CF6]" />
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span>LIVE DUAL-VM RECENT BLOCKS CONDUIT</span>
              <span className="text-[10px] text-[#C084FC] font-semibold bg-[#8B5CF6]/15 px-1.5 py-0.5 border border-[#8B5CF6]/30">
                5 BLOCKS PARITY STREAM
              </span>
            </h3>
          </div>
          <p className="text-[10px] text-zinc-400">
            Real-time Substrate WASM (:9944) vs Frontier EVM (:8545) block pairing &amp; mapping latency audit.
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="self-start sm:self-auto flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#120B24] hover:bg-[#1A1033] border border-white/[0.08] hover:border-[#8B5CF6] text-zinc-300 transition-colors cursor-pointer"
            title="Poll Latest Dual Blocks"
          >
            <RefreshCw className={`w-3 h-3 text-[#C084FC] ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'SYNCING...' : 'REFRESH STREAM'}</span>
          </button>
        )}
      </div>

      {/* Block Stream Table Container */}
      <div className="divide-y divide-white/[0.06]">
        {items && items.length > 0 ? (
          items.slice(0, 5).map((block, idx) => {
            const isExpanded = expandedIndex === idx;
            const isLatest = idx === 0;

            return (
              <div
                key={`dual-block-${block.block_number_wasm}-${idx}`}
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className={`p-3 sm:p-3.5 transition-colors cursor-pointer group ${
                  isExpanded ? 'bg-[#0E091E]/90' : idx % 2 === 0 ? 'bg-[#06030D]' : 'bg-[#080412]/50'
                } hover:bg-[#110A24]`}
              >
                {/* Row Summary */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
                  {/* Left: Substrate WASM Domain */}
                  <div className="flex-1 min-w-0 flex items-center gap-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#E6007A]" />
                      <span className="font-bold text-white tabular-nums tracking-tight text-xs sm:text-sm">
                        #{block.block_number_wasm.toLocaleString()}
                      </span>
                    </div>

                    <span className="text-[10px] px-1.5 py-0.5 rounded-none bg-[#E6007A]/10 text-[#E6007A] border border-[#E6007A]/25 font-semibold">
                      Author: {block.babe_author}
                    </span>

                    <span className="text-[10px] text-zinc-400 hidden sm:inline">
                      {block.extrinsics_count} Extrinsic{block.extrinsics_count > 1 ? 's' : ''}
                    </span>

                    <span className="text-[10px] text-zinc-500 truncate max-w-[100px] hidden md:inline">
                      {block.hash_wasm ? `${block.hash_wasm.slice(0, 8)}...` : '0x...'}
                    </span>
                  </div>

                  {/* Center: The Conduit Optical Bridge */}
                  <div className="flex items-center justify-center gap-2 px-2 py-1 bg-[#090516] border border-white/[0.04] text-[10px] text-zinc-400 select-none">
                    <span className="text-zinc-600">──</span>
                    <span className="text-[#8B5CF6] font-bold">⚡</span>
                    <span className="text-zinc-300">
                      Mapping Latency: <strong className="text-[#00FF9D] tabular-nums font-bold">{block.mapping_latency_ms}ms</strong>
                    </span>
                    <ArrowLeftRight className="w-3 h-3 text-[#C084FC] group-hover:scale-110 transition-transform" />
                    <span className="text-zinc-600">──</span>
                  </div>

                  {/* Right: Frontier EVM Pallet-Revive Domain */}
                  <div className="flex-1 min-w-0 flex items-center justify-between lg:justify-end gap-2.5">
                    <div className="flex items-center gap-2 truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#818CF8]" />
                        <span className="font-bold text-[#818CF8] tabular-nums tracking-tight text-xs sm:text-sm">
                          #{block.block_number_evm.toLocaleString()}
                        </span>
                      </div>

                      <span className="text-[10px] text-zinc-400 hidden sm:inline">
                        Gas: {block.evm_gas_used.toLocaleString()}
                      </span>

                      <span className="text-[10px] text-zinc-500 hidden md:inline">
                        {block.evm_tx_count} Tx{block.evm_tx_count !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      {getStatusBadge(block.status, block.delta_blocks)}
                    </div>
                  </div>
                </div>

                {/* Expanded Micro-Telemetry Drawer */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06] grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] bg-[#05020B]/80 p-3 rounded-none">
                    {/* Substrate Details */}
                    <div className="space-y-1.5 border-l-2 border-[#E6007A] pl-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#E6007A] uppercase tracking-wider">
                          Substrate Consensus Header
                        </span>
                        {isLatest && (
                          <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/50 px-1 border border-emerald-800/40">
                            LATEST CONFIRMED HEAD
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Block Hash:</span>
                        <div className="flex items-center gap-1 text-zinc-300 font-mono text-[10px]">
                          <span>{block.hash_wasm}</span>
                          <button
                            onClick={(e) => handleCopy(block.hash_wasm, e)}
                            className="p-1 hover:text-white transition-colors"
                            title="Copy WASM Hash"
                          >
                            {copiedHash === block.hash_wasm ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-zinc-500" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>BABE Primary Slot Author:</span>
                        <span className="text-white font-bold">{block.babe_author}</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>Extrinsics Included:</span>
                        <span className="text-white">{block.extrinsics_count} call(s)</span>
                      </div>
                    </div>

                    {/* EVM Details */}
                    <div className="space-y-1.5 border-l-2 border-[#818CF8] pl-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#818CF8] uppercase tracking-wider">
                          Frontier Pallet-Revive State
                        </span>
                        <span className="text-[9px] text-zinc-400">
                          Base Fee: {block.evm_base_fee_gwei} Gwei
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">EVM Block Hash:</span>
                        <div className="flex items-center gap-1 text-[#818CF8] font-mono text-[10px]">
                          <span>{block.hash_evm}</span>
                          <button
                            onClick={(e) => handleCopy(block.hash_evm, e)}
                            className="p-1 hover:text-white transition-colors"
                            title="Copy EVM Hash"
                          >
                            {copiedHash === block.hash_evm ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-zinc-500" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>EVM Gas Consumed:</span>
                        <span className="text-white tabular-nums">{block.evm_gas_used.toLocaleString()} units</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>Transactions Executed:</span>
                        <span className="text-white tabular-nums">{block.evm_tx_count} tx(s)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-zinc-500 space-y-2">
            <RefreshCw className="w-5 h-5 mx-auto animate-spin text-[#8B5CF6]" />
            <div>Streaming recent Dual-VM blocks from Portaldot node...</div>
          </div>
        )}
      </div>

      {/* Footer Conduit Telemetry Strip */}
      <div className="px-3.5 py-2 border-t border-white/[0.06] bg-[#05020B] flex flex-wrap items-center justify-between gap-2 text-[10px] text-zinc-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-[#00FF9D] rounded-full" />
            <span className="text-zinc-300">Lockstep Tolerance: 0 block delta</span>
          </span>
          <span className="hidden sm:inline text-zinc-700">•</span>
          <span className="hidden sm:inline text-zinc-400">Ingestion Threshold: &le; 150ms mapping latency</span>
        </div>
        <div className="text-zinc-400">
          Click any row to inspect complete cryptographic hashes &amp; execution traces.
        </div>
      </div>
    </div>
  );
};
