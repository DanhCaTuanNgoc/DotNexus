# DotNexus Smart Contracts — Portaldot V3.0 Deployment Guide & Evidence

> **Target Network**: Portaldot Network V3.0 Testnet  
> **Substrate WS Endpoint**: `wss://test-node-v3.portaldot.dev`  
> **EVM JSON-RPC Endpoint**: `https://test-evm-rpc-v3.portaldot.dev`  
> **Chain ID (EVM)**: `420420777`  
> **SS58 Prefix**: `42`  
> **EVM Runtime Layer**: `pallet-revive` (Polkadot SDK EVM compatibility layer)  

---

## 1. Verified Testnet Deployer & Transaction Evidence

| Parameter | Value | Notes |
|---|---|---|
| **Deployer EVM Address** | `0xC5216e73898089269fdd377a1D4bD626b114E166` | EVM Address for DotNexus Core Operations |
| **Deployer Substrate SS58** | `5GXBDoveYazDtNXTTsNSnHToacTyAYtbikRahKoPudpkV9r9` | Dual-VM AutoMapped Native Address |
| **Bridge Extrinsic Hash** | `0xdd1ba6cc28643bcdbd4733f911be7d298a49f5a5a2405736896fb937126c020f` | Substrate-to-EVM POT bridging via `Revive.call` |
| **EVM Tx Hash (Status: 1)** | `0x232b67eefe40a55f539987951a91aecd8b24ed15572d19d9b503b9634743d646` | Mined in Block `#141000` (EVM live execution proof) |
| **SlashGuard Contract (Lease)** | `0x7968D8167a19f6e56e5052db6079b2FB55F0B434` | Tx: `0x1ada1332d97d3afb5dfc5dfd8c562a388ff9053d1a6568bcf456c1238295bdd9` |

---

## 2. Smart Contract Architecture

### A. `SlashGuardLeaseRegistry.sol`
* **Source**: [`contracts/SlashGuardLeaseRegistry.sol`](./contracts/SlashGuardLeaseRegistry.sol)
* **ABI Artifact**: [`contracts/build/SlashGuardLeaseRegistry.abi.json`](./contracts/build/SlashGuardLeaseRegistry.abi.json)
* **EVM Bytecode (Paris)**: 2034 bytes (`contracts/build/SlashGuardLeaseRegistry.bin`)
* **Role**: On-Chain Decentralized Lease Arbiter enforcing monotonic fencing epochs to eliminate Split-Brain dual-signing between Primary and Standby validator nodes.

### B. `DotNexusStakingVault.sol`
* **Source**: [`contracts/DotNexusStakingVault.sol`](./contracts/DotNexusStakingVault.sol)
* **ABI Artifact**: [`contracts/build/DotNexusStakingVault.abi.json`](./contracts/build/DotNexusStakingVault.abi.json)
* **EVM Bytecode (Paris)**: 3825 bytes (`contracts/build/DotNexusStakingVault.bin`)
* **Role**: Non-Custodial NPoS Staking & SLA Insurance Vault. Allows MetaMask users to deposit POT and delegate nomination management to DotNexus PAO-Phragmén optimizer without transferring private keys.

---

## 3. Storage Deposit & Token Claim Guide

On Portaldot V3 Testnet (`pallet-revive`), permanent on-chain contract code storage charges `DepositPerByte = 0.06 POT/byte` (`6 * 10^12` Planck/byte):
* `SlashGuardLeaseRegistry` (2034 bytes) $\rightarrow$ Requires ~`147 POT` Storage Deposit.
* `DotNexusStakingVault` (3825 bytes) $\rightarrow$ Requires ~`254 POT` Storage Deposit.

### How to Claim Participant Testnet Tokens (`tPOT`):
According to the official announcement by Portaldot Foundation:
1. Open a **Support Ticket** in Discord: [https://discord.gg/portaldot](https://discord.gg/portaldot)
2. Submit your Hackathon registration screenshot.
3. Provide your native POT Substrate wallet address:
   ```text
   5GXBDoveYazDtNXTTsNSnHToacTyAYtbikRahKoPudpkV9r9
   ```
4. Once received (typically 500 – 1,000 tPOT), run the automated deploy script:
   ```bash
   python scripts/deploy_contracts.py
   ```
