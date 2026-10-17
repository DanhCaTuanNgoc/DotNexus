"""
Integration Tests for Headless Worker Daemon & Control Plane Security
Verifies Kahn's topological tiers, cycle detection, token bucket webhook rate-limiting, and immutable audit logs.
"""

import json
import unittest
from engine.config import AUDIT_LOG_FILE
from engine.dag_engine import DAGCanvasEngine
from engine.worker_daemon import HeadlessWorkerDaemon


class TestWorkerDaemonIntegration(unittest.TestCase):
    def setUp(self):
        self.dag_engine = DAGCanvasEngine()
        self.worker_daemon = HeadlessWorkerDaemon()

    def test_headless_worker_daemon_kahn_tiers(self):
        """Verifies Headless Worker Daemon compiles and runs tiered nodes in dry-run mode"""
        sample_rb = self.dag_engine.get_runbooks()[0]
        exec_res = self.worker_daemon.execute_runbook_pipeline(sample_rb, dry_run=True)
        self.assertEqual(exec_res["status"], "COMPLETED_SUCCESSFULLY")
        self.assertTrue(exec_res["dry_run"])
        self.assertGreater(exec_res["tiers_count"], 0)

    def test_worker_daemon_cycle_detection_and_webhook_limiter(self):
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
