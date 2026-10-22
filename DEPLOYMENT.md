# DotNexus Smart Contracts — Portaldot V3.0 Deployment Guide & Evidence

> **Target Network**: Portaldot Network V3.0 Testnet  
> **Substrate WS Endpoint**: `wss://test-node-v3.portaldot.dev`  
> **EVM JSON-RPC Endpoint**: `https://test-evm-rpc-v3.portaldot.dev`  
> **Chain ID (EVM)**: `420420777`  
> **SS58 Prefix**: `42`  
> **EVM Runtime Layer**: `pallet-revive` (Polkadot SDK Dual-VM execution engine)  

---

## 1. Verified Testnet Deployments (Status: 1 / Success)

| Contract Name | Deployed Address | Transaction Hash | Block | Status | Verified Code |
|---|---|---|---|:---:|:---:|
| **`SlashGuardLeaseRegistry`** | [`0xba114d21CC41a30880CcfA53673B743316387355`](file:///D:/Coding/Portaldot%20Hacker%20house%202026/DotNexus/contracts/SlashGuardLeaseRegistry.sol) | `0xe285c61d4829a3f33a32e634242e1a77ba15f7eea28d276c9d72b0482633472f` | `#147264` | **PASS (1)** | 2,003 bytes |

---

## 2. On-Chain Account Details

| Parameter | Value | Notes |
|---|---|---|
| **Deployer EVM Address** | `0xC5216e73898089269fdd377a1D4bD626b114E166` | EVM Address for DotNexus Operations |
| **Deployer Substrate SS58** | `5GXBDoveYazDtNXTTsNSnHToacTyAYtbikRahKoPudpkV9r9` | Dual-VM AutoMapped Native Address |
| **Current Deployer Balance** | `~240.91 POT` | After reserving ~169.56 POT for SlashGuardLeaseRegistry |

---

## 3. Second Contract: `DotNexusStakingVault`

* **Source**: [`contracts/DotNexusStakingVault.sol`](file:///D:/Coding/Portaldot%20Hacker%20house%202026/DotNexus/contracts/DotNexusStakingVault.sol)
* **Estimated Storage Deposit Needed**: ~`265 POT` (due to bytecode size ~3.2 KB).
* **Current Deployer Balance**: `240.91 POT` (short by ~25–30 POT).
* **Next Action**: Transfer 40 POT from `5EKz...` (which currently has 90 POT) to `5GXBDove...`, then run `python scripts/run_deploy_vault.py` to complete the second contract.
