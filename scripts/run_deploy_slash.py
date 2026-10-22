import json
from eth_account import Account
from web3 import Web3

EVM_URL = "https://test-evm-rpc-v3.portaldot.dev"
CHAIN_ID = 420420777
w3 = Web3(Web3.HTTPProvider(EVM_URL))

deployer_key = "5335067f987007c347e2d714c3689080bb99ca1e2f221c08fe427afcbec91f7c"
deployer = Account.from_key(deployer_key)
bal = w3.eth.get_balance(deployer.address)
print(f"Deployer: {deployer.address}")
print(f"Deployer Balance: {bal} wei ({w3.from_wei(bal, 'ether')} POT)")

with open("contracts/build/SlashGuardLeaseRegistry.abi.json") as f:
    abi = json.load(f)
with open("contracts/build/SlashGuardLeaseRegistry.bin") as f:
    bytecode = f.read().strip()

contract = w3.eth.contract(abi=abi, bytecode=bytecode)
nonce = w3.eth.get_transaction_count(deployer.address)
gas_price = w3.eth.gas_price

tx = contract.constructor().build_transaction({
    "from": deployer.address,
    "nonce": nonce,
    "gasPrice": gas_price,
    "chainId": CHAIN_ID
})

est_gas = w3.eth.estimate_gas(tx)
print(f"Estimated Gas: {est_gas}")
tx["gas"] = int(est_gas * 1.05)
upfront = tx["gas"] * gas_price
print(f"Upfront max cost: {upfront} wei ({w3.from_wei(upfront, 'ether')} POT)")

print("Signing and sending raw transaction...")
signed = w3.eth.account.sign_transaction(tx, private_key=deployer_key)
tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
print(f"Submitted! Tx Hash: {tx_hash.hex()}")
print("Waiting for transaction receipt...")

receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
print(f"Receipt Status: {receipt.status}")
print(f"Contract Address: {receipt.contractAddress}")
print(f"Block Number: {receipt.blockNumber}")
print(f"Gas Used: {receipt.gasUsed}")

# Verify code on chain
if receipt.contractAddress:
    code = w3.eth.get_code(receipt.contractAddress)
    print(f"Verified on-chain code length: {len(code)} bytes")
