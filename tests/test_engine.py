"""
Unit & Integration Test Suite for DotNexus Backend Engine
Covers Dual-Tracker, Slashing Guard, NPoS Optimizer, RPC Shield, and DAG Engine.
"""

import unittest
from engine.config import CONFIG, LOCK_FILE
from engine.dual_tracker import DualEngineTracker
from engine.slash_guard import SlashingGuard
from engine.npos_optimizer import NPoSOptimizer
from engine.rpc_shield import RPCShield
from engine.dag_engine import DAGCanvasEngine


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


if __name__ == "__main__":
    unittest.main()
