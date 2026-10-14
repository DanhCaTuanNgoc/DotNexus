import React from 'react';
import { 
  Zap, 
  Layers, 
  ShieldCheck, 
  TrendingUp, 
  Shield, 
  Workflow, 
  ArrowRight, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  Terminal, 
  Server,
  Code2,
  Lock,
  Flame,
  Globe
} from 'lucide-react';
import { ThreeCanvas } from '../components/ThreeCanvas';

interface LandingPageProps {
  onLaunchApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp }) => {
  return (
    <div className="relative min-h-screen bg-[#0B0813] text-[#E2E8F0] selection:bg-[#8B5CF6] selection:text-white overflow-x-hidden">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-[#261B42]/80 bg-[#0B0813]/85 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6] flex items-center justify-center text-[#8B5CF6] shadow-lg shadow-[#8B5CF6]/25">
            <Zap className="w-4 h-4 fill-[#8B5CF6]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-wider text-white font-mono">DOTNEXUS</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border border-[#4C2889] bg-[#1A1333] text-[#C084FC]">
                v1.0.0
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono hidden sm:block">
              Portaldot Network V3.0 Dual-VM Control Plane
            </div>
          </div>
        </div>

        {/* Center Nav Links */}
        <div className="hidden md:flex items-center gap-6 text-xs font-mono text-zinc-400">
          <a href="#pillars" className="hover:text-[#C084FC] transition-colors">Four Pillars</a>
          <a href="#dag-canvas" className="hover:text-[#C084FC] transition-colors">Visual DAG Engine</a>
          <a href="#comparison" className="hover:text-[#C084FC] transition-colors">Why DotNexus</a>
          <a href="#roadmap" className="hover:text-[#C084FC] transition-colors">Roadmap</a>
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={onLaunchApp}
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono rounded bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold transition-all shadow-lg shadow-[#8B5CF6]/30 hover:scale-[1.02]"
          >
            <span>Launch Control Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[92vh] pt-24 pb-16 flex items-center justify-center px-6 overflow-hidden">
        {/* Interactive Three.js 3D Background */}
        <ThreeCanvas />

        {/* Foreground Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8 pointer-events-auto">
          {/* Track Chip */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#4C2889] bg-[#130E26]/80 backdrop-blur-md text-xs font-mono text-[#C084FC] shadow-inner">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
            <span>PORTALDOT HACKER HOUSE 2026 • NODE OPERATIONS & TOOLING</span>
          </div>

          {/* Main Title */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
              The Visual Control Plane & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#C084FC] to-[#38BDF8]">
                Automated Security Operations Engine
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-zinc-300 font-normal leading-relaxed">
              Designed specifically for <strong className="text-white font-semibold">Portaldot Network V3.0 Dual-VM</strong>. Eliminate catastrophic slashing risks, reconcile Substrate WASM vs EVM desync, and replace opaque CLI scripts with interactive drag-and-drop operational runbooks.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={onLaunchApp}
              className="flex items-center gap-2.5 px-6 py-3.5 text-sm font-mono rounded bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white font-bold transition-all shadow-xl shadow-[#8B5CF6]/35 hover:scale-[1.02]"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Launch Live Control Center</span>
            </button>

            <a
              href="#pillars"
              className="flex items-center gap-2 px-6 py-3.5 text-sm font-mono rounded bg-[#130E26]/90 hover:bg-[#1A1333] border border-[#2D1F52] hover:border-[#8B5CF6] text-zinc-200 transition-all backdrop-blur-md"
            >
              <Layers className="w-4 h-4 text-[#8B5CF6]" />
              <span>Explore The 4 Pillars</span>
            </a>
          </div>

          {/* Live Cluster Ticker Strip */}
          <div className="pt-6">
            <div className="max-w-4xl mx-auto p-3.5 rounded-lg border border-[#261B42]/90 bg-[#130E26]/80 backdrop-blur-md grid grid-cols-2 sm:grid-cols-4 gap-3 text-left font-mono">
              <div className="p-2 rounded bg-[#0B0813]/60 border border-[#261B42]/50">
                <span className="text-[10px] text-zinc-500 block">WASM BEST BLOCK</span>
                <span className="text-sm font-bold text-white tabular-nums">#4,120,912</span>
                <span className="text-[10px] text-emerald-400 block">pallet-contracts</span>
              </div>

              <div className="p-2 rounded bg-[#0B0813]/60 border border-[#261B42]/50">
                <span className="text-[10px] text-zinc-500 block">EVM JSON-RPC</span>
                <span className="text-sm font-bold text-[#818CF8] tabular-nums">#4,120,911</span>
                <span className="text-[10px] text-zinc-400 block">Delta: 1 blk (Synced)</span>
              </div>

              <div className="p-2 rounded bg-[#0B0813]/60 border border-[#261B42]/50">
                <span className="text-[10px] text-zinc-500 block">SLASHING GUARD</span>
                <span className="text-sm font-bold text-[#10B981] tabular-nums">100% Zero-Loss</span>
                <span className="text-[10px] text-zinc-400 block">Anti-Equivocation Mutex</span>
              </div>

              <div className="p-2 rounded bg-[#0B0813]/60 border border-[#261B42]/50">
                <span className="text-[10px] text-zinc-500 block">POT STAKING YIELD</span>
                <span className="text-sm font-bold text-[#C084FC] tabular-nums">15.97% APY</span>
                <span className="text-[10px] text-emerald-400 block">+1.16% Auto-Compounded</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: The 4 Pillars */}
      <section id="pillars" className="py-20 px-6 border-t border-[#261B42] bg-[#0E0A1A]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-block px-2.5 py-1 rounded border border-[#4C2889] bg-[#1A1333] text-[11px] font-mono text-[#C084FC]">
              ENGINE ARCHITECTURE
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              The Four Mission-Critical Pillars
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl mx-auto">
              Custom-built to address the real-world operational challenges of Portaldot V3.0 Dual-VM network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-xl border border-[#261B42] bg-[#130E26] hover:border-[#8B5CF6]/60 transition-all space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-[#E6007A]/15 border border-[#E6007A]/40 flex items-center justify-center text-[#E6007A]">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1A1333] text-zinc-400 border border-[#261B42]">
                  PILLAR 01
                </span>
              </div>

              <h3 className="text-lg font-bold text-white font-mono">
                Dual-Engine State Tracker
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Portaldot V3.0 executes Substrate ink! WASM and EVM Solidity in parallel. DotNexus probes both WebSocket (:9944) and JSON-RPC (:8545), segregates mempools, and raises alarms before state desync hurts consensus.
              </p>

              <div className="p-3 rounded bg-[#0B0813] border border-[#261B42] text-xs font-mono space-y-1 text-zinc-400">
                <div className="flex justify-between">
                  <span>WASM WS Ping:</span>
                  <span className="text-emerald-400 font-semibold">14.2 ms</span>
                </div>
                <div className="flex justify-between">
                  <span>EVM RPC Ping:</span>
                  <span className="text-emerald-400 font-semibold">18.7 ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Mempool Segregation:</span>
                  <span className="text-[#E6007A] font-semibold">42.9% WASM</span>
                  <span className="text-[#818CF8] font-semibold">57.1% EVM</span>
                </div>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-xl border border-[#261B42] bg-[#130E26] hover:border-[#8B5CF6]/60 transition-all space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 flex items-center justify-center text-[#8B5CF6]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1A1333] text-zinc-400 border border-[#261B42]">
                  PILLAR 02
                </span>
              </div>

              <h3 className="text-lg font-bold text-white font-mono">
                Automated Key Rotation & Slashing Guard
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Slashing is a validator operator’s worst nightmare. DotNexus provides atomic anti-equivocation locking, automated <code className="text-[#C084FC]">author_rotateKeys</code>, and a heartbeat daemon with automated 2-block failover to standby servers.
              </p>

              <div className="p-3 rounded bg-[#0B0813] border border-[#261B42] text-xs font-mono space-y-1 text-zinc-400">
                <div className="flex justify-between">
                  <span>Double-Signing Protection:</span>
                  <span className="text-[#10B981] font-semibold">Active Strict Mutex</span>
                </div>
                <div className="flex justify-between">
                  <span>Session Key Rotation:</span>
                  <span className="text-[#C084FC] font-semibold">Automated 1-Click</span>
                </div>
                <div className="flex justify-between">
                  <span>Failover Trigger Threshold:</span>
                  <span className="text-white font-semibold">2 Consecutive Missed Blocks</span>
                </div>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-xl border border-[#261B42] bg-[#130E26] hover:border-[#8B5CF6]/60 transition-all space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-[#C084FC]/15 border border-[#C084FC]/40 flex items-center justify-center text-[#C084FC]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1A1333] text-zinc-400 border border-[#261B42]">
                  PILLAR 03
                </span>
              </div>

              <h3 className="text-lg font-bold text-white font-mono">
                NPoS Dynamic Re-Nomination Engine
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Eliminates nominator yield loss by scanning validator uptime, commission rates, and oversubscription limits. Algorithmically picks the optimal Top 16 validator set and auto-compounds POT token returns each era.
              </p>

              <div className="p-3 rounded bg-[#0B0813] border border-[#261B42] text-xs font-mono space-y-1 text-zinc-400">
                <div className="flex justify-between">
                  <span>Scoring Metrics:</span>
                  <span className="text-white font-semibold">Uptime + Commission + Capacity</span>
                </div>
                <div className="flex justify-between">
                  <span>Greedy/Oversubscribed Pools:</span>
                  <span className="text-[#EF4444] font-semibold">Filtered (Zero Yield Loss)</span>
                </div>
                <div className="flex justify-between">
                  <span>Compounding Yield Boost:</span>
                  <span className="text-emerald-400 font-semibold">+1.16% APY Gain</span>
                </div>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-xl border border-[#261B42] bg-[#130E26] hover:border-[#8B5CF6]/60 transition-all space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-[#38BDF8]/15 border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8]">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1A1333] text-zinc-400 border border-[#261B42]">
                  PILLAR 04
                </span>
              </div>

              <h3 className="text-lg font-bold text-white font-mono">
                RPC Anti-Spam Shield & P2P Topology
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Protects RPC endpoints against OOM crashes caused by heavy archival queries (<code className="text-[#38BDF8]">eth_getLogs</code> span &gt; 2000 blocks). Enforces dynamic IP rate-limiting while prioritizing consensus peer traffic over public bot queries.
              </p>

              <div className="p-3 rounded bg-[#0B0813] border border-[#261B42] text-xs font-mono space-y-1 text-zinc-400">
                <div className="flex justify-between">
                  <span>Query Packet Filter:</span>
                  <span className="text-[#10B981] font-semibold">Blocks Range Spans &gt; 2000</span>
                </div>
                <div className="flex justify-between">
                  <span>Adaptive Rate-Limiting:</span>
                  <span className="text-white font-semibold">60 Req / Minute / IP</span>
                </div>
                <div className="flex justify-between">
                  <span>P2P Peer Topology:</span>
                  <span className="text-zinc-200 font-semibold">Active Mesh Anomaly Detection</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Visual DAG Runbook Canvas */}
      <section id="dag-canvas" className="py-20 px-6 border-t border-[#261B42] bg-[#0B0813]">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-block px-2.5 py-1 rounded border border-[#4C2889] bg-[#1A1333] text-[11px] font-mono text-[#C084FC]">
              INNOVATION HIGHLIGHT
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Interactive DAG Automation Canvas
            </h2>
            <p className="text-zinc-400 text-sm max-w-2xl mx-auto">
              Moving beyond passive Grafana dashboards. Connect infrastructure inputs to real-time triggers and automated execution runbooks.
            </p>
          </div>

          {/* Interactive Visual Circuit Board Preview */}
          <div className="p-6 rounded-xl border border-[#2D1F52] bg-[#0E0A1A] space-y-6 shadow-2xl">
            <div className="flex items-center justify-between text-xs font-mono border-b border-[#261B42] pb-3">
              <span className="text-[#C084FC] font-semibold">SAMPLE RUNBOOK: AUTOMATED SLASHING GUARD FAILOVER</span>
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                Pipeline Armed & Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Step 1 */}
              <div className="p-4 rounded-lg border border-[#E6007A]/40 bg-[#1A0E26] space-y-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E6007A]/20 text-[#E6007A] font-bold">
                  WATCHER NODE
                </span>
                <div className="text-xs font-bold text-white font-mono">Heartbeat Daemon (:9944)</div>
                <div className="text-[11px] text-zinc-400 font-mono">
                  Trigger condition: Missed Ping &ge; 2 consecutive blocks
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-lg border border-[#8B5CF6]/50 bg-[#1E1238] space-y-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#8B5CF6]/20 text-[#C084FC] font-bold">
                  SECURITY MUTEX
                </span>
                <div className="text-xs font-bold text-white font-mono">Anti-Equivocation Lock</div>
                <div className="text-[11px] text-zinc-400 font-mono">
                  Revokes primary node lease to eliminate double-signing risk
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-lg border border-[#10B981]/40 bg-[#0E261E] space-y-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-bold">
                  ACTION NODE
                </span>
                <div className="text-xs font-bold text-white font-mono">Activate Standby Node IP</div>
                <div className="text-[11px] text-zinc-400 font-mono">
                  Promotes standby server (:9945) to active validator
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={onLaunchApp}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-mono rounded bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold transition-all shadow-lg shadow-[#8B5CF6]/30"
              >
                <Workflow className="w-4 h-4" />
                <span>Open Interactive Canvas in Control Center</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Comparison Matrix */}
      <section id="comparison" className="py-20 px-6 border-t border-[#261B42] bg-[#0E0A1A]">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Why DotNexus Stands Apart
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl mx-auto">
              Comparing DotNexus against traditional Linux CLI scripts and generic passive Grafana metrics.
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#261B42] bg-[#130E26]">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#261B42] bg-[#1A1333] text-zinc-400">
                  <th className="p-4">Capability</th>
                  <th className="p-4 text-zinc-500">Manual Linux CLI</th>
                  <th className="p-4 text-zinc-500">Grafana / Prometheus</th>
                  <th className="p-4 text-[#C084FC] font-bold">DotNexus Control Plane</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#261B42] text-zinc-300">
                <tr>
                  <td className="p-4 font-bold text-white">Dual-VM Sync (WASM vs EVM)</td>
                  <td className="p-4 text-zinc-500">Requires manual curl to 2 ports</td>
                  <td className="p-4 text-zinc-400">Separate graphs, no correlation</td>
                  <td className="p-4 text-emerald-400 font-bold">Realtime parity delta & mempool split</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Slashing & Equivocation Protection</td>
                  <td className="p-4 text-[#EF4444]">High risk of human error</td>
                  <td className="p-4 text-zinc-500">Passive alert only (too late)</td>
                  <td className="p-4 text-emerald-400 font-bold">Atomic mutex lease & 2-block failover</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">RPC Spam & OOM Crash Defense</td>
                  <td className="p-4 text-zinc-500">Nginx manual configuration</td>
                  <td className="p-4 text-zinc-500">Not supported</td>
                  <td className="p-4 text-emerald-400 font-bold">Deep eth_getLogs packet inspection</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">NPoS Dynamic Staking Optimization</td>
                  <td className="p-4 text-zinc-500">Complex polkadot-js UI</td>
                  <td className="p-4 text-zinc-500">Not supported</td>
                  <td className="p-4 text-emerald-400 font-bold">Algorithm Top 16 + Auto-compounding</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Operational Execution Mode</td>
                  <td className="p-4 text-zinc-500">Manual terminal bash typing</td>
                  <td className="p-4 text-zinc-500">Read-only passive display</td>
                  <td className="p-4 text-emerald-400 font-bold">Visual DAG Drag-and-Drop Canvas</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section: Hackathon Roadmap */}
      <section id="roadmap" className="py-20 px-6 border-t border-[#261B42] bg-[#0B0813]">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-block px-2.5 py-1 rounded border border-[#4C2889] bg-[#1A1333] text-[11px] font-mono text-[#C084FC]">
              DELIVERY SCHEDULE
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Portaldot Hacker House 2026 Timeline
            </h2>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div className="p-4 rounded-lg border border-[#261B42] bg-[#130E26] flex items-center justify-between">
              <div>
                <span className="text-[#C084FC] font-bold">Oct 14, 2026</span> — Official Kick-off Meeting & Workshop
                <div className="text-[11px] text-zinc-400 mt-0.5">Architecture finalized, Dual-VM Engine baseline created.</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-bold">READY</span>
            </div>

            <div className="p-4 rounded-lg border border-[#8B5CF6]/50 bg-[#1A1333] flex items-center justify-between">
              <div>
                <span className="text-[#C084FC] font-bold">Oct 24, 2026 (12:00 UTC)</span> — DoraHacks Check-in Deadline
                <div className="text-[11px] text-zinc-300 mt-0.5">Dual-Engine Tracker, Slashing Guard & Working Prototype demo.</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#8B5CF6]/30 text-[#C084FC] font-bold">CHECK-IN TARGET</span>
            </div>

            <div className="p-4 rounded-lg border border-[#261B42] bg-[#130E26] flex items-center justify-between">
              <div>
                <span className="text-zinc-400 font-bold">Nov 06, 2026 (04:00 UTC)</span> — Code Freeze & Final Submission
                <div className="text-[11px] text-zinc-500 mt-0.5">Complete code package, pitch deck & judge verification.</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">UPCOMING</span>
            </div>

            <div className="p-4 rounded-lg border border-[#261B42] bg-[#130E26] flex items-center justify-between">
              <div>
                <span className="text-zinc-400 font-bold">Nov 07 – 08, 2026</span> — Live Demo Day & Foundation Review
                <div className="text-[11px] text-zinc-500 mt-0.5">Live demonstration with Portaldot Network judges.</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">UPCOMING</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[#261B42] bg-[#090610] text-center text-xs font-mono text-zinc-500 space-y-2">
        <div>
          DotNexus — Built with passion for <span className="text-[#C084FC]">Portaldot Network V3.0</span>
        </div>
        <div className="text-[11px] text-zinc-600">
          Node Operations & Tooling Track • Portaldot Hacker House 2026
        </div>
      </footer>
    </div>
  );
};
