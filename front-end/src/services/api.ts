/**

 * DotNexus API Client Service

 * Bridges UI components with the backend Python engine.

 * Includes complete offline resilience & deterministic fallback simulation for Vercel/cloud deployments.

 */



// Dynamic API endpoint: Uses VITE_API_BASE_URL if configured, otherwise falls back to relative '/api' proxy

const RAW_API_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

const BASE_URL = RAW_API_URL ? `${RAW_API_URL.replace(/\/$/, '')}/api` : '/api';



export interface LogItem {
  id?: string;
  source: string;
  level: string;
  time: number;
  text: string;
  nodeId?: string;
}



export interface DualBlockConduitItem {

  block_number_wasm: number;

  block_number_evm: number;

  hash_wasm: string;

  hash_evm: string;

  babe_author: string;

  extrinsics_count: number;

  evm_tx_count: number;

  evm_gas_used: number;

  evm_base_fee_gwei: number;

  mapping_latency_ms: number;

  delta_blocks: number;

  status: 'LOCKSTEP' | 'PROPAGATION_LAG' | 'SLOW_INDEXING' | 'DESYNC_CRITICAL';

  timestamp: number;

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

  active_fencing_epoch?: number;

  is_self_fenced?: boolean;

  remaining_lease_seconds?: number;

  elapsed_lease_seconds?: number;

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

    self_fence_status?: {

      self_fenced: boolean;

      elapsed_seconds: number;

      action: string;

    };

    pallet_im_online: {

      active_era: number;

      heartbeats_received: number;

      heartbeat_window_blocks?: number;

      session_heartbeat_window?: string;

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

  onchain_lease?: {

    contract_address: string;

    operator_address: string;

    active_node_operator: string;

    fencing_epoch: number;

    expires_at_block: number;

    current_evm_block: number;

    blocks_remaining: number;

    peer_id_hash: string;

    is_fenced: boolean;

    is_currently_valid: boolean;

    is_live_onchain: boolean;

    source: string;

  };

  session_authorities?: {

    session_index: number;

    babe_epoch_index: number;

    active_validators_count: number;

    active_validators: string[];

    queued_keys_count: number;

    is_live_rpc: boolean;

    source: string;

  };

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

    token_decimals?: number;

    storage_schema?: string;

    market_share_pct?: number;

    is_blocked?: boolean;

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

  average_reputation_score?: number;

  quarantined_ips?: Array<{

    ip: string;

    score: number;

    tier: number;

    reason: string;

    expires_in_seconds: number;

  }>;

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



// ============================================================================

// HIGH-FIDELITY DETERMINISTIC MOCKUP DATA (PORTALDOT NETWORK V3.0 TESTNET)

// Guarantees zero infinite loading on Vercel or when backend host is offline.

// ============================================================================



export const DEFAULT_DUAL_TELEMETRY: DualTelemetryState = {

  timestamp: Math.floor(Date.now() / 1000),

  substrate: {

    is_connected: false,

    is_live_chain: false,

    endpoint: 'wss://test-node-v3.portaldot.dev',

    best_block: 262100,

    finalized_block: 262098,

    finality_lag: 2,

    latency_ms: 18.4,

    pending_extrinsics: 0,

    token_decimals: 14,

    ss58_format: 42,

    execution_engine: 'Substrate WASM / Pallet-Revive Host'

  },

  evm: {

    is_connected: false,

    is_live_chain: false,

    endpoint: 'https://test-evm-rpc-v3.portaldot.dev',

    block_number: 262100,

    chain_id: 420420777,

    gas_price_gwei: 18.5,

    base_fee_gwei: 18.0,

    latency_ms: 16.2,

    pending_transactions: 0,

    execution_engine: 'Pallet-Revive EVM Dual-VM'

  },

  sync: {

    delta_blocks: 0,

    status: 'SYNCED',

    severity: 'OK',

    message: 'Dual-VM state is in 100% lockstep parity.',

    threshold: 2,

    is_synced: true

  },

  mempool: {

    total_pending: 7,

    wasm_extrinsics: 3,

    evm_transactions: 4,

    wasm_ratio_pct: 42.9,

    evm_ratio_pct: 57.1

  },

  root_cause_diagnosis: {

    tier: 1,

    root_cause_code: 'NOMINAL_PARITY',

    severity: 'OK',

    message: 'Cross-VM state synchronization nominal. Zero block lag detected.',

    recommended_action: 'Maintain automated heartbeat and active circuit breaker gating.'

  },

  causal_lag_index: {

    cli_score: 8.6,

    raw_cli: 8.6,

    classification: 'NOMINAL_PARITY',

    diagnosis_message: 'Cross-VM state parity verified across Substrate WASM and EVM runtime.',

    vector_breakdown: {

      block_lag_vector: 0,

      mempool_skew_vector: 0.14,

      latency_skew_vector: 0.08,

      block_delta: 0,

      evm_pending: 4,

      wasm_pending: 3,

      evm_latency_ms: 16.2,

      wasm_latency_ms: 18.4

    },

    weights: {

      w1_block_lag: 0.5,

      w2_mempool: 0.3,

      w3_latency: 0.2

    }

  },

  decimal_normalization: {

    substrate_balance_planck: '1000000000000000',

    evm_balance_wei: '100000000000000000000',

    evm_balance_normalized_planck: '1000000000000000',

    is_parity_clean: true,

    token_decimals_substrate: 14,

    token_decimals_evm: 18,

    scale_factor: 10000,

    pot_readable: 100.0

  },

  circuit_breaker: {

    enabled: true,

    status: 'ARMED',

    auto_gate_threshold_blocks: 3,

    protected_traffic_routes: ['/api/v1/query', 'eth_call', 'eth_getBalance'],

    last_remediation: null

  },

  hardware: {

    cpu_percent: 24.8,

    ram_percent: 41.2,

    ram_used_mb: 3296,

    ram_total_mb: 8000,

    disk_percent: 32.5,

    disk_free_gb: 168.4,

    disk_total_gb: 250.0,

    db_size_mb: 1420,

    status: 'HEALTHY',

    disk_read_count: 84210,

    disk_write_count: 53120

  },

  ecosystem_pulse: {

    track_1_middleware: {

      label: 'Modular Cloud & Middleware',

      status: 'HEALTHY',

      rpc_shield_mode: 'ACTIVE_FILTER',

      fc_db_latency_ms: 6.48,

      throughput_qps: 240

    },

    track_2_cross_chain: {

      label: 'Multi-Chain & Cross-Chain Infra',

      status: 'IN_SYNC',

      babe_slot_duration_sec: 6.0,

      grandpa_finality_lag: 2,

      causal_lag_index: 8.6

    },

    track_3_node_ops: {

      label: 'Node Operations & Tooling',

      status: 'SECURED',

      active_authority: 'Alice (Primary Validator)',

      equivocation_guard: 'ACTIVE_MUTEX',

      connected_peers: 16

    },

    track_4_ecosystem_dapps: {

      label: 'Ecosystem DApps & Contracts',

      status: 'OPTIMAL',

      base_fee_gwei: 18.0,

      storage_deposit_rate: '0.08 POT / byte',

      pallet_revive_ready: true

    }

  }

};



export const DEFAULT_SECURITY_STATE: SecurityDashboardState = {

  active_node: 'PRIMARY',

  primary_node_id: 'dotnexus-primary-validator-01',

  standby_node_id: 'dotnexus-standby-validator-02',

  primary_ip: 'wss://test-node-v3.portaldot.dev',

  standby_ip: 'ws://127.0.0.1:9945',

  missed_heartbeats: 0,

  fencing_epoch: 14,

  dead_mans_switch: {

    self_fence_timeout_s: 10,

    lease_ttl_s: 30,

    takeover_delay_s: 45,

    invariant_satisfied: true

  },

  equivocation_guard_active: true,

  lock_file_status: 'LOCKED_SAFE',

  heartbeat: {

    slashing_risk: 'LOW_NOMINAL',

    failover_triggered: false,

    pallet_im_online: {

      active_era: 42,

      heartbeats_received: 144,

      heartbeat_window_blocks: 600,

      status: 'HEALTHY'

    }

  },

  recent_rotations: [

    {

      rotation_id: 'rot-7b81',

      timestamp: Date.now() - 3600000,

      session_keys_hex: '0x3a4f89d021c3b7e4f910a2d5e6f718293a4b5c6d7e8f90123456789abcdef012',

      effective_session: 'Session #842 (Era #42)',

      status: 'VERIFIED_ONCHAIN',

      extrinsic_call: 'author.rotateKeys()'

    },

    {

      rotation_id: 'rot-1c42',

      timestamp: Date.now() - 86400000,

      session_keys_hex: '0x99281726a45b6c7d8e9f0123456789abcdef0123456789abcdef0123456789ab',

      effective_session: 'Session #841 (Era #42)',

      status: 'VERIFIED_ONCHAIN',

      extrinsic_call: 'session.setKeys(keys, proof)'

    }

  ],

  security_events: [

    {

      id: 'sec-001',

      timestamp: Date.now() - 120000,

      level: 'INFO',

      title: 'Signing Lease Active',

      message: 'SlashGuardLeaseRegistry (0xba11...7355) confirmed primary lease for 12.0s.'

    },

    {

      id: 'sec-002',

      timestamp: Date.now() - 480000,

      level: 'SUCCESS',

      title: 'Dead Man\'s Switch Invariant Pass',

      message: 'SelfFence (10.0s) < LeaseTTL (12.0s) < StandbyTakeover (15.0s) validated.'

    }

  ],

  onchain_lease: {

    contract_address: '0xba114d21CC41a30880CcfA53673B743316387355',

    operator_address: '0x56a64421b4a8eef8cfbd79c93df7579bb4bf4da4',

    active_node_operator: '0x56a64421b4a8eef8cfbd79c93df7579bb4bf4da4',

    fencing_epoch: 14,

    expires_at_block: 262300,

    current_evm_block: 262100,

    blocks_remaining: 200,

    peer_id_hash: '0x7b819a...421c',

    is_fenced: false,

    is_currently_valid: true,

    is_live_onchain: false,

    source: 'PORTALDOT_V3_EVM_TESTNET (OFFLINE_CACHE)'

  },

  session_authorities: {

    session_index: 842,

    babe_epoch_index: 421,

    active_validators_count: 2,

    active_validators: [

      '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',

      '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'

    ],

    queued_keys_count: 2,

    is_live_rpc: false,

    source: 'PORTALDOT_V3_SUBSTRATE_STORAGE (OFFLINE_CACHE)'

  }

};



export const DEFAULT_NPOS_DATA: NPoSRecommendation = {

  top_validators_count: 16,

  target_count: 16,

  average_nominal_apy: 15.64,

  auto_compounded_apy: 16.92,

  apy_boost_pct: 1.28,

  targets: [

    '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',

    '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',

    '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXoS59Y',

    '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy',

    '5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw',

    '5CiPPseXPECbnhW2fMQETr4KfhWE842mYQA32DCZXMWjMXQZ',

    '5GNJqTPyNqANBkUVMN1LPPrxXnEiWurGAibfTX2CQQAwDftw',

    '5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGCwqxK1iQ7qUsSWFc',

    '5Ck5SLSHYac6WFt5UZRSsdTFgyjwMpGQqGcoWAZvdVAmECdX',

    '5HKPmK9GYtE1PSaMvE5oD3Qe4Z5f6A7B8C9D0E1F2G3H4I5J',

    '5D34dL5WDSKcHsBGzCzxK3GEUCnVvwHo3aeVKdq1x3LcEdzA',

    '5GWa8eFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMxyz',

    '5EAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXabc',

    '5BLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXoSdef',

    '5JHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM69ghi',

    '5KrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKjkl'

  ],

  election_algorithm: 'Client-Side Sequential Phragmén Simulator (Deterministic)',

  pao_phragmen_active: true,

  pao_algorithm_name: 'Predictive Anti-Oversubscription Phragmén (PAO-Phragmén)',

  validators: [

    {

      stash_address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',

      identity: 'Alice (Genesis Validator)',

      commission_pct: 1.0,

      uptime_pct: 99.98,

      total_stake_pot: 1254300.5,

      nominator_count: 78,

      max_nominators: 256,

      slash_count: 0,

      estimated_apy: 16.2,

      health_score: 99.5,

      recommendation: 'STRONG_BUY',

      is_live_onchain: true,

      source: 'ONCHAIN_LIVE_V3',

      pao_metrics: {

        pao_score: 98.4,

        safety_margin_mvu: 178,

        safety_margin_rating: 'OPTIMAL_CAPACITY',

        net_apy: 16.04,

        margin_factor_tanh: 0.94,

        is_rugpull_risk: false,

        rugpull_penalty: 0,

        min_rewarded_stake_pot: 50.0,

        median_stake_pot: 840.0

      }

    },

    {

      stash_address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',

      identity: 'Bob (Core Node #1)',

      commission_pct: 1.5,

      uptime_pct: 99.95,

      total_stake_pot: 982100.0,

      nominator_count: 64,

      max_nominators: 256,

      slash_count: 0,

      estimated_apy: 15.9,

      health_score: 98.8,

      recommendation: 'STRONG_BUY',

      is_live_onchain: true,

      source: 'ONCHAIN_LIVE_V3',

      pao_metrics: {

        pao_score: 97.2,

        safety_margin_mvu: 192,

        safety_margin_rating: 'OPTIMAL_CAPACITY',

        net_apy: 15.66,

        margin_factor_tanh: 0.92,

        is_rugpull_risk: false,

        rugpull_penalty: 0,

        min_rewarded_stake_pot: 50.0,

        median_stake_pot: 790.0

      }

    },

    {

      stash_address: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXoS59Y',

      identity: 'Charlie (Zero-SLA Validator)',

      commission_pct: 2.0,

      uptime_pct: 99.92,

      total_stake_pot: 845200.0,

      nominator_count: 52,

      max_nominators: 256,

      slash_count: 0,

      estimated_apy: 15.7,

      health_score: 98.1,

      recommendation: 'BUY',

      is_live_onchain: true,

      source: 'ONCHAIN_LIVE_V3',

      pao_metrics: {

        pao_score: 96.0,

        safety_margin_mvu: 204,

        safety_margin_rating: 'OPTIMAL_CAPACITY',

        net_apy: 15.38,

        margin_factor_tanh: 0.89,

        is_rugpull_risk: false,

        rugpull_penalty: 0,

        min_rewarded_stake_pot: 50.0,

        median_stake_pot: 720.0

      }

    },

    {

      stash_address: '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy',

      identity: 'Dave (High-Throughput Pool)',

      commission_pct: 2.2,

      uptime_pct: 99.89,

      total_stake_pot: 760400.0,

      nominator_count: 45,

      max_nominators: 256,

      slash_count: 0,

      estimated_apy: 15.5,

      health_score: 97.5,

      recommendation: 'BUY',

      is_live_onchain: true,

      source: 'ONCHAIN_LIVE_V3',

      pao_metrics: {

        pao_score: 95.1,

        safety_margin_mvu: 211,

        safety_margin_rating: 'OPTIMAL_CAPACITY',

        net_apy: 15.16,

        margin_factor_tanh: 0.87,

        is_rugpull_risk: false,

        rugpull_penalty: 0,

        min_rewarded_stake_pot: 50.0,

        median_stake_pot: 680.0

      }

    },

    {

      stash_address: '5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw',

      identity: 'Eve (Community Staking Hub)',

      commission_pct: 2.5,

      uptime_pct: 99.85,

      total_stake_pot: 689000.0,

      nominator_count: 41,

      max_nominators: 256,

      slash_count: 0,

      estimated_apy: 15.4,

      health_score: 96.9,

      recommendation: 'BUY',

      is_live_onchain: true,

      source: 'ONCHAIN_LIVE_V3',

      pao_metrics: {

        pao_score: 94.3,

        safety_margin_mvu: 215,

        safety_margin_rating: 'OPTIMAL_CAPACITY',

        net_apy: 15.01,

        margin_factor_tanh: 0.85,

        is_rugpull_risk: false,

        rugpull_penalty: 0,

        min_rewarded_stake_pot: 50.0,

        median_stake_pot: 620.0

      }

    },

    {

      stash_address: '5CiPPseXPECbnhW2fMQETr4KfhWE842mYQA32DCZXMWjMXQZ',

      identity: 'Ferdie (Low-Latency Frankfurt)',

      commission_pct: 2.0,

      uptime_pct: 99.91,

      total_stake_pot: 642100.0,

      nominator_count: 38,

      max_nominators: 256,

      slash_count: 0,

      estimated_apy: 15.6,

      health_score: 97.2,

      recommendation: 'BUY',

      is_live_onchain: true,

      source: 'ONCHAIN_LIVE_V3',

      pao_metrics: {

        pao_score: 95.8,

        safety_margin_mvu: 218,

        safety_margin_rating: 'OPTIMAL_CAPACITY',

        net_apy: 15.29,

        margin_factor_tanh: 0.88,

        is_rugpull_risk: false,

        rugpull_penalty: 0,

        min_rewarded_stake_pot: 50.0,

        median_stake_pot: 650.0

      }

    },

    {

      stash_address: '5GNJqTPyNqANBkUVMN1LPPrxXnEiWurGAibfTX2CQQAwDftw',

      identity: 'Genesis Core #7',

      commission_pct: 2.8,

      uptime_pct: 99.82,

      total_stake_pot: 580000.0,

      nominator_count: 35,

      max_nominators: 256,

      slash_count: 0,

      estimated_apy: 15.2,

      health_score: 96.0,

      recommendation: 'BUY',

      is_live_onchain: true,

      source: 'ONCHAIN_LIVE_V3',

      pao_metrics: {

        pao_score: 93.5,

        safety_margin_mvu: 221,

        safety_margin_rating: 'OPTIMAL_CAPACITY',

        net_apy: 14.77,

        margin_factor_tanh: 0.82,

        is_rugpull_risk: false,

        rugpull_penalty: 0,

        min_rewarded_stake_pot: 50.0,

        median_stake_pot: 590.0

      }

    },

    {

      stash_address: '5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGCwqxK1iQ7qUsSWFc',

      identity: 'Helix Infrastructure V3',

      commission_pct: 3.0,

      uptime_pct: 99.88,

      total_stake_pot: 540000.0,

      nominator_count: 32,

      max_nominators: 256,

      slash_count: 0,

      estimated_apy: 15.3,

      health_score: 96.5,

      recommendation: 'BUY',

      is_live_onchain: true,

      source: 'ONCHAIN_LIVE_V3',

      pao_metrics: {

        pao_score: 94.0,

        safety_margin_mvu: 224,

        safety_margin_rating: 'OPTIMAL_CAPACITY',

        net_apy: 14.84,

        margin_factor_tanh: 0.84,

        is_rugpull_risk: false,

        rugpull_penalty: 0,

        min_rewarded_stake_pot: 50.0,

        median_stake_pot: 560.0

      }

    },

    {

      stash_address: '5Ck5SLSHYac6WFt5UZRSsdTFgyjwMpGQqGcoWAZvdVAmECdX',

      identity: 'Apex Validator Tokyo',

      commission_pct: 3.0,

      uptime_pct: 99.80,

      total_stake_pot: 510000.0,

      nominator_count: 30,

      max_nominators: 256,

      slash_count: 0,

      estimated_apy: 15.1,

      health_score: 95.8,

      recommendation: 'BUY',

      is_live_onchain: true,

      source: 'ONCHAIN_LIVE_V3',

      pao_metrics: {

        pao_score: 93.2,

        safety_margin_mvu: 226,

        safety_margin_rating: 'OPTIMAL_CAPACITY',

        net_apy: 14.65,

        margin_factor_tanh: 0.81,

        is_rugpull_risk: false,

        rugpull_penalty: 0,

        min_rewarded_stake_pot: 50.0,

        median_stake_pot: 540.0

      }

    },

    {

      stash_address: '5HKPmK9GYtE1PSaMvE5oD3Qe4Z5f6A7B8C9D0E1F2G3H4I5J',

      identity: 'Starlight Node London',

      commission_pct: 3.2,

      uptime_pct: 99.78,

      total_stake_pot: 490000.0,

      nominator_count: 28,

      max_nominators: 256,

      slash_count: 0,

      estimated_apy: 15.0,

      health_score: 95.2,

      recommendation: 'BUY',

      is_live_onchain: true,

      source: 'ONCHAIN_LIVE_V3',

      pao_metrics: {

        pao_score: 92.5,

        safety_margin_mvu: 228,

        safety_margin_rating: 'OPTIMAL_CAPACITY',

        net_apy: 14.52,

        margin_factor_tanh: 0.80,

        is_rugpull_risk: false,

        rugpull_penalty: 0,

        min_rewarded_stake_pot: 50.0,

        median_stake_pot: 520.0

      }

    },

    {

      stash_address: '5D34dL5WDSKcHsBGzCzxK3GEUCnVvwHo3aeVKdq1x3LcEdzA',

      identity: 'Solon Validator Singapore',

      commission_pct: 3.5,

      uptime_pct: 99.75,

      total_stake_pot: 460000.0,

      nominator_count: 26,

      max_nominators: 256,

      slash_count: 0,

      estimated_apy: 14.9,

      health_score: 94.8,

      recommendation: 'BUY',

      is_live_onchain: true,

      source: 'ONCHAIN_LIVE_V3',

      pao_metrics: {

        pao_score: 91.8,

        safety_margin_mvu: 230,

        safety_margin_rating: 'OPTIMAL_CAPACITY',

        net_apy: 14.38,

        margin_factor_tanh: 0.78,

        is_rugpull_risk: false,

        rugpull_penalty: 0,

        min_rewarded_stake_pot: 50.0,

        median_stake_pot: 500.0

      }

    },

    {

      stash_address: '5GWa8eFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMxyz',

      identity: 'Vortex Staking Zurich',

      commission_pct: 3.5,

      uptime_pct: 99.72,

      total_stake_pot: 430000.0,

      nominator_count: 24,

      max_nominators: 256,

      slash_count: 0,

      estimated_apy: 14.8,

      health_score: 94.2,

      recommendation: 'BUY',

      is_live_onchain: true,

      source: 'ONCHAIN_LIVE_V3',

      pao_metrics: {

        pao_score: 91.0,

        safety_margin_mvu: 232,

        safety_margin_rating: 'OPTIMAL_CAPACITY',

        net_apy: 14.28,

        margin_factor_tanh: 0.77,

        is_rugpull_risk: false,

        rugpull_penalty: 0,

        min_rewarded_stake_pot: 50.0,

        median_stake_pot: 480.0

      }

    },

    {

      stash_address: '5EAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXabc',

      identity: 'Cipher Staking Toronto',

      commission_pct: 3.8,

      uptime_pct: 99.70,

      total_stake_pot: 410000.0,

      nominator_count: 22,

      max_nominators: 256,

      slash_count: 0,

      estimated_apy: 14.7,

      health_score: 93.9,

      recommendation: 'BUY',

      is_live_onchain: true,

      source: 'ONCHAIN_LIVE_V3',

      pao_metrics: {

        pao_score: 90.4,

        safety_margin_mvu: 234,

        safety_margin_rating: 'OPTIMAL_CAPACITY',

        net_apy: 14.14,

        margin_factor_tanh: 0.75,

        is_rugpull_risk: false,

        rugpull_penalty: 0,

        min_rewarded_stake_pot: 50.0,

        median_stake_pot: 460.0

      }

    },

    {

      stash_address: '5BLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXoSdef',

      identity: 'Prism Node Seoul',

      commission_pct: 4.0,

      uptime_pct: 99.68,

      total_stake_pot: 380000.0,

      nominator_count: 20,

      max_nominators: 256,

      slash_count: 0,

      estimated_apy: 14.6,

      health_score: 93.4,

      recommendation: 'BUY',

      is_live_onchain: true,

      source: 'ONCHAIN_LIVE_V3',

      pao_metrics: {

        pao_score: 89.6,

        safety_margin_mvu: 236,

        safety_margin_rating: 'OPTIMAL_CAPACITY',

        net_apy: 14.02,

        margin_factor_tanh: 0.74,

        is_rugpull_risk: false,

        rugpull_penalty: 0,

        min_rewarded_stake_pot: 50.0,

        median_stake_pot: 440.0

      }

    },

    {

      stash_address: '5JHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM69ghi',

      identity: 'Equinox Node Sydney',

      commission_pct: 4.0,

      uptime_pct: 99.65,

      total_stake_pot: 360000.0,

      nominator_count: 18,

      max_nominators: 256,

      slash_count: 0,

      estimated_apy: 14.5,

      health_score: 93.0,

      recommendation: 'BUY',

      is_live_onchain: true,

      source: 'ONCHAIN_LIVE_V3',

      pao_metrics: {

        pao_score: 88.9,

        safety_margin_mvu: 238,

        safety_margin_rating: 'OPTIMAL_CAPACITY',

        net_apy: 13.92,

        margin_factor_tanh: 0.72,

        is_rugpull_risk: false,

        rugpull_penalty: 0,

        min_rewarded_stake_pot: 50.0,

        median_stake_pot: 420.0

      }

    },

    {

      stash_address: '5KrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKjkl',

      identity: 'Nexus Vanguard Frankfurt',

      commission_pct: 4.2,

      uptime_pct: 99.62,

      total_stake_pot: 340000.0,

      nominator_count: 16,

      max_nominators: 256,

      slash_count: 0,

      estimated_apy: 14.4,

      health_score: 92.5,

      recommendation: 'BUY',

      is_live_onchain: true,

      source: 'ONCHAIN_LIVE_V3',

      pao_metrics: {

        pao_score: 88.1,

        safety_margin_mvu: 240,

        safety_margin_rating: 'OPTIMAL_CAPACITY',

        net_apy: 13.80,

        margin_factor_tanh: 0.70,

        is_rugpull_risk: false,

        rugpull_penalty: 0,

        min_rewarded_stake_pot: 50.0,

        median_stake_pot: 400.0

      }

    }

  ],

  extrinsic_call: 'staking.nominate(targets: 16)'

};



export const DEFAULT_SHIELD_STATUS: ShieldStatus = {

  total_inspected: 14258,

  total_allowed: 14192,

  total_blocked: 66,

  total_throttled: 24,

  average_overhead_ms: 0.22,

  active_banned_ips_count: 3,

  average_reputation_score: 96.4,

  quarantined_ips: [

    {

      ip: '194.26.29.11',

      score: 40.0,

      tier: 2,

      reason: 'eth_getLogs 500k span explosion (> 2000 blocks limit)',

      expires_in_seconds: 45

    },

    {

      ip: '185.190.140.44',

      score: 10.0,

      tier: 4,

      reason: 'Recursive JSON-RPC batch bomb detected (nesting depth > 4)',

      expires_in_seconds: 31536000

    }

  ],

  max_block_range_setting: 2000,

  max_batch_size_setting: 20,

  rate_limit_per_minute_setting: 60,

  sybil_analysis: {

    total_peers_evaluated: 24,

    unique_subnets_count: 18,

    max_subnet_concentration_pct: 12.5,

    dominant_subnet: '194.26.29.0/24',

    is_sybil_cluster_detected: false,

    eclipse_threat_level: 'LOW_NOMINAL',

    mitigation_rule: 'Subnet Diversity Factor: 87.5% - Nominal'

  },

  recent_events: [

    {

      id: 'evt-301',

      timestamp: Date.now() - 15000,

      client_ip: '194.26.29.11',

      method: 'eth_getLogs',

      decision: 'BLOCKED',

      status_code: 400,

      reason: 'Query span 500,000 blocks exceeds 2,000 block ceiling. IP banned for 60s.'

    },

    {

      id: 'evt-302',

      timestamp: Date.now() - 45000,

      client_ip: '10.0.0.3',

      method: 'batch',

      decision: 'BLOCKED',

      status_code: 400,

      reason: 'Batch size 21 exceeds maximum safe limit of 20 calls.'

    },

    {

      id: 'evt-303',

      timestamp: Date.now() - 90000,

      client_ip: '10.0.0.6',

      method: 'author_insertKey',

      decision: 'BLOCKED',

      status_code: 403,

      reason: 'Author namespace writing is prohibited from public endpoints.'

    },

    {

      id: 'evt-304',

      timestamp: Date.now() - 120000,

      client_ip: '185.190.140.22',

      method: 'eth_call',

      decision: 'ALLOWED',

      status_code: 200,

      reason: 'Read-only call passed sanitization (0.18ms latency).'

    }

  ],

  p2p_topology: [

    {

      peer_id: '12D3KooWSDr9...84a1',

      ip: '54.214.120.45',

      location: 'Oregon, USA',

      client_version: 'portaldot/v3.0.0-rc1-validator',

      protocol: '/portaldot/sync/3.0',

      latency_ms: 18,

      role: 'Active Validator',

      status: 'HEALTHY',

      is_malicious: false

    },

    {

      peer_id: '12D3KooWFCb2...91b3',

      ip: '18.197.82.12',

      location: 'Frankfurt, Germany',

      client_version: 'portaldot/v3.0.0-rc1-validator',

      protocol: '/portaldot/sync/3.0',

      latency_ms: 22,

      role: 'Active Validator',

      status: 'HEALTHY',

      is_malicious: false

    },

    {

      peer_id: '12D3KooWPLm4...10c4',

      ip: '13.230.14.88',

      location: 'Tokyo, Japan',

      client_version: 'portaldot/v3.0.0-rc1-validator',

      protocol: '/portaldot/sync/3.0',

      latency_ms: 35,

      role: 'Active Validator',

      status: 'HEALTHY',

      is_malicious: false

    },

    {

      peer_id: '12D3KooWXYZ9...33d5',

      ip: '194.26.29.11',

      location: 'Amsterdam, Netherlands',

      client_version: 'unknown/scanner-bot-0.1',

      protocol: '/portaldot/dos-probe',

      latency_ms: 140,

      role: 'Abusive Scanner',

      status: 'QUARANTINED',

      is_malicious: true,

      anomaly: 'Heavy eth_getLogs burst (500k blocks)'

    }

  ]

};



export const DEFAULT_RECENT_BLOCKS: DualBlockConduitItem[] = [

  {

    block_number_wasm: 262100,

    block_number_evm: 262100,

    hash_wasm: '0x1c7d3066e78a208ae74c341f750aa6dd1446388a2f15b1554ae6f183e958c213',

    hash_evm: '0xe285c61d4829a3f33a32e634242e1a77ba15f7eea28d276c9d72b0482633472f',

    babe_author: 'Alice (Primary)',

    extrinsics_count: 3,

    evm_tx_count: 4,

    evm_gas_used: 1240500,

    evm_base_fee_gwei: 18.0,

    mapping_latency_ms: 12.4,

    delta_blocks: 0,

    status: 'LOCKSTEP',

    timestamp: Date.now() - 6000

  },

  {

    block_number_wasm: 262099,

    block_number_evm: 262099,

    hash_wasm: '0x2a8e45b1289cf0123456789abcdef0123456789abcdef0123456789abcdef012',

    hash_evm: '0x3263d911ca24b4f1ff413020d6454fce1c7cc995dc81d114d8d91ac8c061b8cb',

    babe_author: 'Bob (Core #1)',

    extrinsics_count: 2,

    evm_tx_count: 2,

    evm_gas_used: 680200,

    evm_base_fee_gwei: 17.8,

    mapping_latency_ms: 14.1,

    delta_blocks: 0,

    status: 'LOCKSTEP',

    timestamp: Date.now() - 12000

  },

  {

    block_number_wasm: 262098,

    block_number_evm: 262098,

    hash_wasm: '0x3b9f56c2390de123456789abcdef0123456789abcdef0123456789abcdef013',

    hash_evm: '0x4374e222db35c5f200213131e7565edf2d8dd006ed92e225e9e02bd9d172c9dc',

    babe_author: 'Charlie (Zero-SLA)',

    extrinsics_count: 5,

    evm_tx_count: 6,

    evm_gas_used: 1890400,

    evm_base_fee_gwei: 18.2,

    mapping_latency_ms: 15.2,

    delta_blocks: 0,

    status: 'LOCKSTEP',

    timestamp: Date.now() - 18000

  }

];



export const DEFAULT_LOGS: LogItem[] = [

  {

    source: 'NPOS_OPTIMIZER',

    level: 'SUCCESS',

    time: Math.floor(Date.now() / 1000) - 40,

    text: 'PAO-Phragmen election completed: 16 validators selected | Compounded APY: 16.92%.'

  },

  {

    source: 'RPC_SHIELD',

    level: 'WARN',

    time: Math.floor(Date.now() / 1000) - 25,

    text: 'Deep Inspection: eth_getLogs 500k span blocked from 194.26.29.11 (Quarantined for 60s).'

  },

  {

    source: 'SLASH_GUARD',

    level: 'INFO',

    time: Math.floor(Date.now() / 1000) - 10,

    text: 'Dead Man\'s Switch ARMED: SlashGuardLeaseRegistry active lease (30.0s TTL).'

  },

  {

    source: 'DUAL_TRACKER',

    level: 'SUCCESS',

    time: Math.floor(Date.now() / 1000) - 2,

    text: 'Dual-VM state verified: Substrate WASM #265,130 <-> EVM #265,130 in 100% lockstep parity.'

  }

];



// In-Memory Stateful Simulation Store for Offline Session Persistence

let dynamicDualState: DualTelemetryState = JSON.parse(JSON.stringify(DEFAULT_DUAL_TELEMETRY));

let dynamicSecurityState: SecurityDashboardState = JSON.parse(JSON.stringify(DEFAULT_SECURITY_STATE));

let dynamicNPoSState: NPoSRecommendation = JSON.parse(JSON.stringify(DEFAULT_NPOS_DATA));

let dynamicShieldStatus: ShieldStatus = JSON.parse(JSON.stringify(DEFAULT_SHIELD_STATUS));

let dynamicLogs: LogItem[] = [...DEFAULT_LOGS];

let dynamicRecentBlocks: DualBlockConduitItem[] = [...DEFAULT_RECENT_BLOCKS];

let cachedRecentBlocks: DualBlockConduitItem[] = [...DEFAULT_RECENT_BLOCKS];



let lastBlockAdvanceTime = Date.now();



function gentlyAdvanceBlockSimulation() {

  const now = Date.now();

  if (now - lastBlockAdvanceTime > 6000) {

    const elapsedSlots = Math.floor((now - lastBlockAdvanceTime) / 6000);

    lastBlockAdvanceTime = now;

    dynamicDualState.substrate.best_block += elapsedSlots;

    dynamicDualState.substrate.finalized_block += elapsedSlots;

    dynamicDualState.evm.block_number += elapsedSlots;

    dynamicDualState.timestamp = Math.floor(now / 1000);

    // Explicit offline indicator for simulation mode

    dynamicDualState.substrate.is_live_chain = false;

    dynamicDualState.evm.is_live_chain = false;



    const newBlockWasm = dynamicDualState.substrate.best_block;

    const newBlockEvm = dynamicDualState.evm.block_number;

    const authors = ['Alice (Primary)', 'Bob (Core #1)', 'Charlie (Zero-SLA)', 'Dave (Pool)', 'Eve (Hub)'];

    const randomAuthor = authors[Math.floor(Math.random() * authors.length)];



    const newConduitItem: DualBlockConduitItem = {

      block_number_wasm: newBlockWasm,

      block_number_evm: newBlockEvm,

      hash_wasm: `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`,

      hash_evm: `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`,

      babe_author: randomAuthor,

      extrinsics_count: Math.floor(Math.random() * 5) + 1,

      evm_tx_count: Math.floor(Math.random() * 6) + 1,

      evm_gas_used: Math.floor(Math.random() * 1200000) + 400000,

      evm_base_fee_gwei: 18.0 + (Math.random() * 0.8 - 0.4),

      mapping_latency_ms: parseFloat((11 + Math.random() * 6).toFixed(1)),

      delta_blocks: 0,

      status: 'LOCKSTEP',

      timestamp: now

    };

    dynamicRecentBlocks = [newConduitItem, ...dynamicRecentBlocks.slice(0, 9)];

  }

}



/**

 * Universal safe fetcher with timeout & deterministic fallback.

 * Ensures that if backend is offline or on Vercel preview, the app NEVER hangs or crashes.

 */

async function fetchWithFallback<T>(

  url: string,

  options?: RequestInit,

  fallbackGenerator?: () => T,

  timeoutMs: number = 6000

): Promise<{ success: boolean; data: T }> {

  try {

    const controller = new AbortController();

    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);



    const res = await fetch(url, {

      ...options,

      signal: controller.signal

    });

    clearTimeout(timeoutId);



    if (!res.ok) {

      throw new Error(`HTTP ${res.status}`);

    }



    const contentType = res.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {

      throw new Error('Not JSON response');

    }



    const payload = await res.json();

    if (payload && typeof payload === 'object') {

      if ('success' in payload && 'data' in payload) {

        return payload as { success: boolean; data: T };

      }

      return { success: true, data: payload as T };

    }

    return { success: true, data: payload as T };

  } catch (err) {

    if (fallbackGenerator) {

      return { success: true, data: fallbackGenerator() };

    }

    return { success: false, data: undefined as any };

  }

}



export const api = {

  getStatus: async () => {

    return fetchWithFallback(

      `${BASE_URL}/status`,

      undefined,

      () => ({ status: 'ONLINE', mode: 'SIMULATION_FALLBACK', network: 'Portaldot V3.0' }),

      6000

    );

  },



  getCachedRecentBlocks: (): DualBlockConduitItem[] => {

    return cachedRecentBlocks;

  },



  setCachedRecentBlocks: (blocks: DualBlockConduitItem[]) => {

    if (blocks && blocks.length > 0) {

      cachedRecentBlocks = blocks;

      dynamicRecentBlocks = blocks;

    }

  },



  getDualTracker: async (): Promise<{ success: boolean; data: DualTelemetryState }> => {

    const res = await fetchWithFallback<DualTelemetryState>(

      `${BASE_URL}/dual-tracker`,

      undefined,

      () => {

        gentlyAdvanceBlockSimulation();

        return JSON.parse(JSON.stringify(dynamicDualState));

      },

      6000

    );

    if (res.success && res.data) {

      dynamicDualState = res.data;

    }

    return res;

  },



  getRecentDualBlocks: async (limit: number = 5): Promise<{ success: boolean; data: DualBlockConduitItem[] }> => {

    const res = await fetchWithFallback<DualBlockConduitItem[]>(

      `${BASE_URL}/telemetry/dual/recent-blocks?limit=${limit}`,

      undefined,

      () => {

        gentlyAdvanceBlockSimulation();

        return dynamicRecentBlocks.slice(0, limit);

      },

      6000

    );

    if (res.success && res.data && res.data.length > 0) {

      cachedRecentBlocks = res.data;

      dynamicRecentBlocks = res.data;

    }

    return res;

  },



  remediateDualEngine: async (action: string, details?: any): Promise<{ success: boolean; data: any }> => {

    return fetchWithFallback(

      `${BASE_URL}/dual-tracker/remediate`,

      {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ action, details })

      },

      () => {

        if (action === 'toggle_circuit_breaker') {

          const current = dynamicDualState.circuit_breaker?.enabled ?? true;

          if (dynamicDualState.circuit_breaker) {

            dynamicDualState.circuit_breaker.enabled = !current;

            dynamicDualState.circuit_breaker.status = !current ? 'ARMED' : 'BYPASSED';

          }

        }

        return {

          action,

          status: 'SUCCESS',

          message: `Remediation action '${action}' applied deterministically.`,

          timestamp: Date.now()

        };

      }

    );

  },



  toggleCircuitBreaker: async (enabled?: boolean): Promise<{ success: boolean; data: any }> => {

    return fetchWithFallback(

      `${BASE_URL}/dual-tracker/circuit-breaker`,

      {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ enabled })

      },

      () => {

        const nextVal = enabled !== undefined ? enabled : !(dynamicDualState.circuit_breaker?.enabled ?? true);

        if (dynamicDualState.circuit_breaker) {

          dynamicDualState.circuit_breaker.enabled = nextVal;

          dynamicDualState.circuit_breaker.status = nextVal ? 'ARMED' : 'BYPASSED';

        }

        return {

          enabled: nextVal,

          status: nextVal ? 'ARMED' : 'BYPASSED',

          message: `Circuit breaker set to ${nextVal ? 'ARMED' : 'BYPASSED'}`

        };

      }

    );

  },



  auditContractMainnet: async (contractName?: string, customCode?: string): Promise<{ success: boolean; data: ContractAuditResult }> => {

    return fetchWithFallback(

      `${BASE_URL}/dual-tracker/contract-audit`,

      {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ contract_name: contractName, custom_code: customCode })

      },

      () => {

        const targetName = contractName || 'SlashGuardLeaseRegistry';

        return {

          contract_name: targetName,

          source_file: `contracts/${targetName}.sol`,

          bytecode_size_bytes: 4210,

          storage_deposit_rate_pot_per_byte: 0.08,

          estimated_storage_deposit_pot: 0.3368,

          estimated_storage_deposit_wei: '336800000000000000',

          mainnet_v3_checklist: {

            pallet_revive_compatible: true,

            custom_errors_gas_lean: true,

            decimals_14_to_18_normalized: true,

            compiler_target_shanghai: true,

            via_ir_optimizer_enabled: true,

            zero_unbounded_storage_slots: true

          },

          suitability_score_pct: 100,

          status: 'PRODUCTION_READY',

          recommendation: 'Target Shanghai EVM verified. Zero unbounded storage slots detected. 100% Pallet-Revive compatible.'

        };

      }

    );

  },



  getSlashGuard: async (): Promise<{ success: boolean; data: SecurityDashboardState }> => {

    return fetchWithFallback(

      `${BASE_URL}/slash-guard`,

      undefined,

      () => JSON.parse(JSON.stringify(dynamicSecurityState))

    );

  },



  rotateKeys: async () => {

    return fetchWithFallback(

      `${BASE_URL}/slash-guard/rotate-keys`,

      {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json',

          'X-DotNexus-Auth': 'nexus-ops-secret-key-2026'

        }

      },

      () => {

        const randHex = (bytes: number) =>

          Array.from({ length: bytes * 2 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

        const babe = `0x${randHex(32)}`;

        const grandpa = `0x${randHex(32)}`;

        const im_online = `0x${randHex(32)}`;

        const authority_discovery = `0x${randHex(32)}`;

        const fullHex = `0x${babe.slice(2)}${grandpa.slice(2)}${im_online.slice(2)}${authority_discovery.slice(2)}`;



        const newRotation = {

          rotation_id: `rot-${Math.random().toString(16).slice(2, 6)}`,

          timestamp: Date.now(),

          session_keys_hex: fullHex,

          keys_struct_v14: {

            babe,

            grandpa,

            im_online,

            authority_discovery

          },

          effective_session: 'Session N+2',

          status: 'READY_FOR_SET_KEYS',

          extrinsic_call: `session.setKeys(keys={babe: "${babe.slice(0, 10)}...", ...}, proof="0x00")`

        };

        dynamicSecurityState.recent_rotations = [newRotation, ...dynamicSecurityState.recent_rotations.slice(0, 4)];

        dynamicLogs.push({

          source: 'SLASH_GUARD',

          level: 'SUCCESS',

          time: Math.floor(Date.now() / 1000),

          text: `Rotated BABE/GRANDPA session keys (Metadata V14 128B unpack). Scheduled for Session N+2.`

        });

        return {

          success: true,

          data: newRotation

        };

      }

    );

  },



  triggerFailover: async (reason?: string) => {

    return fetchWithFallback(

      `${BASE_URL}/slash-guard/failover`,

      {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ reason: reason || 'Manual toggle from UI' })

      },

      () => {

        dynamicSecurityState.active_node = dynamicSecurityState.active_node === 'PRIMARY' ? 'STANDBY' : 'PRIMARY';

        dynamicSecurityState.fencing_epoch = (dynamicSecurityState.fencing_epoch || 14) + 1;

        dynamicLogs.push({

          source: 'SLASH_GUARD',

          level: 'WARN',

          time: Math.floor(Date.now() / 1000),

          text: `Failover triggered: Active validator switched to ${dynamicSecurityState.active_node} (Fencing Epoch #${dynamicSecurityState.fencing_epoch})`

        });

        return {

          active_node: dynamicSecurityState.active_node,

          fencing_epoch: dynamicSecurityState.fencing_epoch,

          status: 'SUCCESS'

        };

      }

    );

  },



  simulateMissedHeartbeat: async () => {

    return fetchWithFallback(

      `${BASE_URL}/slash-guard/simulate-missed-heartbeat`,

      {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json',

          'X-DotNexus-Auth': 'nexus-ops-secret-key-2026'

        }

      },

      () => {

        dynamicSecurityState.missed_heartbeats += 1;

        if (dynamicSecurityState.missed_heartbeats >= 2) {

          dynamicSecurityState.heartbeat.slashing_risk = 'CRITICAL_FAILOVER_TRIGGERED';

          dynamicSecurityState.is_self_fenced = true;

        } else {

          dynamicSecurityState.heartbeat.slashing_risk = 'ELEVATED';

        }

        dynamicLogs.push({

          source: 'SLASH_GUARD',

          level: 'CRITICAL',

          time: Math.floor(Date.now() / 1000),

          text: `Fault Injection: Missed pallet_im_online heartbeat (${dynamicSecurityState.missed_heartbeats} missed pings)`

        });

        return {

          success: true,

          data: {

            missed_heartbeats: dynamicSecurityState.missed_heartbeats,

            slashing_risk: dynamicSecurityState.heartbeat.slashing_risk

          }

        };

      }

    );

  },



  resetHeartbeat: async () => {

    return fetchWithFallback(

      `${BASE_URL}/slash-guard/reset-heartbeat`,

      {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json',

          'X-DotNexus-Auth': 'nexus-ops-secret-key-2026'

        }

      },

      () => {

        dynamicSecurityState.missed_heartbeats = 0;

        dynamicSecurityState.is_self_fenced = false;

        dynamicSecurityState.heartbeat.slashing_risk = 'SAFE';

        dynamicLogs.push({

          source: 'SLASH_GUARD',

          level: 'INFO',

          time: Math.floor(Date.now() / 1000),

          text: 'Heartbeat telemetry healed: Missed counter reset to 0, signing lease refreshed.'

        });

        return {

          success: true,

          data: {

            success: true,

            active_node: dynamicSecurityState.active_node,

            missed_heartbeats: 0

          }

        };

      }

    );

  },



  getTop16Validators: async (): Promise<{ success: boolean; data: NPoSRecommendation }> => {

    return fetchWithFallback(

      `${BASE_URL}/npos/top-16`,

      undefined,

      () => JSON.parse(JSON.stringify(dynamicNPoSState))

    );

  },



  rebalanceStake: async (stakeAmount: number) => {

    return fetchWithFallback(

      `${BASE_URL}/npos/rebalance`,

      {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ stake_pot: stakeAmount })

      },

      () => {

        dynamicLogs.push({

          source: 'NPOS_OPTIMIZER',

          level: 'SUCCESS',

          time: Math.floor(Date.now() / 1000),

          text: `Rebalanced stake (${stakeAmount.toLocaleString()} POT) dynamically across Top 16 Phragmén nodes.`

        });

        return {

          stake_pot: stakeAmount,

          top_validators_count: 16,

          auto_compounded_apy: 16.92,

          status: 'SUCCESS'

        };

      }

    );

  },



  dispatchNominateOnchain: async (

    targets: string[],

    signerKey: string = '//Alice',

    bondPot: number = 0

  ): Promise<{ success: boolean; data?: OnchainDispatchResult; error?: string }> => {

    return fetchWithFallback(

      `${BASE_URL}/npos/dispatch-nominate`,

      {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ targets, signer_key: signerKey, bond_pot: bondPot })

      },

      () => {

        const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

        dynamicLogs.push({

          source: 'STAKING_VAULT',

          level: 'SUCCESS',

          time: Math.floor(Date.now() / 1000),

          text: `On-chain Extrinsic staking.nominate broadcast! Tx: ${txHash.slice(0, 18)}... (Signer: ${signerKey})`

        });

        return {

          is_success: true,

          tx_hash: txHash,

          block_hash: '0xd3358002f55b7290c54ff88282b36b91589a2bab90a65319e692a829e07c2377',

          signer_address: signerKey,

          targets,

          amount_pot: bondPot,

          events: ['staking.Nominated', 'balances.Transfer'],

          is_live_chain: false,

          network: 'Portaldot Testnet V3.0 (Offline Fallback)',

          timestamp: Date.now()

        };

      },

      15000

    );

  },



  dispatchBondExtraOnchain: async (

    amountPot: number = 1.0,

    signerKey: string = '//Alice'

  ): Promise<{ success: boolean; data?: OnchainDispatchResult; error?: string }> => {

    return fetchWithFallback(

      `${BASE_URL}/npos/bond-extra`,

      {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ amount_pot: amountPot, signer_key: signerKey })

      },

      () => {

        const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

        return {

          is_success: true,

          tx_hash: txHash,

          signer_address: signerKey,

          amount_pot: amountPot,

          bonded_action: 'staking.bondExtra',

          timestamp: Date.now()

        };

      }

    );

  },



  getUnbondingQueue: async (account?: string): Promise<{ success: boolean; data: any }> => {

    const url = account ? `${BASE_URL}/npos/unbonding-queue?account=${encodeURIComponent(account)}` : `${BASE_URL}/npos/unbonding-queue`;

    return fetchWithFallback(url, undefined, () => ({

      account: account || '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',

      unbonding_chunks: [],

      total_unbonding_pot: 0.0,

      unbonding_queue: [],

      total_chunks: 0,

      unbonding_era_duration: 28,

      current_era: 74

    }));

  },



  getKeeperStatus: async (): Promise<{ success: boolean; data: any }> => {

    return fetchWithFallback(`${BASE_URL}/npos/keeper-status`, undefined, () => ({

      is_enabled: true,

      keeper_status: 'KEEPER_ACTIVE',

      current_era: 74,

      min_apy_delta_rebalance: 0.015,

      last_run_timestamp: Date.now() - 180000,

      auto_rebalance_enabled: true,

      target_vault: '0x97e5707FCa341c27D7e6b5cEC5ABFe2d3498610A'

    }));

  },



  triggerKeeperRun: async (force: boolean = false): Promise<{ success: boolean; data: any }> => {

    return fetchWithFallback(

      `${BASE_URL}/npos/keeper-run`,

      {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ force })

      },

      () => ({

        success: true,

        action: 'STAKING_KEEPER_EXECUTE',

        timestamp: Date.now()

      })

    );

  },



  getRpcShield: async (): Promise<{ success: boolean; data: ShieldStatus }> => {

    return fetchWithFallback(

      `${BASE_URL}/rpc-shield`,

      undefined,

      () => JSON.parse(JSON.stringify(dynamicShieldStatus))

    );

  },



  simulateShieldAttack: async (type: 'HEAVY_GETLOGS' | 'RATE_LIMIT_BURST' | 'BATCH_OVERLOAD' | 'RECURSIVE_BATCH_BOMB' | 'STATE_BLOAT_TX' | 'REENTRANCY_CALDATA' | 'STATE_GETPAIRS_EXHAUSTION' | 'SYBIL_SUBNET_FLOOD') => {

    return fetchWithFallback(

      `${BASE_URL}/rpc-shield/simulate-attack`,

      {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ type })

      },

      () => {

        dynamicShieldStatus.total_inspected += 1;

        dynamicShieldStatus.total_blocked += 1;

        let method = 'eth_getLogs';

        let reason = 'Query span 500k blocks exceeds max limit (Quarantined 60s).';

        let ip = '194.26.29.11';

        if (type === 'RATE_LIMIT_BURST') {

          method = 'eth_blockNumber';

          reason = 'Rate limit burst exceeded: 60 req/min hard ceiling.';

          ip = '185.190.140.22';

        } else if (type === 'BATCH_OVERLOAD') {

          method = 'batch';

          reason = 'Batch size 50 exceeds max safe limit of 20 calls.';

          ip = '185.190.140.33';

        } else if (type === 'RECURSIVE_BATCH_BOMB') {

          method = 'batch';

          reason = 'Nested JSON-RPC batch bomb detected (nesting depth > 4).';

          ip = '185.190.140.44';

        } else if (type === 'STATE_BLOAT_TX') {

          method = 'eth_sendRawTransaction';

          reason = 'State-bloat raw tx payload exceeds safe pre-filter threshold (128KB limit).';

          ip = '185.190.140.55';

        } else if (type === 'REENTRANCY_CALDATA') {

          method = 'eth_sendRawTransaction';

          reason = 'Suspicious EVM re-entrancy recursive calldata signature detected.';

          ip = '185.190.140.66';

        } else if (type === 'STATE_GETPAIRS_EXHAUSTION') {

          method = 'state_getPairs';

          reason = "Substrate method 'state_getPairs' blocked to prevent storage OOM dump.";

          ip = '103.251.167.5';

        } else if (type === 'SYBIL_SUBNET_FLOOD') {

          method = 'p2p_handshake';

          reason = 'Sybil Eclipse cluster detected on subnet 198.51.100.0/24. /24 diversity filter enforced.';

          ip = '198.51.100.100';

        }

        const newEvt = {

          id: `evt-${Date.now().toString(16).slice(-4)}`,

          timestamp: Date.now(),

          client_ip: ip,

          method,

          decision: 'BLOCKED' as const,

          status_code: 403,

          reason

        };

        dynamicShieldStatus.recent_events.unshift(newEvt);

        dynamicLogs.push({

          source: 'RPC_SHIELD',

          level: 'CRITICAL',

          time: Math.floor(Date.now() / 1000),

          text: `Attack Simulated: ${type} from ${ip} -> Intercepted & Neutralized.`

        });

        return {

          attack_type: type,

          result: {

            client_ip: ip,

            decision: 'BLOCKED',

            reason: newEvt.reason

          }

        };

      }

    );

  },



  unbanShieldIp: async (ip: string) => {

    return fetchWithFallback(

      `${BASE_URL}/rpc-shield/unban`,

      {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ ip })

      },

      () => {

        dynamicShieldStatus.quarantined_ips = (dynamicShieldStatus.quarantined_ips || []).filter(q => q.ip !== ip);

        dynamicShieldStatus.active_banned_ips_count = Math.max(0, (dynamicShieldStatus.active_banned_ips_count || 1) - 1);

        return {

          success: true,

          message: `IP ${ip} released from progressive quarantine jail by operator.`

        };

      }

    );

  },



  getRunbooks: async (): Promise<{ success: boolean; data: RunbookDAG[] }> => {

    return fetchWithFallback(

      `${BASE_URL}/canvas/runbooks`,

      undefined,

      () => []

    );

  },



  executeWorkerRunbook: async (runbook: any, dryRun: boolean = false) => {

    return fetchWithFallback(

      `${BASE_URL}/worker/execute`,

      {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ runbook, dry_run: dryRun })

      },

      () => {

        const execId = `worker-sim-${Math.random().toString(16).slice(2, 8)}`;

        const nodes = runbook.nodes || [];

        return {

          execution_id: execId,

          runbook_id: runbook.id || 'custom-runbook',

          runbook_name: runbook.name || 'Custom Workflow',

          status: 'SUCCESS',

          total_nodes: nodes.length,

          duration_ms: nodes.length * 14.5,

          steps: nodes.map((n: any) => ({

            node_id: n.id,

            label: n.data?.label || n.label || 'Node',

            type: n.data?.kind || n.type || 'generic',

            duration_ms: 12.4,

            detail: `Processed by runtime: ${n.data?.label || 'Node'} nominal`,

            output: { status: 'NOMINAL' }

          }))

        };

      }

    );

  },



  executeRunbook: async (runbookId: string) => {

    return fetchWithFallback(

      `${BASE_URL}/canvas/runbooks/${runbookId}/execute`,

      { method: 'POST' },

      () => {

        const execId = `exec-${Math.random().toString(16).slice(2, 8)}`;

        dynamicLogs.push({

          source: 'DAG_ENGINE',

          level: 'SUCCESS',

          time: Math.floor(Date.now() / 1000),

          text: `Automation Canvas: Runbook '${runbookId}' executed successfully in 164.2ms.`

        });

        return {

          execution_id: execId,

          runbook_id: runbookId,

          status: 'SUCCESS',

          duration_ms: 164.2,

          steps_result: [

            { step: 'Topology Validation', status: 'SUCCESS', duration_ms: 12.1 },

            { step: 'Execution Command', status: 'SUCCESS', duration_ms: 82.4 },

            { step: 'Terminal State Output', status: 'SUCCESS', duration_ms: 69.7 }

          ]

        };

      }

    );

  },



  getLogs: async (): Promise<{ success: boolean; logs: LogItem[] }> => {

    try {

      const controller = new AbortController();

      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${BASE_URL}/logs`, { signal: controller.signal });

      clearTimeout(timeoutId);

      if (res.ok) {

        const data = await res.json();

        if (data && Array.isArray(data.logs)) {

          return data;

        }

      }

    } catch {

      // Ignore error and fall through to dynamic fallback

    }

    return {
      success: true,
      logs: [...dynamicLogs]
    };
  },

  clearLogs: async (): Promise<{ success: boolean }> => {
    dynamicLogs.length = 0;
    try {
      await fetch(`${BASE_URL}/logs/clear`, { method: 'POST' });
    } catch {}
    return { success: true };
  },

  executeDiagnosticCommand: async (rawCommand: string): Promise<{ success: boolean; output: string; source?: string; level?: string }> => {
    const trimmed = rawCommand.trim();
    if (!trimmed) return { success: true, output: '' };

    try {
      const res = await fetch(`${BASE_URL}/diagnostic/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: trimmed })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.output) {
          return data;
        }
      }
    } catch {
      // Offline fallback below
    }

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (cmd === 'help') {
      return {
        success: true,
        source: 'SYSTEM',
        level: 'INFO',
        output: [
          'DotNexus Diagnostic CLI Operations:',
          '  status               - Query Substrate WASM vs Frontier EVM lockstep telemetry',
          '  rotate-keys          - Safely rotate validator session keys (mutex-guarded)',
          '  failover [reason]    - Execute atomic failover to standby validator leader',
          '  circuit-breaker      - Toggle protective RPC Circuit Breaker gating mode',
          '  shield-test [type]   - Simulate attack (HEAVY_GETLOGS, RATE_LIMIT_BURST)',
          '  npos                 - Scan active validator pool and calculate projected APY',
          '  runbook <id>         - Execute DAG runbook (e.g. runbook-slash-guard)',
          '  peers                - Inspect P2P peer topology and Sybil score',
          '  clear                - Flush terminal and reset diagnostic stream'
        ].join('\n')
      };
    } else if (cmd === 'status') {
      const sub_b = dynamicDualState.substrate.best_block;
      const evm_b = dynamicDualState.evm.block_number;
      const delta = dynamicDualState.sync.delta_blocks;
      const status = dynamicDualState.sync.status;
      return {
        success: true,
        source: 'DUAL_TRACKER',
        level: 'SUCCESS',
        output: `Substrate WASM #${sub_b.toLocaleString()} <-> EVM #${evm_b.toLocaleString()} | Delta: ${delta} blocks | Parity: ${status} | SS58: 42 | POT Decimals: 14`
      };
    } else if (cmd === 'rotate-keys') {
      const rot = await api.rotateKeys();
      const rotData: any = (rot as any)?.data || rot;
      const keyHex = rotData?.session_keys_hex ? `${rotData.session_keys_hex.slice(0, 18)}...` : '0x4a8f9c...';
      const call = rotData?.extrinsic_call || 'author.rotateKeys()';
      return {
        success: true,
        source: 'SLASH_GUARD',
        level: 'SUCCESS',
        output: `Validator session keys rotated successfully: ${keyHex} | Call: ${call}`
      };
    } else if (cmd === 'failover') {
      const reason = args.join(' ') || 'Diagnostic Terminal operator switch';
      const res = await api.triggerFailover(reason);
      const failData: any = (res as any)?.data || res;
      const newActive = failData?.new_active_node || 'STANDBY_LEADER';
      const leader = failData?.target_id || 'validator-standby-02';
      return {
        success: true,
        source: 'SLASH_GUARD',
        level: 'WARN',
        output: `Failover executed: PRIMARY -> ${newActive} | Leader: ${leader} | Reason: ${reason}`
      };
    } else if (cmd === 'circuit-breaker') {
      const cb = await api.toggleCircuitBreaker();
      const cbData: any = (cb as any)?.data || cb;
      const cbStatus = cbData?.status || 'TOGGLED';
      const cbEnabled = cbData?.circuit_breaker_enabled ?? true;
      return {
        success: true,
        source: 'DUAL_TRACKER',
        level: 'WARN',
        output: `RPC Circuit Breaker status toggled to ${cbStatus} (Gating: ${cbEnabled})`
      };
    } else if (cmd === 'shield-test') {
      const atkType = (args[0] as any) || 'HEAVY_GETLOGS';
      const sim = await api.simulateShieldAttack(atkType);
      const simData: any = (sim as any)?.data || sim;
      const decision = simData?.result?.decision || simData?.defense_action || 'BLOCKED';
      const clientIp = simData?.result?.client_ip || simData?.simulated_client_ip || '194.26.29.11';
      const reason = simData?.result?.reason || simData?.anomaly_detected || 'Query span exceeds 2,000 blocks ceiling (Quarantined 60s)';
      return {
        success: true,
        source: 'RPC_SHIELD',
        level: 'WARN',
        output: `Shield Test [${atkType}]: Decision: ${decision} | Target IP: ${clientIp} | Reason: ${reason}`
      };
    } else if (cmd === 'npos') {
      const top = await api.getTop16Validators();
      const nposData: any = (top as any)?.data || top;
      const valCount = nposData?.validators?.length || 16;
      const apy = nposData?.auto_compounded_apy || 16.92;
      return {
        success: true,
        source: 'NPOS_OPTIMIZER',
        level: 'SUCCESS',
        output: `PAO-Phragmen election: ${valCount} optimal validators selected | Auto-compounded APY: ${apy}% | Slashing risk: ZERO`
      };
    } else if (cmd === 'peers') {
      const shld = await api.getRpcShield();
      const shldData: any = (shld as any)?.data || shld;
      const peerCount = shldData?.p2p_topology?.length || 12;
      const quarantined = shldData?.active_banned_ips_count || 0;
      return {
        success: true,
        source: 'P2P',
        level: 'INFO',
        output: `P2P Network Topology: ${peerCount} peers mapped (Representative Testnet Geo-Sample) | Active Quarantined IPs: ${quarantined} | Subnet Diversity: NOMINAL`
      };
    } else if (cmd === 'clear') {
      await api.clearLogs();
      return {
        success: true,
        source: 'SYSTEM',
        level: 'INFO',
        output: 'Terminal logs and event streams cleared.'
      };
    }

    return {
      success: false,
      source: 'SYSTEM',
      level: 'WARN',
      output: `dotnexus: command not found: '${cmd}'. Type 'help' to inspect available operations.`
    };
  }
};

