import json
from engine.worker_daemon import WORKER_DAEMON

kinds = [
    ('ws_substrate', 'Substrate WS (:9944)'),
    ('evm_rpc', 'EVM RPC (:8545)'),
    ('standby_node', 'Standby Backup Node'),
    ('p2p_sensor', 'P2P Peer Sensor'),
    ('heartbeat_daemon', 'Heartbeat imOnline Daemon'),
    ('desync_detector', 'Dual-VM Desync Detector'),
    ('rpc_spam_filter', 'RPC Heavy Query Filter'),
    ('era_scanner', 'NPoS Era Scanner'),
    ('mutex_lock', 'Anti-Equivocation Lock'),
    ('rpc_rate_limiter', 'RPC Shield Rate-Limiter'),
    ('safe_gate', 'Safe Write Confirm Gate'),
    ('rotate_keys', 'Rotate Session Keys'),
    ('promote_standby', 'Promote Standby Node'),
    ('emergency_chill', 'Emergency Validator Chill'),
    ('discord_alert', 'Discord / Ops Alert Bot'),
    ('flush_mempool', 'Drain & Flush Mempool'),
    ('top_16_filter', 'Top 16 Validator Filter'),
    ('compound_yield', 'Auto-Bond & Compound POT'),
    ('export_cli', 'Export Runbook CLI Script'),
    ('incident_report', 'Incident Report Generator'),
    ('chaos_evm_lag', 'Inject EVM Lag (+5 Blocks)'),
    ('chaos_rpc_ddos', 'Simulate RPC DDoS (eth_getLogs)'),
    ('chaos_heartbeat_cut', 'Cut Heartbeat (Network Partition)')
]

results = []
for k, lbl in kinds:
    node = {
        'id': f'n-test-{k}',
        'kind': k,
        'label': lbl,
        'type': 'action',
        'data': {'kind': k, 'label': lbl, 'config': {}}
    }
    try:
        res = WORKER_DAEMON.execute_single_node(node)
        status = "OK"
        detail = res.get('detail', '')
        output_keys = list(res.get('output', {}).keys())
    except Exception as e:
        status = "FAIL"
        detail = str(e)
        output_keys = []
    results.append({
        'kind': k,
        'label': lbl,
        'status': status,
        'detail': detail,
        'output_keys': output_keys
    })

print(json.dumps(results, indent=2))
