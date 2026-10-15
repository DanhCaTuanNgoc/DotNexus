import React, { useState, useEffect, useCallback } from 'react';
import { 
  Layers, 
  ShieldCheck, 
  TrendingUp, 
  Shield, 
  Workflow, 
  Terminal, 
  RefreshCw,
  Server,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { Header } from './components/Header';
import { TerminalDrawer } from './components/TerminalDrawer';
import { DualEngineView } from './views/DualEngineView';
import { SecurityGuardView } from './views/SecurityGuardView';
import { StakingYieldView } from './views/StakingYieldView';
import { TopologyRadarView } from './views/TopologyRadarView';
import { CanvasBoard } from './views/CanvasBoard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './views/LandingPage';
import { 
  api, 
  DualTelemetryState, 
  SecurityDashboardState, 
  NPoSRecommendation, 
  ShieldStatus 
} from './services/api';
import { storage, ViewMode, TabType } from './services/storage';

export const App: React.FC = () => {
  // Restore view mode, active tab, and sidebar state from localStorage
  const [viewMode, setViewModeState] = useState<ViewMode>(() => storage.getViewMode('landing'));
  const [activeTab, setActiveTabState] = useState<TabType>(() => storage.getActiveTab('dual-vm'));
  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState<boolean>(() => storage.getSidebarCollapsed(false));
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    storage.setViewMode(mode);
  };

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    storage.setActiveTab(tab);
  };

  const setIsSidebarCollapsed = (val: boolean | ((prev: boolean) => boolean)) => {
    setIsSidebarCollapsedState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      storage.setSidebarCollapsed(next);
      return next;
    });
  };

  // States
  const [dualData, setDualData] = useState<DualTelemetryState | null>(null);
  const [secData, setSecData] = useState<SecurityDashboardState | null>(null);
  const [nposData, setNposData] = useState<NPoSRecommendation | null>(null);
  const [shieldData, setShieldData] = useState<ShieldStatus | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedCanvasNodeId, setSelectedCanvasNodeId] = useState<string | null>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(() => storage.getTerminalOpen(true));

  const handleAppendLog = useCallback((log: any) => {
    setLogs((prev) => [log, ...prev].slice(0, 100));
  }, []);

  const handleToggleTerminal = useCallback((open: boolean) => {
    setIsTerminalOpen(open);
    storage.setTerminalOpen(open);
  }, []);

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
      if (logsRes?.success) {
        setLogs((prev) => {
          // Preserve runtime DAG logs
          const dagLogs = prev.filter((l) => l.source === 'DAG_ENGINE' || l.source === 'RUNBOOK');
          const merged = [...dagLogs, ...logsRes.logs];
          const seen = new Set();
          return merged.filter((item) => {
            const key = `${item.time}-${item.source}-${item.text}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }).sort((a, b) => b.time - a.time).slice(0, 100);
        });
      }
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
    return (
      <LandingPage
        onLaunchApp={() => setViewMode('console')}
        dualData={dualData}
        secData={secData}
        nposData={nposData}
        shieldData={shieldData}
      />
    );
  }

  // Control Center Console
  return (
    <div className="h-screen flex flex-col bg-[#0B0813] text-[#E2E8F0] overflow-hidden">
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
        <aside
          className={`${
            isSidebarCollapsed ? 'w-16' : 'w-56'
          } border-r border-[#261B42] bg-[#0A0515] flex flex-col justify-between py-4 select-none shrink-0 pb-12 transition-all duration-200`}
        >
          <div className="space-y-1 px-2">
            {/* Operations Navigation Header & Collapse/Expand Toggle */}
            <div className="flex items-center justify-between px-2 py-1 mb-1">
              {!isSidebarCollapsed && (
                <span className="text-[10px] uppercase font-mono text-zinc-500 font-bold tracking-wider truncate">
                  Operations Navigation
                </span>
              )}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={`p-1 text-zinc-400 hover:text-white hover:bg-[#1E113E] border border-transparent hover:border-[#3B2564] transition-colors rounded-none ${
                  isSidebarCollapsed ? 'mx-auto' : 'ml-auto'
                }`}
                title={isSidebarCollapsed ? 'Expand Navigation Menu' : 'Collapse Navigation Menu'}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 text-[#8B5CF6]" />
                ) : (
                  <PanelLeftClose className="w-4 h-4 text-zinc-400" />
                )}
              </button>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    isSidebarCollapsed ? 'justify-center px-0' : 'justify-start gap-3 px-3'
                  } py-2.5 rounded-none text-xs font-mono transition-all text-left ${
                    isActive
                      ? 'bg-[#180E30] border-l-2 border-[#8B5CF6] text-white font-semibold'
                      : 'text-zinc-400 hover:bg-[#110A24] hover:text-zinc-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#8B5CF6]' : 'text-zinc-400'}`} />
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer info */}
          <div className={`px-3 text-[11px] font-mono text-zinc-500 ${isSidebarCollapsed ? 'text-center' : ''}`}>
            <div className={`flex items-center gap-1.5 text-zinc-400 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <span className="w-2 h-2 rounded-none bg-[#10B981] shrink-0" title="Engine Status: Online" />
              {!isSidebarCollapsed && <span>Engine Status: Online</span>}
            </div>
            {!isSidebarCollapsed && (
              <div className="text-[10px] text-zinc-600 mt-1">Portaldot Network V3.0</div>
            )}
          </div>
        </aside>

        {/* Center Workspace */}
        <main
          className={`flex-1 ${
            activeTab === 'canvas'
              ? 'p-2.5 pb-10 overflow-hidden flex flex-col'
              : 'p-6 pb-48 overflow-y-auto'
          } bg-[#080512]`}
        >
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
          {activeTab === 'canvas' && (
            <ErrorBoundary fallbackTitle="Visual DAG Canvas Interrupted">
              <CanvasBoard
                onLog={handleAppendLog}
                selectedNodeId={selectedCanvasNodeId}
                onSelectNode={setSelectedCanvasNodeId}
                onRequestOpenTerminal={() => handleToggleTerminal(true)}
              />
            </ErrorBoundary>
          )}
        </main>
      </div>

      {/* Fixed Diagnostic Terminal Drawer with Multi-Source and Node Filtering */}
      <TerminalDrawer
        logs={logs}
        onClear={() => setLogs([])}
        selectedNodeId={activeTab === 'canvas' ? selectedCanvasNodeId : null}
        onClearNodeFilter={() => setSelectedCanvasNodeId(null)}
        isOpen={isTerminalOpen}
        onToggleOpen={handleToggleTerminal}
      />
    </div>
  );
};

export default App;
