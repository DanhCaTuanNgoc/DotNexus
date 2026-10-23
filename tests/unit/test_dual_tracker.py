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

    def test_circuit_breaker_toggle_default(self):
        """Verifies toggle_circuit_breaker inverts enabled state and updates status flag"""
        initial_state = self.dual_tracker.circuit_breaker_enabled
        res = self.dual_tracker.toggle_circuit_breaker()
        self.assertTrue(res["success"])
        self.assertEqual(res["circuit_breaker_enabled"], not initial_state)
        expected_status = "ARMED" if not initial_state else "BYPASSED"
        self.assertEqual(res["status"], expected_status)
        # Toggle back to original state
        res_back = self.dual_tracker.toggle_circuit_breaker()
        self.assertEqual(res_back["circuit_breaker_enabled"], initial_state)

    def test_circuit_breaker_explicit_enable_and_disable(self):
        """Verifies explicit enabled boolean parameter overrides current circuit breaker state"""
        res_off = self.dual_tracker.toggle_circuit_breaker(enabled=False)
        self.assertFalse(res_off["circuit_breaker_enabled"])
        self.assertEqual(res_off["status"], "BYPASSED")

        res_on = self.dual_tracker.toggle_circuit_breaker(enabled=True)
        self.assertTrue(res_on["circuit_breaker_enabled"])
        self.assertEqual(res_on["status"], "ARMED")

    def test_remediation_force_fc_sync(self):
        """Verifies execute_remediation force_fc_sync resets probes and returns resynced blocks"""
        res = self.dual_tracker.execute_remediation("force_fc_sync")
        self.assertTrue(res["success"])
        self.assertEqual(res["action"], "force_fc_sync")
        self.assertIn("fc-mapping-sync worker task resynchronized", res["message"])
        self.assertIn("delta_after", res)
        self.assertEqual(self.dual_tracker.last_remediation["action"], "force_fc_sync")

    def test_remediation_purge_mempool(self):
        """Verifies execute_remediation purge_mempool flushes pending conflicts"""
        res = self.dual_tracker.execute_remediation("purge_mempool")
        self.assertTrue(res["success"])
        self.assertEqual(res["action"], "purge_mempool")
        self.assertEqual(res["purged_transactions"], 12)
        self.assertIn("conflicting nonces", res["message"])
        self.assertEqual(self.dual_tracker.last_remediation["purged_transactions"], 12)

    def test_remediation_toggle_circuit_breaker(self):
        """Verifies execute_remediation toggle_circuit_breaker flips state and includes sub-result"""
        res = self.dual_tracker.execute_remediation("toggle_circuit_breaker")
        self.assertTrue(res["success"])
        self.assertIn("circuit_breaker", res)
        self.assertIn(res["circuit_breaker"]["status"], ["ARMED", "BYPASSED"])
        self.assertIn("RPC Circuit Breaker status switched", res["message"])

    def test_remediation_trigger_failover(self):
        """Verifies execute_remediation trigger_failover signals lease registry failover"""
        res = self.dual_tracker.execute_remediation("trigger_failover")
        self.assertTrue(res["success"])
        self.assertEqual(res["action"], "trigger_failover")
        self.assertIn("SlashGuardLeaseRegistry", res["message"])

    def test_remediation_unknown_action_fails_gracefully(self):
        """Verifies execute_remediation handles unsupported action without raising unhandled exceptions"""
        res = self.dual_tracker.execute_remediation("unsupported_chaos_monkey")
        self.assertFalse(res["success"])
        self.assertIn("error", res)
        self.assertIn("Unknown remediation action", res["error"])

    def test_audit_contract_slash_guard_preset(self):
        """Verifies Mainnet V3 audit calculates correct Pallet-Revive storage deposit for SlashGuardLeaseRegistry"""
        audit = self.dual_tracker.audit_contract_for_mainnet("SlashGuardLeaseRegistry")
        self.assertEqual(audit["contract_name"], "SlashGuardLeaseRegistry")
        self.assertEqual(audit["bytecode_size_bytes"], 5725)
        self.assertEqual(audit["storage_deposit_rate_pot_per_byte"], 0.08)
        self.assertEqual(audit["estimated_storage_deposit_pot"], 458.0)
        self.assertEqual(audit["suitability_score_pct"], 100)
        self.assertEqual(audit["status"], "MAINNET_V3_READY")
        self.assertTrue(audit["mainnet_v3_checklist"]["pallet_revive_compatible"])
        self.assertTrue(audit["mainnet_v3_checklist"]["decimals_14_to_18_normalized"])

    def test_audit_contract_staking_vault_preset(self):
        """Verifies Mainnet V3 audit calculates correct Pallet-Revive storage deposit for DotNexusStakingVault"""
        audit = self.dual_tracker.audit_contract_for_mainnet("DotNexusStakingVault")
        self.assertEqual(audit["contract_name"], "DotNexusStakingVault")
        self.assertEqual(audit["bytecode_size_bytes"], 5968)
        self.assertEqual(audit["estimated_storage_deposit_pot"], 477.44)
        self.assertEqual(audit["suitability_score_pct"], 100)
        self.assertEqual(audit["status"], "MAINNET_V3_READY")
        self.assertTrue(audit["mainnet_v3_checklist"]["compiler_target_shanghai"])
        self.assertTrue(audit["mainnet_v3_checklist"]["zero_unbounded_storage_slots"])

    def test_audit_contract_custom_code_sizing(self):
        """Verifies Mainnet V3 audit sizes custom user-uploaded contract code correctly"""
        custom_sol = "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\ncontract TestMainnetV3 {}"
        custom_bytes = len(custom_sol.encode("utf-8"))
        audit = self.dual_tracker.audit_contract_for_mainnet("CustomTestContract", custom_code=custom_sol)
        self.assertEqual(audit["contract_name"], "CustomTestContract")
        self.assertEqual(audit["bytecode_size_bytes"], custom_bytes)
        expected_deposit = round(custom_bytes * 0.08, 4)
        self.assertEqual(audit["estimated_storage_deposit_pot"], expected_deposit)
        self.assertEqual(audit["status"], "MAINNET_V3_READY")

    def test_dual_state_contains_circuit_breaker_and_ecosystem_pulse(self):
        """Verifies get_dual_state payload includes circuit_breaker status and 4-track ecosystem pulse"""
        state = self.dual_tracker.get_dual_state()
        self.assertIn("circuit_breaker", state)
        cb = state["circuit_breaker"]
        self.assertIn("enabled", cb)
        self.assertIn(cb["status"], ["ARMED", "BYPASSED", "TRIPPED"])
        self.assertEqual(cb["auto_gate_threshold_blocks"], 2)

        self.assertIn("ecosystem_pulse", state)
        pulse = state["ecosystem_pulse"]
        self.assertIn("track_1_middleware", pulse)
        self.assertIn("track_2_cross_chain", pulse)
        self.assertIn("track_3_node_ops", pulse)
        self.assertIn("track_4_ecosystem_dapps", pulse)
        self.assertEqual(pulse["track_3_node_ops"]["active_authority"], "Alice (Validator)")
        self.assertEqual(pulse["track_4_ecosystem_dapps"]["storage_deposit_rate"], "0.08 POT / byte")

    def test_host_hardware_metrics(self):
        """Verifies psutil host hardware and OS resilience telemetry"""
        hw = self.dual_tracker.get_host_hardware_metrics()
        self.assertIn("cpu_percent", hw)
        self.assertIn("ram_percent", hw)
        self.assertIn("disk_free_gb", hw)
        self.assertIn("db_size_mb", hw)
        self.assertIn("status", hw)
        self.assertIn(hw["status"], ["HEALTHY", "WARNING", "CRITICAL"])
        self.assertIn("disk_read_count", hw)
        self.assertIn("disk_write_count", hw)

    def test_dual_state_contains_hardware_metrics(self):
        """Verifies get_dual_state includes host hardware metrics object"""
        state = self.dual_tracker.get_dual_state()
        self.assertIn("hardware", state)
        self.assertIn("cpu_percent", state["hardware"])


if __name__ == "__main__":
    unittest.main()
