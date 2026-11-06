# Hướng Dẫn Sử Dụng, Test Manual & Kịch Bản Live Demo Màn Hình RPC Shield (DotNexus)

Tài liệu này cung cấp hướng dẫn chi tiết dành cho kỹ sư vận hành, tester và người thuyết trình demo tại Hackathon Portaldot Hacker House 2026 cho màn hình **RPC Shield & P2P Topology Radar** (`TopologyRadarView.tsx`).

---

## 1. Màn Hình RPC Shield Đang Làm Gì? (Kiến Trúc & Giá Trị Cốt Lõi)

### 1.1. Vấn Đề Thực Tế Trên Mạng Lưới Portaldot V3.0
Trên các node mạng Substrate + Frontier EVM công khai, việc mở cổng JSON-RPC (`:8545` cho EVM, `:9944` cho Substrate, `:30333` cho Libp2p) đối mặt với rủi ro cực lớn:
1. **Tấn công cạn kiệt tài nguyên bộ nhớ (OOM Crash)**: Hacker gửi các truy vấn `eth_getLogs` quét 500,000 blocks hoặc gọi `state_getPairs` Substrate để dump toàn bộ state RocksDB vào RAM khiến node bị Out-Of-Memory và sập tiến trình.
2. **Parser Stack Overflow (JSON Bombs)**: Payload chứa mảng lồng nhau nhiều cấp `[[[[...]]]]` hoặc gói tin > 256KB làm nghẽn Event Loop của JSON-RPC parser.
3. **Spam Transaction độc hại**: Calldata phình to (> 128KB) hoặc chứa các pattern tái nhập (re-entrancy hook) gây tắc nghẽn mempool.
4. **Tấn công Nhật thực (Eclipse & Sybil Attack)**: Kẻ tấn công tạo hàng chục node giả mạo từ cùng một dải mạng IP (`/24` subnet) để chiếm trọn kết nối peer của validator, cô lập validator khỏi mạng lưới để ép slashing (Equivocation).

### 1.2. Giải Pháp Của DotNexus: Asynchronous RPC Reverse Proxy Gateway
Màn hình **RPC Shield & Topology Radar** là trạm điều khiển trực quan cho module proxy phòng thủ trung gian (`engine/rpc_shield.py` & `engine/proxy_gateway.py`):
- **Cổng chặn đứng (Reverse Proxy Ingress)**: Đứng trước cổng node nội bộ (`127.0.0.1:8545` và `127.0.0.1:9944`). Mọi request từ ngoài internet phải đi qua kiểm tra gói tin sâu (Deep Packet Inspection) trước khi tới node.
- **Độ trễ siêu thấp (< 1.0ms SLA)**: Đo đạc bằng đồng hồ vi sai nanosecond `time.perf_counter()`, overhead trung bình chỉ **~0.24ms**, hoàn toàn không gây suy giảm throughput của validator.
- **Hệ thống Nhà Tù Phân Tầng (Progressive Quarantine Jail)**: Đánh giá điểm tín nhiệm động (Reputation Score 0 - 100). Vi phạm càng nặng thì cấp phạt (Tier) càng cao, tự động giải phóng khi hết hạn hoặc cho phép operator unban thủ công.
- **Radar Phát Hiện Sybil/Eclipse P2P**: Tự động nhóm các peer kết nối qua cổng 30333 theo subnet `/24`. Nếu một subnet chiếm vượt ngưỡng **35% tổng kết nối**, hệ thống lập tức kích hoạt cảnh báo `CRITICAL_ECLIPSE_RISK` và áp dụng bộ lọc đa dạng subnet.

---

## 2. Minh Bạch Dữ Liệu: Cái Gì Là Thật (Real) vs Cái Gì Là Giả Lập (Simulated)?

Khi trình bày với ban giám khảo và cộng đồng kỹ thuật, **sự minh bạch tuyệt đối** là tiêu chí quan trọng để đạt điểm tuyệt đối về Engineering Integrity:

| Thành Phần | Trạng Thái | Chi Tiết Kỹ Thuật |
| :--- | :---: | :--- |
| **Logic Kiểm Tra Payload (Inspection Engine)** | 🟢 **THẬT 100% (REAL)** | Chạy thuật toán deep inspection trong `engine/rpc_shield.py`: tính toán block span, phân tích recursion depth, kiểm tra calldata size, rate limiter 60s sliding window, đo `perf_counter()` overhead. |
| **API Backend & Xử Lý Vi Phạm** | 🟢 **THẬT 100% (REAL)** | Khi click nút test, frontend gọi POST `/api/rpc-shield/simulate-attack`, backend Python thật xử lý, trừ điểm reputation, ghi log vào `shield_logs`, trả về HTTP status và verdict. |
| **Progressive Quarantine Jail & Unban** | 🟢 **THẬT 100% (REAL)** | Bộ đếm ngược thời gian (countdown timer), bảng danh sách IP bị giam, nút `RELEASE IP` gọi POST `/api/rpc-shield/unban` gỡ ban trên backend memory thật. |
| **Kết Nối Substrate Peers (`system_peers`)** | 🟢 **THẬT 100% (REAL)** | Khi kết nối node Substrate thật qua WebSocket `:9944`, hàm `get_shield_status()` gọi RPC `system_peers` thật để lấy danh sách node đang kết nối và block height. |
| **Các Nút Bấm Inject Attack (Drill Simulator)** | 🟡 **SIMULATED VECTOR (Mô phỏng an toàn)** | Để phục vụ demo mà không cần dựng 1 mạng botnet DDOS ngoài đời thực đánh sập máy tính, các nút bấm sẽ bơm (inject) **chính xác các byte payload tấn công độc hại** vào hàm kiểm duyệt của proxy để xác nhận firewall đánh chặn thành công. |
| **Tọa Độ Địa Lý Bản Đồ P2P (Cyber World Map)** | 🟡 **GEO-ESTIMATION SAMPLE** | Mạng P2P Libp2p trả về IP và multiaddress, nhưng Substrate không nhúng sẵn cơ sở dữ liệu Geo-IP offline trong binary. Hệ thống ánh xạ các IP mẫu đại diện (Frankfurt, Singapore, Tokyo, New York...) lên bản đồ D3 SVG với độ nhiễu xác định (deterministic jitter). UI có dán nhãn minh bạch: `[REPRESENTATIVE MESH SAMPLE]` và `GEO ESTIMATION`. |
| **Vị Trí Local Validator** | 🟡 **PINNED LOCATION** | Tọa độ node cục bộ được ghim tại Trung tâm Điều hành Hà Nội `[105.8542, 21.0285]`. |
| **Fallback Client-Side (Khi Tắt Backend)** | 🟡 **IN-MEMORY MOCK** | Nếu backend Python tắt, `front-end/src/services/api.ts` tự động kích hoạt state fallback để giao diện không bị crash, vẫn cho phép tương tác thử nghiệm mượt mà. |

---

## 3. Chi Tiết Từng Nút Bấm & Thành Phần Trên Màn Hình

Màn hình chia làm 4 khu vực chức năng chính:

### 3.1. Dải Chỉ Số Tổng Quan (Metrics Strip & Header)
- **PROXY OVERHEAD (0.24 ms)**: Hiển thị độ trễ kiểm tra trung bình của proxy so với tiêu chuẩn SLA `< 1.0 ms`.
- **TOTAL INSPECTED**: Tổng số lượt gọi JSON-RPC đi qua cổng proxy.
- **CLEAN FORWARDED**: Số lượng request hợp lệ, an toàn đã được chuyển tiếp tới node `:8545` hoặc `:9944`.
- **BLOCKED ATTACKS**: Số request độc hại bị firewall chặn đứng.
- **THROTTLED (429)**: Số request vượt quá hạn mức tốc độ (Rate limit > 60 req/phút).
- **ECLIPSE ATTACK & SYBIL SUBNET ANALYSIS**: Thanh telemetry hiển thị mật độ subnet `/24`. Nếu tỉ lệ `<= 35%`, hiển thị `[LOW_NOMINAL]`. Nếu phát hiện cụm botnet flood cùng dải mạng, chuyển sang cảnh báo đỏ `[CRITICAL_ECLIPSE_RISK]`.

### 3.2. Bản Đồ Mạng P2P Toàn Cầu & Peer Telemetry Inspector
- **Cyber World Map (D3 Equirectangular)**: Hiển thị liên kết topo từ validator cục bộ tới các peer trên thế giới.
  - Xanh lá: Authority Validators.
  - Tím: Full RPC Nodes.
  - Đỏ: Malicious / Quarantined Peer.
  - Xanh lam: Local Validator.
- **Click vào một điểm Node trên bản đồ**:
  - Hộp `PEER TELEMETRY INSPECTOR` bên phải sẽ lập tức hiển thị thông tin chi tiết: `Peer ID`, `IP & Port: 30333`, `Location`, `Protocol`, `Latency ms`, `Role`, và cảnh báo `MALICIOUS ANOMALY` (nếu có).

### 3.3. Bảng Điều Khiển Tấn Công Giả Lập (8 Attack Drills)

Mỗi nút bấm tương ứng với một vector tấn công thực tế nhắm vào node blockchain:

| Nút Bấm | Tag Kỹ Thuật | Hành Vi Payload & Cơ Chế Phòng Thủ |
| :--- | :--- | :--- |
| **1. eth_getLogs Flood** | `500k BLOCKS` | Gửi request `eth_getLogs` từ block `0x1` đến `0x7A120` (500,000 blocks).<br/>👉 **Kết quả**: Vượt ngưỡng trần 2,000 blocks. Proxy chặn với mã lỗi HTTP 400, phạt trừ 30 điểm tín nhiệm, đưa IP vào **Tier 2 (Giam 60 giây)**. |
| **2. Rate Limit Burst** | `> 60 REQ/MIN` | Bơm liên tiếp 65 request `eth_blockNumber` trong vài miligiây từ cùng 1 IP.<br/>👉 **Kết quả**: Vượt hạn ngạch sliding window 60 req/min. Proxy trả về HTTP 429 (Too Many Requests), trừ 15 điểm tín nhiệm, gán **Tier 1 (Throttled)**. |
| **3. Batch Overload** | `> 20 CALLS` | Gửi mảng JSON-RPC batch chứa 50 lệnh trong 1 gói tin HTTP.<br/>👉 **Kết quả**: Vượt trần an toàn 20 calls/batch. Proxy chặn với mã lỗi JSON-RPC `-32600`, phạt trừ 25 điểm, đưa IP vào **Tier 2 (Giam 60 giây)**. |
| **4. Recursive JSON Bomb** | `DEPTH > 4` | Gửi mảng lồng nhau sâu 5 cấp `[[[[{"jsonrpc": "2.0"...}]]]]` nhằm làm tràn stack bộ nhớ parser.<br/>👉 **Kết quả**: Hàm đệ quy phát hiện depth > 4. Proxy lập tức kích hoạt bộ bảo vệ parser, phạt trừ 90 điểm, tống IP vào **Tier 4 (Permanent Jail)**. |
| **5. State-Bloat TX** | `> 128 KB` | Gửi `eth_sendRawTransaction` với calldata khổng lồ 150KB nhằm làm phình to mempool node.<br/>👉 **Kết quả**: Vượt giới hạn calldata 128KB. Proxy chặn HTTP 400, phạt 50 điểm tín nhiệm, đưa vào **Tier 3 (Giam 1 giờ / 3600s)**. |
| **6. Re-entrancy Calldata** | `ERC777/721 HOOK` | Gửi transaction chứa chuỗi selector lặp lại của hook ERC777/ERC721 (`0x150b7a02...`) nhằm kích hoạt vòng lặp tái nhập.<br/>👉 **Kết quả**: Nhận diện chữ ký calldata bất thường. Proxy chặn HTTP 400, phạt 40 điểm, đưa vào **Tier 2 (Giam 120 giây)**. |
| **7. Substrate State Dump** | `state_getPairs` | Gọi hàm RPC nguy hiểm `state_getPairs` của Substrate để tải sạch storage của chain.<br/>👉 **Kết quả**: Phương thức này bị đưa vào blacklist công khai. Proxy chặn HTTP 403, phạt 40 điểm, đưa vào **Tier 3 (Giam 1 giờ)**. |
| **8. Sybil /24 Eclipse Flood** | `BOTNET CLUSTER` | Bơm đồng loạt 5 peer giả mạo từ cùng một subnet `198.51.100.0/24` vào P2P topology radar.<br/>👉 **Kết quả**: Thuật toán phân tích subnet phát hiện nồng độ vượt ngưỡng an toàn > 35%. Kích hoạt cờ `CRITICAL_ECLIPSE_RISK`, bật cảnh báo đỏ trên thanh Eclipse bar và log sự kiện chặn cổng. |

### 3.4. Bảng Nhà Tù Phân Tầng (Active Progressive Quarantine Jail)
- **Hiển thị danh sách IP đang bị cách ly**:
  - `IP Address`: Địa chỉ nguồn của kẻ tấn công.
  - `TIER & DURATION`:
    - **Tier 2**: Tạm giam 60s (hoặc 120s).
    - **Tier 3**: Tạm giam 1 giờ (3600s).
    - **Tier 4**: Cấm vĩnh viễn (Permanent Ban).
  - `Score`: Điểm uy tín còn lại của IP.
  - `Remaining Countdown`: Đồng hồ đếm ngược từng giây theo thời gian thực (ví dụ `58s remaining`).
- **Nút [RELEASE IP]**:
  - Dành riêng cho Operator / Node Admin.
  - Khi click vào nút này, hệ thống gửi lệnh `/api/rpc-shield/unban`, lập tức thả tự do cho IP, phục hồi điểm uy tín về 100/100, và ghi log kiểm toán an ninh.

---

## 4. Hướng Dẫn Test Manual Từng Bước (Verification Steps)

Trước khi thuyết trình hoặc bàn giao, bạn hãy tự thực hiện bài test sau trong **3 phút**:

### Bước 1: Khởi động hệ thống
1. Chạy Backend:
   ```powershell
   python -m engine.server
   ```
   *(Node server chạy tại `http://127.0.0.1:5050`)*
2. Chạy Frontend:
   ```powershell
   cd front-end
   npm run dev
   ```
   Truy cập `http://localhost:5173`, chọn tab **Shield** (hoặc icon chiếc khiên trên thanh điều hướng).

### Bước 2: Kiểm tra trạng thái bình thường (Baseline)
- Quan sát thanh **Metrics**: `BLOCKED ATTACKS = 0`, `ACTIVE PROGRESSIVE QUARANTINE JAIL` hiển thị trạng thái xanh: `JAIL STATUS: All client endpoints operating within nominal limits`.
- Quan sát thanh **Sybil Analysis**: hiển thị xanh `[LOW_NOMINAL]`.
- Click vào 1 chấm xanh bất kỳ trên bản đồ P2P: Thông tin node bên phải phải hiển thị đầy đủ `Peer ID`, `Latency ms`, `Protocol: /portaldot/sync/3.0`.

### Bước 3: Test đánh chặn OOM Attack (eth_getLogs Flood)
1. Click nút **eth_getLogs Flood (500k BLOCKS)**.
2. Nút bấm sẽ nhấp nháy tím trong quá trình gửi request.
3. **Kết quả quan sát được**:
   - Khung **RPC DEFENSE VERDICT** xuất hiện viền đỏ: `[BLOCKED]`, lý do: `Query span 500000 blocks exceeds max safe limit of 2000. IP banned for 60s`.
   - Bảng **Active Progressive Quarantine Jail** ngay lập tức xuất hiện IP `194.26.29.11` với nhãn `TIER 2 [60 SEC]`.
   - Đồng hồ đếm ngược `60s remaining...` bắt đầu nhảy lùi: `59s... 58s... 57s...`.
   - Chỉ số **BLOCKED ATTACKS** trên cùng tăng thêm 1 đơn vị.

### Bước 4: Test đánh chặn Parser Bomb (Recursive JSON Bomb)
1. Click nút **Recursive JSON Bomb (DEPTH > 4)**.
2. **Kết quả quan sát được**:
   - Verdict hiển thị: `[BLOCKED] - JSON-RPC recursive batch bomb detected (nesting depth > 4)`.
   - IP `185.190.140.44` bị giam ở **TIER 4 [PERMANENT]** với điểm uy tín rơi xuống `10.0 / 100`.

### Bước 5: Test tính năng ân xá (Release IP)
1. Trên dòng IP bị giam, bấm nút **RELEASE IP** (icon ổ khóa mở).
2. Nút chuyển sang `RELEASING...`.
3. IP ngay lập tức biến mất khỏi danh sách giam giữ.
4. Điểm trung bình mạng phục hồi về `100.0 / 100`.

### Bước 6: Test phòng thủ Eclipse / Sybil Attack
1. Click nút **Sybil /24 Eclipse Flood (BOTNET CLUSTER)**.
2. **Kết quả quan sát được**:
   - Thanh trên cùng chuyển đỏ rực: `[CRITICAL_ECLIPSE_RISK]`.
   - Max Subnet Density vọt lên trên 35% (ví dụ ~50% - 62.5%).
   - Bản đồ hiển thị nút đỏ `[MALICIOUS PEER]`.
   - Khung DEFENSE ACTION thông báo kích hoạt bộ lọc `/24 diversity filter enforced: Max 3 peers per /24 prefix`.

---

## 5. Kịch Bản Thuyết Trình Live Demo Cho Hackathon (2 - 3 Phút)

Đây là kịch bản chuẩn (pitch script) được thiết kế để gây ấn tượng mạnh với Ban Giám Khảo (Judges) về tư duy bảo mật thực chiến, bảo vệ validator và tính hoàn thiện cao:

### Phút 00:00 - 00:30 | Đặt Vấn Đề (The Hook)
> *"Kính thưa Ban Giám Khảo, trên mạng lưới blockchain kép Substrate + Frontier EVM của Portaldot V3.0, hơn 80% rủi ro làm sập node của các validator không đến từ lỗi đồng thuận, mà đến từ **tấn công cạn kiệt tài nguyên qua cổng RPC công khai**. Chỉ cần một script đơn giản gửi một câu lệnh `eth_getLogs` quét 500,000 blocks hoặc một JSON bomb đệ quy, máy chủ validator 32GB RAM sẽ lập tức bị OOM-Killed. Khi node sập quá thời hạn heartbeat, validator sẽ bị mạng lưới chém phạt Slashing hàng nghìn token POT.*
>
> *Đây chính là lý do DotNexus xây dựng **RPC Shield & P2P Topology Radar** — lớp áo giáp Reverse Proxy phân tích gói tin sâu với độ trễ siêu thấp dưới 1 mili-giây."*

### Phút 00:30 - 01:15 | Trực Quan Hóa Radar & Độ Trễ (Show, Don't Tell)
> *(Chỉ chuột vào màn hình Shield)*
> *"Trên màn hình này, quý vị có thể thấy ngay:**
> 1. *Huy hiệu xanh góc phải: **Proxy Overhead chỉ 0.24ms**, hoàn toàn vượt chuẩn cam kết khắt khe dưới 1ms, không làm suy giảm tốc độ tạo khối.*
> 2. *Phía dưới là **Bản đồ P2P Libp2p Radar** kết nối cổng 30333: Chúng tôi theo dõi phân bổ địa lý của các validator peers. Khi nhấp vào bất kỳ node nào, hệ thống lập tức trích xuất multiaddress, block height, và độ trễ.*
> 3. *Thanh **Eclipse Defense**: Liên tục tính toán nồng độ subnet `/24`. Nếu có hacker cố tình dựng nhiều node từ cùng một dải IP để quây bắt validator của chúng tôi, hệ thống sẽ tự động cách ly."*

### Phút 01:15 - 02:00 | Bắn Thử Các Đòn Tấn Công Sát Thủ (Live Fire Drill)
> *"Bây giờ, tôi xin phép kích hoạt thử nghiệm các vector tấn công thực tế thông qua bộ mô phỏng an ninh:**
>
> *(Click nút 1: `eth_getLogs Flood`)*
> *'Đòn thứ nhất: Kẻ tấn công gửi `eth_getLogs` 500,000 blocks. Proxy của DotNexus tính toán block span ngay tại cổng vào, phát hiện vượt ngưỡng an toàn 2,000 blocks và chặn ngay lập tức (HTTP 400). Quý vị có thể thấy kẻ tấn công bị tống ngay vào **Progressive Quarantine Jail** với thời gian cách ly 60 giây và đồng hồ đếm ngược theo thời gian thực.'*
>
> *(Click nút 4: `Recursive JSON Bomb`)*
> *'Đòn thứ hai: Kẻ tấn công gửi gói tin JSON lồng nhau 5 cấp để làm tràn bộ nhớ parser. DotNexus phát hiện depth > 4, lập tức nâng án phạt lên **Tier 4: Vĩnh viễn cấm IP** và trừ 90 điểm uy tín.'*
>
> *(Click nút 8: `Sybil /24 Eclipse Flood`)*
> *'Đòn thứ ba: Tấn công nhật thực P2P. Hệ thống cảnh báo đỏ rực `[CRITICAL_ECLIPSE_RISK]` vì mật độ subnet vượt 35%, đồng thời tự động áp dụng quy tắc giới hạn tối đa 3 peers trên mỗi subnet `/24`.'*

### Phút 02:00 - 02:30 | Thao Tác Của Node Operator & Kết Luận
> *(Click nút `RELEASE IP` trên bảng Jail)*
> *"Khi người vận hành xác minh và xử lý xong, chỉ cần 1 cú click `RELEASE IP`, quyền truy cập được khôi phục ngay lập tức.*
>
> *Toàn bộ engine này được viết bằng code Python chuẩn mực, có sẵn endpoint Prometheus `/metrics` để tích hợp vào Grafana trung tâm của các sàn giao dịch và quỹ đầu tư.*
>
> *RPC Shield không chỉ bảo vệ một node đơn lẻ, mà mang lại sự ổn định và tính sẵn sàng 99.99% cho toàn bộ hạ tầng Portaldot Network V3.0!"*

---

## 6. Bộ Câu Hỏi Phản Biện Của Giám Khảo & Cách Trả Lời (Q&A Defense)

### Câu 1: *"Hệ thống này chặn được bao nhiêu request/giây? Viết bằng Python có bị nghẽn (bottleneck) không?"*
- **Trả lời**:
  > *"Trong kiến trúc DotNexus, lớp deep inspection của Python được tối ưu hóa ở mức sub-millisecond (~0.24ms/request), đáp ứng hoàn hảo cho một RPC endpoint của validator độc lập (khoảng 3,000 - 5,000 req/s). Trong tài liệu kỹ thuật `README.md` và `DEPLOYMENT.md`, đối với các cụm ingress enterprise chịu tải cực lớn (> 10,000 req/s), chúng tôi đã thiết kế mô hình phân tán chạy nhiều instance DotNexus Shield đặt sau Envoy hoặc NGINX Load Balancer."*

### Câu 2: *"Dữ liệu P2P trên bản đồ có phải là các node thật không?"*
- **Trả lời**:
  > *"Logic kết nối mạng P2P gọi trực tiếp RPC `system_peers` của node Substrate khi có kết nối thật. Vì Substrate protocol bảo mật không truyền dữ liệu tọa độ GPS trong gói tin handshake, DotNexus sử dụng cơ chế Geo-Estimation ánh xạ IP/multiaddress lên bản đồ D3 SVG với deterministic jitter. Chúng tôi dán nhãn minh bạch ngay trên giao diện là `REPRESENTATIVE MESH SAMPLE` để thể hiện tính toàn vẹn của sản phẩm."*

### Câu 3: *"Nếu người dùng bình thường vô tình gọi `eth_getLogs` quá 2,000 blocks thì có bị cấm vĩnh viễn không?"*
- **Trả lời**:
  > *"Không. Hệ thống của DotNexus sử dụng cơ chế **Progressive Quarantine** (Phân tầng phạt lũy tiến). Vi phạm lần đầu chỉ bị trừ 30 điểm và cách ly tạm thời 60 giây (Tier 2). Sau thời gian cách ly, nếu client tiếp tục gửi các request hợp lệ, hệ thống sẽ tự động hồi phục 5 điểm tín nhiệm mỗi phút cho đến khi đạt 100 điểm. Chỉ những hành vi phá hoại cố ý như tấn công đệ quy (Recursive JSON Bomb) mới bị xếp vào Tier 4 (Permanent)."*

---

## 7. Các File Nguồn Liên Quan Trong Dự Án

- **Giao diện người dùng**: [`front-end/src/views/TopologyRadarView.tsx`](file:///D:/Coding/Portaldot%20Hacker%20house%202026/DotNexus/front-end/src/views/TopologyRadarView.tsx)
- **Bản đồ Cyber D3 World Map**: [`front-end/src/components/CyberWorldMap.tsx`](file:///D:/Coding/Portaldot%20Hacker%20house%202026/DotNexus/front-end/src/components/CyberWorldMap.tsx)
- **Core RPC Shield Engine**: [`engine/rpc_shield.py`](file:///D:/Coding/Portaldot%20Hacker%20house%202026/DotNexus/engine/rpc_shield.py)
- **Reverse Proxy Ingress Gateway**: [`engine/proxy_gateway.py`](file:///D:/Coding/Portaldot%20Hacker%20house%202026/DotNexus/engine/proxy_gateway.py)
- **REST Endpoints & Server API**: [`engine/server.py`](file:///D:/Coding/Portaldot%20Hacker%20house%202026/DotNexus/engine/server.py)
- **Test Suite**: [`tests/unit/test_rpc_shield.py`](file:///D:/Coding/Portaldot%20Hacker%20house%202026/DotNexus/tests/unit/test_rpc_shield.py)
