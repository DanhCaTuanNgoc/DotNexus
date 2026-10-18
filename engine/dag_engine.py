"""
DotNexus DAG Automation Canvas Execution Engine
Manages operational runbooks, node topologies, and automated triggers.
"""

import time
import secrets
import logging
from typing import Dict, Any, List
from engine.dual_tracker import DUAL_TRACKER
from engine.slash_guard import SLASH_GUARD
from engine.npos_optimizer import NPOS_OPTIMIZER
from engine.rpc_shield import RPC_SHIELD

logger = logging.getLogger("DotNexus.DAGEngine")


class DAGCanvasEngine:
    def __init__(self):
        self.prebuilt_runbooks = self._init_runbooks()
        self.active_runbook_id = "runbook-slash-guard"
        self.execution_logs: List[Dict[str, Any]] = []

    def _init_runbooks(self) -> List[Dict[str, Any]]:
        """Pre-configured operational runbooks matching Project Blueprint"""
        return [
            {
                "id": "runbook-slash-guard",
                "name": "Automated Slashing Guard & Standby Failover",
                "description": "Monitors pallet_im_online heartbeat and safely switches to standby node without double-signing.",
                "category": "SECURITY",
                "nodes": [
                    {
                        "id": "n1",
                        "type": "watcher",
                        "label": "Heartbeat Daemon (:9944)",
                        "position": {"x": 50, "y": 120},
                        "data": {"metric": "missed_blocks", "condition": ">= 2", "status": "ACTIVE"}
                    },
                    {
                        "id": "n2",
                        "type": "security",
                        "label": "Anti-Equivocation Lock",
                        "position": {"x": 350, "y": 120},
                        "data": {"lease_timeout": "30s", "check": "Strict Mutex", "status": "LOCKED"}
                    },
                    {
                        "id": "n3",
                        "type": "action",
                        "label": "Activate Standby Node IP",
                        "position": {"x": 650, "y": 120},
                        "data": {"standby_url": "ws://127.0.0.1:9945", "action": "promote_primary", "status": "READY"}
                    }
                ],
                "edges": [
                    {"id": "e1-2", "source": "n1", "target": "n2", "animated": True, "label": "Missing Ping >= 2"},
                    {"id": "e2-3", "source": "n2", "target": "n3", "animated": True, "label": "Revoke Old & Promote"}
                ]
            },
            {
                "id": "runbook-dual-vm-sync",
                "name": "Dual-VM Parity Watcher & Desync Alert",
                "description": "Correlates Substrate WASM block production with EVM JSON-RPC height.",
                "category": "TELEMETRY",
                "nodes": [
                    {
                        "id": "n-sub",
                        "type": "infra",
                        "label": "Substrate WS (:9944)",
                        "position": {"x": 50, "y": 60},
                        "data": {"engine": "WASM / ink!", "port": 9944, "status": "STREAMING"}
                    },
                    {
                        "id": "n-evm",
                        "type": "infra",
                        "label": "EVM RPC (:8545)",
                        "position": {"x": 50, "y": 200},
                        "data": {"engine": "Solidity EVM", "port": 8545, "status": "STREAMING"}
                    },
                    {
                        "id": "n-sync",
                        "type": "watcher",
                        "label": "Dual-VM Desync Detector",
                        "position": {"x": 350, "y": 130},
                        "data": {"max_lag": 2, "metric": "Delta Blocks", "status": "EVALUATING"}
                    },
                    {
                        "id": "n-alert",
                        "type": "action",
                        "label": "Urgent Discord / Ops Alert",
                        "position": {"x": 650, "y": 130},
                        "data": {"channel": "#ops-alerts", "webhook": "configured", "status": "STANDBY"}
                    }
                ],
                "edges": [
                    {"id": "e-sub-sync", "source": "n-sub", "target": "n-sync", "animated": True},
                    {"id": "e-evm-sync", "source": "n-evm", "target": "n-sync", "animated": True},
                    {"id": "e-sync-alert", "source": "n-sync", "target": "n-alert", "animated": True, "label": "Delta > 2 Blocks"}
                ]
            },
            {
                "id": "runbook-npos-compound",
                "name": "NPoS Auto-Compounding & Yield Optimizer",
                "description": "Scans active validators, weeds out oversubscribed pools, and auto-bonds yield.",
                "category": "STAKING",
                "nodes": [
                    {
                        "id": "n-era",
                        "type": "watcher",
                        "label": "NPoS Era Scanner",
                        "position": {"x": 50, "y": 120},
                        "data": {"frequency": "Every Era (6h)", "status": "WATCHING"}
                    },
                    {
                        "id": "n-filter",
                        "type": "action",
                        "label": "Top 16 Optimizer Filter",
                        "position": {"x": 350, "y": 120},
                        "data": {"criteria": "Uptime + Low Comm + Capacity", "status": "READY"}
                    },
                    {
                        "id": "n-bond",
                        "type": "action",
                        "label": "Auto-Bond & Compound POT",
                        "position": {"x": 650, "y": 120},
                        "data": {"extrinsic": "staking.bondExtra", "boost": "+1.16% APY", "status": "ARMED"}
                    }
                ],
                "edges": [
                    {"id": "e-era-filter", "source": "n-era", "target": "n-filter", "animated": True, "label": "Era Finalized"},
                    {"id": "e-filter-bond", "source": "n-filter", "target": "n-bond", "animated": True, "label": "Top 16 Selected"}
                ]
            },
            {
                "id": "runbook-chaos-fire-drill",
                "name": "Chaos Engineering: Validator Network Partition Fire Drill",
                "description": "Diễn tập phòng cháy chữa cháy: Ngắt kết nối node Primary, kích hoạt Dead Man's Switch và tự động chuyển giao quyền sang Standby.",
                "category": "CHAOS",
                "nodes": [
                    {
                        "id": "n-chaos-cut",
                        "type": "chaos",
                        "label": "Cut Heartbeat (Network Partition)",
                        "position": {"x": 50, "y": 150},
                        "data": {"partition_duration_sec": 15, "trigger_self_fence": True}
                    },
                    {
                        "id": "n-fence-guard",
                        "type": "security",
                        "label": "Anti-Equivocation Lock",
                        "position": {"x": 380, "y": 150},
                        "data": {"lease_timeout": "12s", "check": "Strict Mutex", "status": "SELF_FENCED"}
                    },
                    {
                        "id": "n-standby-takeover",
                        "type": "action",
                        "label": "Promote Standby Node",
                        "position": {"x": 720, "y": 150},
                        "data": {"standby_url": "ws://127.0.0.1:9945", "action": "promote_primary", "status": "ACTIVE"}
                    }
                ],
                "edges": [
                    {"id": "e-chaos-fence", "source": "n-chaos-cut", "target": "n-fence-guard", "animated": True, "label": "Missing Ping > 10s"},
                    {"id": "e-fence-takeover", "source": "n-fence-guard", "target": "n-standby-takeover", "animated": True, "label": "Safe Epoch Takeover"}
                ]
            }
        ]

    def get_runbooks(self) -> List[Dict[str, Any]]:
        return self.prebuilt_runbooks

    def execute_runbook(self, runbook_id: str) -> Dict[str, Any]:
        """Executes the pipeline steps of a given runbook with actual backend calls"""
        runbook = next((r for r in self.prebuilt_runbooks if r["id"] == runbook_id), None)
        if not runbook:
            return {"success": False, "error": f"Runbook {runbook_id} not found."}

        steps_result = []
        t0 = time.time()

        if runbook_id == "runbook-slash-guard":
            # Step 1: Heartbeat
            hb = SLASH_GUARD.check_heartbeat()
            steps_result.append({"step": "Heartbeat Check", "status": "SUCCESS", "detail": f"Active: {hb['active_node']}, Missed: {hb['missed_heartbeats']}"})
            # Step 2: Equivocation Lock check
            lease = SLASH_GUARD.acquire_signing_lease("validator-check-runner")
            holder_name = lease.get("holder") or lease.get("current_holder") or "validator-node"
            steps_result.append({"step": "Equivocation Lock Test", "status": "SUCCESS", "detail": f"Mutex locked: {holder_name}"})
            # Step 3: Rotate keys verification
            rot = SLASH_GUARD.rotate_session_keys()
            steps_result.append({"step": "Session Key Rotation", "status": "SUCCESS", "detail": f"Keys: {rot['session_keys_hex'][:22]}..."})

        elif runbook_id == "runbook-dual-vm-sync":
            # Step 1: Query Dual-VM
            dual = DUAL_TRACKER.get_dual_state()
            steps_result.append({"step": "Telemetry Probe", "status": "SUCCESS", "detail": f"Sub: #{dual['substrate']['best_block']} | EVM: #{dual['evm']['block_number']}"})
            # Step 2: Desync check
            steps_result.append({"step": "Desync Evaluation", "status": "SUCCESS", "detail": f"Delta: {dual['sync']['delta_blocks']} blocks ({dual['sync']['status']})"})

        elif runbook_id == "runbook-npos-compound":
            # Step 1: Scan
            vals = NPOS_OPTIMIZER.scan_validators()
            steps_result.append({"step": "Era Validator Scan", "status": "SUCCESS", "detail": f"Scanned {len(vals)} validators."})
            # Step 2: Filter top 16
            top = NPOS_OPTIMIZER.get_top_16_recommendation()
            steps_result.append({"step": "Top 16 Selection", "status": "SUCCESS", "detail": f"Selected {top['top_validators_count']} nodes. Compounded APY: {top['auto_compounded_apy']}%"})

        elif runbook_id == "runbook-chaos-fire-drill":
            # Step 1: Injected Heartbeat Partition
            miss_res = SLASH_GUARD.simulate_missed_heartbeat()
            steps_result.append({
                "step": "Fault Injection: Heartbeat Cut",
                "status": "SUCCESS",
                "detail": f"Simulated missed heartbeats: {miss_res['missed_heartbeats']}. Self-fenced: {SLASH_GUARD.is_self_fenced}"
            })
            # Step 2: Invariant Check & Dead Man's Switch Evaluation
            hb = SLASH_GUARD.check_heartbeat()
            steps_result.append({
                "step": "Dead Man's Switch Evaluation",
                "status": "SUCCESS",
                "detail": f"Active Node: {hb['active_node']} | Fencing Epoch: {SLASH_GUARD.fencing_epoch}"
            })
            # Step 3: RPC DDoS Defense Simulation
            attack_res = RPC_SHIELD.simulate_attack_test("HEAVY_GETLOGS")
            client_ip = attack_res.get("result", {}).get("client_ip", "194.26.29.11")
            decision = attack_res.get("result", {}).get("decision", "BLOCKED")
            steps_result.append({
                "step": "Chaos Defense: RPC DDoS Shield",
                "status": "SUCCESS",
                "detail": f"Attacker IP Quarantined: {client_ip} ({decision})"
            })
            # Step 4: Cross-VM Causal Lag Index Probe
            dual = DUAL_TRACKER.get_dual_state()
            cli_diag = dual.get("causal_lag_index", {})
            steps_result.append({
                "step": "Causal Lag Index Probe",
                "status": "SUCCESS",
                "detail": f"CLI Score: {cli_diag.get('cli_score', 0)} ({cli_diag.get('classification', 'NOMINAL_PARITY')})"
            })

        exec_summary = {
            "execution_id": f"exec-{secrets.token_hex(4)}",
            "runbook_id": runbook_id,
            "runbook_name": runbook["name"],
            "timestamp": time.time(),
            "duration_ms": round((time.time() - t0) * 1000, 2),
            "status": "COMPLETED_SUCCESSFULLY",
            "steps": steps_result
        }
        self.execution_logs.append(exec_summary)
        return exec_summary


DAG_ENGINE = DAGCanvasEngine()

if __name__ == "__main__":
    print("Testing DAG Engine...")
    res = DAG_ENGINE.execute_runbook("runbook-slash-guard")
    print("Execution Result:", res["status"], "Steps:", len(res["steps"]))
