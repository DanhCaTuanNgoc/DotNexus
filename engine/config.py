"""
DotNexus Configuration Module
Centralized configuration parameters for Portaldot Network V3.0 Dual-VM operations.
Includes 3-Tier Root-Cause, Dead Man's Switch Fencing, Reverse Proxy, and Pre-Flight Staking thresholds.
"""

import os
from pathlib import Path
from pydantic import BaseModel, Field

# Base Directory Setup
ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / ".dotnexus_data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
RUNBOOKS_DIR = DATA_DIR / "runbooks"
RUNBOOKS_DIR.mkdir(parents=True, exist_ok=True)

LOCK_FILE = DATA_DIR / "validator_session.lock"
FAILOVER_STATE_FILE = DATA_DIR / "failover_state.json"
LEASE_STORE_FILE = DATA_DIR / "validator_lease.json"
AUDIT_LOG_FILE = DATA_DIR / "audit.log"


class EngineConfig(BaseModel):
    # Portaldot Network V3.0 Chain Parameters
    chain_name: str = "Portaldot Network V3.0"
    ss58_format: int = 42  # Standard Portaldot SS58 address prefix (addresses start with '5')
    token_symbol: str = "POT"
    default_token_decimals: int = 14  # 1 POT = 10^14 base units (Planck)
    evm_standard_decimals: int = 18   # Standard EVM Wei decimals (10^18)
    decimal_scale_multiplier: int = 10 ** (18 - 14)  # 10^4 = 10,000

    # RPC Endpoints
    substrate_ws_url: str = Field(
        default=os.getenv("PORTALDOT_WS_URL", "ws://127.0.0.1:9944"),
        description="Portaldot Substrate WebSocket RPC (WASM & Runtime consensus)"
    )
    evm_rpc_url: str = Field(
        default=os.getenv("PORTALDOT_EVM_URL", "http://127.0.0.1:8545"),
        description="Portaldot EVM JSON-RPC (Solidity / Frontier / Revive contracts)"
    )
    standby_ws_url: str = Field(
        default=os.getenv("PORTALDOT_STANDBY_WS_URL", "ws://127.0.0.1:9945"),
        description="Standby backup validator node RPC for Slashing Guard failover"
    )

    # Web Engine & Gateway
    engine_host: str = "0.0.0.0"
    engine_port: int = 5050
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
    auth_api_token: str = Field(
        default=os.getenv("DOTNEXUS_AUTH_TOKEN", "nexus-ops-secret-key-2026"),
        description="Mandatory Bearer token / X-DotNexus-Auth header for write endpoints"
    )

    # 3-Tier Root-Cause Isolation Thresholds (Dual-Tracker)
    max_desync_block_delta: int = 2           # Normal propagation threshold
    p2p_min_peers: int = 2                   # Tier 1: peers < 2 implies Substrate P2P Stall
    p2p_stall_block_lag: int = 10            # Tier 1: highestBlock - currentBlock > 10
    frontier_mapping_lag_threshold: int = 2  # Tier 2: fc-db bottleneck threshold

    # Dead Man's Switch & Fencing Lease Timing Invariants (Slashing Guard)
    # Invariant: Primary Self-Fence Timeout < Lease TTL < Standby Takeover Delay
    primary_self_fence_timeout: float = 10.0   # 10s: Primary suicide/keystore isolate if lease renew lost
    heartbeat_lock_lease_seconds: int = 12     # 12s: Distributed lease validity TTL
    standby_takeover_delay: float = 15.0       # 15s: Standby takeover delay with P2P port 30333 check
    heartbeat_miss_threshold: int = 2          # Fallback simulation consecutive miss threshold

    # RPC Shield & Reverse Proxy Defense
    rpc_client_max_size: int = 256 * 1024      # 256KB hard ceiling against JSON-bomb
    rpc_max_batch_size: int = 20               # Maximum allowed calls in single JSON-RPC batch
    max_rpc_block_range: int = 2000            # Maximum allowed eth_getLogs block span before blocking
    rpc_max_keys_paged: int = 250              # Maximum count allowed for state_getKeysPaged
    rpc_rate_limit_per_minute: int = 60        # Max RPC requests per client IP per minute

    # NPoS Staking & Pre-Flight Checks
    top_validator_count: int = 16              # Optimal nomination set size in NPoS
    min_validator_uptime: float = 98.0         # 98% uptime threshold for top scoring
    max_acceptable_commission: float = 10.0    # Commission ceiling preference (10%)
    min_profit_fee_multiplier: float = 3.0     # Expected APY gain * Stake must exceed 3x fee
    dry_run_default: bool = True               # Action nodes default to dry-run simulation mode

    # Local Mock Simulation mode toggle (when live node is not accessible)
    auto_fallback_simulation: bool = True


# Global Config Singleton
CONFIG = EngineConfig()
