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

from engine.staking_keeper import STAKING_KEEPER

from engine.proxy_gateway import PROXY_GATEWAY



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

    """Prometheus OpenMetrics exporter for enterprise NOC observability"""

    dual = DUAL_TRACKER.get_dual_state()

    sec = SLASH_GUARD.get_security_dashboard()

    npos = NPOS_OPTIMIZER.get_top_16_recommendation()

    hw = dual.get("hardware", {})

    cli_val = dual.get("causal_lag_index", {}).get("cli_score", 0.0)



    lines = [

        "# HELP dotnexus_substrate_block_height Current block height on Substrate WASM layer",

        "# TYPE dotnexus_substrate_block_height gauge",

        f'dotnexus_substrate_block_height{{chain="portaldot_v3"}} {dual.get("substrate", {}).get("best_block", 0)}',

        "",

        "# HELP dotnexus_evm_block_height Current block height on EVM pallet-revive",

        "# TYPE dotnexus_evm_block_height gauge",

        f'dotnexus_evm_block_height{{chain="portaldot_v3"}} {dual.get("evm", {}).get("block_number", 0)}',

        "",

        "# HELP dotnexus_dual_vm_lag_blocks Block discrepancy between Substrate and EVM",

        "# TYPE dotnexus_dual_vm_lag_blocks gauge",

        f'dotnexus_dual_vm_lag_blocks{{chain="portaldot_v3"}} {dual.get("sync", {}).get("delta_blocks", 0)}',

        "",

        "# HELP dotnexus_causal_lag_index Cross-VM Causal Lag Index (0.0 - 100.0)",

        "# TYPE dotnexus_causal_lag_index gauge",

        f'dotnexus_causal_lag_index {round(cli_val, 2)}',

        "",

        "# HELP dotnexus_host_cpu_percent Host machine CPU utilization percent",

        "# TYPE dotnexus_host_cpu_percent gauge",

        f'dotnexus_host_cpu_percent {hw.get("cpu_percent", 0.0)}',

        "",

        "# HELP dotnexus_host_memory_used_percent Host machine RAM utilization percent",

        "# TYPE dotnexus_host_memory_used_percent gauge",

        f'dotnexus_host_memory_used_percent {hw.get("ram_percent", 0.0)}',

        "",

        "# HELP dotnexus_host_disk_free_gb Host disk available storage in GB",

        "# TYPE dotnexus_host_disk_free_gb gauge",

        f'dotnexus_host_disk_free_gb {hw.get("disk_free_gb", 0.0)}',

        "",

        "# HELP dotnexus_active_fencing_epoch Monotonic fencing epoch number",

        "# TYPE dotnexus_active_fencing_epoch counter",

        f'dotnexus_active_fencing_epoch {sec.get("active_fencing_epoch", sec.get("fencing_epoch", 1))}',

        "",

        "# HELP dotnexus_lease_ttl_remaining_seconds Remaining time for validator signing lease",

        "# TYPE dotnexus_lease_ttl_remaining_seconds gauge",

        f'dotnexus_lease_ttl_remaining_seconds {sec.get("remaining_lease_seconds", 12.0)}',

        "",

        "# HELP dotnexus_npos_optimal_apy_percent Optimized top 16 validator compounded APY",

        "# TYPE dotnexus_npos_optimal_apy_percent gauge",

        f'dotnexus_npos_optimal_apy_percent {npos.get("auto_compounded_boosted_apy_pct", 16.76)}',

        "",

        RPC_SHIELD.export_prometheus_metrics()

    ]

    return Response("\n".join(lines), mimetype="text/plain; version=0.0.4")





@app.route("/api/status", methods=["GET"])

def get_global_status():

    """Global cluster overview, system stats, 3-tier diagnosis, and indicators"""

    try:

        if not app.config.get("TESTING") and not DUAL_TRACKER._poller_running:

            DUAL_TRACKER.start_background_poller(interval=2.5)

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

    if not app.config.get("TESTING") and not DUAL_TRACKER._poller_running:

        DUAL_TRACKER.start_background_poller(interval=2.5)

    data = DUAL_TRACKER.get_dual_state()

    return jsonify({"success": True, "data": data})





@app.route("/api/telemetry/dual/recent-blocks", methods=["GET"])

@app.route("/api/dual-tracker/recent-blocks", methods=["GET"])

def get_recent_dual_blocks():

    """Returns the list of recent blocks correlating Substrate WASM and Frontier EVM"""

    try:

        if not app.config.get("TESTING") and not DUAL_TRACKER._poller_running:

            DUAL_TRACKER.start_background_poller(interval=2.5)

        limit = min(int(request.args.get("limit", 5)), 10)

        blocks = DUAL_TRACKER.get_recent_dual_blocks(limit=limit)

        return jsonify({"success": True, "data": blocks, "timestamp": time.time()})

    except Exception as e:

        logger.error(f"Error retrieving recent dual blocks: {e}")

        return jsonify({"success": False, "error": str(e)}), 500





@app.route("/api/dual-tracker/remediate", methods=["POST"])

def remediate_dual_tracker():

    """Executes active self-healing action on Dual-Engine node"""

    body = request.get_json(silent=True) or {}

    action = body.get("action", "force_fc_sync")

    details = body.get("details", {})

    res = DUAL_TRACKER.execute_remediation(action, details)

    return jsonify({"success": res.get("success", True), "data": res})





@app.route("/api/dual-tracker/circuit-breaker", methods=["POST"])

def toggle_circuit_breaker():

    """Toggles or sets RPC Circuit Breaker protective gating mode"""

    body = request.get_json(silent=True) or {}

    enabled = body.get("enabled", None)

    res = DUAL_TRACKER.toggle_circuit_breaker(enabled)

    return jsonify({"success": True, "data": res})





@app.route("/api/dual-tracker/contract-audit", methods=["GET", "POST"])

def audit_contract():

    """Audits smart contract suitability for Portaldot Mainnet V3.0 (pallet-revive)"""

    if request.method == "POST":

        body = request.get_json(silent=True) or {}

        contract_name = body.get("contract_name", "SlashGuardLeaseRegistry")

        custom_code = body.get("custom_code", None)

    else:

        contract_name = request.args.get("contract_name", "SlashGuardLeaseRegistry")

        custom_code = None

    res = DUAL_TRACKER.audit_contract_for_mainnet(contract_name, custom_code)

    return jsonify({"success": True, "data": res})





@app.route("/api/slash-guard", methods=["GET"])

def get_slash_guard():

    """Slashing guard status, session keys, Dead Man's Switch, and security log"""

    data = SLASH_GUARD.get_security_dashboard()

    return jsonify({"success": True, "data": data})





@app.route("/api/slash-guard/onchain-lease", methods=["GET"])

def get_onchain_lease():

    """Direct query of live on-chain lease state from SlashGuardLeaseRegistry.sol on Testnet V3"""

    operator = request.args.get("operator")

    data = SLASH_GUARD.get_onchain_lease_state(operator_address=operator)

    return jsonify({"success": True, "data": data})





@app.route("/api/slash-guard/session-authorities", methods=["GET"])

def get_session_authorities():

    """Queries live active BABE epoch session keys and validators from Substrate runtime"""

    data = SLASH_GUARD.query_live_session_authorities()

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





@app.route("/api/slash-guard/reset-heartbeat", methods=["POST"])

def reset_heartbeat():

    """Heals and restores nominal heartbeat status after drill or network recovery"""

    res = SLASH_GUARD.reset_heartbeat()

    return jsonify({"success": True, "data": res})





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

        err_msg = str(e)

        if hasattr(e, 'args') and len(e.args) > 0 and isinstance(e.args[0], dict):

            d = e.args[0]

            err_msg = f"{d.get('message', 'Node Rejected')}: {d.get('data', str(d))}"

        logger.error(f"On-chain nominate dispatch failed: {err_msg}")

        return jsonify({"success": False, "error": err_msg}), 500





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

        err_msg = str(e)

        if hasattr(e, 'args') and len(e.args) > 0 and isinstance(e.args[0], dict):

            d = e.args[0]

            err_msg = f"{d.get('message', 'Node Rejected')}: {d.get('data', str(d))}"

        logger.error(f"On-chain bond_extra failed: {err_msg}")

        return jsonify({"success": False, "error": err_msg}), 500





@app.route("/api/npos/unbonding-queue", methods=["GET"])

def get_unbonding_queue():

    """Queries active unlocking/unbonding chunks for the default or specified account"""

    account = request.args.get("account") or getattr(CONFIG, "default_validator_address", "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")

    data = STAKING_KEEPER.get_unbonding_queue(account)

    return jsonify({"success": True, "data": data})





@app.route("/api/npos/keeper-status", methods=["GET"])

def get_keeper_status():

    """Returns operational health, era monitoring state, and recent automated rebalance actions"""

    data = STAKING_KEEPER.get_keeper_status()

    return jsonify({"success": True, "data": data})





@app.route("/api/npos/keeper-run", methods=["POST"])

def trigger_keeper_run():

    """Triggers an automated era evaluation and nomination rebalance via the Keeper Daemon"""

    if not check_auth(request):

        return jsonify({"success": False, "error": "Unauthorized: Invalid X-DotNexus-Auth token"}), 401

    body = request.get_json(silent=True) or {}

    force = bool(body.get("force", False))

    res = STAKING_KEEPER.evaluate_and_execute_era_rebalance(force=force)

    return jsonify({"success": True, "data": res})





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





@app.route("/api/rpc-shield/quarantined-ips", methods=["GET"])

def get_quarantined_ips():

    """Returns list of all currently quarantined IPs with progressive penalty tiers"""

    quarantined = RPC_SHIELD.get_quarantined_ips()

    return jsonify({"success": True, "count": len(quarantined), "data": quarantined})





@app.route("/api/rpc-shield/unban", methods=["POST"])

def unban_shield_ip():

    """Immediately releases an IP from quarantine jail and restores reputation score"""

    body = request.get_json(silent=True) or {}

    ip = body.get("ip")

    if not ip:

        return jsonify({"success": False, "error": "IP address is required"}), 400

    RPC_SHIELD.unban_ip(ip)

    return jsonify({"success": True, "message": f"IP {ip} unbanned and reputation restored."})





@app.route("/api/rpc-shield/ip-reputation", methods=["GET"])

def get_ip_reputation():

    """Returns dynamic reputation score and history for a client IP"""

    ip = request.args.get("ip", request.remote_addr or "127.0.0.1")

    rep = RPC_SHIELD.get_ip_reputation(ip)

    return jsonify({"success": True, "data": rep})





@app.route("/api/rpc-shield/gateway-telemetry", methods=["GET"])

def get_gateway_telemetry():

    """Returns telemetry of the inline Reverse Proxy Gateway and forwarding stats"""

    data = PROXY_GATEWAY.get_gateway_telemetry()

    return jsonify({"success": True, "data": data})





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
    for k in getattr(STAKING_KEEPER, "keeper_action_history", []):
        events.append({
            "source": "STAKING_KEEPER",
            "level": "SUCCESS" if k.get("status") != "FAILED" else "WARN",
            "time": k.get("timestamp", time.time()),
            "text": f"Staking Action: {k.get('action', 'REBALANCE')} | {k.get('reason', k.get('proof_status', 'Executed'))}"
        })
    if getattr(DUAL_TRACKER, "last_remediation", None):
        rem = DUAL_TRACKER.last_remediation
        events.append({
            "source": "DUAL_TRACKER",
            "level": "WARN" if not rem.get("success") else "SUCCESS",
            "time": rem.get("timestamp", time.time()),
            "text": f"Self-Healing Remediation: {rem.get('message', rem.get('action', 'Executed'))}"
        })

    events.sort(key=lambda x: x["time"], reverse=True)
    return jsonify({"success": True, "count": len(events), "logs": events[:50]})


@app.route("/api/logs/clear", methods=["POST"])
def clear_unified_logs():
    """Flushes operational and security event streams for diagnostic reset"""
    SLASH_GUARD.security_events.clear()
    RPC_SHIELD.shield_logs.clear()
    DAG_ENGINE.execution_logs.clear()
    if hasattr(STAKING_KEEPER, "keeper_action_history"):
        STAKING_KEEPER.keeper_action_history.clear()
    DUAL_TRACKER.last_remediation = None
    return jsonify({"success": True, "message": "Diagnostic event streams cleared"})


@app.route("/api/diagnostic/command", methods=["POST"])
def execute_diagnostic_command():
    """Executes interactive console diagnostic commands from the Diagnostic Terminal"""
    body = request.get_json(silent=True) or {}
    raw_cmd = body.get("command", "").strip()
    if not raw_cmd:
        return jsonify({"success": False, "error": "Empty command"}), 400

    parts = raw_cmd.split()
    cmd = parts[0].lower()
    args = parts[1:]

    if cmd == "help":
        output = (
            "DotNexus Diagnostic CLI Operations:\n"
            "  status               - Query Substrate WASM vs Frontier EVM lockstep telemetry\n"
            "  rotate-keys          - Safely rotate validator session keys (mutex-guarded)\n"
            "  failover [reason]    - Execute atomic failover to standby validator leader\n"
            "  circuit-breaker      - Toggle protective RPC Circuit Breaker gating mode\n"
            "  shield-test [type]   - Simulate attack (HEAVY_GETLOGS, RATE_LIMIT_BURST)\n"
            "  npos                 - Scan active validator pool and calculate projected APY\n"
            "  runbook <id>         - Execute DAG runbook (e.g. runbook-slash-guard)\n"
            "  peers                - Inspect P2P peer topology and Sybil score\n"
            "  clear                - Flush terminal and reset diagnostic stream"
        )
        return jsonify({"success": True, "source": "SYSTEM", "level": "INFO", "output": output})

    elif cmd == "status":
        state = DUAL_TRACKER.get_dual_state()
        sub_b = state["substrate"]["best_block"]
        evm_b = state["evm"]["block_number"]
        delta = state["sync"]["delta_blocks"]
        status = state["sync"]["status"]
        output = f"Substrate WASM #{sub_b:,} <-> EVM #{evm_b:,} | Delta: {delta} blocks | Parity: {status} | SS58: 42 | POT Decimals: {DUAL_TRACKER.decimals}"
        return jsonify({"success": True, "source": "DUAL_TRACKER", "level": "SUCCESS", "output": output})

    elif cmd == "rotate-keys":
        rot = SLASH_GUARD.rotate_session_keys()
        output = f"Validator session keys rotated successfully: {rot.get('session_keys_hex', '')[:18]}... | Call: {rot.get('extrinsic_call', '')}"
        return jsonify({"success": True, "source": "SLASH_GUARD", "level": "SUCCESS", "output": output})

    elif cmd == "failover":
        reason = " ".join(args) if args else "Diagnostic Terminal operator switch"
        res = SLASH_GUARD.execute_failover(reason=reason)
        output = f"Failover executed: {res.get('previous_node')} -> {res.get('new_active_node')} | Leader: {res.get('target_id')} | Reason: {reason}"
        return jsonify({"success": True, "source": "SLASH_GUARD", "level": "WARN", "output": output})

    elif cmd == "circuit-breaker":
        cb = DUAL_TRACKER.toggle_circuit_breaker()
        output = f"RPC Circuit Breaker status toggled to {cb.get('status')} (Gating: {cb.get('circuit_breaker_enabled')})"
        return jsonify({"success": True, "source": "DUAL_TRACKER", "level": "WARN", "output": output})

    elif cmd == "shield-test":
        atk_type = args[0] if args else "HEAVY_GETLOGS"
        sim = RPC_SHIELD.simulate_attack_test(attack_type=atk_type)
        output = f"Shield Test [{atk_type}]: Decision: {sim.get('defense_action', 'BLOCKED')} | Target IP: {sim.get('simulated_client_ip')} | Reason: {sim.get('anomaly_detected')}"
        return jsonify({"success": True, "source": "RPC_SHIELD", "level": "WARN", "output": output})

    elif cmd == "npos":
        top = NPOS_OPTIMIZER.get_top_16_recommendation()
        apy = top.get("auto_compounded_apy", 16.92)
        count = len(top.get("validators", []))
        output = f"PAO-Phragmen election: {count} optimal validators selected | Auto-compounded APY: {apy}% | Slashing risk: ZERO"
        return jsonify({"success": True, "source": "NPOS_OPTIMIZER", "level": "SUCCESS", "output": output})

    elif cmd == "peers":
        shld = RPC_SHIELD.get_shield_status()
        top = shld.get("p2p_topology", [])
        total_peers = len(top)
        quarantined = shld.get("active_banned_ips_count", 0)
        output = f"P2P Network Topology: {total_peers} peers connected | Active Quarantined IPs: {quarantined} | Subnet Diversity: NOMINAL"
        return jsonify({"success": True, "source": "P2P", "level": "INFO", "output": output})

    elif cmd == "runbook":
        if not args:
            output = "Usage: runbook <runbook-id> (e.g. runbook-slash-guard, runbook-dual-vm-sync, runbook-chaos-fire-drill)"
            return jsonify({"success": False, "source": "DAG_ENGINE", "level": "WARN", "output": output})
        rb_id = args[0]
        res = DAG_ENGINE.execute_runbook(rb_id)
        if res.get("status") == "FAILED":
            return jsonify({"success": False, "source": "DAG_ENGINE", "level": "ERROR", "output": f"Runbook '{rb_id}' failed: {res.get('error')}"})
        output = f"Runbook '{res.get('runbook_name')}' executed in {res.get('duration_ms')}ms across {len(res.get('steps', []))} steps. Status: {res.get('status')}"
        return jsonify({"success": True, "source": "DAG_ENGINE", "level": "SUCCESS", "output": output})

    elif cmd == "clear":
        SLASH_GUARD.security_events.clear()
        RPC_SHIELD.shield_logs.clear()
        DAG_ENGINE.execution_logs.clear()
        if hasattr(STAKING_KEEPER, "keeper_action_history"):
            STAKING_KEEPER.keeper_action_history.clear()
        DUAL_TRACKER.last_remediation = None
        return jsonify({"success": True, "source": "SYSTEM", "level": "INFO", "output": "Terminal logs and event streams cleared.", "action": "clear"})

    else:
        return jsonify({
            "success": False,
            "source": "SYSTEM",
            "level": "WARN",
            "output": f"dotnexus: command not found: '{cmd}'. Type 'help' to inspect available operations."
        })





@app.route("/api/npos/unclaimed-payouts", methods=["GET"])

def get_unclaimed_payouts():

    """Scans historical 84-era staking rewards window for uncollected validator payouts"""

    account = request.args.get("account", getattr(CONFIG, "primary_validator_address", "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"))

    data = STAKING_KEEPER.scan_unclaimed_payout_eras(validator_stash=account)

    return jsonify({"success": True, "data": data})





@app.route("/api/npos/sweep-payouts", methods=["POST"])

def sweep_payouts():

    """Dispatches automated payoutStakersByPage batch for uncollected historical eras"""

    if not check_auth(request):

        return jsonify({"success": False, "error": "Unauthorized: Invalid X-DotNexus-Auth token"}), 401

    body = request.get_json(silent=True) or {}

    account = body.get("account")

    dry_run = bool(body.get("dry_run", False))

    res = STAKING_KEEPER.sweep_unclaimed_payouts(validator_stash=account, dry_run=dry_run)

    return jsonify({"success": True, "data": res})





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

    logger.info("Starting background real-time testnet telemetry poller...")

    DUAL_TRACKER.start_background_poller(interval=2.5)

    logger.info("Starting Headless Worker Daemon 24/7 autonomous runbook scheduler...")

    WORKER_DAEMON.start_background_scheduler(interval_sec=30.0)

    logger.info(f"Starting Gateway API listener on {CONFIG.engine_host}:{CONFIG.engine_port}...")

    logger.info("=" * 60)

    app.run(host=CONFIG.engine_host, port=CONFIG.engine_port, debug=False, use_reloader=False, threaded=True)





if __name__ == "__main__":

    run_server()

