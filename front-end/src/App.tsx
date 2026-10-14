import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  ShieldCheck, 
  TrendingUp, 
  Shield, 
  Workflow, 
  Terminal, 
  RefreshCw,
  Server
} from 'lucide-react';
import { Header } from './components/Header';
import { TerminalDrawer } from './components/TerminalDrawer';
import { DualEngineView } from './views/DualEngineView';
import { SecurityGuardView } from './views/SecurityGuardView';
import { StakingYieldView } from './views/StakingYieldView';
import { TopologyRadarView } from './views/TopologyRadarView';
import { CanvasBoard } from './views/CanvasBoard';
import { LandingPage } from './views/LandingPage';
import { 
  api, 
  DualTelemetryState, 
  SecurityDashboardState, 
  NPoSRecommendation, 
  ShieldStatus 
} from './services/api';

type ViewMode = 'landing' | 'console';
type TabType = 'dual-vm' | 'slashing' | 'staking' | 'shield' | 'canvas';

export const App: React.FC = () => {
  // Default to our semantic React + Three.js Landing Page
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [activeTab, setActiveTab] = useState<TabType>('dual-vm');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // States
  const [dualData, setDualData] = useState<DualTelemetryState | null>(null);
  const [secData, setSecData] = useState<SecurityDashboardState | null>(null);
  const [nposData, setNposData] = useState<NPoSRecommendation | null>(null);
  const [shieldData, setShieldData] = useState<ShieldStatus | null>(null);
  const [logs, setLogs] = useState<any[]>([]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [dualRes, secRes, nposRes, shieldRes, logsRes] = await Promise.all([
        api.getDualTracker().catch(() => null),
        api.getSlashGuard().catch(() => null),
        api.getTop16Validators().catch(() => null),
        api.getRpcShield().catch(() => null),
        api.getLogs().catch(() => null)
      ]);

      if (dualRes?.success) setDualData(dualRes.data);
      if (secRes?.success) setSecData(secRes.data);
      if (nposRes?.success) setNposData(nposRes.data);
      if (shieldRes?.success) setShieldData(shieldRes.data);
      if (logsRes?.success) setLogs(logsRes.logs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 5000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dual-vm' as TabType, label: 'Dual-VM Telemetry', icon: Layers },
    { id: 'slashing' as TabType, label: 'Slashing Guard', icon: ShieldCheck },
    { id: 'staking' as TabType, label: 'NPoS Staking', icon: TrendingUp },
    { id: 'shield' as TabType, label: 'RPC Shield & Topology', icon: Shield },
    { id: 'canvas' as TabType, label: 'Automation Canvas', icon: Workflow }
  ];

  // Semantic HTML/React Landing Page with Three.js Background
  if (viewMode === 'landing') {
    return <LandingPage onLaunchApp={() => setViewMode('console')} />;
  }

  // Control Center Console
  return (
    <div className="min-h-screen flex flex-col bg-[#0B0813] text-[#E2E8F0]">
      {/* Global Cluster Header */}
      <Header
        bestBlock={dualData?.substrate?.best_block || 4120912}
        finalizedBlock={dualData?.substrate?.finalized_block || 4120909}
        evmBlock={dualData?.evm?.block_number || 4120911}
        delta={dualData?.sync?.delta_blocks || 1}
        syncStatus={dualData?.sync?.status || 'SYNCED'}
        activeNode={secData?.active_node || 'PRIMARY'}
        onNavigateHome={() => setViewMode('landing')}
      />

      {/* Main Control Center Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Hotkey Rail */}
        <aside className="w-16 md:w-56 border-r border-[#261B42] bg-[#0F0A1F] flex flex-col justify-between py-4 select-none shrink-0">
          <div className="space-y-1 px-2">
            <div className="text-[10px] uppercase font-mono text-zinc-500 px-3 py-1 hidden md:block">
              Operations Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-mono transition-all text-left ${
                    isActive
                      ? 'bg-[#1A1333] border-l-2 border-[#8B5CF6] text-white font-semibold'
                      : 'text-zinc-400 hover:bg-[#130E26] hover:text-zinc-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#8B5CF6]' : 'text-zinc-400'}`} />
                  <span className="hidden md:inline truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer info */}
          <div className="px-3 text-[11px] font-mono text-zinc-500 hidden md:block">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span>Engine Status: Online</span>
            </div>
            <div className="text-[10px] text-zinc-600 mt-1">Portaldot Network V3.0</div>
          </div>
        </aside>

        {/* Center Workspace */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#0B0813]">
          {activeTab === 'dual-vm' && (
            <DualEngineView data={dualData} onRefresh={fetchAllData} isLoading={isLoading} />
          )}
          {activeTab === 'slashing' && (
            <SecurityGuardView data={secData} onRefresh={fetchAllData} />
          )}
          {activeTab === 'staking' && (
            <StakingYieldView data={nposData} onRefresh={fetchAllData} />
          )}
          {activeTab === 'shield' && (
            <TopologyRadarView data={shieldData} onRefresh={fetchAllData} />
          )}
          {activeTab === 'canvas' && <CanvasBoard />}
        </main>
      </div>

      {/* Terminal Drawer */}
      <TerminalDrawer logs={logs} onClear={() => setLogs([])} />
    </div>
  );
};

export default App;
