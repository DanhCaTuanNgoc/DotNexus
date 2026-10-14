"""
DotNexus Central Gateway API Server
Serves REST and realtime diagnostic endpoints for the DotNexus Control Center and CLI.
"""

import time
import psutil
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from engine.config import CONFIG
from engine.dual_tracker import DUAL_TRACKER
from engine.slash_guard import SLASH_GUARD
from engine.npos_optimizer import NPOS_OPTIMIZER
from engine.rpc_shield import RPC_SHIELD
from engine.dag_engine import DAG_ENGINE

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("DotNexus.Server")

app = Flask("DotNexusGateway")
CORS(app, origins="*")


@app.route("/api/status", methods=["GET"])
def get_global_status():
    """Global cluster overview, system stats, and high-level indicators"""
    try:
        dual = DUAL_TRACKER.get_dual_state()
        sec = SLASH_GUARD.get_security_dashboard()
        shield = RPC_SHIELD.get_shield_status()
        npos = NPOS_OPTIMIZER.get_top_16_recommendation()

        mem = psutil.virtual_memory()
        cpu_pct = psutil.cpu_percent(interval=0.1)

        return jsonify({
            "success": True,
            "timestamp": time.time(),
            "network": CONFIG.chain_name,
            "ss58_format": CONFIG.ss58_format,
            "token_symbol": CONFIG.token_symbol,
            "token_decimals": dual["substrate"]["token_decimals"],
            "system_resources": {
                "cpu_percent": cpu_pct,
                "ram_percent": mem.percent,
                "ram_used_mb": round(mem.used / (1024 * 1024), 1),
                "ram_total_mb": round(mem.total / (1024 * 1024), 1)
            },
            "dual_vm": {
                "best_substrate_block": dual["substrate"]["best_block"],
                "finalized_substrate_block": dual["substrate"]["finalized_block"],
                "evm_block_number": dual["evm"]["block_number"],
                "delta_blocks": dual["sync"]["delta_blocks"],
                "sync_status": dual["sync"]["status"],
                "is_synced": dual["sync"]["is_synced"]
            },
            "security": {
                "active_node": sec["active_node"],
                "missed_heartbeats": sec["missed_heartbeats"],
                "equivocation_locked": sec["lock_file_status"] == "LOCKED_SAFE",
                "slashing_risk": sec["heartbeat"]["slashing_risk"]
            },
            "npos": {
                "top_16_count": npos["top_validators_count"],
                "auto_compounded_apy": npos["auto_compounded_apy"],
                "nominal_apy": npos["average_nominal_apy"]
            },
            "shield": {
                "total_inspected": shield["total_inspected"],
                "total_blocked": shield["total_blocked"],
                "total_throttled": shield["total_throttled"],
                "active_bans": shield["active_banned_ips_count"]
            }
        })
    except Exception as e:
        logger.error(f"Error generating global status: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/dual-tracker", methods=["GET"])
def get_dual_tracker():
    """Dual-Engine telemetry, block heights, and mempool segregation"""
    data = DUAL_TRACKER.get_dual_state()
    return jsonify({"success": True, "data": data})


@app.route("/api/slash-guard", methods=["GET"])
def get_slash_guard():
    """Slashing guard status, session keys, heartbeat health, and security log"""
    data = SLASH_GUARD.get_security_dashboard()
    return jsonify({"success": True, "data": data})


@app.route("/api/slash-guard/rotate-keys", methods=["POST"])
def rotate_keys():
    """Triggers automated session key rotation (author_rotateKeys)"""
    rot = SLASH_GUARD.rotate_session_keys()
    return jsonify({"success": True, "data": rot})


@app.route("/api/slash-guard/failover", methods=["POST"])
def trigger_failover():
    """Manually or automated failover toggle between Primary and Standby"""
    body = request.get_json(silent=True) or {}
    reason = body.get("reason", "Operator Manual Switch from Control Center")
    res = SLASH_GUARD.execute_failover(reason=reason)
    return jsonify({"success": True, "data": res})


@app.route("/api/slash-guard/simulate-missed-heartbeat", methods=["POST"])
def simulate_missed_heartbeat():
    """Simulates 1 missed block heartbeat to demonstrate Slashing Guard failover threshold"""
    hb = SLASH_GUARD.check_heartbeat(force_miss=True)
    return jsonify({"success": True, "data": hb})


@app.route("/api/npos/validators", methods=["GET"])
def get_all_validators():
    """Scanned validator set with health scores, commissions, and ratings"""
    refresh = request.args.get("refresh", "false").lower() == "true"
    vals = NPOS_OPTIMIZER.scan_validators(force_refresh=refresh)
    return jsonify({"success": True, "count": len(vals), "data": vals})


@app.route("/api/npos/top-16", methods=["GET"])
def get_top_16():
    """Top 16 optimal validators for NPoS nomination with APY projections"""
    rec = NPOS_OPTIMIZER.get_top_16_recommendation()
    return jsonify({"success": True, "data": rec})


@app.route("/api/npos/rebalance", methods=["POST"])
def rebalance_staking():
    """Computes dynamic stake allocation across top validators"""
    body = request.get_json(silent=True) or {}
    user_stake = float(body.get("stake_pot", 10000.0))
    res = NPOS_OPTIMIZER.generate_rebalance_payload(user_stake_pot=user_stake)
    return jsonify({"success": True, "data": res})


@app.route("/api/rpc-shield", methods=["GET"])
def get_rpc_shield():
    """RPC shield metrics, query inspect logs, and P2P peer topology"""
    data = RPC_SHIELD.get_shield_status()
    return jsonify({"success": True, "data": data})


@app.route("/api/rpc-shield/simulate-attack", methods=["POST"])
def simulate_attack():
    """Triggers an RPC attack simulation (HEAVY_GETLOGS or RATE_LIMIT_BURST)"""
    body = request.get_json(silent=True) or {}
    attack_type = body.get("type", "HEAVY_GETLOGS")
    sim = RPC_SHIELD.simulate_attack_test(attack_type=attack_type)
    return jsonify({"success": True, "data": sim})


@app.route("/api/canvas/runbooks", methods=["GET"])
def get_runbooks():
    """List pre-configured operational runbooks"""
    runbooks = DAG_ENGINE.get_runbooks()
    return jsonify({"success": True, "data": runbooks})


@app.route("/api/canvas/runbooks/<runbook_id>/execute", methods=["POST"])
def execute_runbook(runbook_id):
    """Executes a DAG runbook pipeline"""
    res = DAG_ENGINE.execute_runbook(runbook_id)
    return jsonify({"success": True, "data": res})


@app.route("/api/logs", methods=["GET"])
def get_unified_logs():
    """Aggregated chronological stream of security and operational logs"""
    events = []
    # Collect from slash guard
    for e in SLASH_GUARD.security_events:
        events.append({"source": "SLASH_GUARD", "level": e["level"], "time": e["timestamp"], "text": f"{e['title']}: {e['message']}"})
    # Collect from RPC shield
    for s in RPC_SHIELD.shield_logs:
        events.append({"source": "RPC_SHIELD", "level": s["decision"], "time": s["timestamp"], "text": f"[{s['method']}] from {s['client_ip']} - {s['reason']}"})
    # Collect from DAG engine
    for d in DAG_ENGINE.execution_logs:
        events.append({"source": "DAG_ENGINE", "level": "INFO", "time": d["timestamp"], "text": f"Runbook '{d['runbook_name']}' completed in {d['duration_ms']}ms"})

    # Sort descending
    events.sort(key=lambda x: x["time"], reverse=True)
    return jsonify({"success": True, "count": len(events), "logs": events[:40]})


def run_server():
    logger.info(f"Starting DotNexus Central Gateway on port {CONFIG.engine_port}...")
    app.run(host=CONFIG.engine_host, port=CONFIG.engine_port, debug=False, use_reloader=False)


if __name__ == "__main__":
    run_server()
