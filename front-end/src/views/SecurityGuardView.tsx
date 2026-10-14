import React, { useState } from 'react';
import { ShieldCheck, Key, Lock, ArrowRightLeft, AlertOctagon, Heart, CheckCircle2 } from 'lucide-react';
import { SecurityDashboardState, api } from '../services/api';

interface SecurityGuardViewProps {
  data: SecurityDashboardState | null;
  onRefresh: () => void;
}

export const SecurityGuardView: React.FC<SecurityGuardViewProps> = ({ data, onRefresh }) => {
  const [rotating, setRotating] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [simulatingMiss, setSimulatingMiss] = useState(false);
  const [lastGeneratedKey, setLastGeneratedKey] = useState<string | null>(null);

  if (!data) {
    return <div className="text-zinc-500 font-mono text-xs">Loading Security Radar...</div>;
  }

  const handleRotateKeys = async () => {
    setRotating(true);
    try {
      const res = await api.rotateKeys();
      if (res.success) {
        setLastGeneratedKey(res.data.session_keys_hex);
        onRefresh();
      }
    } finally {
      setRotating(false);
    }
  };

  const handleFailover = async () => {
    setSwitching(true);
    try {
      await api.triggerFailover('Manual switch from Control Center');
      onRefresh();
    } finally {
      setSwitching(false);
    }
  };

  const handleSimulateMiss = async () => {
    setSimulatingMiss(true);
    try {
      await api.simulateMissedHeartbeat();
      onRefresh();
    } finally {
      setSimulatingMiss(false);
    }
  };

  const isPrimary = data.active_node === 'PRIMARY';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#8B5CF6]" />
            Security Radar & Slashing Guard
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Double-signing (equivocation) protection, automated session key rotation, and heartbeat standby failover.
          </p>
        </div>
      </div>

      {/* Primary vs Standby Server Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Node A (Primary) */}
        <div className={`p-4 rounded-lg border transition-all ${
          isPrimary ? 'border-[#8B5CF6] bg-[#1A1333]' : 'border-[#261B42] bg-[#130E26] opacity-75'
        }`}>
          <div className="flex items-center justify-between border-b border-[#261B42] pb-2 mb-3">
            <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isPrimary ? 'bg-[#10B981] animate-ping' : 'bg-zinc-500'}`} />
              PRIMARY VALIDATOR NODE
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
              isPrimary ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {isPrimary ? 'ACTIVE SIGNER' : 'STANDBY IDLE'}
            </span>
          </div>

          <div className="text-xs font-mono space-y-1.5 text-zinc-300">
            <div><span className="text-zinc-500">ID:</span> {data.primary_node_id}</div>
            <div><span className="text-zinc-500">IP:</span> {data.primary_ip}</div>
            <div><span className="text-zinc-500">Heartbeat:</span> {data.heartbeat.pallet_im_online.heartbeats_received} / 1440 pings</div>
          </div>
        </div>

        {/* Node B (Standby) */}
        <div className={`p-4 rounded-lg border transition-all ${
          !isPrimary ? 'border-[#8B5CF6] bg-[#1A1333]' : 'border-[#261B42] bg-[#130E26] opacity-75'
        }`}>
          <div className="flex items-center justify-between border-b border-[#261B42] pb-2 mb-3">
            <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${!isPrimary ? 'bg-[#10B981] animate-ping' : 'bg-zinc-500'}`} />
              STANDBY FAILOVER NODE
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
              !isPrimary ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {!isPrimary ? 'ACTIVE SIGNER' : 'STANDBY READY'}
            </span>
          </div>

          <div className="text-xs font-mono space-y-1.5 text-zinc-300">
            <div><span className="text-zinc-500">ID:</span> {data.standby_node_id}</div>
            <div><span className="text-zinc-500">IP:</span> {data.standby_ip}</div>
            <div><span className="text-zinc-500">Lock Status:</span> {data.lock_file_status}</div>
          </div>
        </div>
      </div>

      {/* Action Controls & Slashing Guard Triggers */}
      <div className="p-4 rounded-lg border border-[#261B42] bg-[#130E26] space-y-4">
        <div className="text-xs font-mono font-semibold text-white flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-[#8B5CF6]" />
          CRITICAL OPERATOR ACTIONS
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Rotate Keys */}
          <button
            onClick={handleRotateKeys}
            disabled={rotating}
            className="flex items-center gap-2 px-3 py-2 text-xs font-mono rounded bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium transition-colors"
          >
            <Key className="w-3.5 h-3.5" />
            {rotating ? 'Calling author_rotateKeys...' : 'Rotate Session Keys'}
          </button>

          {/* Trigger Failover */}
          <button
            onClick={handleFailover}
            disabled={switching}
            className="flex items-center gap-2 px-3 py-2 text-xs font-mono rounded bg-[#1A1333] hover:bg-[#261B42] border border-[#4C2889] text-[#C084FC] transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            {switching ? 'Transferring Lease...' : 'Execute Failover Switch'}
          </button>

          {/* Simulate Missed Ping */}
          <button
            onClick={handleSimulateMiss}
            disabled={simulatingMiss}
            className="flex items-center gap-2 px-3 py-2 text-xs font-mono rounded bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444] transition-colors"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            {simulatingMiss ? 'Simulating...' : 'Simulate 1 Missed Heartbeat'}
          </button>
        </div>

        {lastGeneratedKey && (
          <div className="p-3 rounded bg-[#0B0813] border border-[#10B981]/40 text-xs font-mono space-y-1">
            <div className="text-[#10B981] font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              New Session Keys Generated Successfully (Ready for session.setKeys):
            </div>
            <div className="text-zinc-300 break-all bg-[#130E26] p-2 rounded border border-[#261B42]">
              {lastGeneratedKey}
            </div>
          </div>
        )}
      </div>

      {/* Recent Rotations & Security Audit Stream */}
      <div className="p-4 rounded-lg border border-[#261B42] bg-[#130E26] space-y-3">
        <div className="text-xs font-mono font-semibold text-zinc-300">
          SESSION KEY ROTATION HISTORY
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#261B42] text-zinc-500">
                <th className="py-2">Rotation ID</th>
                <th className="py-2">Timestamp</th>
                <th className="py-2">Keys Preview</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#261B42]/50 text-zinc-300">
              {data.recent_rotations.map((r, i) => (
                <tr key={i} className="hover:bg-[#1A1333]">
                  <td className="py-2 text-[#C084FC]">{r.rotation_id}</td>
                  <td className="py-2 text-zinc-400">{new Date(r.timestamp * 1000).toLocaleTimeString()}</td>
                  <td className="py-2 text-zinc-400">{r.session_keys_hex.slice(0, 24)}...</td>
                  <td className="py-2 text-[#10B981]">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
