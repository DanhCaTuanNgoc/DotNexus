import React from 'react';
import { Layers, Activity, RefreshCw, Cpu, Gauge, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DualTelemetryState } from '../services/api';

interface DualEngineViewProps {
  data: DualTelemetryState | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export const DualEngineView: React.FC<DualEngineViewProps> = ({ data, onRefresh, isLoading }) => {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 font-mono text-xs">
        Loading Dual-Engine Telemetry...
      </div>
    );
  }

  const { substrate, evm, sync, mempool } = data;
  const isHealthy = sync.is_synced;

  return (
    <div className="space-y-6">
      {/* Title & Control Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#8B5CF6]" />
            Dual-Engine State Tracker
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Realtime synchronicity telemetry between Substrate WASM runtime (:9944) and EVM JSON-RPC (:8545).
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-none bg-[#180E30] hover:bg-[#261B42] border border-[#4C2889] text-[#C084FC] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Sync
        </button>
      </div>

      {/* Sync Status Banner */}
      <div className={`p-4 rounded-none border flex items-start justify-between ${
        isHealthy ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]' : 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
      }`}>
        <div className="flex items-start gap-3">
          {isHealthy ? (
            <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
          )}
          <div>
            <div className="text-xs font-bold font-mono uppercase tracking-wider">
              {sync.status} — Delta: {sync.delta_blocks} {sync.delta_blocks === 1 ? 'Block' : 'Blocks'}
            </div>
            <div className="text-xs text-zinc-300 mt-1">{sync.message}</div>
          </div>
        </div>
        <div className="text-right font-mono text-[11px] text-zinc-400">
          Threshold: ≤ {sync.threshold} blocks
        </div>
      </div>

      {/* Dual Column Layout: WASM vs EVM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Substrate WASM Card */}
        <div className="tech-corner-accent p-4 rounded-none border border-[#261B42] bg-[#110A24] space-y-4">
          <div className="flex items-center justify-between border-b border-[#261B42] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-none bg-[#E6007A]" />
              <span className="font-semibold text-xs tracking-wider text-white">SUBSTRATE WASM CORE</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-none bg-[#1F143D] text-[#E6007A] border border-[#E6007A]/30">
              PORT :9944
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-none bg-[#080512] border border-[#261B42]">
              <span className="text-zinc-500 text-[10px] block font-bold">BEST BLOCK HEIGHT</span>
              <span className="text-lg font-bold text-white tabular-nums">#{substrate.best_block.toLocaleString()}</span>
            </div>

            <div className="p-2.5 rounded-none bg-[#080512] border border-[#261B42]">
              <span className="text-zinc-500 text-[10px] block font-bold">FINALIZED BLOCK</span>
              <span className="text-lg font-bold text-[#E6007A] tabular-nums">#{substrate.finalized_block.toLocaleString()}</span>
            </div>

            <div className="p-2.5 rounded-none bg-[#080512] border border-[#261B42]">
              <span className="text-zinc-500 text-[10px] block font-bold">WS PING LATENCY</span>
              <span className="text-sm font-semibold text-emerald-400 tabular-nums">{substrate.latency_ms} ms</span>
            </div>

            <div className="p-2.5 rounded-none bg-[#080512] border border-[#261B42]">
              <span className="text-zinc-500 text-[10px] block font-bold">PENDING EXTRINSICS</span>
              <span className="text-sm font-semibold text-zinc-200 tabular-nums">{substrate.pending_extrinsics} txs</span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-zinc-400 space-y-1 pt-2 border-t border-[#261B42]/50">
            <div className="flex justify-between">
              <span>Token Decimals:</span>
              <span className="text-zinc-200">{substrate.token_decimals} (10^{substrate.token_decimals} base)</span>
            </div>
            <div className="flex justify-between">
              <span>SS58 Format:</span>
              <span className="text-zinc-200">{substrate.ss58_format} (Generic Substrate)</span>
            </div>
            <div className="flex justify-between">
              <span>Contract Engine:</span>
              <span className="text-zinc-200">{substrate.execution_engine}</span>
            </div>
          </div>
        </div>

        {/* EVM JSON-RPC Card */}
        <div className="tech-corner-accent p-4 rounded-none border border-[#261B42] bg-[#110A24] space-y-4">
          <div className="flex items-center justify-between border-b border-[#261B42] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-none bg-[#6366F1]" />
              <span className="font-semibold text-xs tracking-wider text-white">EVM EXECUTION LAYER</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-none bg-[#181C3D] text-[#818CF8] border border-[#6366F1]/30">
              PORT :8545
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-none bg-[#080512] border border-[#261B42]">
              <span className="text-zinc-500 text-[10px] block font-bold">EVM BLOCK NUMBER</span>
              <span className="text-lg font-bold text-white tabular-nums">#{evm.block_number.toLocaleString()}</span>
            </div>

            <div className="p-2.5 rounded-none bg-[#080512] border border-[#261B42]">
              <span className="text-zinc-500 text-[10px] block font-bold">CHAIN ID</span>
              <span className="text-lg font-bold text-[#818CF8] tabular-nums">{evm.chain_id}</span>
            </div>

            <div className="p-2.5 rounded-none bg-[#080512] border border-[#261B42]">
              <span className="text-zinc-500 text-[10px] block font-bold">HTTP RPC LATENCY</span>
              <span className="text-sm font-semibold text-emerald-400 tabular-nums">{evm.latency_ms} ms</span>
            </div>

            <div className="p-2.5 rounded-none bg-[#080512] border border-[#261B42]">
              <span className="text-zinc-500 text-[10px] block font-bold">GAS PRICE</span>
              <span className="text-sm font-semibold text-zinc-200 tabular-nums">{evm.gas_price_gwei} Gwei</span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-zinc-400 space-y-1 pt-2 border-t border-[#261B42]/50">
            <div className="flex justify-between">
              <span>Mempool Pending:</span>
              <span className="text-zinc-200">{evm.pending_transactions} txs</span>
            </div>
            <div className="flex justify-between">
              <span>Standard Support:</span>
              <span className="text-zinc-200">Solidity, ERC-20, ERC-721</span>
            </div>
            <div className="flex justify-between">
              <span>EVM Implementation:</span>
              <span className="text-zinc-200">{evm.execution_engine}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mempool Segregation Bar */}
      <div className="tech-corner-accent p-4 rounded-none border border-[#261B42] bg-[#110A24] space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-400 font-semibold">MEMPOOL SEGREGATION STREAM</span>
          <span className="text-zinc-300">Total Pending: {mempool.total_pending} transactions</span>
        </div>

        <div className="h-4 w-full bg-[#080512] rounded-none overflow-hidden flex border border-[#261B42]">
          <div 
            style={{ width: `${mempool.wasm_ratio_pct}%` }} 
            className="h-full bg-[#E6007A] flex items-center justify-center text-[10px] font-mono text-white font-bold"
            title={`WASM Extrinsics: ${mempool.wasm_ratio_pct}%`}
          />
          <div 
            style={{ width: `${mempool.evm_ratio_pct}%` }} 
            className="h-full bg-[#6366F1] flex items-center justify-center text-[10px] font-mono text-white font-bold"
            title={`EVM Transactions: ${mempool.evm_ratio_pct}%`}
          />
        </div>

        <div className="flex justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-[#E6007A]">
            <span className="w-2 h-2 rounded-none bg-[#E6007A]" />
            <span>WASM Extrinsics ({mempool.wasm_extrinsics} txs — {mempool.wasm_ratio_pct}%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#818CF8]">
            <span className="w-2 h-2 rounded-none bg-[#6366F1]" />
            <span>EVM Solidity ({mempool.evm_transactions} txs — {mempool.evm_ratio_pct}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
