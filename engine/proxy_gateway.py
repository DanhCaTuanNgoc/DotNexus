"""
DotNexus Asynchronous Reverse Proxy Gateway
Intercepts incoming public traffic at port 8546 (EVM) and 9945 (Substrate),
performs sub-millisecond deep inspection via RPC_SHIELD,
and forwards validated requests to internal node endpoints (127.0.0.1:8545 / :9944).
"""

import time
import json
import logging
import asyncio
from typing import Dict, Any, Optional
from engine.config import CONFIG
from engine.rpc_shield import RPC_SHIELD

logger = logging.getLogger("DotNexus.ProxyGateway")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


class AsyncReverseProxyGateway:
    def __init__(
        self,
        listen_host: str = "0.0.0.0",
        evm_proxy_port: int = 8546,
        evm_target_url: Optional[str] = None,
        substrate_proxy_port: int = 9945,
        substrate_target_url: Optional[str] = None
    ):
        self.listen_host = listen_host
        self.evm_proxy_port = evm_proxy_port
        self.evm_target_url = evm_target_url or CONFIG.evm_rpc_url
        self.substrate_proxy_port = substrate_proxy_port
        self.substrate_target_url = substrate_target_url or CONFIG.substrate_ws_url
        self.is_running = False
        self.stats = {
            "total_forwarded": 0,
            "total_blocked": 0,
            "total_throttled": 0,
            "avg_forward_latency_ms": 0.0
        }

    async def handle_json_rpc_payload(self, client_ip: str, raw_payload: bytes) -> Dict[str, Any]:
        """
        Inspects payload in < 1ms before forwarding to internal node.
        Returns interception decision or forward instructions.
        """
        payload_len = len(raw_payload)
        t0 = time.perf_counter()

        # Parse JSON-RPC structure
        try:
            body = json.loads(raw_payload.decode("utf-8"))
        except Exception as e:
            RPC_SHIELD.total_blocked += 1
            return {
                "allowed": False,
                "status_code": 400,
                "response": {
                    "jsonrpc": "2.0",
                    "error": {"code": -32700, "message": f"Parse error: {str(e)}"},
                    "id": None
                }
            }

        # Handle batch vs single request
        if isinstance(body, list):
            is_batch = True
            batch_size = len(body)
            first_method = body[0].get("method", "batch") if batch_size > 0 and isinstance(body[0], dict) else "batch"
            params = [b.get("params") for b in body if isinstance(b, dict)]
            req_id = body[0].get("id") if batch_size > 0 and isinstance(body[0], dict) else None
        elif isinstance(body, dict):
            is_batch = False
            batch_size = 1
            first_method = body.get("method", "")
            params = body.get("params")
            req_id = body.get("id")
        else:
            return {
                "allowed": False,
                "status_code": 400,
                "response": {
                    "jsonrpc": "2.0",
                    "error": {"code": -32600, "message": "Invalid Request: expected object or array"},
                    "id": None
                }
            }

        # Execute Shield Deep Inspection
        inspect_res = RPC_SHIELD.inspect_request(
            client_ip=client_ip,
            method=first_method,
            params=params,
            raw_payload_bytes=payload_len,
            is_batch=is_batch,
            batch_size=batch_size
        )

        decision = inspect_res.get("decision", "ALLOWED")

        if decision == "BLOCKED":
            self.stats["total_blocked"] += 1
            return {
                "allowed": False,
                "status_code": inspect_res.get("status_code", 403),
                "response": {
                    "jsonrpc": "2.0",
                    "error": {
                        "code": -32600 if inspect_res.get("status_code") == 400 else -32000,
                        "message": f"DotNexus RPC Shield [BLOCKED]: {inspect_res.get('reason', 'Security violation')}"
                    },
                    "id": req_id
                }
            }
        elif decision == "THROTTLED":
            self.stats["total_throttled"] += 1
            return {
                "allowed": False,
                "status_code": 429,
                "response": {
                    "jsonrpc": "2.0",
                    "error": {
                        "code": -32005,
                        "message": f"DotNexus RPC Shield [THROTTLED]: Rate limit exceeded (60 req/min). Try again later."
                    },
                    "id": req_id
                }
            }

        # If allowed, calculate latency overhead
        overhead_ms = round((time.perf_counter() - t0) * 1000.0, 3)
        self.stats["total_forwarded"] += 1

        return {
            "allowed": True,
            "status_code": 200,
            "method": first_method,
            "inspection_overhead_ms": overhead_ms,
            "forward_target": self.evm_target_url
        }

    def get_gateway_telemetry(self) -> Dict[str, Any]:
        """Provides status for reverse proxy health monitoring"""
        return {
            "status": "ONLINE" if self.is_running else "READY",
            "listen_host": self.listen_host,
            "evm_proxy_port": self.evm_proxy_port,
            "evm_target_url": self.evm_target_url,
            "substrate_proxy_port": self.substrate_proxy_port,
            "substrate_target_url": self.substrate_target_url,
            "stats": self.stats,
            "shield_status": RPC_SHIELD.get_shield_status()
        }


# Global Gateway Instance
PROXY_GATEWAY = AsyncReverseProxyGateway()

if __name__ == "__main__":
    print(f"DotNexus Proxy Gateway initialized on :{PROXY_GATEWAY.evm_proxy_port} -> {PROXY_GATEWAY.evm_target_url}")
    test_payload = json.dumps({"jsonrpc": "2.0", "method": "eth_blockNumber", "params": [], "id": 1}).encode("utf-8")
    loop = asyncio.new_event_loop()
    res = loop.run_until_complete(PROXY_GATEWAY.handle_json_rpc_payload("127.0.0.1", test_payload))
    print("Test Proxy Handle Result:", res)
