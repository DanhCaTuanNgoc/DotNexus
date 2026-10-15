import React, { useState } from 'react';
import {
  ShieldCheck,
  Key,
  Lock,
  ArrowRightLeft,
  AlertOctagon,
  Heart,
  Clock,
  Cpu,
  Layers,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Server,
  FileCode,
  Radio
} from 'lucide-react';
import { SecurityDashboardState, api } from '../services/api';

interface SecurityGuardViewProps {
  data: SecurityDashboardState | null;
  onRefresh: () => void;
}

export const SecurityGuardView: React.FC<SecurityGuardViewProps> = ({ data, onRefresh }) => {
  const [rotating, setRotating] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [simulatingMiss, setSimulatingMiss] = useState(false);
  const [lastGeneratedKey, setLastGeneratedKey] = useState<any | null>(null);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96 text-zinc-500 font-mono text-xs">
        Loading Security Radar & Slashing Guard...
      </div>
    );
  }

  const handleRotateKeys = async () => {
    setRotating(true);
    try {
      const res = await api.rotateKeys();
      if (res.success) {
        setLastGeneratedKey(res.data);
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
  const missedCount = data.missed_heartbeats;
  const currentEpoch = data.fencing_epoch || 1;

  // Visual calculation for Dead Man's Switch countdown bar (10s < 12s < 15s)
  const simulatedElapsedSeconds = missedCount === 0 ? 3.0 : missedCount === 1 ? 7.5 : 11.5;
  const isSelfFenced = simulatedElapsedSeconds >= 10.0;

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex items-center justify-between border-b border-[#261B42] pb-4">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#8B5CF6]" />
            Security Radar & Anti-Equivocation Slashing Guard
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Dead Man's Switch (Self-Fencing), distributed lease timing invariants, and Metadata V14 session key rotation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRotateKeys}
            disabled={rotating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#180E30] hover:bg-[#261B42] border border-[#4C2889] text-[#C084FC] transition-colors cursor-pointer"
          >
            <Key className={`w-3.5 h-3.5 ${rotating ? 'animate-spin' : ''}`} />
            Planned RotateKeys (N+2)
          </button>
          <button
            onClick={handleFailover}
            disabled={switching}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#EF4444]/15 hover:bg-[#EF4444]/25 border border-[#EF4444]/40 text-[#EF4444] transition-colors cursor-pointer font-bold"
          >
            <ArrowRightLeft className={`w-3.5 h-3.5 ${switching ? 'animate-spin' : ''}`} />
            Emergency Failover
          </button>
        </div>
      </div>

      {/* 1. Dead Man's Switch Fencing Timeline (10s < 12s < 15s) */}
      <div className="p-4 bg-[#110A24] border border-[#261B42] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#C084FC]" />
            <span className="text-xs font-mono font-bold text-white tracking-wider">
              DEAD MAN'S SWITCH TIMING INVARIANT: SELF-FENCE &lt; LEASE TTL &lt; TAKEOVER DELAY
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-[#8B5CF6]/15 text-[#C084FC] border border-[#8B5CF6]/30">
            FENCING EPOCH: #{currentEpoch}
          </span>
        </div>

        {/* Visual Progress Timeline */}
        <div className="p-4 bg-[#080512] border border-[#1F143D] space-y-3">
          <div className="relative pt-6 pb-2">
            {/* Timeline track */}
            <div className="h-2 w-full bg-[#1A1333] relative">
              {/* Progress fill */}
              <div
                style={{ width: `${Math.min(100, (simulatedElapsedSeconds / 15.0) * 100)}%` }}
                className={`h-full transition-all duration-500 ${
                  isSelfFenced ? 'bg-[#EF4444]' : 'bg-[#10B981]'
                }`}
              />

              {/* Marker 1: 10s Self-Fence Cliff */}
              <div className="absolute top-[-24px] left-[66.6%] -translate-x-1/2 flex flex-col items-center">
                <span className="text-[9px] font-mono font-bold text-[#EF4444]">10s SELF-FENCE CLIFF</span>
                <div className="w-1.5 h-4 bg-[#EF4444] mt-0.5" />
              </div>

              {/* Marker 2: 12s Lease TTL */}
              <div className="absolute top-[-24px] left-[80%] -translate-x-1/2 flex flex-col items-center">
                <span className="text-[9px] font-mono text-zinc-400">12s LEASE TTL</span>
                <div className="w-1 h-3 bg-zinc-500 mt-1" />
              </div>

              {/* Marker 3: 15s Standby Takeover Gate */}
              <div className="absolute top-[-24px] left-[100%] -translate-x-full flex flex-col items-end">
                <span className="text-[9px] font-mono font-bold text-[#8B5CF6]">15s STANDBY TAKEOVER</span>
                <div className="w-1.5 h-4 bg-[#8B5CF6] mt-0.5" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-2 border-t border-[#1F143D]">
            <span>Current Elapsed Lease Time: <strong className="text-white tabular-nums">{simulatedElapsedSeconds}s</strong> / 12s</span>
            <span className={isSelfFenced ? 'text-[#EF4444] font-bold' : 'text-[#10B981]'}>
              {isSelfFenced ? 'PRIMARY SELF-FENCED (KEYSTORE ISOLATED)' : 'PRIMARY SIGNING LEASE VALID'}
            </span>
            <button
              onClick={handleSimulateMiss}
              disabled={simulatingMiss}
              className="px-2 py-0.5 text-[10px] bg-[#180E30] hover:bg-[#261B42] border border-[#4C2889] text-[#C084FC] cursor-pointer"
            >
              Simulate Lease Delay (+1 miss)
            </button>
          </div>
        </div>
      </div>

      {/* 2. Primary vs Standby Server Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Node Alpha (Primary) */}
        <div className={`p-4 border transition-all ${
          isPrimary
            ? 'border-[#8B5CF6] bg-[#180E30] shadow-[0_0_12px_rgba(139,92,246,0.12)]'
            : 'border-[#261B42] bg-[#110A24] opacity-75'
        }`}>
          <div className="flex items-center justify-between border-b border-[#261B42] pb-2 mb-3">
            <span className="font-mono text-xs font-bold text-white flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-[#8B5CF6]" />
              PRIMARY VALIDATOR INSTANCE
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 font-bold ${
              isPrimary ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {isPrimary ? 'ACTIVE SIGNER' : 'FENCED / IDLE'}
            </span>
          </div>

          <div className="text-xs font-mono space-y-2 text-zinc-300">
            <div className="flex justify-between"><span className="text-zinc-500">Instance ID:</span> <span className="text-white">{data.primary_node_id}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Substrate WS RPC:</span> <span className="text-zinc-200">{data.primary_ip}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Libp2p Port:</span> <span className="text-emerald-400">:30333 (Active)</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Keystore Status:</span> <span className="text-[#C084FC]">{isPrimary ? 'Unlocked & Signing' : 'Fenced (Read-Only)'}</span></div>
          </div>
        </div>

        {/* Node Beta (Standby) */}
        <div className={`p-4 border transition-all ${
          !isPrimary
            ? 'border-[#8B5CF6] bg-[#180E30] shadow-[0_0_12px_rgba(139,92,246,0.12)]'
            : 'border-[#261B42] bg-[#110A24]'
        }`}>
          <div className="flex items-center justify-between border-b border-[#261B42] pb-2 mb-3">
            <span className="font-mono text-xs font-bold text-white flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-[#6366F1]" />
              STANDBY HOT-BACKUP INSTANCE
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 font-bold ${
              !isPrimary ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {!isPrimary ? 'ACTIVE SIGNER' : 'STANDBY READY'}
            </span>
          </div>

          <div className="text-xs font-mono space-y-2 text-zinc-300">
            <div className="flex justify-between"><span className="text-zinc-500">Instance ID:</span> <span className="text-white">{data.standby_node_id}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Substrate WS RPC:</span> <span className="text-zinc-200">{data.standby_ip}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Takeover Delay:</span> <span className="text-[#8B5CF6]">15.0s (Safety Invariant)</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Keystore Sync:</span> <span className="text-zinc-400">Lockstep Parity</span></div>
          </div>
        </div>
      </div>

      {/* 3. Visual SCALE Codec 4-Key Struct Unpacker */}
      <div className="p-4 bg-[#110A24] border border-[#261B42] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-3.5 h-3.5 text-[#C084FC]" />
            <span className="text-xs font-mono font-bold text-white tracking-wider">
              METADATA V14 SESSION KEYS DECOMPOSER (128 BYTES &rarr; 4 PUBKEYS)
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            Scheduled at Session N &rarr; Effective at Session N+2
          </span>
        </div>

        {/* 4 Key Struct Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-3 bg-[#080512] border border-[#261B42] space-y-1">
            <div className="text-[10px] font-mono text-[#E6007A] font-bold">1. BABE (sr25519)</div>
            <div className="text-xs font-bold text-white">Block Production</div>
            <div className="text-[10px] font-mono text-zinc-400 truncate">
              {lastGeneratedKey?.keys_struct_v14?.babe || '0x6a2f...39c0 (32B)'}
            </div>
          </div>

          <div className="p-3 bg-[#080512] border border-[#261B42] space-y-1">
            <div className="text-[10px] font-mono text-[#8B5CF6] font-bold">2. GRANDPA (ed25519)</div>
            <div className="text-xs font-bold text-white">Finality Gadget</div>
            <div className="text-[10px] font-mono text-zinc-400 truncate">
              {lastGeneratedKey?.keys_struct_v14?.grandpa || '0x81b4...e215 (32B)'}
            </div>
          </div>

          <div className="p-3 bg-[#080512] border border-[#261B42] space-y-1">
            <div className="text-[10px] font-mono text-[#10B981] font-bold">3. IM_ONLINE (sr25519)</div>
            <div className="text-xs font-bold text-white">Heartbeat Vitality</div>
            <div className="text-[10px] font-mono text-zinc-400 truncate">
              {lastGeneratedKey?.keys_struct_v14?.im_online || '0x43d1...8a92 (32B)'}
            </div>
          </div>

          <div className="p-3 bg-[#080512] border border-[#261B42] space-y-1">
            <div className="text-[10px] font-mono text-[#6366F1] font-bold">4. AUTHORITY_DISC</div>
            <div className="text-xs font-bold text-white">P2P Routing Mesh</div>
            <div className="text-[10px] font-mono text-zinc-400 truncate">
              {lastGeneratedKey?.keys_struct_v14?.authority_discovery || '0x99e5...55a7 (32B)'}
            </div>
          </div>
        </div>

        <div className="p-2.5 bg-[#080512] border border-[#1F143D] text-[11px] font-mono text-zinc-400 flex items-center justify-between">
          <span>Target Extrinsic: <code className="text-[#C084FC]">session.setKeys(keys=keys_struct, proof=0x00)</code></span>
          <span className="text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ready for On-chain Submission
          </span>
        </div>
      </div>
    </div>
  );
};
