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
import { ErrorBoundary } from './components/ErrorBoundary';
import { OnboardingTour } from './components/OnboardingTour';

import { LandingPage } from './views/LandingPage';

// Dynamic Code Splitting via React.lazy for console operational views
const DualEngineView = React.lazy(() => import('./views/DualEngineView').then(m => ({ default: m.DualEngineView })));
const SecurityGuardView = React.lazy(() => import('./views/SecurityGuardView').then(m => ({ default: m.SecurityGuardView })));
const StakingYieldView = React.lazy(() => import('./views/StakingYieldView').then(m => ({ default: m.StakingYieldView })));
const TopologyRadarView = React.lazy(() => import('./views/TopologyRadarView').then(m => ({ default: m.TopologyRadarView })));
const CanvasBoard = React.lazy(() => import('./views/CanvasBoard').then(m => ({ default: m.CanvasBoard })));

import { ViewLoadingFallback } from './components/ViewLoadingFallback';
import { 
  api, 
  DualTelemetryState, 
  SecurityDashboardState, 
  NPoSRecommendation, 
  ShieldStatus,
  DEFAULT_DUAL_TELEMETRY,
  DEFAULT_SECURITY_STATE,
  DEFAULT_NPOS_DATA,
  DEFAULT_SHIELD_STATUS,
  DEFAULT_LOGS
} from './services/api';
import { storage, TabType } from './services/storage';
import { parseCurrentRoute, navigateTo, RouteState } from './services/router';

export const App: React.FC = () => {
  // URL Route is the single source of truth for navigation & deep-linking
  const [routeState, setRouteState] = useState<RouteState>(() => parseCurrentRoute());
  const viewMode = routeState.viewMode;
  const activeTab = routeState.activeTab;

  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState<boolean>(() => storage.getSidebarCollapsed(false));
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  // Auto-launch Onboarding Tour for first-time visitors once in console view
  useEffect(() => {
    if (viewMode === 'console') {
      const hasCompleted = storage.getOnboardingCompleted(false);
      if (!hasCompleted) {
        // Small delay to allow UI components to settle
        const timer = setTimeout(() => {
          setIsTourOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [viewMode]);

  const handleCloseTour = () => {
    setIsTourOpen(false);
    storage.setOnboardingCompleted(true);
  };

  const handleStartTour = () => {
    setIsTourOpen(true);
  };

  // Sync state whenever URL or browser history changes (Back/Forward buttons)
  useEffect(() => {
    const handleSyncRoute = (event?: Event) => {
      // If triggered by custom routechange event, consume event.detail directly
      if (event && 'detail' in event && (event as CustomEvent).detail) {
        const detail = (event as CustomEvent).detail;
        setRouteState({
          viewMode: detail.viewMode || 'console',
          activeTab: detail.activeTab || 'dual-vm',
          subRoute: detail.subRoute
        });
        return;
      }
      setRouteState(parseCurrentRoute());
    };

    // Normalize route if user accessed root alias like /app or /control
    const currentPath = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
    if (routeState.viewMode === 'console' && (currentPath === 'control' || currentPath === 'app' || currentPath === 'console')) {
      navigateTo('console', routeState.activeTab, undefined, true);
    }

    window.addEventListener('popstate', handleSyncRoute);
    window.addEventListener('dotnexus:routechange', handleSyncRoute);

    return () => {
      window.removeEventListener('popstate', handleSyncRoute);
      window.removeEventListener('dotnexus:routechange', handleSyncRoute);
    };
  }, []);

  const handleLaunchApp = (targetTab?: TabType) => {
    const tab = targetTab || activeTab || 'dual-vm';
    navigateTo('console', tab);
  };

  const handleSelectTab = (tab: TabType) => {
    navigateTo('console', tab);
    setIsMobileNavOpen(false);
  };

  const handleNavigateHome = () => {
    navigateTo('landing');
  };

  const setIsSidebarCollapsed = (val: boolean | ((prev: boolean) => boolean)) => {
    setIsSidebarCollapsedState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      storage.setSidebarCollapsed(next);
      return next;
    });
  };

  // States - initialized with high-fidelity deterministic defaults to prevent infinite loading on Vercel
  const [dualData, setDualData] = useState<DualTelemetryState>(() => DEFAULT_DUAL_TELEMETRY);
  const [secData, setSecData] = useState<SecurityDashboardState>(() => DEFAULT_SECURITY_STATE);
  const [nposData, setNposData] = useState<NPoSRecommendation>(() => DEFAULT_NPOS_DATA);
  const [shieldData, setShieldData] = useState<ShieldStatus>(() => DEFAULT_SHIELD_STATUS);
  const [logs, setLogs] = useState<any[]>(() => DEFAULT_LOGS);
  const [selectedCanvasNodeId, setSelectedCanvasNodeId] = useState<string | null>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(() => storage.getTerminalOpen(true));

  const handleAppendLog = useCallback((log: any) => {
    setLogs((prev) => [...prev, log].slice(-100));
  }, []);

  const handleToggleTerminal = useCallback((open: boolean) => {
    setIsTerminalOpen(open);
    storage.setTerminalOpen(open);
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.allSettled([
        api.getDualTracker().then(res => {
          if (res?.success && res.data) setDualData(res.data);
        }).catch(() => null),

        api.getRecentDualBlocks(5).catch(() => null),

        api.getSlashGuard().then(res => {
          if (res?.success && res.data) setSecData(res.data);
        }).catch(() => null),

        api.getTop16Validators().then(res => {
          if (res?.success && res.data) setNposData(res.data);
        }).catch(() => null),

        api.getRpcShield().then(res => {
          if (res?.success && res.data) setShieldData(res.data);
        }).catch(() => null),

        api.getLogs().then(logsRes => {
          if (logsRes?.success) {
            setLogs((prev) => {
              const dagLogs = prev.filter((l) => l.source === 'DAG_ENGINE' || l.source === 'RUNBOOK');
              const merged = [...dagLogs, ...logsRes.logs];
              const seen = new Set();
              return merged.filter((item) => {
                const key = `${item.time}-${item.source}-${item.text}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              }).sort((a, b) => a.time - b.time).slice(-100);
            });
          }
        }).catch(() => null)
      ]);
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
    { id: 'dual-vm' as TabType, label: 'Dual-VM Telemetry', shortLabel: 'Dual-VM', icon: Layers },
    { id: 'slashing' as TabType, label: 'Slashing Guard', shortLabel: 'Slashing', icon: ShieldCheck },
    { id: 'staking' as TabType, label: 'NPoS Staking', shortLabel: 'Staking', icon: TrendingUp },
    { id: 'shield' as TabType, label: 'RPC Shield & Topology', shortLabel: 'Shield', icon: Shield },
    { id: 'canvas' as TabType, label: 'Automation Canvas', shortLabel: 'Canvas', icon: Workflow }
  ];

  // Semantic HTML/React Landing Page with Three.js Background
  if (viewMode === 'landing') {
    return (
      <LandingPage
        onLaunchApp={handleLaunchApp}
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
        bestBlock={dualData?.substrate?.best_block || 205160}
        finalizedBlock={dualData?.substrate?.finalized_block || 205158}
        evmBlock={dualData?.evm?.block_number || 205160}
        delta={dualData?.sync?.delta_blocks || 0}
        syncStatus={dualData?.sync?.status || 'SYNCED'}
        activeNode={secData?.active_node || 'PRIMARY'}
        onNavigateHome={handleNavigateHome}
        isMobileNavOpen={isMobileNavOpen}
        onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
        onStartTour={handleStartTour}
        isLiveChain={Boolean(dualData?.substrate?.is_live_chain)}
      />

      {/* Main Control Center Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Backdrop Overlay */}
        {isMobileNavOpen && (
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileNavOpen(false)}
          />
        )}

        {/* Mobile Slide-over Drawer */}
        <aside
          className={`fixed inset-y-0 left-0 w-64 bg-[#06040A] border-r border-[#1C142E] z-50 flex flex-col justify-between py-4 select-none pb-8 transition-transform duration-150 md:hidden shadow-2xl ${
            isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="space-y-1 px-3">
            <div className="flex items-center justify-between px-2 py-2 mb-2 border-b border-[#1C142E]">
              <span className="text-[10px] uppercase font-mono text-zinc-500 font-bold tracking-widest">
                Module
              </span>
              <button
                onClick={() => setIsMobileNavOpen(false)}
                className="p-1 text-zinc-500 hover:text-white"
                title="Close Menu"
              >
                ✕
              </button>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-mono transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#110C1E] border-l-2 border-[#8B5CF6] text-white font-bold'
                      : 'border-l-2 border-transparent text-zinc-400 hover:bg-[#0B0813] hover:text-zinc-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#8B5CF6]' : 'text-zinc-500'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="px-4 text-[10px] font-mono text-zinc-600 border-t border-[#1C142E] pt-3">
            <div className="flex items-center gap-2 text-zinc-400">
              <span className="w-1.5 h-1.5 bg-[#00FF9D] shrink-0" />
              <span>NODE STATUS: NOMINAL</span>
            </div>
            <div className="text-[9px] text-zinc-600 mt-0.5">PORTALDOT V3.0 DUAL-VM</div>
          </div>
        </aside>

        {/* Desktop Sidebar Hotkey Rail */}
        <aside
          data-tour="sidebar-navigation"
          className={`hidden md:flex ${
            isSidebarCollapsed ? 'w-14' : 'w-52'
          } border-r border-[#1C142E] bg-[#06040A] flex-col justify-between py-3 select-none shrink-0 pb-12 transition-all duration-150`}
        >
          <div className="space-y-0.5 px-2">
            {/* Operations Navigation Header & Collapse/Expand Toggle */}
            <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-[#140D24] pb-1.5">
              {!isSidebarCollapsed && (
                <span className="text-[9px] uppercase font-mono text-zinc-500 font-bold tracking-widest truncate">
                  MODULES
                </span>
              )}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={`p-1 text-zinc-500 hover:text-white hover:bg-[#110C1E] border border-transparent hover:border-[#1C142E] transition-colors ${
                  isSidebarCollapsed ? 'mx-auto' : 'ml-auto'
                }`}
                title={isSidebarCollapsed ? 'Expand Navigation Menu' : 'Collapse Navigation Menu'}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="w-3.5 h-3.5 text-[#8B5CF6]" />
                ) : (
                  <PanelLeftClose className="w-3.5 h-3.5 text-zinc-500" />
                )}
              </button>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    isSidebarCollapsed ? 'justify-center px-0' : 'justify-start gap-2.5 px-2.5'
                  } py-2 text-[11px] font-mono transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#110C1E] border-l-2 border-[#8B5CF6] text-white font-bold'
                      : 'border-l-2 border-transparent text-zinc-400 hover:bg-[#0B0813] hover:text-zinc-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#8B5CF6]' : 'text-zinc-500'}`} />
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer info */}
          <div className={`px-3 text-[10px] font-mono text-zinc-600 ${isSidebarCollapsed ? 'text-center' : ''}`}>
            <div className={`flex items-center gap-1.5 text-zinc-400 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <span className="w-1.5 h-1.5 bg-[#00FF9D] shrink-0" title="Engine Status: Online" />
              {!isSidebarCollapsed && <span>ENGINE: ONLINE</span>}
            </div>
            {!isSidebarCollapsed && (
              <div className="text-[9px] text-zinc-600 mt-0.5">SUBSTRATE + EVM</div>
            )}
          </div>
        </aside>

        {/* Center Workspace */}
        <main
          className={`flex-1 ${
            activeTab === 'canvas' && Boolean(routeState.subRoute)
              ? 'p-0 pb-16 md:pb-8 overflow-hidden flex flex-col'
              : 'p-3 sm:p-5 md:p-6 pb-36 sm:pb-44 md:pb-48 overflow-y-auto'
          } bg-[#080512]`}
        >
          <React.Suspense fallback={<ViewLoadingFallback />}>
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
                  subRoute={routeState.subRoute}
                  onNavigateSubRoute={(sub) => navigateTo('console', 'canvas', sub)}
                  bestBlock={dualData.substrate.best_block}
                />
              </ErrorBoundary>
            )}
          </React.Suspense>
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

      {/* Guided Mission Briefing Onboarding Tour Modal */}
      <OnboardingTour
        isOpen={isTourOpen}
        onClose={handleCloseTour}
        onNavigateTab={(tab) => handleSelectTab(tab)}
        currentTab={activeTab}
      />
    </div>
  );
};

export default App;
