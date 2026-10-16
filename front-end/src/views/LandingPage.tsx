import React, { useState } from 'react';
import { 
  Zap, 
  Layers, 
  ShieldCheck, 
  TrendingUp, 
  Shield, 
  Workflow, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  Lock, 
  Sparkles, 
  Activity, 
  Terminal,
  Globe,
  Gauge,
  CornerDownRight,
  Menu,
  X
} from 'lucide-react';
import { ThreeCanvas } from '../components/ThreeCanvas';
import { 
  DualTelemetryState, 
  SecurityDashboardState, 
  NPoSRecommendation, 
  ShieldStatus 
} from '../services/api';
import { TabType } from '../services/storage';

interface LandingPageProps {
  onLaunchApp: (tab?: TabType) => void;
  dualData?: DualTelemetryState | null;
  secData?: SecurityDashboardState | null;
  nposData?: NPoSRecommendation | null;
  shieldData?: ShieldStatus | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onLaunchApp,
  dualData,
  secData,
  nposData,
  shieldData
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#080512] text-[#E2E8F0] selection:bg-[#8B5CF6] selection:text-white overflow-x-hidden font-sans">
      {/* Background Cybernetic Grid & Ambient Lighting Orbs */}
      <div className="fixed inset-0 cyber-grid opacity-60 pointer-events-none z-0" />
      <div className="fixed inset-0 cyber-dots opacity-40 pointer-events-none z-0" />
      <div className="fixed inset-0 scanline-overlay opacity-25 pointer-events-none z-0" />

      {/* Dynamic Ambient Neon Glow Orbs */}
      <div className="glow-orb-violet w-[700px] h-[700px] -top-40 left-1/2 -translate-x-1/2 z-0 animate-pulse-glow" />
      <div className="glow-orb-magenta w-[600px] h-[600px] top-60 -left-60 z-0 animate-pulse-glow" style={{ animationDelay: '2s' }} />
      <div className="glow-orb-cyan w-[600px] h-[600px] top-60 -right-60 z-0 animate-pulse-glow" style={{ animationDelay: '4s' }} />

      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-[#261B42]/90 bg-[#080512]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-none bg-[#8B5CF6]/20 border border-[#8B5CF6] flex items-center justify-center text-[#8B5CF6] shadow-lg shadow-[#8B5CF6]/30">
            <Zap className="w-4 h-4 fill-[#8B5CF6]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-wider text-white font-mono">DOTNEXUS</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-none border border-[#4C2889] bg-[#140C2B] text-[#C084FC]">
                Portaldot V3.0
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono hidden sm:block">
              Visual Control Plane & Security Operations Engine
            </div>
          </div>
        </div>

        {/* Center Nav Links (Desktop) */}
        <div className="hidden md:flex items-center gap-6 text-xs font-mono text-zinc-400">
          <a href="#pillars" className="hover:text-[#C084FC] transition-colors flex items-center gap-1">
            <span>The 4 Pillars</span>
          </a>
          <a href="#dag-canvas" className="hover:text-[#C084FC] transition-colors">Visual DAG Engine</a>
          <a href="#comparison" className="hover:text-[#C084FC] transition-colors">Why DotNexus</a>
          <a href="#roadmap" className="hover:text-[#C084FC] transition-colors">Roadmap</a>
        </div>

        {/* Right CTA & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => onLaunchApp()}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-mono rounded-none border border-[#8B5CF6] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold transition-all shadow-lg shadow-[#8B5CF6]/30 hover:scale-[1.02] cursor-pointer"
          >
            <span>Launch Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white hover:bg-[#1E113E] border border-[#261B42]"
            title="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4 text-[#C084FC]" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile Nav Dropdown Sheet */}
      {isMobileMenuOpen && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-[#0A0515]/98 border-b border-[#261B42] p-4 flex flex-col space-y-3 font-mono text-xs md:hidden shadow-2xl backdrop-blur-md">
          <a
            href="#pillars"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-zinc-300 hover:text-[#C084FC] hover:bg-[#140C2B] transition-colors"
          >
            → The 4 Pillars
          </a>
          <a
            href="#dag-canvas"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-zinc-300 hover:text-[#C084FC] hover:bg-[#140C2B] transition-colors"
          >
            → Visual DAG Automation Canvas
          </a>
          <a
            href="#comparison"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-zinc-300 hover:text-[#C084FC] hover:bg-[#140C2B] transition-colors"
          >
            → Why DotNexus Stands Apart
          </a>
          <a
            href="#roadmap"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-zinc-300 hover:text-[#C084FC] hover:bg-[#140C2B] transition-colors"
          >
            → Hackathon Delivery Timeline
          </a>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-[100vh] pt-24 sm:pt-28 pb-16 flex items-center justify-center px-4 sm:px-6 overflow-hidden z-10">
        {/* 3D Background: Three.js Dual-VM Cyber Mesh */}
        <ThreeCanvas />

        {/* Foreground Hero Content */}
        <div className="relative z-20 max-w-5xl mx-auto text-center space-y-6 sm:space-y-8">
          {/* Track Chip */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-none border border-[#4C2889] bg-[#110A24]/90 backdrop-blur-md text-[10px] sm:text-xs font-mono text-[#C084FC] shadow-lg shadow-[#8B5CF6]/20 pointer-events-auto">
            <span className="w-2 h-2 rounded bg-[#10B981] animate-ping" />
            <span className="font-semibold tracking-wider">PORTALDOT HACKER HOUSE 2026 • NODE OPERATIONS &amp; TOOLING</span>
          </div>

          {/* Main Title */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
              The Visual Control Plane &amp; <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#C084FC] to-[#38BDF8] drop-shadow-md">
                Automated Security Operations Engine
              </span>
            </h1>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 pointer-events-auto">
            <button
              onClick={() => onLaunchApp('dual-vm')}
              className="w-full sm:w-auto tech-corner-accent flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3.5 text-sm font-mono rounded-none border border-[#8B5CF6] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold transition-all shadow-xl shadow-[#8B5CF6]/35 hover:scale-[1.02] cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Launch Live Control Center</span>
            </button>

            <a
              href="#pillars"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 text-sm font-mono rounded-none bg-[#110A24]/90 hover:bg-[#180F33] border border-[#2D1F52] hover:border-[#8B5CF6] text-zinc-200 transition-all backdrop-blur-md"
            >
              <Layers className="w-4 h-4 text-[#8B5CF6]" />
              <span>Explore The 4 Pillars</span>
            </a>
          </div>

          {/* Live Floating Cluster Ticker Strip */}
          <div className="pt-6 pointer-events-auto">
            <div className="tech-corner-accent max-w-4xl mx-auto p-3 sm:p-4 rounded-none border border-[#2D1F52] bg-[#110A24]/95 backdrop-blur-md grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-left font-mono shadow-2xl">
              <div className="p-3.5 rounded-none bg-[#080512] border border-[#261B42] relative overflow-hidden group">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-zinc-500 font-bold">WASM BEST BLOCK</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-none bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-base font-bold text-white tabular-nums">
                  #{dualData?.substrate?.best_block ? dualData.substrate.best_block.toLocaleString() : '4,120,912'}
                </div>
                <div className="text-[10px] text-[#E6007A] block mt-1 truncate">
                  {dualData?.substrate?.is_live_chain ? 'LIVE RPC (:9944)' : 'pallet-contracts (ink!)'}
                </div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#E6007A]/60 pointer-events-none" />
              </div>

              <div className="p-3.5 rounded-none bg-[#080512] border border-[#261B42] relative overflow-hidden group">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-zinc-500 font-bold">EVM JSON-RPC</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-none bg-[#818CF8] animate-pulse" />
                </div>
                <div className="text-base font-bold text-[#818CF8] tabular-nums">
                  #{dualData?.evm?.block_number ? dualData.evm.block_number.toLocaleString() : '4,120,911'}
                </div>
                <div className="text-[10px] text-zinc-400 block mt-1 truncate">
                  Delta: {dualData?.sync?.delta_blocks ?? 1} blk ({dualData?.sync?.status ?? 'SYNCED'})
                </div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#6366F1]/60 pointer-events-none" />
              </div>

              <div className="p-3.5 rounded-none bg-[#080512] border border-[#261B42] relative overflow-hidden group">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-zinc-500 font-bold">SLASHING DEFENSE</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-none bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-base font-bold text-[#10B981] tabular-nums">
                  {secData?.equivocation_guard_active || secData?.lock_file_status === 'LOCKED_SAFE' ? '100% Zero-Loss' : 'Active Safe'}
                </div>
                <div className="text-[10px] text-zinc-400 block mt-1 truncate">
                  Node: {secData?.active_node || 'PRIMARY'} (Mutex Lock)
                </div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#10B981]/60 pointer-events-none" />
              </div>

              <div className="p-3.5 rounded-none bg-[#080512] border border-[#261B42] relative overflow-hidden group">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-zinc-500 font-bold">POT STAKING YIELD</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-none bg-[#C084FC] animate-pulse" />
                </div>
                <div className="text-base font-bold text-[#C084FC] tabular-nums">
                  {nposData?.auto_compounded_apy ? `${nposData.auto_compounded_apy.toFixed(2)}% APY` : '15.97% APY'}
                </div>
                <div className="text-[10px] text-emerald-400 block mt-1 font-bold truncate">
                  +{nposData?.apy_boost_pct ? nposData.apy_boost_pct.toFixed(2) : '1.16'}% Auto-Compounded
                </div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#8B5CF6]/60 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Section: The 4 Pillars */}
      <section id="pillars" className="py-24 px-6 relative z-10">
        <div className="glow-orb-violet w-[500px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0" />
        <div className="max-w-6xl mx-auto space-y-14 relative z-10">
          <div className="text-center space-y-3">
            <div className="inline-block px-3 py-1 rounded-none border border-[#4C2889] bg-[#140C2B] text-[11px] font-mono text-[#C084FC] font-bold">
              ENGINE ARCHITECTURE
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              The Four Mission-Critical Pillars
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl mx-auto">
              Custom-built to address the real-world operational challenges of Portaldot V3.0 Dual-VM network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pillar 1 */}
            <div className="tech-corner-accent p-6 rounded-none border border-[#2D1F52] bg-[#110A24]/90 backdrop-blur-md hover:border-[#E6007A]/60 transition-all space-y-4 shadow-xl relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-none bg-[#E6007A]/15 border border-[#E6007A]/40 flex items-center justify-center text-[#E6007A] shadow-lg shadow-[#E6007A]/20">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-[#140C2B] text-zinc-400 border border-[#261B42]">
                  PILLAR 01
                </span>
              </div>

              <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                Dual-Engine State Tracker
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Portaldot V3.0 executes Substrate ink! WASM and EVM Solidity in parallel. DotNexus probes both WebSocket (:9944) and JSON-RPC (:8545), segregates mempools, and raises alarms before state desync hurts consensus.
              </p>

              <div className="p-3.5 rounded-none bg-[#080512] border border-[#261B42] text-xs font-mono space-y-1.5 text-zinc-400">
                <div className="flex justify-between">
                  <span>WASM WS Latency:</span>
                  <span className="text-emerald-400 font-bold">
                    {dualData?.substrate?.latency_ms ? `${dualData.substrate.latency_ms.toFixed(1)} ms (:9944)` : '14.2 ms (:9944)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>EVM RPC Latency:</span>
                  <span className="text-emerald-400 font-bold">
                    {dualData?.evm?.latency_ms ? `${dualData.evm.latency_ms.toFixed(1)} ms (:8545)` : '18.7 ms (:8545)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Mempool Segregation:</span>
                  <span className="text-[#E6007A] font-bold">
                    {dualData?.mempool?.wasm_ratio_pct ? `${dualData.mempool.wasm_ratio_pct.toFixed(1)}% WASM` : '42.9% WASM'}
                  </span>
                  <span className="text-[#818CF8] font-bold">
                    {dualData?.mempool?.evm_ratio_pct ? `${dualData.mempool.evm_ratio_pct.toFixed(1)}% EVM` : '57.1% EVM'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => onLaunchApp('dual-vm')}
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#E6007A] hover:text-white px-3 py-1.5 border border-[#E6007A]/40 hover:bg-[#E6007A]/20 transition-all cursor-pointer font-bold"
                >
                  <span>Launch Telemetry</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="tech-corner-accent p-6 rounded-none border border-[#2D1F52] bg-[#110A24]/90 backdrop-blur-md hover:border-[#8B5CF6]/60 transition-all space-y-4 shadow-xl relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-none bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 flex items-center justify-center text-[#8B5CF6] shadow-lg shadow-[#8B5CF6]/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-[#140C2B] text-zinc-400 border border-[#261B42]">
                  PILLAR 02
                </span>
              </div>

              <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                Automated Key Rotation & Slashing Guard
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Slashing is a validator operator’s worst nightmare. DotNexus provides atomic anti-equivocation locking, automated <code className="text-[#C084FC]">author_rotateKeys</code>, and a heartbeat daemon with automated 2-block failover to standby servers.
              </p>

              <div className="p-3.5 rounded-none bg-[#080512] border border-[#261B42] text-xs font-mono space-y-1.5 text-zinc-400">
                <div className="flex justify-between">
                  <span>Double-Signing Protection:</span>
                  <span className="text-[#10B981] font-bold">Strict Mutex Lease</span>
                </div>
                <div className="flex justify-between">
                  <span>Session Key Rotation:</span>
                  <span className="text-[#C084FC] font-bold">Automated 1-Click</span>
                </div>
                <div className="flex justify-between">
                  <span>Failover Threshold:</span>
                  <span className="text-white font-bold">2 Consecutive Missed Blocks</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => onLaunchApp('slashing')}
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#8B5CF6] hover:text-white px-3 py-1.5 border border-[#8B5CF6]/40 hover:bg-[#8B5CF6]/20 transition-all cursor-pointer font-bold"
                >
                  <span>Launch Slashing Guard</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="tech-corner-accent p-6 rounded-none border border-[#2D1F52] bg-[#110A24]/90 backdrop-blur-md hover:border-[#C084FC]/60 transition-all space-y-4 shadow-xl relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-none bg-[#C084FC]/15 border border-[#C084FC]/40 flex items-center justify-center text-[#C084FC] shadow-lg shadow-[#C084FC]/20">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-[#140C2B] text-zinc-400 border border-[#261B42]">
                  PILLAR 03
                </span>
              </div>

              <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                NPoS Dynamic Re-Nomination Engine
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Eliminates nominator yield loss by scanning validator uptime, commission rates, and oversubscription limits. Algorithmically picks the optimal Top 16 validator set and auto-compounds POT token returns each era.
              </p>

              <div className="p-3.5 rounded-none bg-[#080512] border border-[#261B42] text-xs font-mono space-y-1.5 text-zinc-400">
                <div className="flex justify-between">
                  <span>Scoring Factors:</span>
                  <span className="text-white font-bold">Uptime + Commission + Capacity</span>
                </div>
                <div className="flex justify-between">
                  <span>Greedy/Oversubscribed Pools:</span>
                  <span className="text-[#EF4444] font-bold">Filtered (Zero Loss)</span>
                </div>
                <div className="flex justify-between">
                  <span>Compounding Yield Boost:</span>
                  <span className="text-emerald-400 font-bold">+1.16% APY Gain</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => onLaunchApp('staking')}
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#C084FC] hover:text-white px-3 py-1.5 border border-[#C084FC]/40 hover:bg-[#C084FC]/20 transition-all cursor-pointer font-bold"
                >
                  <span>Launch NPoS Optimizer</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="tech-corner-accent p-6 rounded-none border border-[#2D1F52] bg-[#110A24]/90 backdrop-blur-md hover:border-[#38BDF8]/60 transition-all space-y-4 shadow-xl relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-none bg-[#38BDF8]/15 border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] shadow-lg shadow-[#38BDF8]/20">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-[#140C2B] text-zinc-400 border border-[#261B42]">
                  PILLAR 04
                </span>
              </div>

              <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                RPC Anti-Spam Shield & P2P Topology
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Protects RPC endpoints against OOM crashes caused by heavy archival queries (<code className="text-[#38BDF8]">eth_getLogs</code> span &gt; 2000 blocks). Enforces dynamic IP rate-limiting while prioritizing consensus peer traffic over public bot queries.
              </p>

              <div className="p-3.5 rounded-none bg-[#080512] border border-[#261B42] text-xs font-mono space-y-1.5 text-zinc-400">
                <div className="flex justify-between">
                  <span>Query Packet Filter:</span>
                  <span className="text-[#10B981] font-bold">Blocks Range Spans &gt; 2000</span>
                </div>
                <div className="flex justify-between">
                  <span>Adaptive Rate-Limiting:</span>
                  <span className="text-white font-bold">60 Req / Minute / IP</span>
                </div>
                <div className="flex justify-between">
                  <span>P2P Peer Topology:</span>
                  <span className="text-zinc-200 font-bold">Mesh Anomaly Detection</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => onLaunchApp('shield')}
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#38BDF8] hover:text-white px-3 py-1.5 border border-[#38BDF8]/40 hover:bg-[#38BDF8]/20 transition-all cursor-pointer font-bold"
                >
                  <span>Launch RPC Shield</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Visual DAG Runbook Canvas */}
      <section id="dag-canvas" className="py-24 px-6 border-t border-[#261B42] bg-[#0C071C]/90 relative z-10">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-block px-3 py-1 rounded-none border border-[#4C2889] bg-[#140C2B] text-[11px] font-mono text-[#C084FC] font-bold">
              INNOVATION HIGHLIGHT
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Interactive DAG Automation Canvas
            </h2>
            <p className="text-zinc-400 text-sm max-w-2xl mx-auto">
              Moving beyond passive Grafana dashboards. Connect infrastructure inputs to real-time triggers and automated execution runbooks.
            </p>
          </div>

          {/* Interactive Visual Circuit Board Preview */}
          <div className="tech-corner-accent p-8 rounded-none border border-[#2D1F52] bg-[#110A24]/95 backdrop-blur-md space-y-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-mono border-b border-[#261B42] pb-3">
              <span className="text-[#C084FC] font-bold">RUNBOOK PREVIEW: AUTOMATED SLASHING GUARD FAILOVER</span>
              <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-none bg-[#10B981] animate-ping" />
                Pipeline Armed & Ready
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Step 1 */}
              <div className="p-5 rounded-none border border-[#E6007A]/50 bg-[#170924] space-y-2.5 shadow-lg">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-[#E6007A]/20 text-[#E6007A] font-bold">
                  WATCHER NODE
                </span>
                <div className="text-xs font-bold text-white font-mono">Heartbeat Daemon (:9944)</div>
                <div className="text-[11px] text-zinc-400 font-mono">
                  Trigger condition: Missed Ping &ge; 2 consecutive blocks
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-5 rounded-none border border-[#8B5CF6]/50 bg-[#180E30] space-y-2.5 shadow-lg">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-[#8B5CF6]/20 text-[#C084FC] font-bold">
                  SECURITY MUTEX
                </span>
                <div className="text-xs font-bold text-white font-mono">Anti-Equivocation Lock</div>
                <div className="text-[11px] text-zinc-400 font-mono">
                  Revokes primary node lease to eliminate double-signing risk
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-5 rounded-none border border-[#10B981]/50 bg-[#081F17] space-y-2.5 shadow-lg">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-[#10B981]/20 text-[#10B981] font-bold">
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
                onClick={() => onLaunchApp('canvas')}
                className="flex items-center gap-2 px-6 py-3 text-xs font-mono rounded-none border border-[#8B5CF6] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold transition-all shadow-xl shadow-[#8B5CF6]/35 cursor-pointer hover:scale-[1.02]"
              >
                <Workflow className="w-4 h-4" />
                <span>Open Full Interactive Canvas in Control Center</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Comparison Matrix */}
      <section id="comparison" className="py-24 px-6 border-t border-[#261B42] bg-[#080512] relative z-10">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Why DotNexus Stands Apart
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl mx-auto">
              Comparing DotNexus against traditional Linux CLI scripts and generic passive Grafana metrics.
            </p>
          </div>

          <div className="tech-corner-accent overflow-x-auto rounded-none border border-[#261B42] bg-[#110A24]/95 backdrop-blur-md shadow-2xl">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#261B42] bg-[#180E30] text-zinc-400">
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
      <section id="roadmap" className="py-24 px-6 border-t border-[#261B42] bg-[#0A0617] relative z-10">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-block px-3 py-1 rounded-none border border-[#4C2889] bg-[#140C2B] text-[11px] font-mono text-[#C084FC] font-bold">
              DELIVERY SCHEDULE
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Portaldot Hacker House 2026 Timeline
            </h2>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div className="p-4 rounded-none border border-[#261B42] bg-[#110A24] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
              <div>
                <span className="text-[#C084FC] font-bold">Oct 14, 2026</span> — Official Kick-off Meeting &amp; Workshop
                <div className="text-[11px] text-zinc-400 mt-0.5">Architecture finalized, Dual-VM Engine baseline created.</div>
              </div>
              <span className="self-start sm:self-auto px-2 py-0.5 rounded-none bg-[#10B981]/20 text-[#10B981] font-bold">READY</span>
            </div>

            <div className="p-4 rounded-none border border-[#8B5CF6]/50 bg-[#180E30] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 shadow-lg shadow-[#8B5CF6]/15">
              <div>
                <span className="text-[#C084FC] font-bold">Oct 24, 2026 (12:00 UTC)</span> — DoraHacks Check-in Deadline
                <div className="text-[11px] text-zinc-300 mt-0.5">Dual-Engine Tracker, Slashing Guard &amp; Working Prototype demo.</div>
              </div>
              <span className="self-start sm:self-auto px-2 py-0.5 rounded-none bg-[#8B5CF6]/30 text-[#C084FC] font-bold">CHECK-IN TARGET</span>
            </div>

            <div className="p-4 rounded-none border border-[#261B42] bg-[#110A24] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
              <div>
                <span className="text-zinc-400 font-bold">Nov 06, 2026 (04:00 UTC)</span> — Code Freeze &amp; Final Submission
                <div className="text-[11px] text-zinc-500 mt-0.5">Complete code package, pitch deck &amp; judge verification.</div>
              </div>
              <span className="self-start sm:self-auto px-2 py-0.5 rounded-none bg-zinc-800 text-zinc-400">UPCOMING</span>
            </div>

            <div className="p-4 rounded-none border border-[#261B42] bg-[#110A24] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
              <div>
                <span className="text-zinc-400 font-bold">Nov 07 – 08, 2026</span> — Live Demo Day &amp; Foundation Review
                <div className="text-[11px] text-zinc-500 mt-0.5">Live demonstration with Portaldot Network judges.</div>
              </div>
              <span className="self-start sm:self-auto px-2 py-0.5 rounded-none bg-zinc-800 text-zinc-400">UPCOMING</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-[#261B42] bg-[#06030D] text-center text-xs font-mono text-zinc-500 space-y-2 relative z-10">
        <div>
          DotNexus — Built with passion for <span className="text-[#C084FC] font-bold">Portaldot Network V3.0</span>
        </div>
        <div className="text-[11px] text-zinc-600">
          Node Operations & Tooling Track • Portaldot Hacker House 2026
        </div>
      </footer>
    </div>
  );
};
