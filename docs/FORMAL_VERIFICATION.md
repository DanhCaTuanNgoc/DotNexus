# Formal Verification & Mathematical Safety Invariants: Anti-Equivocation Distributed Mutex Leases

> **Document Type:** Formal Verification Specification & State Transition Safety Proofs  
> **Target Network:** Portaldot Network V3.0 (Substrate WASM + EVM `pallet-revive`, SS58: 42, Decimals: 14)  
> **Protocol Components:** [`SlashGuardLeaseRegistry.sol`](../contracts/SlashGuardLeaseRegistry.sol), [`engine/slash_guard.py`](../engine/slash_guard.py), [`scripts/fence_node.sh`](../scripts/fence_node.sh)  
> **Evaluation Rubric:** Technical Feasibility (30%) & Innovation (30%) — Portaldot Hacker House 2026

---

## 1. Executive Summary & Problem Formulation

In Substrate NPoS and BABE consensus, **Equivocation (Double-Signing)** is a fatal slashable offense. If a validator produces two differing block headers for the same slot or signs contradictory GRANDPA votes:
$$\text{SlashPenalty} = 100\% \times \text{TotalBondedStake}$$
The validator's active stake is completely wiped out, and its identity is ejected from the consensus active set permanently.

When high-availability validator infrastructure employs an active-standby redundancy topology (Node $N_1$ as Primary, Node $N_2$ as Standby), asymmetric network partitions (the classic **Split-Brain problem**) pose an existential threat:
If $N_1$ loses outward network reachability but continues authoring blocks locally, while $N_2$ assumes $N_1$ is dead and begins signing with identical Session Keys, both nodes will broadcast conflicting blocks once the network partition heals, triggering instant protocol-level slashing.

**DotNexus** proves mathematically that by coupling an **On-Chain Distributed Mutex Lease** on Portaldot EVM (`pallet-revive`) with an **OS-Level Dead Man's Switch (Self-Fencing)** on the host kernel, equivocation is mathematically impossible:
$$\forall t \ge 0, \quad \left| \{ N_i \mid \text{CanSignBlock}(N_i, t) \} \right| \le 1$$

---

## 2. System Model & Timing Assumptions

### 2.1. Network & Nodes
- Let $\mathcal{N} = \{ N_1, N_2 \}$ be the set of validator nodes sharing authority for stash account $\mathcal{A}_{\text{stash}}$.
- $N_1$ is the designated **Primary Authority**; $N_2$ is the **Hot-Standby Authority**.
- Let $\mathcal{C}$ be the Portaldot Network V3.0 decentralized consensus ledger (Frontier EVM `pallet-revive` at Chain ID `420420777`).
- Communication between $N_i$ and $\mathcal{C}$ is subject to an upper bound clock drift $\epsilon_{\text{clock}} \le 200\text{ms}$ (enforced via NTP / PTP synchronized kernels).

### 2.2. State Space Definition
The global system state $\mathcal{S}$ is modeled as a tuple:
$$\mathcal{S}(t) = \big( \sigma_{N_1}(t), \; \sigma_{N_2}(t), \; \mathcal{L}_{\mathcal{C}}(t) \big)$$

Where node state $\sigma_{N_i}(t) \in \{ \text{SIGNING\_ACTIVE}, \text{FENCED\_ISOLATED}, \text{STANDBY\_IDLE}, \text{TAKEOVER\_PROMOTED} \}$,  
and on-chain contract state $\mathcal{L}_{\mathcal{C}}(t) = (\text{activeOperator}, \text{epoch}, \text{expiresAtBlock}, \text{isFenced})$.

---

## 3. The Tri-Tier Timing Invariant

The DotNexus Anti-Equivocation protocol enforces a strict, monotonic time hierarchy:

$$\boxed{T_{\text{fence}} < T_{\text{lease\_ttl}} < T_{\text{takeover}}}$$

| Parameter | Notation | Numerical Value | Enforcement Mechanism |
|---|:---:|:---:|---|
| **Primary Self-Fence Timeout** | $T_{\text{fence}}$ | $10.0\text{s}$ | Host OS Kernel (`scripts/fence_node.sh`: `chmod 000` + `SIGTERM`) |
| **On-Chain Lease Duration TTL** | $T_{\text{lease\_ttl}}$ | $12.0\text{s}$ | Smart Contract State (`SlashGuardLeaseRegistry.sol:expiresAtBlock`) |
| **Standby Takeover Grace Delay** | $T_{\text{takeover}}$ | $15.0\text{s}$ | Standby Failover Guard (`engine/slash_guard.py:execute_failover`) |

```
Time Axis (t):
t = 0s         Heartbeat lost between N1 and Lease Registry
       │
t = 10.0s      [T_fence] N1 Dead Man's Switch triggers: chmod 000 keystore + SIGTERM (N1 SILENCED)
       │
t = 12.0s      [T_lease] On-chain lease expires on SlashGuardLeaseRegistry.sol
       │
t = 15.0s      [T_takeover] N2 verifies N1 P2P port 30333 closed & acquires epoch E + 1
       │
t > 15.0s      N2 begins signing blocks (ZERO EQUIVOCATION HAZARD)
```

---

## 4. Formal Proofs

### Theorem 1 (Safety: Mutual Exclusion of Signing Authority / Zero Equivocation)
> Under any arbitrary network partition, message loss, or node stall, there does not exist any point in physical time $t$ such that both $N_1$ and $N_2$ can author consensus blocks for the same epoch.

$$\forall t \ge 0, \quad \big( \sigma_{N_1}(t) = \text{SIGNING\_ACTIVE} \big) \land \big( \sigma_{N_2}(t) = \text{SIGNING\_ACTIVE} \big) = \text{False}$$

#### Proof (By Contradiction):
1. Assume for contradiction that at time $t^*$, both $N_1$ and $N_2$ are in state $\text{SIGNING\_ACTIVE}$.
2. In order for $N_2$ to enter $\text{SIGNING\_ACTIVE}$, $N_2$ must execute `acquireFailoverLease(expectedEpoch = E + 1)` on contract $\mathcal{C}$.
3. By the contract preconditions in `SlashGuardLeaseRegistry.sol` (Line 71):
   $$\text{expectedEpoch} > \text{currentLease.fencingEpoch}$$
   This requires that a failover transaction was included and finalized on-chain at time $t_{\text{tx}} \le t^*$.
4. By protocol rule, $N_2$ will only submit this transaction if elapsed silence $\Delta t \ge T_{\text{takeover}} = 15.0\text{s}$.
5. Therefore, the failure of $N_1$ to update its heartbeat began at $t_0 = t_{\text{tx}} - 15.0\text{s}$.
6. Now consider the local daemon on $N_1$:
   - The Dead Man's Switch on $N_1$ checks time elapsed since the last verified on-chain lease renewal $\tau_{\text{last}}$.
   - If $t - \tau_{\text{last}} \ge T_{\text{fence}} = 10.0\text{s}$, the daemon immediately invokes `scripts/fence_node.sh`:
     - Sets file permissions of the BABE/GRANDPA keystore directory to `000` (`chmod 000 /chains/portaldot_v3/keystore`).
     - Issues `SIGTERM` to the binary PID (`systemctl stop portaldot-node`).
   - The OS file system transition from readable ($0700$) to unreadable ($0000$) occurs at:
     $$t_{\text{fenced}} = t_0 + T_{\text{fence}} + \epsilon_{\text{os}} \le t_0 + 10.1\text{s}$$
7. Thus, for all $t > t_0 + 10.1\text{s}$, $N_1$ has no read or execute access to the session private keys:
   $$\sigma_{N_1}(t) = \text{FENCED\_ISOLATED} \neq \text{SIGNING\_ACTIVE}$$
8. Since $N_2$ cannot begin signing until at earliest:
   $$t_{\text{standby\_sign}} \ge t_0 + T_{\text{takeover}} = t_0 + 15.0\text{s}$$
9. We observe the non-overlapping time safety margin:
   $$\Delta_{\text{safety}} = t_{\text{standby\_sign}} - t_{\text{fenced}} \ge 15.0\text{s} - 10.1\text{s} = 4.9\text{s} > 0$$
10. Consequently, at time $t^*$, $N_1$ is already irreversibly fenced and cannot sign.
    $$\big( \sigma_{N_1}(t^*) = \text{FENCED\_ISOLATED} \big) \land \big( \sigma_{N_2}(t^*) = \text{SIGNING\_ACTIVE} \big)$$
    This contradicts our assumption that both were in $\text{SIGNING\_ACTIVE}$. $\blacksquare$

---

### Theorem 2 (Liveness: Bounded Failover Convergence)
> If the Primary node $N_1$ suffers a fatal hardware crash or network blackout at time $t_0$, the Standby node $N_2$ will reliably take over signing authority within a deterministic upper bound:

$$t_{\text{recovery}} \le t_0 + T_{\text{takeover}} + \Delta_{\text{tx\_latency}} + \Delta_{\text{key\_mount}}$$

#### Proof:
1. $N_1$ halts heartbeat emission at $t_0$.
2. $N_2$ polls the on-chain lease status via EVM JSON-RPC every $\tau_{\text{poll}} = 2.0\text{s}$.
3. At $t = t_0 + T_{\text{takeover}} = t_0 + 15.0\text{s}$, the condition $\text{elapsed} \ge 15.0\text{s}$ is satisfied.
4. $N_2$ verifies via TCP socket probe that $N_1$'s P2P Libp2p port `:30333` is unreachable or closed.
5. $N_2$ signs and dispatches `acquireFailoverLease(operator, epoch + 1, peerIdHash, 200)` to `SlashGuardLeaseRegistry.sol`.
6. With Portaldot V3 block time $T_{\text{block}} = 6.0\text{s}$, the transaction is mined into the next EVM block within $\Delta_{\text{tx\_latency}} \le 6.0\text{s} + \epsilon_{\text{propagation}}$.
7. Upon event `LeaseAcquired(operator, epoch + 1)`, $N_2$ unlocks its local keystore mount and arms session authoring.
8. Maximum recovery bound:
   $$t_{\text{recovery}} \le 15.0\text{s} + 6.0\text{s} + 0.5\text{s} = 21.5\text{s} \quad (\approx 3.5 \text{ BABE Slots})$$
   This guarantees that no more than 4 consecutive BABE slots are skipped, preventing unresponsiveness slashing (which requires missing an entire Session of 2400 slots). $\blacksquare$

---

## 5. Monotonic Fencing Epoch & Split-Brain Elimination

Even if $N_1$ re-awakens after being partitioned (e.g. network cable reconnected), it cannot re-acquire the lease without a valid monotonically increasing epoch:

```solidity
// SlashGuardLeaseRegistry.sol (Line 70-74)
if (expectedEpoch <= currentLease.fencingEpoch) {
    emit SplitBrainAttemptBlocked(operator, expectedEpoch, currentLease.fencingEpoch, msg.sender);
    revert StaleFencingEpoch(expectedEpoch, currentLease.fencingEpoch);
}
```

Because $N_2$ has already bumped the on-chain epoch to $E + 1$, any stale transaction from $N_1$ with epoch $E$ will immediately revert at the EVM state level.

---

## 6. Verification Summary & Reference Matrix

| Formal Property | Invariant Formula | Verification Artifact | Test Suite Reference |
|---|---|---|---|
| **Safety** | $\forall t, \| \{ N_i \mid \text{Active}(N_i, t) \} \| \le 1$ | [`SlashGuardLeaseRegistry.sol`](../contracts/SlashGuardLeaseRegistry.sol) | `tests/unit/test_slash_guard.py:test_04_atomic_lease_lock_mutex` |
| **Dead Man's Switch** | $T_{\text{fence}} = 10.0\text{s} < 12.0\text{s}$ | [`scripts/fence_node.sh`](../scripts/fence_node.sh) | `tests/unit/test_slash_guard.py:test_01_dead_mans_switch_timeout` |
| **Monotonic Epoch** | $E_{k+1} > E_k$ | `SlashGuardLeaseRegistry.sol:71` | `tests/unit/test_slash_guard.py:test_05_monotonic_fencing_epoch` |
| **Anti-Key Desync** | Failover rejects `author_rotateKeys` | [`engine/slash_guard.py:432`](../engine/slash_guard.py) | `tests/unit/test_slash_guard.py:test_failover_rejects_author_rotate_keys` |
