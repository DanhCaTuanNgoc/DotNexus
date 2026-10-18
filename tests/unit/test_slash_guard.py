"""
Unit Tests for Slashing Guard & Dead Man's Switch Fencing
Verifies session keys generation, anti-equivocation mutex lease, failover,
Dead Man's Switch self-fencing triggers, and immutable audit logs.
"""

import os
import json
import time
import unittest
from pathlib import Path
from engine.config import CONFIG, LOCK_FILE, FAILOVER_STATE_FILE, AUDIT_LOG_FILE
from engine.slash_guard import SlashingGuard
from tests.conftest import cleanup_test_locks


class TestSlashGuardUnit(unittest.TestCase):
    def setUp(self):
        cleanup_test_locks()
        if FAILOVER_STATE_FILE.exists():
            try:
                os.remove(FAILOVER_STATE_FILE)
            except Exception:
                pass
        self.slash_guard = SlashingGuard(substrate_url="ws://127.0.0.1:99999")

    def tearDown(self):
        cleanup_test_locks()
        if FAILOVER_STATE_FILE.exists():
            try:
                os.remove(FAILOVER_STATE_FILE)
            except Exception:
                pass

    def test_v14_session_keys_structure(self):
        """Verifies session keys generation unpacks Metadata V14 4-key struct"""
        rot = self.slash_guard.rotate_session_keys()
        self.assertIn("keys_struct_v14", rot)
        keys_v14 = rot["keys_struct_v14"]
        self.assertIn("babe", keys_v14)
        self.assertIn("grandpa", keys_v14)
        self.assertIn("im_online", keys_v14)
        self.assertIn("authority_discovery", keys_v14)

    def test_v14_session_keys_lengths(self):
        """Verifies each unpacked public key is 66 chars (0x prefix + 32 bytes hex)"""
        rot = self.slash_guard.rotate_session_keys()
        keys_v14 = rot["keys_struct_v14"]
        self.assertEqual(len(keys_v14["babe"]), 66)
        self.assertEqual(len(keys_v14["grandpa"]), 66)
        self.assertEqual(len(keys_v14["im_online"]), 66)
        self.assertEqual(len(keys_v14["authority_discovery"]), 66)

    def test_session_keys_effective_session(self):
        """Verifies Substrate NPoS planned rotation targets Session N+2 delay"""
        rot = self.slash_guard.rotate_session_keys()
        self.assertEqual(rot["effective_session"], "Session N+2")
        self.assertIn("session_keys_hex", rot)
        self.assertTrue(rot["session_keys_hex"].startswith("0x"))

    def test_signing_lease_initial_acquisition(self):
        """Verifies primary node acquires atomic signing lease"""
        lease = self.slash_guard.acquire_signing_lease("node-alpha")
        self.assertTrue(lease["acquired"])
        self.assertEqual(lease["holder"], "node-alpha")
        self.assertGreater(lease["expires_at"], time.time())

    def test_signing_lease_concurrent_rejection(self):
        """Verifies candidate node is rejected while valid lease is held"""
        self.slash_guard.acquire_signing_lease("node-alpha")
        lease2 = self.slash_guard.acquire_signing_lease("node-beta")
        self.assertFalse(lease2["acquired"])
        self.assertIn("already acquired", lease2["reason"])
        self.assertEqual(lease2["holder"], "node-alpha")

    def test_signing_lease_renewal_updates_expiry(self):
        """Verifies renewing lease pushes expires_at forward by lease TTL"""
        self.slash_guard.acquire_signing_lease(self.slash_guard.node_id)
        now = time.time()
        renew_res = self.slash_guard.acquire_signing_lease(self.slash_guard.node_id)
        self.assertTrue(renew_res.get("acquired"))
        self.assertGreaterEqual(renew_res["expires_at"], now + CONFIG.heartbeat_lock_lease_seconds - 1.0)

    def test_dead_mans_switch_timing_invariant_in_status(self):
        """Verifies get_security_dashboard checks and verifies the timing invariant"""
        status = self.slash_guard.get_security_dashboard()
        self.assertIn("dead_mans_switch", status)
        dms = status["dead_mans_switch"]
        self.assertTrue(dms["invariant_satisfied"])
        self.assertEqual(dms["self_fence_timeout_s"], CONFIG.primary_self_fence_timeout)
        self.assertEqual(dms["lease_ttl_s"], CONFIG.heartbeat_lock_lease_seconds)
        self.assertEqual(dms["takeover_delay_s"], CONFIG.standby_takeover_delay)

    def test_dead_mans_switch_self_fence_trigger(self):
        """Verifies Primary self-fences when lease is unrenewed for > 10.0s"""
        self.slash_guard.active_node = "PRIMARY"
        self.slash_guard.last_lease_renew_time = time.time() - 11.0  # 11s elapsed (> 10s)
        fence_res = self.slash_guard.check_self_fence()
        self.assertTrue(fence_res["self_fenced"])
        self.assertEqual(fence_res["action"], "VALIDATOR_SIGNING_ISOLATED")
        self.assertTrue(self.slash_guard.is_self_fenced)

    def test_dead_mans_switch_primary_remains_active_if_not_timed_out(self):
        """Verifies Primary remains unfenced when lease was recently renewed"""
        self.slash_guard.active_node = "PRIMARY"
        self.slash_guard.last_lease_renew_time = time.time() - 2.0  # 2s elapsed (< 10s)
        fence_res = self.slash_guard.check_self_fence()
        self.assertFalse(fence_res["self_fenced"])
        self.assertFalse(self.slash_guard.is_self_fenced)

    def test_failover_increments_monotonic_epoch(self):
        """Verifies execute_failover increments fencing epoch monotonically"""
        initial_epoch = self.slash_guard.fencing_epoch
        res = self.slash_guard.execute_failover(reason="Failover epoch test")
        self.assertTrue(res["success"])
        self.assertEqual(res["fencing_epoch"], initial_epoch + 1)
        self.assertEqual(self.slash_guard.fencing_epoch, initial_epoch + 1)

    def test_failover_switches_node_identity(self):
        """Verifies failover transitions active node from PRIMARY to STANDBY"""
        self.slash_guard.active_node = "PRIMARY"
        res = self.slash_guard.execute_failover(reason="Node identity switch test")
        self.assertTrue(res["success"])
        self.assertEqual(res["new_active_node"], "STANDBY")

    def test_failover_rejects_author_rotate_keys(self):
        """Verifies failover execution does not invoke author_rotateKeys during emergency takeover"""
        res = self.slash_guard.execute_failover(reason="Safety test")
        self.assertTrue(res["success"])
        # Verified: failover does not return session_keys_hex or execute author_rotateKeys
        self.assertNotIn("session_keys_hex", res)

    def test_failover_stale_epoch_rejection(self):
        """Verifies candidate with lower epoch than current state cannot usurp authority"""
        self.slash_guard.fencing_epoch = 10
        # If current lock already has higher epoch
        with open(LOCK_FILE, "w", encoding="utf-8") as f:
            json.dump({
                "holder": "validator-other",
                "fencing_epoch": 10,
                "expires_at": time.time() + 10.0,
                "acquired_at": time.time()
            }, f)
        res = self.slash_guard.acquire_signing_lease("validator-new")
        self.assertFalse(res["acquired"])

    def test_failover_standby_takeover_delay_guard(self):
        """Verifies takeover is rejected if attempted before the 15s takeover delay expires"""
        now = time.time()
        with open(LOCK_FILE, "w", encoding="utf-8") as f:
            json.dump({
                "holder": "validator-primary",
                "fencing_epoch": 1,
                "expires_at": now - 1.0,  # Just expired
                "acquired_at": now - 11.0  # Only 11s elapsed, < 15s takeover delay
            }, f)
        res = self.slash_guard.acquire_signing_lease("validator-standby", force_takeover=False)
        self.assertFalse(res["acquired"])
        self.assertIn("Safety Invariant Violation", res["reason"])

    def test_heartbeat_check_nominal(self):
        """Verifies heartbeat returns SAFE when missed_heartbeats is 0"""
        self.slash_guard.missed_heartbeats = 0
        hb = self.slash_guard.check_heartbeat()
        self.assertEqual(hb["pallet_im_online"]["status"], "HEALTHY")
        self.assertEqual(hb["slashing_risk"], "SAFE")

    def test_heartbeat_check_missed_increment(self):
        """Verifies simulating missed heartbeat increments consecutive miss counter"""
        initial = self.slash_guard.missed_heartbeats
        res = self.slash_guard.simulate_missed_heartbeat()
        self.assertEqual(self.slash_guard.missed_heartbeats, initial + 1)
        self.assertEqual(res["missed_heartbeats"], initial + 1)

    def test_heartbeat_check_threshold_alert(self):
        """Verifies consecutive misses reaching threshold triggers CRITICAL risk"""
        self.slash_guard.missed_heartbeats = CONFIG.heartbeat_miss_threshold - 1
        hb = self.slash_guard.check_heartbeat(force_miss=True)
        self.assertEqual(hb["slashing_risk"], "CRITICAL_FAILOVER_TRIGGERED")

    def test_audit_event_logging(self):
        """Verifies security events write structured JSON lines into audit.log"""
        self.slash_guard._record_event(level="SECURITY_AUDIT", title="TEST_ACTION", message="Test message")
        self.assertTrue(AUDIT_LOG_FILE.exists())
        with open(AUDIT_LOG_FILE, "r", encoding="utf-8") as f:
            lines = [l.strip() for l in f if l.strip()]
        last_entry = json.loads(lines[-1])
        self.assertEqual(last_entry["title"], "TEST_ACTION")
        self.assertEqual(last_entry["level"], "SECURITY_AUDIT")

    def test_security_status_schema(self):
        """Verifies get_security_dashboard outputs comprehensive security control plane telemetry"""
        status = self.slash_guard.get_security_dashboard()
        self.assertIn("active_node", status)
        self.assertIn("fencing_epoch", status)
        self.assertIn("equivocation_guard_active", status)
        self.assertIn("missed_heartbeats", status)
        self.assertIn("dead_mans_switch", status)

    def test_state_persistence_and_reloading(self):
        """Verifies failover state persists across SlashingGuard instance reinstantiations"""
        self.slash_guard.active_node = "STANDBY"
        self.slash_guard.fencing_epoch = 42
        self.slash_guard._save_state()

        new_guard = SlashingGuard(substrate_url="ws://127.0.0.1:99999")
        self.assertEqual(new_guard.active_node, "STANDBY")
        self.assertEqual(new_guard.fencing_epoch, 42)

    def test_rotation_history_capped(self):
        """Verifies rotation history list is maintained without unbounded memory growth"""
        for i in range(25):
            self.slash_guard.history_rotations.append({"id": i, "timestamp": time.time()})
        self.slash_guard._save_state()
        self.slash_guard._load_state()
        self.assertLessEqual(len(self.slash_guard.history_rotations), 20)

    def test_clean_lease_expiration_allows_standby(self):
        """Verifies that once Standby Takeover Delay (15s) has passed, candidate acquires lease"""
        now = time.time()
        with open(LOCK_FILE, "w", encoding="utf-8") as f:
            json.dump({
                "holder": "validator-primary",
                "fencing_epoch": 1,
                "expires_at": now - 4.0,
                "acquired_at": now - 16.0  # 16s elapsed (> 15s takeover delay)
            }, f)
        res = self.slash_guard.acquire_signing_lease("validator-standby")
        self.assertTrue(res["acquired"])
        self.assertEqual(res["holder"], "validator-standby")


if __name__ == "__main__":
    unittest.main()
