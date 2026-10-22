"""
DotNexus Smart Contract Deployment Script for Portaldot Network V3.0
Deploys SlashGuardLeaseRegistry.sol and DotNexusStakingVault.sol
Network: Portaldot V3 Testnet (EVM RPC: https://test-evm-rpc-v3.portaldot.dev, Chain ID: 420420777)
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from eth_account import Account
from web3 import Web3

EVM_RPC_URL = os.getenv("PORTALDOT_EVM_URL", "https://test-evm-rpc-v3.portaldot.dev")
CHAIN_ID = int(os.getenv("PORTALDOT_CHAIN_ID", 420420777))
ROOT_DIR = Path(__file__).resolve().parent.parent

# Default deployer key generated for DotNexus Testnet Operations
DEFAULT_DEPLOYER_KEY = "5335067f987007c347e2d714c3689080bb99ca1e2f221c08fe427afcbec91f7c"
DEPLOYER_KEY = os.getenv("DEPLOYER_PRIVATE_KEY", DEFAULT_DEPLOYER_KEY)

# Portaldot Testnet Revive Deposit Parameters
DEPOSIT_PER_BYTE_POT = 0.06 # 6 * 10^12 Planck per byte on Portaldot V3 Testnet


def compile_solidity_contracts():
    """Compiles contracts with solc using evmVersion: paris to avoid PUSH0 incompatibility on pallet-revive"""
    print("[1] Compiling Solidity smart contracts with solc (evmVersion: paris)...")
    sources = {}
    contract_files = ["SlashGuardLeaseRegistry", "DotNexusStakingVault"]

    for name in contract_files:
        src_path = ROOT_DIR / "contracts" / f"{name}.sol"
        if not src_path.exists():
            raise FileNotFoundError(f"Contract file not found: {src_path}")
        with open(src_path, "r", encoding="utf-8") as f:
            sources[f"{name}.sol"] = {"content": f.read()}

    standard_input = {
        "language": "Solidity",
        "sources": sources,
        "settings": {
            "optimizer": {"enabled": True, "runs": 200},
            "evmVersion": "paris",
            "outputSelection": {
                "*": {
                    "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"]
                }
            }
        }
    }

    cmd = ["npx.cmd" if sys.platform == "win32" else "npx", "--yes", "solc", "--standard-json"]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    stdout, stderr = proc.communicate(input=json.dumps(standard_input))

    json_start = stdout.find("{")
    if json_start == -1:
        raise RuntimeError(f"Solc failed to output JSON: {stderr}")

    result = json.loads(stdout[json_start:])
    if "errors" in result:
        for err in result["errors"]:
            if err.get("severity") == "error":
                raise RuntimeError(f"Solc compilation error: {err.get('formattedMessage')}")

    build_dir = ROOT_DIR / "contracts" / "build"
    build_dir.mkdir(parents=True, exist_ok=True)

    compiled = {}
    for file_key, contract_map in result.get("contracts", {}).items():
        for contract_name, contract_data in contract_map.items():
            abi = contract_data.get("abi", [])
            bytecode = contract_data.get("evm", {}).get("bytecode", {}).get("object", "")
            deployed_bytecode = contract_data.get("evm", {}).get("deployedBytecode", {}).get("object", "")

            with open(build_dir / f"{contract_name}.abi.json", "w", encoding="utf-8") as f:
                json.dump(abi, f, indent=2)
            with open(build_dir / f"{contract_name}.bin", "w", encoding="utf-8") as f:
                f.write(bytecode)
            with open(build_dir / f"{contract_name}.runtime.bin", "w", encoding="utf-8") as f:
                f.write(deployed_bytecode)

            compiled[contract_name] = {
                "abi": abi,
                "bytecode": bytecode,
                "deployed_bytecode": deployed_bytecode,
                "size_bytes": len(bytecode) // 2
            }
            print(f"    Compiled {contract_name}: {len(bytecode)//2} bytes (Runtime: {len(deployed_bytecode)//2} bytes)")

    print("    Compilation successful!\n")
    return compiled


def deploy_contract(w3: Web3, account: Account, name: str, compiled_data: dict, constructor_args: list = None):
    """Deploys a single contract and returns receipt, contract address and tx hash"""
    abi = compiled_data["abi"]
    bytecode = compiled_data["bytecode"]
    size_bytes = compiled_data["size_bytes"]
    approx_deposit_pot = size_bytes * DEPOSIT_PER_BYTE_POT + 25.0

    print(f"[*] Deploying {name} ({size_bytes} bytes, estimated storage deposit: ~{approx_deposit_pot:.1f} POT)...")

    contract = w3.eth.contract(abi=abi, bytecode=bytecode)
    nonce = w3.eth.get_transaction_count(account.address)
    gas_price = w3.eth.gas_price

    if constructor_args:
        construct_txn = contract.constructor(*constructor_args)
    else:
        construct_txn = contract.constructor()

    # Determine safe gas limit
    gas_limit = 25_000_000_000_000 # 25T gas limit for Portaldot revive
    tx = construct_txn.build_transaction({
        "from": account.address,
        "nonce": nonce,
        "gas": gas_limit,
        "gasPrice": gas_price,
        "chainId": CHAIN_ID
    })

    print(f"    Sending raw transaction (Nonce: {nonce}, GasPrice: {gas_price})...")
    signed = w3.eth.account.sign_transaction(tx, private_key=account.key.hex())
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    tx_hash_hex = tx_hash.hex()
    print(f"    Transaction submitted! Hash: {tx_hash_hex}")
    print("    Waiting for block confirmation...")

    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
    print(f"    Mined in Block: #{receipt.blockNumber}, Status: {receipt.status}")
    print(f"    Contract Address: {receipt.contractAddress}")
    print(f"    Gas Used: {receipt.gasUsed}\n")

    return {
        "name": name,
        "contract_address": receipt.contractAddress,
        "tx_hash": tx_hash_hex,
        "block_number": receipt.blockNumber,
        "status": receipt.status,
        "gas_used": receipt.gasUsed
    }


def main():
    w3 = Web3(Web3.HTTPProvider(EVM_RPC_URL))
    if not w3.is_connected():
        print(f"[!] Unable to connect to Portaldot EVM RPC: {EVM_RPC_URL}")
        sys.exit(1)

    print(f"============================================================")
    print(f"  DotNexus Smart Contract Deployment — Portaldot V3.0")
    print(f"============================================================")
    print(f"EVM RPC Endpoint : {EVM_RPC_URL}")
    print(f"Chain ID         : {w3.eth.chain_id}")
    print(f"Current Block    : #{w3.eth.block_number}")

    deployer = Account.from_key(DEPLOYER_KEY)
    bal = w3.eth.get_balance(deployer.address)
    bal_pot = float(w3.from_wei(bal, "ether"))
    print(f"Deployer Address : {deployer.address}")
    print(f"Deployer Balance : {bal} wei ({bal_pot:.4f} POT)")
    print(f"============================================================\n")

    compiled_contracts = compile_solidity_contracts()

    # Pre-flight check on balance
    slash_size = compiled_contracts["SlashGuardLeaseRegistry"]["size_bytes"]
    vault_size = compiled_contracts["DotNexusStakingVault"]["size_bytes"]
    est_total_deposit = (slash_size + vault_size) * DEPOSIT_PER_BYTE_POT + 50.0

    print(f"[Pre-flight Check]")
    print(f"  Total Contract Size : {slash_size + vault_size} bytes")
    print(f"  Estimated Min POT   : ~{est_total_deposit:.1f} POT")
    print(f"  Current Balance     : {bal_pot:.4f} POT")

    if bal_pot < est_total_deposit:
        print(f"\n[WARNING] Deployer balance ({bal_pot:.4f} POT) is less than estimated deposit (~{est_total_deposit:.1f} POT).")
        print(f"Portaldot V3 Testnet charges {DEPOSIT_PER_BYTE_POT} POT/byte storage deposit.")
        print(f"If your transaction reverts with Status 0, please claim testnet tPOT from Discord")
        print(f"using Substrate address: 5GXBDoveYazDtNXTTsNSnHToacTyAYtbikRahKoPudpkV9r9")
        print(f"or run scripts/bridge_pot_to_evm.py with a funded Substrate account.\n")

    results = []

    # 1. Deploy SlashGuardLeaseRegistry
    try:
        res1 = deploy_contract(w3, deployer, "SlashGuardLeaseRegistry", compiled_contracts["SlashGuardLeaseRegistry"])
        results.append(res1)
    except Exception as e:
        print(f"[!] Error deploying SlashGuardLeaseRegistry: {e}")

    # 2. Deploy DotNexusStakingVault (passing deployer as initial NPoS operator)
    try:
        res2 = deploy_contract(
            w3,
            deployer,
            "DotNexusStakingVault",
            compiled_contracts["DotNexusStakingVault"],
            constructor_args=[deployer.address]
        )
        results.append(res2)
    except Exception as e:
        print(f"[!] Error deploying DotNexusStakingVault: {e}")

    # Save deployment metadata
    deployment_record = {
        "network": "Portaldot Network V3.0 Testnet",
        "chain_id": CHAIN_ID,
        "evm_rpc": EVM_RPC_URL,
        "deployer_address": deployer.address,
        "deployments": results
    }

    out_file = ROOT_DIR / "contracts" / "deployments.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(deployment_record, f, indent=2)
    print(f"[OK] Deployment metadata saved to: {out_file}")


if __name__ == "__main__":
    main()
