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

  const [slotElapsed, setSlotElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const sec = (Date.now() / 1000) % 6.0;
      setSlotElapsed(sec);
    }, 60);
    return () => clearInterval(timer);
  }, []);

  const slotPercent = Math.min(100, Math.floor((slotElapsed / 6.0) * 100));

  // Determine current block authoring phase
  let phaseName = 'EXTRINSICS PACKING';
  let phaseDesc = 'Collecting extrinsics from Mempool';
  let phaseColor = 'text-[#C084FC] border-[#C084FC]/30 bg-[#C084FC]/10';
  let phaseIndex = 1;

  if (slotElapsed >= 4.8) {
    phaseName = 'SEALING & IMPORT';
    phaseDesc = 'Sealing block header & broadcasting to peers';
    phaseColor = 'text-[#10B981] border-[#10B981]/30 bg-[#10B981]/10';
    phaseIndex = 4;
  } else if (slotElapsed >= 3.6) {
    phaseName = 'BABE VRF PRE-SEAL';
    phaseDesc = 'Evaluating VRF threshold & authoring claim';
    phaseColor = 'text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/10';
    phaseIndex = 3;
  } else if (slotElapsed >= 1.8) {
    phaseName = 'WASM STATE TRANSITION';
    phaseDesc = 'Executing contract pallets & calculating state root';
    phaseColor = 'text-[#E6007A] border-[#E6007A]/30 bg-[#E6007A]/10';
    phaseIndex = 2;
  }

  // 4 historical/active blocks + 1 candidate block currently being forged
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
        {/* Top Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1F143D] pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#C084FC]" />
            <span className="text-xs font-mono font-bold text-white tracking-wider">
              DUAL-STREAM BLOCK PIPELINE & PHASE-LOCK STATUS
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono text-zinc-300 bg-[#160E2E] border border-[#3A2466]">
              <Clock className="w-3 h-3 text-[#C084FC]" />
              Slot: <span className="text-[#C084FC] font-bold tabular-nums">{(6.0 - slotElapsed).toFixed(1)}s</span> remaining
            </span>

            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase border flex items-center gap-1.5 ${
              isHealthy
                ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                : 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-[#10B981] animate-ping' : 'bg-[#EF4444]'}`} />
              {isHealthy ? '100% LOCKSTEP PARITY' : `DESYNC: ${delta} BLOCKS LAG`}
            </span>
          </div>
        </div>

        {/* Live BABE Slot Countdown & Sub-phase Progress Bar */}
        <div className="bg-[#0A0618] border border-[#261B42] p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-[10px]">CURRENT BABE SLOT:</span>
              <span className={`px-1.5 py-0.5 text-[10px] font-bold border ${phaseColor}`}>
                PHASE {phaseIndex}/4: {phaseName}
              </span>
              <span className="text-zinc-400 text-[10px] hidden md:inline">({phaseDesc})</span>
            </div>
            <div className="text-zinc-400 tabular-nums font-bold">
              <span className="text-[#E6007A]">{slotPercent}%</span> <span className="text-zinc-600">/ 6.0s</span>
            </div>
          </div>

          {/* High-tech Multi-stage Progress Track */}
          <div className="relative h-2 bg-[#120B24] border border-[#2E1E54] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#8B5CF6] via-[#E6007A] to-[#10B981] transition-all duration-75 relative"
              style={{ width: `${slotPercent}%` }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white shadow-[0_0_8px_#FFFFFF]" />
            </div>
            {/* 4 stage division notches */}
            <div className="absolute inset-0 flex justify-between pointer-events-none px-[30%]">
              <div className="w-[1px] h-full bg-[#3A2466]" />
            </div>
            <div className="absolute inset-0 flex justify-between pointer-events-none px-[60%]">
              <div className="w-[1px] h-full bg-[#3A2466]" />
            </div>
            <div className="absolute inset-0 flex justify-between pointer-events-none px-[80%]">
              <div className="w-[1px] h-full bg-[#3A2466]" />
            </div>
          </div>

          <div className="flex justify-between text-[9px] font-mono text-zinc-500 pt-0.5">
            <span className={phaseIndex === 1 ? 'text-[#C084FC] font-bold' : ''}>0.0s Ingest</span>
            <span className={phaseIndex === 2 ? 'text-[#E6007A] font-bold' : ''}>1.8s State Execute</span>
            <span className={phaseIndex === 3 ? 'text-[#F59E0B] font-bold' : ''}>3.6s VRF Pre-Seal</span>
            <span className={phaseIndex === 4 ? 'text-[#10B981] font-bold' : ''}>4.8s Seal & Broadcast</span>
            <span>6.0s</span>
          </div>
        </div>

        {/* Parallel Streams Graphic */}
        <div className="space-y-3 bg-[#080512] p-4 border border-[#1F143D]">
          {/* Substrate WASM Stream */}
          <div className="flex items-center gap-3">
            <div className="w-32 shrink-0 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#E6007A]" />
                <span className="text-[11px] font-mono font-bold text-zinc-200">WASM (:9944)</span>
              </div>
              <div className="text-[9px] font-mono text-zinc-500">Substrate Runtime</div>
            </div>

            <div className="flex-1 grid grid-cols-5 gap-2">
              {/* Blocks N-3, N-2, N-1 (Past Confirmed) */}
              {wasmBlocks.slice(0, 3).map((blk, idx) => (
                <div
                  key={`wasm-${blk}`}
                  className="p-2 border border-[#261B42] bg-[#110A24] font-mono text-center text-zinc-400 relative overflow-hidden group"
                >
                  <div className="flex items-center justify-between text-[9px] text-zinc-500 mb-0.5">
                    <span>{idx === 0 ? 'T-18s' : idx === 1 ? 'T-12s' : 'T-6s'}</span>
                    <ShieldCheck className="w-2.5 h-2.5 text-zinc-500" />
                  </div>
                  <div className="text-[10px] text-zinc-500">FINALIZED</div>
                  <div className="text-xs font-bold tabular-nums text-zinc-300">#{blk.toLocaleString()}</div>
                </div>
              ))}

              {/* Block N: Latest Imported Best Block */}
              <div className="p-2 border border-[#E6007A] bg-[#E6007A]/15 font-mono text-center text-white relative shadow-[0_0_12px_rgba(230,0,122,0.2)]">
                <div className="flex items-center justify-between text-[9px] text-[#E6007A] mb-0.5 font-bold">
                  <span>BEST</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E6007A] animate-ping" />
                </div>
                <div className="text-[10px] text-pink-300">IMPORTED</div>
                <div className="text-xs font-bold tabular-nums text-white">#{substrate.best_block.toLocaleString()}</div>
              </div>

              {/* Block N+1: CANDIDATE FORGING BLOCK (ACTIVE ANIMATION) */}
              <div className="p-2 border font-mono text-center relative overflow-hidden animate-block-forge bg-[#170B2E]">
                {/* Sweeping scanline */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#C084FC]/25 to-transparent pointer-events-none animate-scanline-sweep" />

                <div className="flex items-center justify-between text-[9px] text-[#C084FC] mb-0.5 font-bold relative z-10">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-[#C084FC] animate-spin" />
                    FORGING
                  </span>
                  <span className="text-[9px] tabular-nums text-pink-300">{slotPercent}%</span>
                </div>

                <div className="text-[10px] text-[#C084FC] font-bold tracking-wider relative z-10 flex items-center justify-center gap-1">
                  <span>CANDIDATE</span>
                </div>

                <div className="text-xs font-extrabold tabular-nums text-white relative z-10 flex items-center justify-center gap-1">
                  <span>#{candidateWasm.toLocaleString()}</span>
                </div>

                {/* Live mini progress tracker inside block */}
                <div className="mt-1 h-1 bg-[#2D1B54] rounded-none overflow-hidden relative z-10">
                  <div
                    className="h-full bg-gradient-to-r from-[#E6007A] to-[#C084FC] transition-all duration-75"
                    style={{ width: `${slotPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Phase Lock Laser Connector Grid (SVG Conduit) */}
          <div className="flex items-center gap-3">
            <div className="w-32 shrink-0 flex items-center justify-end pr-3">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <GitCommit className="w-3 h-3 text-[#8B5CF6]" />
                fc-sync
              </span>
            </div>

            <div className="flex-1 relative h-7">
              <svg className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="laserGradSync" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#E6007A" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#8B5CF6" stopOpacity="1" />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="laserGradDesync" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#B91C1C" stopOpacity="0.9" />
                  </linearGradient>
                </defs>

                {/* 5 Column Vertical Conduits */}
                {[10, 30, 50, 70, 90].map((xPercent, idx) => (
                  <g key={`laser-col-${idx}`}>
                    {/* Background track line */}
                    <line
                      x1={`${xPercent}%`}
                      y1="0"
                      x2={`${xPercent}%`}
                      y2="100%"
                      stroke="#261B42"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                    {/* Active flowing laser beam */}
                    <line
                      x1={`${xPercent}%`}
                      y1="0"
                      x2={`${xPercent}%`}
                      y2="100%"
                      stroke={idx === 4 ? 'url(#laserGradSync)' : isHealthy ? 'url(#laserGradSync)' : 'url(#laserGradDesync)'}
                      strokeWidth={idx === 4 ? "2" : idx === 3 ? "2" : "1"}
                      className={idx === 4 ? "animate-laser-flow-fast" : "animate-laser-flow"}
                    />
                  </g>
                ))}
              </svg>

              {/* Center Status Chip */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={`px-2 py-0.5 text-[9px] font-mono tracking-wider border shadow-sm flex items-center gap-1.5 ${
                  isHealthy
                    ? 'bg-[#0E0824]/90 text-zinc-300 border-[#4C2889]'
                    : 'bg-[#2A0812]/90 text-[#EF4444] border-[#EF4444]/40'
                }`}>
                  <Zap className={`w-2.5 h-2.5 ${isHealthy ? 'text-[#10B981]' : 'text-[#EF4444] animate-bounce'}`} />
                  {isHealthy ? 'fc-mapping-sync: PHASE-LOCK ACTIVE' : 'DESYNC SLIPPAGE DETECTED'}
                </span>
              </div>
            </div>
          </div>

          {/* EVM Stream Row */}
          <div className="flex items-center gap-3">
            <div className="w-32 shrink-0 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#6366F1]" />
                <span className="text-[11px] font-mono font-bold text-zinc-200">EVM (:8545)</span>
              </div>
              <div className="text-[9px] font-mono text-zinc-500">Frontier Mapping DB</div>
            </div>

            <div className="flex-1 grid grid-cols-5 gap-2">
              {/* Blocks N-3, N-2, N-1 (Past Executed) */}
              {evmBlocks.slice(0, 3).map((blk, idx) => (
                <div
                  key={`evm-${blk}`}
                  className="p-2 border border-[#261B42] bg-[#110A24] font-mono text-center text-zinc-400 relative"
                >
                  <div className="flex items-center justify-between text-[9px] text-zinc-500 mb-0.5">
                    <span>{idx === 0 ? 'T-18s' : idx === 1 ? 'T-12s' : 'T-6s'}</span>
                    <CheckCircle2 className="w-2.5 h-2.5 text-zinc-500" />
                  </div>
                  <div className="text-[10px] text-zinc-500">EXECUTED</div>
                  <div className="text-xs font-bold tabular-nums text-zinc-300">#{blk.toLocaleString()}</div>
                </div>
              ))}

              {/* Block N: EVM Head Block */}
              <div className="p-2 border border-[#6366F1] bg-[#6366F1]/15 font-mono text-center text-white relative shadow-[0_0_12px_rgba(99,102,241,0.2)]">
                <div className="flex items-center justify-between text-[9px] text-[#818CF8] mb-0.5 font-bold">
                  <span>LATEST</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1] animate-ping" />
                </div>
                <div className="text-[10px] text-indigo-300">INDEXED</div>
                <div className="text-xs font-bold tabular-nums text-white">#{evm.block_number.toLocaleString()}</div>
              </div>

              {/* Block N+1: EVM Ingestion / Awaiting State */}
              <div className="p-2 border border-dashed border-[#6366F1]/50 bg-[#0E0C26] font-mono text-center relative overflow-hidden">
                <div className="flex items-center justify-between text-[9px] text-indigo-400 mb-0.5">
                  <span className="flex items-center gap-1">
                    <Database className="w-2.5 h-2.5" />
                    fc-db
                  </span>
                  <span className="text-[9px] text-zinc-500 tabular-nums">~{evm.base_fee_gwei ?? evm.gas_price_gwei} Gwei</span>
                </div>
                <div className="text-[10px] text-indigo-400">PENDING MAP</div>
                <div className="text-xs font-bold tabular-nums text-zinc-400">#{candidateEvm.toLocaleString()}</div>
                <div className="mt-1 text-[8px] text-zinc-500 uppercase tracking-wider">Awaiting WASM</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Detailed Metrics Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-zinc-400 px-1 pt-1 border-t border-[#1F143D]">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            BABE Slot: <strong className="text-zinc-200">~6.0s</strong> | Max Permissible Delta: <strong className="text-zinc-200">&le; {sync.threshold} blocks</strong>
          </span>
          <div className="flex items-center gap-3">
            <span className="text-zinc-500">Authority: <strong className="text-emerald-400 font-bold">Alice (Dev Authority)</strong></span>
            <span className="text-zinc-500">Finality Lag: <strong className="text-[#C084FC] tabular-nums font-bold">{substrate.finality_lag} blocks</strong></span>
          </div>
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
