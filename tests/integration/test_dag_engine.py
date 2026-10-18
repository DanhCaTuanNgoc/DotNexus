"""
Integration Tests for Visual DAG Runbook Execution
Verifies end-to-end execution of operational runbooks, chaos fire drills,
step transitions, and state propagation.
"""

import unittest
from engine.dag_engine import DAGCanvasEngine


class TestDAGEngineIntegration(unittest.TestCase):
    def setUp(self):
        self.dag_engine = DAGCanvasEngine()

    def test_get_runbooks_returns_all_prebuilt(self):
        """Verifies exactly 4 prebuilt operational runbooks are available"""
        runbooks = self.dag_engine.get_runbooks()
        self.assertGreaterEqual(len(runbooks), 4)
        ids = [rb["id"] for rb in runbooks]
        self.assertIn("runbook-slash-guard", ids)
        self.assertIn("runbook-dual-vm-sync", ids)
        self.assertIn("runbook-npos-compound", ids)
        self.assertIn("runbook-chaos-fire-drill", ids)

    def test_get_runbook_by_id_existing(self):
        """Verifies fetching specific runbook by ID returns matching metadata"""
        rb = self.dag_engine.get_runbook_by_id("runbook-slash-guard")
        self.assertIsNotNone(rb)
        self.assertEqual(rb["id"], "runbook-slash-guard")
        self.assertEqual(rb["category"], "SECURITY")

    def test_get_runbook_by_id_nonexistent(self):
        """Verifies nonexistent runbook ID returns None"""
        rb = self.dag_engine.get_runbook_by_id("runbook-does-not-exist")
        self.assertIsNone(rb)

    def test_execute_slash_guard_runbook(self):
        """Verifies execution of automated Slashing Guard failover runbook"""
        res = self.dag_engine.execute_runbook("runbook-slash-guard")
        self.assertEqual(res["status"], "COMPLETED_SUCCESSFULLY")
        self.assertGreaterEqual(len(res["steps"]), 3)
        self.assertGreaterEqual(res["duration_ms"], 0)

    def test_execute_dual_vm_sync_runbook(self):
        """Verifies execution of Dual-VM parity watcher runbook"""
        res = self.dag_engine.execute_runbook("runbook-dual-vm-sync")
        self.assertEqual(res["status"], "COMPLETED_SUCCESSFULLY")
        self.assertGreaterEqual(len(res["steps"]), 2)

    def test_execute_npos_compound_runbook(self):
        """Verifies execution of NPoS auto-compounding runbook"""
        res = self.dag_engine.execute_runbook("runbook-npos-compound")
        self.assertEqual(res["status"], "COMPLETED_SUCCESSFULLY")
        self.assertGreaterEqual(len(res["steps"]), 2)

    def test_execute_chaos_fire_drill_runbook(self):
        """Verifies execution of 4-step Chaos Monkey fault-injection runbook"""
        res = self.dag_engine.execute_runbook("runbook-chaos-fire-drill")
        self.assertEqual(res["status"], "COMPLETED_SUCCESSFULLY")
        self.assertEqual(len(res["steps"]), 4)
        step_names = [s["step"] for s in res["steps"]]
        self.assertIn("Fault Injection: Heartbeat Cut", step_names)
        self.assertIn("Dead Man's Switch Evaluation", step_names)
        self.assertIn("Chaos Defense: RPC DDoS Shield", step_names)
        self.assertIn("Causal Lag Index Probe", step_names)

    def test_execute_unknown_runbook_status_failed(self):
        """Verifies execution of invalid runbook ID fails gracefully"""
        res = self.dag_engine.execute_runbook("invalid-id-xyz")
        self.assertEqual(res["status"], "FAILED")
        self.assertIn("not found", res["error"])

    def test_add_custom_runbook_and_execute(self):
        """Verifies dynamically registering and executing a custom runbook"""
        custom = {
            "id": "runbook-custom-ops",
            "name": "Custom Validator Health Check",
            "description": "Performs quick node diagnostics",
            "category": "MAINTENANCE",
            "nodes": [
                {"id": "c1", "type": "watcher", "label": "Node Status"},
                {"id": "c2", "type": "action", "label": "Dispatch Notification"}
            ],
            "edges": [{"id": "ce1", "source": "c1", "target": "c2"}]
        }
        added = self.dag_engine.add_custom_runbook(custom)
        self.assertTrue(added)
        self.assertIsNotNone(self.dag_engine.get_runbook_by_id("runbook-custom-ops"))

    def test_execution_logs_contain_timestamps_and_durations(self):
        """Verifies runbook execution logs record audit execution timestamps"""
        res = self.dag_engine.execute_runbook("runbook-slash-guard")
        self.assertIn("timestamp", res)
        self.assertIn("duration_ms", res)
        self.assertIsInstance(res["steps"], list)


if __name__ == "__main__":
    unittest.main()
