"""
DotNexus CLI Tooling Suite
Provides command-line diagnostics and control operations for Portaldot V3.0 node administrators.
"""

import sys
import json
import argparse
from engine.config import CONFIG
from engine.dual_tracker import DUAL_TRACKER
from engine.slash_guard import SLASH_GUARD
from engine.npos_optimizer import NPOS_OPTIMIZER
from engine.rpc_shield import RPC_SHIELD
from engine.dag_engine import DAG_ENGINE


def format_json(obj):
    return json.dumps(obj, indent=2)


def main():
    parser = argparse.ArgumentParser(
        prog="dotnexus",
        description="DotNexus CLI: The Visual Control Plane & Automated Security Engine for Portaldot V3.0"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available operations")

    # Command: dual-vm
    subparsers.add_parser("dual-vm", help="Query live Dual-VM sync status (WASM vs EVM)")

    # Command: rotate-keys
    subparsers.add_parser("rotate-keys", help="Safely rotate validator session keys")

    # Command: failover
    p_fail = subparsers.add_parser("failover", help="Execute failover to standby node")
    p_fail.add_argument("--reason", default="CLI manual switch", help="Reason for failover")

    # Command: npos
    p_npos = subparsers.add_parser("npos", help="Scan and rank active validators for NPoS")
    p_npos.add_argument("--top16", action="store_true", help="Show only optimal top 16")

    # Command: shield-test
    p_shield = subparsers.add_parser("shield-test", help="Simulate attack to verify RPC shield")
    p_shield.add_argument("--type", choices=["HEAVY_GETLOGS", "RATE_LIMIT_BURST"], default="HEAVY_GETLOGS")

    # Command: runbook
    p_rb = subparsers.add_parser("runbook", help="Execute operational DAG runbook")
    p_rb.add_argument(
        "id",
        choices=[
            "runbook-slash-guard",
            "runbook-dual-vm-sync",
            "runbook-npos-compound",
            "runbook-chaos-fire-drill",
            "runbook-treasury-sweep",
            "runbook-health-bot",
            "runbook-rpc-shield",
        ],
        help="Runbook identifier to execute"
    )

    # Command: circuit-breaker
    subparsers.add_parser("circuit-breaker", help="Toggle protective RPC Circuit Breaker gating mode")

    # Command: peers
    subparsers.add_parser("peers", help="Inspect P2P peer topology and Sybil score")

    # Command: logs
    subparsers.add_parser("logs", help="Display recent unified security and telemetry logs")

    # Command: clear-logs
    subparsers.add_parser("clear-logs", help="Flush all active diagnostic streams")

    args = parser.parse_args()

    if args.command == "dual-vm":
        state = DUAL_TRACKER.get_dual_state()
        print("=== DotNexus Dual-Engine Telemetry ===")
        print(f"Substrate WASM Best Block : #{state['substrate']['best_block']}")
        print(f"EVM Block Number          : #{state['evm']['block_number']}")
        print(f"Desync Delta              : {state['sync']['delta_blocks']} blocks ({state['sync']['status']})")
        print(f"Mempool Ratio             : WASM: {state['mempool']['wasm_ratio_pct']}% | EVM: {state['mempool']['evm_ratio_pct']}%")
    elif args.command == "rotate-keys":
        print("Rotating session keys...")
        rot = SLASH_GUARD.rotate_session_keys()
        print(f"Session Keys Hex : {rot['session_keys_hex']}")
        print(f"Extrinsic Call   : {rot['extrinsic_call']}")
    elif args.command == "failover":
        res = SLASH_GUARD.execute_failover(reason=args.reason)
        print(f"Failover Result: {res['previous_node']} -> {res['new_active_node']}")
        print(f"Holder granted: {res['target_id']}")
    elif args.command == "npos":
        if args.top16:
            top = NPOS_OPTIMIZER.get_top_16_recommendation()
            print(f"Optimal Top 16 Validators (Projected Auto-compounded APY: {top['auto_compounded_apy']}%):")
            for idx, val in enumerate(top["validators"], 1):
                print(f"  {idx:2d}. {val['identity']} ({val['stash_address'][:12]}...) - Health: {val['health_score']}/100 | Comm: {val['commission_pct']}% | APY: {val['estimated_apy']}%")
        else:
            all_vals = NPOS_OPTIMIZER.scan_validators()
            print(f"Total Scanned Validators: {len(all_vals)}")
            for v in all_vals:
                print(f"  [{v['recommendation']}] {v['identity']} - Health: {v['health_score']} | Comm: {v['commission_pct']}%")
    elif args.command == "shield-test":
        sim = RPC_SHIELD.simulate_attack_test(attack_type=args.type)
        print("RPC Shield Test Result:")
        print(format_json(sim))
    elif args.command == "runbook":
        res = DAG_ENGINE.execute_runbook(args.id)
        print(f"DAG Runbook '{res['runbook_name']}' completed in {res['duration_ms']}ms:")
        for step in res["steps"]:
            print(f"  [{step['status']}] {step['step']}: {step['detail']}")
    elif args.command == "circuit-breaker":
        cb = DUAL_TRACKER.toggle_circuit_breaker()
        print(f"RPC Circuit Breaker status toggled to {cb.get('status')} (Armed: {cb.get('circuit_breaker_enabled')})")
    elif args.command == "peers":
        shld = RPC_SHIELD.get_shield_status()
        peers = shld.get("p2p_topology", [])
        print(f"Connected P2P Peers: {len(peers)} (Representative Testnet Geo-Sample) | Quarantined IPs: {shld.get('active_banned_ips_count', 0)}")
        for p in peers[:10]:
            print(f"  {p.get('peer_id', 'unknown')[:16]}... | IP: {p.get('ip')} | Client: {p.get('client_version')} | Latency: {p.get('latency_ms')}ms")
    elif args.command == "logs":
        events = []
        for e in SLASH_GUARD.security_events:
            events.append(f"[{e['level']}] [SLASH_GUARD] {e['title']}: {e['message']}")
        for s in RPC_SHIELD.shield_logs:
            events.append(f"[{s['decision']}] [RPC_SHIELD] {s['method']} from {s['client_ip']} - {s['reason']}")
        for d in DAG_ENGINE.execution_logs:
            events.append(f"[INFO] [DAG_ENGINE] Runbook '{d['runbook_name']}' completed in {d['duration_ms']}ms")
        print(f"Latest Diagnostic Logs ({len(events)} events):")
        for log_line in events[-15:]:
            print(f"  {log_line}")
    elif args.command == "clear-logs":
        SLASH_GUARD.security_events.clear()
        RPC_SHIELD.shield_logs.clear()
        DAG_ENGINE.execution_logs.clear()
        print("All diagnostic and security event streams cleared.")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
