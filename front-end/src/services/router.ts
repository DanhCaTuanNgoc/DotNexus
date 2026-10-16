import { TabType, ViewMode, storage } from './storage';

export interface RouteState {
  viewMode: ViewMode;
  activeTab: TabType;
  subRoute?: string;
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
    if (isValidTab(hashSegments[0])) {
      return { 
        viewMode: 'console', 
        activeTab: hashSegments[0] as TabType,
        subRoute: hashSegments[1]
      };
    }
  }

  // 2. Check pathname segments
  if (!rawPath || rawPath === '') {
    // Root URL always renders the Landing Page
    return { viewMode: 'landing', activeTab: storage.getActiveTab('dual-vm') };
  }

  const segments = rawPath.split('/');

  // Primary tab matching
  if (isValidTab(segments[0])) {
    return { 
      viewMode: 'console', 
      activeTab: segments[0] as TabType,
      subRoute: segments[1]
    };
  }

  // Generic console prefixes (/app, /control, /console)
  if (segments[0] === 'app' || segments[0] === 'control' || segments[0] === 'console') {
    if (segments.length > 1 && isValidTab(segments[1])) {
      return { 
        viewMode: 'console', 
        activeTab: segments[1] as TabType,
        subRoute: segments[2]
      };
    }
    return { viewMode: 'console', activeTab: storage.getActiveTab('dual-vm') };
  }

  // Default fallback for any unrecognised root path
  return { viewMode: 'landing', activeTab: 'dual-vm' };
}

/**
 * Build canonical URL string from viewMode, activeTab and optional subRoute
 */
export function getRouteUrl(viewMode: ViewMode, activeTab: TabType, subRoute?: string): string {
  if (viewMode === 'landing') {
    return '/';
  }
  if (subRoute) {
    return `/${activeTab}/${subRoute}`;
  }
  return `/${activeTab}`;
}

/**
 * Navigate to a new route state, updating window.history and local storage
 */
export function navigateTo(
  viewMode: ViewMode,
  activeTab?: TabType,
  subRoute?: string,
  replace: boolean = false
): void {
  if (typeof window === 'undefined') return;

  const currentTab = activeTab || storage.getActiveTab('dual-vm');
  const targetUrl = getRouteUrl(viewMode, currentTab, subRoute);

  // Sync to localStorage
  storage.setViewMode(viewMode);
  if (activeTab) {
    storage.setActiveTab(activeTab);
  }

  // Only push state if URL is actually changing
  const currentPath = window.location.pathname;
  if (currentPath !== targetUrl) {
    if (replace) {
      window.history.replaceState({ viewMode, activeTab: currentTab, subRoute }, '', targetUrl);
    } else {
      window.history.pushState({ viewMode, activeTab: currentTab, subRoute }, '', targetUrl);
    }
  }

  // Dispatch custom routechange event
  window.dispatchEvent(new CustomEvent('dotnexus:routechange', {
    detail: { viewMode, activeTab: currentTab, subRoute }
  }));
}
