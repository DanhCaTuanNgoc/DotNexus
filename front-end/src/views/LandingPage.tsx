import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  ChevronRight,
  Play,
  RotateCcw
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
import { InteractiveCanvas } from '../components/canvas/InteractiveCanvas';
import { DEFAULT_RUNBOOKS, convertRunbookToWorkflow } from '../components/canvas/constants';
import { CanvasNode, CanvasEdge, CanvasViewport } from '../components/canvas/types';
import { 
  BlueprintSection, 
  SectionDivider, 
  CornerCrosshair, 
  ZeroGapCard 
} from '../components/blueprint';

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
    <div
      ref={containerRef as any}
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
    </div>
  );
};

interface LandingPageProps {
  onLaunchApp: (tab?: TabType) => void;
  dualData?: DualTelemetryState | null;
  secData?: SecurityDashboardState | null;
  nposData?: NPoSRecommendation | null;
  shieldData?: ShieldStatus | null;
}



interface TechStackItem {
  name: string;
  category: string;
  accent: string;
  dotColor: string;
}

const TECH_STACK_ITEMS: TechStackItem[] = [
  { name: 'Substrate WASM', category: 'L1 Runtime', accent: '#E6007A', dotColor: 'bg-[#E6007A]' },
  { name: 'Frontier EVM', category: 'Dual-VM Core', accent: '#6366F1', dotColor: 'bg-[#6366F1]' },
  { name: 'GRANDPA Consensus', category: 'Deterministic Finality', accent: '#A855F7', dotColor: 'bg-[#A855F7]' },
  { name: 'BABE Engine', category: 'Block Production', accent: '#38BDF8', dotColor: 'bg-[#38BDF8]' },
  { name: 'Sequential Phragmén', category: 'NPoS Staking', accent: '#C084FC', dotColor: 'bg-[#C084FC]' },
  { name: 'Web3.py & Substrate-Interface', category: 'Dual RPC', accent: '#8B5CF6', dotColor: 'bg-[#8B5CF6]' },
  { name: 'Solidity & Vyper V3', category: 'Smart Contracts', accent: '#EC4899', dotColor: 'bg-[#EC4899]' },
  { name: 'Libp2p & Kademlia', category: 'P2P Mesh', accent: '#00FF9D', dotColor: 'bg-[#00FF9D]' },
  { name: 'Prometheus & OpenTelemetry', category: 'Observability', accent: '#F59E0B', dotColor: 'bg-[#F59E0B]' },
  { name: 'Three.js Cyber Mesh', category: '3D WebGL Engine', accent: '#818CF8', dotColor: 'bg-[#818CF8]' },
  { name: 'React 19 & Vite 8', category: 'Control Plane UI', accent: '#38BDF8', dotColor: 'bg-[#38BDF8]' },
  { name: 'POT Token (14 Decimals)', category: 'Native Utility', accent: '#E6007A', dotColor: 'bg-[#E6007A]' },
];

/**
 * Real Visual Board Mockup for LandingPage.tsx
 * Directly incorporates the actual InteractiveCanvas and NodeCard system from CanvasBoard.tsx.
 * Uses the canonical 'runbook-slash-guard' preset (Heartbeat Daemon -> Anti-Equivocation Lock -> Standby Failover).
 */
const RealCanvasMockupBoard: React.FC<{ onLaunchApp: (tab?: TabType) => void }> = ({ onLaunchApp }) => {
  // Canonical 3-node linear topology framed strictly for the mockup preview
  const initialWorkflow = useMemo(() => {
    const raw = DEFAULT_RUNBOOKS.find((rb) => rb.id === 'runbook-slash-guard') || DEFAULT_RUNBOOKS[0];
    const wf = convertRunbookToWorkflow(raw);
    // Align node positions nicely centered for static horizontal mockup display
    const adjustedNodes = wf.nodes.map((node, idx) => ({
      ...node,
      position: {
        x: 40 + idx * 310,
        y: 50,
      },
      data: {
        ...node.data,
        status: 'idle' as const,
      },
    }));
    return { ...wf, nodes: adjustedNodes };
  }, []);

  const getResponsiveViewport = useCallback((): CanvasViewport => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return { x: 10, y: 40, zoom: 0.42 };
    } else if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return { x: 20, y: 40, zoom: 0.65 };
    }
    return { x: 35, y: 40, zoom: 0.82 };
  }, []);

  const [nodes, setNodes] = useState<CanvasNode[]>(initialWorkflow.nodes);
  const [edges, setEdges] = useState<CanvasEdge[]>(initialWorkflow.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeEdgeId, setActiveEdgeId] = useState<string | null>(null);
  const [completedEdgeIds, setCompletedEdgeIds] = useState<string[]>([]);
  const [execStep, setExecStep] = useState<number>(0);
  const [cycleCount, setCycleCount] = useState<number>(0);
  const [viewport, setViewport] = useState<CanvasViewport>(getResponsiveViewport);

  // Sync viewport on screen resize to keep the 3 mockup nodes cleanly framed
  useEffect(() => {
    const handleResize = () => setViewport(getResponsiveViewport());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getResponsiveViewport]);

  // Real-time DAG execution simulation loop
  const runSimulation = useCallback(async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setActiveEdgeId(null);
    setCompletedEdgeIds([]);
    setExecStep(0);

    // Reset all nodes to idle
    setNodes((prev) => prev.map((n) => ({ ...n, data: { ...n.data, status: 'idle' } })));

    // Step 1: Heartbeat Daemon (:9944) Running
    await new Promise((r) => setTimeout(r, 400));
    setExecStep(1);
    setNodes((prev) =>
      prev.map((n, i) => (i === 0 ? { ...n, data: { ...n.data, status: 'running' } } : n))
    );

    // Step 2: Edge 1 Active -> Node 1 Success, Node 2 Running
    await new Promise((r) => setTimeout(r, 1100));
    setActiveEdgeId('e1-2');
    await new Promise((r) => setTimeout(r, 450));
    setExecStep(2);
    setCompletedEdgeIds(['e1-2']);
    setActiveEdgeId(null);
    setNodes((prev) =>
      prev.map((n, i) => {
        if (i === 0) return { ...n, data: { ...n.data, status: 'success' } };
        if (i === 1) return { ...n, data: { ...n.data, status: 'running' } };
        return n;
      })
    );

    // Step 3: Edge 2 Active -> Node 2 Success, Node 3 Running
    await new Promise((r) => setTimeout(r, 1100));
    setActiveEdgeId('e2-3');
    await new Promise((r) => setTimeout(r, 450));
    setExecStep(3);
    setCompletedEdgeIds(['e1-2', 'e2-3']);
    setActiveEdgeId(null);
    setNodes((prev) =>
      prev.map((n, i) => {
        if (i === 0) return { ...n, data: { ...n.data, status: 'success' } };
        if (i === 1) return { ...n, data: { ...n.data, status: 'success' } };
        if (i === 2) return { ...n, data: { ...n.data, status: 'running' } };
        return n;
      })
    );

    // Step 4: Node 3 Success -> Complete!
    await new Promise((r) => setTimeout(r, 1100));
    setExecStep(4);
    setNodes((prev) =>
      prev.map((n) => ({ ...n, data: { ...n.data, status: 'success' } }))
    );
    setIsExecuting(false);
    setCycleCount((c) => c + 1);
  }, [isExecuting]);

  const handleReset = useCallback(() => {
    setNodes(initialWorkflow.nodes.map((n) => ({ ...n, data: { ...n.data, status: 'idle' } })));
    setEdges(initialWorkflow.edges);
    setActiveEdgeId(null);
    setCompletedEdgeIds([]);
    setSelectedNodeId(null);
    setIsExecuting(false);
    setExecStep(0);
    setViewport(getResponsiveViewport());
  }, [initialWorkflow, getResponsiveViewport]);

  const traceLogs = [
    {
      step: 1,
      tag: 'WATCHER',
      accent: '#E6007A',
      activeText: 'Heartbeat Daemon: WebSocket (:9944) delta >= 2 blks -> Evaluating trigger condition',
      doneText: 'Heartbeat Daemon: Missed ping detected (delta: 2 blocks) -> Fired execution token to Mutex Lock',
    },
    {
      step: 2,
      tag: 'SECURITY',
      accent: '#8B5CF6',
      activeText: 'Anti-Equivocation Mutex: Initiating atomic self-fence for primary key 0xba11...7355',
      doneText: 'Anti-Equivocation Mutex: Primary authority lease revoked atomically. Invariant 10s < 12s < 15s satisfied (0% slashing loss)',
    },
    {
      step: 3,
      tag: 'ACTION',
      accent: '#10B981',
      activeText: 'Standby Promotion: Transferring session authority lease to standby node IP ws://127.0.0.1:9945',
      doneText: 'Standby Promotion: Standby validator successfully promoted to primary author (Latency: 388ms, 0 delta)',
    },
  ];

  return (
    <div className="rounded-none border border-white/[0.08] bg-[#080514]/95 backdrop-blur-md shadow-2xl overflow-hidden relative">
      <CornerCrosshair position="top-left" color="text-[#8B5CF6]" />
      <CornerCrosshair position="top-right" color="text-[#8B5CF6]" />
      <CornerCrosshair position="bottom-left" color="text-[#8B5CF6]" />
      <CornerCrosshair position="bottom-right" color="text-[#8B5CF6]" />

      {/* Top Window Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-white/[0.08] bg-[#05030C]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-none bg-[#EF4444]" />
            <span className="w-2.5 h-2.5 rounded-none bg-[#F59E0B]" />
            <span className="w-2.5 h-2.5 rounded-none bg-[#10B981]" />
          </div>
          <span className="text-zinc-600 text-xs font-mono">|</span>
          <div className="flex items-center gap-2 text-xs font-mono">
            <Workflow className="w-3.5 h-3.5 text-[#C084FC]" />
            <span className="text-white font-bold tracking-wide">CANVAS RUNBOOK: {initialWorkflow.name}</span>
            <span className="hidden md:inline-block text-[10px] px-1.5 py-0.5 rounded-none bg-[#8B5CF6]/20 text-[#C084FC] border border-[#8B5CF6]/30 uppercase font-mono">
              3 NODES • 2 WIRES
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="flex items-center px-2.5 py-1 rounded-none bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
            <span>
              {isExecuting
                ? `SIMULATING STEP 0${execStep}/03`
                : cycleCount > 0
                ? `CYCLE #${cycleCount} • COMPLETE`
                : 'CANVAS MOCKUP • READY'}
            </span>
          </div>

          <button
            onClick={runSimulation}
            disabled={isExecuting}
            className={`px-3 py-1 rounded-none text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isExecuting
                ? 'bg-[#181028] border border-[#8B5CF6]/40 text-[#C084FC] animate-pulse cursor-wait'
                : 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-md shadow-[#8B5CF6]/25 hover:scale-[1.02]'
            }`}
          >
            <Play className={`w-3 h-3 fill-current ${isExecuting ? 'animate-pulse' : ''}`} />
            <span>{isExecuting ? 'Executing...' : 'Run Pipeline'}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-none bg-[#110A24] hover:bg-[#180F33] border border-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Reset Topology to Default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mockup InteractiveCanvas Component Framed Strictly for 3 Nodes */}
      <div className="relative h-[300px] sm:h-[330px] w-full bg-[#06030D] overflow-hidden select-none">
        <InteractiveCanvas
          nodes={nodes}
          edges={edges}
          selectedNodeId={selectedNodeId}
          violatedNodeIds={[]}
          onMoveNodes={() => {}}
          onConnect={() => {}}
          onEdgesChange={() => {}}
          onSelectNode={setSelectedNodeId}
          onDropTemplate={() => {}}
          initialViewport={viewport}
          onViewportChange={setViewport}
          flowConnectMode={false}
          readOnly={true}
          hideToolbar={true}
          isExecuting={isExecuting}
          activeEdgeId={activeEdgeId}
          completedEdgeIds={completedEdgeIds}
        />
      </div>

      {/* Live Terminal Log Drawer Beneath the Canvas */}
      <div className="p-3.5 sm:p-4 border-t border-white/[0.08] bg-[#05020C] font-mono text-[11px] space-y-1.5 shadow-inner">
        <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06] text-zinc-500 text-[10px]">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-[#C084FC]" />
            <span className="text-zinc-300 font-bold uppercase tracking-wider">LIVE EXECUTION TRACE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">ZERO EQUIVOCATION INVARIANT SATISFIED</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">FAILOVER LATENCY: &lt; 388ms</span>
          </div>
        </div>

        <div className="space-y-1 pt-1 font-mono">
          {traceLogs.map((log) => {
            const isCurrent = execStep === log.step;
            const isDone = execStep > log.step;

            return (
              <div
                key={log.step}
                className={`flex items-start gap-2 py-0.5 px-2 rounded-none transition-colors ${
                  isCurrent
                    ? 'bg-[#180F33] text-white font-semibold'
                    : isDone
                    ? 'text-emerald-400/90'
                    : 'text-zinc-600'
                }`}
              >
                <span className="text-zinc-500 tabular-nums">[STEP 0{log.step}]</span>
                <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: log.accent }}>
                  {log.tag}
                </span>
                <span className="text-zinc-500">→</span>
                <span className="flex-1">
                  {isDone ? log.doneText : isCurrent ? log.activeText : `[QUEUED] Waiting for upstream token...`}
                </span>
                {isCurrent && (
                  <span className="text-emerald-400 font-bold text-[10px]">[EXECUTING]</span>
                )}
                {isDone && (
                  <span className="text-emerald-400 font-bold text-[10px]">[OK]</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Strip */}
      <div className="px-4 sm:px-6 py-3 border-t border-white/[0.06] bg-[#06030F] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-zinc-400">
          <span className="text-zinc-300">Full Bi-directional Bezier Wire Routing</span>
          <span className="hidden sm:inline text-zinc-600">•</span>
          <span className="text-zinc-300">Real-time Port Snap Connection</span>
          <span className="hidden sm:inline text-zinc-600">•</span>
          <span className="text-zinc-300">Exportable to Standby Python CLI</span>
        </div>

        <button
          onClick={() => onLaunchApp('canvas')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 text-xs font-mono rounded-none border border-[#8B5CF6] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold transition-all shadow-md shadow-[#8B5CF6]/20 cursor-pointer hover:scale-[1.02]"
        >
          <Workflow className="w-3.5 h-3.5" />
          <span>Open Full Studio Canvas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

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
      {/* Background Cybernetic Grid & Ambient Lighting Orbs (Softer Zeabur Contrast) */}
      <div className="fixed inset-0 cyber-grid opacity-40 pointer-events-none z-0" />
      <div className="fixed inset-0 cyber-dots opacity-25 pointer-events-none z-0" />
      <div className="fixed inset-0 scanline-overlay opacity-15 pointer-events-none z-0" />

      {/* Dynamic Ambient Neon Glow Orbs - Refined & Softened to prevent visual fatigue */}
      <div className="absolute pointer-events-none rounded-full glow-orb-violet w-[600px] h-[600px] -top-40 left-1/2 -translate-x-1/2 z-0 opacity-40 animate-pulse-glow" />
      <div className="absolute pointer-events-none rounded-full glow-orb-magenta w-[500px] h-[500px] top-60 -left-60 z-0 opacity-30 animate-pulse-glow" style={{ animationDelay: '2s' }} />
      <div className="absolute pointer-events-none rounded-full glow-orb-cyan w-[500px] h-[500px] top-60 -right-60 z-0 opacity-30 animate-pulse-glow" style={{ animationDelay: '4s' }} />

      {/* Top Navbar — Zeabur Frosted Glass with Live Cluster Heartbeat */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/[0.08] bg-[#080512]/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <img
            src={dotnexusIcon}
            alt="DotNexus"
            className="w-10 h-10 sm:w-11 sm:h-11 object-contain rounded-none border border-white/[0.08]"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-wider text-white font-mono">DOTNEXUS</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-none border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#C084FC] font-semibold">
                Portaldot V3.0
              </span>
            </div>
          </div>
        </div>

        {/* Live Cluster Heartbeat Chip (Zeabur Style) */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1 rounded-none border border-white/[0.08] bg-[#0E081F]/90 text-[11px] font-mono shadow-inner">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="text-[#E6007A] text-[10px] font-bold">WASM:</span>
            <span className="text-zinc-100 font-bold tabular-nums">#{dualData?.substrate?.best_block ? dualData.substrate.best_block.toLocaleString() : '161,594'}</span>
          </div>
          <span className="text-zinc-700">•</span>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="text-[#818CF8] text-[10px] font-bold">EVM:</span>
            <span className="text-[#818CF8] font-bold tabular-nums">#{dualData?.evm?.block_number ? dualData.evm.block_number.toLocaleString() : '161,594'}</span>
          </div>
          <span className="text-zinc-700">•</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[#00FF9D] font-bold text-[10px] tracking-wider uppercase">0 DELTA (SYNCED)</span>
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
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 text-xs font-mono rounded-none border border-[#8B5CF6]/80 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold transition-all shadow-lg shadow-[#8B5CF6]/25 hover:scale-[1.02] cursor-pointer"
          >
            <span>Launch Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white hover:bg-[#1E113E] rounded-none border border-white/[0.08]"
            title="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4 text-[#C084FC]" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile Nav Dropdown Sheet */}
      {isMobileMenuOpen && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-[#0A0515]/98 border-b border-white/[0.08] p-4 flex flex-col space-y-3 font-mono text-xs md:hidden shadow-2xl backdrop-blur-md">
          <a
            href="#pillars"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-zinc-300 hover:text-[#C084FC] hover:bg-[#140C2B] rounded-none transition-colors"
          >
            → The 4 Pillars
          </a>
          <a
            href="#dag-canvas"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-zinc-300 hover:text-[#C084FC] hover:bg-[#140C2B] rounded-none transition-colors"
          >
            → Visual DAG Automation Canvas
          </a>
          <a
            href="#comparison"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-zinc-300 hover:text-[#C084FC] hover:bg-[#140C2B] rounded-none transition-colors"
          >
            → Why DotNexus Stands Apart
          </a>
          <a
            href="#roadmap"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-zinc-300 hover:text-[#C084FC] hover:bg-[#140C2B] rounded-none transition-colors"
          >
            → Hackathon Delivery Timeline
          </a>
        </div>
      )}

      {/* Hero Section — Full Viewport Width (100vw) for Three.js Dual-VM Cyber Mesh */}
      <section className="relative w-full min-h-[100vh] pt-24 sm:pt-28 pb-16 flex items-center justify-center px-4 sm:px-6 overflow-hidden z-10 border-b border-white/[0.08] bg-[#06040A]">
        {/* Glow Video Background: Royal Violet Planet Rim on Black (UI_PROMPT_LANDINGPAGE) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none">
          {/* Violet / Magenta Planet Rim Glow Video with mix-blend-screen */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1672px] h-[620px] sm:h-[740px] object-cover mix-blend-screen opacity-90 transition-opacity duration-1000"
          >
            <source
              src="https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/e859f229-8ebd-43fb-a5a0-58006ba75327.mp4"
              type="video/mp4"
            />
            {/* Fallback alternative hero video */}
            <source
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4"
              type="video/mp4"
            />
          </video>

          {/* Dashboard Glow: Screen-blended strip accent */}
          <img
            src="https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/e0e14572-12e1-4c08-b471-a21521844945.png"
            alt=""
            className="pointer-events-none absolute top-[280px] sm:top-[340px] left-1/2 -translate-x-1/2 w-full max-w-[1204px] mix-blend-screen opacity-75 z-0"
            aria-hidden="true"
          />

          {/* Soft vignette gradient to seamlessly blend video edge into deep obsidian base */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#06040A]/30 to-[#06040A] z-0" />
        </div>

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
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3.5 text-sm font-mono rounded-none border border-[#8B5CF6] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold transition-all shadow-xl shadow-[#8B5CF6]/30 hover:scale-[1.02] cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Launch Live Control Center</span>
            </button>

            <a
              href="https://github.com/DanhCaTuanNgoc/DotNexus"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3.5 text-sm font-mono rounded-none bg-[#110A24]/90 hover:bg-[#180F33] border border-white/[0.08] hover:border-[#8B5CF6] text-zinc-200 transition-all backdrop-blur-md cursor-pointer group"
            >
              <svg className="w-4 h-4 fill-current text-zinc-300 group-hover:text-white transition-colors" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub Repository</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </a>
          </div>

          {/* Live Floating Cluster Ticker Strip (Blueprint Zero-Gap Shared-Border) */}
          <div className="pt-6 pointer-events-auto">
            <div className="max-w-5xl mx-auto border border-white/[0.08] bg-[#07040E] grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08] rounded-none shadow-2xl relative text-left font-mono">
              <CornerCrosshair position="top-left" color="text-[#8B5CF6]" />
              <CornerCrosshair position="top-right" color="text-[#8B5CF6]" />
              <CornerCrosshair position="bottom-left" color="text-[#8B5CF6]" />
              <CornerCrosshair position="bottom-right" color="text-[#8B5CF6]" />

              <div className="p-4 bg-[#080512]/90 hover:bg-white/[0.02] transition-colors relative">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">WASM BEST BLOCK</span>
            
                </div>
                <div className="text-base font-bold text-white tabular-nums">
                  #{dualData?.substrate?.best_block ? dualData.substrate.best_block.toLocaleString() : '161,594'}
                </div>
                <div className="text-[10px] text-[#E6007A] block mt-1 truncate font-semibold">
                  {dualData?.substrate?.is_live_chain ? 'LIVE RPC (:9944)' : 'Portaldot V3.0 Testnet'}
                </div>
              </div>

              <div className="p-4 bg-[#080512]/90 hover:bg-white/[0.02] transition-colors relative">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">EVM JSON-RPC</span>
                </div>
                <div className="text-base font-bold text-[#818CF8] tabular-nums">
                  #{dualData?.evm?.block_number ? dualData.evm.block_number.toLocaleString() : '161,594'}
                </div>
                <div className="text-[10px] text-zinc-400 block mt-1 truncate">
                  Delta: {dualData?.sync?.delta_blocks ?? 0} blk ({dualData?.sync?.status ?? 'SYNCED'})
                </div>
              </div>

              <div className="p-4 bg-[#080512]/90 hover:bg-white/[0.02] transition-colors relative">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">SLASHING DEFENSE</span>
                </div>
                <div className="text-base font-bold text-[#10B981] tabular-nums">
                  {secData?.equivocation_guard_active || secData?.lock_file_status === 'LOCKED_SAFE' ? '100% Zero-Loss' : 'Active Safe'}
                </div>
                <div className="text-[10px] text-zinc-400 block mt-1 truncate">
                  Node: {secData?.active_node || 'PRIMARY'} (Mutex Lock)
                </div>
              </div>

              <div className="p-4 bg-[#080512]/90 hover:bg-white/[0.02] transition-colors relative">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">POT STAKING YIELD</span>
                </div>
                <div className="text-base font-bold text-[#C084FC] tabular-nums">
                  {nposData?.auto_compounded_apy ? `${nposData.auto_compounded_apy.toFixed(2)}% APY` : '17.13% APY'}
                </div>
                <div className="text-[10px] text-emerald-400 block mt-1 font-bold truncate">
                  +{nposData?.apy_boost_pct ? nposData.apy_boost_pct.toFixed(2) : '1.16'}% Auto-Compounded
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION DIVIDER 1: Hatched Technical Spacer Strip */}
      <SectionDivider
        variant="hatched"
        height="h-14"
        label="PROTOCOL_STACK"
        sublabel="RUNTIME_TOPOLOGY"
      />

      {/* Section 2: Infinite Techstack Protocol Marquee Carousel — Full Bleed 100vw */}
      <section className="relative w-full py-7 overflow-hidden border-b border-white/[0.08] bg-[#07040E]/80 backdrop-blur-sm z-10">
        

        {/* Marquee Track with Lateral Fading Gradient Masks */}
        <div className="relative w-full overflow-hidden">
          {/* Left lateral fade mask */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 sm:w-36 z-20 bg-gradient-to-r from-[#07040E] to-transparent" />
          {/* Right lateral fade mask */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 sm:w-36 z-20 bg-gradient-to-l from-[#07040E] to-transparent" />

          {/* Infinite Moving Row */}
          <div className="animate-marquee-infinite flex items-center gap-3 select-none">
            {[...TECH_STACK_ITEMS, ...TECH_STACK_ITEMS].map((item, idx) => (
              <div
                key={`${item.name}-${idx}`}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-none border border-white/[0.08] bg-[#110A24]/90 hover:bg-[#180F33] hover:border-[#8B5CF6]/50 transition-all duration-200 group/chip cursor-default shadow-sm"
              >
                <span className="text-xs font-mono font-bold text-zinc-200 group-hover/chip:text-white whitespace-nowrap">
                  {item.name}
                </span>
                <span 
                  className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-none bg-white/[0.04] border border-white/[0.06] font-semibold"
                  style={{ color: item.accent }}
                >
                  {item.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION DIVIDER 2: Glow Beam Spacer Strip */}
      <SectionDivider
        variant="glow"
        height="h-12"
        label="MISSION_CRITICAL"
        sublabel="4_ENGINE_PILLARS"
      />
      
      {/* Section 3: The 4 Pillars — Zero-Gap Blueprint Bento Grid */}
      <BlueprintSection
        id="pillars"
        borderBottom={true}
        borderTop={false}
        background="bg-[#07040E]"
        containerClassName="py-20 sm:py-24 px-4 sm:px-6 relative z-10"
      >
        <div className="max-w-6xl mx-auto space-y-10 sm:space-y-12">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
                The Four Mission-Critical Pillars
              </h2>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-md font-mono">
              Zeabur-grade modular architecture engineered exclusively for Portaldot Network V3.0 Dual-VM node operators.
            </p>
          </div>

          {/* Zero-Gap Bento Grid: 2 Rows, Shared 1px Hairline Borders */}
          <div className="relative border border-white/[0.08] bg-[#06040A] rounded-none shadow-2xl">
            <CornerCrosshair position="top-left" color="text-[#8B5CF6]" />
            <CornerCrosshair position="top-right" color="text-[#8B5CF6]" />
            <CornerCrosshair position="bottom-left" color="text-[#8B5CF6]" />
            <CornerCrosshair position="bottom-right" color="text-[#8B5CF6]" />

            {/* Row 1: Pillar 01 (Span 2) + Pillar 02 (Span 1) */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.08] border-b border-white/[0.08]">
              {/* 1. HERO BENTO CARD (Span 2 Columns): Dual-Engine State Tracker & SRE Dock */}
              <ZeroGapCard
                onClick={() => onLaunchApp('dual-vm')}
                spotlightColor="rgba(230, 0, 122, 0.16)"
                className="md:col-span-2 p-6 md:p-8"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-none bg-[#E6007A]/15 border border-[#E6007A]/40 flex items-center justify-center text-[#E6007A]">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white font-mono group-hover:text-[#E6007A] transition-colors">
                          Dual-Engine Tracker &amp; Parity Deck
                        </h3>
                        <span className="text-[10px] text-zinc-400 font-mono">Real-time Cross-VM Synchronicity &amp; Active SRE</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-2.5 py-1 rounded-none bg-[#E6007A]/15 text-[#E6007A] border border-[#E6007A]/30 font-bold uppercase tracking-wider">
                      PILLAR // 01
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed max-w-xl">
                    Correlates Substrate WASM consensus (:9944) and Frontier EVM execution (:8545) in real time. 
                    Isolates desync root causes across 3 architectural tiers and arms the 1-Click SRE Remediation Dock.
                  </p>

                  {/* Interactive Live Parity Preview Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-none bg-[#080512] border border-white/[0.06] text-xs font-mono">
                    <div className="space-y-1">
                      <div className="text-[10px] text-zinc-500 uppercase">SUBSTRATE WASM</div>
                      <div className="text-sm font-bold text-white tabular-nums">
                        #{dualData?.substrate?.best_block ? dualData.substrate.best_block.toLocaleString() : '161,594'}
                      </div>
                      <div className="text-[10px] text-emerald-400">14.2ms Latency</div>
                    </div>

                    <div className="space-y-1 sm:border-l sm:border-white/[0.08] sm:pl-3">
                      <div className="text-[10px] text-zinc-500 uppercase">FRONTIER EVM</div>
                      <div className="text-sm font-bold text-[#818CF8] tabular-nums">
                        #{dualData?.evm?.block_number ? dualData.evm.block_number.toLocaleString() : '161,594'}
                      </div>
                      <div className="text-[10px] text-emerald-400">18.7ms Latency</div>
                    </div>

                    <div className="space-y-1 sm:border-l sm:border-white/[0.08] sm:pl-3">
                      <div className="text-[10px] text-zinc-500 uppercase">PARITY STATUS</div>
                      <div className="inline-flex items-center px-2 py-0.5 rounded-none bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[11px]">
                        <span>0 BLK (100% LOCKSTEP)</span>
                      </div>
                      <div className="text-[10px] text-zinc-400">CLI Score: 12.5 / 100</div>
                    </div>
                  </div>

                  {/* SRE Action Pills Mini Dock */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-mono text-zinc-400">
                    <span className="px-2 py-0.5 rounded-none border border-white/[0.08] bg-[#0A0615] text-[#C084FC]">
                      ⚡ SRE Action: Circuit Breaker ARMED
                    </span>
                    <span className="px-2 py-0.5 rounded-none border border-white/[0.08] bg-[#0A0615] text-[#818CF8]">
                      🔄 FC-Sync Probe Ready
                    </span>
                    <span className="px-2 py-0.5 rounded-none border border-white/[0.08] bg-[#0A0615] text-emerald-400">
                      🧹 Mempool Zero Conflict
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-[#E6007A] font-bold pt-3 border-t border-white/[0.06] mt-4">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="text-[10px] font-mono">[ONLINE]</span>
                    <span className="text-zinc-300">Dual-Engine Telemetry</span>
                  </span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Open Parity Console</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </ZeroGapCard>

              {/* 2. PILLAR 02 (Span 1 Column): Slashing Guard & Mutex */}
              <ZeroGapCard
                onClick={() => onLaunchApp('slashing')}
                spotlightColor="rgba(168, 85, 247, 0.16)"
                className="p-6 md:p-8"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-none bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 flex items-center justify-center text-[#8B5CF6]">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-mono px-2.5 py-1 rounded-none bg-[#8B5CF6]/15 text-[#C084FC] border border-[#8B5CF6]/30 font-bold uppercase tracking-wider">
                      PILLAR // 02
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white font-mono group-hover:text-[#C084FC] transition-colors">
                      Slashing &amp; Mutex Guard
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Strict atomic anti-equivocation mutex lease eliminates double-signing slashing.
                    </p>
                  </div>

                  {/* Invariant Box */}
                  <div className="p-3 rounded-none bg-[#080512] border border-white/[0.06] font-mono text-[11px] space-y-1.5">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">TIMING INVARIANT</div>
                    <div className="text-emerald-400 font-bold">10.0s &lt; 12.0s &lt; 15.0s</div>
                    <div className="text-[10px] text-zinc-400">Self-Fence &lt; Lease &lt; Standby</div>
                  </div>

                  <div className="text-[10px] font-mono text-zinc-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Lease Arbiter:</span>
                      <span className="text-[#C084FC]">0xba11...7355</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Double-Signing Loss:</span>
                      <span className="text-emerald-400 font-bold">0% (Guaranteed)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-[#8B5CF6] font-bold pt-3 border-t border-white/[0.06] mt-4">
                  <span>Atomic Mutex Active</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </ZeroGapCard>
            </div>

            {/* Row 2: Pillar 03 (Span 1) + Pillar 04 (Span 2) */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
              {/* 3. PILLAR 03 (Span 1 Column): NPoS Yield Optimizer */}
              <ZeroGapCard
                onClick={() => onLaunchApp('staking')}
                spotlightColor="rgba(192, 132, 252, 0.16)"
                className="p-6 md:p-8"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-none bg-[#C084FC]/15 border border-[#C084FC]/40 flex items-center justify-center text-[#C084FC]">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-mono px-2.5 py-1 rounded-none bg-[#C084FC]/15 text-[#C084FC] border border-[#C084FC]/30 font-bold uppercase tracking-wider">
                      PILLAR // 03
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white font-mono group-hover:text-[#C084FC] transition-colors">
                      NPoS Yield Optimizer
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Client-side Sequential Phragmén filters greedy pools and compounds returns each era.
                    </p>
                  </div>

                  {/* Staking Yield Box */}
                  <div className="p-3 rounded-none bg-[#080512] border border-white/[0.06] font-mono text-[11px] space-y-1.5">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">POT STAKING YIELD</div>
                    <div className="text-white font-bold text-base tabular-nums">
                      {nposData?.auto_compounded_apy ? `${nposData.auto_compounded_apy.toFixed(2)}% APY` : '17.13% APY'}
                    </div>
                    <div className="text-emerald-400 font-bold text-[10px]">+{nposData?.apy_boost_pct ? nposData.apy_boost_pct.toFixed(2) : '1.16'}% Auto-Compounded Boost</div>
                  </div>

                  <div className="text-[10px] font-mono text-zinc-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Oversubscribed:</span>
                      <span className="text-emerald-400 font-bold">0% Risk (Filtered)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Staking Vault:</span>
                      <span className="text-[#C084FC]">0x97e5...610A</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-[#C084FC] font-bold pt-3 border-t border-white/[0.06] mt-4">
                  <span>Top 16 Non-Clipped</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </ZeroGapCard>

              {/* 4. PILLAR 04 (Span 2 Columns): RPC Anti-Spam Shield & P2P Defense */}
              <ZeroGapCard
                onClick={() => onLaunchApp('shield')}
                spotlightColor="rgba(56, 189, 248, 0.16)"
                className="md:col-span-2 p-6 md:p-8"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-none bg-[#38BDF8]/15 border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8]">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white font-mono group-hover:text-[#38BDF8] transition-colors">
                          RPC Anti-Spam Shield &amp; P2P Defense
                        </h3>
                        <span className="text-[10px] text-zinc-400 font-mono">&lt; 1ms Asynchronous Packet Filtering &amp; Eclipse Guard</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-2.5 py-1 rounded-none bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 font-bold uppercase tracking-wider">
                      PILLAR // 04
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Protects Portaldot validator nodes from OOM crashes caused by malicious 500,000-block eth_getLogs floods, 
                    enforces 256KB socket ceilings, and continuously detects /24 Sybil subnet concentration attacks.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-none bg-[#080512] border border-white/[0.06] text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block">INSPECTION OVERHEAD</span>
                      <span className="font-bold text-emerald-400">&lt; 0.25ms (Zero-Copy)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block">BLOCK SPAN LIMIT</span>
                      <span className="font-bold text-white">&le; 2,000 Blocks</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block">SYBIL ECLIPSE GUARD</span>
                      <span className="font-bold text-[#38BDF8]">Subnet Diversity Active</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-[#38BDF8] font-bold pt-3 border-t border-white/[0.06] mt-4">
                  <span>60 Req / Min / IP Rate Limited</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Open RPC Shield</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </ZeroGapCard>
            </div>
          </div>
        </div>
      </BlueprintSection>

      {/* SECTION DIVIDER 3: Dots Matrix Technical Spacer Strip */}
      <SectionDivider
        variant="dots"
        height="h-14"
        label="AUTOMATION_ENGINE"
        sublabel="VISUAL_DAG_PIPELINE"
      />

      {/* Section 4: Visual DAG Runbook Canvas */}
      <BlueprintSection
        id="dag-canvas"
        borderBottom={true}
        borderTop={false}
        background="bg-[#0A0615]"
        containerClassName="py-20 sm:py-24 px-4 sm:px-6 relative z-10"
      >
        <LazySection 
          minHeight="min-h-[580px]"
          fallbackText="INITIALIZING DAG AUTOMATION PIPELINE..."
        >
          <div className="max-w-6xl mx-auto space-y-10 sm:space-y-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
                  Visual DAG Automation Canvas
                </h2>
              </div>
              <p className="text-zinc-400 text-xs sm:text-sm max-w-md font-mono">
                From passive metric observation to deterministic execution runbooks. Drag, connect, and automate validator operations.
              </p>
            </div>

            {/* Interactive Visual Board with Animated Running Nodes Mockup */}
            <RealCanvasMockupBoard onLaunchApp={onLaunchApp} />
          </div>
        </LazySection>
      </BlueprintSection>

      {/* SECTION DIVIDER 4: Hatched Technical Spacer Strip */}
      <SectionDivider
        variant="hatched"
        height="h-14"
        label="ARCHITECTURAL_AUDIT"
        sublabel="BENCHMARK_MATRIX"
      />

      {/* Section 5: Comparison Matrix */}
      <BlueprintSection
        id="comparison"
        borderBottom={true}
        borderTop={false}
        background="bg-[#07040E]"
        containerClassName="py-20 sm:py-24 px-4 sm:px-6 relative z-10"
      >
        <LazySection 
          minHeight="min-h-[500px]"
          fallbackText="LOADING COMPARATIVE BENCHMARKS..."
        >
          <div className="max-w-6xl mx-auto space-y-10 sm:space-y-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
              <div className="space-y-2">
                <div className="inline-flex items-center px-3 py-1 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[10px] font-mono text-[#C084FC] font-bold tracking-widest uppercase">
                  <span>COMPETITIVE ANALYSIS</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
                  Why DotNexus Stands Apart
                </h2>
              </div>
              <p className="text-zinc-400 text-xs sm:text-sm max-w-md font-mono">
                Evaluating DotNexus against traditional Linux CLI bash scripts and generic passive Grafana metrics.
              </p>
            </div>

            <div className="overflow-x-auto rounded-none border border-white/[0.08] bg-[#0B0813] shadow-2xl relative">
              <CornerCrosshair position="top-left" color="text-[#8B5CF6]" />
              <CornerCrosshair position="top-right" color="text-[#8B5CF6]" />
              <CornerCrosshair position="bottom-left" color="text-[#8B5CF6]" />
              <CornerCrosshair position="bottom-right" color="text-[#8B5CF6]" />
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#110A1E]/80 text-zinc-400">
                    <th className="p-3.5 sm:p-4 text-zinc-200">OPERATIONAL CAPABILITY</th>
                    <th className="p-3.5 sm:p-4 text-zinc-500">MANUAL LINUX CLI</th>
                    <th className="p-3.5 sm:p-4 text-zinc-500">GRAFANA / PROMETHEUS</th>
                    <th className="p-3.5 sm:p-4 text-[#C084FC] font-bold bg-[#170B2C]/50 border-l border-white/[0.08]">
                      DOTNEXUS CONTROL PLANE
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-white">Dual-VM Sync (WASM vs EVM)</td>
                    <td className="p-3.5 sm:p-4 text-zinc-500">Requires manual curl to 2 ports</td>
                    <td className="p-3.5 sm:p-4 text-zinc-400">Separate graphs, no correlation</td>
                    <td className="p-3.5 sm:p-4 text-emerald-400 font-bold bg-[#170B2C]/30 border-l border-white/[0.08]">
                      Realtime parity delta &amp; mempool split
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-white">Slashing &amp; Equivocation Guard</td>
                    <td className="p-3.5 sm:p-4 text-[#EF4444]">High risk of double-signing</td>
                    <td className="p-3.5 sm:p-4 text-zinc-500">Passive alert only (too late)</td>
                    <td className="p-3.5 sm:p-4 text-emerald-400 font-bold bg-[#170B2C]/30 border-l border-white/[0.08]">
                      Atomic mutex lease &amp; 2-block failover
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-white">RPC Spam &amp; OOM Defense</td>
                    <td className="p-3.5 sm:p-4 text-zinc-500">Nginx manual configuration</td>
                    <td className="p-3.5 sm:p-4 text-zinc-500">Not supported</td>
                    <td className="p-3.5 sm:p-4 text-emerald-400 font-bold bg-[#170B2C]/30 border-l border-white/[0.08]">
                      Deep eth_getLogs packet inspection
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-white">NPoS Dynamic Yield Compounding</td>
                    <td className="p-3.5 sm:p-4 text-zinc-500">Manual staking via polkadot-js</td>
                    <td className="p-3.5 sm:p-4 text-zinc-500">Not supported</td>
                    <td className="p-3.5 sm:p-4 text-emerald-400 font-bold bg-[#170B2C]/30 border-l border-white/[0.08]">
                      Algorithm Top 16 + Auto-compounding
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-white">Operational Execution Mode</td>
                    <td className="p-3.5 sm:p-4 text-zinc-500">Manual terminal bash typing</td>
                    <td className="p-3.5 sm:p-4 text-zinc-500">Read-only passive display</td>
                    <td className="p-3.5 sm:p-4 text-emerald-400 font-bold bg-[#170B2C]/30 border-l border-white/[0.08]">
                      Visual DAG Drag-and-Drop Canvas
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </LazySection>
      </BlueprintSection>

      {/* SECTION DIVIDER 5: Glow Beam Spacer Strip */}
      <SectionDivider
        variant="glow"
        height="h-12"
        label="DELIVERY_ROADMAP"
        sublabel="HACKER_HOUSE_2026"
      />

      {/* Section 6: Delivery Line Journey (Roadmap) */}
      <BlueprintSection
        id="roadmap"
        borderBottom={true}
        borderTop={false}
        background="bg-[#07040E]"
        containerClassName="py-20 sm:py-24 px-4 sm:px-6 relative z-10"
      >
        <LazySection 
          minHeight="min-h-[520px]"
          fallbackText="CONNECTING LINE JOURNEY TELEMETRY..."
        >
          <div className="max-w-6xl mx-auto space-y-12 sm:space-y-16">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
              <div className="space-y-2">
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
            <div className="absolute top-[18px] left-[12.5%] right-[12.5%] h-[2px] bg-white/[0.08] z-0" />
            {/* Active Progress Beam (Station 01 to Station 02) */}
            <div className="absolute top-[18px] left-[12.5%] w-[25%] h-[2px] bg-gradient-to-r from-[#10B981] via-[#8B5CF6] to-[#C084FC] z-0" />

            <div className="grid grid-cols-4 gap-6 relative z-10">
              {/* Station 01 */}
              <div className="flex flex-col items-center text-center space-y-3.5">
                {/* Station Junction Node on Rail */}
                <div className="w-9 h-9 rounded-none bg-[#07040E] border-2 border-[#10B981] flex items-center justify-center text-[#10B981] z-10 relative shadow-lg shadow-[#10B981]/20">
                  <Check className="w-4 h-4 text-[#10B981]" />
                  <span className="absolute -top-2.5 -right-2 px-1 py-0.2 bg-[#0A261B] border border-[#10B981]/40 text-[#10B981] text-[9px] font-mono font-bold rounded-none">
                    01
                  </span>
                </div>

                {/* Station Date & Phase Tag */}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-[#10B981] font-bold block tracking-wider">
                    OCT 14, 2026
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 bg-[#10B981]/15 text-[#10B981] font-bold border border-[#10B981]/30 rounded-none inline-block uppercase">
                    PHASE 01 // COMPLETED
                  </span>
                </div>

                {/* Milestone Deliverable Card */}
                <div className="w-full p-4 rounded-none border border-white/[0.08] bg-[#0B0813] space-y-2 text-left h-[170px] flex flex-col justify-between shadow-lg">
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono">Architecture Kick-off</h4>
                    <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                      Finalized Dual-VM telemetry pipeline and dual WebSocket/RPC collector baseline.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-white/[0.06]">
                    <span className="text-zinc-500">v0.1 Baseline</span>
                    <span className="text-[#10B981] font-bold">VERIFIED</span>
                  </div>
                </div>
              </div>

              {/* Station 02 */}
              <div className="flex flex-col items-center text-center space-y-3.5">
                {/* Station Junction Node on Rail */}
                <div className="w-9 h-9 rounded-none bg-[#120B24] border-2 border-[#C084FC] flex items-center justify-center text-[#C084FC] z-10 relative shadow-lg shadow-[#C084FC]/30">
                  <Activity className="w-4 h-4 text-[#C084FC]" />
                  <span className="absolute -top-2.5 -right-2 px-1 py-0.2 bg-[#2E1452] border border-[#C084FC]/60 text-[#C084FC] text-[9px] font-mono font-bold rounded-none">
                    02
                  </span>
                </div>

                {/* Station Date & Phase Tag */}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-[#C084FC] font-bold block tracking-wider">
                    OCT 24, 2026 (12:00 UTC)
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 bg-[#8B5CF6]/25 text-[#C084FC] font-bold border border-[#8B5CF6]/40 rounded-none inline-block uppercase">
                    PHASE 02 // TARGET
                  </span>
                </div>

                {/* Milestone Deliverable Card */}
                <div className="w-full p-4 rounded-none border border-[#8B5CF6]/50 bg-[#120A24] space-y-2 text-left h-[170px] flex flex-col justify-between shadow-lg">
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono">DoraHacks Check-in</h4>
                    <p className="text-[11px] text-zinc-300 mt-1.5 leading-relaxed">
                      Working Dual-VM Tracker, Slashing Guard failover, and interactive DAG Canvas prototype.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-white/[0.06]">
                    <span className="text-[#C084FC]">Live MVP Demo</span>
                    <span className="text-[#C084FC] font-bold">ACTIVE TARGET</span>
                  </div>
                </div>
              </div>

              {/* Station 03 */}
              <div className="flex flex-col items-center text-center space-y-3.5">
                {/* Station Junction Node on Rail */}
                <div className="w-9 h-9 rounded-none bg-[#07040E] border-2 border-zinc-700 flex items-center justify-center text-zinc-500 z-10 relative">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  <span className="absolute -top-2.5 -right-2 px-1 py-0.2 bg-[#120B24] border border-zinc-700 text-zinc-500 text-[9px] font-mono font-bold rounded-none">
                    03
                  </span>
                </div>

                {/* Station Date & Phase Tag */}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-zinc-400 font-bold block tracking-wider">
                    NOV 06, 2026 (04:00 UTC)
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 bg-[#120B24] text-zinc-500 font-bold border border-white/[0.08] rounded-none inline-block uppercase">
                    PHASE 03 // SCHEDULED
                  </span>
                </div>

                {/* Milestone Deliverable Card */}
                <div className="w-full p-4 rounded-none border border-white/[0.08] bg-[#0B0813] space-y-2 text-left h-[170px] flex flex-col justify-between shadow-lg">
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono">Code Freeze &amp; Hardening</h4>
                    <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                      RPC Shield payload filters, 100% test suite passage, and comprehensive judge audit report.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-white/[0.06]">
                    <span className="text-zinc-500">v1.0 Release</span>
                    <span className="text-zinc-400 font-bold">SCHEDULED</span>
                  </div>
                </div>
              </div>

              {/* Station 04 */}
              <div className="flex flex-col items-center text-center space-y-3.5">
                {/* Station Junction Node on Rail */}
                <div className="w-9 h-9 rounded-none bg-[#07040E] border-2 border-zinc-800 flex items-center justify-center text-zinc-600 z-10 relative">
                  <CircleDot className="w-4 h-4 text-zinc-600" />
                  <span className="absolute -top-2.5 -right-2 px-1 py-0.2 bg-[#120B24] border border-zinc-800 text-zinc-600 text-[9px] font-mono font-bold rounded-none">
                    04
                  </span>
                </div>

                {/* Station Date & Phase Tag */}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-zinc-500 font-bold block tracking-wider">
                    NOV 07–08, 2026
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 bg-[#120B24] text-zinc-600 font-bold border border-white/[0.08] rounded-none inline-block uppercase">
                    PHASE 04 // DEMO DAY
                  </span>
                </div>

                {/* Milestone Deliverable Card */}
                <div className="w-full p-4 rounded-none border border-white/[0.08] bg-[#0B0813] space-y-2 text-left h-[170px] flex flex-col justify-between shadow-lg">
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono">Live Demo Day</h4>
                    <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                      Live verification with Portaldot Network foundation judges demonstrating real-time fault injection.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-white/[0.06]">
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
            <div className="absolute top-3 bottom-3 left-3 w-[2px] bg-white/[0.08] z-0" />
            <div className="absolute top-3 left-3 w-[2px] h-[35%] bg-gradient-to-b from-[#10B981] via-[#8B5CF6] to-[#C084FC] z-0" />

            {/* Station 01 */}
            <div className="relative pl-10">
              <div className="absolute left-[1px] top-1.5 w-6 h-6 rounded-none bg-[#07040E] border-2 border-[#10B981] flex items-center justify-center z-10">
                <Check className="w-3 h-3 text-[#10B981]" />
              </div>
              <div className="p-3.5 rounded-none border border-white/[0.08] bg-[#0B0813] space-y-1.5 shadow-lg">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#10B981] font-bold">OCT 14, 2026</span>
                  <span className="px-2 py-0.5 bg-[#10B981]/15 text-[#10B981] text-[9px] font-bold rounded-none">PHASE 01 // COMPLETED</span>
                </div>
                <div className="text-xs font-bold text-white font-mono">Architecture Kick-off &amp; Baseline</div>
                <p className="text-[11px] text-zinc-400">Finalized Dual-VM WebSocket &amp; RPC baseline collectors.</p>
              </div>
            </div>

            {/* Station 02 */}
            <div className="relative pl-10">
              <div className="absolute left-[1px] top-1.5 w-6 h-6 rounded-none bg-[#120B24] border-2 border-[#C084FC] flex items-center justify-center z-10">
                <Activity className="w-3 h-3 text-[#C084FC]" />
              </div>
              <div className="p-3.5 rounded-none border border-[#8B5CF6]/50 bg-[#120A24] space-y-1.5 shadow-lg">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#C084FC] font-bold">OCT 24, 2026 (12:00 UTC)</span>
                  <span className="px-2 py-0.5 bg-[#8B5CF6]/25 text-[#C084FC] text-[9px] font-bold rounded-none">PHASE 02 // TARGET</span>
                </div>
                <div className="text-xs font-bold text-white font-mono">DoraHacks Check-in &amp; Working Prototype</div>
                <p className="text-[11px] text-zinc-300">Dual-Engine Tracker, Slashing Guard failover &amp; DAG Canvas prototype.</p>
              </div>
            </div>

            {/* Station 03 */}
            <div className="relative pl-10">
              <div className="absolute left-[1px] top-1.5 w-6 h-6 rounded-none bg-[#07040E] border-2 border-zinc-700 flex items-center justify-center z-10">
                <Clock className="w-3 h-3 text-zinc-500" />
              </div>
              <div className="p-3.5 rounded-none border border-white/[0.08] bg-[#0B0813] space-y-1.5 shadow-lg">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-400 font-bold">NOV 06, 2026 (04:00 UTC)</span>
                  <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[9px] font-bold rounded-none">PHASE 03 // SCHEDULED</span>
                </div>
                <div className="text-xs font-bold text-white font-mono">Code Freeze &amp; Security Hardening</div>
                <p className="text-[11px] text-zinc-400">Complete code package, pitch deck &amp; test suite verification.</p>
              </div>
            </div>

            {/* Station 04 */}
            <div className="relative pl-10">
              <div className="absolute left-[1px] top-1.5 w-6 h-6 rounded-none bg-[#07040E] border-2 border-zinc-800 flex items-center justify-center z-10">
                <CircleDot className="w-3 h-3 text-zinc-600" />
              </div>
              <div className="p-3.5 rounded-none border border-white/[0.08] bg-[#0B0813] space-y-1.5 shadow-lg">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-500 font-bold">NOV 07–08, 2026</span>
                  <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 text-[9px] font-bold rounded-none">PHASE 04 // DEMO DAY</span>
                </div>
                <div className="text-xs font-bold text-white font-mono">Live Demo Day &amp; Foundation Review</div>
                <p className="text-[11px] text-zinc-400">Live demonstration with Portaldot Network foundation judges.</p>
              </div>
            </div>
          </div>
        </div>
      </LazySection>
      </BlueprintSection>

      {/* Footer — Minimalist Developer Footer with Continuous Central Rail */}
      <footer className="w-full border-t border-white/[0.08] bg-[#05030A] text-xs font-mono text-zinc-500 relative z-10 select-none">
        <div className="max-w-7xl mx-auto border-x border-white/[0.08] py-8 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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
