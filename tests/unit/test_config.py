"""
Unit Tests for DotNexus Configuration Module
Verifies Pydantic schema parameters, SS58 format, Token Decimals, Scaling Multiplier,
Dead Man's Switch timing invariants, storage paths, and security tokens.
"""

import os
import unittest
from pathlib import Path
from engine.config import (
    CONFIG,
    EngineConfig,
    DATA_DIR,
    RUNBOOKS_DIR,
    LOCK_FILE,
    FAILOVER_STATE_FILE,
    LEASE_STORE_FILE,
    AUDIT_LOG_FILE,
)


class TestConfigParameters(unittest.TestCase):
    def test_chain_id_and_name(self):
        """Verifies Portaldot EVM Chain ID and network name specification"""
        self.assertEqual(CONFIG.evm_chain_id, 420420777)
        self.assertEqual(CONFIG.chain_name, "Portaldot Network V3.0")

    def test_ss58_format_prefix(self):
        """Verifies SS58 address prefix is 42 (native addresses begin with '5')"""
        self.assertEqual(CONFIG.ss58_format, 42)

    def test_token_decimals_and_scaling(self):
        """Verifies Substrate 14 decimals (Planck) vs EVM 18 decimals (Wei) and 10^4 scale factor"""
        self.assertEqual(CONFIG.token_symbol, "POT")
        self.assertEqual(CONFIG.default_token_decimals, 14)
        self.assertEqual(CONFIG.evm_standard_decimals, 18)
        self.assertEqual(CONFIG.decimal_scale_multiplier, 10000)

    def test_dead_mans_switch_timing_hierarchy(self):
        """Strict Invariant: Primary Self-Fence (10s) < Lease TTL (12s) < Standby Takeover (15s)"""
        self.assertLess(
            CONFIG.primary_self_fence_timeout,
            CONFIG.heartbeat_lock_lease_seconds,
            "Primary must self-fence before distributed lease expires"
        )
        self.assertLess(
            CONFIG.heartbeat_lock_lease_seconds,
            CONFIG.standby_takeover_delay,
            "Standby takeover delay must exceed lease validity to prevent double-signing"
        )

    def test_root_cause_thresholds(self):
        """Verifies 3-Tier Root-Cause delta and lag thresholds"""
        self.assertEqual(CONFIG.max_desync_block_delta, 2)
        self.assertEqual(CONFIG.p2p_min_peers, 2)
        self.assertEqual(CONFIG.p2p_stall_block_lag, 10)
        self.assertEqual(CONFIG.frontier_mapping_lag_threshold, 2)

    def test_rpc_shield_limits(self):
        """Verifies RPC Shield rate limits, batch size, and socket buffer sizes"""
        self.assertEqual(CONFIG.rpc_client_max_size, 256 * 1024)  # 256KB
        self.assertEqual(CONFIG.rpc_max_batch_size, 20)
        self.assertEqual(CONFIG.max_rpc_block_range, 2000)
        self.assertEqual(CONFIG.rpc_max_keys_paged, 250)
        self.assertEqual(CONFIG.rpc_rate_limit_per_minute, 60)

    def test_npos_staking_thresholds(self):
        """Verifies NPoS staking parameters and fee erosion multiplier"""
        self.assertEqual(CONFIG.top_validator_count, 16)
        self.assertEqual(CONFIG.min_validator_uptime, 98.0)
        self.assertEqual(CONFIG.max_acceptable_commission, 10.0)
        self.assertEqual(CONFIG.min_profit_fee_multiplier, 3.0)
        self.assertTrue(CONFIG.dry_run_default)

    def test_storage_directories_exist(self):
        """Verifies persistent data and runbook directories are valid paths and exist"""
        self.assertTrue(DATA_DIR.exists())
        self.assertTrue(DATA_DIR.is_dir())
        self.assertTrue(RUNBOOKS_DIR.exists())
        self.assertTrue(RUNBOOKS_DIR.is_dir())

    def test_state_file_paths_definitions(self):
        """Verifies state lock, lease, and audit log paths reside inside DATA_DIR"""
        self.assertEqual(LOCK_FILE.parent, DATA_DIR)
        self.assertEqual(FAILOVER_STATE_FILE.parent, DATA_DIR)
        self.assertEqual(LEASE_STORE_FILE.parent, DATA_DIR)
        self.assertEqual(AUDIT_LOG_FILE.parent, DATA_DIR)

    def test_cors_whitelist_contains_dev_origins(self):
        """Verifies local Vite frontend dev server origins are whitelisted"""
        self.assertIn("http://localhost:5173", CONFIG.cors_origins)
        self.assertIn("http://127.0.0.1:5173", CONFIG.cors_origins)

    def test_auth_api_token_format(self):
        """Verifies auth API secret token is non-empty and has sufficient entropy"""
        self.assertIsInstance(CONFIG.auth_api_token, str)
        self.assertGreaterEqual(len(CONFIG.auth_api_token), 16)

    def test_engine_network_binding(self):
        """Verifies default engine host and port bindings"""
        self.assertEqual(CONFIG.engine_host, "0.0.0.0")
        self.assertEqual(CONFIG.engine_port, 5050)

    def test_custom_config_instance_overrides(self):
        """Verifies EngineConfig model instantiation with custom field overrides"""
        custom = EngineConfig(
            evm_chain_id=999999,
            chain_name="Portaldot Private Devnet",
            ss58_format=0,
            token_symbol="CUSTOM"
        )
        self.assertEqual(custom.evm_chain_id, 999999)
        self.assertEqual(custom.chain_name, "Portaldot Private Devnet")
        self.assertEqual(custom.ss58_format, 0)
        self.assertEqual(custom.token_symbol, "CUSTOM")


if __name__ == "__main__":
    unittest.main()
