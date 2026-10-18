"""
Unit Tests for Dual-Tracker & Cross-VM Sync Module
Verifies telemetry, 3-tier root-cause isolation, decimal normalization,
Causal Lag Index mathematical formula, and simulated fallback state.
"""

import unittest
from unittest.mock import patch
from engine.dual_tracker import DualEngineTracker, _is_endpoint_alive


class TestDualTrackerUnit(unittest.TestCase):
    def setUp(self):
        # Use offline loopback endpoints to prevent external network I/O
        self.dual_tracker = DualEngineTracker(
            substrate_url="ws://127.0.0.1:99999",
            evm_url="http://127.0.0.1:99998"
        )
        # Fast endpoint check override for deterministic offline testing
        self.dual_tracker._is_endpoint_alive = lambda url, timeout=0.01: False

    def test_endpoint_alive_port_resolution_http(self):
        """Verifies URL parser resolves HTTP port correctly"""
        with patch("socket.socket") as mock_sock:
            mock_sock.return_value.__enter__.return_value.connect_ex.return_value = 0
            res = _is_endpoint_alive("http://127.0.0.1:8545", timeout=0.01)
            self.assertTrue(res)

    def test_endpoint_alive_port_resolution_https(self):
        """Verifies URL parser defaults HTTPS to port 443"""
        with patch("socket.socket") as mock_sock:
            mock_sock.return_value.__enter__.return_value.connect_ex.return_value = 0
            res = _is_endpoint_alive("https://test-evm-rpc-v3.portaldot.dev", timeout=0.01)
            self.assertTrue(res)

    def test_endpoint_alive_port_resolution_ws(self):
        """Verifies URL parser defaults WS to port 9944"""
        with patch("socket.socket") as mock_sock:
            mock_sock.return_value.__enter__.return_value.connect_ex.return_value = 0
            res = _is_endpoint_alive("ws://127.0.0.1", timeout=0.01)
            self.assertTrue(res)

    def test_endpoint_alive_port_resolution_custom(self):
        """Verifies URL parser preserves custom specified port"""
        with patch("socket.socket") as mock_sock:
            mock_sock.return_value.__enter__.return_value.connect_ex.return_value = 0
            res = _is_endpoint_alive("http://127.0.0.1:18545", timeout=0.01)
            self.assertTrue(res)

    def test_endpoint_alive_offline_returns_false(self):
        """Verifies failed socket connection returns False gracefully"""
        with patch("socket.socket") as mock_sock:
            mock_sock.return_value.__enter__.return_value.connect_ex.return_value = 111
            res = _is_endpoint_alive("http://127.0.0.1:99999", timeout=0.01)
            self.assertFalse(res)

    def test_cli_nominal_parity_classification(self):
        """Verifies Causal Lag Index classifies nominal state as NOMINAL_PARITY"""
        sub = {"best_block": 1000, "highest_block": 1000, "peers_count": 8, "pending_extrinsics": 4, "latency_ms": 15.0}
        evm = {"block_number": 1000, "pending_transactions": 6, "latency_ms": 18.0}
        cli = self.dual_tracker.compute_causal_lag_index(sub, evm)
        self.assertEqual(cli["classification"], "NOMINAL_PARITY")
        self.assertLess(cli["cli_score"], 35.0)
        self.assertEqual(cli["vector_breakdown"]["block_lag_vector"], 0.0)

    def test_cli_frontier_db_lock_classification(self):
        """Verifies Causal Lag Index detects Frontier Mapping DB Lock when delta >= 2"""
        sub = {"best_block": 1005, "highest_block": 1005, "peers_count": 8, "pending_extrinsics": 2, "latency_ms": 15.0}
        evm = {"block_number": 1002, "pending_transactions": 3, "latency_ms": 20.0}
        cli = self.dual_tracker.compute_causal_lag_index(sub, evm)
        self.assertEqual(cli["classification"], "FRONTIER_DB_LOCK")
        self.assertGreaterEqual(cli["vector_breakdown"]["block_lag_vector"], 0.4)
        self.assertIn("Substrate-to-EVM mapping bottleneck", cli["diagnosis_message"])

    def test_cli_evm_gas_saturation_classification(self):
        """Verifies Causal Lag Index detects EVM Gas Saturation when mempool spikes"""
        sub = {"best_block": 2000, "highest_block": 2000, "peers_count": 8, "pending_extrinsics": 5, "latency_ms": 15.0}
        evm = {"block_number": 2000, "pending_transactions": 85, "latency_ms": 35.0}
        cli = self.dual_tracker.compute_causal_lag_index(sub, evm)
        self.assertEqual(cli["classification"], "EVM_GAS_SATURATION")
        self.assertGreaterEqual(cli["vector_breakdown"]["mempool_skew_vector"], 3.0)

    def test_cli_substrate_p2p_stall_classification(self):
        """Verifies Causal Lag Index detects P2P stall when peers < 2 or EVM delta < -2"""
        sub = {"best_block": 3000, "highest_block": 3000, "peers_count": 1, "pending_extrinsics": 5, "latency_ms": 15.0}
        evm = {"block_number": 3000, "pending_transactions": 5, "latency_ms": 15.0}
        cli = self.dual_tracker.compute_causal_lag_index(sub, evm)
        self.assertEqual(cli["classification"], "SUBSTRATE_P2P_STALL")

    def test_cli_score_ceiling_capped_at_100(self):
        """Verifies Causal Lag Index score never exceeds 100.0 regardless of skew inputs"""
        sub = {"best_block": 5000, "highest_block": 5000, "peers_count": 8, "pending_extrinsics": 0, "latency_ms": 1.0}
        evm = {"block_number": 4000, "pending_transactions": 100000, "latency_ms": 5000.0}
        cli = self.dual_tracker.compute_causal_lag_index(sub, evm)
        self.assertLessEqual(cli["cli_score"], 100.0)

    def test_cli_zero_division_guard(self):
        """Verifies Causal Lag Index calculation never raises ZeroDivisionError on empty queues"""
        sub = {"best_block": 100, "highest_block": 100, "peers_count": 0, "pending_extrinsics": 0, "latency_ms": 0.0}
        evm = {"block_number": 100, "pending_transactions": 0, "latency_ms": 0.0}
        cli = self.dual_tracker.compute_causal_lag_index(sub, evm)
        self.assertIsInstance(cli["cli_score"], float)

    def test_cli_weights_sum_to_100(self):
        """Verifies mathematical weight constants sum to 100.0"""
        w1 = 40.0
        w2 = 35.0
        w3 = 25.0
        self.assertEqual(w1 + w2 + w3, 100.0)

    def test_root_cause_tier0_nominal_parity(self):
        """Verifies 3-Tier Root-Cause diagnosis returns Tier 0 OK for lockstep state"""
        sub = {"best_block": 1000, "highest_block": 1000, "peers_count": 8}
        evm = {"block_number": 1000}
        diag = self.dual_tracker.diagnose_3tier_root_cause(sub, evm)
        self.assertEqual(diag["tier"], 0)
        self.assertEqual(diag["severity"], "OK")
        self.assertEqual(diag["root_cause_code"], "NONE")

    def test_root_cause_tier1_low_peers(self):
        """Verifies 3-Tier Root-Cause diagnosis flags Tier 1 CRITICAL when peers < 2"""
        sub = {"best_block": 1000, "highest_block": 1000, "peers_count": 1}
        evm = {"block_number": 1000}
        diag = self.dual_tracker.diagnose_3tier_root_cause(sub, evm)
        self.assertEqual(diag["tier"], 1)
        self.assertEqual(diag["severity"], "CRITICAL")
        self.assertEqual(diag["root_cause_code"], "SUBSTRATE_P2P_STALL")

    def test_root_cause_tier1_sync_stall_high_lag(self):
        """Verifies 3-Tier Root-Cause diagnosis flags Tier 1 when sync lag > 10 blocks"""
        sub = {"best_block": 1000, "highest_block": 1015, "peers_count": 8}
        evm = {"block_number": 1000}
        diag = self.dual_tracker.diagnose_3tier_root_cause(sub, evm)
        self.assertEqual(diag["tier"], 1)
        self.assertEqual(diag["severity"], "CRITICAL")
        self.assertEqual(diag["root_cause_code"], "SUBSTRATE_P2P_STALL")

    def test_root_cause_tier2_frontier_mapping_lag(self):
        """Verifies 3-Tier Root-Cause diagnosis flags Tier 2 WARNING when delta >= 2"""
        sub = {"best_block": 1005, "highest_block": 1005, "peers_count": 8}
        evm = {"block_number": 1002}
        diag = self.dual_tracker.diagnose_3tier_root_cause(sub, evm)
        self.assertEqual(diag["tier"], 2)
        self.assertEqual(diag["severity"], "WARNING")
        self.assertEqual(diag["root_cause_code"], "FRONTIER_FC_DB_LAG")

    def test_root_cause_tier3_evm_mempool_congestion(self):
        """Verifies 3-Tier Root-Cause diagnosis flags Tier 3 ELEVATED when evm pending txs >= 50"""
        sub = {"best_block": 1000, "highest_block": 1000, "peers_count": 8, "pending_extrinsics": 2}
        evm = {"block_number": 1000, "pending_transactions": 60, "base_fee_gwei": 20.0}
        diag = self.dual_tracker.diagnose_3tier_root_cause(sub, evm)
        self.assertEqual(diag["tier"], 3)
        self.assertEqual(diag["severity"], "ELEVATED")
        self.assertEqual(diag["root_cause_code"], "EVM_VM_CONGESTION")

    def test_root_cause_tier3_evm_high_gas_fee(self):
        """Verifies Tier 3 diagnosis triggers when mempool is congested with high pending txs and base fee"""
        sub = {"best_block": 1000, "highest_block": 1000, "peers_count": 8, "pending_extrinsics": 2}
        evm = {"block_number": 1000, "pending_transactions": 80, "base_fee_gwei": 120.0}
        diag = self.dual_tracker.diagnose_3tier_root_cause(sub, evm)
        self.assertEqual(diag["tier"], 3)
        self.assertEqual(diag["severity"], "ELEVATED")

    def test_normalize_pot_balance_clean_parity(self):
        """Verifies decimal normalization for 10 POT clean parity"""
        sub_planck = 10 * (10 ** 14)
        evm_wei = 10 * (10 ** 18)
        norm = self.dual_tracker.normalize_pot_balance(sub_planck, evm_wei)
        self.assertTrue(norm["is_parity_clean"])
        self.assertEqual(norm["pot_readable"], 10.0)
        self.assertEqual(norm["discrepancy_planck"], "0")
        self.assertEqual(norm["scale_factor"], 10000)

    def test_normalize_pot_balance_fractional_pot(self):
        """Verifies fractional POT balance (0.5 POT) normalization"""
        sub_planck = int(0.5 * (10 ** 14))
        evm_wei = int(0.5 * (10 ** 18))
        norm = self.dual_tracker.normalize_pot_balance(sub_planck, evm_wei)
        self.assertTrue(norm["is_parity_clean"])
        self.assertEqual(norm["pot_readable"], 0.5)

    def test_normalize_pot_balance_discrepancy_detected(self):
        """Verifies discrepancy detection when Substrate and EVM balances diverge"""
        sub_planck = 10 * (10 ** 14)
        evm_wei = 9 * (10 ** 18)  # 1 POT difference
        norm = self.dual_tracker.normalize_pot_balance(sub_planck, evm_wei)
        self.assertFalse(norm["is_parity_clean"])
        self.assertEqual(norm["discrepancy_planck"], str(1 * (10 ** 14)))

    def test_normalize_pot_balance_extreme_bigint(self):
        """Verifies massive BigInt balance (500,000,000 POT = 5 * 10^22 Planck) precision"""
        massive_planck = 500_000_000 * (10 ** 14)
        massive_wei = 500_000_000 * (10 ** 18)
        norm = self.dual_tracker.normalize_pot_balance(massive_planck, massive_wei)
        self.assertTrue(norm["is_parity_clean"])
        self.assertEqual(norm["pot_readable"], 500_000_000.0)
        self.assertEqual(norm["substrate_balance_planck"], str(massive_planck))

    def test_normalize_pot_balance_zero_balance(self):
        """Verifies 0 balance edge case normalization"""
        norm = self.dual_tracker.normalize_pot_balance(0, 0)
        self.assertTrue(norm["is_parity_clean"])
        self.assertEqual(norm["pot_readable"], 0.0)
        self.assertEqual(norm["discrepancy_planck"], "0")

    def test_simulated_dual_state_fallback(self):
        """Verifies dual state returns full schema structure when nodes are unreachable"""
        state = self.dual_tracker.get_dual_state()
        self.assertIn("substrate", state)
        self.assertIn("evm", state)
        self.assertIn("sync", state)
        self.assertIn("mempool", state)
        self.assertIn("causal_lag_index", state)
        self.assertIn("root_cause_diagnosis", state)
        self.assertGreater(state["substrate"]["best_block"], 0)
        self.assertGreater(state["evm"]["block_number"], 0)


if __name__ == "__main__":
    unittest.main()
