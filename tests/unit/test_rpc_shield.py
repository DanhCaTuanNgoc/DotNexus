"""
Unit Tests for RPC Shield & Reverse Proxy Defense
Verifies heavy eth_getLogs defense, rate limiting, batch limits, safe block tags, socket ceiling, and Prometheus metrics.
"""

import unittest
from engine.config import CONFIG
from engine.rpc_shield import RPCShield


class TestRPCShieldUnit(unittest.TestCase):
    def setUp(self):
        self.rpc_shield = RPCShield()

    def test_rpc_shield_heavy_getlogs_defense(self):
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

    def test_rpc_shield_rate_limiting(self):
        """Verifies sliding-window rate limiter throttles abusive IPs (60 req/min)"""
        test_ip = "9.9.9.9"
        for _ in range(CONFIG.rpc_rate_limit_per_minute):
            self.rpc_shield.inspect_request(client_ip=test_ip, method="eth_blockNumber")

        res_throttled = self.rpc_shield.inspect_request(client_ip=test_ip, method="eth_blockNumber")
        self.assertEqual(res_throttled["decision"], "THROTTLED")
        self.assertEqual(res_throttled["status_code"], 429)

    def test_rpc_shield_batch_and_storage_defense(self):
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

    def test_rpc_shield_socket_ceiling_and_prometheus_metrics(self):
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


if __name__ == "__main__":
    unittest.main()
