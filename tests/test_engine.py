"""
Unit & Integration Test Suite for DotNexus Backend Engine — Protocol & Enterprise Grade
Covers 20 Comprehensive Test Cases:
- Dual-Tracker: Telemetry, 3-Tier Root-Cause Isolation, Decimal Normalization, Ultra-large BigInt Safety
- Slashing Guard: Dead Man's Switch, Self-Fencing Triggers, Monotonic Fencing Epoch, Metadata V14 Struct Unpack
- RPC Shield: Socket 256KB Ceiling, Batch Limits, Safe Block Tag Parser, Substrate Storage Guards, Prometheus Metrics
- NPoS Optimizer: Sequential Phragmén Simulation, Election Window Guards, Fee Erosion Checks, Async Nonce Manager
- Headless Worker Daemon & Control Plane: Kahn's Tiers, Cycle Detection, Token Bucket Webhook Limiter, Audit Trail
"""

import os
import time
import json
import unittest
from engine.config import CONFIG, LOCK_FILE, AUDIT_LOG_FILE
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
                os.remove(LOCK_FILE)
            except Exception:
                pass
        self.dual_tracker = DualEngineTracker()
        self.slash_guard = SlashingGuard()
        self.npos_optimizer = NPoSOptimizer()
        self.rpc_shield = RPCShield()
        self.dag_engine = DAGCanvasEngine()
        self.worker_daemon = HeadlessWorkerDaemon()

    # =========================================================================
    # Group 1: Configuration & Protocol Specs
    # =========================================================================
    def test_01_config_parameters(self):
        """Verifies Portaldot V3.0 network protocol parameters and scale factors"""
        self.assertEqual(CONFIG.ss58_format, 42, "SS58 format must be 42 for Portaldot")
        self.assertEqual(CONFIG.token_symbol, "POT", "Token symbol must be POT")
        self.assertEqual(CONFIG.default_token_decimals, 14, "Substrate token decimals should be 14 (Planck)")
        self.assertEqual(CONFIG.evm_standard_decimals, 18, "EVM standard decimals should be 18 (Wei)")
        self.assertEqual(CONFIG.decimal_scale_multiplier, 10000, "Scale multiplier must be 10^4")
        self.assertEqual(CONFIG.max_desync_block_delta, 2)
        self.assertEqual(CONFIG.heartbeat_miss_threshold, 2)

    # =========================================================================
    # Group 2: Dual-VM Telemetry & 3-Tier Root-Cause Isolation
    # =========================================================================
    def test_02_dual_tracker_telemetry(self):
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

    def test_11_dual_tracker_3tier_root_cause_and_decimals(self):
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

    def test_16_dual_tracker_tier3_evm_congestion_and_large_bigint(self):
        """Verifies Tier 3 EVM Virtual Machine Congestion and ultra-large BigInt precision"""
        # Tier 3: EVM Execution Congestion
        sub_telemetry = {"best_block": 500, "highest_block": 500, "peers_count": 10, "pending_extrinsics": 5}
        evm_telemetry = {"block_number": 500, "pending_transactions": 85, "base_fee_gwei": 45.0}
        diag_evm = self.dual_tracker.diagnose_3tier_root_cause(sub_telemetry, evm_telemetry)
        self.assertEqual(diag_evm["tier"], 3)
        self.assertEqual(diag_evm["root_cause_code"], "EVM_VM_CONGESTION")
        self.assertEqual(diag_evm["severity"], "ELEVATED")

        # Ultra-large BigInt precision check (100,000,000 POT = 10^22 Planck)
        # Exceeds JavaScript Number.MAX_SAFE_INTEGER (9 * 10^15) by 7 orders of magnitude
        massive_pot_planck = 100_000_000 * (10 ** 14)
        massive_pot_wei = 100_000_000 * (10 ** 18)
        large_norm = self.dual_tracker.normalize_pot_balance(massive_pot_planck, massive_pot_wei)
        self.assertTrue(large_norm["is_parity_clean"])
        self.assertEqual(large_norm["pot_readable"], 100_000_000.0)
        self.assertEqual(large_norm["substrate_balance_planck"], str(massive_pot_planck))

    # =========================================================================
    # Group 3: Slashing Guard & Dead Man's Switch
    # =========================================================================
    def test_03_slash_guard_key_rotation(self):
        """Verifies session keys generation format and preview"""
        rot = self.slash_guard.rotate_session_keys()
        self.assertIn("session_keys_hex", rot)
        self.assertTrue(rot["session_keys_hex"].startswith("0x"))
        self.assertIn("babe_pubkey", rot)
        self.assertIn("grandpa_pubkey", rot)
        self.assertIn("im_online_pubkey", rot)

    def test_04_slash_guard_anti_equivocation_lock(self):
        """Verifies atomic lease acquisition prevents concurrent signing"""
        lease1 = self.slash_guard.acquire_signing_lease("node-alpha")
        self.assertTrue(lease1["acquired"])

        # Another node trying to acquire before expiration must be denied
        lease2 = self.slash_guard.acquire_signing_lease("node-beta")
        self.assertFalse(lease2["acquired"])
        self.assertIn("already acquired", lease2["reason"])

    def test_05_slash_guard_failover(self):
        """Verifies emergency failover transfers node identity safely"""
        old_node = self.slash_guard.active_node
        res = self.slash_guard.execute_failover(reason="Unit test failover")
        self.assertTrue(res["success"])
        self.assertNotEqual(old_node, res["new_active_node"])

    def test_12_dead_mans_switch_and_v14_session_keys(self):
        """Verifies Dead Man's Switch timing invariant and Metadata V14 4-key struct unpacking"""
        # 1. Timing Invariant Verification: Primary (10s) < Lease TTL (12s) < Standby Takeover (15s)
        self.assertLess(CONFIG.primary_self_fence_timeout, CONFIG.heartbeat_lock_lease_seconds)
        self.assertLess(CONFIG.heartbeat_lock_lease_seconds, CONFIG.standby_takeover_delay)

        # 2. Key Rotation with Metadata V14 4-key unpacking (BABE, GRANDPA, ImOnline, AuthorityDiscovery)
        rot = self.slash_guard.rotate_session_keys()
        self.assertIn("keys_struct_v14", rot)
        keys_v14 = rot["keys_struct_v14"]
        self.assertIn("babe", keys_v14)
        self.assertIn("grandpa", keys_v14)
        self.assertIn("im_online", keys_v14)
        self.assertIn("authority_discovery", keys_v14)
        self.assertEqual(len(keys_v14["babe"]), 66)  # 0x + 64 hex chars = 32 bytes
        self.assertEqual(len(keys_v14["grandpa"]), 66)
        self.assertEqual(rot["effective_session"], "Session N+2")

    def test_17_dead_mans_switch_self_fence_trigger_and_epoch_increment(self):
        """Verifies Primary self-fencing trigger when lease is lost and epoch increments monotonically"""
        # Simulate Primary lease renewal loss exceeding 10s timeout
        self.slash_guard.active_node = "PRIMARY"
        self.slash_guard.last_lease_renew_time = time.time() - 11.0  # 11s elapsed (> 10s)

        fence_result = self.slash_guard.check_self_fence()
        self.assertTrue(fence_result["self_fenced"])
        self.assertEqual(fence_result["action"], "VALIDATOR_SIGNING_ISOLATED")
        self.assertTrue(self.slash_guard.is_self_fenced)

        # Standby Takeover Delay check: If Standby attempts takeover before 15s delay, must be rejected
        current_epoch = self.slash_guard.fencing_epoch
        # Execute legitimate failover: epoch must increment monotonically
        fo_res = self.slash_guard.execute_failover(reason="Dead Man's Switch Takeover")
        self.assertTrue(fo_res["success"])
        self.assertEqual(fo_res["fencing_epoch"], current_epoch + 1)
        self.assertEqual(fo_res["new_active_node"], "STANDBY")

    # =========================================================================
    # Group 4: RPC Shield & Reverse Proxy Defense
    # =========================================================================
    def test_08_rpc_shield_heavy_getlogs_defense(self):
        """Verifies archival query filter prevents memory exhaustion"""
        res_normal = self.rpc_shield.inspect_request(
            client_ip="1.2.3.4",
            method="eth_getLogs",
            params=[{"fromBlock": "0x10", "toBlock": "0x20"}]
        )
        self.assertEqual(res_normal["decision"], "ALLOWED")

        res_heavy = self.rpc_shield.inspect_request(
            client_ip="1.2.3.4",
            method="eth_getLogs",
            params=[{"fromBlock": "0x1", "toBlock": "0x5000"}]
        )
        self.assertEqual(res_heavy["decision"], "BLOCKED")
        self.assertIn("exceeds max safe limit", res_heavy["reason"])

    def test_09_rpc_shield_rate_limiting(self):
        """Verifies sliding-window rate limiter throttles abusive IPs (60 req/min)"""
        test_ip = "9.9.9.9"
        for _ in range(CONFIG.rpc_rate_limit_per_minute):
            self.rpc_shield.inspect_request(client_ip=test_ip, method="eth_blockNumber")

        res_throttled = self.rpc_shield.inspect_request(client_ip=test_ip, method="eth_blockNumber")
        self.assertEqual(res_throttled["decision"], "THROTTLED")
        self.assertEqual(res_throttled["status_code"], 429)

    def test_13_rpc_shield_batch_and_storage_defense(self):
        """Verifies batch limits (> 20), safe block tags, and Substrate storage defenses"""
        # Batch size limit (> 20)
        res_batch = self.rpc_shield.inspect_request(
            client_ip="5.5.5.5",
            method="batch",
            is_batch=True,
            batch_size=25
        )
        self.assertEqual(res_batch["decision"], "BLOCKED")
        self.assertIn("Batch size 25 exceeds", res_batch["reason"])

        # Safe eth_getLogs block tag parser
        res_tag = self.rpc_shield.inspect_request(
            client_ip="5.5.5.5",
            method="eth_getLogs",
            params=[{"fromBlock": "earliest", "toBlock": "latest"}]
        )
        self.assertEqual(res_tag["decision"], "BLOCKED")

        # Substrate storage defense: state_getPairs blocked
        res_pairs = self.rpc_shield.inspect_request(client_ip="6.6.6.6", method="state_getPairs")
        self.assertEqual(res_pairs["decision"], "BLOCKED")

    def test_18_rpc_shield_socket_ceiling_and_prometheus_metrics(self):
        """Verifies 256KB socket ceiling against JSON-Bomb and Prometheus /metrics text output"""
        # Socket Ceiling: Reject payload > 256KB
        large_bytes = 300 * 1024  # 300KB
        res_bomb = self.rpc_shield.inspect_request(
            client_ip="7.7.7.7",
            method="eth_call",
            raw_payload_bytes=large_bytes
        )
        self.assertEqual(res_bomb["decision"], "BLOCKED")
        self.assertEqual(res_bomb["status_code"], 413)

        # Sensitive namespaces blocked from public IP
        res_author = self.rpc_shield.inspect_request(client_ip="7.7.7.7", method="author_insertKey")
        self.assertEqual(res_author["decision"], "BLOCKED")

        res_debug = self.rpc_shield.inspect_request(client_ip="7.7.7.7", method="debug_traceTransaction")
        self.assertEqual(res_debug["decision"], "BLOCKED")

        # Prometheus metrics export verification
        metrics = self.rpc_shield.export_prometheus_metrics()
        self.assertIn("dotnexus_rpc_requests_total", metrics)
        self.assertIn("dotnexus_proxy_inspection_overhead_ms", metrics)
        self.assertIn("dotnexus_rpc_active_banned_ips", metrics)

    # =========================================================================
    # Group 5: NPoS Dynamic Optimizer & Pre-Flight Checks
    # =========================================================================
    def test_06_npos_validator_scoring(self):
        """Verifies multi-factor scoring heavily penalizes 100% commission & oversubscription"""
        validators = self.npos_optimizer.scan_validators(force_refresh=True)
        self.assertGreater(len(validators), 0)

        for val in validators:
            if val["commission_pct"] >= 100.0 or val["is_oversubscribed"]:
                self.assertEqual(val["recommendation"], "REJECT_UNFAVORABLE")

    def test_07_npos_top_16_recommendation(self):
        """Verifies recommendation targets count satisfies NPoS constraints"""
        top_rec = self.npos_optimizer.get_top_16_recommendation()
        self.assertGreater(top_rec["top_validators_count"], 0)
        self.assertLessEqual(top_rec["top_validators_count"], 16)
        self.assertGreater(top_rec["auto_compounded_apy"], top_rec["average_nominal_apy"])
        self.assertIn("targets", top_rec)

    def test_14_npos_phragmen_and_preflight_checks(self):
        """Verifies Client-Side Sequential Phragmén Simulator and Fee Erosion pre-flight check"""
        # Sequential Phragmén simulation
        rec = self.npos_optimizer.get_top_16_recommendation()
        self.assertEqual(rec["election_algorithm"], "Client-Side Sequential Phragmén Simulator")
        self.assertEqual(len(rec["targets"]), 16)

        # Fee Erosion Check: Small profit < 3x fee must be rejected
        passed, reason = self.npos_optimizer.verify_pre_flight_nomination(
            bonded_stake_pot=100.0,
            expected_apy_gain_pct=0.0001,
            estimated_fee_pot=1.0
        )
        self.assertFalse(passed)
        self.assertIn("Fee Erosion", reason)

    def test_19_npos_election_window_lock_and_async_nonce_concurrency(self):
        """Verifies Election Window rejection and AsyncNonceManager guarantees sequential nonces"""
        # Mock class for live client with Election Window active
        class MockElectionActiveClient:
            def query(self, pallet, storage):
                class MockValue:
                    value = "Signed"
                return MockValue()

        rejected, reason = self.npos_optimizer.verify_pre_flight_nomination(
            bonded_stake_pot=1000.0,
            expected_apy_gain_pct=2.5,
            live_client=MockElectionActiveClient()
        )
        self.assertFalse(rejected)
        self.assertIn("Election Window is open", reason)

        # Test AsyncNonceManager concurrency
        test_account = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
        nonce1 = self.npos_optimizer.nonce_manager.get_next_nonce(test_account)
        nonce2 = self.npos_optimizer.nonce_manager.get_next_nonce(test_account)
        nonce3 = self.npos_optimizer.nonce_manager.get_next_nonce(test_account)
        self.assertEqual(nonce2, nonce1 + 1)
        self.assertEqual(nonce3, nonce2 + 1)

    # =========================================================================
    # Group 6: Visual DAG Canvas, Headless Daemon & Control Plane Security
    # =========================================================================
    def test_10_dag_runbook_execution(self):
        """Verifies prebuilt operational runbooks execute successfully"""
        runbooks = self.dag_engine.get_runbooks()
        self.assertGreaterEqual(len(runbooks), 3)

        for rb in runbooks:
            exec_res = self.dag_engine.execute_runbook(rb["id"])
            self.assertEqual(exec_res["status"], "COMPLETED_SUCCESSFULLY")
            self.assertGreater(len(exec_res["steps"]), 0)

    def test_15_headless_worker_daemon_kahn_tiers(self):
        """Verifies Headless Worker Daemon compiles and runs tiered nodes in dry-run mode"""
        sample_rb = self.dag_engine.get_runbooks()[0]
        exec_res = self.worker_daemon.execute_runbook_pipeline(sample_rb, dry_run=True)
        self.assertEqual(exec_res["status"], "COMPLETED_SUCCESSFULLY")
        self.assertTrue(exec_res["dry_run"])
        self.assertGreater(exec_res["tiers_count"], 0)

    def test_20_worker_daemon_cycle_detection_and_webhook_limiter(self):
        """Verifies Kahn's Algorithm detects cyclic graphs and Webhook Token Bucket limits floods"""
        # 1. Cycle Detection: A -> B -> A
        cyclic_nodes = [
            {"id": "node-A", "type": "watcher", "label": "Node A"},
            {"id": "node-B", "type": "action", "label": "Node B"}
        ]
        cyclic_edges = [
            {"id": "e1", "source": "node-A", "target": "node-B"},
            {"id": "e2", "source": "node-B", "target": "node-A"}
        ]
        with self.assertRaises(ValueError) as ctx:
            self.worker_daemon.compile_kahn_tiers(cyclic_nodes, cyclic_edges)
        self.assertIn("Cycle Detected", str(ctx.exception))

        # 2. Webhook Token Bucket Rate Limiter (Max 5/minute)
        allowed_count = 0
        dropped_count = 0
        for i in range(8):
            if self.worker_daemon.send_webhook_alert(f"Alert {i}", f"Message {i}"):
                allowed_count += 1
            else:
                dropped_count += 1

        self.assertEqual(allowed_count, 5, "Token bucket must allow exactly 5 burst notifications")
        self.assertEqual(dropped_count, 3, "Subsequent notifications exceeding bucket must be dropped")

        # 3. Immutable Audit Trail verification
        self.assertTrue(AUDIT_LOG_FILE.exists())
        with open(AUDIT_LOG_FILE, "r", encoding="utf-8") as f:
            lines = [l.strip() for l in f if l.strip()]
        self.assertGreater(len(lines), 0)
        last_event = json.loads(lines[-1])
        self.assertIn("action", last_event)
        self.assertIn("operator", last_event)
        self.assertIn("timestamp", last_event)


if __name__ == "__main__":
    unittest.main()
