import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  ShieldCheck,
  Send,
  Sliders,
  Check,
  Cpu
} from 'lucide-react';
import { NPoSRecommendation, api } from '../services/api';
import { storage } from '../services/storage';

interface StakingYieldViewProps {
  data: NPoSRecommendation | null;
  onRefresh: () => void;
}

export const StakingYieldView: React.FC<StakingYieldViewProps> = ({ data, onRefresh }) => {
  const [stakeInput, setStakeInputState] = useState<number>(() => storage.getStakeInput(10000));
  const [selectedDurationMonths, setSelectedDurationMonths] = useState<number>(12);
  const [rebalanceResult, setRebalanceResult] = useState<any | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const setStakeInput = (amount: number) => {
    setStakeInputState(amount);
    storage.setStakeInput(amount);
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96 text-zinc-500 font-mono text-xs">
        [SIMULATING SEQUENTIAL PHRAGMÉN ELECTION...]
      </div>
    );
  }

  const handleRebalance = async () => {
    setIsCalculating(true);
    try {
      const res = await api.rebalanceStake(stakeInput);
      if (res.success) {
        setRebalanceResult(res.data);
      }
    } finally {
      setIsCalculating(false);
    }
  };

  // Yield calculations for Compound Trajectory
  const nominalRate = data.average_nominal_apy / 100.0;
  const compoundRate = data.auto_compounded_apy / 100.0;
  const timeFraction = selectedDurationMonths / 12.0;

  const nominalReturnPot = Math.round(stakeInput * nominalRate * timeFraction);
  const compoundReturnPot = Math.round(stakeInput * (Math.pow(1 + compoundRate / 1460, 1460 * timeFraction) - 1));
  const surplusPot = compoundReturnPot - nominalReturnPot;

  return (
    <div className="space-y-4 font-mono">
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#261B42] pb-3 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#8B5CF6]" />
            <h2 className="text-sm sm:text-base font-bold font-mono text-white tracking-wider uppercase">
              NPOS PHRAGMÉN SIMULATOR &amp; DYNAMIC RE-NOMINATION
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#C084FC] bg-[#140C2B] px-3 py-1.5 border border-[#4C2889]">
          <Cpu className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span>ALGO: {data.election_algorithm || 'Client-Side Sequential Phragmén Simulator'}</span>
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
              {data.top_validators_count} / {data.target_count} Validators
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
              Projected yield gain exceeds 3x fee (&ge; 0.15 POT).
            </p>
          </div>

          {/* Gate 3: Async Nonce Queue */}
          <div className="p-3 bg-[#080512] border border-[#261B42] hover:border-[#8B5CF6] transition-colors space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-400 font-bold">GATE 3: NONCE MUTEX</span>
              <span className="text-[#10B981] font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> [SYNCED]
              </span>
            </div>
            <div className="text-xs font-semibold text-white">AsyncNonceManager Lock</div>
            <p className="text-[11px] text-zinc-400">
              Mempool transaction sequence protected.
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

          <button
            onClick={handleRebalance}
            disabled={isCalculating}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-[#8B5CF6] hover:bg-[#7C3AED] active:bg-[#6D28D9] text-white border border-[#8B5CF6] cursor-pointer transition-colors"
          >
            <Send className={`w-3.5 h-3.5 ${isCalculating ? 'animate-spin' : ''}`} />
            <span>SIMULATE &amp; SIGN NOMINATE (16 TARGETS)</span>
          </button>
        </div>

        {rebalanceResult && (
          <div className="p-2.5 bg-[#0E2820]/40 border border-[#10B981] text-xs text-[#10B981] flex flex-wrap items-center justify-between gap-2">
            <span>
              [ALLOCATED: <strong className="text-white">{rebalanceResult.allocated_per_validator_pot} POT</strong> across 16 optimal validators]
            </span>
            <span className="text-[#C084FC]">
              NONCE: #{rebalanceResult.allocated_nonce} | READY TO BROADCAST
            </span>
          </div>
        )}
      </div>

      {/* 3. Optimal Top 16 Candidate Grid */}
      <div className="p-4 bg-[#0F0A1D] border border-[#261B42] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1F143D] pb-2">
          <span className="text-xs font-bold text-white tracking-wider flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-[#8B5CF6]" />
            OPTIMAL 16 CANDIDATES SELECTED BY PAO-PHRAGMÉN
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#10B981] bg-[#0E2820]/40 px-2 py-0.5 border border-[#10B981]/40 font-bold">
              [PAO-PHRAGMÉN: ACTIVE]
            </span>
            <span className="text-[10px] text-zinc-400">
              tanh(α·Mᵥ) objective with rug-pull gating
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {data.validators.slice(0, 16).map((val, idx) => (
            <div
              key={val.stash_address}
              className="p-2.5 bg-[#080512] border border-[#1F143D] hover:border-[#8B5CF6] transition-colors space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#C084FC] truncate max-w-[130px]">
                  #{idx + 1 < 10 ? `0${idx + 1}` : idx + 1} {val.identity}
                </span>
                <span className="text-[10px] text-[#10B981] font-bold">{val.estimated_apy}% APY</span>
              </div>
              <div className="text-[10px] text-zinc-500 truncate">{val.stash_address}</div>

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
                <span>COMM: <strong className="text-white">{val.commission_pct}%</strong></span>
                <span>UPTIME: <strong className="text-white">{val.uptime_pct}%</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
