# DotNexus Smart Contracts — Portaldot V3.0 Deployment Guide & Evidence

> **Target Network**: Portaldot Network V3.0 Testnet  
> **Substrate WS Endpoint**: `wss://test-node-v3.portaldot.dev`  
> **EVM JSON-RPC Endpoint**: `https://test-evm-rpc-v3.portaldot.dev`  
> **Chain ID (EVM)**: `420420777`  
> **SS58 Prefix**: `42`  
> **EVM Runtime Layer**: `pallet-revive` (Polkadot SDK Dual-VM execution engine)  

---

## 1. Verified Testnet Deployments (Status: 1 / Success)

| Smart Contract Name | Deployed Contract Address | Transaction Hash | Block | Status | Verified Code |
|---|---|---|:---:|:---:|:---:|
| **`SlashGuardLeaseRegistry`** | [`0xba114d21CC41a30880CcfA53673B743316387355`](file:///D:/Coding/Portaldot%20Hacker%20house%202026/DotNexus/contracts/SlashGuardLeaseRegistry.sol) | `0xe285c61d4829a3f33a32e634242e1a77ba15f7eea28d276c9d72b0482633472f` | `#147264` | **PASS (1)** | 2,003 bytes |
| **`DotNexusStakingVault`** | [`0x97e5707FCa341c27D7e6b5cEC5ABFe2d3498610A`](file:///D:/Coding/Portaldot%20Hacker%20house%202026/DotNexus/contracts/DotNexusStakingVault.sol) | `0x3263d911ca24b4f1ff413020d6454fce1c7cc995dc81d114d8d91ac8c061b8cb` | `#147358` | **PASS (1)** | 3,131 bytes |

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
