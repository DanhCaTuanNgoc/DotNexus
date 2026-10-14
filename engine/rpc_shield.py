"""
DotNexus RPC Anti-Spam Shield & P2P Topology Analyzer
Protects Portaldot Network V3.0 RPC Nodes from OOM crashes caused by heavy archival queries (eth_getLogs),
enforces dynamic rate-limiting, and tracks network topology.
"""

import time
import secrets
import logging
from typing import Dict, Any, List, Optional
from collections import defaultdict
from engine.config import CONFIG

logger = logging.getLogger("DotNexus.RPCShield")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


class RPCShield:
    def __init__(self):
        self.max_block_range = CONFIG.max_rpc_block_range
        self.rate_limit_per_min = CONFIG.rpc_rate_limit_per_minute

        # In-memory IP tracking: ip -> list of timestamps
        self.ip_request_history: Dict[str, list[float]] = defaultdict(list)
        self.blocked_ips: Dict[str, float] = {}  # ip -> unblock_timestamp

        # Security metrics
        self.total_inspected = 0
        self.total_allowed = 0
        self.total_blocked = 0
        self.total_throttled = 0
        self.shield_logs: List[Dict[str, Any]] = []

        # Peer topology data
        self.peer_topology = self._init_p2p_topology()

    def _init_p2p_topology(self) -> List[Dict[str, Any]]:
        """Initializes realistic P2P peer topology for Portaldot V3.0"""
        return [
            {
                "peer_id": "12D3KooWDpJ7As7yhfrBpwt3xQv8v17jQxMvdJ8vXj34M7fL4qU",
                "ip": "142.93.18.24",
                "location": "Frankfurt, Germany",
                "client_version": "portaldot/v3.0.0-rc1-wasm",
                "protocol": "/portaldot/sync/3.0",
                "latency_ms": 18,
                "role": "Authority (Validator)",
                "status": "HEALTHY",
                "is_malicious": False
            },
            {
                "peer_id": "12D3KooWStqW7qXQcK2L9xJp4rF5tY3mZ9vN2k8pQ1s4D7xL9aB",
                "ip": "165.227.84.112",
                "location": "Singapore",
                "client_version": "portaldot/v3.0.0-rc1-evm",
                "protocol": "/portaldot/sync/3.0",
                "latency_ms": 42,
                "role": "Full Node (RPC)",
                "status": "HEALTHY",
                "is_malicious": False
            },
            {
                "peer_id": "12D3KooWRv5bN3xK8pM1s9Q4tY7mZ2k8pQ1s4D7xL9aB123456C",
                "ip": "198.51.100.45",
                "location": "New York, USA",
                "client_version": "portaldot/v3.0.0-rc1-wasm",
                "protocol": "/portaldot/sync/3.0",
                "latency_ms": 85,
                "role": "Authority (Validator)",
                "status": "HEALTHY",
                "is_malicious": False
            },
            {
                "peer_id": "12D3KooWBadActorX99SpammerBotAttacker99999999999999X",
                "ip": "203.0.113.88",
                "location": "Unknown (Tor Proxy)",
                "client_version": "custom-spammer/v1.0",
                "protocol": "/portaldot/invalid/0.1",
                "latency_ms": 240,
                "role": "Unknown Peer",
                "status": "FLAGGED_SUSPICIOUS",
                "is_malicious": True,
                "anomaly": "Repeated invalid block proposals and spam requests"
            }
        ]

    def inspect_request(self, client_ip: str, method: str, params: Any = None) -> Dict[str, Any]:
        """
        Deep packet inspection for RPC requests:
        1. Checks if IP is currently banned
        2. Detects dangerous/heavy methods (e.g. wide eth_getLogs, debug methods)
        3. Enforces IP rate-limiting
        """
        self.total_inspected += 1
        now = time.time()

        # 1. Check if IP is under active ban
        if client_ip in self.blocked_ips:
            if now < self.blocked_ips[client_ip]:
                self.total_blocked += 1
                return self._log_shield_event(
                    client_ip, method, "BLOCKED", 403,
                    f"IP banned until {int(self.blocked_ips[client_ip] - now)}s remaining"
                )
            else:
                del self.blocked_ips[client_ip]

        # 2. Inspect method parameters for Heavy/Dangerous queries
        # Scenario A: eth_getLogs span explosion
        if method == "eth_getLogs" and isinstance(params, list) and len(params) > 0:
            filter_obj = params[0]
            if isinstance(filter_obj, dict):
                from_block = filter_obj.get("fromBlock")
                to_block = filter_obj.get("toBlock")
                if from_block is not None and to_block is not None:
                    try:
                        # Convert hex or int
                        start = int(from_block, 16) if isinstance(from_block, str) and from_block.startswith("0x") else int(from_block)
                        end = int(to_block, 16) if isinstance(to_block, str) and to_block.startswith("0x") else int(to_block)
                        span = abs(end - start)
                        if span > self.max_block_range:
                            self.total_blocked += 1
                            # Ban aggressive IP for 60 seconds
                            self.blocked_ips[client_ip] = now + 60.0
                            return self._log_shield_event(
                                client_ip, method, "BLOCKED", 400,
                                f"Query span {span} blocks exceeds max safe limit of {self.max_block_range}. IP banned for 60s."
                            )
                    except (ValueError, TypeError):
                        pass

        # Scenario B: Forbidden debug methods
        if method.startswith("debug_") or method in ["admin_addPeer", "admin_removePeer"]:
            self.total_blocked += 1
            return self._log_shield_event(
                client_ip, method, "BLOCKED", 403,
                f"RPC method '{method}' is restricted on production validator nodes."
            )

        # 3. Dynamic IP Rate-Limiting (Sliding Window 60s)
        recent_requests = [t for t in self.ip_request_history[client_ip] if now - t < 60.0]
        self.ip_request_history[client_ip] = recent_requests

        if len(recent_requests) >= self.rate_limit_per_min:
            self.total_throttled += 1
            return self._log_shield_event(
                client_ip, method, "THROTTLED", 429,
                f"Rate limit exceeded: {len(recent_requests)} req/min (Limit: {self.rate_limit_per_min})"
            )

        # Record valid request
        self.ip_request_history[client_ip].append(now)
        self.total_allowed += 1
        return {
            "decision": "ALLOWED",
            "status_code": 200,
            "client_ip": client_ip,
            "method": method,
            "message": "Passed security filters."
        }

    def _log_shield_event(self, client_ip: str, method: str, decision: str, code: int, reason: str) -> Dict[str, Any]:
        evt = {
            "id": f"shld-{secrets.token_hex(4)}",
            "timestamp": time.time(),
            "client_ip": client_ip,
            "method": method,
            "decision": decision,
            "status_code": code,
            "reason": reason
        }
        self.shield_logs.append(evt)
        self.shield_logs = self.shield_logs[-50:]  # Keep latest 50 events
        logger.warning(f"RPC Shield: [{decision}] {client_ip} -> {method}: {reason}")
        return evt

    def simulate_attack_test(self, attack_type: str = "HEAVY_GETLOGS") -> Dict[str, Any]:
        """
        Simulates an incoming malicious traffic burst to verify shield defenses
        """
        if attack_type == "HEAVY_GETLOGS":
            # Simulate a query trying to read 500,000 blocks at once
            res = self.inspect_request(
                client_ip="194.26.29.11",
                method="eth_getLogs",
                params=[{"fromBlock": "0x1", "toBlock": "0x7A120"}]  # 1 to 500,000 blocks
            )
            return {"attack_type": attack_type, "simulated_payload": "eth_getLogs span: 500,000 blocks", "result": res}
        elif attack_type == "RATE_LIMIT_BURST":
            # Fire 70 requests from same IP in short burst
            test_ip = "185.190.140.22"
            res = None
            for _ in range(self.rate_limit_per_min + 5):
                res = self.inspect_request(client_ip=test_ip, method="eth_blockNumber")
            return {"attack_type": attack_type, "burst_count": self.rate_limit_per_min + 5, "last_result": res}
        else:
            res = self.inspect_request(client_ip="103.251.167.2", method="debug_traceTransaction")
            return {"attack_type": attack_type, "result": res}

    def get_shield_status(self) -> Dict[str, Any]:
        """Returns aggregated metrics for Frontend Radar & Shield panel"""
        return {
            "total_inspected": self.total_inspected,
            "total_allowed": self.total_allowed,
            "total_blocked": self.total_blocked,
            "total_throttled": self.total_throttled,
            "active_banned_ips_count": len(self.blocked_ips),
            "max_block_range_setting": self.max_block_range,
            "rate_limit_per_minute_setting": self.rate_limit_per_min,
            "recent_events": self.shield_logs[-15:],
            "p2p_topology": self.peer_topology
        }


# Global Shield Instance
RPC_SHIELD = RPCShield()

if __name__ == "__main__":
    print("Testing RPC Shield...")
    attack_sim = RPC_SHIELD.simulate_attack_test("HEAVY_GETLOGS")
    print("Heavy getLogs Defense:", attack_sim["result"]["decision"], "-", attack_sim["result"]["reason"])
    status = RPC_SHIELD.get_shield_status()
    print(f"Total Inspected: {status['total_inspected']} | Blocked: {status['total_blocked']}")
