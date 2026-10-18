import { CanvasEdge, CanvasNode, CanvasViewport, CanvasWorkflow } from '../components/canvas/types';

export type ViewMode = 'landing' | 'console';
export type TabType = 'dual-vm' | 'slashing' | 'staking' | 'shield' | 'canvas';

export interface CanvasStorageState {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedRunbookId: string;
  viewport?: CanvasViewport;
  lastSavedAt: number;
}

const STORAGE_KEYS = {
  VIEW_MODE: 'dotnexus_view_mode',
  ACTIVE_TAB: 'dotnexus_active_tab',
  SIDEBAR_COLLAPSED: 'dotnexus_sidebar_collapsed',
  TERMINAL_OPEN: 'dotnexus_terminal_open',
  CANVAS_STATE: 'dotnexus_canvas_state',
  WORKFLOWS_LIST: 'dotnexus_workflows_list',
  ACTIVE_WORKFLOW_ID: 'dotnexus_active_workflow_id',
  STAKE_INPUT: 'dotnexus_stake_input',
  PALETTE_CATEGORY: 'dotnexus_palette_category',
  ONBOARDING_COMPLETED: 'dotnexus_onboarding_completed_v1',
} as const;

/**
 * Safely parse and retrieve an item from localStorage
 */
export function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultValue;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined) {
      return defaultValue;
    }
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[DotNexus Storage] Failed to parse key "${key}" from localStorage:`, err);
    return defaultValue;
  }
}

/**
 * Safely persist an item to localStorage
 */
export function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[DotNexus Storage] Failed to write key "${key}" to localStorage:`, err);
  }
}

/**
 * Remove an item from localStorage
 */
export function removeItem(key: string): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[DotNexus Storage] Failed to remove key "${key}" from localStorage:`, err);
  }
}

/**
 * High-level DotNexus Persistence Client
 */
export const storage = {
  // Navigation & Shell Layout
  getViewMode: (fallback: ViewMode = 'landing'): ViewMode =>
    getItem<ViewMode>(STORAGE_KEYS.VIEW_MODE, fallback),
  setViewMode: (mode: ViewMode) => setItem(STORAGE_KEYS.VIEW_MODE, mode),

  getActiveTab: (fallback: TabType = 'dual-vm'): TabType =>
    getItem<TabType>(STORAGE_KEYS.ACTIVE_TAB, fallback),
  setActiveTab: (tab: TabType) => setItem(STORAGE_KEYS.ACTIVE_TAB, tab),

  getSidebarCollapsed: (fallback: boolean = false): boolean =>
    getItem<boolean>(STORAGE_KEYS.SIDEBAR_COLLAPSED, fallback),
  setSidebarCollapsed: (collapsed: boolean) =>
    setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, collapsed),

  getTerminalOpen: (fallback: boolean = true): boolean =>
    getItem<boolean>(STORAGE_KEYS.TERMINAL_OPEN, fallback),
  setTerminalOpen: (open: boolean) => setItem(STORAGE_KEYS.TERMINAL_OPEN, open),

  // Visual DAG Automation Canvas (Single state compatibility & Multi-Canvas Workflows)
  getCanvasState: (): CanvasStorageState | null =>
    getItem<CanvasStorageState | null>(STORAGE_KEYS.CANVAS_STATE, null),
  setCanvasState: (state: CanvasStorageState) =>
    setItem(STORAGE_KEYS.CANVAS_STATE, state),
  clearCanvasState: () => removeItem(STORAGE_KEYS.CANVAS_STATE),

  getWorkflowsList: (): CanvasWorkflow[] | null =>
    getItem<CanvasWorkflow[] | null>(STORAGE_KEYS.WORKFLOWS_LIST, null),
  setWorkflowsList: (workflows: CanvasWorkflow[]) =>
    setItem(STORAGE_KEYS.WORKFLOWS_LIST, workflows),

  getActiveWorkflowId: (fallback: string = 'runbook-slash-guard'): string =>
    getItem<string>(STORAGE_KEYS.ACTIVE_WORKFLOW_ID, fallback),
  setActiveWorkflowId: (id: string) =>
    setItem(STORAGE_KEYS.ACTIVE_WORKFLOW_ID, id),

  // NPoS Staking Simulation Input
  getStakeInput: (fallback: number = 10000): number =>
    getItem<number>(STORAGE_KEYS.STAKE_INPUT, fallback),
  setStakeInput: (amount: number) => setItem(STORAGE_KEYS.STAKE_INPUT, amount),

  // Palette Filter Preference
  getPaletteCategory: (fallback: string = 'ALL'): string =>
    getItem<string>(STORAGE_KEYS.PALETTE_CATEGORY, fallback),
  setPaletteCategory: (category: string) =>
    setItem(STORAGE_KEYS.PALETTE_CATEGORY, category),

  // Flow Connect Mode (Wiring Pin Visibility)
  getFlowConnectMode: (fallback: boolean = false): boolean =>
    getItem<boolean>('dotnexus_flow_connect_mode', fallback),
  setFlowConnectMode: (enabled: boolean) =>
    setItem('dotnexus_flow_connect_mode', enabled),

  // Terminal Filter Preference
  getTerminalFilter: (fallback: string = 'ALL'): string =>
    getItem<string>('dotnexus_terminal_filter', fallback),
  setTerminalFilter: (filter: string) =>
    setItem('dotnexus_terminal_filter', filter),

  // Terminal Height Preference (Vertical Expand / Resizing)
  getTerminalHeight: (fallback: number = 160): number =>
    getItem<number>('dotnexus_terminal_height', fallback),
  setTerminalHeight: (height: number) =>
    setItem('dotnexus_terminal_height', height),

  // Guided Onboarding Tour Completion
  getOnboardingCompleted: (fallback: boolean = false): boolean =>
    getItem<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETED, fallback),
  setOnboardingCompleted: (completed: boolean) =>
    setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed),
};
