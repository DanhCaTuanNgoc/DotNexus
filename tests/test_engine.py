"""
Unit & Integration Test Suite for DotNexus Backend Engine
Covers Dual-Tracker (3-Tier & Decimals), Slashing Guard (Dead Man's Switch & V14 Keys),
NPoS Optimizer (Phragmén Simulator & Pre-Flight Checks), RPC Shield (Reverse Proxy, Safe Logs & Batches),
and DAG Engine / Headless Worker Daemon.
"""

import unittest
from engine.config import CONFIG, LOCK_FILE
from engine.dual_tracker import DualEngineTracker
from engine.slash_guard import SlashingGuard
from engine.npos_optimizer import NPoSOptimizer
from engine.rpc_shield import RPCShield
from engine.dag_engine import DAGCanvasEngine
from engine.worker_daemon import HeadlessWorkerDaemon


class TestDotNexusEngine(unittest.TestCase):
    def setUp(self):
        if LOCK_FILE.exists():
            try:
                import os
                os.remove(LOCK_FILE)
            except Exception:
                pass
        self.dual_tracker = DualEngineTracker()
        self.slash_guard = SlashingGuard()
        self.npos_optimizer = NPoSOptimizer()
        self.rpc_shield = RPCShield()
        self.dag_engine = DAGCanvasEngine()
        self.worker_daemon = HeadlessWorkerDaemon()

    def test_01_config_parameters(self):
        self.assertEqual(CONFIG.ss58_format, 42, "SS58 format must be 42 for Portaldot")
        self.assertEqual(CONFIG.token_symbol, "POT", "Token symbol must be POT")
        self.assertEqual(CONFIG.default_token_decimals, 14, "Token decimals should default to 14")
        self.assertEqual(CONFIG.max_desync_block_delta, 2)
        self.assertEqual(CONFIG.heartbeat_miss_threshold, 2)

    def test_02_dual_tracker_telemetry(self):
        state = self.dual_tracker.get_dual_state()
        self.assertIn("substrate", state)
        self.assertIn("evm", state)
        self.assertIn("sync", state)
        self.assertIn("mempool", state)
        self.assertGreater(state["substrate"]["best_block"], 0)
        self.assertGreater(state["evm"]["block_number"], 0)
        self.assertIn(state["sync"]["status"], ["SYNCED", "MINIMAL_LAG", "DESYNC_WARNING", "DESYNC_CRITICAL"])
        self.assertGreaterEqual(state["mempool"]["total_pending"], 0)

    def test_03_slash_guard_key_rotation(self):
        rot = self.slash_guard.rotate_session_keys()
        self.assertIn("session_keys_hex", rot)
        self.assertTrue(rot["session_keys_hex"].startswith("0x"))
        self.assertIn("babe_pubkey", rot)
        self.assertIn("grandpa_pubkey", rot)
        self.assertIn("im_online_pubkey", rot)

    def test_04_slash_guard_anti_equivocation_lock(self):
        lease1 = self.slash_guard.acquire_signing_lease("node-alpha")
        self.assertTrue(lease1["acquired"])

        # Another node trying to acquire before expiration should be denied
        lease2 = self.slash_guard.acquire_signing_lease("node-beta")
        self.assertFalse(lease2["acquired"])
        self.assertIn("already acquired", lease2["reason"])

    def test_05_slash_guard_failover(self):
        current_node = self.slash_guard.active_node
        res = self.slash_guard.execute_failover(reason="Unit test failover")
        self.assertTrue(res["success"])
        self.assertNotEqual(res["previous_node"], res["new_active_node"])

    def test_06_npos_validator_scoring(self):
        validators = self.npos_optimizer.scan_validators(force_refresh=True)
        self.assertGreater(len(validators), 0)

        # Check that high commission and oversubscribed nodes are penalized
        for val in validators:
            if val["commission_pct"] >= 100.0 or val["is_oversubscribed"]:
                self.assertEqual(val["recommendation"], "REJECT_UNFAVORABLE")

    def test_07_npos_top_16_recommendation(self):
        top_rec = self.npos_optimizer.get_top_16_recommendation()
        self.assertGreater(top_rec["top_validators_count"], 0)
        self.assertLessEqual(top_rec["top_validators_count"], 16)
        self.assertGreater(top_rec["auto_compounded_apy"], top_rec["average_nominal_apy"])
        self.assertIn("targets", top_rec)

    def test_08_rpc_shield_heavy_getlogs_defense(self):
        # Normal query - should pass
        res_normal = self.rpc_shield.inspect_request(
            client_ip="1.2.3.4",
            method="eth_getLogs",
            params=[{"fromBlock": "0x10", "toBlock": "0x20"}]
        )
        self.assertEqual(res_normal["decision"], "ALLOWED")

        # Heavy query (> 2000 blocks) - should be blocked
        res_heavy = self.rpc_shield.inspect_request(
            client_ip="1.2.3.4",
            method="eth_getLogs",
            params=[{"fromBlock": "0x1", "toBlock": "0x5000"}]
        )
        self.assertEqual(res_heavy["decision"], "BLOCKED")
        self.assertIn("exceeds max safe limit", res_heavy["reason"])

    def test_09_rpc_shield_rate_limiting(self):
        test_ip = "9.9.9.9"
        # Fill quota
        for _ in range(CONFIG.rpc_rate_limit_per_minute):
            self.rpc_shield.inspect_request(client_ip=test_ip, method="eth_blockNumber")

        # Next request must be throttled
        res_throttled = self.rpc_shield.inspect_request(client_ip=test_ip, method="eth_blockNumber")
        self.assertEqual(res_throttled["decision"], "THROTTLED")
        self.assertEqual(res_throttled["status_code"], 429)

    def test_10_dag_runbook_execution(self):
        runbooks = self.dag_engine.get_runbooks()
        self.assertGreaterEqual(len(runbooks), 3)

        for rb in runbooks:
            exec_res = self.dag_engine.execute_runbook(rb["id"])
            self.assertEqual(exec_res["status"], "COMPLETED_SUCCESSFULLY")
            self.assertGreater(len(exec_res["steps"]), 0)

    def test_11_dual_tracker_3tier_root_cause_and_decimals(self):
        # 1. Test 3-Tier root-cause diagnoses
        sub_stall = {"best_block": 100, "highest_block": 120, "peers_count": 1}
        diag_stall = self.dual_tracker.diagnose_3tier_root_cause(sub_stall, {"block_number": 100})
        self.assertEqual(diag_stall["tier"], 1)
        self.assertEqual(diag_stall["root_cause_code"], "SUBSTRATE_P2P_STALL")

        # Tier 2: fc-db mapping sync lag
        sub_healthy = {"best_block": 200, "highest_block": 200, "peers_count": 8}
        diag_lag = self.dual_tracker.diagnose_3tier_root_cause(sub_healthy, {"block_number": 195})
        self.assertEqual(diag_lag["tier"], 2)
        self.assertEqual(diag_lag["root_cause_code"], "FRONTIER_FC_DB_LAG")

        # 2. Test Decimal normalizer (14 vs 18 decimals)
        sub_balance = 50 * (10 ** 14)
        evm_balance = 50 * (10 ** 18)
        norm = self.dual_tracker.normalize_pot_balance(sub_balance, evm_balance)
        self.assertTrue(norm["is_parity_clean"])
        self.assertEqual(norm["discrepancy_planck"], "0")
        self.assertEqual(norm["scale_factor"], 10000)

    def test_12_dead_mans_switch_and_v14_session_keys(self):
        # 1. Timing Invariant Verification
        self.assertLess(CONFIG.primary_self_fence_timeout, CONFIG.heartbeat_lock_lease_seconds)
        self.assertLess(CONFIG.heartbeat_lock_lease_seconds, CONFIG.standby_takeover_delay)

        # 2. Key Rotation with Metadata V14 4-key unpacking
        rot = self.slash_guard.rotate_session_keys()
        self.assertIn("keys_struct_v14", rot)
        keys_v14 = rot["keys_struct_v14"]
        self.assertIn("babe", keys_v14)
        self.assertIn("grandpa", keys_v14)
        self.assertIn("im_online", keys_v14)
        self.assertIn("authority_discovery", keys_v14)
        self.assertEqual(len(keys_v14["babe"]), 66)  # 0x + 64 hex chars = 32 bytes

    def test_13_rpc_shield_batch_and_storage_defense(self):
        # 1. Batch size limit defense (> 20)
        res_batch = self.rpc_shield.inspect_request(
            client_ip="5.5.5.5",
            method="batch",
            is_batch=True,
            batch_size=25
        )
        self.assertEqual(res_batch["decision"], "BLOCKED")
        self.assertIn("Batch size 25 exceeds", res_batch["reason"])

        # 2. Safe eth_getLogs block tag parser
        res_tag = self.rpc_shield.inspect_request(
            client_ip="5.5.5.5",
            method="eth_getLogs",
            params=[{"fromBlock": "earliest", "toBlock": "latest"}]
        )
        # 4120911 - 0 = 4,120,911 > 2000 -> safely blocked without ValueError crash
        self.assertEqual(res_tag["decision"], "BLOCKED")

        # 3. Substrate storage defense: state_getPairs blocked
        res_pairs = self.rpc_shield.inspect_request(client_ip="6.6.6.6", method="state_getPairs")
        self.assertEqual(res_pairs["decision"], "BLOCKED")

    def test_14_npos_phragmen_and_preflight_checks(self):
        # 1. Client-side Sequential Phragmén Simulation
        rec = self.npos_optimizer.get_top_16_recommendation()
        self.assertEqual(rec["election_algorithm"], "Client-Side Sequential Phragmén Simulator")
        self.assertEqual(len(rec["targets"]), 16)

        # 2. Pre-flight verification (Fee Erosion check)
        passed, reason = self.npos_optimizer.verify_pre_flight_nomination(
            bonded_stake_pot=100.0,
            expected_apy_gain_pct=0.0001,  # Tiny gain
            estimated_fee_pot=1.0          # High fee
        )
        self.assertFalse(passed)
        self.assertIn("Fee Erosion", reason)

    def test_15_headless_worker_daemon_kahn_tiers(self):
        sample_rb = self.dag_engine.get_runbooks()[0]
        exec_res = self.worker_daemon.execute_runbook_pipeline(sample_rb, dry_run=True)
        self.assertEqual(exec_res["status"], "COMPLETED_SUCCESSFULLY")
        self.assertTrue(exec_res["dry_run"])
        self.assertGreater(exec_res["tiers_count"], 0)


if __name__ == "__main__":
    unittest.main()
