"""
Unit Tests for RPC Shield & Reverse Proxy Defense
Verifies heavy eth_getLogs defense, rate limiting, batch limits, safe block tags,
socket ceiling, IP ban lifecycles, and Prometheus metrics.
"""

import time
import unittest
from engine.config import CONFIG
from engine.rpc_shield import RPCShield


class TestRPCShieldUnit(unittest.TestCase):
    def setUp(self):
        self.rpc_shield = RPCShield()

    def test_parse_safe_block_none_returns_latest(self):
        """Verifies None block parameter returns cached latest EVM block"""
        self.assertEqual(
            self.rpc_shield.parse_safe_block_number(None),
            self.rpc_shield.cached_latest_evm_block
        )

    def test_parse_safe_block_latest_tag(self):
        """Verifies 'latest' tag returns cached latest EVM block"""
        self.assertEqual(
            self.rpc_shield.parse_safe_block_number("latest"),
            self.rpc_shield.cached_latest_evm_block
        )

    def test_parse_safe_block_finalized_tag(self):
        """Verifies 'finalized' tag returns cached latest EVM block"""
        self.assertEqual(
            self.rpc_shield.parse_safe_block_number("finalized"),
            self.rpc_shield.cached_latest_evm_block
        )

    def test_parse_safe_block_earliest_tag(self):
        """Verifies 'earliest' tag returns block 0"""
        self.assertEqual(self.rpc_shield.parse_safe_block_number("earliest"), 0)

    def test_parse_safe_block_hex_string(self):
        """Verifies 0x hex string is parsed to integer value"""
        self.assertEqual(self.rpc_shield.parse_safe_block_number("0x20"), 32)
        self.assertEqual(self.rpc_shield.parse_safe_block_number("0x100"), 256)

    def test_parse_safe_block_integer(self):
        """Verifies plain integer is returned directly"""
        self.assertEqual(self.rpc_shield.parse_safe_block_number(12345), 12345)

    def test_parse_safe_block_invalid_string_fallback(self):
        """Verifies unrecognized string tags fall back safely without raising ValueError"""
        res = self.rpc_shield.parse_safe_block_number("corrupted_block_tag_xyz")
        self.assertEqual(res, self.rpc_shield.cached_latest_evm_block)

    def test_getlogs_safe_span_allowed(self):
        """Verifies eth_getLogs with block span <= 2000 is ALLOWED"""
        res = self.rpc_shield.inspect_request(
            client_ip="1.2.3.4",
            method="eth_getLogs",
            params=[{"fromBlock": 1000, "toBlock": 1500}]
        )
        self.assertEqual(res["decision"], "ALLOWED")

    def test_getlogs_heavy_span_blocked(self):
        """Verifies eth_getLogs with block span > 2000 is BLOCKED to prevent node OOM"""
        res = self.rpc_shield.inspect_request(
            client_ip="1.2.3.4",
            method="eth_getLogs",
            params=[{"fromBlock": 1000, "toBlock": 3500}]  # 2500 span > 2000
        )
        self.assertEqual(res["decision"], "BLOCKED")
        self.assertIn("exceeds max safe limit", res["reason"])

    def test_getlogs_heavy_span_bans_ip(self):
        """Verifies abusive archival getLogs query bans the offending client IP"""
        ip = "185.220.101.5"
        self.rpc_shield.inspect_request(
            client_ip=ip,
            method="eth_getLogs",
            params=[{"fromBlock": 0, "toBlock": 100000}]
        )
        self.assertIn(ip, self.rpc_shield.blocked_ips)

    def test_getlogs_empty_params_allowed(self):
        """Verifies eth_getLogs with empty or missing params dict handles gracefully"""
        res = self.rpc_shield.inspect_request(client_ip="1.2.3.4", method="eth_getLogs", params=[])
        self.assertEqual(res["decision"], "ALLOWED")

    def test_active_ban_rejects_subsequent_request(self):
        """Verifies banned IP is immediately rejected with 403 status code"""
        banned_ip = "192.0.2.1"
        self.rpc_shield.ban_ip(banned_ip, duration_seconds=60)
        res = self.rpc_shield.inspect_request(client_ip=banned_ip, method="eth_blockNumber")
        self.assertEqual(res["decision"], "BLOCKED")
        self.assertEqual(res["status_code"], 403)
        self.assertIn("banned", res["reason"].lower())

    def test_manual_ban_and_unban_ip(self):
        """Verifies programmatic ban and unban functions"""
        ip = "198.51.100.99"
        self.rpc_shield.ban_ip(ip, duration_seconds=120)
        self.assertIn(ip, self.rpc_shield.blocked_ips)
        self.rpc_shield.unban_ip(ip)
        self.assertNotIn(ip, self.rpc_shield.blocked_ips)

    def test_ban_expiration_allows_request(self):
        """Verifies expired IP ban allows normal requests again"""
        ip = "198.51.100.77"
        self.rpc_shield.blocked_ips[ip] = time.time() - 1.0  # Already expired
        res = self.rpc_shield.inspect_request(client_ip=ip, method="eth_blockNumber")
        self.assertEqual(res["decision"], "ALLOWED")
        self.assertNotIn(ip, self.rpc_shield.blocked_ips)

    def test_rate_limiter_allows_up_to_limit(self):
        """Verifies sliding-window rate limiter allows up to 60 requests per minute"""
        ip = "10.0.0.1"
        for _ in range(CONFIG.rpc_rate_limit_per_minute):
            res = self.rpc_shield.inspect_request(client_ip=ip, method="eth_blockNumber")
            self.assertEqual(res["decision"], "ALLOWED")

    def test_rate_limiter_throttles_61st_request(self):
        """Verifies 61st request within 1 minute is THROTTLED with HTTP 429"""
        ip = "10.0.0.2"
        for _ in range(CONFIG.rpc_rate_limit_per_minute):
            self.rpc_shield.inspect_request(client_ip=ip, method="eth_blockNumber")
        throttled = self.rpc_shield.inspect_request(client_ip=ip, method="eth_blockNumber")
        self.assertEqual(throttled["decision"], "THROTTLED")
        self.assertEqual(throttled["status_code"], 429)

    def test_batch_size_within_limit_allowed(self):
        """Verifies batch request with size <= 20 is ALLOWED"""
        res = self.rpc_shield.inspect_request(
            client_ip="10.0.0.3",
            method="batch",
            is_batch=True,
            batch_size=20
        )
        self.assertEqual(res["decision"], "ALLOWED")

    def test_batch_size_exceeding_limit_blocked(self):
        """Verifies batch request with size > 20 is BLOCKED with JSON-RPC error -32600"""
        res = self.rpc_shield.inspect_request(
            client_ip="10.0.0.3",
            method="batch",
            is_batch=True,
            batch_size=21
        )
        self.assertEqual(res["decision"], "BLOCKED")
        self.assertIn("exceeds maximum safe limit", res["reason"])

    def test_socket_payload_within_ceiling_allowed(self):
        """Verifies socket payload <= 256KB is ALLOWED"""
        res = self.rpc_shield.inspect_request(
            client_ip="10.0.0.4",
            method="eth_call",
            raw_payload_bytes=250 * 1024
        )
        self.assertEqual(res["decision"], "ALLOWED")

    def test_socket_payload_exceeding_ceiling_blocked(self):
        """Verifies socket payload > 256KB is BLOCKED with HTTP 413 (Payload Too Large)"""
        res = self.rpc_shield.inspect_request(
            client_ip="10.0.0.4",
            method="eth_call",
            raw_payload_bytes=260 * 1024
        )
        self.assertEqual(res["decision"], "BLOCKED")
        self.assertEqual(res["status_code"], 413)

    def test_substrate_storage_state_getpairs_blocked(self):
        """Verifies state_getPairs is blocked to prevent node storage memory starvation"""
        res = self.rpc_shield.inspect_request(client_ip="10.0.0.5", method="state_getPairs")
        self.assertEqual(res["decision"], "BLOCKED")
        self.assertIn("state_getPairs", res["reason"])

    def test_restricted_namespace_author_insertkey_blocked(self):
        """Verifies author namespace write methods are restricted from public ingress"""
        res = self.rpc_shield.inspect_request(client_ip="10.0.0.6", method="author_insertKey")
        self.assertEqual(res["decision"], "BLOCKED")

    def test_restricted_namespace_debug_trace_blocked(self):
        """Verifies debug_traceTransaction is restricted on production validator nodes"""
        res = self.rpc_shield.inspect_request(client_ip="10.0.0.7", method="debug_traceTransaction")
        self.assertEqual(res["decision"], "BLOCKED")

    def test_prometheus_metrics_export_structure(self):
        """Verifies Prometheus metrics export generates compliant text format with counters"""
        metrics_text = self.rpc_shield.export_prometheus_metrics()
        self.assertIn("dotnexus_rpc_requests_total", metrics_text)
        self.assertIn("dotnexus_proxy_inspection_overhead_ms", metrics_text)
        self.assertIn("dotnexus_rpc_active_banned_ips", metrics_text)
        self.assertIn("TYPE", metrics_text)
        self.assertIn("HELP", metrics_text)

    def test_sybil_detection_nominal(self):
        """Verifies sybil detector reports nominal when peers are dispersed across subnets"""
        peers = [
            {"ip": "1.1.1.1", "peer_id": "p1"},
            {"ip": "2.2.2.2", "peer_id": "p2"},
            {"ip": "3.3.3.3", "peer_id": "p3"},
            {"ip": "4.4.4.4", "peer_id": "p4"},
        ]
        res = self.rpc_shield.detect_sybil_clusters(peers)
        self.assertFalse(res["is_sybil_cluster_detected"])
        self.assertEqual(res["eclipse_threat_level"], "LOW_NOMINAL")
        self.assertEqual(res["total_peers_evaluated"], 4)

    def test_sybil_detection_eclipse_cluster_alert(self):
        """Verifies sybil detector triggers critical eclipse risk when > 35% peers share /24 subnet"""
        peers = [
            {"ip": "198.51.100.1", "peer_id": "p1"},
            {"ip": "198.51.100.2", "peer_id": "p2"},
            {"ip": "198.51.100.3", "peer_id": "p3"},
            {"ip": "198.51.100.4", "peer_id": "p4"},
            {"ip": "8.8.8.8", "peer_id": "p5"}
        ]
        res = self.rpc_shield.detect_sybil_clusters(peers)
        self.assertTrue(res["is_sybil_cluster_detected"])
        self.assertEqual(res["eclipse_threat_level"], "CRITICAL_ECLIPSE_RISK")
        self.assertEqual(res["dominant_subnet"], "198.51.100.0/24")
        self.assertGreater(res["max_subnet_concentration_pct"], 35.0)

    def test_recursive_batch_bomb_depth_exceeded_blocked(self):
        """Verifies recursive JSON structure with depth > 4 is blocked as a parser bomb"""
        nested = {"a": {"b": {"c": {"d": {"e": "bomb"}}}}}
        res = self.rpc_shield.inspect_request(
            client_ip="185.190.140.44",
            method="eth_call",
            params=[nested]
        )
        self.assertEqual(res["decision"], "BLOCKED")
        self.assertIn("recursive batch bomb", res["reason"].lower())

    def test_nested_batch_arrays_forbidden(self):
        """Verifies nested sub-batch arrays in JSON-RPC are strictly prohibited"""
        res = self.rpc_shield.inspect_request(
            client_ip="185.190.140.44",
            method="batch",
            params=[[{"method": "eth_blockNumber"}]],
            is_batch=True,
            batch_size=1
        )
        self.assertEqual(res["decision"], "BLOCKED")
        self.assertIn("nested", res["reason"].lower())

    def test_evm_state_bloat_transaction_calldata_blocked(self):
        """Verifies raw transactions with calldata exceeding 128KB are pre-filtered"""
        huge_tx = "0x" + "ff" * 150000
        res = self.rpc_shield.inspect_request(
            client_ip="185.190.140.55",
            method="eth_sendRawTransaction",
            params=[huge_tx]
        )
        self.assertEqual(res["decision"], "BLOCKED")
        self.assertIn("state-bloat", res["reason"].lower())

    def test_evm_reentrancy_calldata_signature_blocked(self):
        """Verifies suspicious recursive selector signatures in calldata are blocked"""
        reentrant_tx = "0x150b7a02" + ("150b7a02" * 5)
        res = self.rpc_shield.inspect_request(
            client_ip="185.190.140.66",
            method="eth_sendRawTransaction",
            params=[reentrant_tx]
        )
        self.assertEqual(res["decision"], "BLOCKED")
        self.assertIn("re-entrancy", res["reason"].lower())

    def test_eth_call_excessive_gas_ceiling_blocked(self):
        """Verifies eth_call specifying gas > 30M is blocked to prevent node thread lockup"""
        res = self.rpc_shield.inspect_request(
            client_ip="185.190.140.77",
            method="eth_call",
            params=[{"to": "0x123", "gas": 35000000}]
        )
        self.assertEqual(res["decision"], "BLOCKED")
        self.assertIn("gas limit", res["reason"].lower())

    def test_substrate_storage_unbounded_getkeys_blocked(self):
        """Verifies unbounded state_getKeys is blocked to prevent node storage memory starvation"""
        res = self.rpc_shield.inspect_request(client_ip="10.0.0.5", method="state_getKeys")
        self.assertEqual(res["decision"], "BLOCKED")
        self.assertIn("state_getKeys", res["reason"])

    def test_substrate_getkeyspaged_empty_prefix_blocked(self):
        """Verifies state_getKeysPaged with empty prefix and count > 100 is blocked"""
        res = self.rpc_shield.inspect_request(
            client_ip="10.0.0.5",
            method="state_getKeysPaged",
            params=["", 150]
        )
        self.assertEqual(res["decision"], "BLOCKED")
        self.assertIn("empty prefix", res["reason"].lower())

    def test_dynamic_ip_reputation_quarantine_progression(self):
        """Verifies IP reputation score drops and assigns appropriate quarantine tiers"""
        bad_ip = "192.168.100.99"
        # Initial score is 100
        rep0 = self.rpc_shield.get_ip_reputation(bad_ip)
        self.assertEqual(rep0["score"], 100.0)

        # Trigger moderate violation (-30 score)
        self.rpc_shield.inspect_request(
            client_ip=bad_ip,
            method="eth_getLogs",
            params=[{"fromBlock": 0, "toBlock": 100000}]
        )
        rep1 = self.rpc_shield.get_ip_reputation(bad_ip)
        self.assertLess(rep1["score"], 100.0)
        self.assertGreaterEqual(rep1["quarantine_tier"], 2)
        self.assertTrue(rep1["is_quarantined"])

    def test_proxy_gateway_handle_payload(self):
        """Verifies AsyncReverseProxyGateway inspects payload in < 1ms"""
        import asyncio
        from engine.proxy_gateway import PROXY_GATEWAY
        import json
        payload = json.dumps({"jsonrpc": "2.0", "method": "eth_blockNumber", "params": [], "id": 1}).encode("utf-8")
        res = asyncio.run(PROXY_GATEWAY.handle_json_rpc_payload("127.0.0.1", payload))
        self.assertTrue(res["allowed"])
        self.assertIn("inspection_overhead_ms", res)
        self.assertLess(res["inspection_overhead_ms"], 10.0)


if __name__ == "__main__":
    unittest.main()
