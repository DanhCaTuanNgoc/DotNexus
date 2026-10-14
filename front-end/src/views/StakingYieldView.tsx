import React, { useState } from 'react';
import { TrendingUp, Award, CheckCircle2, ShieldAlert, Sparkles, Send } from 'lucide-react';
import { NPoSRecommendation, api } from '../services/api';

interface StakingYieldViewProps {
  data: NPoSRecommendation | null;
  onRefresh: () => void;
}

export const StakingYieldView: React.FC<StakingYieldViewProps> = ({ data, onRefresh }) => {
  const [stakeInput, setStakeInput] = useState<number>(10000);
  const [rebalanceResult, setRebalanceResult] = useState<any | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  if (!data) {
    return <div className="text-zinc-500 font-mono text-xs">Loading NPoS Scorecard...</div>;
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

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white tracking-wide flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#8B5CF6]" />
            NPoS Dynamic Re-Nomination Engine
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Algorithmic scoring, oversubscription avoidance, and automated era compounding for POT Token.
          </p>
        </div>
      </div>

      {/* APY Boost Callout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="tech-corner-accent p-4 rounded-none border border-[#261B42] bg-[#110A24]">
          <span className="text-zinc-500 font-mono text-[11px] block font-bold">NOMINAL AVERAGE APY</span>
          <span className="text-2xl font-bold font-mono text-zinc-200 tabular-nums">
            {data.average_nominal_apy}%
          </span>
          <span className="text-[11px] text-zinc-500 block mt-1">Standard simple staking payout</span>
        </div>

        <div className="tech-corner-accent p-4 rounded-none border border-[#8B5CF6]/50 bg-[#180E30]">
          <span className="text-[#C084FC] font-mono text-[11px] block flex items-center gap-1 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            AUTO-COMPOUNDED APY
          </span>
          <span className="text-2xl font-bold font-mono text-[#C084FC] tabular-nums">
            {data.auto_compounded_apy}%
          </span>
          <span className="text-[11px] text-emerald-400 block mt-1 font-mono font-bold">
            +{data.apy_boost_pct}% Yield Boost (Reinvested each Era)
          </span>
        </div>

        <div className="tech-corner-accent p-4 rounded-none border border-[#261B42] bg-[#110A24]">
          <span className="text-zinc-500 font-mono text-[11px] block font-bold">OPTIMAL ACTIVE SET</span>
          <span className="text-2xl font-bold font-mono text-white tabular-nums">
            {data.top_validators_count} / {data.target_count} Nodes
          </span>
          <span className="text-[11px] text-zinc-500 block mt-1">Filtered from oversubscription & greedy pools</span>
        </div>
      </div>

      {/* Stake Rebalance Action Card */}
      <div className="tech-corner-accent p-4 rounded-none border border-[#261B42] bg-[#110A24] space-y-4">
        <div className="text-xs font-mono font-semibold text-white">
          DYNAMIC STAKE ALLOCATION SIMULATOR
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#080512] border border-[#261B42] rounded-none px-3 py-1.5">
            <span className="text-xs font-mono text-zinc-400">Stake Amount:</span>
            <input
              type="number"
              value={stakeInput}
              onChange={(e) => setStakeInput(Number(e.target.value))}
              className="bg-transparent text-white font-mono text-xs w-28 focus:outline-none"
            />
            <span className="text-xs font-mono text-[#C084FC] font-semibold">POT</span>
          </div>

          <button
            onClick={handleRebalance}
            disabled={isCalculating}
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-none border border-[#8B5CF6] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            {isCalculating ? 'Computing Allocation...' : 'Generate Nomination Plan'}
          </button>
        </div>

        {rebalanceResult && (
          <div className="p-3 rounded-none bg-[#080512] border border-[#4C2889] text-xs font-mono space-y-2">
            <div className="text-[#C084FC] font-bold">
              Generated Rebalance Payload ({rebalanceResult.selected_validators_count} Validators):
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-zinc-300">
              <div>Stake per Node: <span className="text-white font-bold">{rebalanceResult.allocated_per_validator_pot} POT</span></div>
              <div>Est. Annual Yield: <span className="text-emerald-400 font-bold">+{rebalanceResult.projected_annual_yield_pot} POT</span></div>
              <div>Projected APY: <span className="text-emerald-400 font-bold">{rebalanceResult.projected_apy_compound}%</span></div>
              <div>Status: <span className="text-[#10B981] font-bold">{rebalanceResult.status}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Top 16 Validators Table */}
      <div className="tech-corner-accent p-4 rounded-none border border-[#261B42] bg-[#110A24] space-y-3">
        <div className="text-xs font-mono font-semibold text-zinc-300 flex items-center justify-between">
          <span>RECOMMENDED ACTIVE VALIDATOR SET</span>
          <span className="text-zinc-500 text-[11px]">Ranked by Multifactor Health Score</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#261B42] text-zinc-500">
                <th className="py-2">Rank</th>
                <th className="py-2">Validator Identity</th>
                <th className="py-2">Health Score</th>
                <th className="py-2">Commission</th>
                <th className="py-2">Uptime</th>
                <th className="py-2">Nominators</th>
                <th className="py-2">Est. APY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#261B42]/50 text-zinc-300">
              {data.validators.map((v, i) => (
                <tr key={i} className="hover:bg-[#1A1333]">
                  <td className="py-2 text-[#C084FC]">#{i + 1}</td>
                  <td className="py-2">
                    <div className="text-white font-medium">{v.identity}</div>
                    <div className="text-[10px] text-zinc-500">{v.stash_address.slice(0, 16)}...</div>
                  </td>
                  <td className="py-2">
                    <span className="px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-bold">
                      {v.health_score}/100
                    </span>
                  </td>
                  <td className="py-2 text-zinc-300">{v.commission_pct}%</td>
                  <td className="py-2 text-emerald-400">{v.uptime_pct}%</td>
                  <td className="py-2 text-zinc-300">{v.nominator_count} / {v.max_nominators}</td>
                  <td className="py-2 text-[#C084FC] font-bold">{v.estimated_apy}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
