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
  circuit_breaker?: {
    enabled: boolean;
    status: 'ARMED' | 'TRIPPED' | 'BYPASSED';
    auto_gate_threshold_blocks: number;
    protected_traffic_routes: string[];
    last_remediation?: any;
  };
  hardware?: {
    cpu_percent: number;
    ram_percent: number;
    ram_used_mb: number;
    ram_total_mb: number;
    disk_percent: number;
    disk_free_gb: number;
    disk_total_gb: number;
    db_size_mb: number;
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    disk_read_count: number;
    disk_write_count: number;
  };
  ecosystem_pulse?: {
    track_1_middleware: {
      label: string;
      status: string;
      rpc_shield_mode: string;
      fc_db_latency_ms: number;
      throughput_qps: number;
    };
    track_2_cross_chain: {
      label: string;
      status: string;
      babe_slot_duration_sec: number;
      grandpa_finality_lag: number;
      causal_lag_index: number;
    };
    track_3_node_ops: {
      label: string;
      status: string;
      active_authority: string;
      equivocation_guard: string;
      connected_peers: number;
    };
    track_4_ecosystem_dapps: {
      label: string;
      status: string;
      base_fee_gwei: number;
      storage_deposit_rate: string;
      pallet_revive_ready: boolean;
    };
  };
}

export interface ContractAuditResult {
  contract_name: string;
  source_file: string;
  bytecode_size_bytes: number;
  storage_deposit_rate_pot_per_byte: number;
  estimated_storage_deposit_pot: number;
  estimated_storage_deposit_wei: string;
  mainnet_v3_checklist: {
    pallet_revive_compatible: boolean;
    custom_errors_gas_lean: boolean;
    decimals_14_to_18_normalized: boolean;
    compiler_target_shanghai: boolean;
    via_ir_optimizer_enabled: boolean;
    zero_unbounded_storage_slots: boolean;
  };
  suitability_score_pct: number;
  status: string;
  recommendation: string;
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
    is_live_onchain?: boolean;
    source?: string;
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

export interface OnchainDispatchResult {
  is_success: boolean;
  tx_hash: string;
  block_hash?: string;
  signer_address?: string;
  targets?: string[];
  bonded_action?: string;
  amount_pot?: number;
  events?: string[];
  error_message?: string | null;
  active_era?: number;
  next_active_era?: number;
  is_live_chain?: boolean;
  network?: string;
  timestamp?: number;
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
  sybil_analysis?: {
    total_peers_evaluated: number;
    unique_subnets_count: number;
    max_subnet_concentration_pct: number;
    dominant_subnet: string | null;
    is_sybil_cluster_detected: boolean;
    eclipse_threat_level: 'CRITICAL_ECLIPSE_RISK' | 'LOW_NOMINAL';
    mitigation_rule: string;
  };
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
  remediateDualEngine: async (action: string, details?: any): Promise<{ success: boolean; data: any }> => {
    const res = await fetch(`${BASE_URL}/dual-tracker/remediate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, details })
    });
    return res.json();
  },
  toggleCircuitBreaker: async (enabled?: boolean): Promise<{ success: boolean; data: any }> => {
    const res = await fetch(`${BASE_URL}/dual-tracker/circuit-breaker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    return res.json();
  },
  auditContractMainnet: async (contractName?: string, customCode?: string): Promise<{ success: boolean; data: ContractAuditResult }> => {
    const res = await fetch(`${BASE_URL}/dual-tracker/contract-audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contract_name: contractName, custom_code: customCode })
    });
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
  dispatchNominateOnchain: async (
    targets: string[],
    signerKey: string = '//Alice',
    bondPot: number = 0
  ): Promise<{ success: boolean; data?: OnchainDispatchResult; error?: string }> => {
    const res = await fetch(`${BASE_URL}/npos/dispatch-nominate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targets, signer_key: signerKey, bond_pot: bondPot })
    });
    return res.json();
  },
  dispatchBondExtraOnchain: async (
    amountPot: number = 1.0,
    signerKey: string = '//Alice'
  ): Promise<{ success: boolean; data?: OnchainDispatchResult; error?: string }> => {
    const res = await fetch(`${BASE_URL}/npos/bond-extra`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount_pot: amountPot, signer_key: signerKey })
    });
    return res.json();
  },
  getUnbondingQueue: async (account?: string): Promise<{ success: boolean; data: any }> => {
    const url = account ? `${BASE_URL}/npos/unbonding-queue?account=${encodeURIComponent(account)}` : `${BASE_URL}/npos/unbonding-queue`;
    const res = await fetch(url);
    return res.json();
  },
  getKeeperStatus: async (): Promise<{ success: boolean; data: any }> => {
    const res = await fetch(`${BASE_URL}/npos/keeper-status`);
    return res.json();
  },
  triggerKeeperRun: async (force: boolean = false): Promise<{ success: boolean; data: any }> => {
    const res = await fetch(`${BASE_URL}/npos/keeper-run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force })
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
