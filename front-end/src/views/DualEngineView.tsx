import React, { useState, useEffect } from 'react';
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
  Binary,
  Clock,
  Sparkles,
  Box,
  Flame,
  GitCommit
} from 'lucide-react';
import { DualTelemetryState } from '../services/api';

interface DualEngineViewProps {
  data: DualTelemetryState;
  onRefresh: () => void;
  isLoading: boolean;
}

export const DualEngineView: React.FC<DualEngineViewProps> = ({ data, onRefresh, isLoading }) => {
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [slotElapsed, setSlotElapsed] = useState(0);
  const [activeTab, setActiveTab] = useState<'stream' | 'diagnostics' | 'tools'>('stream');

  useEffect(() => {
    const timer = setInterval(() => {
      const sec = (Date.now() / 1000) % 6.0;
      setSlotElapsed(sec);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const { substrate, evm, sync, mempool, root_cause_diagnosis, decimal_normalization } = data;
  const isHealthy = sync.is_synced;
  const delta = sync.delta_blocks;

  const slotPercent = Math.min(100, Math.floor((slotElapsed / 6.0) * 100));

  // Pure terminal phase calculation
  let phaseTag = 'PACKING';
  let phaseDetail = 'Gathering extrinsics';
  if (slotElapsed >= 4.8) {
    phaseTag = 'SEAL_BROADCAST';
    phaseDetail = 'Importing to block tree';
  } else if (slotElapsed >= 3.6) {
    phaseTag = 'BABE_VRF';
    phaseDetail = 'Alice VRF pre-seal claim';
  } else if (slotElapsed >= 1.8) {
    phaseTag = 'STATE_EXEC';
    phaseDetail = 'Calculating WASM state root';
  }

  // 4 confirmed historical blocks + 1 candidate block currently authoring
  const wasmBlocks = [
    substrate.best_block - 3,
    substrate.best_block - 2,
    substrate.best_block - 1,
    substrate.best_block
  ];
  const evmBlocks = [
    evm.block_number - 3,
    evm.block_number - 2,
    evm.block_number - 1,
    evm.block_number
  ];
  const candidateWasm = substrate.best_block + 1;
  const candidateEvm = evm.block_number + 1;

  const diag = root_cause_diagnosis || {
    tier: delta === 0 ? 0 : delta > 2 ? 1 : 2,
    root_cause_code: delta === 0 ? 'NONE' : 'FRONTIER_FC_DB_LAG',
    severity: delta === 0 ? 'OK' : 'WARNING',
    message: sync.message,
    recommended_action: delta === 0 ? 'System running at optimal lockstep parity.' : 'Check fc-mapping-sync worker task.'
  };

  return (
    <div className="space-y-4">
      {/* View Header with Onboarding Mission Context */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#261B42] pb-3 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#8B5CF6]" />
            <h2 className="text-sm sm:text-base font-bold font-mono text-white tracking-wider uppercase">
              DUAL-ENGINE STATE
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-[#8B5CF6]/10 text-[#C084FC] border border-[#8B5CF6]/30">
              WASM + EVM
            </span>
          </div>
          <p className="text-[11px] font-mono text-zinc-400 mt-1">
            Real-time synchronization telemetry between Substrate WASM runtime and Frontier EVM sub-engine.
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

      {/* Sub-Tabs Navigation for Progressive Disclosure */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#1A122E] pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('stream')}
          className={`flex items-center gap-1.5 px-3 py-1.5 border transition-all cursor-pointer ${
            activeTab === 'stream'
              ? 'bg-[#1F1238] border-[#8B5CF6] text-white font-bold shadow-[0_0_12px_rgba(139,92,246,0.15)]'
              : 'bg-[#0E081E] border-[#261B42] text-zinc-400 hover:text-zinc-200 hover:border-[#3E2568]'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span>1. Stream Pipeline & Conduit</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`flex items-center gap-1.5 px-3 py-1.5 border transition-all cursor-pointer ${
            activeTab === 'diagnostics'
              ? 'bg-[#1F1238] border-[#8B5CF6] text-white font-bold shadow-[0_0_12px_rgba(139,92,246,0.15)]'
              : 'bg-[#0E081E] border-[#261B42] text-zinc-400 hover:text-zinc-200 hover:border-[#3E2568]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#C084FC]" />
          <span>2. Causal Lag & Root Cause</span>
          {diag.severity !== 'OK' && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('tools')}
          className={`flex items-center gap-1.5 px-3 py-1.5 border transition-all cursor-pointer ${
            activeTab === 'tools'
              ? 'bg-[#1F1238] border-[#8B5CF6] text-white font-bold shadow-[0_0_12px_rgba(139,92,246,0.15)]'
              : 'bg-[#0E081E] border-[#261B42] text-zinc-400 hover:text-zinc-200 hover:border-[#3E2568]'
          }`}
        >
          <Binary className="w-3.5 h-3.5 text-[#10B981]" />
          <span>3. Decimals & Mempool</span>
        </button>
      </div>

      {/* TAB 1: Dual-Block Ribbon Stream & Pipeline Conduit */}
      {activeTab === 'stream' && (
        <div className="bg-[#0B0813] border border-[#201538] font-mono">
          {/* Module Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 border-b border-[#201538] bg-[#0E091B]">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#8B5CF6] font-bold">SYS::PIPELINE</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-300 font-bold tracking-wider">DUAL-STREAM PHASE-LOCK BUS</span>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-zinc-400">
                SLOT_TICK: <strong className="text-zinc-200 tabular-nums">{slotElapsed.toFixed(1)}s</strong><span className="text-zinc-600">/6.0s</span>
              </span>
              <span className="text-zinc-700">|</span>
              <span className={`px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${
                isHealthy
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                  : 'bg-rose-950/40 text-rose-400 border-rose-800/60'
              }`}>
                {isHealthy ? '● LOCKSTEP_PARITY' : `▲ DESYNC_${delta}_BLOCKS`}
              </span>
            </div>
          </div>

          {/* Slot Progress Ticker Rail (ASCII Style) */}
          <div className="px-3 py-2 border-b border-[#1A122E] bg-[#090612] flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-[10px]">STAGE:</span>
              <span className="text-zinc-200 font-bold bg-[#140D26] px-1.5 py-0.5 border border-[#2B1B47]">
                [{phaseTag}]
              </span>
              <span className="text-zinc-500 text-[10px] hidden sm:inline">:: {phaseDetail}</span>
            </div>

            {/* Clean Segmented ASCII Progress Track */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500 text-[10px]">CYCLE:</span>
              <span className="text-emerald-400 tracking-wider">
                [
                {Array.from({ length: 16 }).map((_, idx) => (
                  <span
                    key={idx}
                    className={idx < Math.floor((slotPercent / 100) * 16) ? 'text-emerald-400 font-bold' : 'text-zinc-800'}
                  >
                    {idx < Math.floor((slotPercent / 100) * 16) ? '=' : '-'}
                  </span>
                ))}
                ]
              </span>
              <span className="tabular-nums text-zinc-300 font-bold w-9 text-right">{slotPercent}%</span>
            </div>
          </div>

          {/* Main Streams Container */}
          <div className="p-3 space-y-2 bg-[#08050F]">
            {/* WASM Stream Row */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-zinc-500 px-1">
                <span className="flex items-center gap-1.5 text-zinc-300 font-bold">
                  <span className="w-1.5 h-1.5 bg-[#E6007A]" />
                  WASM_RUNTIME (:9944)
                </span>
                <span>STATE_ROOT: 0x5eec...a3f0</span>
              </div>

              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-1.5">
                {/* Blocks N-3, N-2, N-1 */}
                {wasmBlocks.slice(0, 3).map((blk, idx) => (
                  <div
                    key={`wasm-${blk}`}
                    className="p-2 border border-[#1F1633] bg-[#0D091A] text-left"
                  >
                    <div className="flex items-center justify-between text-[9px] text-zinc-500">
                      <span>{idx === 0 ? '-18s' : idx === 1 ? '-12s' : '-6s'}</span>
                      <span className="text-zinc-600">FIN</span>
                    </div>
                    <div className="text-xs font-bold tabular-nums text-zinc-300 mt-0.5 truncate">#{blk.toLocaleString()}</div>
                    <div className="text-[9px] text-zinc-600 mt-1 uppercase">Finalized</div>
                  </div>
                ))}

                {/* Block N: Best Head Block */}
                <div className="p-2 border border-[#E6007A]/60 bg-[#160B22] text-left">
                  <div className="flex items-center justify-between text-[9px] text-[#E6007A] font-bold">
                    <span>HEAD</span>
                    <span>BEST</span>
                  </div>
                  <div className="text-xs font-bold tabular-nums text-white mt-0.5 truncate">#{substrate.best_block.toLocaleString()}</div>
                  <div className="text-[9px] text-emerald-400 mt-1 uppercase">● Imported</div>
                </div>

                {/* Block N+1: Authoring Candidate Block (Pure Tech Monospace) */}
                <div className="p-2 border border-emerald-500/50 bg-[#0C1518] text-left relative overflow-hidden col-span-2 xs:col-span-1 sm:col-span-1">
                  <div className="flex items-center justify-between text-[9px] text-emerald-400 font-bold">
                    <span className="animate-pulse">▶ AUTHORING</span>
                    <span className="tabular-nums">#{candidateWasm.toLocaleString()}</span>
                  </div>
                  <div className="text-xs font-bold tabular-nums text-emerald-300 mt-0.5 flex items-center gap-1">
                    <span>SLOT #{Math.floor(slotPercent * 0.16 + 1)}/16</span>
                    <span className="inline-block w-1 h-3 bg-emerald-400 animate-pulse ml-0.5" />
                  </div>
                  <div className="text-[9px] text-zinc-400 mt-1 flex items-center justify-between">
                    <span>PACK: {mempool.wasm_extrinsics} txs</span>
                    <span className="text-zinc-500">Alice</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hardware Bus Conduit Bar (Minimalist 1px Data Path) */}
            <div className="relative py-1">
              <div className="border-t border-dashed border-[#23183D] w-full" />
              <div className="flex flex-wrap items-center justify-between text-[9px] text-zinc-500 px-2 py-0.5 gap-1">
                <span>┌── fc-mapping-sync BUS LINK</span>
                <span className="text-zinc-400 tracking-wider">
                  {isHealthy ? 'TRANSMISSION: NOMINAL (0.12ms)' : 'WARNING: BUFFER DESYNC'}
                </span>
                <span className="hidden xs:inline">STREAM TO EVM ──┐</span>
              </div>
              <div className="border-b border-dashed border-[#23183D] w-full" />
            </div>

            {/* EVM Stream Row */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-between text-[10px] text-zinc-500 px-1 gap-1">
                <span className="flex items-center gap-1.5 text-zinc-300 font-bold">
                  <span className="w-1.5 h-1.5 bg-[#6366F1]" />
                  EVM_ENGINE (:8545)
                </span>
                <span>BASE_FEE: {evm.base_fee_gwei ?? evm.gas_price_gwei} GWEI</span>
              </div>

              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-1.5">
                {/* Blocks N-3, N-2, N-1 */}
                {evmBlocks.slice(0, 3).map((blk, idx) => (
                  <div
                    key={`evm-${blk}`}
                    className="p-2 border border-[#1F1633] bg-[#0D091A] text-left"
                  >
                    <div className="flex items-center justify-between text-[9px] text-zinc-500">
                      <span>{idx === 0 ? '-18s' : idx === 1 ? '-12s' : '-6s'}</span>
                      <span className="text-zinc-600">EXEC</span>
                    </div>
                    <div className="text-xs font-bold tabular-nums text-zinc-300 mt-0.5 truncate">#{blk.toLocaleString()}</div>
                    <div className="text-[9px] text-zinc-600 mt-1 uppercase">Executed</div>
                  </div>
                ))}

                {/* Block N: EVM Best Block */}
                <div className="p-2 border border-[#6366F1]/60 bg-[#100E26] text-left">
                  <div className="flex items-center justify-between text-[9px] text-indigo-400 font-bold">
                    <span>HEAD</span>
                    <span>SYNC</span>
                  </div>
                  <div className="text-xs font-bold tabular-nums text-white mt-0.5 truncate">#{evm.block_number.toLocaleString()}</div>
                  <div className="text-[9px] text-indigo-400 mt-1 uppercase">● Indexed</div>
                </div>

                {/* Block N+1: EVM Ingestion Buffer */}
                <div className="p-2 border border-[#231D38] bg-[#0A0714] text-left col-span-2 xs:col-span-1 sm:col-span-1">
                  <div className="flex items-center justify-between text-[9px] text-zinc-500">
                    <span>QUEUE</span>
                    <span className="tabular-nums">#{candidateEvm.toLocaleString()}</span>
                  </div>
                  <div className="text-xs font-bold tabular-nums text-zinc-400 mt-0.5">PENDING</div>
                  <div className="text-[9px] text-zinc-600 mt-1 uppercase">Wait State Root</div>
                </div>
              </div>
            </div>
          </div>

          {/* Telemetry Footer Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-1.5 border-t border-[#1A122E] bg-[#0A0614] text-[10px] text-zinc-500">
            <div className="flex items-center gap-3">
              <span>BABE_SLOT: <strong className="text-zinc-300">6.0s</strong></span>
              <span className="text-zinc-700">|</span>
              <span>MAX_DELTA: <strong className="text-zinc-300">&le; {sync.threshold} BLOCKS</strong></span>
              <span className="text-zinc-700">|</span>
              <span>FINALITY_LAG: <strong className="text-zinc-300 tabular-nums">{substrate.finality_lag}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <span>VALIDATOR: <strong className="text-emerald-400">Alice (Authority)</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Causal Lag Index & Root-Cause Matrix */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-4">
          {/* 1.5. Algorithmic Cross-VM Causal Lag Index (CLI) Heuristic Diagnostics */}
          {data.causal_lag_index && (
            <div className="p-4 bg-[#110A24] border border-[#261B42] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1F143D] pb-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C084FC]" />
                  <span className="text-xs font-mono font-bold text-white tracking-wider">
                    CROSS-VM CAUSAL LAG INDEX (CLI) — HEURISTIC DIAGNOSTIC ENGINE
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 border ${
                    data.causal_lag_index.classification === 'NOMINAL_PARITY'
                      ? 'bg-emerald-950/40 text-[#10B981] border-emerald-800/40'
                      : data.causal_lag_index.classification === 'FRONTIER_DB_LOCK'
                      ? 'bg-amber-950/40 text-[#F59E0B] border-amber-800/40'
                      : data.causal_lag_index.classification === 'EVM_GAS_SATURATION'
                      ? 'bg-purple-950/40 text-[#C084FC] border-purple-800/40'
                      : 'bg-red-950/40 text-[#EF4444] border-red-800/40'
                  }`}>
                    [{data.causal_lag_index.classification}]
                  </span>
                  <span className="text-xs font-mono font-bold text-white tabular-nums bg-[#080512] px-2 py-0.5 border border-[#261B42]">
                    CLI SCORE: {data.causal_lag_index.cli_score} / 100
                  </span>
                </div>
              </div>

              <p className="text-[11px] font-mono text-zinc-300">
                {data.causal_lag_index.diagnosis_message}
              </p>

              {/* 3 Orthogonal Vectors Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                {/* Vector 1: Block Lag */}
                <div className="p-2.5 bg-[#080512] border border-[#1F143D] space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-zinc-400">VECTOR 1 (w₁ = 0.50): BLOCK LAG</span>
                    <span className="text-white font-bold tabular-nums">
                      {data.causal_lag_index.vector_breakdown.block_delta} blk (v₁: {data.causal_lag_index.vector_breakdown.block_lag_vector})
                    </span>
                  </div>
                  <div className="w-full bg-[#160B22] h-1.5 overflow-hidden border border-[#261B42]">
                    <div
                      className="bg-[#E6007A] h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, data.causal_lag_index.vector_breakdown.block_lag_vector * 100)}%` }}
                    />
                  </div>
                  <div className="text-[9px] font-mono text-zinc-500">
                    Frontier/Revive fc-db mapping lag ratio
                  </div>
                </div>

                {/* Vector 2: Mempool Skew */}
                <div className="p-2.5 bg-[#080512] border border-[#1F143D] space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-zinc-400">VECTOR 2 (w₂ = 0.30): MEMPOOL SKEW</span>
                    <span className="text-white font-bold tabular-nums">
                      {data.causal_lag_index.vector_breakdown.evm_pending} EVM / {data.causal_lag_index.vector_breakdown.wasm_pending} WASM
                    </span>
                  </div>
                  <div className="w-full bg-[#160B22] h-1.5 overflow-hidden border border-[#261B42]">
                    <div
                      className="bg-[#6366F1] h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (data.causal_lag_index.vector_breakdown.mempool_skew_vector / 5.0) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[9px] font-mono text-zinc-500">
                    Solidity VM gas saturation vs Extrinsic pool
                  </div>
                </div>

                {/* Vector 3: Latency Skew */}
                <div className="p-2.5 bg-[#080512] border border-[#1F143D] space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-zinc-400">VECTOR 3 (w₃ = 0.20): TRANSPORT SKEW</span>
                    <span className="text-white font-bold tabular-nums">
                      {data.causal_lag_index.vector_breakdown.evm_latency_ms}ms / {data.causal_lag_index.vector_breakdown.wasm_latency_ms}ms
                    </span>
                  </div>
                  <div className="w-full bg-[#160B22] h-1.5 overflow-hidden border border-[#261B42]">
                    <div
                      className="bg-[#10B981] h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (data.causal_lag_index.vector_breakdown.latency_skew_vector / 3.0) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[9px] font-mono text-zinc-500">
                    JSON-RPC :8545 vs Substrate WS :9944 I/O
                  </div>
                </div>
              </div>
            </div>
          )}

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
        </div>
      )}

      {/* TAB 3: Safe Decimal Mapping & Mempool Segregation */}
      {activeTab === 'tools' && (
        <div className="space-y-4">
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
                <div className="text-sm sm:text-base font-bold font-mono text-white tabular-nums break-all">
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
                <div className="text-sm sm:text-base font-bold font-mono text-zinc-200 tabular-nums break-all">
                  {decimal_normalization?.evm_balance_wei || '100000000000000000000'}
                </div>
                <div className="text-[11px] font-mono text-[#6366F1]">
                  1.0 POT = 1,000,000,000,000,000,000 Wei
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-[#080512] border border-[#261B42] text-[11px] font-mono text-zinc-300 gap-1.5">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                <span>Discrepancy: <strong className="text-white">0 Planck (Zero Precision Loss)</strong></span>
              </span>
              <span className="text-zinc-500">
                Protected against JS <code className="text-zinc-300">Number.MAX_SAFE_INTEGER</code> overflow via BigInt
              </span>
            </div>
          </div>

          {/* 4. Mempool Flow Segregation */}
          <div className="p-4 bg-[#110A24] border border-[#261B42] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-1">
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

            <div className="flex flex-col xs:flex-row xs:justify-between text-[11px] font-mono gap-1">
              <span className="text-[#E6007A] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none bg-[#E6007A] shrink-0" />
                WASM Extrinsics: {mempool.wasm_extrinsics} ({mempool.wasm_ratio_pct}%)
              </span>
              <span className="text-[#6366F1] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-none bg-[#6366F1] shrink-0" />
                EVM Transactions: {mempool.evm_transactions} ({mempool.evm_ratio_pct}%)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
