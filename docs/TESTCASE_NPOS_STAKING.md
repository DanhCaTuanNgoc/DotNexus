# NPoS STAKING OPTIMIZER & ORDER DISPATCH STUDIO: OPERATOR MANUAL & 15-CASE QA TEST SPECIFICATION

> **Module**: NPoS Phragmén Simulator & Dynamic Re-Nomination View ([`StakingYieldView.tsx`](file:///D:/Coding/Portaldot%20Hacker%20house%202026/DotNexus/front-end/src/views/StakingYieldView.tsx))  
> **Target Network**: Portaldot Network V3.0 (Substrate WASM + EVM Frontier Pallet-Revive Dual-VM, SS58: 42, Decimals: 14/18)  
> **Document Purpose**: End-to-End Operational Manual & 15-Case Manual QA Test Matrix

---

## 1. Architectural Overview & Value Proposition

The **NPoS Staking** module in DotNexus is not merely a passive APY dashboard; it functions as an **Institutional Staking Control Plane** engineered around five mission-critical pillars:
1. **Client-Side Sequential Phragmén Simulation**: Executes the Phragmén election algorithm directly within the browser runtime to identify the optimal **Top 16 Validator Set**, preventing reward dilution and oversubscription clipping (> 512 nominators).
2. **PAO Metric Ribbon (Predictive Anti-Oversubscription)**: Evaluates validator safety margins $M_v$ using DotNexus's proprietary capacity scoring.
3. **Pre-Flight Safety Launchpad (3-Gate Invariant Radar)**: Verifies a 3-tier safety predicate prior to extrinsic broadcast:
   - **Gate 1**: `ElectionProvider.CurrentPhase == Off` (Prevents extrinsic rejection when runtime enters active election windows).
   - **Gate 2**: $\Delta\text{Yield} \times \text{Stake} > 3 \times \text{Fee}$ (Protects delegators from burning gas fees that exceed expected APY gains).
   - **Gate 3**: `AsyncNonceManager` Mutex Synchronization (Eliminates nonce race collisions during sequential extrinsic broadcasts).
4. **Dual-VM Order Dispatch Studio**: Provides dual transaction broadcast pipelines:
   - **Substrate Native (WASM)**: Signs and broadcasts via cryptographic `Keypair` (`//Alice`, `//Bob`, `//Charlie` or extension wallets).
   - **MetaMask EVM (Pallet-Revive Precompile)**: Automatically adds and switches to Portaldot Testnet V3 (Chain ID `0x190ef0a9` / `420420777`) to call the on-chain staking vault contract.
5. **Autonomous Staking Keeper & 28-Era Unbonding Escrow Queue**: Monitors 28-era unbonding lock queues (up to 32 chunks) and automates historical era reward sweeping.

---

## 2. Step-by-Step Operator Guide

### 2.1 Inspecting Yield Trajectories
1. Navigate to the **Staking & NPoS** tab on the master navigation bar (`activeTab = 'staking'`).
2. Review the top telemetry metrics:
   - **Simple Nominal Payout**: Base uncompounded return (e.g., `14.8% APY`).
   - **Auto-Compounded Yield**: Optimized return compounded 1,460 times/year by the Staking Keeper (e.g., `16.2% APY`, highlighting surplus POT yield).
   - **Active Set Capacity**: Selected validator count out of the protocol maximum of 16 targets.

### 2.2 Simulating & Rebalancing Allocations
1. Under **Pre-Nomination Safety Invariants**, verify the badge displays `[3/3 INVARIANTS SATISFIED]`.
2. Input the desired delegation capital into the **STAKING AMOUNT** field (e.g., `15000` POT). This preference is automatically persisted to `localStorage`.
3. Click **`SIMULATE & SIGN NOMINATE (X TARGETS)`**.
4. The system executes the client-side Phragmén allocation algorithm. An emerald confirmation banner appears detailing per-validator POT distributions and anticipated nonces.
5. Click **`OPEN DISPATCH STUDIO`** to launch the on-chain signing modal.

### 2.3 Ledger Market Filtering & Target Selection
1. **Market Preset Filters**:
   - `ALL (16)`: Displays all 16 optimal validator candidates.
   - `LIVE ON-CHAIN`: Filters strictly for live testnet validators (indicated by emerald pulse indicators and `PORTALDOT V3 LIVE` badges).
   - `OPTIMAL (Mv ≥ 0.5)`: Selects nodes with high capacity safety margins against nominator clipping.
   - `COMM ≤ 3%`: Filters for low-commission nodes ($\le 3\%$).
2. **Custom Target Selection**:
   - Toggle individual checkboxes in the leftmost column to customize the nomination set.
   - Click **`SELECT ALL`** to select the top 16 candidates.
   - Click **`CLEAR`** to reset selections.
   - The indicator updates dynamically to `{selectedTargets.length} / 16 TARGETS`.

### 2.4 Validator Profile Inspection
1. Click on any validator row or click the **`INSPECT`** action button.
2. The inspection modal details:
   - **SS58 Stash Account** with a one-click **`COPY ADDRESS`** utility.
   - 4 primary telemetry dimensions: `EST. APY`, `COMMISSION`, `TOTAL STAKED POT`, and `UPTIME RATIO`.
   - Technical breakdown: Current nominator capacity (`nominator_count / 256`), historical slashing violations, PAO score, and minimum reward threshold.
3. Click **`[-] REMOVE FROM SET`** or **`[+] ADD TO SET`** to toggle set membership.
4. Click **`STAKE & NOMINATE`** to transition directly into the Dispatch Studio.
5. Press `Esc` or click the close icon (`X`) to dismiss the modal.

### 2.5 On-Chain Extrinsic Dispatch (Order Dispatch Studio)
1. Open the modal via **`SIMULATE & SIGN NOMINATE`** or **`STAKE & NOMINATE`**.
2. **Select Protocol Engine**:
   - **Substrate Native (SS58: 42)**:
     - Select the signing account (`//Alice` - pre-funded on testnet, `//Bob`, or `//Charlie`).
     - Enter allocation amount (`BOND CAPITAL ALLOCATION (POT)`).
     - Inspect the **Raw Extrinsic Call Payload** (e.g., `staking.nominate(targets=[...])`) with a one-click **`COPY CALL`** action.
     - Click **`CONFIRM & BROADCAST ON-CHAIN`**: Dispatches the extrinsic directly to the Substrate WebSocket endpoint (`wss://test-node-v3.portaldot.dev`).
     - Upon confirmation, an emerald receipt card renders: **Transaction Hash**, **Block Hash**, **Signer Account**, and runtime events (`pallet_staking.Nominated`, `system.ExtrinsicSuccess`).
     - *(Optional)*: Click **`TEST AUTO-COMPOUND (BOND EXTRA)`** to invoke `staking.bond_extra`, reinvesting accrued rewards into bonded principal.
   - **MetaMask EVM (Revive Precompile)**:
     - Switch to the **MetaMask EVM (Revive Precompile)** tab.
     - Click **`CONNECT METAMASK`**. MetaMask prompts the user to add and switch to `Portaldot Testnet V3` (Chain ID `0x190ef0a9` / `420420777`, RPC `https://test-evm-rpc-v3.portaldot.dev`).
     - Click **`CONFIRM & BROADCAST ON-CHAIN`**: MetaMask opens a transaction prompt targeting the Staking Vault contract ([`DotNexusStakingVault.sol`](file:///D:/Coding/Portaldot%20Hacker%20house%202026/DotNexus/contracts/DotNexusStakingVault.sol) at `0x97e5707FCa341c27D7e6b5cEC5ABFe2d3498610A`).
     - Upon confirmation, the verified EVM transaction hash displays on-screen.

### 2.6 Unbonding Escrow Management & Autonomous Staking Keeper
1. **Autonomous Staking Keeper**:
   - Inspect `CURRENT ERA` and `MIN APY DELTA REBALANCE`.
   - Click **`SIMULATE & RUN KEEPER PASS`**: Evaluates economic yield invariants and executes an autonomous rebalancing cycle.
2. **Unbonding Escrow & Lock Queue**:
   - Tracks POT amounts queued for release across locked chunks (bounded by Substrate's 32-chunk ceiling).
   - **Unbonding Capital (`UNBOND STAKE`)**: Click **`UNBOND STAKE`** $\rightarrow$ Specify POT to unbond ($\ge 0.1$ POT) $\rightarrow$ Click **`CONFIRM UNBOND`**. The `staking.unbond` extrinsic places funds into the 28-era lock queue (~7 days).
   - **Claiming Matured Capital (`WITHDRAW UNBONDED`)**: When chunks complete the 28-era lock duration, the **`WITHDRAW UNBONDED`** button transitions to glowing green (`WITHDRAW X POT`). Clicking claims unbonded POT directly into liquid `Free Balance`.

---

## 3. Comprehensive 15-Case Manual QA Test Matrix

The following test suite covers 100% of the operational requirements for the NPoS Staking control plane:

| Test Case ID | Subsystem / Feature | Test Objective | Preconditions | Execution Steps | Test Input Data | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-NPOS-01** | Yield Trajectory | Verify calculation fidelity of nominal APY vs compounded yield | Staking view mounted | 1. Inspect Simple Nominal Payout card.<br>2. Inspect Auto-Compounded Yield card.<br>3. Adjust Staking Amount input. | Stake = `10000` POT | Auto-Compounded Yield must strictly exceed Nominal Payout. `surplusPot` bonus must be positive and reflect 1,460 compound cycles/year. | **PASS** |
| **TC-NPOS-02** | Pre-Flight Radar | Validate 3-gate safety invariant checks prior to nomination | Testnet operational | 1. Inspect invariant badge.<br>2. Verify Gates 1, 2, and 3 states. | N/A | Badge displays `[3/3 INVARIANTS SATISFIED]`. Gate 1 reflects `Off`. Gate 2 reflects `> 3x FEE`. Gate 3 displays `[SYNCED]`. | **PASS** |
| **TC-NPOS-03** | Staking Input | Verify state persistence of delegation capital in LocalStorage | Staking view mounted | 1. Enter new value into `STAKING AMOUNT`.<br>2. Refresh page or switch views and return. | Stake = `25000` POT | Input field retains `25000` POT without reverting to the default 10,000 POT. | **PASS** |
| **TC-NPOS-04** | Validator Filters | Validate market preset filtering logic | Ledger table hydrated | 1. Click `LIVE ON-CHAIN`.<br>2. Click `OPTIMAL (Mv ≥ 0.5)`.<br>3. Click `COMM ≤ 3%`.<br>4. Click `ALL`. | Filter button toggles | - `LIVE ON-CHAIN` isolates nodes with `PORTALDOT V3 LIVE` tags.<br>- `OPTIMAL` isolates nodes with $M_v \ge 0.5$.<br>- `COMM ≤ 3%` isolates nodes with commission $\le 3\%$.<br>- `ALL` displays the complete candidate set. | **PASS** |
| **TC-NPOS-05** | Target Selection | Test individual node selection and 16-target ceiling | Staking view mounted | 1. Deselect 2 validators.<br>2. Check Target counter.<br>3. Attempt to select beyond 16 nodes. | Checkbox toggles | Counter decrements to `14 / 16 TARGETS`. System prevents selecting a 17th node. Simulate button updates target count. | **PASS** |
| **TC-NPOS-06** | Bulk Target Action | Verify `SELECT ALL` and `CLEAR` bulk operations | Staking view mounted | 1. Click `CLEAR`.<br>2. Observe simulate button.<br>3. Click `SELECT ALL`. | Click `CLEAR` $\rightarrow$ Click `SELECT ALL` | `CLEAR` resets counter to `0 / 16 TARGETS` and disables `SIMULATE & SIGN NOMINATE`. `SELECT ALL` restores selection to top 16 candidates. | **PASS** |
| **TC-NPOS-07** | Validator Modal | Verify Profile Modal rendering and SS58 address copying | Ledger table hydrated | 1. Click `INSPECT` on a validator row.<br>2. Click `COPY ADDRESS`.<br>3. Paste into clipboard viewer.<br>4. Press `Esc`. | Any active validator | Modal mounts with backdrop blur. Copy button toggles to `COPIED` for 2s. Pasted text matches valid SS58 address (`5...`). Pressing `Esc` closes modal. | **PASS** |
| **TC-NPOS-08** | Modal Add/Remove | Toggle target inclusion directly within inspection modal | Validator modal open | 1. If selected, click `[-] REMOVE FROM SET`.<br>2. Observe state change.<br>3. Click `[+] ADD TO SET`. | In-modal toggle | Button toggles color and label. Dismissing modal reveals synchronized checkbox state in main ledger table. | **PASS** |
| **TC-NPOS-09** | Rebalance Flow | Verify Phragmén weight computation upon simulation | Capital and targets set | 1. Input `12000` POT.<br>2. Click `SIMULATE & SIGN NOMINATE`.<br>3. Observe result banner. | Stake = `12000` POT, 16 targets | Spinner displays during calculation. Emerald banner appears: `ALLOCATED: 750.0 POT across 16 optimal validators`, displaying expected nonce and `OPEN DISPATCH STUDIO`. | **PASS** |
| **TC-NPOS-10** | Substrate Dispatch | Sign and broadcast `staking.nominate` on-chain via Substrate | Dispatch Studio open | 1. Select `Substrate Native (SS58: 42)`.<br>2. Select keypair `//Alice`.<br>3. Input Allocation `15` POT.<br>4. Click `CONFIRM & BROADCAST ON-CHAIN`. | Signer = `//Alice`, Allocation = `15` POT | Spinner displays `BROADCASTING ON-CHAIN...`. Upon confirmation, emerald receipt card displays authentic Transaction Hash (`0x...`), Block Hash, Signer, and runtime events. Copy hash buttons function correctly. | **PASS** |
| **TC-NPOS-11** | Substrate Bond Extra | Test auto-compounding capital addition via `staking.bond_extra` | Dispatch Studio open | 1. Click `TEST AUTO-COMPOUND (BOND EXTRA)`.<br>2. Observe transaction lifecycle. | Keypair `//Alice`, Amount = `10` POT | Button transitions to `BONDING ON-CHAIN...`. The `staking.bond_extra` extrinsic broadcasts successfully, returning an on-chain receipt tagged `STAKING_BOND_EXTRA`. | **PASS** |
| **TC-NPOS-12** | MetaMask EVM Flow | Connect MetaMask and invoke pallet-revive Staking Vault | Browser with MetaMask | 1. Switch to `MetaMask EVM` tab.<br>2. Click `CONNECT METAMASK`.<br>3. Approve network switch to Portaldot Testnet V3.<br>4. Click `CONFIRM & BROADCAST ON-CHAIN`.<br>5. Confirm prompt in MetaMask. | Portaldot Testnet V3 (`0x190ef0a9`) | EVM address renders with green pulse dot. MetaMask prompts user targeting contract `0x97e5707FCa341c27D7e6b5cEC5ABFe2d3498610A`. Valid EVM transaction hash returned. | **PASS** |
| **TC-NPOS-13** | Keeper Simulation | Test trigger cycle of Autonomous Staking Keeper | Staking view mounted | 1. Locate `ERA AUTONOMOUS STAKING KEEPER`.<br>2. Click `SIMULATE & RUN KEEPER PASS`.<br>3. Observe telemetry update. | Button click | Button transitions to `EVALUATING INVARIANTS...`. Post-run, `LAST ACTION` timestamp and decision update cleanly without layout stutter. | **PASS** |
| **TC-NPOS-14** | Unbond Stake Flow | Verify queuing of unbonding capital into 28-era countdown | Staking view mounted | 1. On Unbonding Escrow card, click `UNBOND STAKE`.<br>2. Enter `5.0` POT.<br>3. Click `CONFIRM UNBOND`. | Amount = `5.0` POT | Modal closes, confirmation notification renders: `Extrinsic staking.unbond (5 POT) placed into 28-era queue!`. `QUEUED UNBONDING` metric increments accordingly. | **PASS** |
| **TC-NPOS-15** | Withdraw Unbonded | Verify claiming liquid balance upon chunk maturity | Account with mature chunk (> 28 Eras) | 1. Inspect `WITHDRAW UNBONDED` button.<br>2. If chunk is mature, button illuminates glowing green (`WITHDRAW X POT`).<br>3. Click button. | Chunk `READY_TO_WITHDRAW` | System dispatches `staking.withdraw_unbonded`. POT transfers from reserved to Free Balance. Matured chunk is evicted from escrow queue. | **PASS** |

---

## 4. 60-Second Smoke Test Protocol for Evaluators

For hackathon judges and evaluators performing smoke tests:

1. Launch local development servers (or access the live production deployment at `https://dotnexus-hackerhouse.vercel.app/`):
   ```bash
   # Terminal 1: Backend Gateway
   python -m engine.server

   # Terminal 2: Web Console
   cd front-end && npm run dev
   ```
2. Navigate to the **Staking & NPoS** view (`http://localhost:5173`).
3. Verify view mounts instantly (0ms) without hanging spinners.
4. Click **`SIMULATE & SIGN NOMINATE`** $\rightarrow$ Order Dispatch Studio modal mounts.
5. Click **`TEST AUTO-COMPOUND (BOND EXTRA)`** $\rightarrow$ Verify authentic on-chain receipt card with transaction hash and block inclusion.
6. Click **`SIMULATE & RUN KEEPER PASS`** $\rightarrow$ Verify keeper evaluates yield invariants and updates era indicators.

---

## 5. Troubleshooting & Edge Cases

1. **"Offline Fallback / Simulated Mode" Warning**:
   - *Cause*: Public testnet WebSocket RPC endpoint (`wss://test-node-v3.portaldot.dev`) is temporarily unreachable or resetting.
   - *System Behavior*: Graceful degradation activates the local simulation sandbox, ensuring judges can evaluate the Phragmén optimization pipeline and order dispatch modals without application crashes.
2. **MetaMask "Unrecognized Chain" Prompt**:
   - DotNexus pre-packages `wallet_addEthereumChain` parameters pre-configured for Portaldot V3 (`420420777`). Click **Approve** in the MetaMask popup to register the chain.
3. **Modal Navigation Shortcuts**:
   - Press **`Escape (Esc)`** at any point to dismiss active modals (Profile, Dispatch Studio, Unbond Escrow).
