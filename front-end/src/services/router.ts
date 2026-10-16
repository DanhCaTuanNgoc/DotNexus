import { TabType, ViewMode, storage } from './storage';

export interface RouteState {
  viewMode: ViewMode;
  activeTab: TabType;
}

export const VALID_TABS: readonly TabType[] = [
  'dual-vm',
  'slashing',
  'staking',
  'shield',
  'canvas'
] as const;

export function isValidTab(tab: string): tab is TabType {
  return (VALID_TABS as readonly string[]).includes(tab);
}

/**
 * Parse current browser URL (pathname and hash) into DotNexus RouteState
 */
export function parseCurrentRoute(): RouteState {
  if (typeof window === 'undefined') {
    return { viewMode: 'landing', activeTab: 'dual-vm' };
  }

  const rawPath = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
  const rawHash = window.location.hash.toLowerCase().replace(/^#\/?/, '');

  // 1. Check if hash specifies a route (e.g. #/slashing or #canvas)
  if (rawHash) {
    const hashSegments = rawHash.split('/');
    const lastHashSegment = hashSegments[hashSegments.length - 1];
    if (isValidTab(lastHashSegment)) {
      return { viewMode: 'console', activeTab: lastHashSegment };
    }
  }

  // 2. Check pathname segments
  if (!rawPath || rawPath === '') {
    // Root URL always renders the Landing Page
    return { viewMode: 'landing', activeTab: storage.getActiveTab('dual-vm') };
  }

  const segments = rawPath.split('/');
  const lastSegment = segments[segments.length - 1];

  // Direct tab path (e.g., /slashing, /dual-vm, /canvas)
  if (isValidTab(lastSegment)) {
    return { viewMode: 'console', activeTab: lastSegment };
  }

  // Generic console prefixes (/app, /control, /console) without specific tab
  if (segments[0] === 'app' || segments[0] === 'control' || segments[0] === 'console') {
    if (segments.length > 1 && isValidTab(segments[1])) {
      return { viewMode: 'console', activeTab: segments[1] as TabType };
    }
    // Default to stored active tab or dual-vm
    return { viewMode: 'console', activeTab: storage.getActiveTab('dual-vm') };
  }

  // Default fallback for any unrecognised root path
  return { viewMode: 'landing', activeTab: 'dual-vm' };
}

/**
 * Build canonical URL string from viewMode and activeTab
 */
export function getRouteUrl(viewMode: ViewMode, activeTab: TabType): string {
  if (viewMode === 'landing') {
    return '/';
  }
  return `/${activeTab}`;
}

/**
 * Navigate to a new route state, updating window.history and local storage
 */
export function navigateTo(
  viewMode: ViewMode,
  activeTab?: TabType,
  replace: boolean = false
): void {
  if (typeof window === 'undefined') return;

  const currentTab = activeTab || storage.getActiveTab('dual-vm');
  const targetUrl = getRouteUrl(viewMode, currentTab);

  // Sync to localStorage
  storage.setViewMode(viewMode);
  if (activeTab) {
    storage.setActiveTab(activeTab);
  }

  // Only push state if URL is actually changing
  const currentPath = window.location.pathname;
  if (currentPath !== targetUrl) {
    if (replace) {
      window.history.replaceState({ viewMode, activeTab: currentTab }, '', targetUrl);
    } else {
      window.history.pushState({ viewMode, activeTab: currentTab }, '', targetUrl);
    }
  }

  // Dispatch custom popstate-like event so all subscribers can update state synchronously
  window.dispatchEvent(new CustomEvent('dotnexus:routechange', {
    detail: { viewMode, activeTab: currentTab }
  }));
}
