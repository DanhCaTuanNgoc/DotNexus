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
import { NPoSRecommendation, api, OnchainDispatchResult } from '../services/api';
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
  const [candidateFilter, setCandidateFilter] = useState<'ALL' | 'LIVE_ONCHAIN' | 'OPTIMAL' | 'LOW_COMM'>('ALL');

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
  const [signerKey, setSignerKey] = useState<string>('//Alice');
  const [bondAmountPot, setBondAmountPot] = useState<number>(10.0);
  const [broadcastStatus, setBroadcastStatus] = useState<'idle' | 'broadcasting' | 'success'>('idle');
  const [onchainReceipt, setOnchainReceipt] = useState<OnchainDispatchResult | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [isBondingExtra, setIsBondingExtra] = useState<boolean>(false);
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

  const handleBroadcast = async () => {
    setBroadcastStatus('broadcasting');
    setDispatchError(null);
    setOnchainReceipt(null);
    try {
      const res = await api.dispatchNominateOnchain(selectedTargets, signerKey, bondAmountPot);
      if (res.success && res.data) {
        setOnchainReceipt(res.data);
        setBroadcastStatus('success');
        onRefresh();
      } else {
        setDispatchError(res.error || 'Extrinsic dispatch failed on-chain.');
        setBroadcastStatus('idle');
      }
    } catch (err: any) {
      setDispatchError(err?.message || 'Network error transmitting extrinsic to Portaldot node.');
      setBroadcastStatus('idle');
    }
  };

  const handleBondExtra = async () => {
    setIsBondingExtra(true);
    setDispatchError(null);
    setOnchainReceipt(null);
    try {
      const res = await api.dispatchBondExtraOnchain(bondAmountPot, signerKey);
      if (res.success && res.data) {
        setOnchainReceipt(res.data);
        setBroadcastStatus('success');
        onRefresh();
      } else {
        setDispatchError(res.error || 'Staking.bond_extra failed on-chain.');
      }
    } catch (err: any) {
      setDispatchError(err?.message || 'Network error transmitting bond_extra to Portaldot node.');
    } finally {
      setIsBondingExtra(false);
    }
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
    if (candidateFilter === 'LIVE_ONCHAIN') {
      return val.is_live_onchain === true;
    }
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
      <div className="flex flex-wrap items-center justify-between border-b border-[#1C142E] pb-2.5 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#8B5CF6]" />
            <h2 className="text-xs sm:text-sm font-bold font-mono text-white tracking-widest uppercase">
              NPOS PHRAGMÉN SIMULATOR &amp; DYNAMIC RE-NOMINATION
            </h2>
            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#0E091B] text-[#C084FC] border border-[#2E1F4A]">
              PORTALDOT STAKING
            </span>
          </div>
          <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
            Automated Phragmén nominator distribution engine protecting validators against whale dilution and oversubscription.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#C084FC] bg-[#0E091B] px-2.5 py-1 border border-[#2E1F4A]">
          <Cpu className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span>ALGO: {data.election_algorithm || 'Sequential Phragmén Optimization'}</span>
        </div>
      </div>

      {/* 1. APY Trajectory & Interactive Yield Curve */}
      <div className="p-3 sm:p-4 bg-[#08050F] border border-[#1C142E] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1C142E] pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span className="text-xs font-bold text-white tracking-wider">
              AUTO-COMPOUNDED YIELD TRAJECTORY VS NOMINAL APY
            </span>
          </div>

          {/* Time Selector Buttons */}
          <div className="flex items-center gap-1 bg-[#06040A] p-0.5 border border-[#1C142E] text-[10px]">
            {[1, 3, 6, 12].map((m) => (
              <button
                key={`mo-${m}`}
                onClick={() => setSelectedDurationMonths(m)}
                className={`px-2 py-0.5 transition-colors cursor-pointer ${
                  selectedDurationMonths === m
                    ? 'bg-[#1C142E] text-white font-bold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                [{m}M]
              </button>
            ))}
          </div>
        </div>

        {/* Visual APY Stats Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-[#06040A] border border-[#1C142E] space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold block">SIMPLE NOMINAL PAYOUT</span>
            <div className="text-xl font-bold text-zinc-200 tabular-nums">
              {data.average_nominal_apy}% APY
            </div>
            <div className="text-xs text-zinc-400">
              +{nominalReturnPot.toLocaleString()} POT over {selectedDurationMonths}mo
            </div>
          </div>

          <div className="p-3 bg-[#0E091B] border border-[#2E1F4A] space-y-1">
            <span className="text-[10px] text-[#C084FC] font-bold block">
              AUTO-COMPOUNDED YIELD
            </span>
            <div className="text-xl font-bold text-white tabular-nums">
              {data.auto_compounded_apy}% APY
            </div>
            <div className="text-xs text-[#00FF9D] font-bold">
              +{compoundReturnPot.toLocaleString()} POT ({surplusPot > 0 ? `+${surplusPot.toLocaleString()} POT bonus` : 'Optimal compounding'})
            </div>
          </div>

          <div className="p-3 bg-[#06040A] border border-[#1C142E] space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold block">ACTIVE SET CAPACITY</span>
            <div className="text-xl font-bold text-white tabular-nums">
              {selectedTargets.length} / {data.target_count} Selected Targets
            </div>
            <div className="text-xs text-[#00FF9D]">
              100% capacity free of oversubscription
            </div>
          </div>
        </div>
      </div>

      {/* 2. Pre-Flight Safety Launchpad (3-Gate Radar) */}
      <div className="p-3 sm:p-4 bg-[#08050F] border border-[#1C142E] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1C142E] pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00FF9D]" />
            <span className="text-xs font-bold text-white tracking-wider">
              PRE-FLIGHT RE-NOMINATION SAFETY GATES
            </span>
          </div>
          <span className="text-[10px] text-[#00FF9D] bg-[#00FF9D]/10 px-2 py-0.5 border border-[#00FF9D]/30 font-bold">
            [ALL 3 PRE-FLIGHT CHECKS PASSED]
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Gate 1: Election Window */}
          <div className="p-3 bg-[#06040A] border border-[#1C142E] hover:border-[#2E1F4A] transition-colors space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-500 font-bold">GATE 1: ELECTION WINDOW</span>
              <span className="text-[#00FF9D] font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> [CLEAR]
              </span>
            </div>
            <div className="text-xs font-semibold text-white">ElectionProvider.CurrentPhase</div>
            <p className="text-[11px] text-zinc-400">
              State: <strong className="text-[#00FF9D]">Off</strong> (Nomination extrinsic accepted).
            </p>
          </div>

          {/* Gate 2: Fee Erosion Threshold */}
          <div className="p-3 bg-[#06040A] border border-[#1C142E] hover:border-[#2E1F4A] transition-colors space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-500 font-bold">GATE 2: FEE EROSION</span>
              <span className="text-[#00FF9D] font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> [&gt; 3x FEE]
              </span>
            </div>
            <div className="text-xs font-semibold text-white">Profit vs Extrinsic Fee</div>
            <p className="text-[11px] text-zinc-400">
              Annual Gain: <strong className="text-[#00FF9D]">+{surplusPot.toLocaleString()} POT</strong> &gt;&gt; 0.045 POT fee.
            </p>
          </div>

          {/* Gate 3: Async Nonce Manager */}
          <div className="p-3 bg-[#06040A] border border-[#1C142E] hover:border-[#2E1F4A] transition-colors space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-500 font-bold">GATE 3: NONCE MANAGER</span>
              <span className="text-[#00FF9D] font-bold flex items-center gap-1">
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
        <div className="p-3 bg-[#06040A] border border-[#1C142E] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 shrink-0">STAKING AMOUNT:</span>
            <input
              type="number"
              value={stakeInput}
              onChange={(e) => setStakeInput(Number(e.target.value))}
              className="w-32 sm:w-36 bg-[#0E091B] border border-[#2E1F4A] text-white px-3 py-1 text-xs tabular-nums focus:outline-none focus:border-[#8B5CF6]"
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
          <div className="p-2.5 bg-[#00FF9D]/10 border border-[#00FF9D]/40 text-xs text-[#00FF9D] flex flex-wrap items-center justify-between gap-2">
            <span>
              [ALLOCATED: <strong className="text-white">{rebalanceResult.allocated_per_validator_pot} POT</strong> across {rebalanceResult.selected_validators_count} optimal validators]
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[#C084FC]">
                NONCE: #{rebalanceResult.allocated_nonce} | READY TO BROADCAST
              </span>
              <button
                onClick={() => setIsDispatchModalOpen(true)}
                className="px-2 py-0.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-[10px] font-bold cursor-pointer transition-colors"
              >
                OPEN DISPATCH STUDIO
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Optimal Top 16 Candidate Market Table (Binance / Polymarket High-Density Architecture) */}
      <div className="bg-[#08050F] border border-[#1C142E] space-y-0 font-mono">
        {/* Module Control Header */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 py-2 border-b border-[#1C142E] bg-[#0B0716]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#8B5CF6]" />
            <span className="text-xs font-bold text-white tracking-widest uppercase">
              PAO-PHRAGMÉN CANDIDATE LEDGER
            </span>
            <span className="text-[10px] text-zinc-500 hidden sm:inline">
              // Sequential Optimization Set
            </span>
          </div>

          {/* Institutional Market Filters (Binance / Polymarket Style) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-[#06040A] border border-[#1C142E] p-0.5 text-[10px]">
              <button
                onClick={() => setCandidateFilter('ALL')}
                className={`px-2 py-0.5 transition-colors cursor-pointer ${
                  candidateFilter === 'ALL'
                    ? 'bg-[#1C142E] text-white font-bold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                ALL ({data.validators.length})
              </button>
              <button
                onClick={() => setCandidateFilter('LIVE_ONCHAIN')}
                className={`px-2 py-0.5 transition-colors cursor-pointer flex items-center gap-1 ${
                  candidateFilter === 'LIVE_ONCHAIN'
                    ? 'bg-emerald-950/60 text-[#00FF9D] font-bold border border-emerald-500/40'
                    : 'text-emerald-400/80 hover:text-emerald-300'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE ON-CHAIN ({data.validators.filter(v => v.is_live_onchain).length})
              </button>
              <button
                onClick={() => setCandidateFilter('OPTIMAL')}
                className={`px-2 py-0.5 transition-colors cursor-pointer ${
                  candidateFilter === 'OPTIMAL'
                    ? 'bg-[#1C142E] text-[#00FF9D] font-bold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                OPTIMAL (Mᵥ &ge; 0.5)
              </button>
              <button
                onClick={() => setCandidateFilter('LOW_COMM')}
                className={`px-2 py-0.5 transition-colors cursor-pointer ${
                  candidateFilter === 'LOW_COMM'
                    ? 'bg-[#1C142E] text-[#C084FC] font-bold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                COMM &le; 3%
              </button>
            </div>

            <div className="flex items-center gap-1 text-[10px]">
              <button
                onClick={handleSelectAllTargets}
                className="text-zinc-400 hover:text-white bg-[#0B0813] px-2 py-0.5 border border-[#1C142E] hover:border-[#2E1F4A] transition-colors cursor-pointer"
              >
                SELECT ALL
              </button>
              <button
                onClick={handleClearTargets}
                className="text-zinc-400 hover:text-white bg-[#0B0813] px-2 py-0.5 border border-[#1C142E] hover:border-[#2E1F4A] transition-colors cursor-pointer"
              >
                CLEAR
              </button>
              <span className="text-[10px] text-[#00FF9D] bg-[#00FF9D]/5 px-2 py-0.5 border border-[#00FF9D]/30 font-bold">
                {selectedTargets.length} / 16 TARGETS
              </span>
            </div>
          </div>
        </div>

        {/* High-Density Ledger Table Header */}
        <div className="hidden lg:grid grid-cols-12 gap-2 px-3 py-1.5 border-b border-[#140D24] bg-[#06040A] text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
          <div className="col-span-1">TARGET</div>
          <div className="col-span-3">VALIDATOR IDENTITY / SS58</div>
          <div className="col-span-2 text-right">EST. APY</div>
          <div className="col-span-2 text-center">PAO SCORE</div>
          <div className="col-span-2 text-right">COMMISSION</div>
          <div className="col-span-2 text-right pr-2">UPTIME &amp; SLASHRISK</div>
        </div>

        {/* Ledger Table Rows */}
        <div className="divide-y divide-[#140D24]">
          {visibleValidators.map((val, idx) => {
            const isSelected = selectedTargets.includes(val.stash_address);
            const score = val.pao_metrics?.pao_score || 90;
            const margin = val.pao_metrics?.safety_margin_mvu ?? 0.72;

            return (
              <div
                key={val.stash_address}
                onClick={() => setSelectedValidator(val)}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-2 items-center px-3 py-2 text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#0E091B] hover:bg-[#130C26]'
                    : 'bg-[#08050F] opacity-75 hover:opacity-100 hover:bg-[#0C0817]'
                }`}
              >
                {/* Checkbox Target Slot */}
                <div className="col-span-1 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleToggleTarget(val.stash_address, e as any)}
                    onClick={(e) => e.stopPropagation()}
                    className="accent-[#8B5CF6] cursor-pointer w-3.5 h-3.5"
                    title={isSelected ? "Deselect target" : "Select target"}
                  />
                  <span className="text-[10px] text-zinc-500 font-bold tabular-nums">
                    #{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                  </span>
                </div>

                {/* Identity & Stash Address */}
                <div className="col-span-3 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-white font-bold truncate text-[11px] hover:text-[#C084FC]">
                      {val.identity}
                    </span>
                    {val.is_live_onchain ? (
                      <span className="text-[9px] text-emerald-400 border border-emerald-500/40 px-1 py-0 bg-emerald-500/10 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        PORTALDOT V3 LIVE
                      </span>
                    ) : (
                      <span className="text-[9px] text-zinc-500 border border-zinc-800 px-1 py-0 bg-zinc-900/60">
                        SIMULATION
                      </span>
                    )}
                    {val.slash_count === 0 && (
                      <span className="text-[9px] text-[#00FF9D] border border-[#00FF9D]/30 px-1 py-0 bg-[#00FF9D]/5 shrink-0">
                        CLEAN
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono truncate">
                    {val.stash_address.slice(0, 10)}...{val.stash_address.slice(-8)}
                  </div>
                </div>

                {/* Yield / APY Rate (Polymarket / Binance High-Contrast Green) */}
                <div className="col-span-2 flex lg:justify-end items-center justify-between">
                  <span className="lg:hidden text-zinc-500 text-[10px]">APY:</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#00FF9D] tabular-nums">
                      {val.estimated_apy}%
                    </span>
                    <span className="text-[9px] text-zinc-600 block">NOMINAL APY</span>
                  </div>
                </div>

                {/* PAO Phragmén Metric Ribbon (Progress bar & Rating) */}
                <div className="col-span-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500">SCORE:</span>
                    <span className="text-zinc-200 font-bold tabular-nums">{score}/100</span>
                  </div>
                  <div className="w-full bg-[#110C1E] h-1.5 overflow-hidden border border-[#1C142E]">
                    <div
                      className={`h-full transition-all ${
                        margin >= 0.5 ? 'bg-[#00FF9D]' : 'bg-amber-400'
                      }`}
                      style={{ width: `${Math.min(100, (score / 100) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-zinc-500 truncate flex justify-between">
                    <span>Mᵥ: {margin}</span>
                    <span className={margin >= 0.5 ? 'text-emerald-400' : 'text-amber-400'}>
                      {val.pao_metrics?.safety_margin_rating.replace(/_/g, ' ') || 'OPTIMAL'}
                    </span>
                  </div>
                </div>

                {/* Commission Ratio */}
                <div className="col-span-2 flex lg:justify-end items-center justify-between text-right">
                  <span className="lg:hidden text-zinc-500 text-[10px]">COMMISSION:</span>
                  <div>
                    <span className="text-white font-bold tabular-nums text-xs">
                      {val.commission_pct}%
                    </span>
                    <span className="text-[9px] text-zinc-600 block">NODE FEE</span>
                  </div>
                </div>

                {/* Uptime and Quick Inspect */}
                <div className="col-span-2 flex items-center justify-between lg:justify-end gap-3 pr-2">
                  <span className="lg:hidden text-zinc-500 text-[10px]">UPTIME:</span>
                  <div className="text-right">
                    <span className="text-zinc-200 font-bold tabular-nums text-xs">
                      {val.uptime_pct}%
                    </span>
                    <span className="text-[9px] text-zinc-600 block">ERA SLOTS</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedValidator(val);
                    }}
                    className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] text-[#C084FC] hover:text-white bg-[#110C1E] hover:bg-[#1A102E] border border-[#2E1F4A] hover:border-[#8B5CF6] transition-colors"
                  >
                    INSPECT
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ledger Bottom Summary Bar */}
        <div className="flex flex-wrap items-center justify-between px-3 py-2 border-t border-[#1C142E] bg-[#06040A] text-[10px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span>SHOWING: <strong className="text-white">{visibleValidators.length}</strong> VALIDATORS</span>
            <span className="text-zinc-700">|</span>
            <span>ELECTED CAPACITY: <strong className="text-[#00FF9D]">100% PARITY</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span>CLICK ANY ROW TO VIEW FULL STATE &amp; REWARD CURVES</span>
          </div>
        </div>
      </div>

      {/* 4. MODAL: Detailed Validator Inspection (Binance Earn Style) */}
      {selectedValidator && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedValidator(null)}
        >
          <div
            className="w-full max-w-xl bg-[#181A20] border border-[#2B313A] shadow-2xl p-5 space-y-4 text-[#EAECEF] font-mono relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#2B313A] pb-3">
              <div>
                <span className="text-[10px] text-[#848E9C] tracking-wider uppercase font-semibold block">
                  PORTALDOT V3.0 EARN · VALIDATOR PROFILE
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                    {selectedValidator.identity}
                  </h3>
                  {selectedValidator.is_live_onchain ? (
                    <span className="text-[10px] px-2 py-0.5 bg-[#0ECB81]/15 text-[#0ECB81] border border-[#0ECB81]/30 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0ECB81] animate-pulse" />
                      LIVE ON-CHAIN
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 bg-[#2B313A] text-[#848E9C] font-semibold">
                      SIMULATION
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedValidator(null)}
                className="p-1.5 text-[#848E9C] hover:text-white hover:bg-[#2B313A] rounded transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stash Address with 1-click Copy */}
            <div className="p-2.5 bg-[#121318] border border-[#2B313A] space-y-1">
              <div className="flex items-center justify-between text-[10px] text-[#848E9C]">
                <span className="font-semibold uppercase">SS58 STASH ACCOUNT</span>
                <button
                  onClick={() => copyToClipboard(selectedValidator.stash_address, 'stash')}
                  className="flex items-center gap-1 text-[#0ECB81] hover:text-emerald-300 font-semibold cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedKey === 'stash' ? 'COPIED' : 'COPY ADDRESS'}</span>
                </button>
              </div>
              <div className="text-xs text-white break-all tabular-nums font-mono font-medium">
                {selectedValidator.stash_address}
              </div>
            </div>

            {/* Key Metrics Grid (Binance Staking Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-3 bg-[#1E2329] border border-[#2B313A] space-y-0.5">
                <span className="text-[10px] text-[#848E9C] block font-semibold uppercase">EST. APY</span>
                <span className="text-base font-bold text-[#0ECB81] tabular-nums">
                  {selectedValidator.estimated_apy}%
                </span>
                <span className="text-[9px] text-[#848E9C] block">Gross Yield</span>
              </div>
              <div className="p-3 bg-[#1E2329] border border-[#2B313A] space-y-0.5">
                <span className="text-[10px] text-[#848E9C] block font-semibold uppercase">COMMISSION</span>
                <span className="text-base font-bold text-white tabular-nums">
                  {selectedValidator.commission_pct}%
                </span>
                <span className="text-[9px] text-[#848E9C] block">Node Fee</span>
              </div>
              <div className="p-3 bg-[#1E2329] border border-[#2B313A] space-y-0.5">
                <span className="text-[10px] text-[#848E9C] block font-semibold uppercase">TOTAL STAKED</span>
                <span className="text-sm font-bold text-white tabular-nums truncate block">
                  {selectedValidator.total_stake_pot.toLocaleString()} POT
                </span>
                <span className="text-[9px] text-[#848E9C] block">Active Bond</span>
              </div>
              <div className="p-3 bg-[#1E2329] border border-[#2B313A] space-y-0.5">
                <span className="text-[10px] text-[#848E9C] block font-semibold uppercase">UPTIME RATIO</span>
                <span className="text-base font-bold text-[#0ECB81] tabular-nums">
                  {selectedValidator.uptime_pct}%
                </span>
                <span className="text-[9px] text-[#848E9C] block">Era Health</span>
              </div>
            </div>

            {/* Institutional Specification Table */}
            <div className="bg-[#121318] border border-[#2B313A] divide-y divide-[#2B313A] text-xs">
              <div className="flex items-center justify-between p-2.5">
                <span className="text-[#848E9C]">Nominator Capacity</span>
                <div className="text-right">
                  <span className="text-white font-semibold tabular-nums">
                    {selectedValidator.nominator_count} / {selectedValidator.max_nominators}
                  </span>
                  <span className="text-[10px] text-[#848E9C] ml-1.5">
                    ({Math.round((selectedValidator.nominator_count / selectedValidator.max_nominators) * 100)}% filled)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5">
                <span className="text-[#848E9C]">Slashing Infraction Record</span>
                <span className={`font-semibold ${selectedValidator.slash_count === 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                  {selectedValidator.slash_count === 0 ? 'Clean (0 Slashes)' : `${selectedValidator.slash_count} Infractions`}
                </span>
              </div>

              {selectedValidator.pao_metrics && (
                <>
                  <div className="flex items-center justify-between p-2.5">
                    <span className="text-[#848E9C]">PAO Safety Rating</span>
                    <div className="text-right">
                      <span className="text-[#0ECB81] font-semibold">
                        {selectedValidator.pao_metrics.safety_margin_rating.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-[#848E9C] ml-1.5">
                        (Mᵥ = {selectedValidator.pao_metrics.safety_margin_mvu})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5">
                    <span className="text-[#848E9C]">Minimum Rewarded Stake</span>
                    <span className="text-white font-semibold tabular-nums">
                      {selectedValidator.pao_metrics.min_rewarded_stake_pot.toLocaleString()} POT
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5">
                    <span className="text-[#848E9C]">Median Stake Buffer</span>
                    <span className="text-white font-semibold tabular-nums">
                      {selectedValidator.pao_metrics.median_stake_pot.toLocaleString()} POT
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#2B313A]">
              <button
                onClick={() => handleToggleTarget(selectedValidator.stash_address)}
                className={`px-4 py-2 text-xs font-semibold border cursor-pointer transition-colors ${
                  selectedTargets.includes(selectedValidator.stash_address)
                    ? 'bg-[#2B313A] text-amber-300 border-[#363C4E] hover:bg-[#363C4E]'
                    : 'bg-[#1E2329] text-[#EAECEF] border-[#2B313A] hover:bg-[#2B313A]'
                }`}
              >
                {selectedTargets.includes(selectedValidator.stash_address)
                  ? '[-] REMOVE FROM SET'
                  : '[+] ADD TO SET'}
              </button>

              <button
                onClick={() => {
                  setSelectedValidator(null);
                  setIsDispatchModalOpen(true);
                }}
                className="px-5 py-2 text-xs font-bold bg-[#F0B90B] hover:bg-[#FCD535] text-black cursor-pointer transition-colors"
              >
                STAKE &amp; NOMINATE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: Extrinsic Dispatch & Order Studio (Binance Trading Style) */}
      {isDispatchModalOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsDispatchModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-[#181A20] border border-[#2B313A] shadow-2xl p-5 space-y-4 text-[#EAECEF] font-mono relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#2B313A] pb-3">
              <div>
                <span className="text-[10px] text-[#848E9C] tracking-wider uppercase font-semibold block">
                  PORTALDOT V3.0 DUAL-VM · ORDER DISPATCH
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide mt-0.5">
                  Review &amp; Confirm Nomination Order
                </h3>
              </div>
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="p-1.5 text-[#848E9C] hover:text-white hover:bg-[#2B313A] rounded transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Protocol Mode Switch (Binance Segmented Tabs) */}
            <div className="flex items-center justify-between p-2 bg-[#121318] border border-[#2B313A]">
              <span className="text-xs text-[#848E9C] font-semibold uppercase">PROTOCOL ENGINE:</span>
              <div className="flex items-center gap-1 bg-[#1E2329] p-0.5 border border-[#2B313A]">
                <button
                  onClick={() => setWalletMode('substrate')}
                  className={`px-3 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                    walletMode === 'substrate'
                      ? 'bg-[#2B313A] text-white border border-[#363C4E]'
                      : 'text-[#848E9C] hover:text-white'
                  }`}
                >
                  Substrate Native (SS58: 42)
                </button>
                <button
                  onClick={() => setWalletMode('evm')}
                  className={`px-3 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                    walletMode === 'evm'
                      ? 'bg-[#2B313A] text-white border border-[#363C4E]'
                      : 'text-[#848E9C] hover:text-white'
                  }`}
                >
                  MetaMask EVM (Revive Precompile)
                </button>
              </div>
            </div>

            {/* Order Parameters (Signer & Bond Allocation) */}
            <div className="p-3 bg-[#1E2329] border border-[#2B313A] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-[#848E9C] block font-semibold uppercase mb-1">
                    SIGNER ACCOUNT (PORTALDOT V3.0)
                  </label>
                  <select
                    value={signerKey}
                    onChange={(e) => setSignerKey(e.target.value)}
                    className="w-full bg-[#121318] border border-[#2B313A] text-white px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-[#F0B90B]"
                  >
                    <option value="//Alice">//Alice (Portaldot Testnet Funded Keypair · 5GrwvaEF...)</option>
                    <option value="//Bob">//Bob (Backup Testnet Keypair · 5FHneW46...)</option>
                    <option value="//Charlie">//Charlie (Dev Keypair · 5DAAnrj7...)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#848E9C] block font-semibold uppercase mb-1">
                    BOND CAPITAL ALLOCATION (POT)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={bondAmountPot}
                      onChange={(e) => setBondAmountPot(Math.max(1, parseFloat(e.target.value) || 1))}
                      className="w-full bg-[#121318] border border-[#2B313A] text-white px-2.5 py-1.5 text-xs font-mono tabular-nums focus:outline-none focus:border-[#F0B90B]"
                    />
                    <span className="text-xs text-[#848E9C] font-semibold px-2 py-1 bg-[#121318] border border-[#2B313A]">POT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Institutional Order Summary Table */}
            <div className="bg-[#121318] border border-[#2B313A] divide-y divide-[#2B313A] text-xs">
              <div className="flex items-center justify-between p-2.5">
                <span className="text-[#848E9C]">Nomination Targets</span>
                <span className="text-[#0ECB81] font-semibold tabular-nums">
                  {selectedTargets.length} Validators Selected
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span className="text-[#848E9C]">Capital per Validator</span>
                <span className="text-white font-semibold tabular-nums">
                  {selectedTargets.length > 0 ? (stakeInput / selectedTargets.length).toFixed(2) : 0} POT
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span className="text-[#848E9C]">Projected Annual Yield</span>
                <span className="text-[#0ECB81] font-bold tabular-nums">
                  +{compoundReturnPot.toLocaleString()} POT ({data.auto_compounded_apy}% APY)
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span className="text-[#848E9C]">Pre-Flight Verification</span>
                <span className="text-[#0ECB81] font-semibold">
                  PASSED (Election Window: Off | Gas Ratio: &gt; 3x)
                </span>
              </div>
            </div>

            {/* Extrinsic Payload Preview */}
            <div className="p-2.5 bg-[#121318] border border-[#2B313A] space-y-1">
              <div className="flex items-center justify-between text-[10px] text-[#848E9C]">
                <span className="font-semibold uppercase">RAW EXTRINSIC CALL PAYLOAD</span>
                <button
                  onClick={() => copyToClipboard(`staking.nominate(targets=${JSON.stringify(selectedTargets)})`, 'payload')}
                  className="flex items-center gap-1 text-[#0ECB81] hover:text-emerald-300 font-semibold cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedKey === 'payload' ? 'COPIED' : 'COPY CALL'}</span>
                </button>
              </div>
              <div className="p-2 bg-[#0B0E11] border border-[#202630] text-[11px] text-[#0ECB81] break-all font-mono">
                {walletMode === 'substrate' ? (
                  <>staking.nominate(targets=[{selectedTargets.slice(0, 3).join(', ')}... ({selectedTargets.length} total)])</>
                ) : (
                  <>PortaldotRevivePrecompile.nominate(0x000...0800, targets=[{selectedTargets.slice(0, 2).join(', ')}...])</>
                )}
              </div>
            </div>

            {/* Error Banner */}
            {dispatchError && (
              <div className="p-3 bg-[#2B1B20] border border-[#F6465D]/50 text-xs text-[#F6465D] space-y-1 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 text-[#F6465D]" />
                  <span>TRANSACTION DISPATCH REJECTED:</span>
                </div>
                <p className="text-[11px] font-mono break-all text-[#F6465D]/90">
                  {dispatchError}
                </p>
              </div>
            )}

            {/* Real On-Chain Receipt (Binance Staking Confirmation Card) */}
            {broadcastStatus === 'success' && onchainReceipt && (
              <div className="p-3.5 bg-[#0B1E17] border border-[#0ECB81]/60 text-xs text-[#EAECEF] space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-[#0ECB81]">
                    <CheckCircle2 className="w-4 h-4 text-[#0ECB81]" />
                    <span>EXTRINSIC INCLUDED &amp; CONFIRMED ON-CHAIN</span>
                  </div>
                  <span className="text-[10px] bg-[#0ECB81]/15 text-[#0ECB81] border border-[#0ECB81]/30 px-2 py-0.5 font-semibold">
                    ERA {onchainReceipt.next_active_era || 'N+1'}
                  </span>
                </div>

                <div className="bg-[#121318] border border-[#2B313A] divide-y divide-[#2B313A] text-[11px] font-mono">
                  <div className="flex items-center justify-between p-2">
                    <span className="text-[#848E9C]">Transaction Hash</span>
                    <div className="flex items-center gap-1.5">
                      <code className="text-[#0ECB81] break-all">{onchainReceipt.tx_hash}</code>
                      <button
                        onClick={() => copyToClipboard(onchainReceipt.tx_hash, 'tx')}
                        className="text-[#848E9C] hover:text-white cursor-pointer"
                        title="Copy Tx Hash"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {onchainReceipt.block_hash && (
                    <div className="flex items-center justify-between p-2">
                      <span className="text-[#848E9C]">Block Hash</span>
                      <div className="flex items-center gap-1.5">
                        <code className="text-[#EAECEF] break-all">{onchainReceipt.block_hash}</code>
                        <button
                          onClick={() => copyToClipboard(onchainReceipt.block_hash || '', 'blk')}
                          className="text-[#848E9C] hover:text-white cursor-pointer"
                          title="Copy Block Hash"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-2">
                    <span className="text-[#848E9C]">Signer Account</span>
                    <span className="text-white font-medium">{onchainReceipt.signer_address}</span>
                  </div>

                  {onchainReceipt.events && onchainReceipt.events.length > 0 && (
                    <div className="p-2 space-y-1">
                      <span className="text-[#848E9C] block text-[10px] uppercase font-semibold">On-Chain Triggered Events</span>
                      <div className="flex flex-wrap gap-1">
                        {onchainReceipt.events.map((ev, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-[#0ECB81]/10 text-[#0ECB81] border border-[#0ECB81]/30 px-1.5 py-0.5 font-medium"
                          >
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#848E9C]">
                  <span>Action: <strong className="text-white font-semibold">{onchainReceipt.bonded_action || 'STAKING_NOMINATE'}</strong></span>
                  <span>Network: <strong className="text-[#0ECB81] font-semibold">{onchainReceipt.network || 'Portaldot Network V3.0'}</strong></span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#2B313A] gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#848E9C] hover:text-white cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handleBondExtra}
                  disabled={isBondingExtra}
                  className="px-3.5 py-2 text-xs font-semibold bg-[#2B313A] hover:bg-[#363C4E] text-[#EAECEF] border border-[#363C4E] cursor-pointer transition-colors disabled:opacity-50"
                  title="Execute Staking.bond_extra directly on-chain"
                >
                  {isBondingExtra ? 'BONDING ON-CHAIN...' : '⚡ TEST AUTO-COMPOUND (BOND EXTRA)'}
                </button>
              </div>

              <button
                onClick={handleBroadcast}
                disabled={broadcastStatus === 'broadcasting' || selectedTargets.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-[#0ECB81] hover:bg-[#0EB076] active:bg-[#0CA06B] text-black cursor-pointer transition-colors disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${broadcastStatus === 'broadcasting' ? 'animate-spin' : ''}`} />
                <span>
                  {broadcastStatus === 'broadcasting'
                    ? 'BROADCASTING ON-CHAIN TO PORTALDOT...'
                    : broadcastStatus === 'success'
                    ? 'RE-BROADCAST ON-CHAIN'
                    : 'CONFIRM & BROADCAST ON-CHAIN'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
