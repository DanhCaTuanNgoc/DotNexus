"""
DotNexus Configuration Module
Centralized configuration parameters for Portaldot Network V3.0 Dual-VM operations.
"""

import os
from pathlib import Path
from pydantic import BaseModel, Field

# Base Directory Setup
ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / ".dotnexus_data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
LOCK_FILE = DATA_DIR / "validator_session.lock"
FAILOVER_STATE_FILE = DATA_DIR / "failover_state.json"


class EngineConfig(BaseModel):
    # Portaldot Network V3.0 Chain Parameters
    chain_name: str = "Portaldot Network V3.0"
    ss58_format: int = 42  # Standard Portaldot SS58 address prefix (addresses start with '5')
    token_symbol: str = "POT"
    default_token_decimals: int = 14  # 1 POT = 10^14 base units (dynamic runtime override supported)

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

    # Security & Monitoring Thresholds
    max_desync_block_delta: int = 2       # Alert if EVM and Substrate block delta > 2
    heartbeat_miss_threshold: int = 2     # Trigger failover if node misses 2 consecutive blocks
    max_rpc_block_range: int = 2000       # Maximum allowed eth_getLogs block span before blocking
    rpc_rate_limit_per_minute: int = 60   # Max RPC requests per client IP per minute

    # Top Validator Selection for NPoS
    top_validator_count: int = 16         # Optimal nomination set size in NPoS
    min_validator_uptime: float = 98.0    # 98% uptime threshold for top scoring
    max_acceptable_commission: float = 10.0  # Commission ceiling preference (10%)

    # Local Mock Simulation mode toggle (when live node is not accessible)
    auto_fallback_simulation: bool = True


# Global Config Singleton
CONFIG = EngineConfig()
