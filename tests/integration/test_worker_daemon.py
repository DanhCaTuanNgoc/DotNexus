"""
Integration Tests for Headless Worker Daemon & Control Plane Security
Verifies Kahn's topological tiers, cycle detection, token bucket webhook rate-limiting,
and immutable audit logs.
"""

import json
import time
import unittest
from pathlib import Path
from engine.config import AUDIT_LOG_FILE, RUNBOOKS_DIR
from engine.dag_engine import DAGCanvasEngine
from engine.worker_daemon import HeadlessWorkerDaemon, WebhookRateLimiter


class TestWorkerDaemonIntegration(unittest.TestCase):
    def setUp(self):
        self.dag_engine = DAGCanvasEngine()
        self.worker_daemon = HeadlessWorkerDaemon()

    def test_webhook_rate_limiter_allows_initial_burst(self):
        """Verifies WebhookRateLimiter allows up to 5 burst notifications"""
        limiter = WebhookRateLimiter(max_tokens=5, refill_seconds=60.0)
        for i in range(5):
            self.assertTrue(limiter.allow(), f"Token {i} should be allowed")

    def test_webhook_rate_limiter_drops_on_exhaustion(self):
        """Verifies 6th webhook notification is dropped when bucket is empty"""
        limiter = WebhookRateLimiter(max_tokens=5, refill_seconds=60.0)
        for _ in range(5):
            limiter.allow()
        self.assertFalse(limiter.allow(), "6th notification must be dropped")

    def test_webhook_rate_limiter_refills_after_period(self):
        """Verifies tokens replenish after refill_seconds has elapsed"""
        limiter = WebhookRateLimiter(max_tokens=3, refill_seconds=0.05)
        for _ in range(3):
            limiter.allow()
        self.assertFalse(limiter.allow())
        time.sleep(0.06)  # Fast sleep for refill
        self.assertTrue(limiter.allow(), "Refilled tokens must allow notifications again")

    def test_kahn_tiers_linear_graph(self):
        """Verifies linear DAG (A -> B -> C) produces 3 separate sequential tiers"""
        nodes = [{"id": "A"}, {"id": "B"}, {"id": "C"}]
        edges = [{"source": "A", "target": "B"}, {"source": "B", "target": "C"}]
        tiers = self.worker_daemon.compile_kahn_tiers(nodes, edges)
        self.assertEqual(tiers, [["A"], ["B"], ["C"]])

    def test_kahn_tiers_diamond_concurrency(self):
        """Verifies diamond DAG (A -> B, A -> C, B -> D, C -> D) batches B and C concurrently in tier 1"""
        nodes = [{"id": "A"}, {"id": "B"}, {"id": "C"}, {"id": "D"}]
        edges = [
            {"source": "A", "target": "B"},
            {"source": "A", "target": "C"},
            {"source": "B", "target": "D"},
            {"source": "C", "target": "D"}
        ]
        tiers = self.worker_daemon.compile_kahn_tiers(nodes, edges)
        self.assertEqual(len(tiers), 3)
        self.assertEqual(tiers[0], ["A"])
        self.assertEqual(set(tiers[1]), {"B", "C"})
        self.assertEqual(tiers[2], ["D"])

    def test_kahn_tiers_disconnected_parallel_nodes(self):
        """Verifies disconnected root nodes are batched concurrently in the first tier"""
        nodes = [{"id": "W1"}, {"id": "W2"}, {"id": "Act"}]
        edges = [{"source": "W1", "target": "Act"}, {"source": "W2", "target": "Act"}]
        tiers = self.worker_daemon.compile_kahn_tiers(nodes, edges)
        self.assertEqual(len(tiers), 2)
        self.assertEqual(set(tiers[0]), {"W1", "W2"})
        self.assertEqual(tiers[1], ["Act"])

    def test_kahn_tiers_cycle_detection_raises_value_error(self):
        """Verifies cyclic graph (A -> B -> A) is detected and raises ValueError"""
        cyclic_nodes = [{"id": "A"}, {"id": "B"}]
        cyclic_edges = [{"source": "A", "target": "B"}, {"source": "B", "target": "A"}]
        with self.assertRaises(ValueError) as ctx:
            self.worker_daemon.compile_kahn_tiers(cyclic_nodes, cyclic_edges)
        self.assertIn("Cycle Detected", str(ctx.exception))

    def test_kahn_tiers_self_loop_detected(self):
        """Verifies self-loop edge (A -> A) raises cycle detected ValueError"""
        nodes = [{"id": "A"}]
        edges = [{"source": "A", "target": "A"}]
        with self.assertRaises(ValueError) as ctx:
            self.worker_daemon.compile_kahn_tiers(nodes, edges)
        self.assertIn("Cycle Detected", str(ctx.exception))

    def test_execute_runbook_pipeline_dry_run(self):
        """Verifies Headless Worker Daemon compiles and runs tiered nodes in dry-run mode"""
        sample_rb = self.dag_engine.get_runbooks()[0]
        exec_res = self.worker_daemon.execute_runbook_pipeline(sample_rb, dry_run=True)
        self.assertEqual(exec_res["status"], "COMPLETED_SUCCESSFULLY")
        self.assertTrue(exec_res["dry_run"])
        self.assertGreater(exec_res["tiers_count"], 0)

    def test_execute_runbook_pipeline_records_audit_trail(self):
        """Verifies pipeline execution appends to audit log"""
        sample_rb = self.dag_engine.get_runbooks()[0]
        self.worker_daemon.execute_runbook_pipeline(sample_rb, dry_run=True)
        self.assertTrue(AUDIT_LOG_FILE.exists())
        with open(AUDIT_LOG_FILE, "r", encoding="utf-8") as f:
            lines = [l.strip() for l in f if l.strip()]
        self.assertGreater(len(lines), 0)

    def test_record_audit_writes_valid_json_lines(self):
        """Verifies record_audit produces valid JSON entries with standard fields"""
        self.worker_daemon.record_audit(
            action="TEST_DAEMON_ACTION",
            operator="WorkerDaemon",
            status="SUCCESS",
            details={"tier": 1}
        )
        with open(AUDIT_LOG_FILE, "r", encoding="utf-8") as f:
            lines = [l.strip() for l in f if l.strip()]
        last_entry = json.loads(lines[-1])
        self.assertEqual(last_entry["action"], "TEST_DAEMON_ACTION")
        self.assertEqual(last_entry["status"], "SUCCESS")
        self.assertIn("timestamp", last_entry)

    def test_load_runbooks_from_disk_handles_empty_dir(self):
        """Verifies loading runbooks from disk returns a list without crashing"""
        res = self.worker_daemon.load_runbooks_from_disk()
        self.assertIsInstance(res, list)


if __name__ == "__main__":
    unittest.main()
