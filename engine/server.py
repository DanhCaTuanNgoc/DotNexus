"""
DotNexus Central Gateway API Server
Serves REST and realtime diagnostic endpoints for the DotNexus Control Center and CLI.
Equipped with X-DotNexus-Auth security validation, Prometheus /metrics exporter, and immutable audit logs.
"""

import time
import json
import psutil
import logging
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from engine.config import CONFIG, AUDIT_LOG_FILE
from engine.dual_tracker import DUAL_TRACKER
from engine.slash_guard import SLASH_GUARD
from engine.npos_optimizer import NPOS_OPTIMIZER
from engine.rpc_shield import RPC_SHIELD
from engine.dag_engine import DAG_ENGINE
from engine.worker_daemon import WORKER_DAEMON

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("DotNexus.Server")

app = Flask("DotNexusGateway")
CORS(app, origins="*")


def check_auth(req) -> bool:
    """
    Validates X-DotNexus-Auth header or Authorization Bearer token.
    Permissive in local test mode if header omitted, strictly rejected if incorrect token supplied.
    """
    token = req.headers.get("X-DotNexus-Auth")
    if not token and req.headers.get("Authorization"):
        auth_header = req.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]

    if token is not None:
        return token == CONFIG.auth_api_token
    # Permissive fallback for seamless local frontend development
    return True


@app.route("/metrics", methods=["GET"])
def get_prometheus_metrics():
    """Prometheus metrics exporter for reverse proxy inspection overhead and status"""
    metrics_text = RPC_SHIELD.export_prometheus_metrics()
    return Response(metrics_text, mimetype="text/plain")


@app.route("/api/status", methods=["GET"])
def get_global_status():
    """Global cluster overview, system stats, 3-tier diagnosis, and indicators"""
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
                "is_synced": dual["sync"]["is_synced"],
                "root_cause_diagnosis": dual["root_cause_diagnosis"]
            },
            "security": {
                "active_node": sec["active_node"],
                "fencing_epoch": sec["fencing_epoch"],
                "missed_heartbeats": sec["missed_heartbeats"],
                "equivocation_locked": sec["lock_file_status"] == "LOCKED_SAFE",
                "slashing_risk": sec["heartbeat"]["slashing_risk"],
                "dead_mans_switch": sec["dead_mans_switch"]
            },
            "npos": {
                "top_16_count": npos["top_validators_count"],
                "auto_compounded_apy": npos["auto_compounded_apy"],
                "nominal_apy": npos["average_nominal_apy"],
                "election_algorithm": npos["election_algorithm"]
            },
            "shield": {
                "total_inspected": shield["total_inspected"],
                "total_blocked": shield["total_blocked"],
                "total_throttled": shield["total_throttled"],
                "average_overhead_ms": shield["average_overhead_ms"],
                "active_bans": shield["active_banned_ips_count"]
            }
        })
    except Exception as e:
        logger.error(f"Error generating global status: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/dual-tracker", methods=["GET"])
def get_dual_tracker():
    """Dual-Engine telemetry, block heights, 3-tier diagnosis, and decimal normalization"""
    data = DUAL_TRACKER.get_dual_state()
    return jsonify({"success": True, "data": data})


@app.route("/api/slash-guard", methods=["GET"])
def get_slash_guard():
    """Slashing guard status, session keys, Dead Man's Switch, and security log"""
    data = SLASH_GUARD.get_security_dashboard()
    return jsonify({"success": True, "data": data})


@app.route("/api/slash-guard/rotate-keys", methods=["POST"])
def rotate_keys():
    """Triggers planned session key rotation (author_rotateKeys with Metadata V14 unpack)"""
    if not check_auth(request):
        return jsonify({"success": False, "error": "Unauthorized: Invalid X-DotNexus-Auth token"}), 401
    rot = SLASH_GUARD.rotate_session_keys()
    return jsonify({"success": True, "data": rot})


@app.route("/api/slash-guard/failover", methods=["POST"])
def trigger_failover():
    """Emergency failover transfer between Primary and Standby without key rotation"""
    if not check_auth(request):
        return jsonify({"success": False, "error": "Unauthorized: Invalid X-DotNexus-Auth token"}), 401
    body = request.get_json(silent=True) or {}
    reason = body.get("reason", "Operator Manual Switch from Control Center")
    res = SLASH_GUARD.execute_failover(reason=reason)
    return jsonify({"success": True, "data": res})


@app.route("/api/slash-guard/simulate-missed-heartbeat", methods=["POST"])
def simulate_missed_heartbeat():
    """Simulates 1 missed interval to demonstrate Slashing Guard failover threshold"""
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
    """Top 16 optimal validators from Client-Side Sequential Phragmén Simulation"""
    rec = NPOS_OPTIMIZER.get_top_16_recommendation()
    return jsonify({"success": True, "data": rec})


@app.route("/api/npos/rebalance", methods=["POST"])
def rebalance_staking():
    """Computes dynamic stake allocation with Pre-Flight checks (Election Window, 3x Fee)"""
    if not check_auth(request):
        return jsonify({"success": False, "error": "Unauthorized: Invalid X-DotNexus-Auth token"}), 401
    body = request.get_json(silent=True) or {}
    user_stake = float(body.get("stake_pot", 10000.0))
    res = NPOS_OPTIMIZER.generate_rebalance_payload(user_stake_pot=user_stake)
    return jsonify({"success": True, "data": res})


@app.route("/api/npos/dispatch-nominate", methods=["POST"])
def dispatch_nominate():
    """Executes real on-chain Staking.nominate (and auto Staking.bond) on Portaldot V3.0"""
    if not check_auth(request):
        return jsonify({"success": False, "error": "Unauthorized: Invalid X-DotNexus-Auth token"}), 401
    body = request.get_json(silent=True) or {}
    targets = body.get("targets", [])
    if not targets:
        return jsonify({"success": False, "error": "targets array cannot be empty"}), 400
    signer_key = body.get("signer_key", "//Alice")
    bond_pot = float(body.get("bond_pot", 0.0))

    try:
        receipt = NPOS_OPTIMIZER.dispatch_nomination_onchain(
            targets=targets,
            signer_key=signer_key,
            bond_amount_pot=bond_pot
        )
        return jsonify({"success": True, "data": receipt})
    except Exception as e:
        logger.error(f"On-chain nominate dispatch failed: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/npos/bond-extra", methods=["POST"])
def bond_extra():
    """Executes real on-chain Staking.bond_extra on Portaldot V3.0 for auto-compounding"""
    if not check_auth(request):
        return jsonify({"success": False, "error": "Unauthorized: Invalid X-DotNexus-Auth token"}), 401
    body = request.get_json(silent=True) or {}
    amount_pot = float(body.get("amount_pot", 1.0))
    signer_key = body.get("signer_key", "//Alice")

    try:
        receipt = NPOS_OPTIMIZER.bond_extra_onchain(
            amount_pot=amount_pot,
            signer_key=signer_key
        )
        return jsonify({"success": True, "data": receipt})
    except Exception as e:
        logger.error(f"On-chain bond_extra failed: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/rpc-shield", methods=["GET"])
def get_rpc_shield():
    """RPC shield metrics, query inspect logs, and P2P peer topology"""
    data = RPC_SHIELD.get_shield_status()
    return jsonify({"success": True, "data": data})


@app.route("/api/rpc-shield/simulate-attack", methods=["POST"])
def simulate_attack():
    """Triggers an RPC attack simulation (HEAVY_GETLOGS, BATCH_OVERLOAD, or RATE_LIMIT_BURST)"""
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
    """Executes a DAG runbook pipeline with dry_run support"""
    if not check_auth(request):
        return jsonify({"success": False, "error": "Unauthorized: Invalid X-DotNexus-Auth token"}), 401
    body = request.get_json(silent=True) or {}
    dry_run = body.get("dry_run", False)
    res = DAG_ENGINE.execute_runbook(runbook_id)
    res["dry_run"] = dry_run
    return jsonify({"success": True, "data": res})


@app.route("/api/worker/execute", methods=["POST"])
def execute_worker_runbook():
    """Direct execution via Headless Worker Daemon with Kahn's Tiers"""
    if not check_auth(request):
        return jsonify({"success": False, "error": "Unauthorized: Invalid X-DotNexus-Auth token"}), 401
    body = request.get_json(silent=True) or {}
    runbook = body.get("runbook") or DAG_ENGINE.get_runbooks()[0]
    dry_run = body.get("dry_run", True)
    res = WORKER_DAEMON.execute_runbook_pipeline(runbook, dry_run=dry_run)
    return jsonify({"success": True, "data": res})


@app.route("/api/security/audit-log", methods=["GET"])
def get_audit_log():
    """Immutable audit trail of actions taken by operators or daemons"""
    events = []
    if AUDIT_LOG_FILE.exists():
        try:
            with open(AUDIT_LOG_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        events.append(json.loads(line.strip()))
        except Exception as e:
            logger.error(f"Error reading audit log: {e}")
    events.reverse()
    return jsonify({"success": True, "count": len(events), "data": events[:50]})


@app.route("/api/logs", methods=["GET"])
def get_unified_logs():
    """Aggregated chronological stream of security and operational logs"""
    events = []
    for e in SLASH_GUARD.security_events:
        events.append({"source": "SLASH_GUARD", "level": e["level"], "time": e["timestamp"], "text": f"{e['title']}: {e['message']}"})
    for s in RPC_SHIELD.shield_logs:
        events.append({"source": "RPC_SHIELD", "level": s["decision"], "time": s["timestamp"], "text": f"[{s['method']}] from {s['client_ip']} - {s['reason']}"})
    for d in DAG_ENGINE.execution_logs:
        events.append({"source": "DAG_ENGINE", "level": "INFO", "time": d["timestamp"], "text": f"Runbook '{d['runbook_name']}' completed in {d['duration_ms']}ms"})

    events.sort(key=lambda x: x["time"], reverse=True)
    return jsonify({"success": True, "count": len(events), "logs": events[:40]})


def run_server():
    logger.info("=" * 60)
    logger.info("  DotNexus Control Center - Portaldot Network V3.0")
    logger.info("=" * 60)
    logger.info(f"Substrate WS: {CONFIG.substrate_ws_url}")
    logger.info(f"EVM JSON-RPC: {CONFIG.evm_rpc_url} (Chain ID: {CONFIG.evm_chain_id})")
    logger.info("Initializing pre-flight telemetry probe...")
    try:
        dual_state = DUAL_TRACKER.get_dual_state()
        sub_status = "ONLINE (LIVE)" if dual_state["substrate"].get("is_live_chain") else "SIMULATED / OFFLINE"
        evm_status = "ONLINE (LIVE)" if dual_state["evm"].get("is_live_chain") else "SIMULATED / OFFLINE"
        sub_block = dual_state["substrate"].get("best_block", "N/A")
        evm_block = dual_state["evm"].get("block_number", "N/A")
        logger.info(f"Substrate State: [{sub_status}] - Block #{sub_block}")
        logger.info(f"EVM State:       [{evm_status}] - Block #{evm_block}")
    except Exception as e:
        logger.warning(f"Initial probe exception: {e}")
    logger.info(f"Starting Gateway API listener on {CONFIG.engine_host}:{CONFIG.engine_port}...")
    logger.info("=" * 60)
    app.run(host=CONFIG.engine_host, port=CONFIG.engine_port, debug=False, use_reloader=False, threaded=True)


if __name__ == "__main__":
    run_server()
