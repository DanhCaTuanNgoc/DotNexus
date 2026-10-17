"""
DotNexus Dual-Engine State Tracker
Parallel Telemetry between Substrate WASM (:9944) and EVM JSON-RPC (:8545)
Equipped with 3-Tier Root-Cause Isolation and Decimal Mapping Normalizer (10^14 vs 10^18).
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
        self._mock_peers_count = 14
        self._mock_highest_block = 4120912
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
                type_registry_preset='substrate-node-template'
            )
            # Dynamic decimals resolution from runtime properties (strictly adhering to dynamic decimals policy)
            props = getattr(self.substrate_client, 'properties', {}) or {}
            self.decimals = int(props.get('tokenDecimals', CONFIG.default_token_decimals))
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
        """Probe Portaldot Substrate WS RPC (:9944) for live metrics, peers, and sync state"""
        t0 = time.time()
        best_block = 0
        finalized_block = 0
        pending_extrinsics = 0
        peers_count = 0
        highest_block = 0

        if self._init_substrate():
            try:
                # Query header directly via raw RPC to avoid DigestItem scale-codec decoding errors on Portaldot dev node
                head_res = self.substrate_client.rpc_request("chain_getHeader", [])
                if head_res and head_res.get('result') and 'number' in head_res['result']:
                    best_block = int(head_res['result']['number'], 16)
                else:
                    head_hash = self.substrate_client.get_chain_head()
                    header = self.substrate_client.get_block_header(head_hash)
                    best_block = int(header['header']['number'])

                fin_res = self.substrate_client.rpc_request("chain_getFinalisedHead", [])
                fin_hash = fin_res.get('result') if fin_res else None
                if fin_hash:
                    fin_hdr = self.substrate_client.rpc_request("chain_getHeader", [fin_hash])
                    if fin_hdr and fin_hdr.get('result') and 'number' in fin_hdr['result']:
                        finalized_block = int(fin_hdr['result']['number'], 16)
                    else:
                        finalized_block = max(0, best_block - 1)
                else:
                    finalized_block = max(0, best_block - 1)

                self._last_live_sub_block = best_block

                # Fetch pending extrinsics from author
                try:
                    pending = self.substrate_client.rpc_request("author_pendingExtrinsics", [])
                    pending_extrinsics = len(pending.get('result', []))
                except Exception:
                    pending_extrinsics = 0

                # Query system_peers for P2P connection health
                try:
                    peers_res = self.substrate_client.rpc_request("system_peers", [])
                    peers_count = len(peers_res.get('result', []))
                except Exception:
                    peers_count = 0

                # Query system_syncState for P2P stall diagnosis
                try:
                    sync_res = self.substrate_client.rpc_request("system_syncState", [])
                    highest_block = int(sync_res.get('result', {}).get('highestBlock', best_block))
                except Exception:
                    highest_block = best_block

                latency_ms = round((time.time() - t0) * 1000, 2)
                return {
                    "is_connected": True,
                    "is_live_chain": True,
                    "endpoint": self.substrate_url,
                    "best_block": best_block,
                    "finalized_block": finalized_block,
                    "finality_lag": best_block - finalized_block,
                    "highest_block": highest_block,
                    "peers_count": peers_count,
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
            self._mock_highest_block = self._mock_substrate_block
            self._mock_last_tick = now

        return {
            "is_connected": False,
            "is_live_chain": False,
            "endpoint": self.substrate_url,
            "best_block": self._mock_substrate_block,
            "finalized_block": self._mock_finalized_block,
            "finality_lag": self._mock_substrate_block - self._mock_finalized_block,
            "highest_block": self._mock_highest_block,
            "peers_count": self._mock_peers_count,
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

                # Pending tx count
                try:
                    pending_tx_count = self.web3_client.eth.get_block_transaction_count('pending')
                except Exception:
                    pending_tx_count = 0

                # Base fee per gas from latest block
                base_fee_gwei = 0.0
                try:
                    latest_blk = self.web3_client.eth.get_block('latest')
                    if 'baseFeePerGas' in latest_blk and latest_blk['baseFeePerGas'] is not None:
                        base_fee_gwei = round(latest_blk['baseFeePerGas'] / 1e9, 2)
                    else:
                        base_fee_gwei = round(gas_price_wei / 1e9, 2)
                except Exception:
                    base_fee_gwei = round(gas_price_wei / 1e9, 2)

                return {
                    "is_connected": True,
                    "is_live_chain": True,
                    "endpoint": self.evm_url,
                    "block_number": block_num,
                    "chain_id": chain_id,
                    "gas_price_gwei": round(gas_price_wei / 1e9, 2),
                    "base_fee_gwei": base_fee_gwei,
                    "latency_ms": latency_ms,
                    "pending_transactions": pending_tx_count,
                    "standard_decimals": CONFIG.evm_standard_decimals,
                    "execution_engine": "EVM (Frontier / Pallet-EVM)"
                }
            except Exception as e:
                logger.warning(f"EVM query error: {e}. Resetting client.")
                self.web3_client = None

        # Fallback simulation
        if getattr(self, '_last_live_sub_block', None) is not None:
            evm_sim_block = max(1, self._last_live_sub_block - 1)
        else:
            now = time.time()
            if now - self._mock_last_tick > 6.0:
                self._mock_evm_block = self._mock_substrate_block - 1  # 1 block lag simulated
            evm_sim_block = self._mock_substrate_block - 1

        return {
            "is_connected": False,
            "is_live_chain": False,
            "endpoint": self.evm_url,
            "block_number": evm_sim_block,
            "chain_id": 9944,
            "gas_price_gwei": 21.5,
            "base_fee_gwei": 18.0,
            "latency_ms": 18.7,
            "pending_transactions": 24,
            "standard_decimals": CONFIG.evm_standard_decimals,
            "execution_engine": "EVM (Frontier / Pallet-EVM Simulated)"
        }

    def diagnose_3tier_root_cause(self, sub_telemetry: Dict[str, Any], evm_telemetry: Dict[str, Any]) -> Dict[str, Any]:
        """
        3-Tier Root-Cause Isolation Mechanism:
        - Tier 1: Substrate P2P Stall (peers < 2 OR highest_block - best_block > 10)
        - Tier 2: Frontier Mapping Sync Lag (fc-db bottleneck: sub_block - evm_block >= 2)
        - Tier 3: EVM Execution / Mempool Congestion (delta == 0, evm mempool spike)
        - Tier 0: Healthy Parity
        """
        sub_block = sub_telemetry.get("best_block", 0)
        evm_block = evm_telemetry.get("block_number", 0)
        peers = sub_telemetry.get("peers_count", 0)
        highest_block = sub_telemetry.get("highest_block", sub_block)
        mapping_lag = sub_block - evm_block

        # Tier 1: Substrate P2P Stall
        if (highest_block - sub_block > CONFIG.p2p_stall_block_lag) or (peers < CONFIG.p2p_min_peers):
            return {
                "tier": 1,
                "root_cause_code": "SUBSTRATE_P2P_STALL",
                "severity": "CRITICAL",
                "message": f"Substrate P2P Network Stall: Connected peers ({peers}) < {CONFIG.p2p_min_peers} or block lag ({highest_block - sub_block}) > {CONFIG.p2p_stall_block_lag}.",
                "recommended_action": "Inspect Libp2p port 30333, firewall NAT rules, or inject reserved bootstrap peers via system_addReservedPeer."
            }

        # Tier 2: Frontier Mapping Sync Lag (fc-db Bottleneck)
        if mapping_lag >= CONFIG.frontier_mapping_lag_threshold or evm_block == 0:
            return {
                "tier": 2,
                "root_cause_code": "FRONTIER_FC_DB_LAG",
                "severity": "WARNING",
                "message": f"Frontier Mapping Sync Lag: Substrate block ({sub_block}) ahead of EVM ({evm_block}) by {mapping_lag} blocks.",
                "recommended_action": "Check fc-mapping-sync worker task, disk I/O latency, or SQLite/RocksDB locks on Frontier state store."
            }

        # Tier 3: EVM Execution / Mempool Congestion
        evm_pending = evm_telemetry.get("pending_transactions", 0)
        wasm_pending = sub_telemetry.get("pending_extrinsics", 0)
        base_fee = evm_telemetry.get("base_fee_gwei", 0.0)
        if abs(mapping_lag) <= 1 and evm_pending > 50 and evm_pending > (wasm_pending * 3):
            return {
                "tier": 3,
                "root_cause_code": "EVM_VM_CONGESTION",
                "severity": "ELEVATED",
                "message": f"Local EVM Virtual Machine Congestion: Mempool has {evm_pending} pending EVM txs, baseFee={base_fee} Gwei.",
                "recommended_action": "Throttle inbound DApp RPC traffic via RPC Shield or optimize gas limit parameters."
            }

        return {
            "tier": 0,
            "root_cause_code": "NONE",
            "severity": "OK",
            "message": "Dual-VM state is in 100% lockstep parity across WASM and Frontier EVM.",
            "recommended_action": "System operating normally."
        }

    def compute_causal_lag_index(
        self,
        sub_telemetry: Dict[str, Any],
        evm_telemetry: Dict[str, Any],
        w1: float = 0.50,
        w2: float = 0.30,
        w3: float = 0.20,
        delta_b_max: int = 5,
        epsilon: float = 1.0
    ) -> Dict[str, Any]:
        """
        Cross-VM Causal Lag Index (CLI) Mathematical Formulation:
        CLI = w1 * ((B_WASM - B_EVM) / DeltaB_max)
            + w2 * (TxPool_EVM / (TxPool_WASM + epsilon))
            + w3 * (Latency_8545 / max(1.0, Latency_9944))

        Evaluates 3 real-time orthogonal vectors:
        - Vector 1 (Block Lag): Identifies Frontier/Revive fc-db mapping sync delay.
        - Vector 2 (Mempool Pressure): Identifies EVM VM gas saturation vs Substrate transaction pool.
        - Vector 3 (Transport Latency): Identifies network interface or HTTP/WS thread contention.

        Heuristic Diagnostics:
        - If Vector 1 spikes while Vector 2 is normal -> FRONTIER_DB_LOCK
        - If Vector 2 & Vector 3 spike while delta ~ 0 -> EVM_GAS_SATURATION
        - If Substrate peers drop or Substrate latency spikes -> SUBSTRATE_P2P_STALL
        - Else -> NOMINAL_PARITY
        """
        sub_block = sub_telemetry.get("best_block", 0)
        evm_block = evm_telemetry.get("block_number", 0)
        sub_pending = max(0, sub_telemetry.get("pending_extrinsics", 0))
        evm_pending = max(0, evm_telemetry.get("pending_transactions", 0))
        sub_latency = max(1.0, float(sub_telemetry.get("latency_ms", 15.0)))
        evm_latency = max(1.0, float(evm_telemetry.get("latency_ms", 18.0)))
        peers = sub_telemetry.get("peers_count", 8)
        highest_sub = sub_telemetry.get("highest_block", sub_block)

        # 1. Vector Calculations
        block_delta = sub_block - evm_block
        v1_block_lag = max(0.0, block_delta / float(delta_b_max))
        v2_mempool_skew = float(evm_pending) / float(sub_pending + epsilon)
        v3_latency_skew = float(evm_latency) / float(sub_latency)

        # 2. Composite CLI Index Calculation
        raw_cli = (w1 * v1_block_lag) + (w2 * min(v2_mempool_skew, 5.0) / 5.0) + (w3 * min(v3_latency_skew, 5.0) / 5.0)
        cli_score = round(min(100.0, raw_cli * 100.0), 2)

        # 3. Automated Heuristic Classification
        if (highest_sub - sub_block > CONFIG.p2p_stall_block_lag) or (peers < CONFIG.p2p_min_peers):
            classification = "SUBSTRATE_P2P_STALL"
            diagnosis_msg = f"CLI {cli_score}: Substrate Libp2p network stall detected (peers: {peers}, lag: {highest_sub - sub_block})."
        elif v1_block_lag >= 0.4:  # >= 2 blocks desync
            classification = "FRONTIER_DB_LOCK"
            diagnosis_msg = f"CLI {cli_score}: Substrate-to-EVM mapping bottleneck (delta: {block_delta} blocks). Check fc-mapping-sync or RocksDB locks."
        elif v2_mempool_skew >= 3.0 and evm_pending > 50:
            classification = "EVM_GAS_SATURATION"
            diagnosis_msg = f"CLI {cli_score}: EVM gas saturation detected. Mempool ratio is {round(v2_mempool_skew, 1)}x Substrate pool."
        elif cli_score > 35.0:
            classification = "ELEVATED_SKEW"
            diagnosis_msg = f"CLI {cli_score}: Elevated cross-VM skew across latency or mempool distribution."
        else:
            classification = "NOMINAL_PARITY"
            diagnosis_msg = f"CLI {cli_score}: Cross-VM causal synchronization is in nominal lockstep."

        return {
            "cli_score": cli_score,
            "raw_cli": round(raw_cli, 4),
            "classification": classification,
            "diagnosis_message": diagnosis_msg,
            "vector_breakdown": {
                "block_lag_vector": round(v1_block_lag, 3),
                "mempool_skew_vector": round(v2_mempool_skew, 3),
                "latency_skew_vector": round(v3_latency_skew, 3),
                "block_delta": block_delta,
                "evm_pending": evm_pending,
                "wasm_pending": sub_pending,
                "evm_latency_ms": round(evm_latency, 1),
                "wasm_latency_ms": round(sub_latency, 1)
            },
            "weights": {
                "w1_block_lag": w1,
                "w2_mempool": w2,
                "w3_latency": w3
            }
        }

    def normalize_pot_balance(self, raw_substrate_balance: int, raw_evm_balance: int) -> Dict[str, Any]:
        """
        Safely normalizes token balance between Substrate (14 decimals - Planck)
        and EVM (18 decimals - Wei). Prevents integer overflow by using Python int
        and serializing to string for JavaScript BigInt compatibility.
        Scale factor: 10^(18 - 14) = 10^4 = 10,000.
        """
        scale_factor = CONFIG.decimal_scale_multiplier
        evm_in_planck = raw_evm_balance // scale_factor
        discrepancy_planck = abs(raw_substrate_balance - evm_in_planck)

        return {
            "substrate_balance_planck": str(raw_substrate_balance),
            "evm_balance_wei": str(raw_evm_balance),
            "evm_balance_normalized_planck": str(evm_in_planck),
            "discrepancy_planck": str(discrepancy_planck),
            "is_parity_clean": discrepancy_planck == 0,
            "token_decimals_substrate": self.decimals,
            "token_decimals_evm": CONFIG.evm_standard_decimals,
            "scale_factor": scale_factor,
            "pot_readable": raw_substrate_balance / (10 ** self.decimals)
        }

    def get_dual_state(self) -> Dict[str, Any]:
        """
        Calculates synchronicity delta, mempool distribution, 3-tier root-cause diagnosis,
        and decimal mapping normalization.
        """
        sub_telemetry = self.get_substrate_telemetry()
        evm_telemetry = self.get_evm_telemetry()

        sub_block = sub_telemetry["best_block"]
        evm_block = evm_telemetry["block_number"]
        delta = abs(sub_block - evm_block)

        # 3-Tier Root Cause Diagnosis
        diagnosis = self.diagnose_3tier_root_cause(sub_telemetry, evm_telemetry)

        # Legacy status evaluation (backward compatible with tests & UI)
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

        # Algorithmic Cross-VM Causal Lag Index
        cli_telemetry = self.compute_causal_lag_index(sub_telemetry, evm_telemetry)

        # Sample safe BigInt balance check (100 POT in Planck vs Wei)
        sample_planck = 100 * (10 ** self.decimals)
        sample_wei = 100 * (10 ** CONFIG.evm_standard_decimals)
        decimal_norm = self.normalize_pot_balance(sample_planck, sample_wei)

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
            "root_cause_diagnosis": diagnosis,
            "causal_lag_index": cli_telemetry,
            "decimal_normalization": decimal_norm,
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
    print("Testing Dual-Engine Tracker with 3-Tier Diagnosis...")
    data = DUAL_TRACKER.get_dual_state()
    import json
    print(json.dumps(data, indent=2))
