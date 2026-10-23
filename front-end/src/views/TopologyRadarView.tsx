import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  Zap,
  Globe,
  Server,
  Filter,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ShieldStatus, api } from '../services/api';
import { CyberWorldMap } from '../components/CyberWorldMap';

interface TopologyRadarViewProps {
  data: ShieldStatus;
  onRefresh: () => void;
}

export const TopologyRadarView: React.FC<TopologyRadarViewProps> = ({ data, onRefresh }) => {
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [selectedPeer, setSelectedPeer] = useState<any | null>(null);

  const handleSimulateAttack = async (type: 'HEAVY_GETLOGS' | 'RATE_LIMIT_BURST' | 'BATCH_OVERLOAD') => {
    setSimulating(true);
    try {
      const res = await api.simulateShieldAttack(type as any);
      if (res.success) {
        setSimulationResult(res.data);
        onRefresh();
      }
    } finally {
      setSimulating(false);
    }
  };

  const avgOverhead = data.average_overhead_ms || 0.24;

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#1C142E] pb-2.5 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#8B5CF6]" />
            <h2 className="text-xs sm:text-sm font-bold font-mono text-white tracking-widest uppercase">
              RPC REVERSE PROXY &amp; ACTIVE P2P GLOBAL TOPOLOGY
            </h2>
            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#0E091B] text-[#C084FC] border border-[#2E1F4A]">
              SECURITY SHIELD
            </span>
          </div>
          <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
            Hardened reverse proxy with sub-millisecond AST sanitization and real-time libp2p global topology mesh.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-[#00FF9D] bg-[#00FF9D]/10 px-2.5 py-1 border border-[#00FF9D]/30 font-bold">
          <Zap className="w-3.5 h-3.5 text-[#00FF9D]" />
          <span>PROXY OVERHEAD: {avgOverhead}ms (&lt; 1.0ms TARGET)</span>
        </div>
      </div>

      {/* 1. Metrics Counter Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        <div className="p-3 bg-[#08050F] border border-[#1C142E]">
          <span className="text-zinc-500 text-[10px] block font-bold uppercase tracking-wider">
            TOTAL INSPECTED
          </span>
          <span className="text-2xl font-bold text-white tabular-nums mt-0.5 block">
            {data.total_inspected.toLocaleString()}
          </span>
          <span className="text-[10px] text-zinc-500 block mt-1">
            Incoming RPC payloads
          </span>
        </div>

        <div className="p-3 bg-[#08050F] border border-[#1C142E]">
          <span className="text-zinc-500 text-[10px] block font-bold uppercase tracking-wider">
            CLEAN FORWARDED
          </span>
          <span className="text-2xl font-bold text-[#00FF9D] tabular-nums mt-0.5 block">
            {data.total_allowed.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-500 block mt-1">
            Passed to :8545 / :9944
          </span>
        </div>

        <div className="p-3 bg-[#14080D] border border-rose-800/40">
          <span className="text-[#EF4444] text-[10px] block font-bold uppercase tracking-wider">
            BLOCKED ATTACKS
          </span>
          <span className="text-2xl font-bold text-[#EF4444] tabular-nums mt-0.5 block">
            {data.total_blocked.toLocaleString()}
          </span>
          <span className="text-[10px] text-rose-400 block mt-1">
            Heavy spans &amp; JSON-bombs
          </span>
        </div>

        <div className="p-3 bg-[#140E06] border border-amber-800/40">
          <span className="text-amber-400 text-[10px] block font-bold uppercase tracking-wider">
            THROTTLED (429)
          </span>
          <span className="text-2xl font-bold text-amber-400 tabular-nums mt-0.5 block">
            {data.total_throttled.toLocaleString()}
          </span>
          <span className="text-[10px] text-amber-500 block mt-1">
            &gt; 60 req/min sliding cap
          </span>
        </div>
      </div>

      {/* 2. Visual Cyber P2P Global Topology Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Visual Map Screen (2 Cols) */}
        <div className="lg:col-span-2 p-4 bg-[#08050F] border border-[#1C142E] space-y-3 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1C142E] pb-2">
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-[#00FF9D]" />
              <span className="text-xs font-bold text-white tracking-wider">
                ACTIVE P2P LIBP2P GLOBAL TOPOLOGY (PORT :30333)
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">
              EQUIRECTANGULAR WGS84 &bull; LIVE P2P GOSSIP
            </span>
          </div>

          {/* Render Active View: Global Cyber Map */}
          <CyberWorldMap
            peers={data.p2p_topology}
            selectedPeer={selectedPeer}
            onSelectPeer={setSelectedPeer}
          />

          {/* Legend strip */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-500 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00FF9D]" /> [AUTHORITY VALIDATORS]
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" /> [FULL RPC NODES]
            </span>
            <span className="flex items-center gap-1.5 text-[#EF4444]">
              <span className="w-2 h-2 rounded-full bg-[#EF4444]" /> [MALICIOUS PEER]
            </span>
            <span className="flex items-center gap-1.5 text-[#38BDF8]">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8]" /> [LOCAL VALIDATOR]
            </span>
          </div>
        </div>

        {/* Peer Inspector Side Card */}
        <div className="p-4 bg-[#08050F] border border-[#1C142E] space-y-3 font-mono">
          <div className="text-xs font-bold text-white flex items-center gap-2 border-b border-[#1C142E] pb-2">
            <Globe className="w-3.5 h-3.5 text-[#8B5CF6]" />
            PEER TELEMETRY INSPECTOR
          </div>

          {selectedPeer ? (
            <div className="space-y-2 text-xs text-zinc-300 bg-[#06040A] p-3 border border-[#1C142E]">
              <div className="border-b border-[#140D24] pb-1">
                <span className="text-zinc-500 block text-[10px]">PEER ID:</span>
                <span className="text-[#C084FC] truncate block font-bold">{selectedPeer.peer_id}</span>
              </div>
              <div className="flex justify-between border-b border-[#140D24] pb-1">
                <span className="text-zinc-500">IP &amp; PORT:</span>
                <span className="text-white">{selectedPeer.ip}:30333</span>
              </div>
              <div className="flex justify-between border-b border-[#140D24] pb-1">
                <span className="text-zinc-500">LOCATION:</span>
                <span className="text-white">{selectedPeer.location}</span>
              </div>
              <div className="flex justify-between border-b border-[#140D24] pb-1">
                <span className="text-zinc-500">PROTOCOL:</span>
                <span className="text-[#00FF9D]">{selectedPeer.protocol}</span>
              </div>
              <div className="flex justify-between border-b border-[#140D24] pb-1">
                <span className="text-zinc-500">LATENCY:</span>
                <span className="text-white font-bold tabular-nums">{selectedPeer.latency_ms} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">ROLE:</span>
                <span className="text-zinc-200">{selectedPeer.role}</span>
              </div>
              {selectedPeer.is_malicious && (
                <div className="p-2 bg-[#14080D] border border-[#EF4444] text-[#EF4444] text-[10px] mt-2">
                  <strong>MALICIOUS ANOMALY:</strong> {selectedPeer.anomaly}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-zinc-500 text-xs">
              [Click any peer blip on the Sonar to inspect multiaddress telemetry]
            </div>
          )}
        </div>
      </div>

      {/* 3. Reverse Proxy Attack Sieve & Simulation Launchpad */}
      <div className="p-4 bg-[#08050F] border border-[#1C142E] space-y-3 font-mono">
        <div className="flex items-center gap-2 border-b border-[#1C142E] pb-2">
          <Zap className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span className="text-xs font-bold text-white tracking-wider">
            REVERSE PROXY ATTACK DEFENSE DRILL SIMULATOR
          </span>
        </div>
        <p className="text-xs text-zinc-400">
          Inject real simulated attack vectors to prove that memory exhaustion (OOM), batch floods, and storage scans are neutralized.
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
          <button
            onClick={() => handleSimulateAttack('HEAVY_GETLOGS')}
            disabled={simulating}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 sm:py-1.5 text-xs bg-[#14080D] hover:bg-[#EF4444] text-[#EF4444] hover:text-white font-bold border border-[#EF4444]/60 cursor-pointer transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>TEST HEAVY eth_getLogs (500k BLOCKS)</span>
          </button>

          <button
            onClick={() => handleSimulateAttack('RATE_LIMIT_BURST')}
            disabled={simulating}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 sm:py-1.5 text-xs bg-[#110C1E] hover:bg-[#1A102E] border border-[#2E1F4A] hover:border-[#8B5CF6] text-zinc-200 hover:text-white font-bold cursor-pointer transition-colors"
          >
            <Zap className="w-3.5 h-3.5 shrink-0 text-[#C084FC]" />
            <span>TEST RATE LIMIT BURST (&gt; 60 REQ/MIN)</span>
          </button>

          <button
            onClick={() => handleSimulateAttack('BATCH_OVERLOAD')}
            disabled={simulating}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 sm:py-1.5 text-xs bg-[#140E06] hover:bg-[#261B13] border border-amber-500/40 text-amber-400 font-bold cursor-pointer transition-colors"
          >
            <Filter className="w-3.5 h-3.5 shrink-0" />
            <span>TEST BATCH OVERLOAD (&gt; 20 CALLS)</span>
          </button>
        </div>

        {simulationResult && (
          <div className="p-3 bg-[#06040A] border border-[#1C142E] text-xs text-zinc-300 space-y-1.5 mt-2 animate-in fade-in duration-150">
            <div className="text-[#C084FC] font-bold flex items-center justify-between border-b border-[#140D24] pb-1">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF9D]" />
                RPC DEFENSE VERDICT:
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${
                simulationResult.result?.decision === 'BLOCKED'
                  ? 'bg-rose-950/40 text-rose-400 border-rose-800/60'
                  : 'bg-amber-950/40 text-amber-400 border-amber-800/60'
              }`}>
                [{simulationResult.result?.decision || 'PROCESSED'}]
              </span>
            </div>
            <div className="text-zinc-400 text-[11px]">
              TARGET VECTOR: <strong className="text-white">{simulationResult.attack_type}</strong>
            </div>
            <div className="text-zinc-300 text-[11px] leading-relaxed">
              DEFENSE ACTION: <span className="text-[#00FF9D] font-semibold">{simulationResult.result?.reason}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
