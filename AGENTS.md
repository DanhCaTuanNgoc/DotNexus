# Agent Behavior & Project Guidelines — DotNexus

## 1. Project Overview & Scope
- **Project**: DotNexus (The Visual Control Plane & Automated Security Operations Engine for Portaldot Network V3.0)
- **Track**: Node Operations & Tooling — Portaldot Hacker House 2026
- **Target Network**: Portaldot Network V3.0 (Substrate WASM + EVM Dual-VM, SS58: 42, POT Token Decimals: 14)
- **Core Stack**:
  - Backend Engine: Python 3.10+ (Substrate Interface, Web3.py, WebSockets, Flask API on port 5050)
  - Frontend: React 19 / TypeScript / Vite / Tailwind CSS / Three.js 3D Cyber Mesh
  - Testing: Standard `unittest` suite in `tests/test_engine.py`

---

## 2. Skills Integration & Usage

The workspace is equipped with the full suite of specialized skills under `.agents/skills/`:

### 🎨 Impeccable UI Skill (`.agents/skills/impeccable/`)
Use whenever designing, refining, reviewing, or enhancing the frontend:
- **Craft Floor Compliance**: Always adhere to `.agents/skills/impeccable/reference/craft-floor.md`.
  - Contrast $\ge$ 4.5:1, tight grouping, generous separation, type hierarchy with -0.02em to -0.04em tracking.
  - Ban ghost cards (no 1px border combined with zero-offset soft blur decoration).
  - Ban generic nested cards and AI-slop doodles.
  - Always style browser surfaces: `tabular-nums` for live data, custom selection colors, custom scrollbars.
- **Commands**:
  - `shape [feature]`: Plan UX/UI before writing code.
  - `polish [target]`: Final quality pass on styling and micro-interactions.
  - `bolder [target]`: Amplify designs that feel too timid or safe.
  - `harden [target]`: Add error handling, empty states, and responsive edge cases.
  - `audit [target]`: Verify accessibility, performance, and DOM cleanliness.

### 📋 SpecKit Engineering Workflow (`.agents/skills/speckit-*/`)
Use for structured, production-grade feature development:
- `speckit-plan`: Create structured architectural plans.
- `speckit-specify`: Specify exact acceptance criteria and schemas.
- `speckit-tasks`: Break down plans into atomic, actionable steps.
- `speckit-implement`: Execute code changes strictly adhering to specifications.

### 🕸️ Graphify Architectural Intelligence (`.agents/skills/graphify/`)
Use for codebase graph traversal, dependency impact analysis, and architecture exploration:
- `graphify update .`: Re-extract AST and rebuild knowledge graph across Python, Solidity, and TypeScript.
- `graphify query [question]`: Query relationships and data flow through BFS traversal.
- `graphify path [from] [to]`: Find shortest dependency path between components before refactoring.
- `graphify explain [symbol]`: Inspect node degree, community cluster, and in/out connections.

---

## 3. Engineering & Coding Standards
- **No Mock / Fake Shortcuts**: Everything in `engine/` must be production-ready and capable of binding to live Substrate WS (`ws://127.0.0.1:9944`) and EVM JSON-RPC (`http://127.0.0.1:8545`).
- **Dynamic Decimals Policy**: Never hardcode 10^12 vs 10^14 base units; always query `properties.get('tokenDecimals', 14)` from chain metadata.
- **Strict Anti-Equivocation**: Signing leases must use strict atomic mutex locks to prevent double-signing slashing.
- **Zero AI Slop**: No generic floating chatbots, no cartoonish 3D elements, no meaningless low-density cards.
- **No Emojis in Source Code**: Do not use emojis in variable names, schema definitions, or test suites.

---

## 4. Verification & Commit Hygiene
- Run `python -m unittest tests/test_engine.py` before finalizing any backend changes (must pass 10/10).
- Run `cd front-end && npm run build` to verify zero TypeScript errors.
- Commit code in clear, meaningful chunks with conventional commit prefixes (`feat:`, `fix:`, `test:`, `docs:`).
