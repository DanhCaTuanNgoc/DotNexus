"""
DotNexus Dual-Engine Real-Time Parallel Log & Block Telemetry Streamer
Monitors Localhost (:5050) vs Render Cloud vs Live Portaldot Testnet simultaneously.
Catches block divergence, network timeouts, API latency, and Render platform events.

Usage:
    python scripts/parallel_log_stream.py
    python scripts/parallel_log_stream.py --local-url http://127.0.0.1:5050 --interval 2.5
"""

import sys
import time
import json
import ssl
import argparse
import urllib.request
from datetime import datetime

# ANSI Color Codes for high-visibility terminal output
CLR_RESET = "\033[0m"
CLR_BOLD = "\033[1m"
CLR_RED = "\033[91m"
CLR_GREEN = "\033[92m"
CLR_YELLOW = "\033[93m"
CLR_BLUE = "\033[94m"
CLR_MAGENTA = "\033[95m"
CLR_CYAN = "\033[96m"
CLR_WHITE = "\033[97m"

# Render API Management Configuration
RENDER_API_KEY = "rnd_RXzsnUn0xWJ75nFNjn0lYW1knznW"
RENDER_DEFAULT_SERVICE_ID = "srv-dbkadgmgekts73f7eo4g"
DEFAULT_RENDER_URL = "https://dotnexus-1.onrender.com"
PORTALDOT_EVM_RPC = "https://test-evm-rpc-v3.portaldot.dev"

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE


def http_get_json(url: str, timeout: float = 8.0, headers: dict = None) -> tuple[int, any, float]:
    req_headers = {"User-Agent": "DotNexus-LogStreamer/1.0"}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, headers=req_headers)
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=SSL_CTX) as resp:
            elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)
            raw = resp.read().decode("utf-8")
            return resp.status, json.loads(raw), elapsed_ms
    except urllib.error.HTTPError as he:
        elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)
        return he.code, {"error": str(he)}, elapsed_ms
    except Exception as e:
        elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)
        return 0, {"error": str(e)}, elapsed_ms


def query_ground_truth_testnet_block() -> tuple[int, float]:
    payload = json.dumps({"jsonrpc": "2.0", "method": "eth_blockNumber", "params": [], "id": 1}).encode("utf-8")
    req = urllib.request.Request(PORTALDOT_EVM_RPC, data=payload, headers={"Content-Type": "application/json", "User-Agent": "DotNexus/1.0"})
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=5.0, context=SSL_CTX) as resp:
            elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)
            res = json.loads(resp.read().decode())
            return int(res.get("result", "0x0"), 16), elapsed_ms
    except Exception:
        return 0, round((time.perf_counter() - t0) * 1000, 1)


def discover_active_render_service() -> tuple[str, str]:
    """Queries Render API to automatically discover active service ID and live public URL"""
    if not RENDER_API_KEY:
        return RENDER_DEFAULT_SERVICE_ID, DEFAULT_RENDER_URL
    try:
        status, data, _ = http_get_json(
            "https://api.render.com/v1/services?limit=10",
            timeout=5.0,
            headers={"Authorization": f"Bearer {RENDER_API_KEY}", "Accept": "application/json"}
        )
        if status == 200 and isinstance(data, list) and len(data) > 0:
            for item in data:
                s = item.get("service", {})
                if s.get("name") in ("DotNexus", "DotNexus-1", "dotnexus-backend") or "dotnexus" in s.get("slug", ""):
                    url = s.get("serviceDetails", {}).get("url") or DEFAULT_RENDER_URL
                    return s.get("id"), url
            s0 = data[0].get("service", {})
            return s0.get("id", RENDER_DEFAULT_SERVICE_ID), s0.get("serviceDetails", {}).get("url", DEFAULT_RENDER_URL)
    except Exception:
        pass
    return RENDER_DEFAULT_SERVICE_ID, DEFAULT_RENDER_URL


def main():
    parser = argparse.ArgumentParser(description="DotNexus Parallel Log & Telemetry Streamer")
    parser.add_argument("--local-url", default="http://127.0.0.1:5050", help="Local backend engine URL")
    parser.add_argument("--render-url", default=None, help="Render cloud backend URL (auto-discovered if omitted)")
    parser.add_argument("--interval", type=float, default=2.5, help="Polling interval in seconds")
    parser.add_argument("--once", action="store_true", help="Run a single snapshot check and exit")
    args = parser.parse_args()

    print(f"\n{CLR_BOLD}{CLR_CYAN}================================================================================{CLR_RESET}")
    print(f"{CLR_BOLD}{CLR_CYAN}    DotNexus Parallel Log Streamer (Localhost vs Render vs Testnet V3.0)    {CLR_RESET}")
    print(f"{CLR_BOLD}{CLR_CYAN}================================================================================{CLR_RESET}\n")

    service_id, render_url = discover_active_render_service()
    if args.render_url:
        render_url = args.render_url

    print(f"{CLR_WHITE}Local Target:{CLR_RESET}   {args.local_url}")
    print(f"{CLR_WHITE}Render Target:{CLR_RESET}  {render_url} (Service ID: {service_id})")
    print(f"{CLR_WHITE}Live Testnet:{CLR_RESET}   {PORTALDOT_EVM_RPC}")
    print(f"{CLR_WHITE}Interval:{CLR_RESET}       {args.interval}s\n")
    print(f"{CLR_YELLOW}Press Ctrl+C to terminate monitor.{CLR_RESET}\n")

    seen_local_logs = set()
    seen_render_logs = set()
    seen_render_events = set()
    tick_count = 0

    while True:
        tick_count += 1
        now_str = datetime.now().strftime("%H:%M:%S")

        # 1. Query Ground Truth Live Chain Block
        chain_block, chain_rtt = query_ground_truth_testnet_block()
        chain_str = f"#{chain_block:,}" if chain_block > 0 else f"{CLR_RED}TIMEOUT{CLR_RESET}"

        # 2. Query Localhost State
        local_status, local_data, local_rtt = http_get_json(f"{args.local_url}/api/status", timeout=2.0)
        local_online = local_status == 200
        if local_online and isinstance(local_data, dict):
            loc_vm = local_data.get("dual_vm", {})
            loc_block = loc_vm.get("best_substrate_block", 0)
            loc_sync = loc_vm.get("sync_status", "UNKNOWN")
            loc_lag = (chain_block - loc_block) if chain_block and loc_block else 0
            loc_lag_str = f"{CLR_GREEN}Lag: {loc_lag} blk{CLR_RESET}" if loc_lag <= 1 else f"{CLR_YELLOW}Lag: {loc_lag} blk{CLR_RESET}"
            loc_summary = f"{CLR_GREEN}# {loc_block:,} ({loc_sync}){CLR_RESET} | {loc_lag_str} | {local_rtt}ms"
        else:
            loc_summary = f"{CLR_YELLOW}OFFLINE / STANDBY (Port 5050 not active){CLR_RESET}"

        # 3. Query Render Cloud State
        render_status, render_data, render_rtt = http_get_json(f"{render_url}/api/dual-tracker", timeout=6.0)
        render_online = render_status == 200
        if render_online and isinstance(render_data, dict):
            dt_inner = render_data.get("data", {})
            ren_sub = dt_inner.get("substrate", {})
            ren_evm = dt_inner.get("evm", {})
            ren_sync = dt_inner.get("sync", {})
            ren_block = ren_sub.get("best_block", 0)
            ren_evm_block = ren_evm.get("block_number", 0)
            ren_delta = ren_sync.get("delta_blocks", 0)
            ren_status_str = ren_sync.get("status", "UNKNOWN")

            ren_lag = (chain_block - ren_block) if chain_block and ren_block else 0
            if ren_lag <= 1:
                ren_lag_str = f"{CLR_GREEN}Lag: {ren_lag} blk{CLR_RESET}"
            elif ren_lag <= 5:
                ren_lag_str = f"{CLR_YELLOW}Lag: {ren_lag} blk{CLR_RESET}"
            else:
                ren_lag_str = f"{CLR_RED}{CLR_BOLD}LAGGING: {ren_lag} BLKS!{CLR_RESET}"

            ren_color = CLR_GREEN if ren_delta <= 1 and ren_lag <= 2 else CLR_RED
            ren_summary = f"{ren_color}#{ren_block:,} (EVM #{ren_evm_block:,}){CLR_RESET} | Delta: {ren_delta} | {ren_lag_str} | {render_rtt}ms"
        else:
            err_msg = render_data.get("error", "No response") if isinstance(render_data, dict) else str(render_status)
            ren_summary = f"{CLR_RED}{CLR_BOLD}FAIL (HTTP {render_status}): {err_msg[:40]} ({render_rtt}ms){CLR_RESET}"

        # Print Synchronized Header Ticker
        print(f"{CLR_BOLD}[TICK #{tick_count} @ {now_str}]{CLR_RESET}")
        print(f"  {CLR_CYAN}CHAIN TIP (EVM :8545):{CLR_RESET} {chain_str} ({chain_rtt}ms)")
        print(f"  {CLR_BLUE}LOCALHOST (:5050):    {CLR_RESET} {loc_summary}")
        print(f"  {CLR_MAGENTA}RENDER CLOUD:         {CLR_RESET} {ren_summary}")

        # Check for Block Divergence Warning
        if render_online and chain_block and ren_block:
            divergence = chain_block - ren_block
            if divergence > 5:
                print(f"  {CLR_RED}{CLR_BOLD}>>> [CRITICAL WARNING] Render is {divergence} blocks behind the live Portaldot chain tip! <<<{CLR_RESET}")

        # 4. Stream Render Platform Events (OOM, Deploy, Server Failure)
        if service_id and RENDER_API_KEY:
            try:
                ev_code, ev_data, _ = http_get_json(
                    f"https://api.render.com/v1/services/{service_id}/events?limit=3",
                    timeout=4.0,
                    headers={"Authorization": f"Bearer {RENDER_API_KEY}", "Accept": "application/json"}
                )
                if ev_code == 200 and isinstance(ev_data, list):
                    for item in reversed(ev_data):
                        ev = item.get("event", {})
                        ev_id = ev.get("id")
                        if ev_id and ev_id not in seen_render_events:
                            seen_render_events.add(ev_id)
                            ev_type = ev.get("type")
                            ev_ts = ev.get("timestamp", "")[:19].replace("T", " ")
                            color = CLR_GREEN if "success" in ev_type or "resumed" in ev_type else (CLR_RED if "fail" in ev_type or "oom" in str(ev) else CLR_YELLOW)
                            print(f"    {color}[RENDER EVENT {ev_ts}] {ev_type}: {ev.get('details')}{CLR_RESET}")
            except Exception:
                pass

        # 5. Stream New Application Logs from Render
        if render_online:
            try:
                log_code, log_resp, _ = http_get_json(f"{render_url}/api/logs", timeout=3.0)
                if log_code == 200 and isinstance(log_resp, dict):
                    logs = log_resp.get("logs", [])
                    for entry in logs:
                        l_key = f"{entry.get('time')}-{entry.get('source')}-{entry.get('text')}"
                        if l_key not in seen_render_logs:
                            seen_render_logs.add(l_key)
                            l_time = datetime.fromtimestamp(entry.get("time", time.time())).strftime("%H:%M:%S")
                            lvl = entry.get("level", "INFO")
                            l_color = CLR_RED if lvl in ("ERROR", "CRITICAL") else (CLR_YELLOW if lvl in ("WARN", "WARNING") else CLR_WHITE)
                            print(f"    {CLR_MAGENTA}[RENDER LOG {l_time}]{CLR_RESET} {l_color}[{entry.get('source')}] {lvl}: {entry.get('text')}{CLR_RESET}")
            except Exception:
                pass

        # 6. Stream New Application Logs from Localhost (if online)
        if local_online:
            try:
                loc_log_code, loc_log_resp, _ = http_get_json(f"{args.local_url}/api/logs", timeout=2.0)
                if loc_log_code == 200 and isinstance(loc_log_resp, dict):
                    logs = loc_log_resp.get("logs", [])
                    for entry in logs:
                        l_key = f"{entry.get('time')}-{entry.get('source')}-{entry.get('text')}"
                        if l_key not in seen_local_logs:
                            seen_local_logs.add(l_key)
                            l_time = datetime.fromtimestamp(entry.get("time", time.time())).strftime("%H:%M:%S")
                            lvl = entry.get("level", "INFO")
                            l_color = CLR_RED if lvl in ("ERROR", "CRITICAL") else (CLR_YELLOW if lvl in ("WARN", "WARNING") else CLR_WHITE)
                            print(f"    {CLR_BLUE}[LOCAL LOG {l_time}]{CLR_RESET} {l_color}[{entry.get('source')}] {lvl}: {entry.get('text')}{CLR_RESET}")
            except Exception:
                pass

        print(f"{CLR_WHITE}--------------------------------------------------------------------------------{CLR_RESET}")
        if args.once:
            break
        time.sleep(args.interval)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{CLR_YELLOW}Monitor stopped by user.{CLR_RESET}")
        sys.exit(0)
