import React, { useState } from 'react';
import { Shield, Radio, ShieldAlert, Zap, Globe, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ShieldStatus, api } from '../services/api';

interface TopologyRadarViewProps {
  data: ShieldStatus | null;
  onRefresh: () => void;
}

export const TopologyRadarView: React.FC<TopologyRadarViewProps> = ({ data, onRefresh }) => {
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);

  if (!data) {
    return <div className="text-zinc-500 font-mono text-xs">Loading RPC Shield & Topology...</div>;
  }

  const handleSimulateAttack = async (type: 'HEAVY_GETLOGS' | 'RATE_LIMIT_BURST') => {
    setSimulating(true);
    try {
      const res = await api.simulateShieldAttack(type);
      if (res.success) {
        setSimulationResult(res.data);
        onRefresh();
      }
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white tracking-wide flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#8B5CF6]" />
            RPC Anti-Spam Shield & P2P Topology Map
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Heavy query filtering (eth_getLogs), dynamic IP rate-limiting, and network peer telemetry.
          </p>
        </div>
      </div>

      {/* Metrics Counter Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="tech-corner-accent p-3.5 rounded-none border border-[#261B42] bg-[#110A24]">
          <span className="text-zinc-500 font-mono text-[10px] block font-bold">TOTAL INSPECTED</span>
          <span className="text-xl font-bold font-mono text-white tabular-nums">{data.total_inspected}</span>
        </div>

        <div className="tech-corner-accent p-3.5 rounded-none border border-[#261B42] bg-[#110A24]">
          <span className="text-zinc-500 font-mono text-[10px] block font-bold">ALLOWED REQUESTS</span>
          <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">{data.total_allowed}</span>
        </div>

        <div className="tech-corner-accent p-3.5 rounded-none border border-[#EF4444]/40 bg-[#17091B]">
          <span className="text-[#EF4444] font-mono text-[10px] block font-bold">BLOCKED ATTACKS</span>
          <span className="text-xl font-bold font-mono text-[#EF4444] tabular-nums">{data.total_blocked}</span>
        </div>

        <div className="tech-corner-accent p-3.5 rounded-none border border-[#F59E0B]/40 bg-[#17110E]">
          <span className="text-[#F59E0B] font-mono text-[10px] block font-bold">THROTTLED (429)</span>
          <span className="text-xl font-bold font-mono text-[#F59E0B] tabular-nums">{data.total_throttled}</span>
        </div>
      </div>

      {/* Attack Simulator Testing Suite */}
      <div className="tech-corner-accent p-4 rounded-none border border-[#261B42] bg-[#110A24] space-y-3">
        <div className="text-xs font-mono font-semibold text-white flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[#8B5CF6]" />
          RPC SHIELD DEFENSE SIMULATOR
        </div>
        <p className="text-xs text-zinc-400">
          Trigger simulated malicious payloads to verify that OOM memory crashes and brute-force flooding are neutralized in realtime.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleSimulateAttack('HEAVY_GETLOGS')}
            disabled={simulating}
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-none bg-[#EF4444]/15 hover:bg-[#EF4444]/25 border border-[#EF4444]/40 text-[#EF4444] transition-colors cursor-pointer font-bold"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Test Heavy eth_getLogs (500,000 blocks span)
          </button>

          <button
            onClick={() => handleSimulateAttack('RATE_LIMIT_BURST')}
            disabled={simulating}
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-none bg-[#F59E0B]/15 hover:bg-[#F59E0B]/25 border border-[#F59E0B]/40 text-[#F59E0B] transition-colors cursor-pointer font-bold"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Test IP Rate-Limit Burst (65 reqs in short span)
          </button>
        </div>

        {simulationResult && (
          <div className="p-3 rounded-none bg-[#080512] border border-[#261B42] text-xs font-mono space-y-1">
            <div className="text-[#10B981] font-bold">Shield Response:</div>
            <pre className="text-zinc-300 text-[11px] overflow-x-auto bg-[#110A24] p-2 rounded-none border border-[#261B42]">
              {JSON.stringify(simulationResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* P2P Network Topology Peer Map */}
      <div className="tech-corner-accent p-4 rounded-none border border-[#261B42] bg-[#110A24] space-y-3">
        <div className="text-xs font-mono font-semibold text-zinc-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-[#8B5CF6]" />
            P2P TOPOLOGY PEER TELEMETRY
          </span>
          <span className="text-zinc-500 text-[11px]">Consensus & Full Node Mesh</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#261B42] text-zinc-500">
                <th className="py-2">Peer IP / ID</th>
                <th className="py-2">Location</th>
                <th className="py-2">Client Version</th>
                <th className="py-2">Role</th>
                <th className="py-2">Latency</th>
                <th className="py-2">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#261B42]/50 text-zinc-300">
              {data.p2p_topology.map((p, i) => (
                <tr key={i} className="hover:bg-[#1A1333]">
                  <td className="py-2">
                    <div className="text-white font-medium">{p.ip}</div>
                    <div className="text-[10px] text-zinc-500">{p.peer_id.slice(0, 16)}...</div>
                  </td>
                  <td className="py-2 text-zinc-400">{p.location}</td>
                  <td className="py-2 text-zinc-300">{p.client_version}</td>
                  <td className="py-2 text-[#C084FC]">{p.role}</td>
                  <td className="py-2 text-emerald-400">{p.latency_ms} ms</td>
                  <td className="py-2">
                    {p.is_malicious ? (
                      <span className="px-1.5 py-0.5 rounded bg-[#EF4444]/20 text-[#EF4444] font-bold">
                        SUSPICIOUS
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-bold">
                        HEALTHY
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
