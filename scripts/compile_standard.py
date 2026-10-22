import subprocess
import json
import os

def compile_contracts():
    sources = {}
    for name in ["SlashGuardLeaseRegistry", "DotNexusStakingVault"]:
        path = f"contracts/{name}.sol"
        with open(path, "r", encoding="utf-8") as f:
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

    print("[*] Invoking solc via npx standard-json...")
    cmd = ["npx.cmd", "--yes", "solc", "--standard-json"]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    stdout, stderr = proc.communicate(input=json.dumps(standard_input))

    if proc.returncode != 0 and not stdout:
        print(f"Error invoking solc: {stderr}")
        return

    json_start = stdout.find('{')
    if json_start == -1:
        print(f"No JSON found in stdout: {stdout}\nStderr: {stderr}")
        return
    result = json.loads(stdout[json_start:])
    if "errors" in result:
        has_error = False
        for err in result["errors"]:
            if err.get("severity") == "error":
                print(f"[ERROR] {err.get('formattedMessage')}")
                has_error = True
            else:
                print(f"[WARN] {err.get('formattedMessage')}")
        if has_error:
            raise RuntimeError("Solc compilation failed.")

    os.makedirs("contracts/build", exist_ok=True)
    contracts = result.get("contracts", {})
    for file_key, contract_map in contracts.items():
        for contract_name, contract_data in contract_map.items():
            abi = contract_data.get("abi", [])
            bytecode = contract_data.get("evm", {}).get("bytecode", {}).get("object", "")
            deployed_bytecode = contract_data.get("evm", {}).get("deployedBytecode", {}).get("object", "")

            print(f"[+] {contract_name}:")
            print(f"    Creation Bytecode Length: {len(bytecode)//2} bytes")
            print(f"    Runtime Bytecode Length:  {len(deployed_bytecode)//2} bytes")

            with open(f"contracts/build/{contract_name}.abi.json", "w", encoding="utf-8") as f:
                json.dump(abi, f, indent=2)
            with open(f"contracts/build/{contract_name}.bin", "w", encoding="utf-8") as f:
                f.write(bytecode)
            with open(f"contracts/build/{contract_name}.runtime.bin", "w", encoding="utf-8") as f:
                f.write(deployed_bytecode)

    print("[OK] Compilation and extraction complete!")

if __name__ == "__main__":
    compile_contracts()
