"""
Integration Tests for REST API Gateway & Prometheus Exporter
Verifies HTTP endpoints, Prometheus metric formats, status responses,
authentication checks, NPoS pre-flight rebalance, and Chaos Monkey execution.
"""

import unittest
from engine.config import CONFIG
from engine.server import app


class TestServerAPIIntegration(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()
        self.auth_headers = {"X-DotNexus-Auth": CONFIG.auth_api_token}

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

    def test_post_slash_guard_rotate_keys_endpoint(self):
        """Verifies POST /api/slash-guard/rotate-keys returns session keys preview"""
        res = self.client.post("/api/slash-guard/rotate-keys")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("keys_struct_v14", data.get("data", {}))

    def test_post_slash_guard_failover_authorized(self):
        """Verifies POST /api/slash-guard/failover succeeds with valid auth token"""
        res = self.client.post(
            "/api/slash-guard/failover",
            json={"reason": "Integration Test Failover"},
            headers=self.auth_headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("fencing_epoch", data.get("data", {}))

    def test_post_slash_guard_failover_unauthorized(self):
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

    def test_post_slash_guard_simulate_heartbeat_miss(self):
        """Verifies POST /api/slash-guard/simulate-missed-heartbeat triggers miss simulation"""
        res = self.client.post("/api/slash-guard/simulate-missed-heartbeat")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("missed_heartbeats", data.get("data", {}))

    def test_get_security_audit_log_endpoint(self):
        """Verifies GET /api/security/audit-log returns immutable audit entries"""
        res = self.client.get("/api/security/audit-log")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIsInstance(data.get("data"), list)

    def test_get_npos_recommendation_endpoint(self):
        """Verifies GET /api/npos/top-16 returns top 16 validator targets"""
        res = self.client.get("/api/npos/top-16")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        inner = data.get("data", {})
        self.assertIn("targets", inner)
        self.assertIn("auto_compounded_apy", inner)

    def test_get_npos_all_validators_endpoint(self):
        """Verifies GET /api/npos/validators lists candidate validators"""
        res = self.client.get("/api/npos/validators")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIsInstance(data.get("data"), list)

    def test_post_npos_rebalance_endpoint(self):
        """Verifies POST /api/npos/rebalance computes allocation with pre-flight checks"""
        res = self.client.post(
            "/api/npos/rebalance",
            json={"stake_pot": 10000.0},
            headers=self.auth_headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("data", data)

    def test_get_rpc_shield_status_endpoint(self):
        """Verifies GET /api/rpc-shield returns metrics, logs, and peer topology"""
        res = self.client.get("/api/rpc-shield")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        inner = data.get("data", {})
        self.assertIn("p2p_topology", inner)
        self.assertIn("total_inspected", inner)

    def test_post_rpc_shield_simulate_attack_endpoint(self):
        """Verifies POST /api/rpc-shield/simulate-attack tests heavy getLogs defense"""
        res = self.client.post(
            "/api/rpc-shield/simulate-attack",
            json={"type": "HEAVY_GETLOGS"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("data", {}).get("attack_type"), "HEAVY_GETLOGS")

    def test_get_runbooks_endpoint(self):
        """Verifies GET /api/canvas/runbooks lists available DAG automation runbooks"""
        res = self.client.get("/api/canvas/runbooks")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        runbooks = data.get("data", [])
        self.assertIsInstance(runbooks, list)
        self.assertGreater(len(runbooks), 0)

    def test_post_canvas_execute_runbook_endpoint(self):
        """Verifies POST /api/canvas/runbooks/<id>/execute runs a runbook"""
        res = self.client.post(
            "/api/canvas/runbooks/runbook-slash-guard/execute",
            json={"dry_run": True},
            headers=self.auth_headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("data", {}).get("status"), "COMPLETED_SUCCESSFULLY")

    def test_post_worker_execute_endpoint(self):
        """Verifies POST /api/worker/execute runs Kahn's tiers pipeline"""
        res = self.client.post(
            "/api/worker/execute",
            json={"dry_run": True},
            headers=self.auth_headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("data", {}).get("status"), "COMPLETED_SUCCESSFULLY")

    def test_get_unified_logs_endpoint(self):
        """Verifies GET /api/logs serves aggregated stream of chronological security logs"""
        res = self.client.get("/api/logs")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("logs", data)
        self.assertIsInstance(data.get("logs"), list)

    def test_post_dispatch_nominate_endpoint(self):
        """Verifies POST /api/npos/dispatch-nominate endpoint validation and execution"""
        res = self.client.post("/api/npos/dispatch-nominate", json={"targets": []}, headers=self.auth_headers)
        self.assertEqual(res.status_code, 400)
        self.assertFalse(res.get_json().get("success"))

        from unittest.mock import patch
        with patch("engine.server.NPOS_OPTIMIZER.dispatch_nomination_onchain") as mock_dispatch:
            mock_dispatch.return_value = {
                "is_success": True,
                "tx_hash": "0x123abc456",
                "block_hash": "0x789def",
                "events": ["ExtrinsicSuccess"],
                "signer_address": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
            }
            res = self.client.post(
                "/api/npos/dispatch-nominate",
                json={"targets": ["5F4ZyJJ8R3QHZKRLAfDXdUuVE4w3Q7uq7tCNfAtvf2XEBfYY"], "signer_key": "//Alice"},
                headers=self.auth_headers
            )
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertTrue(data.get("success"))
            self.assertEqual(data.get("data", {}).get("tx_hash"), "0x123abc456")

    def test_post_bond_extra_endpoint(self):
        """Verifies POST /api/npos/bond-extra endpoint execution"""
        from unittest.mock import patch
        with patch("engine.server.NPOS_OPTIMIZER.bond_extra_onchain") as mock_bond:
            mock_bond.return_value = {
                "is_success": True,
                "tx_hash": "0x987fed654",
                "block_hash": "0x654cba",
                "amount_pot": 5.0,
                "events": ["Bonded", "ExtrinsicSuccess"]
            }
            res = self.client.post(
                "/api/npos/bond-extra",
                json={"amount_pot": 5.0, "signer_key": "//Alice"},
                headers=self.auth_headers
            )
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertTrue(data.get("success"))
            self.assertEqual(data.get("data", {}).get("tx_hash"), "0x987fed654")

    def test_get_recent_dual_blocks_endpoint(self):
        """Verifies GET /api/telemetry/dual/recent-blocks returns recent correlated blocks"""
        res = self.client.get("/api/telemetry/dual/recent-blocks?limit=5")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        blocks = data.get("data", [])
        self.assertEqual(len(blocks), 5)
        self.assertIn("block_number_wasm", blocks[0])
        self.assertIn("block_number_evm", blocks[0])
        self.assertIn("mapping_latency_ms", blocks[0])
        self.assertIn("status", blocks[0])

    def test_get_npos_unbonding_queue_endpoint(self):
        """Verifies GET /api/npos/unbonding-queue returns valid escrow queue structure without error"""
        res = self.client.get("/api/npos/unbonding-queue")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        inner = data.get("data", {})
        self.assertIn("controller_stash", inner)
        self.assertIn("total_unbonding_pot", inner)
        self.assertIn("unbonding_queue", inner)

    def test_get_npos_keeper_status_endpoint(self):
        """Verifies GET /api/npos/keeper-status returns keeper operational health"""
        res = self.client.get("/api/npos/keeper-status")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        inner = data.get("data", {})
        self.assertIn("keeper_status", inner)
        self.assertIn("current_era", inner)

    def test_post_npos_keeper_run_endpoint(self):
        """Verifies POST /api/npos/keeper-run triggers autonomous rebalance pass"""
        res = self.client.post("/api/npos/keeper-run", json={"force": True}, headers=self.auth_headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))

    def test_get_recent_dual_blocks_alias_endpoint(self):
        """Verifies GET /api/dual-tracker/recent-blocks alias endpoint responds with HTTP 200"""
        res = self.client.get("/api/dual-tracker/recent-blocks")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))


if __name__ == "__main__":
    unittest.main()
