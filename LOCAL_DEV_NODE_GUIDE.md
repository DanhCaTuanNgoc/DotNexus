# Hướng Dẫn Cài Đặt & Khởi Chạy Portaldot Local Dev Node V3.0
> **Dự Án**: DotNexus — Control Plane & Automated Security Operations Engine  
> **Mục Đích**: Khởi tạo mạng Substrate WASM + EVM cục bộ (`ws://127.0.0.1:9944`) để DotNexus kéo dữ liệu On-Chain thời gian thực.  
> **Căn Cứ Kỹ Thuật**: Trích xuất từ tài liệu chính thức [`technique_informations.md`](./technique_informations.md) và kho binary `portaldotVolunteer/Portaldot-node`.

---

## 1. Thông Tin Tổng Quan & Nguồn Tải Binary

Do Portaldot Network V3.0 hiện chưa mở Public Testnet RPC công khai (xác nhận từ Ban Tổ Chức trong kênh Discord), việc chạy node cục bộ là phương thức chuẩn để phát triển, tích hợp và demo sản phẩm.

* **Repository Binary Chính Thức**: [portaldotVolunteer/Portaldot-node](https://github.com/portaldotVolunteer/Portaldot-node/)
* **Link Tải Trực Tiếp (Bản Ubuntu x86_64 Khuyên Dùng)**:
  - **Bản Testnet (Khuyên dùng)**:  
    `https://raw.githubusercontent.com/portaldotVolunteer/Portaldot-node/main/portaldot-testnet-ubuntu.tar.gz`
  - **Bản Mainnet**:  
    `https://raw.githubusercontent.com/portaldotVolunteer/Portaldot-node/main/portaldot-mainnet-ubuntu.tar.gz`
* **Thông Số Mạng Mặc Định**:
  - **Substrate WebSocket RPC**: `ws://127.0.0.1:9944` (hoặc `0.0.0.0:9944`)
  - **Frontier / EVM JSON-RPC**: `http://127.0.0.1:8545`
  - **P2P Libp2p Consensus Port**: `30333`
  - **SS58 Prefix**: `42` (Ví bắt đầu bằng tiền tố số `5...`)
  - **Native Token**: `POT` (Decimals: `14` Planck)

---

## 2. Quy Trình Cài Đặt Trên Linux (Ubuntu / Debian / WSL)

Nếu bạn đang dùng máy tính Windows, hãy mở terminal **WSL (Ubuntu)**. Nếu chưa có WSL, xem [Mục 4](#4-dành-riêng-cho-windows-cài-nhanh-wsl-ubuntu) bên dưới.

### Bước 1: Chuẩn bị thư mục và tải gói Binary
Mở Terminal Linux / WSL và chạy các lệnh sau:

```bash
# 1. Tạo thư mục chứa node
mkdir -p ~/portaldot-node && cd ~/portaldot-node

# 2. Tải bản Testnet Ubuntu chính thức từ GitHub
wget https://raw.githubusercontent.com/portaldotVolunteer/Portaldot-node/main/portaldot-testnet-ubuntu.tar.gz

# 3. Giải nén file nén
tar -xvf portaldot-testnet-ubuntu.tar.gz

# 4. Di chuyển vào thư mục đã giải nén
cd portaldot-testnet-ubuntu
ls -la
```

Sau khi giải nén, file thực thi `portaldot_dev` nằm bên trong thư mục `portaldot-testnet-ubuntu/`.

---

### Bước 2: Cấp quyền thực thi cho Binary
```bash
chmod +x portaldot_dev
```

---

### Bước 3: Khởi chạy Node ở chế độ Dev Mode

Chạy lệnh với đầy đủ tham số để mở cổng cho cả Substrate RPC và EVM RPC cho DotNexus kết nối:

```bash
./portaldot_dev \
  --dev \
  --tmp \
  --alice \
  --ws-port 9944 \
  --ws-external \
  --rpc-port 9933 \
  --rpc-cors all \
  --rpc-methods unsafe \
  --rpc-external
```

#### Giải thích các tham số khởi chạy:
* `--dev`: Chạy cấu hình chuỗi ở chế độ phát triển (chu kỳ ra block 6 giây, tự động sản sinh block đơn lẻ).
* `--tmp`: Lưu database tạm thời trong RAM (`/tmp`), tự dọn dẹp sạch khi tắt để tránh lỗi dirty state.
* `--alice`: Sử dụng tài khoản mặc định `//Alice` làm Validator duy nhất đóng block (tài khoản này được pre-fund sẵn hàng triệu token POT).
* `--rpc-port 9944`: Mở cổng WebSocket RPC tại port `9944` (DotNexus lắng nghe tại đây).
* `--rpc-cors all`: Cho phép Frontend trình duyệt kết nối trực tiếp không bị chặn chính sách CORS.
* `--rpc-methods unsafe`: Cho phép gọi các hàm quản trị nội bộ (`author_rotateKeys`, `author_insertKey` cho module Slashing Guard).
* `--rpc-external`: Lắng nghe trên mọi interface mạng (`0.0.0.0`), đảm bảo máy host Windows truy cập được vào WSL.

---

## 3. Kiểm Tra Node Đã Chạy Thành Công

### 1. Kiểm tra log trên Terminal Linux:
Nếu thấy các dòng log tương tự bên dưới là node đã hoạt động bình thường:
```text
2026-10-15 17:30:00 [Substrate] 📦 Highest known block at #1
2026-10-15 17:30:06 [Substrate] 🔨 Initializing Genesis block/state (state: 0x... header: 0x...)
2026-10-15 17:30:12 [Substrate] ✨ Imported #2 (0x... -> 0x...)
2026-10-15 17:30:12 [Substrate] 💤 Idle (0 peers), best: #2, finalized #0
```

### 2. Kiểm tra từ Terminal Windows (PowerShell):
Mở PowerShell trên Windows và kiểm tra xem cổng 9944 đã thông mạch chưa:
```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 9944
```
*Kết quả `TcpTestSucceeded: True` nghĩa là cổng đã kết nối hoàn hảo.*

### 3. Tương tác với DotNexus:
Sau khi node chạy:
1. Mở giao diện DotNexus trên trình duyệt (`http://localhost:5173/`).
2. Vào màn hình **Staking & NPoS** hoặc **Dual-VM Monitor**.
3. DotNexus Backend sẽ tự động phát hiện cổng `:9944` mở, đọc `ActiveEra` và `Session.Validators` trực tiếp từ chuỗi thay vì dùng dữ liệu mẫu.

---

## 4. Dành Riêng Cho Windows (Cài Nhanh WSL Ubuntu Nếu Đã Xoá)

Do bạn đã xóa môi trường Linux cũ trên máy Windows, bạn có thể dựng lại Ubuntu trong 2 phút bằng các bước sau:

1. Mở PowerShell với quyền **Run as Administrator**.
2. Cài đặt bản phân phối Ubuntu mới nhất:
   ```powershell
   wsl --install -d Ubuntu
   ```
3. Sau khi máy cài xong, một cửa sổ Ubuntu Terminal sẽ mở lên yêu cầu bạn đặt `Username` và `Password`.
4. Sau khi hoàn tất, bạn chỉ cần copy chuỗi lệnh 1 dòng dưới đây dán vào Ubuntu Terminal để cài và chạy node ngay lập tức:

```bash
mkdir -p ~/portaldot-node && cd ~/portaldot-node && \
wget https://raw.githubusercontent.com/portaldotVolunteer/Portaldot-node/main/portaldot-testnet-ubuntu.tar.gz && \
tar -xvf portaldot-testnet-ubuntu.tar.gz && \
cd portaldot-testnet-ubuntu && \
chmod +x portaldot_dev && \
./portaldot_dev --dev --tmp --alice --ws-port 9944 --ws-external --rpc-port 9933 --rpc-cors all --rpc-methods unsafe --rpc-external
```

---

## 5. Các Lệnh Quản Lý & Tắt Node

* **Tạm dừng node**: Nhấn tổ hợp phím `Ctrl + C` trên Terminal đang chạy node.
* **Tắt cưỡng bức (Kill process)** nếu node bị treo trong background:
  ```bash
  pkill -f portaldot_dev
  # hoặc
  pkill -f portaldot
  ```
* **Chạy ngầm (Background / Daemon)** nếu không muốn giữ tab terminal:
  ```bash
  nohup ./portaldot_dev --dev --tmp --alice --rpc-port 9944 --rpc-cors all --rpc-methods unsafe --rpc-external > ~/portaldot-node/node.log 2>&1 &
  ```
  *(Để theo dõi log: `tail -f ~/portaldot-node/node.log`)*.
