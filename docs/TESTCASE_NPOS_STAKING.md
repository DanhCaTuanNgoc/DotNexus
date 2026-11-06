# DotNexus — Hướng Dẫn Sử Dụng & Bộ Test Case Thủ Công Màn Hình NPoS Staking

> **Module**: NPoS Phragmén Simulator & Dynamic Re-Nomination (`StakingYieldView.tsx`)  
> **Network mục tiêu**: Portaldot Network V3.0 (Substrate WASM + EVM Frontier Pallet-Revive Dual-VM, SS58: 42, Decimals: 14/18)  
> **Tài liệu**: Hướng dẫn vận hành và bộ kịch bản kiểm thử thủ công (Manual QA Test Specification & Operator Guide)

---

## 1. Tổng Quan Kiến Trúc & Mục Đích Phân Hệ NPoS Staking

Màn hình **NPoS Staking** của DotNexus không đơn thuần là giao diện staking hiển thị APY thụ động, mà là một **phòng điều hành tối ưu hóa lợi suất và bảo vệ mạng lưới (Institutional Staking Control Plane)** với các trụ cột:
1. **Sequential Phragmén Simulation**: Mô phỏng thuật toán bầu chọn Phragmén trực tiếp tại Client để tìm ra tập hợp **Top 16 Validator tối ưu nhất**, ngăn chặn tình trạng pha loãng lợi nhuận (dilution) hoặc vượt trần chỉ định (oversubscription > 256 nominators).
2. **PAO Metric Ribbon (Predictive Anti-Oversubscription)**: Đo lường biên an toàn $M_v$ (Safety Margin) của từng node validator theo công thức độc quyền DotNexus.
3. **Pre-Flight Safety Launchpad (3-Gate Radar)**: Kiểm tra bất biến 3 lớp trước khi phát lệnh extrinsic:
   - **Gate 1**: `ElectionProvider.CurrentPhase == Off` (Ngăn chặn lỗi phát sinh khi runtime đang bước vào cửa sổ bầu chọn epoch mới).
   - **Gate 2**: $\Delta\text{Yield} \times \text{Stake} > 3 \times \text{Fee}$ (Bảo vệ người dùng khỏi việc tái chỉ định khi phí giao dịch lớn hơn lợi suất thu về).
   - **Gate 3**: `AsyncNonceManager` đồng bộ mutex lock (Tránh đụng độ nonce khi phát extrinsic liên tục).
4. **Dual-VM Dispatch Studio**: Hỗ trợ đồng thời 2 luồng phát giao dịch:
   - **Substrate Native (WASM)**: Ký và broadcast thông qua `Keypair` (`//Alice`, `//Bob`, `//Charlie` hoặc Polkadot.js).
   - **MetaMask EVM (Pallet-Revive Precompile)**: Tự động chuyển mạng Portaldot Testnet V3 (Chain ID `0x190ef0a9` / `420420777`) và gọi hợp đồng staking vault EVM.
5. **Autonomous Staking Keeper & Unbonding Escrow Queue**: Theo dõi tiến trình unbond 28-era và cung cấp nút bấm kích hoạt Keeper tái cân bằng tự động.

---

## 2. Hướng Dẫn Sử Dụng Chi Tiết Từng Tính Năng (Step-by-Step Operator Guide)

### 2.1 Xem & Tính Toán Lợi Suất Lũy Kế (Yield Trajectory)
1. Truy cập tab **Staking & NPoS** trên thanh điều hướng chính (`activeTab = 'staking'`).
2. Quan sát 3 thẻ chỉ số trên cùng:
   - **Simple Nominal Payout**: Lợi suất danh nghĩa không tái đầu tư (ví dụ `14.8% APY`).
   - **Auto-Compounded Yield**: Lợi suất khi được Staking Keeper tự động gộp lãi 1460 lần/năm (ví dụ `16.2% APY`, kèm số POT bonus thặng dư).
   - **Active Set Capacity**: Số lượng validator bạn đang chọn trên tổng số tối đa 16 mục tiêu.

### 2.2 Mô Phỏng & Tái Cân Bằng Khoản Staking (Simulate & Rebalance)
1. Tại khung **Pre-Nomination Safety Invariants**, kiểm tra huy hiệu `[3/3 INVARIANTS SATISFIED]`.
2. Nhập số lượng vốn muốn stake vào ô **STAKING AMOUNT** (ví dụ `15000` POT). Giá trị này được tự động ghi nhớ vào `localStorage`.
3. Bấm nút **`SIMULATE & SIGN NOMINATE (X TARGETS)`**.
4. Hệ thống chạy thuật toán phân bổ tỷ trọng vốn Phragmén. Banner thông báo màu xanh ngọc xuất hiện với số POT phân bổ cho mỗi validator và số hiệu nonce dự kiến.
5. Bấm **`OPEN DISPATCH STUDIO`** để mở cửa sổ ký duyệt on-chain.

### 2.3 Quản Lý & Lọc Danh Sách Validator (Ledger Market Table)
1. **Sử dụng bộ lọc thị trường**:
   - `ALL (16)`: Hiển thị đầy đủ 16 ứng viên tối ưu.
   - `LIVE ON-CHAIN`: Chỉ hiển thị các node validator đang hoạt động trực tiếp trên Testnet V3 (có chấm tròn xanh lá và tag `PORTALDOT V3 LIVE`).
   - `OPTIMAL (Mv ≥ 0.5)`: Lọc các node có hệ số an toàn chống quá tải danh sách chỉ định cao nhất.
   - `COMM ≤ 3%`: Lọc các node có phí hoa hồng thấp ($\le 3\%$).
2. **Tùy chỉnh danh sách ứng viên (Target Customization)**:
   - Tích/bỏ tích ô checkbox ở cột ngoài cùng bên trái của từng validator để thêm hoặc loại bỏ node khỏi tập hợp nominate.
   - Bấm **`SELECT ALL`** để chọn nhanh 16 node.
   - Bấm **`CLEAR`** để xóa toàn bộ lựa chọn.
   - Chỉ số đếm `{selectedTargets.length} / 16 TARGETS` sẽ cập nhật trực tiếp.

### 2.4 Xem Chi Tiết Validator (Validator Profile Modal)
1. Bấm chuột vào bất kỳ dòng validator nào trên bảng hoặc nút **`INSPECT`**.
2. Cửa sổ modal xuất hiện chi tiết:
   - Địa chỉ ví **SS58 Stash Account** $\rightarrow$ Có nút **`COPY ADDRESS`** tiện lợi.
   - 4 chỉ số cơ bản: `EST. APY`, `COMMISSION`, `TOTAL STAKED POT`, `UPTIME RATIO`.
   - Bảng kỹ thuật: Sức chứa nominator hiện tại (`nominator_count / 256`), Lịch sử vi phạm Slashing, Điểm đánh giá an toàn PAO và Mức stake tối thiểu để nhận thưởng.
3. Bấm **`[-] REMOVE FROM SET`** hoặc **`[+] ADD TO SET`** để thay đổi trạng thái tham gia staking của node này.
4. Bấm **`STAKE & NOMINATE`** để chuyển thẳng tới Dispatch Studio.
5. Nhấn phím `Esc` hoặc icon `X` để đóng modal.

### 2.5 Phát Lệnh Extrinsic On-Chain (Dual-VM Dispatch Studio Modal)
1. Mở modal qua nút **`SIMULATE & SIGN NOMINATE`** hoặc nút **`STAKE & NOMINATE`**.
2. **Chọn Protocol Engine**:
   - **Substrate Native (SS58: 42)**:
     - Chọn tài khoản ký trong danh sách (`//Alice` - tài khoản có sẵn POT trên testnet, `//Bob`, hoặc `//Charlie`).
     - Nhập số POT muốn phân bổ (`BOND CAPITAL ALLOCATION (POT)`).
     - Kiểm tra khung **Raw Extrinsic Call Payload** (ví dụ `staking.nominate(targets=[...])`), có nút **`COPY CALL`**.
     - Bấm **`CONFIRM & BROADCAST ON-CHAIN`**: Hệ thống gửi extrinsic tới cổng WebSocket của Substrate (`wss://test-node-v3.portaldot.dev`).
     - Khi thành công, card màu xanh ngọc hiển thị: **Transaction Hash**, **Block Hash**, **Signer Account** và các sự kiện runtime (`pallet_staking.Nominated`, `system.ExtrinsicSuccess`). Có nút copy cho từng mã hash.
     - *(Tùy chọn)*: Bấm **`TEST AUTO-COMPOUND (BOND EXTRA)`** để gọi hàm `staking.bond_extra` trực tiếp đưa lãi phát sinh vào vốn gốc.
   - **MetaMask EVM (Revive Precompile)**:
     - Chuyển tab sang **MetaMask EVM (Revive Precompile)**.
     - Bấm **`CONNECT METAMASK`**. MetaMask sẽ yêu cầu người dùng xác nhận và tự động thêm mạng `Portaldot Testnet V3` (Chain ID `0x190ef0a9` / `420420777`, RPC `https://test-evm-rpc-v3.portaldot.dev`).
     - Bấm **`CONFIRM & BROADCAST ON-CHAIN`**: MetaMask mở popup xác nhận giao dịch gọi hợp đồng Staking Vault (`0x97e5707FCa341c27D7e6b5cEC5ABFe2d3498610A`).
     - Sau khi ký duyệt, hash giao dịch EVM sẽ hiển thị trên màn hình.

### 2.6 Quản Lý Rút Vốn & Kích Hoạt Staking Keeper
1. **Autonomous Staking Keeper**:
   - Xem thông số `CURRENT ERA` và `MIN APY DELTA REBALANCE`.
   - Bấm nút **`SIMULATE & RUN KEEPER PASS`**: Hệ thống sẽ đánh giá điều kiện chênh lệch APY và thực hiện chu trình kiểm tra tái cân bằng tự động.
2. **Unbonding Escrow & Lock Queue**:
   - Quan sát số lượng POT đang trong hàng đợi chờ mở khóa và số chunks đang khóa (tối đa 32 chunks theo quy định Substrate).
   - **Rút vốn (Unbond)**: Bấm **`UNBOND STAKE`** $\rightarrow$ Nhập số POT cần unbond (tối thiểu 0.1 POT) $\rightarrow$ Bấm **`CONFIRM UNBOND`**. Lệnh `staking.unbond` được đưa vào hàng đợi giải chấp 28 Eras (~7 ngày).
   - **Thu hồi vốn tự do (Withdraw Unbonded)**: Khi có chunk đã đáo hạn 28 Eras, nút **`WITHDRAW UNBONDED`** sẽ chuyển sang màu xanh lá phát sáng nhấp nháy (`WITHDRAW X POT`). Bấm nút này để rút thẳng số POT đã giải chấp về số dư khả dụng (`Free Balance`).

---

## 3. Ma Trận Test Case Kiểm Thử Thủ Công (Manual QA Test Suite)

Dưới đây là 15 test cases chuẩn QA/SDET bao phủ toàn diện 100% chức năng của màn hình NPoS Staking:

| Mã Test Case | Phân Hệ / Chức Năng | Mục Tiêu Kiểm Thử | Tiền Điều Kiện | Các Bước Thực Hiện | Dữ Liệu Kiểm Thử | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-NPOS-01** | Yield Trajectory | Kiểm tra tính chính xác của công thức APY danh nghĩa và lãi kép | Màn hình Staking đã tải xong | 1. Xem thẻ Simple Nominal Payout.<br>2. Xem thẻ Auto-Compounded Yield.<br>3. Thay đổi ô Staking Amount và quan sát. | Stake = `10000` POT | Thẻ Auto-Compounded Yield phải luôn hiển thị APY cao hơn thẻ Nominal Payout. Số POT bonus thặng dư (`surplusPot`) phải dương và tính đúng theo chu kỳ 1460 lần gộp/năm. | **PASS** |
| **TC-NPOS-02** | Pre-Flight Radar | Xác thực trạng thái 3 cổng an toàn trước khi nominate | Mạng Testnet hoạt động bình thường | 1. Kiểm tra huy hiệu tổng thể.<br>2. Đọc trạng thái từng Gate 1, Gate 2, Gate 3. | Không | Huy hiệu hiển thị `[3/3 INVARIANTS SATISFIED]`. Gate 1 hiển thị State `Off`. Gate 2 hiển thị `> 3x FEE`. Gate 3 hiển thị `[SYNCED]`. | **PASS** |
| **TC-NPOS-03** | Staking Input | Kiểm tra khả năng lưu trữ cấu hình vốn vào LocalStorage | Mở tab Staking | 1. Nhập số vốn mới vào ô `STAKING AMOUNT`.<br>2. F5 refresh lại trang web hoặc chuyển sang tab khác rồi quay lại. | Stake = `25000` POT | Ô input vẫn giữ nguyên giá trị `25000` POT mà không bị reset về giá trị mặc định 10000. | **PASS** |
| **TC-NPOS-04** | Validator Filters | Kiểm tra bộ lọc danh sách ứng viên (Binance/Polymarket style) | Bảng validator hiển thị đủ dữ liệu | 1. Bấm tab `LIVE ON-CHAIN`.<br>2. Bấm tab `OPTIMAL (Mv ≥ 0.5)`.<br>3. Bấm tab `COMM ≤ 3%`.<br>4. Bấm tab `ALL`. | Click từng button filter | - Tab `LIVE ON-CHAIN` chỉ lọc ra các node có tag `PORTALDOT V3 LIVE`.<br>- Tab `OPTIMAL` chỉ giữ lại các node có $M_v \ge 0.5$.<br>- Tab `COMM ≤ 3%` chỉ giữ node có hoa hồng $\le 3\%$.<br>- Tab `ALL` trả về đủ danh sách. | **PASS** |
| **TC-NPOS-05** | Target Selection | Kiểm tra chọn/bỏ chọn từng validator và giới hạn 16 node | Tab Staking đang mở | 1. Tích bỏ chọn 2 validator.<br>2. Kiểm tra bộ đếm Target.<br>3. Cố gắng chọn quá 16 validator nếu danh sách dài. | Checkbox toggle | Bộ đếm giảm xuống `14 / 16 TARGETS`. Khi đủ 16 node, không cho phép chọn thêm node thứ 17. Nút simulate cập nhật số lượng target tương ứng. | **PASS** |
| **TC-NPOS-06** | Bulk Target Action | Kiểm tra chức năng SELECT ALL và CLEAR danh sách mục tiêu | Tab Staking đang mở | 1. Bấm nút `CLEAR`.<br>2. Quan sát nút simulate.<br>3. Bấm nút `SELECT ALL`. | Click `CLEAR` $\rightarrow$ Click `SELECT ALL` | Khi bấm `CLEAR`, bộ đếm về `0 / 16 TARGETS` và nút `SIMULATE & SIGN NOMINATE` bị disabled (không cho bấm khi chưa chọn target). Khi bấm `SELECT ALL`, 16 node đầu tiên được chọn lại. | **PASS** |
| **TC-NPOS-07** | Validator Modal | Kiểm tra hiển thị Modal Profile và tính năng Copy SS58 | Bảng validator có dữ liệu | 1. Bấm nút `INSPECT` trên 1 hàng validator.<br>2. Bấm nút `COPY ADDRESS`.<br>3. Paste ra Notepad.<br>4. Nhấn phím `Esc`. | Validator bất kỳ | Modal mở mượt mà với hiệu ứng backdrop mờ. Nút copy chuyển thành `COPIED` trong 2 giây. Chuỗi paste ra đúng chuẩn địa chỉ SS58 (`5...`). Nhấn `Esc` modal đóng ngay lập tức. | **PASS** |
| **TC-NPOS-08** | Modal Add/Remove | Thay đổi trạng thái target trực tiếp từ trong Modal Profile | Đang mở modal 1 validator | 1. Nếu node đang được chọn, bấm `[-] REMOVE FROM SET`.<br>2. Quan sát trạng thái nút.<br>3. Bấm lại `[+] ADD TO SET`. | Toggle trong Modal | Nút bấm đổi màu và đổi nhãn tương ứng. Đóng modal kiểm tra lại ô checkbox trên bảng chính thấy trạng thái đồng bộ chính xác. | **PASS** |
| **TC-NPOS-09** | Rebalance Flow | Kiểm tra luồng tính toán Phragmén từ nút Rebalance | Đã nhập Stake và chọn target | 1. Nhập `12000` POT.<br>2. Bấm `SIMULATE & SIGN NOMINATE`.<br>3. Quan sát spinner và banner kết quả. | Stake = `12000` POT, 16 targets | Nút hiển thị spinner khi đang tính toán. Xuất hiện banner xanh lá: `ALLOCATED: 750.0 POT across 16 optimal validators`, kèm Nonce và nút `OPEN DISPATCH STUDIO`. | **PASS** |
| **TC-NPOS-10** | Substrate Dispatch | Ký duyệt và phát lệnh `staking.nominate` on-chain qua Substrate | Đang mở Dispatch Studio Modal | 1. Chọn engine `Substrate Native (SS58: 42)`.<br>2. Chọn keypair `//Alice`.<br>3. Nhập Allocation `15` POT.<br>4. Bấm `CONFIRM & BROADCAST ON-CHAIN`. | Signer = `//Alice`, Amount = `15` POT | Spinner chạy với nhãn `BROADCASTING ON-CHAIN...`. Khi xong, card receipt màu xanh ngọc hiển thị Transaction Hash (dạng `0x...`), Block Hash, Signer và các event runtime. Nút copy hash hoạt động tốt. | **PASS** |
| **TC-NPOS-11** | Substrate Bond Extra | Kiểm tra tính năng Auto-Compound bổ sung vốn `bond_extra` | Đang mở Dispatch Studio Modal | 1. Bấm nút `TEST AUTO-COMPOUND (BOND EXTRA)`.<br>2. Quan sát tiến trình thực thi. | Keypair `//Alice`, Amount = `10` POT | Nút chuyển thành `BONDING ON-CHAIN...`. Lệnh `staking.bond_extra` được phát thành công, hiển thị receipt on-chain với hành động `STAKING_BOND_EXTRA`. | **PASS** |
| **TC-NPOS-12** | MetaMask EVM Flow | Kết nối ví MetaMask và gọi Precompile Vault trên Pallet-Revive | Trình duyệt có cài tiện ích MetaMask | 1. Chuyển sang tab `MetaMask EVM`.<br>2. Bấm `CONNECT METAMASK`.<br>3. Đồng ý chuyển/thêm mạng Portaldot Testnet V3.<br>4. Bấm `CONFIRM & BROADCAST ON-CHAIN`.<br>5. Ký giao dịch trên popup MetaMask. | Mạng Portaldot Testnet V3 (Chain ID `0x190ef0a9`) | Địa chỉ ví EVM hiển thị rút gọn kèm chấm tròn xanh lá. MetaMask pop-up mở ra đúng địa chỉ hợp đồng `0x97e5707FCa341c27D7e6b5cEC5ABFe2d3498610A`. Sau khi ký, nhận được txHash EVM. | **PASS** |
| **TC-NPOS-13** | Keeper Simulation | Kiểm tra kích hoạt chu trình đánh giá tự động Staking Keeper | Tab Staking đang mở | 1. Quan sát card `ERA AUTONOMOUS STAKING KEEPER`.<br>2. Bấm nút `SIMULATE & RUN KEEPER PASS`.<br>3. Quan sát spinner và cập nhật chỉ số. | Click action | Nút hiển thị `EVALUATING INVARIANTS...`. Sau khi chạy xong, thời gian và quyết định `LAST ACTION` được cập nhật mới mà không làm đơ giao diện. | **PASS** |
| **TC-NPOS-14** | Unbond Stake Flow | Kiểm tra tạo lệnh rút vốn vào hàng đợi Unbonding 28-era | Tab Staking đang mở | 1. Tại card Unbonding Escrow, bấm `UNBOND STAKE`.<br>2. Nhập `5.0` POT.<br>3. Bấm `CONFIRM UNBOND`. | Amount = `5.0` POT | Modal đóng lại, thông báo xác nhận xuất hiện: `Extrinsic staking.unbond (5 POT) placed into 28-era queue!`. Chỉ số `QUEUED UNBONDING` cập nhật thêm số POT vừa unbond. | **PASS** |
| **TC-NPOS-15** | Withdraw Unbonded | Kiểm tra nút rút vốn tự do khi có chunk unbond đáo hạn | Tài khoản có chunk đã qua 28 Eras | 1. Kiểm tra trạng thái nút `WITHDRAW UNBONDED`.<br>2. Nếu có chunk sẵn sàng, nút chuyển sang màu xanh ngọc nhấp nháy (`WITHDRAW X POT`).<br>3. Bấm nút này. | Chunk `READY_TO_WITHDRAW` | Hệ thống gọi extrinsic `staking.withdraw_unbonded`. POT được chuyển từ trạng thái khóa sang Free Balance. Chunk đáo hạn được xóa khỏi hàng đợi. | **PASS** |

---

## 4. Hướng Dẫn Thiết Lập Môi Trường Test Nhanh (5 Phút Smoke Test)

Dành cho giám khảo hackathon hoặc lập trình viên kiểm thử nhanh tính năng:

```bash
# 1. Khởi động backend DotNexus (nếu chạy local)
python -m engine.server

# 2. Hoặc trỏ Frontend thẳng vào backend live trên cloud Render
# (Trong front-end/.env đặt: VITE_API_BASE_URL=https://dotnexus-1.onrender.com)

# 3. Khởi động Frontend
cd front-end
npm run dev
# Mở trình duyệt tại: http://localhost:5173
```

### Các bước kiểm thử nhanh trong 60 giây:
1. Mở menu trên cùng $\rightarrow$ Chọn tab **Staking & NPoS**.
2. Kiểm tra bảng hiển thị ngay lập tức trong 0ms (không bị đơ "Querying Live...").
3. Bấm nút **`SIMULATE & SIGN NOMINATE`** $\rightarrow$ Modal Dispatch Studio bật lên.
4. Bấm **`TEST AUTO-COMPOUND (BOND EXTRA)`** $\rightarrow$ Kiểm tra nhận thẻ on-chain receipt xanh ngọc xác nhận transaction hash thành công.
5. Bấm nút **`SIMULATE & RUN KEEPER PASS`** ở card Staking Keeper $\rightarrow$ Kiểm tra daemon đánh giá bất biến và cập nhật số hiệu era mới.

---

## 5. Xử Lý Các Trường Hợp Ngoại Lệ (Troubleshooting & Edge Cases)

1. **Gặp thông báo "Offline Fallback / Simulated Mode"**:
   - *Nguyên nhân*: Node Testnet công cộng `wss://test-node-v3.portaldot.dev` đang trong thời gian bảo trì hoặc reset block.
   - *Hành vi của DotNexus*: Cơ chế tự phục hồi kích hoạt Sandbox Simulation để bảo đảm giám khảo và người dùng vẫn trải nghiệm đầy đủ 100% giao diện, luồng tính toán Phragmén và quy trình sinh extrinsic mà không gặp màn hình lỗi (crash/freeze).
2. **MetaMask báo "Unrecognized chain"**:
   - DotNexus đã tích hợp sẵn mã tự động gọi `wallet_addEthereumChain` với thông số chính xác của Portaldot Network V3. Bạn chỉ cần nhấn nút **`Approve`** trên cửa sổ popup của MetaMask.
3. **Phím tắt**:
   - Bạn có thể nhấn phím **`Escape (Esc)`** bất kỳ lúc nào để đóng nhanh các cửa sổ Modal (Profile, Dispatch Studio, Unbond Escrow).
