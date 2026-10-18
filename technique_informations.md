Portaldot V3.0 Developer Guide Work in Progress
For anyone who wants to start building on Portaldot but still doesn’t know where to begin, I’m creating a step-by-step developer guide from scratch.
The idea is to make it beginner-friendly and practical, starting with the basics and then gradually adding more advanced topics over time.

I’ll be covering things like:

• Development environment setup
• Testnet configuration
• RPC / Chain ID
• Wallet connection
• WASM and EVM development
• Solidity / smart contract deployment
• ERC-20 / ERC-721 examples
• Frontend integration
• Common errors and troubleshooting
• Useful tools, templates and resources 
 
I’ll keep updating the guide as new information, examples and fixes become available.
So if you’re starting from zero, or if you get stuck somewhere while building, feel free to ask here ⁠🚀｜hack-chat 
If I see the same question or problem coming up more than once, I’ll add it directly to the guide so it can help the next developer too.
The goal is simple: make it easier for anyone to go from “I don’t know where to start” to actually deploying something on Portaldot V3.0. 
First version coming soon. 


hello !! From the V3.0 information currently available, I haven’t seen an official confirmation yet about whether the network will keep the same BABE + GRANDPA setup.
Just to clarify the roles: BABE handles block production, while GRANDPA provides finality.
I don’t want to give you an assumption as an official answer, so I’ll confirm this with the core/dev team and share the exact V3.0 consensus/finality architecture here once confirmed. 
I’ll also add this to the V3.0 developer guide I’m preparing, because this is definitely something builders and node operators need documented clearly.


A few quick questions:

Where will the V3 code be published, and is there a V3 testnet RPC + EVM chain ID yet?
Is the V3 EVM built on Frontier (pallet-evm) or pallet-revive?
Will V3 keep BABE + GRANDPA for finality?
Will the V3 testnet RPC expose grandpa_proveFinality and grandpa_subscribeJustifications (like mainnet does now)?
About how many GRANDPA validators will the testnet have, and how often does the authority set change?
Is there an official bridge or cross-chain module on the roadmap? I want to make sure I build something that helps, not duplicates.
For a bridge demo, is it OK if the other side is an Ethereum testnet (e.g. Sepolia)?


These are great questions especially if you're planning to work on cross-chain infrastructure. Let me separate what I can already confirm from what still needs confirmation from the V3 core/dev team.
V3 source code / Testnet RPC / EVM Chain ID
The existing Portaldot codebase is public, but I don't have confirmation yet whether the V3 source will be released in the same repository/branch or in a separate V3 repository.
The V3 materials confirm that projects will deploy to the Portaldot V3 testnet, but I still don't have an officially published V3 RPC endpoint + EVM Chain ID that I can safely give you. I don't want to send an old/mainnet value and cause configuration problems.
Frontier (pallet-evm) or pallet-revive?
What is officially confirmed is that V3 supports both WASM and EVM contract execution and ERC-20 / ERC-721 compatibility. 
However, the material I currently have does not specify whether the EVM implementation underneath is Frontier / pallet-evm, pallet-revive, or another implementation. I'm adding that to the questions for the core team.
BABE + GRANDPA
I don't have an official V3 confirmation for this yet either.
The existing Portaldot architecture is Substrate-based and the project describes its validator/consensus model as LAO NPoS, but the V3 documentation I've received doesn't explicitly state whether the underlying block-production/finality stack will continue to use BABE + GRANDPA.
So I don't want to answer “yes” based only on the previous network architecture.
grandpa_proveFinality / grandpa_subscribeJustifications
Same situation here: I haven't found these RPC methods explicitly documented for the V3 testnet RPC yet.
If GRANDPA remains the finality mechanism, exposing the justification/finality RPCs would obviously be very relevant for bridge/light-client development, but I want the dev team to confirm the actual V3 RPC surface first.
GRANDPA validator count / authority-set rotation
I don't have an official V3 number or authority-set rotation interval yet. I'll ask specifically for:
• expected testnet authority/validator count
• session duration
• authority-set change frequency
• whether the testnet topology will remain relatively fixed during Hacker House
Those details matter a lot if you're building verification around finality proofs.
Official bridge / cross-chain roadmap
Cross-chain infrastructure is definitely part of Portaldot's direction. The V3 Hacker House itself includes a dedicated Multi-Chain & Cross-Chain Infrastructure track, specifically mentioning asset/data bridges and liquidity infrastructure.
Portaldot materials also already reference iBridge / cross-chain infrastructure, so before building a generic bridge I think it's smart that you're checking for overlap.
I still need to confirm what the V3-native bridge/module roadmap and public interfaces will look like, though. That will tell us whether the most useful contribution is a bridge itself, a light client, relayer infrastructure, verification layer, SDK, monitoring tool, etc.
Ethereum testnet such as Sepolia
From the Hacker House rules I have, projects must make real use of Portaldot V3 and deploy/integrate with the Portaldot testnet, and cross-chain projects are explicitly welcomed. 
I haven't seen any rule saying the second chain cannot be an Ethereum testnet such as Sepolia, so conceptually that architecture fits the cross-chain track. But because this affects your core architecture, I'd like to get an explicit confirmation from the team before telling you “yes, definitely.”
I'm compiling all of these technical gaps for the V3 developer guide I'm building, so once I receive the confirmed RPC, Chain ID, EVM implementation, consensus/finality details and cross-chain interfaces, I'll put them together in one place instead of everyone having to hunt for the information.
These are exactly the kind of questions I want builders to keep sending here.

===================================================================


Where does a submission have to be deployed? The rules say "Portaldot testnet," and there is no public testnet address yet. Will you publish a hosted testnet WebSocket, or is a local portaldot_dev --dev node the accepted deployment, the way it was in May?

Which contract runtime will that node run during 14 October – 6 November? The current public node is the older contracts pallet. Mainnet 3.0 has been described as ink! plus Solidity through Revive. Which one is the hackathon node, and will both be available before the code freeze on 6 November?

If the 3.0 node is not public by the 24 October check-in, is a deployment on the current node accepted? The score asks for a contract address and a transaction hash. Teams need to know whether waiting for 3.0 is required.

How do we get POT for gas, and is there a block explorer? The check-in asks for an explorer link when one exists. The docs do not list a faucet or an explorer.

Does the hackathon node support a dry-run of a contract call, and how is storage charged? Seam has to show the cost before the real transaction. On the current node that cost is storage rent. A newer node may use a storage deposit instead. We need the real rule so the number on screen is the number the node charges.

Does a contract call from a second application, through our SDK, satisfy the Modular Cloud track? Seam is an execution layer other apps call. We want to confirm that this is the track it should enter.



These are very good questions, and I agree that we need these details clarified before teams make architecture decisions. Let me separate what the current Hacker House material already confirms from what I’m escalating to the core/dev team.
Hosted V3 testnet vs local portaldot_dev --dev
The current Hacker House rules specifically say projects must use Portaldot Network V3.0 and complete deployment on the Portaldot testnet. For the check-in, the requested deployment evidence is a contract address + transaction hash, with an explorer link only if one is available.
What the rules do not currently specify is whether that testnet will be a hosted public WebSocket endpoint or whether a local V3 node will also count.
In the previous hackathon, local deployment using portaldot_dev --dev was accepted for proof-of-concept work, and several projects used ws://127.0.0.1:9944.
But I don’t want to assume the same rule automatically applies to this V3 Hacker House. I’m asking the team to confirm:
• official hosted V3 WebSocket/RPC
• whether local V3 deployment is accepted
• whether local deployment can be used temporarily if the hosted network is not ready
Contract runtime during Oct 14 – Nov 6
The official V3 material confirms WASM + EVM execution, and the supported development stack explicitly includes Rust / ink! and Solidity. 
However, the material I currently have does not explicitly identify whether the EVM side of the Hacker House node is Revive, Frontier / pallet-evm, or another implementation, nor does it document the exact Contracts pallet/runtime version.
The previous public/dev environment was running an older Contracts API, which caused compatibility issues for newer ink! contracts during the previous hackathon.
So I’m specifically asking the dev team which runtime will be authoritative for this event and whether both the WASM and Solidity paths will be available before the Nov 6 code freeze.
If V3 is not public by the Oct 24 check-in
This is one of the most important points to clarify.
The official schedule puts the check-in deadline on Oct 24, while the final code freeze is Nov 6.
The rules currently ask for Portaldot testnet deployment information at check-in, but they do not state what fallback applies if the V3 testnet itself is not publicly available by then.
So I will ask for an explicit ruling on whether teams may:
• deploy temporarily to the current node,
• deploy to a local V3 node, or
• wait for the official V3 testnet without being penalized at check-in.
I agree that builders should not have to guess this.
POT for gas + explorer
The Hacker House rules require deployment evidence, but the current event guide does not list a V3 faucet or V3 explorer URL.
Also, because the explorer field is written as “Explorer link, if available,” it appears the explorer itself is not mandatory if one has not been provided. The contract address and transaction hash are the important evidence.
Historically we have had a public dev node and a DRIP faucet for developer testing, but I don’t want to tell teams to use those for V3 until the team confirms they are connected to the Hacker House network. The previous infrastructure was built around the older development environment.
I’m asking for the official V3:
• POT faucet
• RPC/WebSocket endpoint
• explorer
• network/chain configuration
Dry-run + storage charging
I don’t currently have an official V3 answer for this.
The older Portaldot contracts environment used the previous Contracts pallet behavior, and we already know runtime compatibility differed from newer contract tooling. For V3, we need the actual node behavior rather than assuming the old storage model.
For Seam, I understand why this is critical: if the SDK previews execution cost before signing, the dry-run result and storage model must match what the real node will charge.
I’m therefore asking the team to confirm:
• whether contract-call dry-run is exposed
• which RPC/API should be used for it
• whether storage uses rent, storage deposit, or another model
• how storage-related charges should be calculated/displayed
• whether the same behavior applies to both WASM and EVM contracts
Until that is confirmed, I would keep that part of Seam behind an adapter/config layer rather than hardcoding the old storage-rent behavior.
Seam and the Modular Cloud & Middleware track
This one matches the track description very closely.
The official definition of Modular Cloud & Middleware is:
“Build decentralized middleware, storage/data components, and APIs based on Portaldot's modular architecture.”
If Seam is an execution layer / SDK that other applications integrate with and call, rather than simply being a standalone end-user dApp, then based on that definition it fits Modular Cloud & Middleware very naturally.
I’ll still confirm the track assignment with the organizers so you have an official answer before submission, but from the published track description, that is the category I would associate Seam with.
I’m collecting all of these questions for the V3 developer guide as well. These are exactly the details that should be documented once, clearly, instead of every team having to reverse-engineer the environment.
I’ll send the core/dev team this exact list so we can get authoritative answers on the V3 node, runtime, faucet, explorer, dry-run and storage model.


======================================================================

Can a Solidity contract call a WASM (ink!) contract, and can a WASM contract call a Solidity one? If yes, how does that work — is there a special address or extension I use?
Any rough idea when the testnet RPC and Chain ID will be posted? And is there a guide for running a Portaldot node locally in the meantime, so I can start building now?
How do I get test tokens — is there a faucet?
Do normal EVM tools work fine here — Foundry, Hardhat, MetaMask?
Is there a block explorer for the testnet where I can show my deployed contracts?

ai given me this 5 question to ask before the build plan


Here’s what we know so far:
Solidity ↔ WASM: V3 supports both EVM and WASM contracts, but the exact cross-contract calling method/address mapping still needs confirmation from the core team.
RPC + Chain ID: Not published yet. In the meantime, you can start locally with:
./portaldot_dev --dev --tmp
and connect to ws://127.0.0.1:9944.
Faucet: There is a faucet for the current dev environment, but we still need confirmation whether V3 will use the same faucet or a new one.
Foundry / Hardhat / MetaMask: V3 is EVM-compatible, so these tools are expected to work, but I’m waiting for confirmation of the final V3 Ethereum RPC setup.
Explorer: No official V3 testnet explorer has been published yet. The Hacker House rules say explorer links are required only if available.
I’m collecting all of this for the V3 developer guide and will update it as soon as the core team confirms the final network details.





LINK API DOC: https://portaldot-dev.readthedocs.io/ (Lưu ý: URL trực tiếp yêu cầu prefix `/en/latest/` như https://portaldot-dev.readthedocs.io/en/latest/ để tránh lỗi 404).

======================================================================

## ĐIỂM CẦN LƯU Ý TỪ OFFICIAL DOCUMENTATION (Portaldot Developer v1)

### 1. Thông số Chain & Token (Chain Info)
- **SS58 Format**: `42` (Định dạng địa chỉ Substrate generic chuẩn, các địa chỉ ví bắt đầu bằng tiền tố `5...`).
- **Token Symbol**: `POT`.
- **Token Decimals**: **`14`** ($1 \text{ POT} = 10^{14}$ base units).
  > **CẢNH BÁO MÂU THUẪN DECIMALS TRONG DOCS:**
  > - Trang `chain-info.html` và `Examples.html` ghi: `10 ** 14`.
  > - Trang `Install.html` lại viết ví dụ transfer với `10 ** 12`.
  > - **Giải pháp:** Tuyệt đối không hardcode decimals, luôn query động từ chain runtime: `portaldot.properties.get('tokenDecimals', 14)`.
- **WebSocket Endpoints**:
  - Mainnet: `wss://mainnet.portaldot.io`
  - Local Dev Node: `ws://127.0.0.1:9944`
- **Explorer chính thức**: `https://www.portaldot.io/` (hỗ trợ chuyển node sang Local Node `ws://127.0.0.1:9944`).

### 2. Node Client & Môi trường chạy Local
- **Node Binaries Repository**: `https://github.com/portaldotVolunteer/Portaldot-node/`
  - Ubuntu / MacOS: `portaldot-testnet-ubuntu.tar.gz`, `portaldot-mainnet-ubuntu.tar.gz`.
  - Windows: Docs chính thức khuyến nghị chạy thông qua **WSL (Windows Subsystem for Linux)**.
- **Lệnh chạy local dev node chuẩn**:
  ```bash
  chmod 755 portaldot_dev
  ./portaldot_dev --dev --alice
  ```
  *(Có sẵn pre-funded dev account `//Alice` và mở RPC tại port 9944)*.

### 3. Smart Contracts & Execution Model
- **Tài liệu hiện tại chỉ viết về ink! (WASM)**:
  - Dùng Substrate `pallet-contracts`.
  - Tương tác qua Python SDK (`ContractCode`, `ContractInstance`).
  - Deploy cần 2 artifacts: metadata `.json` và binary `.wasm` (hoặc `.contract`).
- **Lưu ý Gas Limit & Weight**:
  - Các ví dụ trong docs chứa cả định dạng gas cũ dạng số nguyên (`gas_limit=1000000000000`) và định dạng Weight V2 dict:
    `gas_limit={'ref_time': 25990000000, 'proof_size': 11990383647911208550}`.
  - Phải dry-run qua `contract.read()` để lấy `gas_predit_result.gas_required` trước khi gửi extrinsic `contract.exec()`.

### 4. SDK Client & Thư viện kết nối
- Dùng thư viện chuẩn PyPI: `substrate-interface` (`pip install substrate-interface`).
- Khởi tạo:
  ```python
  from substrateinterface import SubstrateInterface, Keypair
  portaldot = SubstrateInterface(
      url="ws://127.0.0.1:9944",
      ss58_format=42,
      type_registry_preset='default'
  )
  ```
- Tiện ích `SubstrateNodeExtension`: Có thể filter log/event theo block range (`filter_events`, `filter_extrinsics`), nhưng docs cảnh báo quét qua RPC thuần rất chậm và tốn tài nguyên, chỉ nên dùng fallback.

### 5. Pallets có sẵn trên Chain (Runtime Modules)
- **Core / Payment / Utility**: `System`, `Timestamp`, `Balances`, `TransactionPayment`, `Utility`.
- **Contracts**: `Contracts` (ink!).
- **Staking & Consensus**: `Babe`, `Grandpa`, `Staking`, `Session`, `ElectionProviderMultiPhase`.
- **Governance / Treasury**: `Treasury`, `Bounties`, `Vesting`, `Lottery`.
- **Asset / Account**: `Assets`, `Proxy`, `Multisig`, `Identity`, `Indices`.
- **Khác**: `TransactionStorage`, `MMR`, `ImOnline`, `Offences`, `Scheduler`.

### 6. Độ lệch phiên bản quan trọng giữa Docs v1 và Hackathon V3.0
- Docs ReadTheDocs hiện tại là **V1** (tập trung 100% vào Substrate Native + ink! WASM).
- Chưa có tài liệu hướng dẫn EVM Chain ID, RPC JSON-RPC của Ethereum (Frontier/Revive) trên ReadTheDocs.
- Tuy nhiên Hackathon V3.0 yêu cầu/khuyến khích Dual-VM (EVM + WASM). Do đó, các công cụ tooling phải hỗ trợ cả hai, đồng thời thiết kế kiến trúc theo dạng adapter linh hoạt.


10/17/2026 - Update từ Ban tổ chức & Core Dev:
- **Testnet RPC Update & Airdrop tPOT**:
  - Testnet RPC đã được cập nhật lại sau sự cố mất kết nối trước đó.
  - Token testnet (`tPOT`) sẽ được gửi trong tuần này tới các ví **native POT** (SS58: 42, địa chỉ bắt đầu bằng `5...`) đã đăng ký trên DoraHacks.
- **Xác nhận Kiến trúc EVM V3.0 (Crucial)**:
  - Portaldot V3.0 hỗ trợ Solidity smart contracts thông qua **`revive` (`pallet-revive`)** thay vì Frontier cũ.
  - Tương thích với các công cụ EVM tiêu chuẩn: MetaMask, Hardhat, Foundry.
  - EVM JSON-RPC URL và Chain ID chính thức đang được `@Titus` (Core Team) xác nhận và sẽ công bố ngay khi hoàn tất cấu hình.



10/18/2026
et me clarify what we currently know.
Testnet Node Operator / Validator Program

I don't have confirmation that a public V3 testnet node operator or validator program is currently accepting applications.
Rewards and Incentives

There hasn't been a confirmed announcement regarding node operator rewards, testnet incentives, or guaranteed future mainnet rewards. I wouldn't recommend making financial commitments based on potential rewards until the team publishes official details.
Node Setup and Requirements

The official V3 testnet WebSocket endpoint is:
wss://test-node-v3.portaldot.dev
However, this is an RPC endpoint, not a node installation guide.
We still need the development team to confirm the official node binary or source repository, hardware requirements, synchronization instructions, and validator registration process.
Node Operations & Tooling Track

This is an official Hacker House development track focused on infrastructure tools, monitoring, automation, and related solutions.
However, participation in this track does not automatically mean enrollment in a separate node operator program or eligibility for validator rewards.
My recommendation: Before renting a server, I suggest waiting for confirmation of the public node participation requirements. In the meantime, you can begin developing monitoring and analytics tools using the available V3 RPC endpoint.
Could the core team please confirm whether public node participation is currently available and whether an official operator guide and incentive program are planned?
I appreciate your willingness to contribute to the network's infrastructure, and I hope this helps you plan your project without unnecessary expenses.


# 📢 **PortaldotV3 Testnet: Updated Network Info & Testnet Token Distribution**

Hello Portaldot builders! 👋

The PortaldotV3 Testnet RPC information has been updated. Please use the endpoints below from now on. The previous endpoints are no longer in use.

🔗 **Updated Testnet Network Info**
• Node Explorer: https://node-console.portaldot.dev
• Testnet Node URL: `wss://test-node-v3.portaldot.dev`
• Testnet Node EVM Endpoint: `https://test-evm-rpc-v3.portaldot.dev`
• Chain ID (EVM): `420420777`

If you already configured MetaMask, Hardhat or any scripts with the old endpoints, please update the RPC URL. The Chain ID stays the same.

🪙 **Testnet Token Distribution for Hackathon Participants**
The **first batch of testnet tokens** will be distributed to **hackathon participants**.

✅ **Already submitted your wallet?** Some participants already provided their **native POT wallet address** (beginning with **5**) during registration. No further action is needed for now.

📝 **Haven't submitted your wallet address yet?** Please open a **support ticket** here on Discord and include:
1. A screenshot of your hackathon registration/participation
2. Your correct **native POT wallet address** (beginning with **5**)

⚠️ Make sure you send your **native POT address** (starting with `5`), not an EVM address (starting with `0x`).
🔒 The team will never ask for your seed phrase or private key. Never share them with anyone.

Thank you, and happy building on PortaldotV3! @everyone