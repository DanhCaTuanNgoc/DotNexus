import { CanvasEdge, CanvasNode, CanvasWorkflow, FlowHandleId, NodeCategory, NodeTemplate } from './types';

export const NODE_WIDTH = 250;
export const NODE_HEIGHT = 150;

export const CATEGORY_THEMES: Record<
  NodeCategory,
  {
    border: string;
    text: string;
    bg: string;
    glow: string;
    badgeBg: string;
    dotColor: string;
  }
> = {
  INFRA: {
    border: 'border-[#6366F1]',
    text: 'text-[#818CF8]',
    bg: 'bg-[#12142E]',
    glow: '#6366F1',
    badgeBg: 'bg-[#181C3D] border-[#6366F1]/50 text-[#818CF8]',
    dotColor: '#6366F1',
  },
  WATCHER: {
    border: 'border-[#E6007A]',
    text: 'text-[#F472B6]',
    bg: 'bg-[#220B19]',
    glow: '#E6007A',
    badgeBg: 'bg-[#2E0B20] border-[#E6007A]/50 text-[#E6007A]',
    dotColor: '#E6007A',
  },
  SECURITY: {
    border: 'border-[#8B5CF6]',
    text: 'text-[#C084FC]',
    bg: 'bg-[#18102E]',
    glow: '#8B5CF6',
    badgeBg: 'bg-[#1F143D] border-[#8B5CF6]/50 text-[#C084FC]',
    dotColor: '#8B5CF6',
  },
  ACTION: {
    border: 'border-[#10B981]',
    text: 'text-[#34D399]',
    bg: 'bg-[#0A1F18]',
    glow: '#10B981',
    badgeBg: 'bg-[#0E2820] border-[#10B981]/50 text-[#10B981]',
    dotColor: '#10B981',
  },
  STAKING: {
    border: 'border-[#F59E0B]',
    text: 'text-[#FBBF24]',
    bg: 'bg-[#24180A]',
    glow: '#F59E0B',
    badgeBg: 'bg-[#311F0D] border-[#F59E0B]/50 text-[#F59E0B]',
    dotColor: '#F59E0B',
  },
  CHAOS: {
    border: 'border-[#EF4444]',
    text: 'text-[#F87171]',
    bg: 'bg-[#29080A]',
    glow: '#EF4444',
    badgeBg: 'bg-[#3B0C0F] border-[#EF4444]/50 text-[#EF4444]',
    dotColor: '#EF4444',
  },
  TREASURY: {
    border: 'border-[#06B6D4]',
    text: 'text-[#22D3EE]',
    bg: 'bg-[#082026]',
    glow: '#06B6D4',
    badgeBg: 'bg-[#0B2E37] border-[#06B6D4]/50 text-[#22D3EE]',
    dotColor: '#06B6D4',
  },
};

// 20 Specialized Node Templates for Portaldot V3.0
export const NODE_TEMPLATES: NodeTemplate[] = [
  // 1. INFRASTRUCTURE (4 Nodes)
  {
    kind: 'ws_substrate',
    category: 'INFRA',
    label: 'Substrate WS (:9944)',
    description: 'Connects to Substrate RPC, streams block height and WASM extrinsics.',
    iconName: 'Server',
    defaultConfig: { endpoint: 'ws://127.0.0.1:9944', timeout: '10s', role: 'WASM Runtime' },
  },
  {
    kind: 'evm_rpc',
    category: 'INFRA',
    label: 'EVM RPC (:8545)',
    description: 'Ethereum JSON-RPC interface for Solidity contracts and gas tracker.',
    iconName: 'Cpu',
    defaultConfig: { endpoint: 'http://127.0.0.1:8545', chainId: 420420777, role: 'EVM Dual-VM' },
  },
  {
    kind: 'standby_node',
    category: 'INFRA',
    label: 'Standby Backup Node',
    description: 'Defines warm/cold standby replica awaiting failover promote command.',
    iconName: 'RadioTower',
    defaultConfig: { standbyUrl: 'ws://127.0.0.1:9945', status: 'SYNCHRONIZING' },
  },
  {
    kind: 'p2p_sensor',
    category: 'INFRA',
    label: 'P2P Peer Sensor',
    description: 'Inspects active network peers, gossip latency, and topology anomalies.',
    iconName: 'Globe',
    defaultConfig: { minPeers: 12, maxLatencyMs: 150 },
  },

  // 2. DETECTION & WATCHERS (4 Nodes)
  {
    kind: 'heartbeat_daemon',
    category: 'WATCHER',
    label: 'Heartbeat imOnline Daemon',
    description: 'Tracks consecutive missed heartbeats on Portaldot session consensus.',
    iconName: 'Activity',
    defaultConfig: { missedThreshold: 2, checkInterval: '6s', metric: 'missed_blocks' },
  },
  {
    kind: 'desync_detector',
    category: 'WATCHER',
    label: 'Dual-VM Desync Detector',
    description: 'Evaluates block production divergence between Substrate and EVM.',
    iconName: 'Gauge',
    defaultConfig: { maxLagBlocks: 2, alertMode: 'STRICT_DESYNC' },
  },
  {
    kind: 'rpc_spam_filter',
    category: 'WATCHER',
    label: 'RPC Heavy Query Filter',
    description: 'Catches abusive eth_getLogs or unbounded historical block scans.',
    iconName: 'ShieldAlert',
    defaultConfig: { maxBlockSpan: 2000, rateLimitPerMin: 60 },
  },
  {
    kind: 'era_scanner',
    category: 'WATCHER',
    label: 'NPoS Era Scanner',
    description: 'Triggers on era transition (every 6h) to evaluate validator performance.',
    iconName: 'Clock',
    defaultConfig: { intervalEra: '6h', autoTrigger: true },
  },

  // 3. SECURITY & GUARDS (3 Nodes)
  {
    kind: 'mutex_lock',
    category: 'SECURITY',
    label: 'Anti-Equivocation Lock',
    description: 'Strict atomic signing lease preventing double-signing Slashing.',
    iconName: 'Lock',
    defaultConfig: { leaseTimeout: '30s', checkType: 'Strict Mutex', safeMode: true },
  },
  {
    kind: 'rpc_rate_limiter',
    category: 'SECURITY',
    label: 'RPC Shield Rate-Limiter',
    description: 'Applies dynamic temporary IP bans (60s) on malicious DApp callers.',
    iconName: 'Shield',
    defaultConfig: { banDurationSec: 60, burstTolerance: 15 },
  },
  {
    kind: 'safe_gate',
    category: 'SECURITY',
    label: 'Safe Write Confirm Gate',
    description: 'Requires explicit operator manual approval before executing on-chain writes.',
    iconName: 'ShieldCheck',
    defaultConfig: { requireAuth: true, auditLog: true },
  },

  // 4. ACTION & FAILOVER (5 Nodes)
  {
    kind: 'rotate_keys',
    category: 'ACTION',
    label: 'Rotate Session Keys',
    description: 'Invokes author_rotateKeys RPC to generate and prepare new keys.',
    iconName: 'Key',
    defaultConfig: { rpcTarget: 'ws://127.0.0.1:9944', autoInject: false },
  },
  {
    kind: 'promote_standby',
    category: 'ACTION',
    label: 'Promote Standby Node',
    description: 'Transfers active validator signing lease to the standby IP.',
    iconName: 'ArrowRightCircle',
    defaultConfig: { targetUrl: 'ws://127.0.0.1:9945', revokePrimary: true },
  },
  {
    kind: 'emergency_chill',
    category: 'ACTION',
    label: 'Emergency Validator Chill',
    description: 'Broadcasts staking.chill extrinsic to step down from active set safely.',
    iconName: 'AlertOctagon',
    defaultConfig: { reason: 'Severe hardware fault', unstakeWait: '28 eras' },
  },
  {
    kind: 'discord_alert',
    category: 'ACTION',
    label: 'Discord / Ops Alert Bot',
    description: 'Dispatches high-priority incident webhook alert to Discord or Telegram.',
    iconName: 'Bell',
    defaultConfig: { channel: '#ops-alerts', level: 'P1_CRITICAL' },
  },
  {
    kind: 'flush_mempool',
    category: 'ACTION',
    label: 'Drain & Flush Mempool',
    description: 'Purges stalled pending transactions with stale nonces.',
    iconName: 'RefreshCw',
    defaultConfig: { purgeSubstrate: true, purgeEvm: true },
  },

  // 5. YIELD & WORKFLOW (4 Nodes)
  {
    kind: 'top_16_filter',
    category: 'STAKING',
    label: 'Top 16 Validator Filter',
    description: 'Filters optimal validators: high uptime, low commission, unfilled cap.',
    iconName: 'TrendingUp',
    defaultConfig: { maxCommissionPct: 5, minUptimePct: 99.5 },
  },
  {
    kind: 'compound_yield',
    category: 'STAKING',
    label: 'Auto-Bond & Compound POT',
    description: 'Executes staking.bondExtra to compound earned staking rewards.',
    iconName: 'Zap',
    defaultConfig: { extrinsic: 'staking.bondExtra', minRewardThreshold: 50 },
  },
  {
    kind: 'export_cli',
    category: 'STAKING',
    label: 'Export Runbook CLI Script',
    description: 'Compiles active DAG graph into standalone Python CLI script.',
    iconName: 'FileCode2',
    defaultConfig: { format: 'python_standalone', includeSchedule: true },
  },
  {
    kind: 'incident_report',
    category: 'STAKING',
    label: 'Incident Report Generator',
    description: 'Generates immutable Markdown/JSON post-mortem report.',
    iconName: 'FileText',
    defaultConfig: { format: 'markdown', signDigest: true },
  },
  // 6. CHAOS / FAULT INJECTOR (3 Nodes)
  {
    kind: 'chaos_evm_lag',
    category: 'CHAOS',
    label: 'Inject EVM Lag (+5 Blocks)',
    description: 'Injects simulated latency into :8545 stream to evaluate Causal Lag Index response.',
    iconName: 'AlertTriangle',
    defaultConfig: { lagBlocks: 5, targetEngine: 'EVM:8545', autoRevertSec: 30 },
  },
  {
    kind: 'chaos_rpc_ddos',
    category: 'CHAOS',
    label: 'Simulate RPC DDoS (eth_getLogs)',
    description: 'Generates abusive archival getLogs traffic to verify RPC Shield automated IP quarantine.',
    iconName: 'Flame',
    defaultConfig: { attackType: 'HEAVY_GETLOGS', burstVolume: 500, banDurationSec: 60 },
  },
  {
    kind: 'chaos_heartbeat_cut',
    category: 'CHAOS',
    label: 'Cut Heartbeat (Network Partition)',
    description: 'Severs Primary heartbeat connection to trigger Dead Mans Switch self-fencing.',
    iconName: 'ZapOff',
    defaultConfig: { partitionDurationSec: 15, triggerSelfFence: true },
  },
];

// Port calculation & Bezier curve algorithms
export function calculateBezierPath(
  source: { x: number; y: number } | undefined | null,
  target: { x: number; y: number } | undefined | null,
  sourceHandle: FlowHandleId = 'right',
  targetHandle: FlowHandleId = 'left'
): string {
  const sx = Number.isFinite(source?.x) ? source!.x : 0;
  const sy = Number.isFinite(source?.y) ? source!.y : 0;
  const tx = Number.isFinite(target?.x) ? target!.x : 0;
  const ty = Number.isFinite(target?.y) ? target!.y : 0;

  const distance = Math.hypot(tx - sx, ty - sy);
  const curvature = Number.isFinite(distance) ? Math.min(180, Math.max(44, distance * 0.35)) : 50;

  const getVector = (handle: FlowHandleId) => {
    switch (handle) {
      case 'left':
        return { x: -1, y: 0 };
      case 'right':
        return { x: 1, y: 0 };
      case 'top':
        return { x: 0, y: -1 };
      case 'bottom':
        return { x: 0, y: 1 };
      default:
        return { x: 1, y: 0 };
    }
  };

  const sVec = getVector(sourceHandle);
  const tVec = getVector(targetHandle);

  const cp1 = { x: sx + sVec.x * curvature, y: sy + sVec.y * curvature };
  const cp2 = { x: tx + tVec.x * curvature, y: ty + tVec.y * curvature };

  return `M ${sx} ${sy} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${tx} ${ty}`;
}

export function getHandlePoint(
  position: { x: number; y: number } | undefined | null,
  handle: FlowHandleId,
  width = NODE_WIDTH,
  height = NODE_HEIGHT
): { x: number; y: number } {
  const posX = Number.isFinite(position?.x) ? position!.x : 0;
  const posY = Number.isFinite(position?.y) ? position!.y : 0;
  const w = Number.isFinite(width) ? width : NODE_WIDTH;
  const h = Number.isFinite(height) ? height : NODE_HEIGHT;

  switch (handle) {
    case 'left':
      return { x: posX, y: posY + h / 2 };
    case 'right':
      return { x: posX + w, y: posY + h / 2 };
    case 'top':
      return { x: posX + w / 2, y: posY };
    case 'bottom':
      return { x: posX + w / 2, y: posY + h };
    default:
      return { x: posX + w, y: posY + h / 2 };
  }
}

// Pre-configured Default Operational Runbooks
export const DEFAULT_RUNBOOKS = [
  {
    id: 'runbook-slash-guard',
    name: 'Automated Slashing Guard & Standby Failover',
    description: 'Monitors pallet_im_online heartbeat and safely switches to standby node without double-signing.',
    category: 'SECURITY',
    nodes: [
      {
        id: 'n1',
        type: 'watcher',
        label: 'Heartbeat Daemon (:9944)',
        position: { x: 50, y: 120 },
        data: { metric: 'missed_blocks', condition: '>= 2', status: 'ACTIVE' },
      },
      {
        id: 'n2',
        type: 'security',
        label: 'Anti-Equivocation Lock',
        position: { x: 350, y: 120 },
        data: { lease_timeout: '30s', check: 'Strict Mutex', status: 'LOCKED' },
      },
      {
        id: 'n3',
        type: 'action',
        label: 'Activate Standby Node IP',
        position: { x: 650, y: 120 },
        data: { standby_url: 'ws://127.0.0.1:9945', action: 'promote_primary', status: 'READY' },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'n1', target: 'n2', animated: true, label: 'Missing Ping >= 2' },
      { id: 'e2-3', source: 'n2', target: 'n3', animated: true, label: 'Revoke Old & Promote' },
    ],
  },
  {
    id: 'runbook-dual-vm-sync',
    name: 'Dual-VM Parity Watcher & Desync Alert',
    description: 'Correlates Substrate WASM block production with EVM JSON-RPC height.',
    category: 'TELEMETRY',
    nodes: [
      {
        id: 'n-sub',
        type: 'infra',
        label: 'Substrate WS (:9944)',
        position: { x: 50, y: 60 },
        data: { engine: 'WASM / ink!', port: 9944, status: 'STREAMING' },
      },
      {
        id: 'n-evm',
        type: 'infra',
        label: 'EVM RPC (:8545)',
        position: { x: 50, y: 220 },
        data: { engine: 'Solidity EVM', port: 8545, status: 'STREAMING' },
      },
      {
        id: 'n-sync',
        type: 'watcher',
        label: 'Dual-VM Desync Detector',
        position: { x: 350, y: 140 },
        data: { max_lag: 2, metric: 'Delta Blocks', status: 'EVALUATING' },
      },
      {
        id: 'n-alert',
        type: 'action',
        label: 'Urgent Discord / Ops Alert',
        position: { x: 650, y: 140 },
        data: { channel: '#ops-alerts', webhook: 'configured', status: 'STANDBY' },
      },
    ],
    edges: [
      { id: 'e-sub-sync', source: 'n-sub', target: 'n-sync', animated: true },
      { id: 'e-evm-sync', source: 'n-evm', target: 'n-sync', animated: true },
      { id: 'e-sync-alert', source: 'n-sync', target: 'n-alert', animated: true, label: 'Delta > 2 Blocks' },
    ],
  },
  {
    id: 'runbook-npos-compound',
    name: 'NPoS Auto-Compounding & Yield Optimizer',
    description: 'Scans active validators, weeds out oversubscribed pools, and auto-bonds yield.',
    category: 'STAKING',
    nodes: [
      {
        id: 'n-era',
        type: 'watcher',
        label: 'NPoS Era Scanner',
        position: { x: 50, y: 120 },
        data: { frequency: 'Every Era (6h)', status: 'WATCHING' },
      },
      {
        id: 'n-filter',
        type: 'action',
        label: 'Top 16 Optimizer Filter',
        position: { x: 350, y: 120 },
        data: { criteria: 'Uptime + Low Comm + Capacity', status: 'READY' },
      },
      {
        id: 'n-bond',
        type: 'action',
        label: 'Auto-Bond & Compound POT',
        position: { x: 650, y: 120 },
        data: { extrinsic: 'staking.bondExtra', boost: '+1.16% APY', status: 'ARMED' },
      },
    ],
    edges: [
      { id: 'e-era-filter', source: 'n-era', target: 'n-filter', animated: true, label: 'Era Finalized' },
      { id: 'e-filter-bond', source: 'n-filter', target: 'n-bond', animated: true, label: 'Top 16 Selected' },
    ],
  },
  {
    id: 'runbook-health-bot',
    name: '24/7 Node Health Monitor & Telegram/Discord Bot',
    description: 'Continuously monitors node health, Substrate/EVM sync, and broadcasts real-time telemetry signals to Discord / Telegram.',
    category: 'TELEMETRY',
    nodes: [
      {
        id: 'hb-1',
        type: 'infra',
        label: 'Substrate WS (:9944)',
        position: { x: 50, y: 70 },
        data: { endpoint: 'ws://127.0.0.1:9944', role: 'WASM Runtime', status: 'STREAMING' },
      },
      {
        id: 'hb-2',
        type: 'watcher',
        label: 'Heartbeat imOnline Daemon',
        position: { x: 350, y: 70 },
        data: { interval: '10s', metric: 'missed_blocks', condition: 'status == OK', status: 'ACTIVE' },
      },
      {
        id: 'hb-3',
        type: 'watcher',
        label: 'Log Anomaly Filter',
        position: { x: 350, y: 240 },
        data: { pattern: 'WARN|ERR|CRITICAL', bufferSize: 100, status: 'WATCHING' },
      },
      {
        id: 'hb-4',
        type: 'action',
        label: 'Discord / Telegram Alert Bot',
        position: { x: 670, y: 150 },
        data: {
          channel: '#validator-telemetry',
          botMode: '24/7 Continuous Signal',
          telegramChatId: '@PortaldotOpsBot',
          status: 'ARMED',
        },
      },
    ],
    edges: [
      { id: 'ehb-1-2', source: 'hb-1', target: 'hb-2', animated: true, label: 'Feed Block Stream' },
      { id: 'ehb-2-4', source: 'hb-2', target: 'hb-4', animated: true, label: 'Health Signal (Heartbeat OK)' },
      { id: 'ehb-3-4', source: 'hb-3', target: 'hb-4', animated: true, label: 'Critical Log Alert' },
    ],
  },
  {
    id: 'runbook-rpc-shield',
    name: 'RPC Anti-Spam Sentry & Malicious IP Defense',
    description: 'Analyzes incoming JSON-RPC traffic, blocks heavy span log queries, and issues 60s temporary dynamic IP bans.',
    category: 'SECURITY',
    nodes: [
      {
        id: 'rpc-1',
        type: 'infra',
        label: 'EVM RPC (:8545)',
        position: { x: 50, y: 120 },
        data: { endpoint: 'http://127.0.0.1:8545', chainId: 420420777, status: 'STREAMING' },
      },
      {
        id: 'rpc-2',
        type: 'security',
        label: 'RPC Shield Rate-Limiter',
        position: { x: 350, y: 120 },
        data: { banDurationSec: 60, burstTolerance: 15, maxSpan: 2000, status: 'FILTERING' },
      },
      {
        id: 'rpc-3',
        type: 'action',
        label: 'Discord / Ops Alert Bot',
        position: { x: 660, y: 120 },
        data: { channel: '#security-sentry', level: 'P2_WARNING', status: 'ARMED' },
      },
    ],
    edges: [
      { id: 'erpc-1-2', source: 'rpc-1', target: 'rpc-2', animated: true, label: 'Ingest eth_getLogs' },
      { id: 'erpc-2-3', source: 'rpc-2', target: 'rpc-3', animated: true, label: 'Trigger on Span > 2000' },
    ],
  },
  {
    id: 'runbook-chaos-fire-drill',
    name: 'Chaos Engineering: Validator Network Partition Fire Drill',
    description: 'Incident fire drill: Severs Primary connection, verifies Dead Mans Switch self-fencing, and tests automated Standby takeover.',
    category: 'SECURITY',
    nodes: [
      {
        id: 'n-chaos-cut',
        type: 'chaos',
        label: 'Cut Heartbeat (Network Partition)',
        position: { x: 50, y: 150 },
        data: { partitionDurationSec: 15, triggerSelfFence: true, status: 'TRIGGERED' }
      },
      {
        id: 'n-fence-guard',
        type: 'security',
        label: 'Anti-Equivocation Lock',
        position: { x: 380, y: 150 },
        data: { lease_timeout: '12s', check: 'Strict Mutex', status: 'SELF_FENCED' }
      },
      {
        id: 'n-standby-takeover',
        type: 'action',
        label: 'Promote Standby Node',
        position: { x: 720, y: 150 },
        data: { standby_url: 'ws://127.0.0.1:9945', action: 'promote_primary', status: 'ACTIVE' }
      }
    ],
    edges: [
      { id: 'e-chaos-fence', source: 'n-chaos-cut', target: 'n-fence-guard', animated: true, label: 'Missing Ping > 10s' },
      { id: 'e-fence-takeover', source: 'n-fence-guard', target: 'n-standby-takeover', animated: true, label: 'Safe Epoch Takeover' }
    ]
  },
  {
    id: 'runbook-treasury-sweep',
    name: 'Treasury & Staking Era Payout Safeguard Sweep',
    description: 'Inspects 84-era historical reward window, detects uncollected staking payouts, and dispatches batch payoutStakersByPage transactions before permanent burn.',
    category: 'TREASURY',
    nodes: [
      {
        id: 'n-payout-scan',
        type: 'watcher',
        label: '84-Era Historical Window Scanner',
        position: { x: 50, y: 140 },
        data: { window_eras: 84, target_pallet: 'Staking.ClaimedRewards', status: 'SCANNING' }
      },
      {
        id: 'n-payout-eval',
        type: 'security',
        label: 'Expiry & Burn Invariant Guard',
        position: { x: 380, y: 140 },
        data: { burn_threshold: '84 eras', check: 'Era Gap <= 84', status: 'VERIFIED' }
      },
      {
        id: 'n-payout-dispatch',
        type: 'action',
        label: 'Dispatch payoutStakersByPage Batch',
        position: { x: 720, y: 140 },
        data: { method: 'staking.payoutStakersByPage', page: 0, status: 'READY' }
      }
    ],
    edges: [
      { id: 'e-scan-eval', source: 'n-payout-scan', target: 'n-payout-eval', animated: true, label: 'Unclaimed Eras Detected' },
      { id: 'e-eval-dispatch', source: 'n-payout-eval', target: 'n-payout-dispatch', animated: true, label: 'Batch Extrinsic Dispatched' }
    ]
  }
];


/**
 * Convert a preset Runbook into a structured CanvasWorkflow
 */
export function convertRunbookToWorkflow(rb: any): CanvasWorkflow {
  const convertedNodes: CanvasNode[] = (rb.nodes || []).map((n: any, idx: number) => {
    let cat: NodeCategory = 'INFRA';
    const t = (n.type || '').toLowerCase();
    const labelLower = (n.label || '').toLowerCase();

    if (
      t.includes('watch') || 
      labelLower.includes('heartbeat') || 
      labelLower.includes('scanner') || 
      labelLower.includes('detector') || 
      labelLower.includes('filter')
    ) {
      cat = 'WATCHER';
    } else if (
      t.includes('sec') || 
      t.includes('mutex') || 
      t.includes('lock') || 
      labelLower.includes('mutex') || 
      labelLower.includes('equivocation') || 
      labelLower.includes('shield') || 
      labelLower.includes('rate-limit')
    ) {
      cat = 'SECURITY';
    } else if (
      t.includes('stak') || 
      t.includes('yield') || 
      t.includes('bond') || 
      labelLower.includes('compound') || 
      labelLower.includes('top 16')
    ) {
      cat = 'STAKING';
    } else if (
      t.includes('chaos') ||
      labelLower.includes('chaos') ||
      labelLower.includes('cut') ||
      labelLower.includes('ddos') ||
      labelLower.includes('inject')
    ) {
      cat = 'CHAOS';
    } else if (
      t.includes('treasury') ||
      labelLower.includes('treasury') ||
      labelLower.includes('payout')
    ) {
      cat = 'TREASURY';
    } else if (
      t.includes('action') || 
      t.includes('promot') || 
      t.includes('alert') || 
      labelLower.includes('standby') || 
      labelLower.includes('bot')
    ) {
      cat = 'ACTION';
    }

    let matchedKind = n.id;
    if (labelLower.includes('heartbeat') && !labelLower.includes('cut')) matchedKind = 'heartbeat_daemon';
    else if (labelLower.includes('cut') || labelLower.includes('partition')) matchedKind = 'chaos_heartbeat_cut';
    else if (labelLower.includes('ddos')) matchedKind = 'chaos_rpc_ddos';
    else if (labelLower.includes('inject') || (labelLower.includes('lag') && !labelLower.includes('desync'))) matchedKind = 'chaos_evm_lag';
    else if (labelLower.includes('mutex') || labelLower.includes('equivocation')) matchedKind = 'mutex_lock';
    else if (labelLower.includes('standby')) matchedKind = 'promote_standby';
    else if (labelLower.includes('substrate')) matchedKind = 'ws_substrate';
    else if (labelLower.includes('evm')) matchedKind = 'evm_rpc';
    else if (labelLower.includes('desync')) matchedKind = 'desync_detector';
    else if (labelLower.includes('alert') || labelLower.includes('bot')) matchedKind = 'discord_alert';
    else if (labelLower.includes('era')) matchedKind = 'era_scanner';
    else if (labelLower.includes('top 16') || labelLower.includes('optimizer')) matchedKind = 'top_16_filter';
    else if (labelLower.includes('compound') || labelLower.includes('bond')) matchedKind = 'compound_yield';
    else if (labelLower.includes('shield') || labelLower.includes('rate-limit')) matchedKind = 'rpc_rate_limiter';

    const posX = Number.isFinite(n?.position?.x) ? n.position.x : 80 + idx * 300;
    const posY = Number.isFinite(n?.position?.y) ? n.position.y : 160;

    return {
      id: n.id,
      type: n.type || 'infra',
      position: { x: posX, y: posY },
      data: {
        kind: matchedKind,
        category: cat,
        label: n.label,
        description: `Configured operational step: ${n.label}`,
        status: 'idle',
        config: { ...(n.data || {}) },
      },
    };
  });

  const convertedEdges: CanvasEdge[] = (rb.edges || []).map((e: any) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle || 'right',
    targetHandle: e.targetHandle || 'left',
    animated: e.animated !== false,
    label: e.label || 'Trigger Flow',
  }));

  return {
    id: rb.id,
    name: rb.name,
    description: rb.description || '',
    category: rb.category || 'CUSTOM',
    nodes: convertedNodes,
    edges: convertedEdges,
    viewport: { x: 30, y: 30, zoom: 0.88 },
    isCustom: false,
    status: rb.id === 'runbook-health-bot' ? 'ACTIVE' : 'ARMED',
    updatedAt: Date.now(),
  };
}
