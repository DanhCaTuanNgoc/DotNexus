"""
Unit Tests for Dual-Tracker & Cross-VM Sync Module
Verifies telemetry, 3-tier root-cause isolation, and decimal normalization.
"""

import unittest
from engine.dual_tracker import DualEngineTracker


class TestDualTrackerUnit(unittest.TestCase):
    def setUp(self):
        self.dual_tracker = DualEngineTracker()

    def test_dual_tracker_telemetry(self):
        """Verifies parallel telemetry probe from Substrate (:9944) and EVM (:8545)"""
        state = self.dual_tracker.get_dual_state()
        self.assertIn("substrate", state)
        self.assertIn("evm", state)
        self.assertIn("sync", state)
        self.assertIn("mempool", state)
        self.assertGreater(state["substrate"]["best_block"], 0)
        self.assertGreater(state["evm"]["block_number"], 0)
        self.assertIn(state["sync"]["status"], ["SYNCED", "MINIMAL_LAG", "DESYNC_WARNING", "DESYNC_CRITICAL"])
        self.assertGreaterEqual(state["mempool"]["total_pending"], 0)

    def test_dual_tracker_3tier_root_cause_and_decimals(self):
        """Verifies 3-Tier Root-Cause Isolation for Tier 1 (P2P Stall) and Tier 2 (fc-db Lag)"""
        # Tier 1: Substrate P2P Stall (peer count dropped or block lag > 10)
        sub_stall = {"best_block": 100, "highest_block": 120, "peers_count": 1}
        diag_stall = self.dual_tracker.diagnose_3tier_root_cause(sub_stall, {"block_number": 100})
        self.assertEqual(diag_stall["tier"], 1)
        self.assertEqual(diag_stall["root_cause_code"], "SUBSTRATE_P2P_STALL")
        self.assertEqual(diag_stall["severity"], "CRITICAL")

        # Tier 2: Frontier Mapping Sync Lag (fc-db bottleneck: lag >= 2)
        sub_healthy = {"best_block": 200, "highest_block": 200, "peers_count": 8}
        diag_lag = self.dual_tracker.diagnose_3tier_root_cause(sub_healthy, {"block_number": 195})
        self.assertEqual(diag_lag["tier"], 2)
        self.assertEqual(diag_lag["root_cause_code"], "FRONTIER_FC_DB_LAG")
        self.assertEqual(diag_lag["severity"], "WARNING")

        # Decimal Normalizer: 50 POT in Planck vs Wei
        sub_balance = 50 * (10 ** 14)
        evm_balance = 50 * (10 ** 18)
        norm = self.dual_tracker.normalize_pot_balance(sub_balance, evm_balance)
        self.assertTrue(norm["is_parity_clean"])
        self.assertEqual(norm["discrepancy_planck"], "0")
        self.assertEqual(norm["scale_factor"], 10000)

    def test_dual_tracker_tier3_evm_congestion_and_large_bigint(self):
        """Verifies Tier 3 EVM Virtual Machine Congestion and ultra-large BigInt precision"""
        sub_telemetry = {"best_block": 500, "highest_block": 500, "peers_count": 10, "pending_extrinsics": 5}
        evm_telemetry = {"block_number": 500, "pending_transactions": 85, "base_fee_gwei": 45.0}
        diag_evm = self.dual_tracker.diagnose_3tier_root_cause(sub_telemetry, evm_telemetry)
        self.assertEqual(diag_evm["tier"], 3)
        self.assertEqual(diag_evm["root_cause_code"], "EVM_VM_CONGESTION")
        self.assertEqual(diag_evm["severity"], "ELEVATED")

        # Ultra-large BigInt precision check (100,000,000 POT = 10^22 Planck)
        massive_pot_planck = 100_000_000 * (10 ** 14)
        massive_pot_wei = 100_000_000 * (10 ** 18)
        large_norm = self.dual_tracker.normalize_pot_balance(massive_pot_planck, massive_pot_wei)
        self.assertTrue(large_norm["is_parity_clean"])
        self.assertEqual(large_norm["pot_readable"], 100_000_000.0)
        self.assertEqual(large_norm["substrate_balance_planck"], str(massive_pot_planck))

    def test_causal_lag_index_formulation_and_diagnostics(self):
        """Verifies Cross-VM Causal Lag Index mathematical formula and heuristic diagnostics"""
        # 1. Nominal Parity Case (Sync delta 0, low queues)
        sub_nominal = {"best_block": 1000, "highest_block": 1000, "peers_count": 8, "pending_extrinsics": 4, "latency_ms": 15.0}
        evm_nominal = {"block_number": 1000, "pending_transactions": 6, "latency_ms": 18.0}
        cli_nominal = self.dual_tracker.compute_causal_lag_index(sub_nominal, evm_nominal)
        self.assertEqual(cli_nominal["classification"], "NOMINAL_PARITY")
        self.assertLess(cli_nominal["cli_score"], 35.0)
        self.assertEqual(cli_nominal["vector_breakdown"]["block_lag_vector"], 0.0)

        # 2. Frontier Mapping DB Lock Case (Block lag = 3 blocks)
        sub_lag = {"best_block": 1005, "highest_block": 1005, "peers_count": 8, "pending_extrinsics": 2, "latency_ms": 15.0}
        evm_lag = {"block_number": 1002, "pending_transactions": 3, "latency_ms": 20.0}
        cli_lag = self.dual_tracker.compute_causal_lag_index(sub_lag, evm_lag)
        self.assertEqual(cli_lag["classification"], "FRONTIER_DB_LOCK")
        self.assertGreaterEqual(cli_lag["vector_breakdown"]["block_lag_vector"], 0.4)
        self.assertIn("Substrate-to-EVM mapping bottleneck", cli_lag["diagnosis_message"])

        # 3. EVM Gas Saturation Case (Delta = 0, EVM mempool spike = 80 txs)
        sub_congested = {"best_block": 2000, "highest_block": 2000, "peers_count": 8, "pending_extrinsics": 5, "latency_ms": 15.0}
        evm_congested = {"block_number": 2000, "pending_transactions": 85, "latency_ms": 35.0}
        cli_gas = self.dual_tracker.compute_causal_lag_index(sub_congested, evm_congested)
        self.assertEqual(cli_gas["classification"], "EVM_GAS_SATURATION")
        self.assertGreaterEqual(cli_gas["vector_breakdown"]["mempool_skew_vector"], 3.0)

        # 4. Verified in get_dual_state() output
        state = self.dual_tracker.get_dual_state()
        self.assertIn("causal_lag_index", state)
        self.assertIn("cli_score", state["causal_lag_index"])
        self.assertIn("vector_breakdown", state["causal_lag_index"])


if __name__ == "__main__":
    unittest.main()
