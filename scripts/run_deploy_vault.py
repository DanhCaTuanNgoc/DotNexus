import json
import subprocess
from eth_account import Account
from web3 import Web3

EVM_URL = "https://test-evm-rpc-v3.portaldot.dev"
CHAIN_ID = 420420777
w3 = Web3(Web3.HTTPProvider(EVM_URL))

deployer_key = "5335067f987007c347e2d714c3689080bb99ca1e2f221c08fe427afcbec91f7c"
deployer = Account.from_key(deployer_key)
bal = w3.eth.get_balance(deployer.address)
bal_pot = float(w3.from_wei(bal, "ether"))
print(f"Deployer: {deployer.address}")
print(f"Deployer Balance: {bal_pot:.4f} POT")

with open("contracts/DotNexusStakingVault.sol", "r", encoding="utf-8") as f:
    src = f.read()

# Compile with solc
std_in = {
    "language": "Solidity",
    "sources": {"DotNexusStakingVault.sol": {"content": src}},
    "settings": {
        "optimizer": {"enabled": True, "runs": 200},
        "evmVersion": "paris",
        "outputSelection": {"*": {"*": ["abi", "evm.bytecode.object"]}}
    }
}
proc = subprocess.Popen(["npx.cmd", "--yes", "solc", "--standard-json"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
out, _ = proc.communicate(input=json.dumps(std_in))
res = json.loads(out[out.find('{'):])
abi = res["contracts"]["DotNexusStakingVault.sol"]["DotNexusStakingVault"]["abi"]
bytecode = res["contracts"]["DotNexusStakingVault.sol"]["DotNexusStakingVault"]["evm"]["bytecode"]["object"]

print(f"Bytecode length: {len(bytecode)//2} bytes")
contract = w3.eth.contract(abi=abi, bytecode=bytecode)
nonce = w3.eth.get_transaction_count(deployer.address)
gas_price = w3.eth.gas_price

tx = contract.constructor(deployer.address).build_transaction({
    "from": deployer.address,
    "nonce": nonce,
    "gasPrice": gas_price,
    "chainId": CHAIN_ID
})

est_gas = w3.eth.estimate_gas(tx)
print(f"Estimated Gas: {est_gas}")
tx["gas"] = est_gas
cost = tx["gas"] * gas_price
print(f"Max Cost: {cost} wei ({w3.from_wei(cost, 'ether')} POT)")

print("Signing and sending raw transaction...")
signed = w3.eth.account.sign_transaction(tx, private_key=deployer_key)
tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
tx_hash_hex = tx_hash.hex()
print(f"Submitted! Tx Hash: {tx_hash_hex}")
print("Waiting for transaction receipt...")

receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
print(f"Receipt Status: {receipt.status}")
print(f"Contract Address: {receipt.contractAddress}")
print(f"Block Number: {receipt.blockNumber}")
print(f"Gas Used: {receipt.gasUsed}")

# Update deployments.json
with open("contracts/deployments.json", "r", encoding="utf-8") as f:
    records = json.load(f)

records["deployments"].append({
    "name": "DotNexusStakingVault",
    "contract_address": receipt.contractAddress,
    "tx_hash": tx_hash_hex,
    "block_number": receipt.blockNumber,
    "status": receipt.status,
    "gas_used": receipt.gasUsed
})

with open("contracts/deployments.json", "w", encoding="utf-8") as f:
    json.dump(records, f, indent=2)

print("[OK] DotNexusStakingVault deployed and recorded successfully!")
