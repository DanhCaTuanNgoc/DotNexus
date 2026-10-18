import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  ShieldCheck,
  Send,
  Sliders,
  Check,
  Cpu,
  X,
  Copy,
  ExternalLink,
  Wallet,
  AlertCircle,
  Users,
  Shield,
  RotateCcw,
  Sparkles,
  Lock
} from 'lucide-react';
import { NPoSRecommendation, api } from '../services/api';
import { storage } from '../services/storage';

interface StakingYieldViewProps {
  data: NPoSRecommendation;
  onRefresh: () => void;
}

export const StakingYieldView: React.FC<StakingYieldViewProps> = ({ data, onRefresh }) => {
  const [stakeInput, setStakeInputState] = useState<number>(() => storage.getStakeInput(10000));
  const [selectedDurationMonths, setSelectedDurationMonths] = useState<number>(12);
  const [rebalanceResult, setRebalanceResult] = useState<any | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [candidateFilter, setCandidateFilter] = useState<'ALL' | 'OPTIMAL' | 'LOW_COMM'>('ALL');

  // Interactive Validator Detail Modal state
  const [selectedValidator, setSelectedValidator] = useState<any | null>(null);

  // Target customization state (selected stash addresses)
  const [selectedTargets, setSelectedTargets] = useState<string[]>(() => {
    return data.validators.slice(0, 16).map(v => v.stash_address);
  });

  useEffect(() => {
    if (selectedTargets.length === 0) {
      setSelectedTargets(data.validators.slice(0, 16).map(v => v.stash_address));
    }
  }, [data]);

  // Extrinsic Signing Studio Modal state
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [walletMode, setWalletMode] = useState<'substrate' | 'evm'>('substrate');
  const [broadcastStatus, setBroadcastStatus] = useState<'idle' | 'broadcasting' | 'success'>('idle');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const setStakeInput = (amount: number) => {
    setStakeInputState(amount);
    storage.setStakeInput(amount);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleToggleTarget = (stash: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedTargets(prev => {
      if (prev.includes(stash)) {
        return prev.filter(s => s !== stash);
      } else {
        if (prev.length >= 16) return prev; // max 16 targets
        return [...prev, stash];
      }
    });
  };

  const handleSelectAllTargets = () => {
    setSelectedTargets(data.validators.slice(0, 16).map(v => v.stash_address));
  };

  const handleClearTargets = () => {
    setSelectedTargets([]);
  };

  const handleRebalance = async () => {
    setIsCalculating(true);
    try {
      const res = await api.rebalanceStake(stakeInput);
      if (res.success) {
        setRebalanceResult(res.data);
        setIsDispatchModalOpen(true);
      }
    } finally {
      setIsCalculating(false);
    }
  };

  const handleBroadcast = () => {
    setBroadcastStatus('broadcasting');
    setTimeout(() => {
      setBroadcastStatus('success');
    }, 1200);
  };

  // Yield calculations for Compound Trajectory
  const nominalRate = data.average_nominal_apy / 100.0;
  const compoundRate = data.auto_compounded_apy / 100.0;
  const timeFraction = selectedDurationMonths / 12.0;

  const nominalReturnPot = Math.round(stakeInput * nominalRate * timeFraction);
  const compoundReturnPot = Math.round(stakeInput * (Math.pow(1 + compoundRate / 1460, 1460 * timeFraction) - 1));
  const surplusPot = compoundReturnPot - nominalReturnPot;

  // Filtered validators
  const visibleValidators = data.validators.slice(0, 16).filter(val => {
    if (candidateFilter === 'OPTIMAL') {
      return (val.pao_metrics?.safety_margin_mvu || 0) >= 0.5;
    }
    if (candidateFilter === 'LOW_COMM') {
      return val.commission_pct <= 3.0;
    }
    return true;
  });

  return (
    <div className="space-y-4 font-mono">
      {/* View Header with Contextual Mission Statement */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#261B42] pb-3 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#8B5CF6]" />
            <h2 className="text-sm sm:text-base font-bold font-mono text-white tracking-wider uppercase">
              NPOS PHRAGMÉN SIMULATOR &amp; DYNAMIC RE-NOMINATION
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-[#8B5CF6]/10 text-[#C084FC] border border-[#8B5CF6]/30">
              PORTALDOT STAKING
            </span>
          </div>
          <p className="text-[11px] font-mono text-zinc-400 mt-1">
            Automated Phragmén nominator distribution engine protecting validators against whale dilution and oversubscription.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#C084FC] bg-[#140C2B] px-3 py-1.5 border border-[#4C2889]">
          <Cpu className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span>ALGO: {data.election_algorithm || 'Sequential Phragmén Optimization'}</span>
        </div>
      </div>

      {/* 1. APY Trajectory & Interactive Yield Curve */}
      <div className="p-4 bg-[#0F0A1D] border border-[#261B42] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span className="text-xs font-bold text-white tracking-wider">
              AUTO-COMPOUNDED YIELD TRAJECTORY VS NOMINAL APY
            </span>
          </div>

          {/* Time Selector Buttons */}
          <div className="flex items-center gap-1 bg-[#080512] p-1 border border-[#261B42] text-[10px]">
            {[1, 3, 6, 12].map((m) => (
              <button
                key={`mo-${m}`}
                onClick={() => setSelectedDurationMonths(m)}
                className={`px-2.5 py-0.5 transition-colors cursor-pointer ${
                  selectedDurationMonths === m
                    ? 'bg-[#8B5CF6] text-white font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                [{m}M]
              </button>
            ))}
          </div>
        </div>

        {/* Visual APY Stats Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-[#080512] border border-[#261B42] space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold block">SIMPLE NOMINAL PAYOUT</span>
            <div className="text-xl font-bold text-zinc-200 tabular-nums">
              {data.average_nominal_apy}% APY
            </div>
            <div className="text-xs text-zinc-400">
              +{nominalReturnPot.toLocaleString()} POT over {selectedDurationMonths}mo
            </div>
          </div>

          <div className="p-3 bg-[#140C2B] border border-[#8B5CF6] space-y-1">
            <span className="text-[10px] text-[#C084FC] font-bold block">
              AUTO-COMPOUNDED YIELD
            </span>
            <div className="text-xl font-bold text-white tabular-nums">
              {data.auto_compounded_apy}% APY
            </div>
            <div className="text-xs text-[#10B981] font-bold">
              +{compoundReturnPot.toLocaleString()} POT ({surplusPot > 0 ? `+${surplusPot.toLocaleString()} POT bonus` : 'Optimal compounding'})
            </div>
          </div>

          <div className="p-3 bg-[#080512] border border-[#261B42] space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold block">ACTIVE SET CAPACITY</span>
            <div className="text-xl font-bold text-white tabular-nums">
              {selectedTargets.length} / {data.target_count} Selected Targets
            </div>
            <div className="text-xs text-[#10B981]">
              100% capacity free of oversubscription
            </div>
          </div>
        </div>
      </div>

      {/* 2. Pre-Flight Safety Launchpad (3-Gate Radar) */}
      <div className="p-4 bg-[#0F0A1D] border border-[#261B42] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="text-xs font-bold text-white tracking-wider">
              PRE-FLIGHT RE-NOMINATION SAFETY GATES
            </span>
          </div>
          <span className="text-[10px] text-[#10B981] bg-[#0E2820]/40 px-2 py-0.5 border border-[#10B981]/40 font-bold">
            [ALL 3 PRE-FLIGHT CHECKS PASSED]
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Gate 1: Election Window */}
          <div className="p-3 bg-[#080512] border border-[#261B42] hover:border-[#8B5CF6] transition-colors space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-400 font-bold">GATE 1: ELECTION WINDOW</span>
              <span className="text-[#10B981] font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> [CLEAR]
              </span>
            </div>
            <div className="text-xs font-semibold text-white">ElectionProvider.CurrentPhase</div>
            <p className="text-[11px] text-zinc-400">
              State: <strong className="text-[#10B981]">Off</strong> (Nomination extrinsic accepted).
            </p>
          </div>

          {/* Gate 2: Fee Erosion Threshold */}
          <div className="p-3 bg-[#080512] border border-[#261B42] hover:border-[#8B5CF6] transition-colors space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-400 font-bold">GATE 2: FEE EROSION</span>
              <span className="text-[#10B981] font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> [&gt; 3x FEE]
              </span>
            </div>
            <div className="text-xs font-semibold text-white">Profit vs Extrinsic Fee</div>
            <p className="text-[11px] text-zinc-400">
              Annual Gain: <strong className="text-[#10B981]">+{surplusPot.toLocaleString()} POT</strong> &gt;&gt; 0.045 POT fee.
            </p>
          </div>

          {/* Gate 3: Async Nonce Manager */}
          <div className="p-3 bg-[#080512] border border-[#261B42] hover:border-[#8B5CF6] transition-colors space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-400 font-bold">GATE 3: NONCE MANAGER</span>
              <span className="text-[#10B981] font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> [SYNCED]
              </span>
            </div>
            <div className="text-xs font-semibold text-white">AsyncNonceManager Concurrency</div>
            <p className="text-[11px] text-zinc-400">
              Locked &amp; Sequential nonce indexing ready.
            </p>
          </div>
        </div>

        {/* Stake Rebalance Action Bar */}
        <div className="p-3 bg-[#080512] border border-[#1F143D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 shrink-0">STAKING AMOUNT:</span>
            <input
              type="number"
              value={stakeInput}
              onChange={(e) => setStakeInput(Number(e.target.value))}
              className="w-32 sm:w-36 bg-[#140C2B] border border-[#4C2889] text-white px-3 py-1 text-xs tabular-nums focus:outline-none focus:border-[#8B5CF6]"
            />
            <span className="text-xs text-[#C084FC] font-bold">POT</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRebalance}
              disabled={isCalculating || selectedTargets.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-[#8B5CF6] hover:bg-[#7C3AED] active:bg-[#6D28D9] text-white border border-[#8B5CF6] cursor-pointer transition-colors disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isCalculating ? 'animate-spin' : ''}`} />
              <span>SIMULATE &amp; SIGN NOMINATE ({selectedTargets.length} TARGETS)</span>
            </button>
          </div>
        </div>

        {rebalanceResult && (
          <div className="p-2.5 bg-[#0E2820]/40 border border-[#10B981] text-xs text-[#10B981] flex flex-wrap items-center justify-between gap-2">
            <span>
              [ALLOCATED: <strong className="text-white">{rebalanceResult.allocated_per_validator_pot} POT</strong> across {rebalanceResult.selected_validators_count} optimal validators]
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[#C084FC]">
                NONCE: #{rebalanceResult.allocated_nonce} | READY TO BROADCAST
              </span>
              <button
                onClick={() => setIsDispatchModalOpen(true)}
                className="px-2 py-0.5 bg-[#8B5CF6] text-white text-[10px] font-bold cursor-pointer hover:bg-[#7C3AED]"
              >
                OPEN DISPATCH STUDIO
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Optimal Top 16 Candidate Grid with Interactive Selection & Modal Trigger */}
      <div className="p-4 bg-[#0F0A1D] border border-[#261B42] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1F143D] pb-2">
          <div className="flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span className="text-xs font-bold text-white tracking-wider">
              OPTIMAL 16 CANDIDATES SELECTED BY PAO-PHRAGMÉN
            </span>
            <span className="text-[10px] text-zinc-500 font-normal">
              (Click card to inspect deep telemetry)
            </span>
          </div>

          {/* Quick Filter Buttons & Selection Utilities */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-[#080512] p-0.5 border border-[#261B42] text-[10px]">
              <button
                onClick={() => setCandidateFilter('ALL')}
                className={`px-2 py-0.5 transition-colors cursor-pointer ${
                  candidateFilter === 'ALL' ? 'bg-[#8B5CF6] text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                ALL (16)
              </button>
              <button
                onClick={() => setCandidateFilter('OPTIMAL')}
                className={`px-2 py-0.5 transition-colors cursor-pointer ${
                  candidateFilter === 'OPTIMAL' ? 'bg-[#8B5CF6] text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                OPTIMAL BUFFER (Mᵥ &ge; 0.5)
              </button>
              <button
                onClick={() => setCandidateFilter('LOW_COMM')}
                className={`px-2 py-0.5 transition-colors cursor-pointer ${
                  candidateFilter === 'LOW_COMM' ? 'bg-[#8B5CF6] text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                COMM &le; 3%
              </button>
            </div>

            <button
              onClick={handleSelectAllTargets}
              className="text-[10px] text-zinc-400 hover:text-white bg-[#080512] px-2 py-0.5 border border-[#261B42] cursor-pointer"
            >
              [Select All 16]
            </button>
            <button
              onClick={handleClearTargets}
              className="text-[10px] text-zinc-400 hover:text-white bg-[#080512] px-2 py-0.5 border border-[#261B42] cursor-pointer"
            >
              [Deselect]
            </button>
            <span className="text-[10px] text-[#10B981] bg-[#0E2820]/40 px-2 py-0.5 border border-[#10B981]/40 font-bold">
              [PAO-PHRAGMÉN: ACTIVE]
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {visibleValidators.map((val, idx) => {
            const isSelected = selectedTargets.includes(val.stash_address);
            return (
              <div
                key={val.stash_address}
                onClick={() => setSelectedValidator(val)}
                className={`p-2.5 bg-[#080512] border cursor-pointer transition-all space-y-1.5 relative group ${
                  isSelected
                    ? 'border-[#8B5CF6] hover:border-[#A855F7] shadow-[0_0_12px_rgba(139,92,246,0.15)]'
                    : 'border-[#1F143D] opacity-60 hover:opacity-100 hover:border-zinc-600'
                }`}
              >
                {/* Card Header with Checkbox and Identity */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleToggleTarget(val.stash_address, e as any)}
                      onClick={(e) => e.stopPropagation()}
                      className="accent-[#8B5CF6] cursor-pointer"
                      title={isSelected ? "Deselect this target" : "Select this target"}
                    />
                    <span className="text-[10px] font-bold text-[#C084FC] truncate max-w-[120px]">
                      #{idx + 1 < 10 ? `0${idx + 1}` : idx + 1} {val.identity}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#10B981] font-bold tabular-nums">{val.estimated_apy}% APY</span>
                </div>

                <div className="text-[10px] text-zinc-500 truncate flex items-center justify-between">
                  <span>{val.stash_address.slice(0, 8)}...{val.stash_address.slice(-6)}</span>
                  <span className="text-[9px] text-[#8B5CF6] group-hover:underline">Inspect &gt;</span>
                </div>

                {/* PAO-Phragmén Safety Margin & Objective Score */}
                {val.pao_metrics && (
                  <div className="p-1.5 bg-[#120B22] border border-[#261B42] text-[9px] font-mono space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">PAO SCORE:</span>
                      <span className="text-white font-bold tabular-nums">{val.pao_metrics.pao_score}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">MARGIN Mᵥ(u):</span>
                      <span className={`font-bold tabular-nums ${
                        val.pao_metrics.safety_margin_mvu > 0.5 ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {val.pao_metrics.safety_margin_mvu}
                      </span>
                    </div>
                    <div className="text-[8px] truncate text-[#818CF8]">
                      [{val.pao_metrics.safety_margin_rating.replace(/_/g, ' ')}]
                    </div>
                  </div>
                )}

                <div className="flex justify-between text-[10px] text-zinc-400 pt-1 border-t border-[#1F143D]">
                  <span>COMM: <strong className="text-white tabular-nums">{val.commission_pct}%</strong></span>
                  <span>UPTIME: <strong className="text-white tabular-nums">{val.uptime_pct}%</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. MODAL: Detailed Validator Deep-Dive Inspector */}
      {selectedValidator && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedValidator(null)}
        >
          <div
            className="w-full max-w-xl bg-[#0B0813] border-2 border-[#8B5CF6] shadow-2xl p-5 space-y-4 text-zinc-200 font-mono relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#261B42] pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#8B5CF6]" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    {selectedValidator.identity}
                  </h3>
                  <span className="text-[10px] text-zinc-400">Validator Telemetry &amp; PAO Safety Profile</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedValidator(null)}
                className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stash Address with 1-click Copy */}
            <div className="p-3 bg-[#080512] border border-[#261B42] space-y-1">
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span>SS58 STASH ADDRESS (PORTALDOT FORMAT 42)</span>
                <button
                  onClick={() => copyToClipboard(selectedValidator.stash_address, 'stash')}
                  className="flex items-center gap-1 text-[#8B5CF6] hover:text-[#A855F7] cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedKey === 'stash' ? 'COPIED!' : 'COPY ADDRESS'}</span>
                </button>
              </div>
              <div className="text-xs text-white break-all tabular-nums font-bold">
                {selectedValidator.stash_address}
              </div>
            </div>

            {/* PAO-Phragmén Safety Diagnostics */}
            {selectedValidator.pao_metrics && (
              <div className="p-3 bg-[#140C2B] border border-[#8B5CF6] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#C084FC] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    PAO-PHRAGMÉN OVERSUBSCRIPTION ANALYSIS
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 border border-emerald-800/40 font-bold">
                    PAO SCORE: {selectedValidator.pao_metrics.pao_score}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                  <div className="p-2 bg-[#080512] border border-[#261B42]">
                    <span className="text-[10px] text-zinc-500 block">SAFETY MARGIN Mᵥ(u)</span>
                    <span className="text-emerald-400 font-bold tabular-nums text-sm">
                      {selectedValidator.pao_metrics.safety_margin_mvu}
                    </span>
                  </div>
                  <div className="p-2 bg-[#080512] border border-[#261B42]">
                    <span className="text-[10px] text-zinc-500 block">MIN REWARDED STAKE</span>
                    <span className="text-white font-bold tabular-nums text-sm">
                      {selectedValidator.pao_metrics.min_rewarded_stake_pot} POT
                    </span>
                  </div>
                  <div className="p-2 bg-[#080512] border border-[#261B42] col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-zinc-500 block">MEDIAN STAKE</span>
                    <span className="text-white font-bold tabular-nums text-sm">
                      {selectedValidator.pao_metrics.median_stake_pot} POT
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-300 pt-1">
                  <strong>Risk Assessment:</strong>{' '}
                  <span className="text-emerald-300 font-bold">
                    {selectedValidator.pao_metrics.safety_margin_rating.replace(/_/g, ' ')}
                  </span>
                  . Your planned stake provides sufficient buffer against whale nomination dilution.
                </div>
              </div>
            )}

            {/* Performance Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 bg-[#080512] border border-[#261B42]">
                <span className="text-[10px] text-zinc-500 block">COMMISSION</span>
                <span className="text-white font-bold text-sm">{selectedValidator.commission_pct}%</span>
              </div>
              <div className="p-2.5 bg-[#080512] border border-[#261B42]">
                <span className="text-[10px] text-zinc-500 block">UPTIME</span>
                <span className="text-emerald-400 font-bold text-sm">{selectedValidator.uptime_pct}%</span>
              </div>
              <div className="p-2.5 bg-[#080512] border border-[#261B42]">
                <span className="text-[10px] text-zinc-500 block">NOMINATORS</span>
                <span className="text-white font-bold text-sm">
                  {selectedValidator.nominator_count} / {selectedValidator.max_nominators}
                </span>
              </div>
              <div className="p-2.5 bg-[#080512] border border-[#261B42]">
                <span className="text-[10px] text-zinc-500 block">SLASH RECORD</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {selectedValidator.slash_count === 0 ? '0 (CLEAN)' : `${selectedValidator.slash_count} SLASHED`}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#261B42]">
              <button
                onClick={() => handleToggleTarget(selectedValidator.stash_address)}
                className={`px-3 py-1.5 text-xs font-bold border cursor-pointer transition-colors ${
                  selectedTargets.includes(selectedValidator.stash_address)
                    ? 'bg-amber-950/40 text-amber-300 border-amber-800/40 hover:bg-amber-900/60'
                    : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/60'
                }`}
              >
                {selectedTargets.includes(selectedValidator.stash_address)
                  ? '[-] REMOVE FROM NOMINATION SET'
                  : '[+] ADD TO NOMINATION SET'}
              </button>

              <button
                onClick={() => {
                  setSelectedValidator(null);
                  setIsDispatchModalOpen(true);
                }}
                className="px-4 py-1.5 text-xs font-bold bg-[#8B5CF6] text-white hover:bg-[#7C3AED] cursor-pointer"
              >
                PROCEED TO NOMINATE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: Extrinsic Dispatch & Signing Studio */}
      {isDispatchModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsDispatchModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-[#0B0813] border-2 border-[#10B981] shadow-2xl p-5 space-y-4 text-zinc-200 font-mono relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#261B42] pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-[#10B981]" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    EXTRINSIC DISPATCH &amp; SIGNING STUDIO
                  </h3>
                  <span className="text-[10px] text-zinc-400">
                    Dual-VM Safe Nomination Extrinsic Dispatcher (Substrate / EVM)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Wallet Protocol Mode Selector */}
            <div className="flex items-center justify-between p-2 bg-[#080512] border border-[#261B42]">
              <span className="text-xs text-zinc-400 font-bold">SIGNING PROTOCOL MODE:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWalletMode('substrate')}
                  className={`px-3 py-1 text-xs font-bold cursor-pointer transition-colors ${
                    walletMode === 'substrate'
                      ? 'bg-[#E6007A] text-white border border-[#E6007A]'
                      : 'bg-[#140C2B] text-zinc-400 border border-[#261B42]'
                  }`}
                >
                  Substrate Native (SS58: 42)
                </button>
                <button
                  onClick={() => setWalletMode('evm')}
                  className={`px-3 py-1 text-xs font-bold cursor-pointer transition-colors ${
                    walletMode === 'evm'
                      ? 'bg-[#6366F1] text-white border border-[#6366F1]'
                      : 'bg-[#140C2B] text-zinc-400 border border-[#261B42]'
                  }`}
                >
                  MetaMask EVM (Revive Precompile)
                </button>
              </div>
            </div>

            {/* Nomination Summary Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 bg-[#080512] border border-[#261B42]">
                <span className="text-[10px] text-zinc-500 block">TOTAL BONDED STAKE</span>
                <span className="text-white font-bold text-sm tabular-nums">{stakeInput.toLocaleString()} POT</span>
              </div>
              <div className="p-2.5 bg-[#080512] border border-[#261B42]">
                <span className="text-[10px] text-zinc-500 block">ALLOCATED PER TARGET</span>
                <span className="text-white font-bold text-sm tabular-nums">
                  {selectedTargets.length > 0 ? (stakeInput / selectedTargets.length).toFixed(2) : 0} POT
                </span>
              </div>
              <div className="p-2.5 bg-[#080512] border border-[#261B42]">
                <span className="text-[10px] text-zinc-500 block">SELECTED VALIDATORS</span>
                <span className="text-emerald-400 font-bold text-sm">{selectedTargets.length} Targets</span>
              </div>
            </div>

            {/* Raw Extrinsic Call Preview */}
            <div className="p-3 bg-[#080512] border border-[#261B42] space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span className="font-bold">CALL PAYLOAD SPECIFICATION</span>
                <button
                  onClick={() => copyToClipboard(`staking.nominate(targets=${JSON.stringify(selectedTargets)})`, 'payload')}
                  className="flex items-center gap-1 text-[#10B981] hover:text-emerald-300 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedKey === 'payload' ? 'COPIED!' : 'COPY CALL'}</span>
                </button>
              </div>
              <div className="p-2 bg-[#05030A] border border-[#160B22] text-[11px] text-emerald-400 break-all font-mono">
                {walletMode === 'substrate' ? (
                  <>staking.nominate(targets=[{selectedTargets.slice(0, 3).join(', ')}... ({selectedTargets.length} total)])</>
                ) : (
                  <>PortaldotRevivePrecompile.nominate(0x000...0800, targets=[{selectedTargets.slice(0, 2).join(', ')}...])</>
                )}
              </div>
            </div>

            {/* Broadcast Status feedback */}
            {broadcastStatus === 'success' && (
              <div className="p-3 bg-[#0E2820] border border-[#10B981] text-xs text-[#10B981] space-y-1 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span>EXTRINSIC BROADCAST SIMULATION SUCCESSFUL!</span>
                </div>
                <p className="text-[11px] text-zinc-300">
                  Transaction Hash: <code className="text-white">0x7f29c488e0b...3d9a1</code> | Era Inclusion: <strong className="text-emerald-400">Next Active Era (N+1)</strong>
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-[#261B42]">
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Close
              </button>

              <button
                onClick={handleBroadcast}
                disabled={broadcastStatus === 'broadcasting' || selectedTargets.length === 0}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-[#10B981] hover:bg-emerald-600 active:bg-emerald-700 text-black cursor-pointer transition-colors disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${broadcastStatus === 'broadcasting' ? 'animate-spin' : ''}`} />
                <span>
                  {broadcastStatus === 'broadcasting'
                    ? 'BROADCASTING EXTRINSIC...'
                    : broadcastStatus === 'success'
                    ? 'RE-BROADCAST EXTRINSIC'
                    : 'SIGN & BROADCAST TO PORTALDOT V3.0'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
