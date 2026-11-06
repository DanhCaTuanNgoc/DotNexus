import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ShieldStatus
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

  // States - Initialized with persistent SWR cache to eliminate "Querying Live..." blank freezes
  const [dualData, setDualData] = useState<DualTelemetryState>(() => api.getCachedDualState());
  const [secData, setSecData] = useState<SecurityDashboardState>(() => api.getCachedSecurityState());
  const [nposData, setNposData] = useState<NPoSRecommendation>(() => api.getCachedNposState());
  const [shieldData, setShieldData] = useState<ShieldStatus>(() => api.getCachedShieldState());
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedCanvasNodeId, setSelectedCanvasNodeId] = useState<string | null>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(() => storage.getTerminalOpen(true));
  const lastClearedTimeRef = useRef<number>(0);

  const handleAppendLog = useCallback((log: any) => {
    setLogs((prev) => [...prev, log].slice(-100));
  }, []);

  const handleClearLogs = useCallback(async () => {
    lastClearedTimeRef.current = Date.now() / 1000;
    await api.clearLogs();
    setLogs([]);
  }, []);

  const handleExecuteCommand = useCallback(async (cmd: string) => {
    handleAppendLog({
      source: 'CLI',
      level: 'INFO',
      time: Date.now() / 1000,
      text: `$ ${cmd}`
    });
    const res = await api.executeDiagnosticCommand(cmd);
    if ((res as any).action === 'clear') {
      await handleClearLogs();
      return;
    }
    handleAppendLog({
      source: res.source || 'SYSTEM',
      level: res.level || (res.success ? 'SUCCESS' : 'WARN'),
      time: Date.now() / 1000,
      text: res.output
    });
  }, [handleAppendLog, handleClearLogs]);

  const handleToggleTerminal = useCallback((open: boolean) => {
    setIsTerminalOpen(open);
    storage.setTerminalOpen(open);
  }, []);

  const fetchDualData = useCallback(async () => {
    try {
      const [res] = await Promise.all([
        api.getDualTracker(),
        api.getRecentDualBlocks(5).catch(() => null)
      ]);
      if (res?.success && res.data) {
        const cachedLive = api.getCachedDualState();
        if ((res as any).isFallback && cachedLive?.substrate?.is_live_chain) {
          setDualData(cachedLive);
        } else {
          setDualData(res.data);
        }
      }
    } catch (e) {
      console.warn('DualTracker fetch failed:', e);
    }
  }, []);

  const fetchSlashGuard = useCallback(async () => {
    try {
      const res = await api.getSlashGuard();
      if (res?.success && res.data) {
        setSecData(res.data);
      }
    } catch (e) {
      console.warn('SlashGuard fetch failed:', e);
    }
  }, []);

  const fetchStakingData = useCallback(async () => {
    try {
      const res = await api.getTop16Validators();
      if (res?.success && res.data) {
        if ((res as any).isFallback) {
          // Guard: Preserve active live on-chain state if already acquired
          setNposData((prev) => {
            const prevLiveCount = prev?.validators?.filter((v) => v.is_live_onchain).length || 0;
            const newLiveCount = res.data?.validators?.filter((v) => v.is_live_onchain).length || 0;
            if (prevLiveCount > 0 && newLiveCount < prevLiveCount) {
              return prev;
            }
            return res.data;
          });
        } else {
          setNposData(res.data);
        }
      }
    } catch (e) {
      console.warn('Staking fetch failed:', e);
    }
  }, []);

  const fetchShieldData = useCallback(async () => {
    try {
      const res = await api.getRpcShield();
      if (res?.success && res.data) {
        setShieldData(res.data);
      }
    } catch (e) {
      console.warn('Shield fetch failed:', e);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const logsRes = await api.getLogs();
      if (logsRes?.success && logsRes.logs) {
        setLogs((prev) => {
          // Preserve client-side CLI and diagnostic events along with server event stream
          const merged = [...prev, ...logsRes.logs].filter((l) => l.time > lastClearedTimeRef.current);
          const seen = new Set();
          return merged.filter((item) => {
            const key = `${Math.floor(item.time)}-${item.source}-${item.text}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }).sort((a, b) => a.time - b.time).slice(-100);
        });
      }
    } catch (e) {
      console.warn('Logs fetch failed:', e);
    }
  }, []);

  // On-demand Active Tab Dispatcher - Only fetch active view data to eliminate premature mockup data
  const fetchActiveTabData = useCallback(async (tab: TabType) => {
    setIsLoading(true);
    try {
      const tasks: Promise<any>[] = [fetchDualData()];
      if (tab === 'slashing') tasks.push(fetchSlashGuard());
      else if (tab === 'staking') tasks.push(fetchStakingData());
      else if (tab === 'shield') tasks.push(fetchShieldData());

      if (isTerminalOpen) tasks.push(fetchLogs());
      await Promise.allSettled(tasks);
    } finally {
      setIsLoading(false);
    }
  }, [fetchDualData, fetchSlashGuard, fetchStakingData, fetchShieldData, fetchLogs, isTerminalOpen]);

  // Tab switch on-demand trigger: fetch fresh data in background when switching tabs
  useEffect(() => {
    if (viewMode === 'console') {
      if (activeTab === 'slashing') {
        fetchSlashGuard();
      } else if (activeTab === 'staking') {
        fetchStakingData();
      } else if (activeTab === 'shield') {
        fetchShieldData();
      }
    }
  }, [activeTab, viewMode, fetchSlashGuard, fetchStakingData, fetchShieldData]);

  // Periodic polling tailored to the active tab
  useEffect(() => {
    fetchActiveTabData(activeTab);

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }
      fetchActiveTabData(activeTab);
    }, 12000);

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchActiveTabData(activeTab);
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [activeTab, fetchActiveTabData]);

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
              <DualEngineView data={dualData} onRefresh={fetchDualData} isLoading={isLoading} />
            )}
            {activeTab === 'slashing' && (
              secData ? (
                <SecurityGuardView data={secData} onRefresh={fetchSlashGuard} />
              ) : (
                <ViewLoadingFallback message="Querying Live SlashGuard Leases & Anti-Equivocation Locks..." />
              )
            )}
            {activeTab === 'staking' && (
              nposData ? (
                <StakingYieldView data={nposData} onRefresh={fetchStakingData} />
              ) : (
                <ViewLoadingFallback message="Querying Live Portaldot NPoS Validators & APY Matrix..." />
              )
            )}
            {activeTab === 'shield' && (
              shieldData ? (
                <TopologyRadarView data={shieldData} onRefresh={fetchShieldData} />
              ) : (
                <ViewLoadingFallback message="Querying Live RPC Shield Firewall & Topology Radar..." />
              )
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
                  bestBlock={dualData?.substrate?.best_block || 292900}
                />
              </ErrorBoundary>
            )}
          </React.Suspense>
        </main>
      </div>

      {/* Fixed Diagnostic Terminal Drawer with Multi-Source and Node Filtering */}
      <TerminalDrawer
        logs={logs}
        onClear={handleClearLogs}
        selectedNodeId={activeTab === 'canvas' ? selectedCanvasNodeId : null}
        onClearNodeFilter={() => setSelectedCanvasNodeId(null)}
        isOpen={isTerminalOpen}
        onToggleOpen={handleToggleTerminal}
        onExecuteCommand={handleExecuteCommand}
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
