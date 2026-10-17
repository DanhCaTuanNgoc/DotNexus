"""
Integration Tests for REST API Gateway & Prometheus Exporter
Verifies HTTP endpoints, Prometheus metric formats, status responses, and authentication checks.
"""

import unittest
from engine.server import app


class TestServerAPIIntegration(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_get_prometheus_metrics_endpoint(self):
        """Verifies GET /metrics serves text/plain Prometheus metrics"""
        res = self.client.get("/metrics")
        self.assertEqual(res.status_code, 200)
        self.assertIn("text/plain", res.content_type)
        data = res.get_data(as_text=True)
        self.assertIn("dotnexus_rpc_requests_total", data)
        self.assertIn("dotnexus_proxy_inspection_overhead_ms", data)

    def test_get_global_status_endpoint(self):
        """Verifies GET /api/status returns unified cluster telemetry and 3-tier diagnosis"""
        res = self.client.get("/api/status")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("network", data)
        self.assertIn("dual_vm", data)
        self.assertIn("security", data)
        self.assertIn("shield", data)
        self.assertIn("npos", data)
        self.assertIn("system_resources", data)

    def test_get_dual_telemetry_endpoint(self):
        """Verifies GET /api/dual-tracker returns Substrate and EVM block states"""
        res = self.client.get("/api/dual-tracker")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        inner = data.get("data", {})
        self.assertIn("substrate", inner)
        self.assertIn("evm", inner)
        self.assertIn("sync", inner)

    def test_get_security_dashboard_endpoint(self):
        """Verifies GET /api/slash-guard returns fencing epoch and active node"""
        res = self.client.get("/api/slash-guard")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        inner = data.get("data", {})
        self.assertIn("active_node", inner)
        self.assertIn("fencing_epoch", inner)
        self.assertIn("dead_mans_switch", inner)

    def test_get_npos_recommendation_endpoint(self):
        """Verifies GET /api/npos/top-16 returns top 16 validator targets"""
        res = self.client.get("/api/npos/top-16")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        inner = data.get("data", {})
        self.assertIn("targets", inner)
        self.assertIn("auto_compounded_apy", inner)

    def test_get_runbooks_endpoint(self):
        """Verifies GET /api/canvas/runbooks lists available DAG automation runbooks"""
        res = self.client.get("/api/canvas/runbooks")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        runbooks = data.get("data", [])
        self.assertIsInstance(runbooks, list)
        self.assertGreater(len(runbooks), 0)

    def test_auth_rejection_with_invalid_token(self):
        """Verifies write endpoints reject requests with invalid X-DotNexus-Auth token"""
        res = self.client.post(
            "/api/slash-guard/failover",
            json={"reason": "Unauthorized test attempt"},
            headers={"X-DotNexus-Auth": "wrong-token-12345"}
        )
        self.assertEqual(res.status_code, 401)
        data = res.get_json()
        self.assertFalse(data.get("success"))
        self.assertIn("Unauthorized", data.get("error", ""))


if __name__ == "__main__":
    unittest.main()
