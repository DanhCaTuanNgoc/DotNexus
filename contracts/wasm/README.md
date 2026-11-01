# DotNexus WASM Smart Contract Companion (`dotnexus_sentinel`)

> **Target Layer:** Portaldot Network V3.0 Substrate WASM (`pallet-contracts`)  
> **Toolchain:** ink! v5.0.0, `cargo-contract` v4.x / v5.x  
> **Companion Contracts:** [`SlashGuardLeaseRegistry.sol`](../SlashGuardLeaseRegistry.sol) & [`DotNexusStakingVault.sol`](../DotNexusStakingVault.sol) (on Frontier EVM `pallet-revive`)

---

## 1. Architectural Positioning

Portaldot Network V3.0 is a **Dual-VM blockchain** capable of concurrent execution across:
1. **Frontier EVM (`pallet-revive`):** Houses our distributed lease mutex [`SlashGuardLeaseRegistry.sol`](../SlashGuardLeaseRegistry.sol) and liquid delegation vault [`DotNexusStakingVault.sol`](../DotNexusStakingVault.sol).
2. **Substrate WASM (`pallet-contracts`):** Houses the `dotnexus_sentinel` smart contract.

The `dotnexus_sentinel` contract serves as an **immutable, on-chain heartbeat witness** on the native WASM virtual machine. Active validators submit periodic heartbeat extrinsics to `pallet-contracts::call(dotnexus_sentinel, record_heartbeat)`. The DotNexus SRE Core (`engine/dual_tracker.py`) inspects this contract directly to verify cross-VM liveness parity.

---

## 2. Compilation Instructions

To compile the ink! smart contract into WASM bytecode and production metadata:

```bash
# 1. Install cargo-contract toolchain (if not already installed)
cargo install --force --locked cargo-contract --version ^4.0.0

# 2. Navigate to contract directory
cd contracts/wasm/dotnexus_sentinel

# 3. Run unit tests
cargo test

# 4. Compile optimized WASM binary
cargo contract build --release
```

Outputs generated in `target/ink/`:
- `dotnexus_sentinel.contract` (Combined bundle for Polkadot-JS Apps)
- `dotnexus_sentinel.wasm` (Optimized WASM bytecode)
- `dotnexus_sentinel.json` (ABI Metadata specification)

---

## 3. ABI Message Selectors

| Message | Selector | Description |
|---|:---:|---|
| `record_heartbeat(era, block_number)` | `0x789c6d12` | Emits `HeartbeatWitnessed` and updates liveness mapping |
| `get_validator_liveness(stash)` | `0x4b7f920a` | Read-only inspection of latest era, block, and timestamp |
| `is_validator_healthy(stash, block, max_drift)` | `0x3344b1c2` | Returns `true` if heartbeat block is within drift threshold |
| `get_total_heartbeats()` | `0x0d2838ec` | Monotonic count of heartbeats witnessed on WASM layer |
