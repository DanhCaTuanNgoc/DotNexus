# DotNexus ⚡

> **The Visual Control Plane & Automated Security Operations Engine for Portaldot Network V3.0**

[![Portaldot V3.0](https://img.shields.io/badge/Portaldot-V3.0%20Dual--VM-24C6DC?style=for-the-badge)](https://portaldot.network)
[![Track](https://img.shields.io/badge/Track-Node%20Operations%20%26%20Tooling-FF6B6B?style=for-the-badge)](https://dorahacks.io)
[![Substrate](https://img.shields.io/badge/Substrate-WASM%20Runtime-282C34?style=for-the-badge)](https://substrate.io)
[![EVM](https://img.shields.io/badge/EVM-Compatible-627EEA?style=for-the-badge)](https://ethereum.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=111)](https://react.dev)

---

## 🌟 Overview

**DotNexus** transforms complex Portaldot Network V3.0 node operations, security audits, and staking management into an interactive, visual control plane. 

Instead of dealing with risky CLI commands and passive dashboards, DotNexus empowers Validators, RPC Operators, and Stakers with:

1. **Dual-Engine State Tracker (WASM vs EVM):** Simultaneous telemetry and latency monitoring between Substrate WebSocket RPC (`:9944`) and EVM JSON-RPC (`:8545`), detecting state desync and separating mempool extrinsics.
2. **Automated Key Rotation & Slashing Guard:** Safe `author_rotateKeys` execution, double-signing protection (equivocation guard), and an independent heartbeat daemon (`pallet_im_online`) with automatic standby failover.
3. **NPoS Dynamic Re-Nomination Engine:** Algorithmic scoring of active validators (uptime, commission, slash history, available capacity) and automated auto-compounding for optimal APY.
4. **RPC Rate-Limiting & Anti-Spam Shield:** Intelligent request parsing to block heavy queries (e.g., broad `eth_getLogs`), IP rate-limiting, and an interactive P2P network topology visualizer.
5. **Visual DAG Canvas (Drag & Drop):** An interactive DAG workflow orchestrator that lets operators chain monitoring triggers with automated remediation actions (Runbooks) without writing code.

---

## 🚀 Quickstart Guide

### 1. Requirements & Dependencies
Ensure Python 3.10+ and Node.js 18+ are installed.
```bash
# Python dependencies
pip install -r requirements.txt

# Frontend dependencies
cd front-end
npm install
cd ..
```

### 2. Run Comprehensive Test Suite
```bash
python -m unittest tests/test_engine.py
```
*(Runs 10/10 automated tests covering all 4 core pillars and DAG engine)*

### 3. Native CLI Commands
```bash
# Query Dual-VM sync status
python -m engine.cli dual-vm

# Optimal Top 16 validator selection & APY boost
python -m engine.cli npos --top16

# Verify RPC shield against heavy getLogs spam
python -m engine.cli shield-test --type HEAVY_GETLOGS

# Execute operational runbook pipeline
python -m engine.cli runbook runbook-slash-guard
```

### 4. Start the Application
In Terminal 1 (Backend Gateway):
```bash
python -m engine.server
```

In Terminal 2 (Web Control Center UI):
```bash
cd front-end
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

---

## 📂 Project Structure

```txt
DotNexus/
├── PROJECT_BLUEPRINT.md            # Comprehensive architecture & design document
├── FOR_JUDGES.md                   # 60s Judge evaluation guide & compliance checklist
├── README.md                       # Quickstart instructions
├── requirements.txt                # Python backend dependencies
├── engine/                         # Core Python Ops & Security Engine
│   ├── config.py                   # Portaldot V3 parameters (SS58: 42, Decimals: 14)
│   ├── dual_tracker.py             # Parallel WASM (:9944) vs EVM (:8545) telemetry
│   ├── slash_guard.py              # Session key rotation & anti-equivocation locking
│   ├── npos_optimizer.py           # Top 16 validator scoring & APY compounding
│   ├── rpc_shield.py               # Heavy query parser & P2P topology analyzer
│   ├── dag_engine.py               # Operational runbooks workflow executor
│   ├── server.py                   # Central Gateway REST & diagnostics API
│   └── cli.py                      # Admin CLI suite
├── front-end/                      # React 19 + TypeScript + Tailwind CSS UI
│   ├── src/
│   │   ├── components/             # Header, TerminalDrawer
│   │   ├── views/                  # DualEngineView, SecurityGuardView, StakingYieldView,
│   │   │                           # TopologyRadarView, CanvasBoard
│   │   ├── services/api.ts         # Backend API bridge
│   │   └── App.tsx                 # Tab navigation & global state
└── tests/
    └── test_engine.py              # Full unit & integration test suite
```

---

## 👥 Hackathon Details
- **Competition:** Portaldot Hacker House 2026
- **Track:** Node Operations & Tooling
- **Check-in Deadline:** Oct 24, 2026
- **Final Submission:** Nov 6, 2026
