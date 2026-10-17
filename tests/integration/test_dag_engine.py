"""
Integration Tests for Visual DAG Runbook Execution
Verifies end-to-end execution of operational runbooks, step transitions, and state propagation.
"""

import unittest
from engine.dag_engine import DAGCanvasEngine


class TestDAGEngineIntegration(unittest.TestCase):
    def setUp(self):
        self.dag_engine = DAGCanvasEngine()

    def test_dag_runbook_execution(self):
        """Verifies prebuilt operational runbooks execute successfully"""
        runbooks = self.dag_engine.get_runbooks()
        self.assertGreaterEqual(len(runbooks), 3)

        for rb in runbooks:
            exec_res = self.dag_engine.execute_runbook(rb["id"])
            self.assertEqual(exec_res["status"], "COMPLETED_SUCCESSFULLY")
            self.assertGreater(len(exec_res["steps"]), 0)


if __name__ == "__main__":
    unittest.main()
