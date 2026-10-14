"""
DotNexus Dual-Engine State Tracker
Parallel Telemetry between Substrate WASM (:9944) and EVM JSON-RPC (:8545)
"""

import time
import logging
from typing import Dict, Any, Optional
from engine.config import CONFIG

logger = logging.getLogger("DotNexus.DualTracker")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

# Attempt imports with graceful safety
try:
    from substrateinterface import SubstrateInterface
except ImportError:
    SubstrateInterface = None

try:
    from web3 import Web3
except ImportError:
    Web3 = None


class DualEngineTracker:
    def __init__(self, substrate_url: Optional[str] = None, evm_url: Optional[str] = None):
        self.substrate_url = substrate_url or CONFIG.substrate_ws_url
        self.evm_url = evm_url or CONFIG.evm_rpc_url
        self.substrate_client: Optional[Any] = None
        self.web3_client: Optional[Any] = None
        self.decimals: int = CONFIG.default_token_decimals

        # Simulation fallback state (in case local node is offline)
        self._mock_substrate_block = 4120912
        self._mock_finalized_block = 4120909
        self._mock_evm_block = 4120911
        self._mock_last_tick = time.time()

    def _init_substrate(self) -> bool:
        if self.substrate_client is not None:
            return True
        if SubstrateInterface is None:
            return False
        try:
            # Set short timeout to avoid blocking if local node is not yet up
            self.substrate_client = SubstrateInterface(
                url=self.substrate_url,
                ss58_format=CONFIG.ss58_format,
                type_registry_preset='default'
            )
            # Dynamic decimals resolution from runtime properties (as recommended in technique_informations.md)
            props = getattr(self.substrate_client, 'properties', {}) or {}
            self.decimals = props.get('tokenDecimals', CONFIG.default_token_decimals)
            logger.info(f"Substrate connected at {self.substrate_url} (Token Decimals: {self.decimals})")
            return True
        except Exception as e:
            logger.debug(f"Substrate connection probe failed at {self.substrate_url}: {e}")
            self.substrate_client = None
            return False

    def _init_evm(self) -> bool:
        if self.web3_client is not None:
            return True
        if Web3 is None:
            return False
        try:
            w3 = Web3(Web3.HTTPProvider(self.evm_url, request_kwargs={'timeout': 2}))
            if w3.is_connected():
                self.web3_client = w3
                logger.info(f"EVM JSON-RPC connected at {self.evm_url}")
                return True
        except Exception as e:
            logger.debug(f"EVM connection probe failed at {self.evm_url}: {e}")
            self.web3_client = None
        return False

    def get_substrate_telemetry(self) -> Dict[str, Any]:
        """Probe Portaldot Substrate WS RPC (:9944) for live metrics"""
        t0 = time.time()
        is_live = False
        best_block = 0
        finalized_block = 0
        pending_extrinsics = 0

        if self._init_substrate():
            try:
                head_hash = self.substrate_client.get_chain_head()
                header = self.substrate_client.get_block_header(head_hash)
                best_block = int(header['header']['number'])

                finalized_hash = self.substrate_client.get_chain_finalised_head()
                finalized_header = self.substrate_client.get_block_header(finalized_hash)
                finalized_block = int(finalized_header['header']['number'])

                # Try fetching pending extrinsics from author
                try:
                    pending = self.substrate_client.rpc_request("author_pendingExtrinsics", [])
                    pending_extrinsics = len(pending.get('result', []))
                except Exception:
                    pending_extrinsics = 0

                latency_ms = round((time.time() - t0) * 1000, 2)
                is_live = True
                return {
                    "is_connected": True,
                    "is_live_chain": True,
                    "endpoint": self.substrate_url,
                    "best_block": best_block,
                    "finalized_block": finalized_block,
                    "finality_lag": best_block - finalized_block,
                    "latency_ms": latency_ms,
                    "pending_extrinsics": pending_extrinsics,
                    "token_decimals": self.decimals,
                    "ss58_format": CONFIG.ss58_format,
                    "execution_engine": "WASM / ink! Pallet-Contracts"
                }
            except Exception as e:
                logger.warning(f"Substrate query error: {e}. Resetting client.")
                self.substrate_client = None

        # Fallback simulation
        now = time.time()
        elapsed = now - self._mock_last_tick
        if elapsed > 6.0:  # ~6 second Substrate block time
            blocks_to_add = int(elapsed // 6.0)
            self._mock_substrate_block += blocks_to_add
            self._mock_finalized_block = self._mock_substrate_block - 3
            self._mock_last_tick = now

        return {
            "is_connected": False,
            "is_live_chain": False,
            "endpoint": self.substrate_url,
            "best_block": self._mock_substrate_block,
            "finalized_block": self._mock_finalized_block,
            "finality_lag": self._mock_substrate_block - self._mock_finalized_block,
            "latency_ms": 14.2,
            "pending_extrinsics": 18,
            "token_decimals": self.decimals,
            "ss58_format": CONFIG.ss58_format,
            "execution_engine": "WASM / ink! Pallet-Contracts (Simulated)"
        }

    def get_evm_telemetry(self) -> Dict[str, Any]:
        """Probe Portaldot EVM JSON-RPC (:8545) for live metrics"""
        t0 = time.time()
        if self._init_evm():
            try:
                block_num = self.web3_client.eth.block_number
                gas_price_wei = self.web3_client.eth.gas_price
                chain_id = self.web3_client.eth.chain_id
                latency_ms = round((time.time() - t0) * 1000, 2)

                # Try checking txpool
                try:
                    pending_tx_count = self.web3_client.eth.get_block_transaction_count('pending')
                except Exception:
                    pending_tx_count = 0

                return {
                    "is_connected": True,
                    "is_live_chain": True,
                    "endpoint": self.evm_url,
                    "block_number": block_num,
                    "chain_id": chain_id,
                    "gas_price_gwei": round(gas_price_wei / 1e9, 2),
                    "latency_ms": latency_ms,
                    "pending_transactions": pending_tx_count,
                    "execution_engine": "EVM (Frontier / Pallet-EVM)"
                }
            except Exception as e:
                logger.warning(f"EVM query error: {e}. Resetting client.")
                self.web3_client = None

        # Fallback simulation
        now = time.time()
        if now - self._mock_last_tick > 6.0:
            self._mock_evm_block = self._mock_substrate_block - 1  # 1 block lag simulated

        return {
            "is_connected": False,
            "is_live_chain": False,
            "endpoint": self.evm_url,
            "block_number": self._mock_substrate_block - 1,
            "chain_id": 9944,
            "gas_price_gwei": 21.5,
            "latency_ms": 18.7,
            "pending_transactions": 24,
            "execution_engine": "EVM (Frontier / Pallet-EVM Simulated)"
        }

    def get_dual_state(self) -> Dict[str, Any]:
        """
        Calculates synchronicity delta, mempool distribution, and state health.
        """
        sub_telemetry = self.get_substrate_telemetry()
        evm_telemetry = self.get_evm_telemetry()

        sub_block = sub_telemetry["best_block"]
        evm_block = evm_telemetry["block_number"]
        delta = abs(sub_block - evm_block)

        # Health status evaluation
        if delta == 0:
            status = "SYNCED"
            severity = "OK"
            message = "Dual-VM state is in 100% lockstep parity."
        elif delta <= CONFIG.max_desync_block_delta:
            status = "MINIMAL_LAG"
            severity = "INFO"
            message = f"Normal propagation lag ({delta} blocks)."
        elif delta <= 5:
            status = "DESYNC_WARNING"
            severity = "WARNING"
            message = f"Warning: EVM execution lagging behind Substrate by {delta} blocks."
        else:
            status = "DESYNC_CRITICAL"
            severity = "CRITICAL"
            message = f"CRITICAL: Engine divergence detected! Delta is {delta} blocks."

        # Mempool segregation
        wasm_pending = sub_telemetry["pending_extrinsics"]
        evm_pending = evm_telemetry["pending_transactions"]
        total_pending = wasm_pending + evm_pending
        wasm_ratio = round((wasm_pending / total_pending * 100), 1) if total_pending > 0 else 50.0
        evm_ratio = round((evm_pending / total_pending * 100), 1) if total_pending > 0 else 50.0

        return {
            "timestamp": time.time(),
            "substrate": sub_telemetry,
            "evm": evm_telemetry,
            "sync": {
                "delta_blocks": delta,
                "status": status,
                "severity": severity,
                "message": message,
                "threshold": CONFIG.max_desync_block_delta,
                "is_synced": delta <= CONFIG.max_desync_block_delta
            },
            "mempool": {
                "total_pending": total_pending,
                "wasm_extrinsics": wasm_pending,
                "evm_transactions": evm_pending,
                "wasm_ratio_pct": wasm_ratio,
                "evm_ratio_pct": evm_ratio
            }
        }


# Global Tracker Instance
DUAL_TRACKER = DualEngineTracker()

if __name__ == "__main__":
    print("Testing Dual-Engine Tracker...")
    data = DUAL_TRACKER.get_dual_state()
    import json
    print(json.dumps(data, indent=2))
