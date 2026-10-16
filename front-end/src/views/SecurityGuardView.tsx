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
        [INITIALIZING SECURITY RADAR &amp; EQUIVOCATION GUARD...]
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
  const totalSlots = 30;
  const filledSlots = Math.min(totalSlots, Math.round((simulatedElapsedSeconds / 15.0) * totalSlots));

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#261B42] pb-3 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#8B5CF6]" />
            <h2 className="text-sm sm:text-base font-bold font-mono text-white tracking-wider uppercase">
              ANTI-EQUIVOCATION GUARD &amp; FAILOVER CONTROLLER
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleRotateKeys}
            disabled={rotating}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#8B5CF6] hover:bg-[#7C3AED] active:bg-[#6D28D9] text-white font-bold border border-[#8B5CF6] transition-colors cursor-pointer"
          >
            <Key className={`w-3.5 h-3.5 ${rotating ? 'animate-spin' : ''}`} />
            <span>ROTATE KEYS (N+2)</span>
          </button>
          <button
            onClick={handleFailover}
            disabled={switching}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#1A0B10] hover:bg-[#2A0E17] active:bg-[#3D1421] border border-[#EF4444] text-[#EF4444] font-bold transition-colors cursor-pointer"
          >
            <ArrowRightLeft className={`w-3.5 h-3.5 ${switching ? 'animate-spin' : ''}`} />
            <span>TRIGGER FAILOVER</span>
          </button>
        </div>
      </div>

      {/* 1. Dead Man's Switch Fencing Timeline (10s < 12s < 15s) */}
      <div className="p-3 sm:p-4 bg-[#0F0A1D] border border-[#261B42] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span className="text-xs font-mono font-bold text-white tracking-wider">
              DEAD MAN&apos;S SWITCH: T_fence(10s) &lt; T_ttl(12s) &lt; T_takeover(15s)
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-zinc-500">FENCING EPOCH:</span>
            <span className="text-[#C084FC] font-bold border border-[#4C2889] bg-[#140C2B] px-2 py-0.5">
              #{currentEpoch}
            </span>
          </div>
        </div>

        {/* Cyber ASCII / Stepped Gauge Bar */}
        <div className="p-3 bg-[#080512] border border-[#1F143D] space-y-3 font-mono">
          {/* Segmented Timeline */}
          <div className="space-y-1">
            <div className="flex flex-wrap justify-between text-[10px] text-zinc-500 gap-1">
              <span>0.0s [LEASE]</span>
              <span className="text-amber-400 font-bold">10.0s [SELF-FENCE]</span>
              <span className="text-zinc-400">12.0s [TTL EXPIRED]</span>
              <span className="text-[#8B5CF6] font-bold">15.0s [TAKEOVER]</span>
            </div>

            {/* Segment blocks */}
            <div 
              className="grid gap-0.5 sm:gap-1 h-3 bg-[#0B0616] p-0.5 border border-[#261B42]"
              style={{ gridTemplateColumns: `repeat(${totalSlots}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: totalSlots }).map((_, i) => {
                const isFilled = i < filledSlots;
                // Markers at slot 20 (10s), slot 24 (12s), slot 30 (15s)
                const isAt10s = i === 19;
                const isAt12s = i === 23;

                let cellColor = 'bg-[#181028]';
                if (isFilled) {
                  if (i < 20) {
                    cellColor = isSelfFenced ? 'bg-amber-500' : 'bg-[#10B981]';
                  } else if (i < 24) {
                    cellColor = 'bg-amber-500';
                  } else {
                    cellColor = 'bg-[#EF4444]';
                  }
                }

                return (
                  <div
                    key={i}
                    className={`h-full transition-all duration-300 ${cellColor} ${
                      isAt10s ? 'border-r-2 border-amber-400' : ''
                    } ${isAt12s ? 'border-r-2 border-zinc-500' : ''}`}
                    title={`Slot ${i + 1}/${totalSlots} (~${((i + 1) * 0.5).toFixed(1)}s)`}
                  />
                );
              })}
            </div>
          </div>

          {/* Telemetry Status Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between text-[11px] pt-2 border-t border-[#1F143D] gap-2">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span>
                ELAPSED: <strong className="text-white tabular-nums">{simulatedElapsedSeconds.toFixed(1)}s</strong> / 12.0s
              </span>
              <span className="text-zinc-600">|</span>
              <span>
                MISSED HEARTBEATS: <strong className="text-white tabular-nums">{missedCount}</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2 py-0.5 text-[10px] font-bold border ${
                isSelfFenced
                  ? 'border-[#EF4444] bg-[#2A0E17] text-[#EF4444]'
                  : 'border-[#10B981]/50 bg-[#0E2820]/40 text-[#10B981]'
              }`}>
                {isSelfFenced ? '[KEYSTORE FENCED]' : '[LEASE VALID - DUAL-LOCK]'}
              </span>

              <button
                onClick={handleSimulateMiss}
                disabled={simulatingMiss}
                className="px-2.5 py-1 text-[10px] bg-[#140C2B] hover:bg-[#1E113E] border border-[#4C2889] text-[#C084FC] hover:text-white cursor-pointer transition-colors"
              >
                +1 Sim Miss
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary vs Standby Server Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Node Alpha (Primary) */}
        <div className={`p-4 border font-mono transition-all ${
          isPrimary
            ? 'border-[#8B5CF6] bg-[#120B24]'
            : 'border-[#261B42] bg-[#0A0614] opacity-70'
        }`}>
          <div className="flex items-center justify-between border-b border-[#261B42] pb-2 mb-3">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-[#8B5CF6]" />
              VALIDATOR PRIMARY [NODE-01]
            </span>
            <span className={`text-[10px] px-2 py-0.5 font-bold border ${
              isPrimary
                ? 'border-[#10B981] bg-[#0E2820] text-[#10B981]'
                : 'border-zinc-700 bg-zinc-900 text-zinc-500'
            }`}>
              {isPrimary ? '[ACTIVE SIGNER]' : '[STANDBY / FENCED]'}
            </span>
          </div>

          <div className="text-xs space-y-2 text-zinc-300">
            <div className="flex justify-between border-b border-[#1A122E] pb-1">
              <span className="text-zinc-500">INSTANCE ID:</span>
              <span className="text-white font-bold">{data.primary_node_id}</span>
            </div>
            <div className="flex justify-between border-b border-[#1A122E] pb-1">
              <span className="text-zinc-500">SUBSTRATE WS RPC:</span>
              <span className="text-[#C084FC] tabular-nums">{data.primary_ip}</span>
            </div>
            <div className="flex justify-between border-b border-[#1A122E] pb-1">
              <span className="text-zinc-500">LIBP2P TELEMETRY:</span>
              <span className="text-[#10B981]">:30333 [PORT OPEN]</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">KEYSTORE MUTEX LEASE:</span>
              <span className={`font-bold ${isPrimary && !isSelfFenced ? 'text-[#10B981]' : 'text-amber-400'}`}>
                {isPrimary && !isSelfFenced ? '[ACQUIRED (LOCKED)]' : '[FENCED / RELEASED]'}
              </span>
            </div>
          </div>
        </div>

        {/* Node Beta (Standby) */}
        <div className={`p-4 border font-mono transition-all ${
          !isPrimary
            ? 'border-[#8B5CF6] bg-[#120B24]'
            : 'border-[#261B42] bg-[#0A0614]'
        }`}>
          <div className="flex items-center justify-between border-b border-[#261B42] pb-2 mb-3">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-[#8B5CF6]" />
              VALIDATOR HOT-STANDBY [NODE-02]
            </span>
            <span className={`text-[10px] px-2 py-0.5 font-bold border ${
              !isPrimary
                ? 'border-[#10B981] bg-[#0E2820] text-[#10B981]'
                : 'border-[#4C2889] bg-[#140C2B] text-[#C084FC]'
            }`}>
              {!isPrimary ? '[ACTIVE SIGNER]' : '[STANDBY READY]'}
            </span>
          </div>

          <div className="text-xs space-y-2 text-zinc-300">
            <div className="flex justify-between border-b border-[#1A122E] pb-1">
              <span className="text-zinc-500">INSTANCE ID:</span>
              <span className="text-white font-bold">{data.standby_node_id}</span>
            </div>
            <div className="flex justify-between border-b border-[#1A122E] pb-1">
              <span className="text-zinc-500">SUBSTRATE WS RPC:</span>
              <span className="text-[#C084FC] tabular-nums">{data.standby_ip}</span>
            </div>
            <div className="flex justify-between border-b border-[#1A122E] pb-1">
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

      {/* 3. Visual SCALE Codec 4-Key Struct Unpacker */}
      <div className="p-4 bg-[#0F0A1D] border border-[#261B42] space-y-3 font-mono">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileCode className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span className="text-xs font-bold text-white tracking-wider">
              METADATA V14 SESSION KEYS DECOMPOSER (128 BYTES &rarr; 4 ED25519 / SR25519 PUBKEYS)
            </span>
          </div>
          <span className="text-[10px] text-zinc-400">
            Scheduled: Session N &rarr; Active: Session N+2
          </span>
        </div>

        {/* 4 Key Struct Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="p-2.5 bg-[#080512] border border-[#261B42] hover:border-[#8B5CF6] transition-colors space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#C084FC] font-bold">01. BABE</span>
              <span className="text-zinc-500">sr25519 (32B)</span>
            </div>
            <div className="text-xs font-bold text-white">Block Authoring</div>
            <div className="text-[10px] text-zinc-400 truncate pt-1 border-t border-[#1F143D]">
              {lastGeneratedKey?.keys_struct_v14?.babe || '0x6a2f418b...39c0'}
            </div>
          </div>

          <div className="p-2.5 bg-[#080512] border border-[#261B42] hover:border-[#8B5CF6] transition-colors space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#8B5CF6] font-bold">02. GRANDPA</span>
              <span className="text-zinc-500">ed25519 (32B)</span>
            </div>
            <div className="text-xs font-bold text-white">Finality Rounds</div>
            <div className="text-[10px] text-zinc-400 truncate pt-1 border-t border-[#1F143D]">
              {lastGeneratedKey?.keys_struct_v14?.grandpa || '0x81b499e1...e215'}
            </div>
          </div>

          <div className="p-2.5 bg-[#080512] border border-[#261B42] hover:border-[#8B5CF6] transition-colors space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#10B981] font-bold">03. IM_ONLINE</span>
              <span className="text-zinc-500">sr25519 (32B)</span>
            </div>
            <div className="text-xs font-bold text-white">Heartbeat Vitality</div>
            <div className="text-[10px] text-zinc-400 truncate pt-1 border-t border-[#1F143D]">
              {lastGeneratedKey?.keys_struct_v14?.im_online || '0x43d100fa...8a92'}
            </div>
          </div>

          <div className="p-2.5 bg-[#080512] border border-[#261B42] hover:border-[#8B5CF6] transition-colors space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#818CF8] font-bold">04. AUTHORITY_DISC</span>
              <span className="text-zinc-500">sr25519 (32B)</span>
            </div>
            <div className="text-xs font-bold text-white">Kademlia DHT Mesh</div>
            <div className="text-[10px] text-zinc-400 truncate pt-1 border-t border-[#1F143D]">
              {lastGeneratedKey?.keys_struct_v14?.authority_discovery || '0x99e577ba...55a7'}
            </div>
          </div>
        </div>

        {/* SCALE Call Encapsulation */}
        <div className="p-2.5 bg-[#080512] border border-[#1F143D] text-[11px] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">ON-CHAIN EXTRINSIC:</span>
            <code className="text-[#C084FC]">session.setKeys(keys=SCALE_128B, proof=0x00)</code>
          </div>
          <span className="text-[#10B981] flex items-center gap-1 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            VALIDATED FOR N+2 ROTATION
          </span>
        </div>
      </div>
    </div>
  );
};
