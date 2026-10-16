import React, { useState } from 'react';
import {
  Shield,
  Radio,
  ShieldAlert,
  Zap,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  Terminal,
  Server,
  Crosshair
} from 'lucide-react';
import { ShieldStatus, api } from '../services/api';

interface TopologyRadarViewProps {
  data: ShieldStatus | null;
  onRefresh: () => void;
}

export const TopologyRadarView: React.FC<TopologyRadarViewProps> = ({ data, onRefresh }) => {
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [selectedPeer, setSelectedPeer] = useState<any | null>(null);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96 text-zinc-500 font-mono text-xs">
        Activating P2P Radar & RPC Shield...
      </div>
    );
  }

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
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex items-center justify-between border-b border-[#261B42] pb-4">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#8B5CF6]" />
            RPC Anti-Spam Reverse Proxy & P2P Topology Radar
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            256KB Socket Ceiling, batch limits, safe eth_getLogs parser, and live libp2p multiaddress sonar.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 bg-emerald-950/40 px-3 py-1.5 border border-emerald-800/40 font-bold">
          <Zap className="w-3.5 h-3.5" />
          PROXY OVERHEAD: {avgOverhead}ms (&lt; 1.0ms Target)
        </div>
      </div>

      {/* 1. Metrics Counter Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3.5 bg-[#110A24] border border-[#261B42]">
          <span className="text-zinc-500 font-mono text-[10px] block font-bold">TOTAL INSPECTED</span>
          <span className="text-2xl font-bold font-mono text-white tabular-nums">{data.total_inspected}</span>
          <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">Requests filtered</span>
        </div>

        <div className="p-3.5 bg-[#110A24] border border-[#261B42]">
          <span className="text-zinc-500 font-mono text-[10px] block font-bold">ALLOWED CLEAN</span>
          <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">{data.total_allowed}</span>
          <span className="text-[10px] text-emerald-500 font-mono block mt-0.5">Passed to :8545/:9944</span>
        </div>

        <div className="p-3.5 bg-[#17091B] border border-[#EF4444]/40 shadow-[0_0_12px_rgba(239,68,68,0.1)]">
          <span className="text-[#EF4444] font-mono text-[10px] block font-bold">BLOCKED ATTACKS</span>
          <span className="text-2xl font-bold font-mono text-[#EF4444] tabular-nums">{data.total_blocked}</span>
          <span className="text-[10px] text-red-400 font-mono block mt-0.5">Heavy spans &amp; JSON-bombs</span>
        </div>

        <div className="p-3.5 bg-[#17110E] border border-[#F59E0B]/40">
          <span className="text-[#F59E0B] font-mono text-[10px] block font-bold">THROTTLED (429)</span>
          <span className="text-2xl font-bold font-mono text-[#F59E0B] tabular-nums">{data.total_throttled}</span>
          <span className="text-[10px] text-amber-400 font-mono block mt-0.5">&gt; 60 req/min sliding cap</span>
        </div>
      </div>

      {/* 2. Visual Cyber P2P Radar Screen & Peer Topology */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Radar Screen (2 Cols) */}
        <div className="lg:col-span-2 p-4 bg-[#110A24] border border-[#261B42] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crosshair className="w-3.5 h-3.5 text-[#C084FC]" />
              <span className="text-xs font-mono font-bold text-white tracking-wider">
                ACTIVE P2P LIBP2P SWARM SONAR (PORT :30333)
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              Latency Distance Radii: 20ms / 50ms / 100ms
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
              <div className="w-1/2 h-1/2 bg-gradient-to-br from-[#8B5CF6]/30 to-transparent origin-bottom-right" />
            </div>

            {/* Center Local Node */}
            <div className="absolute z-10 flex flex-col items-center">
              <span className="w-3.5 h-3.5 rounded-full bg-[#8B5CF6] border-2 border-white shadow-[0_0_10px_#8B5CF6]" />
              <span className="text-[9px] font-mono font-bold text-white mt-1">LOCAL VALIDATOR</span>
            </div>

            {/* Peer Blips positioned by latency */}
            {data.p2p_topology.map((p, idx) => {
              // Deterministic positions based on latency
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
                      ? 'bg-[#EF4444] animate-ping shadow-[0_0_8px_#EF4444]'
                      : p.role.includes('Authority')
                      ? 'bg-[#10B981] shadow-[0_0_8px_#10B981]'
                      : 'bg-[#6366F1]'
                  }`} />
                  <span className="absolute left-4 top-[-6px] hidden group-hover:block whitespace-nowrap text-[10px] font-mono bg-[#180E30] px-2 py-0.5 border border-[#4C2889] text-white z-30">
                    {p.location} ({p.latency_ms}ms)
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Authority Validator Peers
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#6366F1]" /> Full RPC Nodes
            </span>
            <span className="flex items-center gap-1.5 text-[#EF4444]">
              <span className="w-2 h-2 rounded-full bg-[#EF4444]" /> Flagged Malicious Peer
            </span>
          </div>
        </div>

        {/* Peer Inspector Side Card */}
        <div className="p-4 bg-[#110A24] border border-[#261B42] space-y-3">
          <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-[#C084FC]" />
            PEER INSPECTOR
          </div>

          {selectedPeer ? (
            <div className="space-y-2 text-xs font-mono text-zinc-300 bg-[#080512] p-3 border border-[#1F143D]">
              <div><span className="text-zinc-500">Peer ID:</span> <span className="text-[#C084FC] truncate block">{selectedPeer.peer_id}</span></div>
              <div><span className="text-zinc-500">IP &amp; Port:</span> <span className="text-white">{selectedPeer.ip}:30333</span></div>
              <div><span className="text-zinc-500">Location:</span> <span className="text-white">{selectedPeer.location}</span></div>
              <div><span className="text-zinc-500">Protocol:</span> <span className="text-emerald-400">{selectedPeer.protocol}</span></div>
              <div><span className="text-zinc-500">Latency:</span> <span className="text-white font-bold">{selectedPeer.latency_ms} ms</span></div>
              <div><span className="text-zinc-500">Role:</span> <span className="text-zinc-200">{selectedPeer.role}</span></div>
              {selectedPeer.is_malicious && (
                <div className="p-2 bg-red-950/40 border border-red-800/40 text-red-300 text-[10px]">
                  <strong>ANOMALY:</strong> {selectedPeer.anomaly}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-zinc-500 font-mono text-xs">
              Click any blip on the Radar to inspect Multiaddress telemetry.
            </div>
          )}
        </div>
      </div>

      {/* 3. Reverse Proxy Attack Sieve & Simulation Launchpad */}
      <div className="p-4 bg-[#110A24] border border-[#261B42] space-y-3">
        <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[#8B5CF6]" />
          REVERSE PROXY DEFENSE DRILL SIMULATOR
        </div>
        <p className="text-xs text-zinc-400">
          Inject real simulated attack vectors to prove that memory exhaustion (OOM), batch floods, and storage scans are neutralized.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleSimulateAttack('HEAVY_GETLOGS')}
            disabled={simulating}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono bg-[#EF4444]/15 hover:bg-[#EF4444]/25 border border-[#EF4444]/40 text-[#EF4444] font-bold cursor-pointer transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Fire Heavy eth_getLogs (500k blocks span)
          </button>

          <button
            onClick={() => handleSimulateAttack('RATE_LIMIT_BURST')}
            disabled={simulating}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono bg-[#F59E0B]/15 hover:bg-[#F59E0B]/25 border border-[#F59E0B]/40 text-[#F59E0B] font-bold cursor-pointer transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            Fire Burst Spam (&gt; 60 req/min)
          </button>
        </div>

        {simulationResult && (
          <div className="p-3 bg-[#080512] border border-[#261B42] text-xs font-mono text-zinc-300 space-y-1">
            <div className="text-[#C084FC] font-bold">Attack Defense Output:</div>
            <div>Attack Type: <strong className="text-white">{simulationResult.attack_type}</strong></div>
            <div>
              Decision: <strong className={simulationResult.result?.decision === 'BLOCKED' ? 'text-[#EF4444]' : 'text-[#F59E0B]'}>
                {simulationResult.result?.decision || 'PROCESSED'}
              </strong>
            </div>
            <div className="text-zinc-400">{simulationResult.result?.reason}</div>
          </div>
        )}
      </div>
    </div>
  );
};
