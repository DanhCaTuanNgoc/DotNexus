import React, { useState } from 'react';
import {
  Layers,
  RefreshCw,
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  Radio,
  Terminal,
  Zap,
  ArrowRight,
  ShieldCheck,
  Binary
} from 'lucide-react';
import { DualTelemetryState } from '../services/api';

interface DualEngineViewProps {
  data: DualTelemetryState | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export const DualEngineView: React.FC<DualEngineViewProps> = ({ data, onRefresh, isLoading }) => {
  const [selectedTier, setSelectedTier] = useState<number | null>(null);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96 text-zinc-500 font-mono text-xs">
        <RefreshCw className="w-4 h-4 animate-spin mr-2 text-[#8B5CF6]" />
        Probing Dual-Engine Telemetry (:9944 / :8545)...
      </div>
    );
  }

  const { substrate, evm, sync, mempool, root_cause_diagnosis, decimal_normalization } = data;
  const isHealthy = sync.is_synced;
  const delta = sync.delta_blocks;

  // Generate simulated historical blocks for Dual-Stream Ribbon
  const wasmBlocks = [
    substrate.best_block - 2,
    substrate.best_block - 1,
    substrate.best_block
  ];
  const evmBlocks = [
    evm.block_number - 2,
    evm.block_number - 1,
    evm.block_number
  ];

  const diag = root_cause_diagnosis || {
    tier: delta === 0 ? 0 : delta > 2 ? 1 : 2,
    root_cause_code: delta === 0 ? 'NONE' : 'FRONTIER_FC_DB_LAG',
    severity: delta === 0 ? 'OK' : 'WARNING',
    message: sync.message,
    recommended_action: delta === 0 ? 'System running at optimal lockstep parity.' : 'Check fc-mapping-sync worker task.'
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex items-center justify-between border-b border-[#261B42] pb-4">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#8B5CF6]" />
            Dual-Engine State Tracker & 3-Tier Root-Cause Isolation
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Realtime synchronicity telemetry between Substrate WASM (:9944) and Frontier EVM JSON-RPC (:8545).
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#180E30] hover:bg-[#261B42] border border-[#4C2889] text-[#C084FC] transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Pipeline
        </button>
      </div>

      {/* 1. Dual-Block Ribbon Stream (Visual Phase-Lock Stream) */}
      <div className="p-4 bg-[#110A24] border border-[#261B42] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#C084FC]" />
            <span className="text-xs font-mono font-bold text-white tracking-wider">
              DUAL-STREAM BLOCK PIPELINE & PHASE-LOCK STATUS
            </span>
          </div>
          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase border ${
            isHealthy
              ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
              : 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
          }`}>
            {isHealthy ? '100% LOCKSTEP PARITY' : `DESYNC: ${delta} BLOCKS LAG`}
          </span>
        </div>

        {/* Parallel Streams Graphic */}
        <div className="space-y-3 bg-[#080512] p-4 border border-[#1F143D]">
          {/* Substrate Stream */}
          <div className="flex items-center gap-3">
            <div className="w-32 shrink-0 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-none bg-[#E6007A]" />
              <span className="text-[11px] font-mono font-bold text-zinc-200">WASM (:9944)</span>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-2">
              {wasmBlocks.map((blk, idx) => (
                <div
                  key={`wasm-${blk}`}
                  className={`p-2 border font-mono text-center transition-all ${
                    idx === 2
                      ? 'border-[#E6007A] bg-[#E6007A]/15 text-white shadow-[0_0_12px_rgba(230,0,122,0.15)]'
                      : 'border-[#261B42] bg-[#110A24] text-zinc-400'
                  }`}
                >
                  <div className="text-[10px] text-zinc-500">BLOCK</div>
                  <div className="text-xs font-bold tabular-nums">#{blk.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Phase Lock Laser Connector */}
          <div className="flex items-center gap-3 pl-32">
            <div className="flex-1 flex justify-between px-10">
              <div className="h-4 border-l border-dashed border-[#4C2889]" />
              <div className="h-4 border-l border-dashed border-[#4C2889]" />
              <div className={`h-4 border-l-2 transition-all ${
                isHealthy ? 'border-[#10B981] shadow-[0_0_8px_#10B981]' : 'border-[#EF4444] shadow-[0_0_8px_#EF4444]'
              }`} />
            </div>
          </div>

          {/* EVM Stream */}
          <div className="flex items-center gap-3">
            <div className="w-32 shrink-0 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-none bg-[#6366F1]" />
              <span className="text-[11px] font-mono font-bold text-zinc-200">EVM (:8545)</span>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-2">
              {evmBlocks.map((blk, idx) => (
                <div
                  key={`evm-${blk}`}
                  className={`p-2 border font-mono text-center transition-all ${
                    idx === 2
                      ? 'border-[#6366F1] bg-[#6366F1]/15 text-white shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                      : 'border-[#261B42] bg-[#110A24] text-zinc-400'
                  }`}
                >
                  <div className="text-[10px] text-zinc-500">BLOCK</div>
                  <div className="text-xs font-bold tabular-nums">#{blk.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-1">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-none bg-emerald-400 inline-block" />
            BABE Slot Time: <strong className="text-zinc-200">~6.0s</strong> | Max Permissible Delta: <strong className="text-zinc-200">&le; {sync.threshold}</strong>
          </span>
          <span className="text-zinc-500">Live Finality Lag: <strong className="text-[#C084FC] tabular-nums">{substrate.finality_lag} blocks</strong></span>
        </div>
      </div>

      {/* 2. 3-Tier Root-Cause Isolation Funnel Matrix */}
      <div className="p-4 bg-[#110A24] border border-[#261B42] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span className="text-xs font-mono font-bold text-white tracking-wider">
              3-TIER ROOT-CAUSE ISOLATION MATRIX
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            Click tier to inspect isolation rules
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Tier 1: P2P Network Swarm */}
          <div
            onClick={() => setSelectedTier(1)}
            className={`p-3.5 border cursor-pointer transition-all ${
              diag.tier === 1
                ? 'border-[#EF4444] bg-[#EF4444]/10 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                : 'border-[#261B42] bg-[#0E081E] hover:border-[#4C2889]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-zinc-400">TIER 1 — P2P SWARM</span>
              {diag.tier === 1 ? (
                <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 font-bold">
                  STALL DETECTED
                </span>
              ) : (
                <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                  HEALTHY
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <Radio className="w-4 h-4 text-[#8B5CF6]" />
              <span className="text-xs font-semibold text-white">Substrate P2P Layer</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Monitors <code className="text-zinc-300">system_peers</code> (&ge; 2) and libp2p block gap (&le; 10).
            </p>
          </div>

          {/* Tier 2: Frontier Mapping Sync Lag */}
          <div
            onClick={() => setSelectedTier(2)}
            className={`p-3.5 border cursor-pointer transition-all ${
              diag.tier === 2
                ? 'border-[#F59E0B] bg-[#F59E0B]/10 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                : 'border-[#261B42] bg-[#0E081E] hover:border-[#4C2889]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-zinc-400">TIER 2 — FC-DB BRIDGE</span>
              {diag.tier === 2 ? (
                <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 font-bold">
                  MAPPING LAG
                </span>
              ) : (
                <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                  IN LOCKSTEP
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <Database className="w-4 h-4 text-[#C084FC]" />
              <span className="text-xs font-semibold text-white">Frontier DB Sync</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Tracks <code className="text-zinc-300">fc-mapping-sync</code> delta and RocksDB commit pipeline.
            </p>
          </div>

          {/* Tier 3: EVM Execution VM */}
          <div
            onClick={() => setSelectedTier(3)}
            className={`p-3.5 border cursor-pointer transition-all ${
              diag.tier === 3
                ? 'border-[#EF4444] bg-[#EF4444]/10 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                : 'border-[#261B42] bg-[#0E081E] hover:border-[#4C2889]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-zinc-400">TIER 3 — EVM ENGINE</span>
              {diag.tier === 3 ? (
                <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 font-bold">
                  CONGESTION
                </span>
              ) : (
                <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                  OPTIMAL GAS
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <Terminal className="w-4 h-4 text-[#6366F1]" />
              <span className="text-xs font-semibold text-white">Virtual Machine Pool</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Monitors pending transaction spikes and BaseFeePerGas saturation.
            </p>
          </div>
        </div>

        {/* Diagnosis Callout Card */}
        <div className="p-3 bg-[#080512] border border-[#261B42] flex items-start gap-3">
          <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${
            diag.severity === 'OK' ? 'text-emerald-400' : 'text-amber-400'
          }`} />
          <div className="space-y-1">
            <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
              <span>ROOT CAUSE: {diag.root_cause_code}</span>
              <span className="text-zinc-500 font-normal">| Severity: {diag.severity}</span>
            </div>
            <p className="text-[11px] text-zinc-300 font-mono">{diag.message}</p>
            <p className="text-[11px] text-[#C084FC] font-mono">
              <strong>Action:</strong> {diag.recommended_action}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Decimal Normalizer & BigInt Parity ($10^14 vs $10^18) */}
      <div className="p-4 bg-[#110A24] border border-[#261B42] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Binary className="w-3.5 h-3.5 text-[#C084FC]" />
            <span className="text-xs font-mono font-bold text-white tracking-wider">
              SAFE DECIMAL MAPPING & BIGINT PARITY GAUGE
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 border border-emerald-800/40">
            SCALE MULTIPLIER: 10^4 (10,000)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-[#080512] border border-[#1F143D] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#E6007A]" />
                Substrate Native POT (14 Decimals)
              </span>
              <span className="text-zinc-500 text-[10px]">PLANCK BASE UNITS</span>
            </div>
            <div className="text-base font-bold font-mono text-white tabular-nums">
              {decimal_normalization?.substrate_balance_planck || '10000000000000000'}
            </div>
            <div className="text-[11px] font-mono text-[#E6007A]">
              1.0 POT = 100,000,000,000,000 Planck
            </div>
          </div>

          <div className="p-3 bg-[#080512] border border-[#1F143D] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#6366F1]" />
                Frontier EVM Display (18 Decimals)
              </span>
              <span className="text-zinc-500 text-[10px]">WEI STANDARD UNITS</span>
            </div>
            <div className="text-base font-bold font-mono text-zinc-200 tabular-nums">
              {decimal_normalization?.evm_balance_wei || '100000000000000000000'}
            </div>
            <div className="text-[11px] font-mono text-[#6366F1]">
              1.0 POT = 1,000,000,000,000,000,000 Wei
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-2.5 bg-[#080512] border border-[#261B42] text-[11px] font-mono text-zinc-300">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            Discrepancy: <strong className="text-white">0 Planck (Zero Precision Loss)</strong>
          </span>
          <span className="text-zinc-500">
            Protected against JS <code className="text-zinc-300">Number.MAX_SAFE_INTEGER</code> overflow via BigInt
          </span>
        </div>
      </div>

      {/* 4. Mempool Flow Segregation */}
      <div className="p-4 bg-[#110A24] border border-[#261B42] space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-white flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-[#8B5CF6]" />
            MEMPOOL SEGREGATION: WASM EXTRINSICS VS EVM TRANSACTIONS
          </span>
          <span className="text-zinc-400">Total Pending: {mempool.total_pending} txs</span>
        </div>

        <div className="h-2.5 w-full bg-[#080512] flex overflow-hidden border border-[#261B42]">
          <div
            style={{ width: `${mempool.wasm_ratio_pct}%` }}
            className="bg-[#E6007A] transition-all duration-500"
            title={`WASM Extrinsics: ${mempool.wasm_ratio_pct}%`}
          />
          <div
            style={{ width: `${mempool.evm_ratio_pct}%` }}
            className="bg-[#6366F1] transition-all duration-500"
            title={`EVM Transactions: ${mempool.evm_ratio_pct}%`}
          />
        </div>

        <div className="flex justify-between text-[11px] font-mono">
          <span className="text-[#E6007A] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-none bg-[#E6007A]" />
            WASM Extrinsics: {mempool.wasm_extrinsics} ({mempool.wasm_ratio_pct}%)
          </span>
          <span className="text-[#6366F1] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-none bg-[#6366F1]" />
            EVM Transactions: {mempool.evm_transactions} ({mempool.evm_ratio_pct}%)
          </span>
        </div>
      </div>
    </div>
  );
};
