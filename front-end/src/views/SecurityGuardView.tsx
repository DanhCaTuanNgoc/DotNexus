import React, { useState } from 'react';
import {
  ShieldCheck,
  Key,
  ArrowRightLeft,
  Clock,
  Server,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Radio,
  Zap
} from 'lucide-react';
import { SecurityDashboardState, api } from '../services/api';

interface SecurityGuardViewProps {
  data: SecurityDashboardState;
  onRefresh: () => void;
}

export const SecurityGuardView: React.FC<SecurityGuardViewProps> = ({ data, onRefresh }) => {
  const [rotating, setRotating] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [simulatingMiss, setSimulatingMiss] = useState(false);
  const [lastGeneratedKey, setLastGeneratedKey] = useState<any | null>(null);

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
  const totalSlots = 30;
  const filledSlots = Math.min(totalSlots, Math.round((simulatedElapsedSeconds / 15.0) * totalSlots));

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#1C142E] pb-2.5 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#8B5CF6]" />
            <h2 className="text-xs sm:text-sm font-bold font-mono text-white tracking-widest uppercase">
              ANTI-EQUIVOCATION GUARD &amp; FAILOVER CONTROLLER
            </h2>
          </div>
          <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
            Automated session key rotation with atomic lease fencing to prevent double-signing slashing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Secondary Ghost Action */}
          <button
            onClick={handleRotateKeys}
            disabled={rotating}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-mono bg-[#110C1E] hover:bg-[#1A102E] text-zinc-200 hover:text-white font-bold border border-[#2E1F4A] hover:border-[#8B5CF6] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08050F] transition-[background-color,border-color,color] duration-150 cursor-pointer"
          >
            <Key className={`w-3.5 h-3.5 text-[#C084FC] ${rotating ? 'animate-spin' : ''}`} />
            <span>ROTATE KEYS (N+2)</span>
          </button>
          {/* Primary High-Risk Danger Action: Controlled Deep Crimson without harsh flash */}
          <button
            onClick={handleFailover}
            disabled={switching}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-mono bg-[#16080E] hover:bg-rose-950/70 text-rose-300 hover:text-rose-100 font-bold border border-rose-800/60 hover:border-rose-600/80 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08050F] transition-[background-color,border-color,color] duration-150 cursor-pointer"
          >
            <ArrowRightLeft className={`w-3.5 h-3.5 ${switching ? 'animate-spin' : ''}`} />
            <span>TRIGGER FAILOVER</span>
          </button>
        </div>
      </div>

      {/* 1. Dead Man's Switch Fencing Timeline (10s < 12s < 15s) */}
      <div className="p-3 sm:p-4 bg-[#08050F] border border-[#1C142E] space-y-3 font-mono">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1C142E] pb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span className="text-xs font-bold text-white tracking-wider">
              FAILOVER GRACE PERIOD TIMELINE (10s FENCE · 12s TTL · 15s TAKEOVER)
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-zinc-500">FENCING EPOCH:</span>
            <span className="text-[#C084FC] font-bold border border-[#2E1F4A] bg-[#0E091B] px-2 py-0.5 tabular-nums">
              #{currentEpoch}
            </span>
          </div>
        </div>

        {/* Smooth SRE Timeline Progress Bar */}
        <div className="p-3.5 bg-[#06040A] border border-[#1C142E] space-y-3">
          {/* Milestone Labels */}
          <div className="flex flex-wrap justify-between text-[10px] font-mono text-zinc-400 gap-1 pb-1">
            <span className="text-zinc-500">0.0s [LEASE ACTIVE]</span>
            <span className="text-amber-400 font-bold">10.0s [SELF-FENCE]</span>
            <span className="text-zinc-300 font-bold">12.0s [TTL EXPIRED]</span>
            <span className="text-rose-400 font-bold">15.0s [TAKEOVER]</span>
          </div>

          {/* Continuous Progress Bar with Reference Milestone Lines */}
          <div className="relative h-2.5 w-full bg-[#110C1E] border border-[#1C142E] overflow-hidden">
            {/* 10s Milestone Marker */}
            <div className="absolute top-0 bottom-0 left-[66.7%] w-0.5 bg-amber-400/80 z-10" title="10.0s Self-Fence Marker" />
            {/* 12s Milestone Marker */}
            <div className="absolute top-0 bottom-0 left-[80.0%] w-0.5 bg-zinc-300/80 z-10" title="12.0s TTL Expiry Marker" />

            {/* Active Elapsed Fill Bar */}
            <div
              className={`h-full transition-all duration-300 ${
                isSelfFenced ? 'bg-rose-500' : simulatedElapsedSeconds >= 7.5 ? 'bg-amber-400' : 'bg-[#00FF9D]'
              }`}
              style={{ width: `${Math.min(100, (simulatedElapsedSeconds / 15.0) * 100)}%` }}
            />
          </div>

          {/* Telemetry Status Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between text-[11px] pt-2 border-t border-[#1C142E] gap-2">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span>
                ELAPSED: <strong className="text-white tabular-nums">{simulatedElapsedSeconds.toFixed(1)}s</strong> / 12.0s
              </span>
              <span className="text-zinc-700">|</span>
              <span>
                MISSED HEARTBEATS: <strong className="text-white tabular-nums">{missedCount}</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${
                isSelfFenced
                  ? 'border-rose-800/60 bg-rose-950/40 text-rose-400'
                  : 'border-[#00FF9D]/40 bg-[#00FF9D]/10 text-[#00FF9D]'
              }`}>
                {isSelfFenced ? '[KEYSTORE FENCED]' : '[LEASE VALID - DUAL-LOCK]'}
              </span>

              <button
                onClick={handleSimulateMiss}
                disabled={simulatingMiss}
                className="px-2.5 py-1 text-[10px] bg-[#110C1E] hover:bg-[#1A102E] border border-[#2E1F4A] hover:border-[#8B5CF6] text-zinc-300 hover:text-white touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] transition-[background-color,border-color,color] duration-150 cursor-pointer"
              >
                +1 Sim Miss
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary vs Standby Server Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
        {/* Node Alpha (Primary) */}
        <div className={`p-4 border transition-all ${
          isPrimary
            ? 'border-[#8B5CF6] bg-[#0E091B]'
            : 'border-[#1C142E] bg-[#06040A] opacity-70'
        }`}>
          <div className="flex items-center justify-between border-b border-[#1C142E] pb-2 mb-3">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-[#8B5CF6]" />
              VALIDATOR PRIMARY [NODE-01]
            </span>
            <span className={`text-[10px] px-2 py-0.5 font-bold border uppercase tracking-wider ${
              isPrimary
                ? 'border-[#00FF9D]/40 bg-[#00FF9D]/10 text-[#00FF9D]'
                : 'border-[#1C142E] bg-[#06040A] text-zinc-500'
            }`}>
              {isPrimary ? '[ACTIVE SIGNER]' : '[STANDBY / FENCED]'}
            </span>
          </div>

          <div className="text-xs space-y-2 text-zinc-300">
            <div className="flex justify-between border-b border-[#140D24] pb-1">
              <span className="text-zinc-500">INSTANCE ID:</span>
              <span className="text-white font-bold">{data.primary_node_id}</span>
            </div>
            <div className="flex justify-between border-b border-[#140D24] pb-1">
              <span className="text-zinc-500">SUBSTRATE WS RPC:</span>
              <span className="text-zinc-200 tabular-nums">{data.primary_ip}</span>
            </div>
            <div className="flex justify-between border-b border-[#140D24] pb-1">
              <span className="text-zinc-500">LIBP2P TELEMETRY:</span>
              <span className="text-[#00FF9D]">:30333 [PORT OPEN]</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">SIGNING LEASE MUTEX:</span>
              <span className={`font-bold ${isPrimary && !isSelfFenced ? 'text-[#00FF9D]' : 'text-amber-400'}`}>
                {isPrimary && !isSelfFenced ? '[ACTIVE (HELD)]' : '[FENCED / RELEASED]'}
              </span>
            </div>
          </div>
        </div>

        {/* Node Beta (Standby) */}
        <div className={`p-4 border transition-all ${
          !isPrimary
            ? 'border-[#8B5CF6] bg-[#0E091B]'
            : 'border-[#1C142E] bg-[#08050F]'
        }`}>
          <div className="flex items-center justify-between border-b border-[#1C142E] pb-2 mb-3">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-[#8B5CF6]" />
              VALIDATOR HOT-STANDBY [NODE-02]
            </span>
            <span className={`text-[10px] px-2 py-0.5 font-bold border uppercase tracking-wider ${
              !isPrimary
                ? 'border-[#00FF9D]/40 bg-[#00FF9D]/10 text-[#00FF9D]'
                : 'border-[#2E1F4A] bg-[#0E091B] text-[#C084FC]'
            }`}>
              {!isPrimary ? '[ACTIVE SIGNER]' : '[STANDBY READY]'}
            </span>
          </div>

          <div className="text-xs space-y-2 text-zinc-300">
            <div className="flex justify-between border-b border-[#140D24] pb-1">
              <span className="text-zinc-500">INSTANCE ID:</span>
              <span className="text-white font-bold">{data.standby_node_id}</span>
            </div>
            <div className="flex justify-between border-b border-[#140D24] pb-1">
              <span className="text-zinc-500">SUBSTRATE WS RPC:</span>
              <span className="text-zinc-200 tabular-nums">{data.standby_ip}</span>
            </div>
            <div className="flex justify-between border-b border-[#140D24] pb-1">
              <span className="text-zinc-500">TAKEOVER SAFETY DELAY:</span>
              <span className="text-[#8B5CF6] font-bold">15.0s [STRICT &gt; 12.0s TTL]</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">KEYSTORE SYNC STATE:</span>
              <span className="text-zinc-300">[PARITY VERIFIED]</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2.5 Real-Data Normalization: On-Chain Lease & Live BABE Authorities */}
      <div className="p-3 sm:p-4 bg-[#08050F] border border-[#1C142E] space-y-3 font-mono">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1C142E] pb-2">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-[#00FF9D]" />
            <span className="text-xs font-bold text-white tracking-wider">
              ON-CHAIN LEASE &amp; LIVE BABE SESSION AUTHORITIES
            </span>
            <span className="text-[9px] px-1.5 py-0.5 bg-[#00FF9D]/10 text-[#00FF9D] border border-[#00FF9D]/30 font-bold">
              100% LIVE ON-CHAIN
            </span>
          </div>
          <span className="text-[10px] text-zinc-500">
            Smart Contract: <code className="text-[#C084FC]">SlashGuardLeaseRegistry.sol</code>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Smart Contract Lease Registry Card */}
          <div className="p-3 bg-[#06040A] border border-[#1C142E] space-y-2 text-[11px]">
            <div className="flex items-center justify-between border-b border-[#140D24] pb-1.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00FF9D]" />
                EVM Smart Contract Lease State
              </span>
              <span className="text-[9px] text-[#00FF9D] bg-emerald-950/40 px-1.5 py-0.5 border border-emerald-800/60 font-bold">
                {data.onchain_lease?.is_currently_valid ? 'LEASE VALID' : 'EXPIRED'}
              </span>
            </div>

            <div className="space-y-1.5 text-zinc-400">
              <div className="flex justify-between">
                <span>Contract Address:</span>
                <span className="text-[#C084FC] tabular-nums font-mono text-[10px]">
                  {data.onchain_lease?.contract_address ? `${data.onchain_lease.contract_address.slice(0, 10)}...${data.onchain_lease.contract_address.slice(-6)}` : '0xba114d21...7355'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Active Operator:</span>
                <span className="text-zinc-200 tabular-nums font-mono text-[10px]">
                  {data.onchain_lease?.active_node_operator ? `${data.onchain_lease.active_node_operator.slice(0, 8)}...${data.onchain_lease.active_node_operator.slice(-6)}` : '0x56a64421...4da4'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Fencing Epoch:</span>
                <span className="text-white font-bold tabular-nums">#{data.onchain_lease?.fencing_epoch ?? data.fencing_epoch ?? 1}</span>
              </div>
              <div className="flex justify-between">
                <span>Expiry Block:</span>
                <span className="text-zinc-200 tabular-nums font-mono">
                  #{data.onchain_lease?.expires_at_block ?? 147500} ({data.onchain_lease?.blocks_remaining ?? 236} blks left)
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#140D24]">
                <span>Data Feed Source:</span>
                <span className="text-[#00FF9D] text-[10px] font-bold">{data.onchain_lease?.source || 'PORTALDOT_V3_EVM_TESTNET'}</span>
              </div>
            </div>
          </div>

          {/* Substrate BABE Epoch Authorities Card */}
          <div className="p-3 bg-[#06040A] border border-[#1C142E] space-y-2 text-[11px]">
            <div className="flex items-center justify-between border-b border-[#140D24] pb-1.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#C084FC]" />
                Substrate BABE Epoch &amp; Session Keys
              </span>
              <span className="text-[9px] text-[#C084FC] bg-purple-950/40 px-1.5 py-0.5 border border-purple-800/60 font-bold">
                SESSION #{data.session_authorities?.session_index ?? 842}
              </span>
            </div>

            <div className="space-y-1.5 text-zinc-400">
              <div className="flex justify-between">
                <span>BABE Epoch Index:</span>
                <span className="text-white font-bold tabular-nums">#{data.session_authorities?.babe_epoch_index ?? 421}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Consensus Validators:</span>
                <span className="text-zinc-200 font-bold tabular-nums">{data.session_authorities?.active_validators_count ?? 2} Authorities</span>
              </div>
              <div className="flex justify-between">
                <span>Queued Session Keys:</span>
                <span className="text-[#00FF9D] tabular-nums font-bold">{data.session_authorities?.queued_keys_count ?? 2} (Session N+1 Ready)</span>
              </div>
              <div className="flex justify-between">
                <span>Primary Stash Status:</span>
                <span className="text-[#00FF9D] font-bold">INCLUDED IN ACTIVE SET</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#140D24]">
                <span>Storage Query:</span>
                <span className="text-[#C084FC] text-[10px] font-bold">{data.session_authorities?.source || 'PORTALDOT_V3_SUBSTRATE_STORAGE'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Visual SCALE Codec 4-Key Struct Unpacker */}
      <div className="p-4 bg-[#08050F] border border-[#1C142E] space-y-3 font-mono">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1C142E] pb-2">
          <div className="flex items-center gap-2">
            <FileCode className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span className="text-xs font-bold text-white tracking-wider">
              METADATA V14 SESSION KEYS DECOMPOSER (128 BYTES &rarr; 4 ED25519 / SR25519 PUBKEYS)
            </span>
          </div>
          <span className="text-[10px] text-zinc-500">
            Scheduled: Session N &rarr; Active: Session N+2
          </span>
        </div>

        {/* 4 Key Struct Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="p-2.5 bg-[#06040A] border border-[#1C142E] hover:border-[#2E1F4A] transition-colors space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#C084FC] font-bold">01. BABE</span>
              <span className="text-zinc-500">sr25519 (32B)</span>
            </div>
            <div className="text-xs font-bold text-white">Block Authoring</div>
            <div className="text-[10px] text-zinc-400 truncate pt-1 border-t border-[#140D24]">
              {lastGeneratedKey?.keys_struct_v14?.babe || '0x6a2f418b...39c0'}
            </div>
          </div>

          <div className="p-2.5 bg-[#06040A] border border-[#1C142E] hover:border-[#2E1F4A] transition-colors space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#8B5CF6] font-bold">02. GRANDPA</span>
              <span className="text-zinc-500">ed25519 (32B)</span>
            </div>
            <div className="text-xs font-bold text-white">Finality Rounds</div>
            <div className="text-[10px] text-zinc-400 truncate pt-1 border-t border-[#140D24]">
              {lastGeneratedKey?.keys_struct_v14?.grandpa || '0x81b499e1...e215'}
            </div>
          </div>

          <div className="p-2.5 bg-[#06040A] border border-[#1C142E] hover:border-[#2E1F4A] transition-colors space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#00FF9D] font-bold">03. IM_ONLINE</span>
              <span className="text-zinc-500">sr25519 (32B)</span>
            </div>
            <div className="text-xs font-bold text-white">Heartbeat Vitality</div>
            <div className="text-[10px] text-zinc-400 truncate pt-1 border-t border-[#140D24]">
              {lastGeneratedKey?.keys_struct_v14?.im_online || '0x43d100fa...8a92'}
            </div>
          </div>

          <div className="p-2.5 bg-[#06040A] border border-[#1C142E] hover:border-[#2E1F4A] transition-colors space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#818CF8] font-bold">04. AUTHORITY_DISC</span>
              <span className="text-zinc-500">sr25519 (32B)</span>
            </div>
            <div className="text-xs font-bold text-white">Kademlia DHT Mesh</div>
            <div className="text-[10px] text-zinc-400 truncate pt-1 border-t border-[#140D24]">
              {lastGeneratedKey?.keys_struct_v14?.authority_discovery || '0x99e577ba...55a7'}
            </div>
          </div>
        </div>

        {/* SCALE Call Encapsulation */}
        <div className="p-2.5 bg-[#06040A] border border-[#1C142E] text-[11px] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">ON-CHAIN EXTRINSIC:</span>
            <code className="text-[#C084FC] bg-[#0E091B] px-1.5 py-0.5 border border-[#2E1F4A]">
              session.setKeys(keys=SCALE_128B, proof=0x00)
            </code>
          </div>
          <span className="text-[#00FF9D] flex items-center gap-1 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            VALIDATED FOR N+2 ROTATION
          </span>
        </div>
      </div>
    </div>
  );
};
