"""
Utility script to bridge POT from any Substrate account to the EVM Deployer address
via Portaldot V3 pallet-revive call dispatchable.
"""

import os
import sys
import argparse
from substrateinterface import SubstrateInterface, Keypair
from web3 import Web3

DEFAULT_WS_URL = os.getenv("PORTALDOT_WS_URL", "wss://test-node-v3.portaldot.dev")
DEFAULT_EVM_URL = os.getenv("PORTALDOT_EVM_URL", "https://test-evm-rpc-v3.portaldot.dev")
DEFAULT_EVM_DEST = "0xC5216e73898089269fdd377a1D4bD626b114E166"


def main():
    parser = argparse.ArgumentParser(description="Bridge POT from Substrate to EVM account")
    parser.add_argument("--seed", default=os.getenv("PORTALDOT_SEED", "//Alice"), help="Substrate account URI or mnemonic")
    parser.add_argument("--dest", default=DEFAULT_EVM_DEST, help="Destination EVM address (0x...)")
    parser.add_argument("--amount", type=float, default=1.0, help="Amount in POT to bridge (e.g. 50.0)")
    parser.add_argument("--ws", default=DEFAULT_WS_URL, help="Substrate WS RPC URL")
    parser.add_argument("--evm", default=DEFAULT_EVM_URL, help="EVM JSON-RPC URL")

    args = parser.parse_args()

    print(f"Connecting to Substrate: {args.ws} ...")
    sub = SubstrateInterface(url=args.ws, ss58_format=42)
    kp = Keypair.create_from_uri(args.seed, ss58_format=42)
    print(f"Signer Substrate SS58: {kp.ss58_address}")

    acc = sub.query("System", "Account", [kp.ss58_address])
    free_units = acc.value["data"]["free"] if acc else 0
    print(f"Signer Free Balance: {free_units} units ({free_units / 10**14:.4f} POT)")

    dest_checksum = Web3.to_checksum_address(args.dest)
    units_to_transfer = int(args.amount * 10**14)
    if free_units < units_to_transfer:
        print(f"[!] Insufficient balance: requested {args.amount} POT, but only {free_units / 10**14:.4f} POT available.")
        sys.exit(1)

    print(f"Bridging {args.amount} POT ({units_to_transfer} units) to EVM: {dest_checksum} ...")

    call = sub.compose_call(
        call_module="Revive",
        call_function="call",
        call_params={
            "dest": dest_checksum,
            "value": units_to_transfer,
            "weight_limit": {"ref_time": 10_000_000_000, "proof_size": 500_000},
            "storage_deposit_limit": 10_000_000_000_000,
            "data": "0x"
        }
    )

    extrinsic = sub.create_signed_extrinsic(call=call, keypair=kp)
    receipt = sub.submit_extrinsic(extrinsic, wait_for_inclusion=True)

    print(f"Extrinsic Inclusion: {receipt.is_success}")
    print(f"Extrinsic Hash: {receipt.extrinsic_hash}")

    w3 = Web3(Web3.HTTPProvider(args.evm))
    bal = w3.eth.get_balance(dest_checksum)
    print(f"New EVM Balance on {dest_checksum}: {bal} wei ({w3.from_wei(bal, 'ether')} POT)")


if __name__ == "__main__":
    main()
