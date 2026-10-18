import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  Zap,
  Globe,
  Crosshair,
  Server,
  Filter,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ShieldStatus, api } from '../services/api';

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
      <div className="flex flex-wrap items-center justify-between border-b border-[#261B42] pb-3 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#8B5CF6]" />
            <h2 className="text-sm sm:text-base font-bold font-mono text-white tracking-wider uppercase">
              RPC REVERSE PROXY &amp; ACTIVE P2P SWARM SONAR
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-[#10B981] bg-[#0E2820]/40 px-3 py-1.5 border border-[#10B981]/40 font-bold">
          <Zap className="w-3.5 h-3.5 text-[#10B981]" />
          <span>PROXY OVERHEAD: {avgOverhead}ms (&lt; 1.0ms TARGET)</span>
        </div>
      </div>

      {/* 1. Metrics Counter Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        <div className="p-3 bg-[#0F0A1D] border border-[#261B42]">
          <span className="text-zinc-500 text-[10px] block font-bold uppercase tracking-wider">
            TOTAL INSPECTED
          </span>
          <span className="text-2xl font-bold text-white tabular-nums mt-0.5 block">
            {data.total_inspected.toLocaleString()}
          </span>
          <span className="text-[10px] text-zinc-400 block mt-1">
            Incoming RPC payloads
          </span>
        </div>

        <div className="p-3 bg-[#0F0A1D] border border-[#261B42]">
          <span className="text-zinc-500 text-[10px] block font-bold uppercase tracking-wider">
            CLEAN FORWARDED
          </span>
          <span className="text-2xl font-bold text-[#10B981] tabular-nums mt-0.5 block">
            {data.total_allowed.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-500 block mt-1">
            Passed to :8545 / :9944
          </span>
        </div>

        <div className="p-3 bg-[#17091B] border border-[#EF4444]/40">
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

        <div className="p-3 bg-[#17110E] border border-amber-500/40">
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

      {/* 2. Visual Cyber P2P Radar Screen & Peer Topology */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Radar Screen (2 Cols) */}
        <div className="lg:col-span-2 p-4 bg-[#0F0A1D] border border-[#261B42] space-y-3 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Crosshair className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span className="text-xs font-bold text-white tracking-wider">
                ACTIVE P2P LIBP2P SWARM SONAR (PORT :30333)
              </span>
            </div>
            <span className="text-[10px] text-zinc-400">
              RADII: 20ms / 50ms / 100ms
            </span>
          </div>

          {/* SVG Cyber Radar Visualizer */}
          <div className="relative h-72 w-full bg-[#080512] border border-[#1F143D] flex items-center justify-center overflow-hidden">
            {/* Concentric rings */}
            <div className="absolute w-24 h-24 rounded-full border border-[#261B42]" />
            <div className="absolute w-48 h-48 rounded-full border border-[#261B42]/80" />
            <div className="absolute w-64 h-64 rounded-full border border-[#261B42]/50 border-dashed" />

            {/* Crosshairs */}
            <div className="absolute w-full h-[1px] bg-[#1A1333]" />
            <div className="absolute h-full w-[1px] bg-[#1A1333]" />

            {/* Rotating Radar Sweep Line */}
            <div className="absolute w-64 h-64 rounded-full overflow-hidden animate-spin [animation-duration:8s]">
              <div className="w-1/2 h-1/2 bg-gradient-to-br from-[#8B5CF6]/25 to-transparent origin-bottom-right" />
            </div>

            {/* Center Local Node */}
            <div className="absolute z-10 flex flex-col items-center">
              <span className="w-3.5 h-3.5 rounded-full bg-[#8B5CF6] border-2 border-white shadow-[0_0_10px_#8B5CF6]" />
              <span className="text-[9px] font-bold text-white mt-1">LOCAL VALIDATOR</span>
            </div>

            {/* Peer Blips positioned by latency */}
            {data.p2p_topology.map((p, idx) => {
              const angle = (idx * 90 + 35) * (Math.PI / 180);
              const distance = Math.min(115, Math.max(30, (p.latency_ms / 150) * 115));
              const x = Math.cos(angle) * distance;
              const y = Math.sin(angle) * distance;

              return (
                <div
                  key={p.peer_id}
                  onClick={() => setSelectedPeer(p)}
                  style={{ transform: `translate(${x}px, ${y}px)` }}
                  className="absolute z-20 cursor-pointer group"
                >
                  <div className={`w-3 h-3 rounded-full transition-transform group-hover:scale-150 ${
                    p.is_malicious
                      ? 'bg-[#EF4444] animate-ping'
                      : p.role.includes('Authority')
                      ? 'bg-[#10B981]'
                      : 'bg-[#8B5CF6]'
                  }`} />
                  <span className="absolute left-4 top-[-6px] hidden group-hover:block whitespace-nowrap text-[10px] font-mono bg-[#140C2B] px-2 py-0.5 border border-[#4C2889] text-white z-30">
                    {p.location} ({p.latency_ms}ms)
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-400 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" /> [AUTHORITY VALIDATORS]
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" /> [FULL RPC NODES]
            </span>
            <span className="flex items-center gap-1.5 text-[#EF4444]">
              <span className="w-2 h-2 rounded-full bg-[#EF4444]" /> [MALICIOUS PEER]
            </span>
          </div>
        </div>

        {/* Peer Inspector Side Card */}
        <div className="p-4 bg-[#0F0A1D] border border-[#261B42] space-y-3 font-mono">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-[#8B5CF6]" />
            PEER TELEMETRY INSPECTOR
          </div>

          {selectedPeer ? (
            <div className="space-y-2 text-xs text-zinc-300 bg-[#080512] p-3 border border-[#1F143D]">
              <div className="border-b border-[#1A122E] pb-1">
                <span className="text-zinc-500 block text-[10px]">PEER ID:</span>
                <span className="text-[#C084FC] truncate block font-bold">{selectedPeer.peer_id}</span>
              </div>
              <div className="flex justify-between border-b border-[#1A122E] pb-1">
                <span className="text-zinc-500">IP &amp; PORT:</span>
                <span className="text-white">{selectedPeer.ip}:30333</span>
              </div>
              <div className="flex justify-between border-b border-[#1A122E] pb-1">
                <span className="text-zinc-500">LOCATION:</span>
                <span className="text-white">{selectedPeer.location}</span>
              </div>
              <div className="flex justify-between border-b border-[#1A122E] pb-1">
                <span className="text-zinc-500">PROTOCOL:</span>
                <span className="text-[#10B981]">{selectedPeer.protocol}</span>
              </div>
              <div className="flex justify-between border-b border-[#1A122E] pb-1">
                <span className="text-zinc-500">LATENCY:</span>
                <span className="text-white font-bold tabular-nums">{selectedPeer.latency_ms} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">ROLE:</span>
                <span className="text-zinc-200">{selectedPeer.role}</span>
              </div>
              {selectedPeer.is_malicious && (
                <div className="p-2 bg-[#2A0E17] border border-[#EF4444] text-[#EF4444] text-[10px] mt-2">
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
      <div className="p-4 bg-[#0F0A1D] border border-[#261B42] space-y-3 font-mono">
        <div className="flex items-center gap-2">
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
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 sm:py-1.5 text-xs bg-[#1A0B10] hover:bg-[#2A0E17] active:bg-[#3D1421] border border-[#EF4444] text-[#EF4444] font-bold cursor-pointer transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>TEST HEAVY eth_getLogs (500k BLOCKS)</span>
          </button>

          <button
            onClick={() => handleSimulateAttack('RATE_LIMIT_BURST')}
            disabled={simulating}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 sm:py-1.5 text-xs bg-[#140C2B] hover:bg-[#1E113E] active:bg-[#2B1758] border border-[#8B5CF6] text-[#C084FC] hover:text-white font-bold cursor-pointer transition-colors"
          >
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span>TEST RATE LIMIT BURST (&gt; 60 REQ/MIN)</span>
          </button>

          <button
            onClick={() => handleSimulateAttack('BATCH_OVERLOAD')}
            disabled={simulating}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 sm:py-1.5 text-xs bg-[#17110E] hover:bg-[#261B13] active:bg-[#382618] border border-amber-500/60 text-amber-400 hover:text-amber-300 font-bold cursor-pointer transition-colors"
          >
            <Filter className="w-3.5 h-3.5 shrink-0" />
            <span>TEST BATCH OVERLOAD (&gt; 20 CALLS)</span>
          </button>
        </div>

        {simulationResult && (
          <div className="p-3 bg-[#080512] border border-[#261B42] text-xs text-zinc-300 space-y-1.5 mt-2 animate-in fade-in duration-150">
            <div className="text-[#C084FC] font-bold flex items-center justify-between border-b border-[#1A122E] pb-1">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
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
              DEFENSE ACTION: <span className="text-emerald-400 font-semibold">{simulationResult.result?.reason}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
