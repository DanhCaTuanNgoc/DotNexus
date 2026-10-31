# ⚖️ BIÊN BẢN THẨM ĐỊNH KỸ THUẬT & SOI LỖI DỮ LIỆU ON-CHAIN (REAL DATA AUDIT)
## PORTALDOT HACKER HOUSE 2026 — TRACK: NODE OPERATIONS & TOOLING

* **Dự án**: DotNexus (The Visual Control Plane & Automated Security Operations Engine for Portaldot Network V3.0)
* **Đối tượng thẩm định**: Tính chân thực của dữ liệu (**Real-time On-Chain Testnet Data vs. Hardcode / Mock Data**)
* **Môi trường thẩm định**: Portaldot Network V3.0 Testnet (WASM WS: `wss://test-node-v3.portaldot.dev` | EVM RPC: `https://test-evm-rpc-v3.portaldot.dev`)
* **Công cụ giám sát & bóc tách**: Vite Dev Server (Port 5173), Microsoft Playwright Headless Browser Engine, Python AST Inspector
* **Ngày thẩm duyệt**: 31/10/2026
* **Tình trạng phê duyệt**: **KHÔNG ĐẠT (REJECTED)** — Yêu cầu sửa đổi khẩn cấp trước giờ chót nộp bài!

---

## 📊 BẢNG TỔNG KẾT ĐIỂM SỐ KỸ THUẬT

| Hạng mục kiểm tra | Điểm chuẩn | Điểm chấm thực tế | Mức độ vi phạm |
| :--- | :---: | :---: | :--- |
| **Màn hình 1: Dual-VM Telemetry** | 20 | **8 / 20** | BABE Author tính bằng `%`, Mapping Latency bịa bằng công thức toán. |
| **Màn hình 2: Slashing Guard** | 20 | **7 / 20** | Expiry block lệch 114k block, timeline đếm lùi gán cứng theo biến đếm. |
| **Màn hình 3: NPoS Staking** | 20 | **6 / 20** | 14/16 validator là dữ liệu ảo, Era gán cứng `#142`, Unbonding queue tự chế. |
| **Màn hình 4: RPC Shield & Topology** | 20 | **3 / 20** | Toàn bộ mạng P2P bịa đặt (IP test RFC 5737, Peer ID chế nhạo), EVM cache 4.1M. |
| **Màn hình 5: Automation Canvas** | 10 | **4 / 10** | Giả lập pipeline khi backend fail, log in cứng `Block #4,120,912`, lộ lease holder. |
| **Tính trung thực Client/Server (No Spoof)**| 10 | **0 / 10** | **TRỪ NẶNG**: `gentlyAdvanceBlockSimulation()` tự đẻ block ảo nhưng gắn mác `LIVE RPC`. |
| **TỔNG ĐIỂM CHUNG CUỘC** | **100** | **28 / 100** | 🚨 **BÁO ĐỘNG ĐỎ — NGUY CƠ BỊ ĐÁNH LOẠI TRỰC TIẾP!** |

---

## 🔍 CHI TIẾT BÓC TÁCH TỪNG MÀN HÌNH CHỨC NĂNG

---

### 1️⃣ MÀN HÌNH 1: DUAL-VM TELEMETRY (`DualEngineView`)
*Cam kết*: Giám sát song song trạng thái đồng bộ giữa Substrate WASM (:9944) và Frontier EVM (:8545), phát hiện nghẽn tầng dữ liệu `fc-db`.

#### Lỗi 1.1: BABE Block Author bị tính ngẫu nhiên bằng phép chia lấy dư
* **Dữ liệu hiển thị trên UI**: Cột `Author` trong bảng Lockstep Parity Stream hiển thị luân phiên các tên: `"Alice"`, `"Bob"`, `"Charlie"`, `"Dave"`, `"Eve"`, `"Ferdie"`.
* **Bản chất kỹ thuật**: Không hề giải mã `PreRuntime` digest hay đọc authoring authority từ block header của Substrate. Backend lấy một mảng cố định rồi tính theo số block:
  ```python
  # engine/dual_tracker.py (Dòng 883, 953)
  authors_list = ["Alice", "Bob", "Charlie", "Dave", "Eve", "Ferdie"]
  # ...
  "babe_author": authors_list[w_num % len(authors_list)]
  ```
* **Mức phạt**: **-15 điểm** (Gian lận danh tính validator tạo block).

#### Lỗi 1.2: Mapping Latency là công thức toán học bịa đặt
* **Dữ liệu hiển thị trên UI**: Chỉ số `Mapping Latency: 15.6ms`, `17.2ms`, `18.8ms`, `20.4ms`, `22.0ms`.
* **Bản chất kỹ thuật**: Hoàn toàn không đo timestamp chênh lệch giữa block WASM và block EVM tương ứng trong `fc-db`. Lấy công thức toán học nội suy:
  ```python
  # engine/dual_tracker.py (Dòng 939)
  mapping_latency = round(12.4 + ((w_num * 17) % 19) * 0.8, 1)
  ```
* **Mức phạt**: **-15 điểm** (Số liệu độ trễ ảo).

#### Lỗi 1.3: Decimal Normalization kiểm tra số dư cố định 100 POT
* **Dữ liệu hiển thị trên UI**: Khung Hardware & Decimals hiển thị chuyển đổi giữa Planck ($10^{14}$) và Wei ($10^{18}$).
* **Bản chất kỹ thuật**: Không query số dư thực của bất kỳ ví Testnet nào trên chain, tự gán cứng hằng số 100 POT:
  ```python
  # engine/dual_tracker.py (Dòng 670 - 672)
  sample_planck = 100 * (10 ** self.decimals)
  sample_wei = 100 * (10 ** CONFIG.evm_standard_decimals)
  decimal_norm = self.normalize_pot_balance(sample_planck, sample_wei)
  ```
* **Mức phạt**: **-5 điểm**.

#### Lỗi 1.4: Ecosystem Pulse và Remediation Mempool Purge dùng hằng số giả
* **Dữ liệu hiển thị trên UI**: `Throughput: 240 QPS`, `Storage Deposit: 0.08 POT / byte`, `Active Authority: Alice (Validator)`. Nút bấm "Purge Stale Mempool" báo xóa 12 giao dịch.
* **Bản chất kỹ thuật**: Các chỉ số này là hằng số tĩnh gán chết trong code Python:
  ```python
  # engine/dual_tracker.py (Dòng 716, 728, 736, 798)
  "fc_db_latency_ms": round(evm_telemetry.get("latency_ms", 15.0) * 0.4, 2),
  "throughput_qps": 240,
  "active_authority": "Alice (Validator)",
  "storage_deposit_rate": "0.08 POT / byte",
  # Trong hàm execute_remediation:
  purged_count = 12
  ```
* **Mức phạt**: **-10 điểm**.

---

### 2️⃣ MÀN HÌNH 2: SLASHING GUARD (`SecurityGuardView`)
*Cam kết*: Cơ chế bảo vệ chống phân nhánh hai đầu (Anti-Equivocation), khóa hợp đồng thuê ký (Lease Registry) và Dead Man's Switch 3 mốc (10s Fence - 12s TTL - 15s Takeover).

#### Lỗi 2.1: Expiry Block `#147,500` lệch hơn 114,000 blocks so với block thực
* **Dữ liệu hiển thị trên UI**: Khung On-chain Lease hiển thị:
  * Contract Address: `0xba114d21CC41a30880CcfA53673B743316387355`
  * Expiry Block: `#147500 (236 blks left)`
  * Data Feed Source: `PORTALDOT_V3_EVM_TESTNET`
* **Bản chất kỹ thuật**: Trên Header của chính ứng dụng, block EVM Testnet thực tế đã chạy đến `#261,898`. Hợp đồng này đã hết hạn từ hơn 114,000 block trước! Con số này đến từ dữ liệu mẫu hardcode trong `api.ts`:
  ```typescript
  // front-end/src/services/api.ts (Dòng 593 - 595)
  expires_at_block: 147500,
  current_evm_block: 147264,
  blocks_remaining: 236,
  ```
* **Mức phạt**: **-20 điểm** (Lỗi logic nghiêm trọng, chứng minh không gọi contract live trên EVM).

#### Lỗi 2.2: Thanh tiến trình Dead Man's Switch nội suy theo số lần click
* **Dữ liệu hiển thị trên UI**: Thanh tiến trình thời gian thực `ELAPSED: 3.0s / 12.0s`.
* **Bản chất kỹ thuật**: Không tính dựa vào timestamp chênh lệch thực tế của lease, mà fix cứng theo biến đếm `missed_heartbeats`:
  ```typescript
  // front-end/src/views/SecurityGuardView.tsx (Dòng 67)
  const simulatedElapsedSeconds = missedCount === 0 ? 3.0 : missedCount === 1 ? 7.5 : 11.5;
  ```
* **Mức phạt**: **-10 điểm**.

#### Lỗi 2.3: P2P Port và Keystore Sync là chuỗi tĩnh
* **Dữ liệu hiển thị trên UI**: `LIBP2P TELEMETRY: :30333 [PORT OPEN]`, `KEYSTORE SYNC STATE: [PARITY VERIFIED]`.
* **Bản chất kỹ thuật**: Hoàn toàn không mở socket TCP thử nghiệm port 30333, cũng không so sánh băm keystore giữa Node-01 và Node-02.
* **Mức phạt**: **-5 điểm**.

---

### 3️⃣ MÀN HÌNH 3: NPOS STAKING (`StakingYieldView`)
*Cam kết*: Chạy thuật toán Sequential Phragmén Client-side để tìm ra 16 Validator tối ưu nhất mạng lưới Portaldot V3.0.

#### Lỗi 3.1: 14 trong số 16 Validator là DỮ LIỆU TỰ BỊA ĐẶT
* **Dữ liệu hiển thị trên UI**: Bảng hiển thị 16 validator với đầy đủ điểm PAO Score, Commission, Uptime. Bộ lọc `LIVE ON-CHAIN (2)` chỉ có 2 node, còn tab `ALL (16)` có thêm 14 node khác.
* **Bản chất kỹ thuật**: Node Portaldot Testnet hiện tại thực chất chỉ có 2 validator hoạt động (`Alice` và `Bob`). 14 node còn lại:
  * `"PolkaGuard-Secure-Node"` (5Fgatk...)
  * `"Greedy-Oversubscribed-Node"` (5HGjWA...)
  * `"ZeroFee-Community-Pool"` (5HdrQS...)
  * `"Apex-Staking-Pool"` (5GHCjf...)
  * `"Quantum-Validator-Prime"` (5CPamM...)
  đều là mảng Python tĩnh tự gán trong code:
  ```python
  # engine/npos_optimizer.py (Dòng 220 - 350)
  sample_validators = [
      {"stash_address": "5Fgatk4LD2TL6W2J1LUZc5szpQvitHmr1jZpe2nx9LGE3s1q", "identity": "PolkaGuard-Secure-Node", ...},
      {"stash_address": "5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw", "identity": "Greedy-Oversubscribed-Node", ...},
      # ... 14 validator giả lập
  ]
  ```
* **Mức phạt**: **-25 điểm** (Gian lận quy mô mạng lưới Testnet).

#### Lỗi 3.2: Staking Keeper gán cứng Current Era `#142`
* **Dữ liệu hiển thị trên UI**: `CURRENT ERA: #142`.
* **Bản chất kỹ thuật**: Trong `engine/staking_keeper.py`, era được hardcode mặc định là 142:
  ```python
  # engine/staking_keeper.py (Dòng 47)
  current_era = 142
  ```
* **Mức phạt**: **-10 điểm**.

#### Lỗi 3.3: Lô mở khóa Unbonding Queue là dữ liệu giả
* **Dữ liệu hiển thị trên UI**: `Chunk #1: 100 POT (Unlock Era #156)`, `Chunk #2: 50 POT (Unlock Era #160)`.
* **Bản chất kỹ thuật**: Khi không đọc được `Staking.Ledger` thực tế từ ví, hệ thống tự động sinh dữ liệu ảo:
  ```python
  # engine/staking_keeper.py (Dòng 80 - 92)
  if not unlocking_chunks:
      sample_val = 500 * (10 ** CONFIG.default_token_decimals)
      # Tự gán mở khóa sau 14 era...
  ```
* **Mức phạt**: **-10 điểm**.

---

### 4️⃣ MÀN HÌNH 4: RPC SHIELD & TOPOLOGY (`TopologyRadarView`)
*Cam kết*: Bản đồ radar topo P2P Libp2p toàn cầu và cổng Reverse Proxy chống tấn công từ chối dịch vụ (DDoS) bảo vệ node.

#### Lỗi 4.1: Toàn bộ danh sách mạng P2P Libp2p là BỊA ĐẶT
* **Dữ liệu hiển thị trên UI**: Radar hiển thị 5 peer:
  * Frankfurt (18ms, Authority Validator)
  * Singapore (42ms, Full Node RPC)
  * New York (85ms, Authority Validator)
  * Unknown Tor Proxy (240ms, Malicious Peer)
* **Bản chất kỹ thuật**: Không hề gọi RPC `system_peers` hay `system_networkState`. Toàn bộ danh sách này được gán cứng, đặc biệt node Malicious còn mang tên giễu nhại và IP test tài liệu RFC 5737 (`203.0.113.88`):
  ```python
  # engine/rpc_shield.py (Dòng 53 - 101)
  def _init_p2p_topology(self):
      return [
          {"peer_id": "12D3KooWDpJ7...", "ip": "142.93.18.24", "location": "Frankfurt, Germany", ...},
          {"peer_id": "12D3KooWStqW...", "ip": "165.227.84.112", "location": "Singapore", ...},
          {"peer_id": "12D3KooWRv5b...", "ip": "198.51.100.45", "location": "New York, USA", ...},
          {
              "peer_id": "12D3KooWBadActorX99SpammerBotAttacker99999999999999X",
              "ip": "203.0.113.88",
              "location": "Unknown (Tor Proxy)",
              "role": "Unknown Peer",
              "status": "FLAGGED_SUSPICIOUS",
              "is_malicious": True
          }
      ]
  ```
* **Mức phạt**: **-25 điểm** (Làm giả dữ liệu topo hạ tầng mạng).

#### Lỗi 4.2: EVM Block Cache gán cứng `#4,120,911`
* **Dữ liệu hiển thị trên UI**: Proxy filter logic.
* **Bản chất kỹ thuật**: Trong khi Testnet mới ở block `#261,900`, code backend gán:
  ```python
  # engine/rpc_shield.py (Dòng 25)
  self.cached_latest_evm_block = 4120911
  ```
* **Mức phạt**: **-10 điểm**.

---

### 5️⃣ MÀN HÌNH 5: AUTOMATION CANVAS (`CanvasBoard`)
*Cam kết*: Soạn thảo và điều phối quy trình vận hành tự động (Visual DAG Runbook Engine) trên Portaldot Network V3.

#### Lỗi 5.1: Tự sinh phản hồi thực thi giả khi Offline
* **Dữ liệu hiển thị trên UI**: Pipeline chạy thành công các bước, đo thời gian mili-giây từng node.
* **Bản chất kỹ thuật**: Nếu backend Python offline hoặc API lỗi, frontend tự chế kết quả thành công với thời gian chạy ảo `sortedNodes.length * 480ms`:
  ```typescript
  // front-end/src/views/CanvasBoard.tsx (Dòng 716 - 740)
  if (!res?.success) {
    await sleep(300);
    res = {
      success: true,
      data: {
        execution_id: `exec-${Date.now().toString(36)}`,
        duration_ms: sortedNodes.length * 480,
        // ...
      }
    };
  }
  ```
* **Mức phạt**: **-15 điểm**.

#### Lỗi 5.2: Chuỗi log thông báo ghi cứng Block `#4,120,912`
* **Dữ liệu hiển thị trên UI**: Terminal Log in ra: `Dispatched 24/7 telemetry signal to #ops-alerts & Telegram (Heartbeat: HEALTHY, Best Block: #4,120,912)`.
* **Bản chất kỹ thuật**: Chuỗi này bị hardcode trong `CanvasBoard.tsx` (Dòng 726) thay vì truyền block height hiện tại từ Telemetry.
* **Mức phạt**: **-10 điểm**.

#### Lỗi 5.3: Lộ tên cá nhân trong file Mutex Lock
* **Dữ liệu hiển thị trên UI**: Log in ra: `Signing Mutex locked: validator-primary-ngoctuan`.
* **Bản chất kỹ thuật**: File `.dotnexus_data/validator_lease.json` (Dòng 2) lưu cứng chuỗi `"holder": "validator-primary-ngoctuan"`.
* **Mức phạt**: **-5 điểm**.

---

### 6️⃣ CƠ CHẾ GIAN LẬN CLIENT-SIDE: `gentlyAdvanceBlockSimulation()`
*Phát hiện nguy hiểm nhất trong toàn bộ hệ thống:*

Tại `front-end/src/services/api.ts` (Dòng 1273 - 1305), tồn tại một hàm chạy ngầm:
```typescript
function gentlyAdvanceBlockSimulation() {
  const now = Date.now();
  if (now - lastBlockAdvanceTime > 6000) {
    dynamicDualState.substrate.best_block += elapsedSlots;
    dynamicDualState.evm.block_number += elapsedSlots;
    const authors = ['Alice (Primary)', 'Bob (Core #1)', 'Charlie (Zero-SLA)', 'Dave (Pool)', 'Eve (Hub)'];
    const newConduitItem = {
      hash_wasm: `0x${Math.random().toString(16).slice(2, 10)}...`,
      hash_evm: `0x${Math.random().toString(16).slice(2, 10)}...`,
      evm_gas_used: Math.floor(Math.random() * 1200000) + 400000,
      mapping_latency_ms: parseFloat((11 + Math.random() * 6).toFixed(1)),
      // ...
    };
  }
}
```
> [!CAUTION]
> **KẾT TỘI**: Khi backend tắt hoặc deploy lên Vercel không có node, frontend **tự động dùng `Math.random()` đẻ block giả, băm giả, độ trễ giả**, nhưng trên Header vẫn cố tình gắn nhãn **`LIVE RPC`** và **`100% LOCKSTEP PARITY`**! Đây là hành vi lừa dối người dùng và giám khảo chấm thi!

---

## 🛠️ DANH MỤC HÀNH ĐỘNG KHẮC PHỤC KHẨN CẤP (ACTION CHECKLIST)

Để không bị đánh rớt tại vòng thẩm định chính thức, đội ngũ kỹ thuật DotNexus bắt buộc phải thực hiện các bước sau:

1. **Minh bạch hóa trạng thái kết nối (Honest Telemetry)**:
   - Nếu mất kết nối hoặc chạy fallback, Header phải đổi thành huy hiệu màu vàng/cam: **`[SIMULATED / DEMO MODE]`**. Tuyệt đối chỉ gắn nhãn **`[LIVE RPC]`** khi websocket đã handshake thành công và nhận block header thật từ Testnet.
2. **Loại bỏ 14 Validator giả trong `NPoSOptimizer`**:
   - Chỉ hiển thị đúng các validator đang có trong `Session.Validators` của node Portaldot (hiện tại là 2 node `Alice` và `Bob`). Chú thích rõ ràng trên giao diện: *"Portaldot V3.0 Testnet Genesis Set: 2 Active Authorities"*.
3. **Giải mã Author thật từ BABE Digest Header**:
   - Đọc `header['digest']['logs']`, trích xuất engine `'BABE'` để lấy slot number và author authority index thay vì dùng phép chia lấy dư mảng tĩnh.
4. **Thay thế Topo P2P bằng RPC `system_peers`**:
   - Gọi `substrate_client.rpc_request("system_peers", [])`. Phân tích địa chỉ multiaddress thực tế của các peer đang kết nối vào node.
5. **Đồng bộ hóa Lease State với EVM**:
   - Đọc trực tiếp block EVM hiện tại qua `web3.eth.block_number` và tính chính xác `blocks_remaining = expires_at_block - current_block`. Không để xuất hiện số block âm hoặc lệch 114,000 blocks.
6. **Xóa bỏ các giá trị định danh cá nhân**:
   - Thay `validator-primary-ngoctuan` trong `.dotnexus_data` bằng định danh động lấy từ system hostname hoặc ví validator SS58.

---

*Biên bản được lập và chứng thực bởi Ban Giám Khảo Kỹ Thuật Portaldot Hacker House 2026.*
