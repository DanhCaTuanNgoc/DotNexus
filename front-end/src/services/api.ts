/**
 * DotNexus API Client Service
 * Bridges UI components with the backend Python engine.
 */

const BASE_URL = '/api';

export interface LogItem {
  source: string;
  level: string;
  time: number;
  text: string;
  nodeId?: string;
}

export interface DualTelemetryState {
  timestamp: number;
  substrate: {
    is_connected: boolean;
    is_live_chain: boolean;
    endpoint: string;
    best_block: number;
    finalized_block: number;
    finality_lag: number;
    latency_ms: number;
    pending_extrinsics: number;
    token_decimals: number;
    ss58_format: number;
    execution_engine: string;
  };
  evm: {
    is_connected: boolean;
    is_live_chain: boolean;
    endpoint: string;
    block_number: number;
    chain_id: number;
    gas_price_gwei: number;
    base_fee_gwei?: number;
    latency_ms: number;
    pending_transactions: number;
    execution_engine: string;
  };
  sync: {
    delta_blocks: number;
    status: 'SYNCED' | 'MINIMAL_LAG' | 'DESYNC_WARNING' | 'DESYNC_CRITICAL' | 'OFFLINE';
    severity: string;
    message: string;
    threshold: number;
    is_synced: boolean;
  };
  mempool: {
    total_pending: number;
    wasm_extrinsics: number;
    evm_transactions: number;
    wasm_ratio_pct: number;
    evm_ratio_pct: number;
  };
  root_cause_diagnosis?: {
    tier: number;
    root_cause_code: string;
    severity: string;
    message: string;
    recommended_action: string;
  };
  causal_lag_index?: {
    cli_score: number;
    raw_cli: number;
    classification: 'NOMINAL_PARITY' | 'FRONTIER_DB_LOCK' | 'EVM_GAS_SATURATION' | 'SUBSTRATE_P2P_STALL' | 'ELEVATED_SKEW';
    diagnosis_message: string;
    vector_breakdown: {
      block_lag_vector: number;
      mempool_skew_vector: number;
      latency_skew_vector: number;
      block_delta: number;
      evm_pending: number;
      wasm_pending: number;
      evm_latency_ms: number;
      wasm_latency_ms: number;
    };
    weights: {
      w1_block_lag: number;
      w2_mempool: number;
      w3_latency: number;
    };
  };
  decimal_normalization?: {
    substrate_balance_planck: string;
    evm_balance_wei: string;
    evm_balance_normalized_planck: string;
    is_parity_clean: boolean;
    token_decimals_substrate: number;
    token_decimals_evm: number;
    scale_factor: number;
    pot_readable: number;
  };
}

export interface SecurityDashboardState {
  active_node: 'PRIMARY' | 'STANDBY';
  primary_node_id: string;
  standby_node_id: string;
  primary_ip: string;
  standby_ip: string;
  missed_heartbeats: number;
  fencing_epoch?: number;
  dead_mans_switch?: {
    self_fence_timeout_s: number;
    lease_ttl_s: number;
    takeover_delay_s: number;
    invariant_satisfied: boolean;
  };
  equivocation_guard_active: boolean;
  lock_file_status: string;
  heartbeat: {
    slashing_risk: string;
    failover_triggered: boolean;
    pallet_im_online: {
      active_era: number;
      heartbeats_received: number;
      heartbeat_window_blocks: number;
      status: string;
    };
  };
  recent_rotations: Array<{
    rotation_id: string;
    timestamp: number;
    session_keys_hex: string;
    keys_struct_v14?: {
      babe: string;
      grandpa: string;
      im_online: string;
      authority_discovery: string;
    };
    effective_session?: string;
    status: string;
    extrinsic_call: string;
  }>;
  security_events: Array<{
    id: string;
    timestamp: number;
    level: string;
    title: string;
    message: string;
  }>;
}

export interface NPoSRecommendation {
  top_validators_count: number;
  target_count: number;
  average_nominal_apy: number;
  auto_compounded_apy: number;
  apy_boost_pct: number;
  targets: string[];
  election_algorithm?: string;
  pao_phragmen_active?: boolean;
  pao_algorithm_name?: string;
  validators: Array<{
    stash_address: string;
    identity: string;
    commission_pct: number;
    uptime_pct: number;
    total_stake_pot: number;
    nominator_count: number;
    max_nominators: number;
    slash_count: number;
    estimated_apy: number;
    health_score: number;
    recommendation: string;
    risk_warning?: string | null;
    pao_metrics?: {
      pao_score: number;
      safety_margin_mvu: number;
      safety_margin_rating: string;
      net_apy: number;
      margin_factor_tanh: number;
      is_rugpull_risk: boolean;
      rugpull_penalty: number;
      min_rewarded_stake_pot: number;
      median_stake_pot: number;
    };
  }>;
  extrinsic_call: string;
}

export interface ShieldStatus {
  total_inspected: number;
  total_allowed: number;
  total_blocked: number;
  total_throttled: number;
  average_overhead_ms?: number;
  active_banned_ips_count: number;
  max_block_range_setting: number;
  max_batch_size_setting?: number;
  rate_limit_per_minute_setting: number;
  recent_events: Array<{
    id: string;
    timestamp: number;
    client_ip: string;
    method: string;
    decision: 'ALLOWED' | 'BLOCKED' | 'THROTTLED';
    status_code: number;
    reason: string;
  }>;
  p2p_topology: Array<{
    peer_id: string;
    ip: string;
    location: string;
    client_version: string;
    protocol: string;
    latency_ms: number;
    role: string;
    status: string;
    is_malicious: boolean;
    anomaly?: string;
  }>;
}

export interface RunbookDAG {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    position: { x: number; y: number };
    data: Record<string, any>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    animated?: boolean;
    label?: string;
  }>;
}

export const api = {
  getStatus: async () => {
    const res = await fetch(`${BASE_URL}/status`);
    return res.json();
  },
  getDualTracker: async (): Promise<{ success: boolean; data: DualTelemetryState }> => {
    const res = await fetch(`${BASE_URL}/dual-tracker`);
    return res.json();
  },
  getSlashGuard: async (): Promise<{ success: boolean; data: SecurityDashboardState }> => {
    const res = await fetch(`${BASE_URL}/slash-guard`);
    return res.json();
  },
  rotateKeys: async () => {
    const res = await fetch(`${BASE_URL}/slash-guard/rotate-keys`, { method: 'POST' });
    return res.json();
  },
  triggerFailover: async (reason?: string) => {
    const res = await fetch(`${BASE_URL}/slash-guard/failover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason || 'Manual toggle from UI' })
    });
    return res.json();
  },
  simulateMissedHeartbeat: async () => {
    const res = await fetch(`${BASE_URL}/slash-guard/simulate-missed-heartbeat`, { method: 'POST' });
    return res.json();
  },
  getTop16Validators: async (): Promise<{ success: boolean; data: NPoSRecommendation }> => {
    const res = await fetch(`${BASE_URL}/npos/top-16`);
    return res.json();
  },
  rebalanceStake: async (stakeAmount: number) => {
    const res = await fetch(`${BASE_URL}/npos/rebalance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stake_pot: stakeAmount })
    });
    return res.json();
  },
  getRpcShield: async (): Promise<{ success: boolean; data: ShieldStatus }> => {
    const res = await fetch(`${BASE_URL}/rpc-shield`);
    return res.json();
  },
  simulateShieldAttack: async (type: 'HEAVY_GETLOGS' | 'RATE_LIMIT_BURST') => {
    const res = await fetch(`${BASE_URL}/rpc-shield/simulate-attack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    });
    return res.json();
  },
  getRunbooks: async (): Promise<{ success: boolean; data: RunbookDAG[] }> => {
    const res = await fetch(`${BASE_URL}/canvas/runbooks`);
    return res.json();
  },
  executeRunbook: async (runbookId: string) => {
    const res = await fetch(`${BASE_URL}/canvas/runbooks/${runbookId}/execute`, { method: 'POST' });
    return res.json();
  },
  getLogs: async () => {
    const res = await fetch(`${BASE_URL}/logs`);
    return res.json();
  }
};
