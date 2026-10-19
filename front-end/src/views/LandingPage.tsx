import React, { useState, useEffect, useRef } from 'react';
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
  X,
  Check,
  CircleDot,
  Clock,
  ChevronRight
} from 'lucide-react';
import { ThreeCanvas } from '../components/ThreeCanvas';
import dotnexusIcon from '../assets/Icon.png';
import { 
  DualTelemetryState, 
  SecurityDashboardState, 
  NPoSRecommendation, 
  ShieldStatus 
} from '../services/api';
import { TabType } from '../services/storage';

interface LazySectionProps {
  id?: string;
  className?: string;
  minHeight?: string;
  fallbackText?: string;
  children: React.ReactNode;
}

/**
 * High-performance viewport lazy-loader for heavy landing sections.
 * Preloads 250px ahead of viewport to eliminate layout shifts (CLS)
 * while keeping initial DOM weight minimal for fast 60fps rendering.
 */
const LazySection: React.FC<LazySectionProps> = ({
  id,
  className = '',
  minHeight = 'min-h-[480px]',
  fallbackText = 'INITIALIZING MODULE TELEMETRY...',
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const target = containerRef.current;
    if (!target) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '250px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id={id}
      ref={containerRef}
      className={`${className} ${!isVisible ? minHeight : ''}`}
    >
      {isVisible ? (
        children
      ) : (
        <div className="max-w-6xl mx-auto py-28 px-4 flex flex-col items-center justify-center space-y-3 opacity-30 select-none">
          <div className="w-5 h-5 border border-[#8B5CF6] border-t-transparent animate-spin rounded-none" />
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            {fallbackText}
          </span>
        </div>
      )}
    </section>
  );
};

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
      <div className="absolute pointer-events-none rounded-full glow-orb-violet w-[700px] h-[700px] -top-40 left-1/2 -translate-x-1/2 z-0 animate-pulse-glow" />
      <div className="absolute pointer-events-none rounded-full glow-orb-magenta w-[600px] h-[600px] top-60 -left-60 z-0 animate-pulse-glow" style={{ animationDelay: '2s' }} />
      <div className="absolute pointer-events-none rounded-full glow-orb-cyan w-[600px] h-[600px] top-60 -right-60 z-0 animate-pulse-glow" style={{ animationDelay: '4s' }} />

      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-[#261B42]/90 bg-[#080512]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <img
            src={dotnexusIcon}
            alt="DotNexus"
            className="w-11 h-11 sm:w-12 sm:h-12 object-contain rounded-none border border-[#261B42]"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-wider text-white font-mono">DOTNEXUS</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-none border border-[#4C2889] bg-[#140C2B] text-[#C084FC]">
                Portaldot V3.0
              </span>
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
      
      {/* Section: The 4 Pillars — Modular 4-Column High-Density Grid */}
      <section id="pillars" className="py-20 sm:py-24 px-4 sm:px-6 border-t border-[#1C142E] bg-[#07040E] relative z-10">
        <div className="max-w-6xl mx-auto space-y-10 sm:space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#1C142E] pb-6">
            <div className="space-y-2">
              <div className="inline-block px-2.5 py-0.5 rounded-none border border-[#3E216B] bg-[#120B24] text-[10px] font-mono text-[#C084FC] font-bold tracking-widest uppercase">
                ENGINE ARCHITECTURE
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
                The Four Mission-Critical Pillars
              </h2>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-md font-mono">
              Engineered exclusively for Portaldot Network V3.0 Dual-VM node operators and validators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pillar 1: Dual-VM State Tracker */}
            <div 
              onClick={() => onLaunchApp('dual-vm')}
              className="tech-corner-accent p-5 rounded-none border border-[#1C142E] bg-[#0B0813] hover:border-[#E6007A]/60 transition-all flex flex-col justify-between space-y-4 group cursor-pointer hover:bg-[#110A1E]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-none bg-[#E6007A]/15 border border-[#E6007A]/40 flex items-center justify-center text-[#E6007A]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-none bg-[#140822] text-[#E6007A] border border-[#E6007A]/30 font-bold">
                    PILLAR // 01
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono group-hover:text-[#E6007A] transition-colors">
                    Dual-Engine Tracker
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    Correlates Substrate WASM (:9944) &amp; EVM (:8545) states in real time, detecting state desync before consensus penalties.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#1C142E]">
                <div className="p-2.5 rounded-none bg-[#06040A] border border-[#1C142E] text-[10px] font-mono space-y-1 text-zinc-400">
                  <div className="flex justify-between">
                    <span>WASM WS:</span>
                    <span className="text-emerald-400 font-bold tabular-nums">
                      {dualData?.substrate?.latency_ms ? `${dualData.substrate.latency_ms.toFixed(1)}ms` : '14.2ms'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>EVM RPC:</span>
                    <span className="text-emerald-400 font-bold tabular-nums">
                      {dualData?.evm?.latency_ms ? `${dualData.evm.latency_ms.toFixed(1)}ms` : '18.7ms'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mempool:</span>
                    <span className="text-[#E6007A] font-bold">WASM + EVM</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#E6007A] font-bold pt-1">
                  <span>Launch Telemetry</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>

            {/* Pillar 2: Slashing Guard & Mutex */}
            <div 
              onClick={() => onLaunchApp('slashing')}
              className="tech-corner-accent p-5 rounded-none border border-[#1C142E] bg-[#0B0813] hover:border-[#8B5CF6]/60 transition-all flex flex-col justify-between space-y-4 group cursor-pointer hover:bg-[#110A1E]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-none bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 flex items-center justify-center text-[#8B5CF6]">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-none bg-[#140822] text-[#C084FC] border border-[#8B5CF6]/30 font-bold">
                    PILLAR // 02
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono group-hover:text-[#C084FC] transition-colors">
                    Slashing &amp; Mutex Guard
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    Strict atomic anti-equivocation mutex lease eliminates double-signing slashing. Automated 2-block failover to standby.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#1C142E]">
                <div className="p-2.5 rounded-none bg-[#06040A] border border-[#1C142E] text-[10px] font-mono space-y-1 text-zinc-400">
                  <div className="flex justify-between">
                    <span>Equivocation:</span>
                    <span className="text-[#10B981] font-bold">Atomic Mutex Lease</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Session Keys:</span>
                    <span className="text-[#C084FC] font-bold">1-Click Rotate</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Failover Lag:</span>
                    <span className="text-white font-bold">&le; 2 Missed Blks</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#8B5CF6] font-bold pt-1">
                  <span>Launch Slashing Guard</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>

            {/* Pillar 3: NPoS Staking Yield */}
            <div 
              onClick={() => onLaunchApp('staking')}
              className="tech-corner-accent p-5 rounded-none border border-[#1C142E] bg-[#0B0813] hover:border-[#C084FC]/60 transition-all flex flex-col justify-between space-y-4 group cursor-pointer hover:bg-[#110A1E]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-none bg-[#C084FC]/15 border border-[#C084FC]/40 flex items-center justify-center text-[#C084FC]">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-none bg-[#140822] text-[#C084FC] border border-[#C084FC]/30 font-bold">
                    PILLAR // 03
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono group-hover:text-[#C084FC] transition-colors">
                    NPoS Yield Optimizer
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    Algorithmic Top 16 nominator curation filters oversubscribed pools and auto-compounds POT token returns each era.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#1C142E]">
                <div className="p-2.5 rounded-none bg-[#06040A] border border-[#1C142E] text-[10px] font-mono space-y-1 text-zinc-400">
                  <div className="flex justify-between">
                    <span>Base Yield:</span>
                    <span className="text-white font-bold tabular-nums">
                      {nposData?.auto_compounded_apy ? `${nposData.auto_compounded_apy.toFixed(2)}% APY` : '15.97% APY'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Compounding:</span>
                    <span className="text-emerald-400 font-bold tabular-nums">
                      +{nposData?.apy_boost_pct ? nposData.apy_boost_pct.toFixed(2) : '1.16'}% Boost
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Greedy Pools:</span>
                    <span className="text-[#EF4444] font-bold">Filtered (0% Loss)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#C084FC] font-bold pt-1">
                  <span>Launch NPoS Optimizer</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>

            {/* Pillar 4: RPC Shield & Topology */}
            <div 
              onClick={() => onLaunchApp('shield')}
              className="tech-corner-accent p-5 rounded-none border border-[#1C142E] bg-[#0B0813] hover:border-[#38BDF8]/60 transition-all flex flex-col justify-between space-y-4 group cursor-pointer hover:bg-[#110A1E]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-none bg-[#38BDF8]/15 border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8]">
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-none bg-[#140822] text-[#38BDF8] border border-[#38BDF8]/30 font-bold">
                    PILLAR // 04
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono group-hover:text-[#38BDF8] transition-colors">
                    RPC Anti-Spam Shield
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    Guards RPCs against OOM crashes from malicious eth_getLogs packet floods (&gt; 2000 blocks) and enforces dynamic rate-limiting.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#1C142E]">
                <div className="p-2.5 rounded-none bg-[#06040A] border border-[#1C142E] text-[10px] font-mono space-y-1 text-zinc-400">
                  <div className="flex justify-between">
                    <span>Packet Filter:</span>
                    <span className="text-[#10B981] font-bold">Span &gt; 2000 Blks</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rate Limiting:</span>
                    <span className="text-white font-bold">60 Req / Min / IP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peer Topology:</span>
                    <span className="text-[#38BDF8] font-bold">Anomaly Guard</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#38BDF8] font-bold pt-1">
                  <span>Launch RPC Shield</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Visual DAG Runbook Canvas */}
      <LazySection 
        id="dag-canvas" 
        className="py-20 sm:py-24 px-4 sm:px-6 border-t border-[#1C142E] bg-[#0A0615] relative z-10"
        minHeight="min-h-[580px]"
        fallbackText="INITIALIZING DAG AUTOMATION PIPELINE..."
      >
        <div className="max-w-6xl mx-auto space-y-10 sm:space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#1C142E] pb-6">
            <div className="space-y-2">
              <div className="inline-block px-2.5 py-0.5 rounded-none border border-[#3E216B] bg-[#120B24] text-[10px] font-mono text-[#C084FC] font-bold tracking-widest uppercase">
                AUTOMATION PIPELINE
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
                Visual DAG Automation Canvas
              </h2>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-md font-mono">
              From passive metric observation to deterministic execution runbooks. Drag, connect, and automate validator operations.
            </p>
          </div>

          {/* Interactive Schematic Diagram */}
          <div className="tech-corner-accent p-6 sm:p-8 rounded-none border border-[#261B42] bg-[#0D081D] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono border-b border-[#1C142E] pb-3">
              <div className="flex items-center gap-2">
                <Workflow className="w-4 h-4 text-[#C084FC]" />
                <span className="text-white font-bold">LIVE SCHEMATIC: AUTOMATED 2-BLOCK CONSENSUS FAILOVER</span>
              </div>
              <div className="text-emerald-400 flex items-center gap-1.5 font-bold text-[11px]">
                <span className="w-2 h-2 rounded-none bg-[#10B981] animate-ping" />
                <span>STATE: RUNBOOK_ARMED</span>
              </div>
            </div>

            {/* Connected Node Sequence */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
              {/* Node 1 */}
              <div className="p-4 rounded-none border border-[#E6007A]/40 bg-[#140822] space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#E6007A]/20 text-[#E6007A] font-bold">
                    STEP 01 // WATCHER
                  </span>
                  <span className="w-1.5 h-1.5 bg-[#E6007A] animate-pulse" />
                </div>
                <div className="text-xs font-bold text-white font-mono">Substrate Heartbeat (:9944)</div>
                <div className="text-[11px] text-zinc-400 font-mono">
                  Trigger condition: Missed Ping &ge; 2 consecutive blocks.
                </div>
                <div className="text-[10px] text-zinc-500 font-mono pt-1">Target: Primary Validator Server</div>
              </div>

              {/* Node 2 */}
              <div className="p-4 rounded-none border border-[#8B5CF6]/50 bg-[#160B2C] space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#8B5CF6]/20 text-[#C084FC] font-bold">
                    STEP 02 // SECURITY
                  </span>
                  <span className="w-1.5 h-1.5 bg-[#8B5CF6] animate-pulse" />
                </div>
                <div className="text-xs font-bold text-white font-mono">Anti-Equivocation Mutex</div>
                <div className="text-[11px] text-zinc-400 font-mono">
                  Revokes primary keystore lease atomically to eliminate double-signing.
                </div>
                <div className="text-[10px] text-emerald-400 font-mono pt-1">Slashing Risk: Zero Loss</div>
              </div>

              {/* Node 3 */}
              <div className="p-4 rounded-none border border-[#10B981]/50 bg-[#081B15] space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#10B981]/20 text-[#10B981] font-bold">
                    STEP 03 // ACTION
                  </span>
                  <span className="w-1.5 h-1.5 bg-[#10B981] animate-pulse" />
                </div>
                <div className="text-xs font-bold text-white font-mono">Standby Failover (:9945)</div>
                <div className="text-[11px] text-zinc-400 font-mono">
                  Transfers active authority lease and alerts ops team via webhook.
                </div>
                <div className="text-[10px] text-zinc-500 font-mono pt-1">Promotion Latency: &lt; 800ms</div>
              </div>
            </div>

            {/* Bottom Launch Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#1C142E]">
              <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#10B981]" />
                  <span>Interactive Drag &amp; Drop</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#8B5CF6]" />
                  <span>Realtime Execution Logs</span>
                </span>
              </div>
              <button
                onClick={() => onLaunchApp('canvas')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-mono rounded-none border border-[#8B5CF6] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold transition-all shadow-md shadow-[#8B5CF6]/20 cursor-pointer"
              >
                <Workflow className="w-3.5 h-3.5" />
                <span>Open Full Interactive Canvas</span>
              </button>
            </div>
          </div>
        </div>
      </LazySection>

      {/* Section: Comparison Matrix */}
      <LazySection 
        id="comparison" 
        className="py-20 sm:py-24 px-4 sm:px-6 border-t border-[#1C142E] bg-[#07040E] relative z-10"
        minHeight="min-h-[500px]"
        fallbackText="LOADING COMPARATIVE BENCHMARKS..."
      >
        <div className="max-w-5xl mx-auto space-y-10 sm:space-y-12">
          <div className="text-center space-y-2.5">
            <div className="inline-block px-2.5 py-0.5 rounded-none border border-[#3E216B] bg-[#120B24] text-[10px] font-mono text-[#C084FC] font-bold tracking-widest uppercase">
              COMPETITIVE ANALYSIS
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
              Why DotNexus Stands Apart
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-xl mx-auto font-mono">
              Evaluating DotNexus against traditional Linux CLI bash scripts and generic passive Grafana metrics.
            </p>
          </div>

          <div className="tech-corner-accent overflow-x-auto rounded-none border border-[#1C142E] bg-[#0B0813]">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1C142E] bg-[#110A1E] text-zinc-400">
                  <th className="p-3.5 sm:p-4 text-zinc-300">OPERATIONAL CAPABILITY</th>
                  <th className="p-3.5 sm:p-4 text-zinc-500">MANUAL LINUX CLI</th>
                  <th className="p-3.5 sm:p-4 text-zinc-500">GRAFANA / PROMETHEUS</th>
                  <th className="p-3.5 sm:p-4 text-[#C084FC] font-bold bg-[#170B2C]/50 border-l border-[#2E1F4A]">
                    DOTNEXUS CONTROL PLANE
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C142E] text-zinc-300">
                <tr>
                  <td className="p-3.5 sm:p-4 font-bold text-white">Dual-VM Sync (WASM vs EVM)</td>
                  <td className="p-3.5 sm:p-4 text-zinc-500">Requires manual curl to 2 ports</td>
                  <td className="p-3.5 sm:p-4 text-zinc-400">Separate graphs, no correlation</td>
                  <td className="p-3.5 sm:p-4 text-emerald-400 font-bold bg-[#170B2C]/30 border-l border-[#2E1F4A]">
                    Realtime parity delta &amp; mempool split
                  </td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-bold text-white">Slashing &amp; Equivocation Guard</td>
                  <td className="p-3.5 sm:p-4 text-[#EF4444]">High risk of double-signing</td>
                  <td className="p-3.5 sm:p-4 text-zinc-500">Passive alert only (too late)</td>
                  <td className="p-3.5 sm:p-4 text-emerald-400 font-bold bg-[#170B2C]/30 border-l border-[#2E1F4A]">
                    Atomic mutex lease &amp; 2-block failover
                  </td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-bold text-white">RPC Spam &amp; OOM Defense</td>
                  <td className="p-3.5 sm:p-4 text-zinc-500">Nginx manual configuration</td>
                  <td className="p-3.5 sm:p-4 text-zinc-500">Not supported</td>
                  <td className="p-3.5 sm:p-4 text-emerald-400 font-bold bg-[#170B2C]/30 border-l border-[#2E1F4A]">
                    Deep eth_getLogs packet inspection
                  </td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-bold text-white">NPoS Dynamic Yield Compounding</td>
                  <td className="p-3.5 sm:p-4 text-zinc-500">Manual staking via polkadot-js</td>
                  <td className="p-3.5 sm:p-4 text-zinc-500">Not supported</td>
                  <td className="p-3.5 sm:p-4 text-emerald-400 font-bold bg-[#170B2C]/30 border-l border-[#2E1F4A]">
                    Algorithm Top 16 + Auto-compounding
                  </td>
                </tr>
                <tr>
                  <td className="p-3.5 sm:p-4 font-bold text-white">Operational Execution Mode</td>
                  <td className="p-3.5 sm:p-4 text-zinc-500">Manual terminal bash typing</td>
                  <td className="p-3.5 sm:p-4 text-zinc-500">Read-only passive display</td>
                  <td className="p-3.5 sm:p-4 text-emerald-400 font-bold bg-[#170B2C]/30 border-l border-[#2E1F4A]">
                    Visual DAG Drag-and-Drop Canvas
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </LazySection>

      {/* Section: Delivery Line Journey (Roadmap) */}
      <LazySection 
        id="roadmap" 
        className="py-20 sm:py-24 px-4 sm:px-6 border-t border-[#1C142E] bg-[#07040E] relative z-10"
        minHeight="min-h-[520px]"
        fallbackText="CONNECTING LINE JOURNEY TELEMETRY..."
      >
        <div className="max-w-6xl mx-auto space-y-12 sm:space-y-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#1C142E] pb-6">
            <div className="space-y-2">
              <div className="inline-block px-2.5 py-0.5 rounded-none border border-[#3E216B] bg-[#120B24] text-[10px] font-mono text-[#C084FC] font-bold tracking-widest uppercase">
                DELIVERY LINE JOURNEY
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
                Portaldot Hacker House 2026 Timeline
              </h2>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-md font-mono">
              Deterministic engineering milestones from architecture baseline to foundation demo day.
            </p>
          </div>

          {/* Desktop Horizontal Line Journey (md and up) */}
          <div className="hidden md:block relative pt-2 pb-2">
            {/* Background Conduit Rail connecting center of Station 01 to center of Station 04 */}
            <div className="absolute top-[18px] left-[12.5%] right-[12.5%] h-[2px] bg-[#1C142E] z-0" />
            {/* Active Progress Beam (Station 01 to Station 02) */}
            <div className="absolute top-[18px] left-[12.5%] w-[25%] h-[2px] bg-gradient-to-r from-[#10B981] via-[#8B5CF6] to-[#C084FC] z-0" />

            <div className="grid grid-cols-4 gap-6 relative z-10">
              {/* Station 01 */}
              <div className="flex flex-col items-center text-center space-y-3.5">
                {/* Station Junction Node on Rail */}
                <div className="w-9 h-9 rounded-none bg-[#07040E] border-2 border-[#10B981] flex items-center justify-center text-[#10B981] z-10 relative shadow-lg shadow-[#10B981]/20">
                  <Check className="w-4 h-4 text-[#10B981]" />
                  <span className="absolute -top-2.5 -right-2 px-1 py-0.2 bg-[#0A261B] border border-[#10B981]/40 text-[#10B981] text-[9px] font-mono font-bold">
                    01
                  </span>
                </div>

                {/* Station Date & Phase Tag (Clearly separated from Rail) */}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-[#10B981] font-bold block tracking-wider">
                    OCT 14, 2026
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 bg-[#10B981]/15 text-[#10B981] font-bold border border-[#10B981]/30 inline-block uppercase">
                    PHASE 01 // COMPLETED
                  </span>
                </div>

                {/* Milestone Deliverable Card */}
                <div className="w-full p-4 rounded-none border border-[#1C142E] bg-[#0B0813] space-y-2 text-left h-[170px] flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono">Architecture Kick-off</h4>
                    <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                      Finalized Dual-VM telemetry pipeline and dual WebSocket/RPC collector baseline.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-[#1C142E]">
                    <span className="text-zinc-500">v0.1 Baseline</span>
                    <span className="text-[#10B981] font-bold">VERIFIED</span>
                  </div>
                </div>
              </div>

              {/* Station 02 */}
              <div className="flex flex-col items-center text-center space-y-3.5">
                {/* Station Junction Node on Rail */}
                <div className="w-9 h-9 rounded-none bg-[#120B24] border-2 border-[#C084FC] flex items-center justify-center text-[#C084FC] z-10 relative shadow-lg shadow-[#C084FC]/30">
                  <span className="w-3 h-3 rounded-none bg-[#C084FC] animate-ping absolute" />
                  <span className="w-2.5 h-2.5 rounded-none bg-[#C084FC] relative z-10" />
                  <span className="absolute -top-2.5 -right-2 px-1 py-0.2 bg-[#2E1452] border border-[#C084FC]/60 text-[#C084FC] text-[9px] font-mono font-bold">
                    02
                  </span>
                </div>

                {/* Station Date & Phase Tag (Clearly separated from Rail) */}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-[#C084FC] font-bold block tracking-wider">
                    OCT 24, 2026 (12:00 UTC)
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 bg-[#8B5CF6]/25 text-[#C084FC] font-bold border border-[#8B5CF6]/40 inline-block uppercase">
                    PHASE 02 // TARGET
                  </span>
                </div>

                {/* Milestone Deliverable Card */}
                <div className="w-full p-4 rounded-none border border-[#8B5CF6]/50 bg-[#120A24] space-y-2 text-left h-[170px] flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono">DoraHacks Check-in</h4>
                    <p className="text-[11px] text-zinc-300 mt-1.5 leading-relaxed">
                      Working Dual-VM Tracker, Slashing Guard failover, and interactive DAG Canvas prototype.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-[#261B42]">
                    <span className="text-[#C084FC]">Live MVP Demo</span>
                    <span className="text-[#C084FC] font-bold">ACTIVE TARGET</span>
                  </div>
                </div>
              </div>

              {/* Station 03 */}
              <div className="flex flex-col items-center text-center space-y-3.5">
                {/* Station Junction Node on Rail */}
                <div className="w-9 h-9 rounded-none bg-[#07040E] border-2 border-[#3E216B] flex items-center justify-center text-zinc-500 z-10 relative">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  <span className="absolute -top-2.5 -right-2 px-1 py-0.2 bg-[#120B24] border border-[#3E216B] text-zinc-500 text-[9px] font-mono font-bold">
                    03
                  </span>
                </div>

                {/* Station Date & Phase Tag (Clearly separated from Rail) */}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-zinc-400 font-bold block tracking-wider">
                    NOV 06, 2026 (04:00 UTC)
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 bg-[#120B24] text-zinc-500 font-bold border border-[#261B42] inline-block uppercase">
                    PHASE 03 // SCHEDULED
                  </span>
                </div>

                {/* Milestone Deliverable Card */}
                <div className="w-full p-4 rounded-none border border-[#1C142E] bg-[#0B0813] space-y-2 text-left h-[170px] flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono">Code Freeze &amp; Hardening</h4>
                    <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                      RPC Shield payload filters, 100% test suite passage, and comprehensive judge audit report.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-[#1C142E]">
                    <span className="text-zinc-500">v1.0 Release</span>
                    <span className="text-zinc-400 font-bold">SCHEDULED</span>
                  </div>
                </div>
              </div>

              {/* Station 04 */}
              <div className="flex flex-col items-center text-center space-y-3.5">
                {/* Station Junction Node on Rail */}
                <div className="w-9 h-9 rounded-none bg-[#07040E] border-2 border-[#261B42] flex items-center justify-center text-zinc-600 z-10 relative">
                  <CircleDot className="w-4 h-4 text-zinc-600" />
                  <span className="absolute -top-2.5 -right-2 px-1 py-0.2 bg-[#120B24] border border-[#261B42] text-zinc-600 text-[9px] font-mono font-bold">
                    04
                  </span>
                </div>

                {/* Station Date & Phase Tag (Clearly separated from Rail) */}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-zinc-500 font-bold block tracking-wider">
                    NOV 07–08, 2026
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 bg-[#120B24] text-zinc-600 font-bold border border-[#261B42] inline-block uppercase">
                    PHASE 04 // DEMO DAY
                  </span>
                </div>

                {/* Milestone Deliverable Card */}
                <div className="w-full p-4 rounded-none border border-[#1C142E] bg-[#0B0813] space-y-2 text-left h-[170px] flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono">Live Demo Day</h4>
                    <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                      Live verification with Portaldot Network foundation judges demonstrating real-time fault injection.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-[#1C142E]">
                    <span className="text-zinc-500">Final Judging</span>
                    <span className="text-zinc-500 font-bold">UPCOMING</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Vertical Line Journey (< md) */}
          <div className="md:hidden relative space-y-6">
            {/* Continuous Vertical Rail Line */}
            <div className="absolute top-3 bottom-3 left-3 w-[2px] bg-[#1C142E] z-0" />
            <div className="absolute top-3 left-3 w-[2px] h-[35%] bg-gradient-to-b from-[#10B981] via-[#8B5CF6] to-[#C084FC] z-0" />

            {/* Station 01 */}
            <div className="relative pl-10">
              <div className="absolute left-[1px] top-1.5 w-6 h-6 rounded-none bg-[#07040E] border-2 border-[#10B981] flex items-center justify-center z-10">
                <Check className="w-3 h-3 text-[#10B981]" />
              </div>
              <div className="p-3.5 rounded-none border border-[#1C142E] bg-[#0B0813] space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#10B981] font-bold">OCT 14, 2026</span>
                  <span className="px-1.5 py-0.2 bg-[#10B981]/15 text-[#10B981] text-[9px] font-bold">PHASE 01 // COMPLETED</span>
                </div>
                <div className="text-xs font-bold text-white font-mono">Architecture Kick-off &amp; Baseline</div>
                <p className="text-[11px] text-zinc-400">Finalized Dual-VM WebSocket &amp; RPC baseline collectors.</p>
              </div>
            </div>

            {/* Station 02 */}
            <div className="relative pl-10">
              <div className="absolute left-[1px] top-1.5 w-6 h-6 rounded-none bg-[#120B24] border-2 border-[#C084FC] flex items-center justify-center z-10">
                <span className="w-2 h-2 rounded-none bg-[#C084FC] animate-ping" />
              </div>
              <div className="p-3.5 rounded-none border border-[#8B5CF6]/50 bg-[#120A24] space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#C084FC] font-bold">OCT 24, 2026 (12:00 UTC)</span>
                  <span className="px-1.5 py-0.2 bg-[#8B5CF6]/25 text-[#C084FC] text-[9px] font-bold">PHASE 02 // TARGET</span>
                </div>
                <div className="text-xs font-bold text-white font-mono">DoraHacks Check-in &amp; Working Prototype</div>
                <p className="text-[11px] text-zinc-300">Dual-Engine Tracker, Slashing Guard failover &amp; DAG Canvas prototype.</p>
              </div>
            </div>

            {/* Station 03 */}
            <div className="relative pl-10">
              <div className="absolute left-[1px] top-1.5 w-6 h-6 rounded-none bg-[#07040E] border-2 border-[#3E216B] flex items-center justify-center z-10">
                <Clock className="w-3 h-3 text-zinc-500" />
              </div>
              <div className="p-3.5 rounded-none border border-[#1C142E] bg-[#0B0813] space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-400 font-bold">NOV 06, 2026 (04:00 UTC)</span>
                  <span className="px-1.5 py-0.2 bg-zinc-800 text-zinc-400 text-[9px] font-bold">PHASE 03 // SCHEDULED</span>
                </div>
                <div className="text-xs font-bold text-white font-mono">Code Freeze &amp; Security Hardening</div>
                <p className="text-[11px] text-zinc-400">Complete code package, pitch deck &amp; test suite verification.</p>
              </div>
            </div>

            {/* Station 04 */}
            <div className="relative pl-10">
              <div className="absolute left-[1px] top-1.5 w-6 h-6 rounded-none bg-[#07040E] border-2 border-[#261B42] flex items-center justify-center z-10">
                <CircleDot className="w-3 h-3 text-zinc-600" />
              </div>
              <div className="p-3.5 rounded-none border border-[#1C142E] bg-[#0B0813] space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-500 font-bold">NOV 07–08, 2026</span>
                  <span className="px-1.5 py-0.2 bg-zinc-800 text-zinc-500 text-[9px] font-bold">PHASE 04 // DEMO DAY</span>
                </div>
                <div className="text-xs font-bold text-white font-mono">Live Demo Day &amp; Foundation Review</div>
                <p className="text-[11px] text-zinc-400">Live demonstration with Portaldot Network foundation judges.</p>
              </div>
            </div>
          </div>
        </div>
      </LazySection>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 border-t border-[#1C142E] bg-[#05030A] text-xs font-mono text-zinc-500 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">DOTNEXUS</span>
            <span className="text-zinc-600">•</span>
            <span>Portaldot Network V3.0 (SS58: 42 • Decimals: 14)</span>
          </div>
          <div className="text-zinc-600 text-[11px]">
            Node Operations &amp; Tooling Track • Portaldot Hacker House 2026
          </div>
        </div>
      </footer>
    </div>
  );
};
