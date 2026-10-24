# DotNexus ⚡ — Judge Evaluation & 60-Second Quickstart

> **Track:** Node Operations & Tooling — Portaldot Hacker House 2026  
> **Project:** DotNexus (Visual Control Plane & Automated Security Operations Engine for Portaldot V3.0)  
> **Ecosystem:** Portaldot Network V3.0 (Substrate WASM + EVM Dual-VM, SS58: 42, POT Token Decimals: 14)  

---

## ⚡ 60-Second Verification Guide (For Judges)

### 1. Run Comprehensive Engine Test Suite (10/10 Tests Passed)
Validate all core functions, including Dual-VM telemetry, `session.setKeys` rotation, anti-equivocation mutex locking, NPoS APY compounding boost, and heavy `eth_getLogs` attack neutralization:
```bash
python -m unittest tests/test_engine.py
```

### 2. Verify Via Native CLI Suite
Inspect live Dual-VM block height parity, Mempool segregation, and Top 16 validator scoring:
```bash
# Dual-VM Telemetry & Mempool Segregation (WASM vs EVM)
python -m engine.cli dual-vm

# Optimal Top 16 Validators Scoring & Compounded APY
python -m engine.cli npos --top16

# Verify RPC Shield Defense against heavy 500k-block eth_getLogs attack
python -m engine.cli shield-test --type HEAVY_GETLOGS

# Execute Operational DAG Runbook pipeline
python -m engine.cli runbook runbook-slash-guard
```

### 3. Launch the Backend Gateway Server
Starts the REST & diagnostic server on port 5050:
```bash
python -m engine.server
```

### 4. Launch the Control Center Web UI
In another terminal:
```bash
cd front-end
npm run dev
```
Open browser at `http://localhost:5173`.

---

## 🔗 Live Portaldot V3 Testnet Smart Contracts (Verified & Deployed)

| Smart Contract | Deployed Contract Address | EVM Transaction Hash | Substrate Block | Substrate Explorer Link | Status |
|---|---|---|:---:|:---:|:---:|
| **`SlashGuardLeaseRegistry`** | `0xba114d21CC41a30880CcfA53673B743316387355` | `0xe285c61d4829a3f33a32e634242e1a77ba15f7eea28d276c9d72b0482633472f` | `#147264` | [View Block 147264](https://node-console.portaldot.dev/#/explorer/query/147264) | **PASS (Status: 1)** |
| **`DotNexusStakingVault`** | `0x97e5707FCa341c27D7e6b5cEC5ABFe2d3498610A` | `0x3263d911ca24b4f1ff413020d6454fce1c7cc995dc81d114d8d91ac8c061b8cb` | `#147358` | [View Block 147358](https://node-console.portaldot.dev/#/explorer/query/147358) | **PASS (Status: 1)** |

> *Tip: On `node-console.portaldot.dev` (Substrate Polkadot-JS Portal), search by **Block Number** (`147358` or `147264`) to view the `Revive.eth_transact` extrinsic, as Polkadot-JS queries Substrate block hashes rather than EVM Keccak hashes.*

---

## 🛡️ Feature Compliance & Verification Checklist

| Pillar | Functional Requirement | Implementation & File Reference | Verification Method |
|---|---|---|---|
| **1. Dual-Engine 2.0 Control Plane** | Live Substrate WS (:9944) & EVM (:8545) block parity, 1-Click Active Remediation Dock, 4-Track Ecosystem Pulse Radar, Causal Lag Index (CLI), Mainnet V3 Storage Deposit Auditor | `engine/dual_tracker.py`<br/>`front-end/src/views/DualEngineView.tsx` | Run `python -m engine.cli dual-vm` or test `test_02_dual_tracker_telemetry` |
| **2. Slashing Guard** | `author_rotateKeys`, anti-equivocation file-lock, heartbeat standby failover | `engine/slash_guard.py`<br/>`front-end/src/views/SecurityGuardView.tsx` | Run `python -m engine.cli rotate-keys` or test `test_03`, `test_04`, `test_05` |
| **3. NPoS Optimizer** | Multifactor validator scoring, oversubscribed filter, dynamic re-nomination (+1.16% APY boost) | `engine/npos_optimizer.py`<br/>`front-end/src/views/StakingYieldView.tsx` | Run `python -m engine.cli npos --top16` or test `test_06`, `test_07` |
| **4. RPC Shield** | Deep query parser (block range > 2000), dynamic rate-limiting (429), P2P topology radar | `engine/rpc_shield.py`<br/>`front-end/src/views/TopologyRadarView.tsx` | Run `python -m engine.cli shield-test` or test `test_08`, `test_09` |
| **5. Visual DAG Canvas** | Interactive runbook pipelines, node execution states | `engine/dag_engine.py`<br/>`front-end/src/views/CanvasBoard.tsx` | Run `python -m engine.cli runbook runbook-slash-guard` |

---

## 💎 Technical Highlights for Portaldot V3.0
- **Dynamic Decimals Resolution:** Safely queries `properties.get('tokenDecimals', 14)` from chain metadata to prevent discrepancies between 10^12 and 10^14 base units.
- **SS58 Generic Prefix 42:** Standard Portaldot validator addresses starting with `5...`.
- **Zero-Downtime Anti-Double Signing:** Atomic lease-lock mechanism guarantees standby node cannot broadcast blocks until primary lease is cleanly revoked.
- **Mainnet V3.0 Storage Deposit & Pallet-Revive Readiness:** 100% compliant with pallet-revive (~0.08 POT/byte storage deposit calculation, zero unbounded storage bloat, decimals 14 vs 18 normalized).
- **Pure Tech Aesthetic:** Dark Obsidian (`#0B0813`) + Electric Violet (`#8B5CF6`) theme, monospace tabular numbers, zero generic AI slop.
