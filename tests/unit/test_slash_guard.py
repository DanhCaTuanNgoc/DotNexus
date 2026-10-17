"""
Unit Tests for Slashing Guard & Dead Man's Switch Fencing
Verifies session keys generation, anti-equivocation mutex lease, failover, and self-fencing triggers.
"""

import time
import unittest
from engine.config import CONFIG, LOCK_FILE
from engine.slash_guard import SlashingGuard
from tests.conftest import cleanup_test_locks


class TestSlashGuardUnit(unittest.TestCase):
    def setUp(self):
        cleanup_test_locks()
        self.slash_guard = SlashingGuard()

    def tearDown(self):
        cleanup_test_locks()

    def test_slash_guard_key_rotation(self):
        """Verifies session keys generation format and preview"""
        rot = self.slash_guard.rotate_session_keys()
        self.assertIn("session_keys_hex", rot)
        self.assertTrue(rot["session_keys_hex"].startswith("0x"))
        self.assertIn("babe_pubkey", rot)
        self.assertIn("grandpa_pubkey", rot)
        self.assertIn("im_online_pubkey", rot)

    def test_slash_guard_anti_equivocation_lock(self):
        """Verifies atomic lease acquisition prevents concurrent signing"""
        lease1 = self.slash_guard.acquire_signing_lease("node-alpha")
        self.assertTrue(lease1["acquired"])

        # Another node trying to acquire before expiration must be denied
        lease2 = self.slash_guard.acquire_signing_lease("node-beta")
        self.assertFalse(lease2["acquired"])
        self.assertIn("already acquired", lease2["reason"])

    def test_slash_guard_failover(self):
        """Verifies emergency failover transfers node identity safely"""
        old_node = self.slash_guard.active_node
        res = self.slash_guard.execute_failover(reason="Unit test failover")
        self.assertTrue(res["success"])
        self.assertNotEqual(old_node, res["new_active_node"])

    def test_dead_mans_switch_and_v14_session_keys(self):
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

    def test_dead_mans_switch_self_fence_trigger_and_epoch_increment(self):
        """Verifies Primary self-fencing trigger when lease is lost and epoch increments monotonically"""
        # Simulate Primary lease renewal loss exceeding 10s timeout
        self.slash_guard.active_node = "PRIMARY"
        self.slash_guard.last_lease_renew_time = time.time() - 11.0  # 11s elapsed (> 10s)

        fence_result = self.slash_guard.check_self_fence()
        self.assertTrue(fence_result["self_fenced"])
        self.assertEqual(fence_result["action"], "VALIDATOR_SIGNING_ISOLATED")
        self.assertTrue(self.slash_guard.is_self_fenced)

        # Execute legitimate failover: epoch must increment monotonically
        current_epoch = self.slash_guard.fencing_epoch
        fo_res = self.slash_guard.execute_failover(reason="Dead Man's Switch Takeover")
        self.assertTrue(fo_res["success"])
        self.assertEqual(fo_res["fencing_epoch"], current_epoch + 1)
        self.assertEqual(fo_res["new_active_node"], "STANDBY")


if __name__ == "__main__":
    unittest.main()
