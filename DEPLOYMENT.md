# DotNexus Smart Contracts — Portaldot V3.0 Deployment Guide & Evidence

> **Target Network**: Portaldot Network V3.0 Testnet  
> **Substrate WS Endpoint**: `wss://test-node-v3.portaldot.dev`  
> **EVM JSON-RPC Endpoint**: `https://test-evm-rpc-v3.portaldot.dev`  
> **Chain ID (EVM)**: `420420777`  
> **SS58 Prefix**: `42`  
> **EVM Runtime Layer**: `pallet-revive` (Polkadot SDK Dual-VM execution engine)  
> **Live Web3 App**: [https://dotnexus-hackerhouse.vercel.app/](https://dotnexus-hackerhouse.vercel.app/)  

---

## 1. Verified Testnet Deployments (Status: 1 / Success)

| Smart Contract Name | Deployed Contract Address | EVM Transaction Hash | Substrate Block | Substrate Explorer Link | Status |
|---|---|---|:---:|:---:|:---:|
| **`SlashGuardLeaseRegistry`** | [`0xba114d21CC41a30880CcfA53673B743316387355`](file:///D:/Coding/Portaldot%20Hacker%20house%202026/DotNexus/contracts/SlashGuardLeaseRegistry.sol) | `0xe285c61d4829a3f33a32e634242e1a77ba15f7eea28d276c9d72b0482633472f` | `#147264` | [View Block 147264](https://node-console.portaldot.dev/#/explorer/query/147264) | **PASS (Status: 1)** |
| **`DotNexusStakingVault`** | [`0x97e5707FCa341c27D7e6b5cEC5ABFe2d3498610A`](file:///D:/Coding/Portaldot%20Hacker%20house%202026/DotNexus/contracts/DotNexusStakingVault.sol) | `0x3263d911ca24b4f1ff413020d6454fce1c7cc995dc81d114d8d91ac8c061b8cb` | `#147358` | [View Block 147358](https://node-console.portaldot.dev/#/explorer/query/147358) | **PASS (Status: 1)** |

> [!NOTE] Dual-VM Explorer Query Guide
> - `https://node-console.portaldot.dev` is the **Substrate Native Polkadot-JS Apps** portal. Its explorer search bar (`#/explorer/query/...`) parses input as a **Substrate Block Number**, **Substrate Block Hash (Blake2b)**, or native extrinsic hash.
> - The hash `0x3263d911ca24b4f1ff413020d6454fce1c7cc995dc81d114d8d91ac8c061b8cb` is an **EVM Keccak-256 Transaction Hash** emitted by `pallet-revive`. Querying an EVM tx hash directly in the Substrate block search bar causes Substrate RPC to return `Unable to retrieve header and parent from supplied hash` because it expects a Substrate block hash.
> - To view the transaction on the Portaldot Node Console, query by **Block Number** (`147358`) or **Substrate Block Hash** (`0x1c7d3066e78a208ae74c341f750aa6dd1446388a2f15b1554ae6f183e958c213`), where you will find extrinsic `147358-1` (`revive.ethTransact`).
> - To query by EVM Tx Hash, query directly against the EVM JSON-RPC endpoint `https://test-evm-rpc-v3.portaldot.dev` via Web3 / JSON-RPC.

---

## 2. On-Chain Account Details & Roles

| Parameter | Value | Notes |
|---|---|---|
| **Deployer & Owner EVM Address** | `0xC5216e73898089269fdd377a1D4bD626b114E166` | EVM Address for DotNexus Operations |
| **Deployer Substrate SS58** | `5GXBDoveYazDtNXTTsNSnHToacTyAYtbikRahKoPudpkV9r9` | Dual-VM AutoMapped Native Address |
| **Contract #1 Role** | On-Chain Anti-Equivocation Lease Arbiter | Strictly monotonic fencing epochs to eliminate split-brain double signing |
| **Contract #2 Role** | Non-Custodial NPoS Delegation & SLA Vault | Non-custodial staking with slashable validator SLA bonds against rug-pulls |

---

## 3. On-Chain State Verification

Both contracts have been deployed with EVM bytecode targeting `evmVersion: "paris"` to guarantee complete compatibility with `pallet-revive`.

### A. Query `SlashGuardLeaseRegistry`:
```bash
python -c "
import json
from web3 import Web3
w3 = Web3(Web3.HTTPProvider('https://test-evm-rpc-v3.portaldot.dev'))
with open('contracts/build/SlashGuardLeaseRegistry.abi.json') as f: abi = json.load(f)
c = w3.eth.contract(address='0xba114d21CC41a30880CcfA53673B743316387355', abi=abi)
print('Lease Status:', c.functions.getLease('0xC5216e73898089269fdd377a1D4bD626b114E166').call())
"
```

### B. Query `DotNexusStakingVault`:
```bash
python -c "
import json
from web3 import Web3
w3 = Web3(Web3.HTTPProvider('https://test-evm-rpc-v3.portaldot.dev'))
with open('contracts/build/DotNexusStakingVault.abi.json') as f: abi = json.load(f)
c = w3.eth.contract(address='0x97e5707FCa341c27D7e6b5cEC5ABFe2d3498610A', abi=abi)
print('Owner:', c.functions.owner().call())
print('Operator:', c.functions.nposOptimizerOperator().call())
print('Total Staked:', c.functions.totalVaultStaked().call())
"
```
