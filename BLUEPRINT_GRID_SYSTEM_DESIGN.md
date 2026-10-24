# DotNexus Blueprint Grid & Section Divider System
## Kiến Trúc Phân Tích & Đặc Tả Thiết Kế Hệ Thống Khung Lưới UI Cho LandingPage.tsx

---

## 1. TỔNG QUAN & MỤC TIÊU THIẾT KẾ (EXECUTIVE SUMMARY)

Bản đặc tả này chuẩn hóa và nâng cấp toàn diện ngôn ngữ thiết kế của **DotNexus** (Visual Control Plane & Automated Security Operations Engine for Portaldot Network V3.0) từ giao diện các card bo tròn rời rạc sang **Hệ thống Khung lưới Kỹ thuật (Blueprint Structural Grid & Section Divider System)** lấy cảm hứng từ các công cụ developer cao cấp như **Zeabur**, **Vercel Geist**, và **Railway**.

### Triết Lý Thiết Kế Cốt Lõi:
1. **Cấu Trúc Bản Vẽ Kỹ Thuật (Engineering Blueprint Architecture)**:
   - Toàn bộ layout liên kết với nhau bằng các đường gióng hairline 1px sắc nét (`border-white/[0.08]`), không dùng bo góc ngoài (`rounded-none` cho container cấu trúc).
   - Từng phân đoạn section khóa chặt vào nhau như các khối máy chủ racked trong trung tâm dữ liệu.
2. **Đường Ray Dọc Liền Mạch (Continuous Vertical Rails) & Đường Cắt Ngang Tràn Màn Hình (Full-Bleed 100vw Dividers)**:
   - Cột gióng trung tâm cố định ở `max-w-7xl mx-auto border-x border-white/[0.08] relative` chạy xuyên suốt từ đỉnh đến chân trang.
   - Các đường phân cách ngang kéo dài 100% viewport (`100vw`, `w-full border-b border-white/[0.08]`).
3. **Mỏ Neo Giao Điểm Kỹ Thuật (Intersection Corner Crosshairs `+`)**:
   - Tại 4 điểm giao nhau chính xác nơi đường ray dọc gặp đường phân cách ngang, tự động gắn các biểu tượng chữ thập kỹ thuật `<CornerCrosshair />` kích thước `9x9px` tọa độ `[-5px, -5px]`.
4. **Dải Ngăn Cách Kỹ Thuật (Technical Spacer Strips)**:
   - Các dải phân cách `<SectionDivider />` chiều cao `h-12` đến `h-16` với 3 biến thể:
     - `hatched`: Họa tiết vạch chéo 45 độ `repeating-linear-gradient`.
     - `dots`: Ma trận chấm ma trận 1px cách nhau 12px `radial-gradient`.
     - `glow`: Tia sáng beam gradient ngang 1px (`from-transparent via-violet-500/50 to-transparent`).
5. **Lưới Bento Không Khoảng Trống, Chung Đường Viền (Zero-Gap Shared-Border Bento Grid)**:
   - Các card tính năng chia sẻ chung 1px viền (`divide-y md:divide-y-0 md:divide-x divide-white/[0.08]`), không tạo khoảng trống (gap-0), tích hợp spotlight hover phản hồi tức thì và chỉ số telemetry đơn cách `tabular-nums font-mono`.

---

## 2. PHÂN TÍCH HIỆN TRẠNG `LandingPage.tsx` & CÁC ĐIỂM CẦN NÂNG CẤP

Hiện tại, file [LandingPage.tsx](file:///D:/Coding/Portaldot%20Hacker%20house%202026/DotNexus/front-end/src/views/LandingPage.tsx) sở hữu đầy đủ nội dung nghiệp vụ sâu về Portaldot Network V3.0 (WASM consensus + Frontier EVM, Slashing Guard, NPoS Phragmén, RPC Shield, Visual DAG Canvas), tuy nhiên về mặt thị giác cấu trúc UI còn một số hạn chế:

| Vị trí / Section trong `LandingPage.tsx` | Hiện trạng thiết kế | Vấn đề / Điểm trừ thị giác | Giải pháp nâng cấp với Blueprint Grid |
| :--- | :--- | :--- | :--- |
| **Tổng thể Layout** | Các thẻ `<section>` rời rạc, border-t ngắt quãng tại max-w-6xl | Thiếu sự liền mạch trục dọc, không có cảm giác một hệ thống máy chủ liền khối | Bọc trong `<BlueprintSection>` với đường ray `max-w-7xl border-x` và đường cắt `w-full border-b` 100vw |
| **Điểm giao cắt viền** | Gắn thủ công các ký tự `+` bằng text span không đồng bộ tọa độ | Tọa độ lệch, font size chữ thập to nhỏ không đều (`text-xs` vs `text-[9px]`) | Dùng primitive `<CornerCrosshair />` SVG 9x9px căn chuẩn vector tại `[-5px, -5px]` |
| **Khoảng đệm giữa các Section** | Chỉ có padding `py-20` hoặc `py-24` kèm `border-t` đơn điệu | Chuyển cảnh giữa Hero → Marquee → Pillars bị đột ngột, thiếu nhịp điệu kỹ thuật | Bổ sung các dải `<SectionDivider>` với 3 biến thể: `hatched`, `dots`, `glow` |
| **Hero Ticker Mini-Cards** | Bọc trong container `rounded-2xl` với 4 card con `rounded-xl` | Card con bo góc gây khoảng hở lãng phí diện tích, thiếu tính kỷ luật kỹ thuật | Chuyển thành Zero-Gap Shared-Border Strip 4 cột không gap, bo góc phẳng |
| **Marquee Protocol Stack** | Bọc trong thẻ div `border-y` thông thường, các item bo tròn viên thuốc | Thiếu các vách ngăn kỹ thuật dạng ô rack giữa các công nghệ | Tích hợp vách ngăn chia sẻ trục dọc giữa từng chip giao thức |
| **The 4 Pillars Bento Grid** | Lưới `gap-3.5` với các `SpotlightCard rounded-xl` | Các card cách nhau bởi rãnh trống, viền kép không tiếp giáp | Chuyển sang Zero-Gap Bento Grid (`divide-x divide-y`), các card tiếp giáp 1px |
| **DAG Runbook Canvas** | Container ngoài `rounded-2xl`, thanh terminal bo viền | Khung canvas bị bo tròn quá mức so với giao diện visual DAG kỹ thuật | Vuốt phẳng viền ngoài `rounded-none`, định vị 4 mỏ neo `+` trên 4 góc canvas |
| **Bảng So Sánh & Roadmap** | Bảng table bọc `rounded-2xl`, line roadmap dùng nét bo | Chưa đồng bộ với ngôn ngữ khung lưới | Giữ nguyên logic dữ liệu, khóa phẳng vào ray dọc `max-w-7xl` |

---

## 3. BẢNG MÀU & ĐẶC TẢ BỀ MẶT THỊ GIÁC (COLOR & SURFACE PALETTE)

Hệ thống khung lưới DotNexus được thiết kế hài hòa giữa sắc đen Obsidian sâu thẳm của Zeabur và ánh tím huỳnh quang đặc trưng của Substrate/EVM:

```
+-----------------------------------------------------------------------------------+
|  SURFACE: Deep Obsidian #06040A / #07040E / #090516                              |
|  HAIRLINE BORDERS: 1px border-white/[0.08] (Default) -> border-white/[0.18] (Active)|
|  ACCENTS: Substrate Pink #E6007A | EVM Indigo #6366F1 | Consensus Violet #8B5CF6  |
|  CROSSHAIR CORNERS: Crisp 9x9px [+] text-zinc-500 -> text-[#8B5CF6] on hover      |
+-----------------------------------------------------------------------------------+
```

- **Màu nền gốc (Background)**:
  - Outer Viewport: `#06040A` (Deep Obsidian).
  - Central Rail Strip: `#07040E` / `#080512`.
  - Grid Card Surfaces: `#090516]/80` với backdrop blur nhẹ.
- **Đường viền kết cấu (Hairline Borders)**:
  - Default: `border-white/[0.08]` (tương đương `rgba(255, 255, 255, 0.08)`).
  - Hover / Focus / Active: `border-white/[0.18]` hoặc `border-[#8B5CF6]/50`.
  - Top Reflection Accent: Dải gradient 1px `from-transparent via-white/[0.12] to-transparent` trên cạnh trên mỗi card.
- **Typography & Con số thời gian thực**:
  - Tiêu đề & Nhãn: `font-mono text-xs uppercase tracking-wider`.
  - Số liệu Telemetry (Blocks, Latency, APY): bắt buộc `tabular-nums font-mono`.

---

## 4. CHI TIẾT CÁC COMPONENT PRIMITIVES ĐÃ XÂY DỰNG

Hệ thống thành phần tái sử dụng được đặt tại thư mục `front-end/src/components/blueprint/`:

```
front-end/src/components/blueprint/
├── CornerCrosshair.tsx       # Mỏ neo chữ thập kỹ thuật 9x9px (+)
├── SectionDivider.tsx        # Dải ngăn cách kỹ thuật (hatched, dots, glow)
├── BlueprintSection.tsx      # Khung section tràn màn hình + ray dọc max-w-7xl
├── ZeroGapBento.tsx          # Lưới bento không khoảng cách, chung đường viền
└── index.ts                  # Barrel export
```

### 4.1. `<CornerCrosshair />` & `<IntersectionCrosshairs />`
Định vị chuẩn xác chữ thập 9x9px tại 4 góc ngoài giao điểm:
```tsx
// Tọa độ bù âm 5px chính xác:
// Top-Left: -top-[5px] -left-[5px]
// Top-Right: -top-[5px] -right-[5px]
// Bottom-Left: -bottom-[5px] -left-[5px]
// Bottom-Right: -bottom-[5px] -right-[5px]

<IntersectionCrosshairs top={true} bottom={true} color="text-zinc-500" />
```

### 4.2. `<SectionDivider />`
Dải ngăn cách kỹ thuật giữa các block lớn:
- **Biến thể `hatched`**: Dùng CSS `repeating-linear-gradient(45deg, rgba(255,255,255,0.03)...)` tạo sọc chéo vi mô tinh tế.
- **Biến thể `dots`**: Dùng CSS `radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)` với kích thước ô 12x12px.
- **Biến thể `glow`**: Tia sáng gradient 1px chạy ngang mép trên `from-transparent via-[#8B5CF6]/50 to-transparent`.
- **Hỗ trợ Label kỹ thuật**: Hiển thị badge kỹ thuật ở trung tâm (ví dụ: `// SYS.DIVIDER.01 // CORE_PILLARS`).

### 4.3. `<BlueprintSection />`
Component khung nền cho mỗi section:
- Phía ngoài: `w-full border-b border-white/[0.08] relative`.
- Phía trong: `max-w-7xl mx-auto border-x border-white/[0.08] relative px-4 sm:px-6`.
- Tự động gắn crosshair tại các điểm giao cắt.

### 4.4. `<ZeroGapGrid />` & `<ZeroGapCard />`
Lưới Bento không rãnh hở:
- Áp dụng `divide-y md:divide-y-0 md:divide-x divide-white/[0.08] border border-white/[0.08]`.
- Hiệu ứng Spotlight bám theo con trỏ chuột (`radial-gradient`).
- 4 mỏ neo tick con `+` ở 4 góc trong mỗi ô.

---

## 5. BẢN ĐỒ PHỐI TRÍ BLUEPRINT CHO `LandingPage.tsx`

Dưới đây là sơ đồ phối trí trục dọc toàn diện của Landing Page sau khi tích hợp hệ thống Blueprint:

```
[Viewport 100vw]
======================================================================================
|| TOP NAVBAR: w-full border-b border-white/[0.08]                                  ||
======================================================================================
|                                    |                        |                      |
|                                    |<--- max-w-7xl rail --->|                      |
|                                    |                        |                      |
+------------------------------------+[+]------------------[+]+----------------------+
| SECTION 1: HERO SECTION                                                            |
| - ThreeCanvas WebGL Mesh Background                                                |
| - Hero Title & CTA Action Buttons                                                  |
| - ZERO-GAP TICKER STRIP (WASM Block | EVM RPC | Slashing Guard | POT Staking APY)  |
+------------------------------------+[+]------------------[+]+----------------------+
| SECTION DIVIDER 1: variant="hatched" (h-14)                                        |
| Label: "// PROTOCOL_STACK // RUNTIME_TOPOLOGY"                                     |
+------------------------------------+[+]------------------[+]+----------------------+
| SECTION 2: PROTOCOL ECOSYSTEM MARQUEE                                              |
| - Infinite Carousel with lateral gradient fade masks                               |
| - Substrate WASM / Frontier EVM / GRANDPA / BABE / Phragmén / POT 14 Decimals      |
+------------------------------------+[+]------------------[+]+----------------------+
| SECTION DIVIDER 2: variant="glow" (h-12)                                           |
| Label: "// MISSION_CRITICAL // 4_ENGINE_PILLARS"                                   |
+------------------------------------+[+]------------------[+]+----------------------+
| SECTION 3: THE 4 MISSION-CRITICAL PILLARS (ZERO-GAP BENTO GRID)                    |
| +-----------------------------------------------+--------------------------------+ |
| | PILLAR 01: Dual-Engine Tracker & Parity Deck  | PILLAR 02: Slashing Mutex Guard| |
| | (Span 2 cols on Desktop, Real-time Parity)    | (Span 1 col, Atomic Self-Fence)| |
| +-----------------------------------------------+--------------------------------+ |
| | PILLAR 03: NPoS Yield Optimizer (17.13% APY)  | PILLAR 04: RPC Anti-Spam Shield| |
| | (Span 1 col, Sequential Phragmén)             | (Span 2 cols, <0.25ms Zero-Copy| |
| +-----------------------------------------------+--------------------------------+ |
+------------------------------------+[+]------------------[+]+----------------------+
| SECTION DIVIDER 3: variant="dots" (h-14)                                           |
| Label: "// AUTOMATION_ENGINE // VISUAL_DAG_PIPELINE"                               |
+------------------------------------+[+]------------------[+]+----------------------+
| SECTION 4: VISUAL DAG RUNBOOK AUTOMATION CANVAS                                    |
| - RealCanvasMockupBoard (Interactive Topology & Bezier Wire Routing)               |
| - Live Terminal Trace Log Drawer (Step-by-step execution simulation)               |
+------------------------------------+[+]------------------[+]+----------------------+
| SECTION DIVIDER 4: variant="hatched" (h-14)                                        |
| Label: "// ARCHITECTURAL_AUDIT // BENCHMARK_MATRIX"                                |
+------------------------------------+[+]------------------[+]+----------------------+
| SECTION 5: COMPETITIVE BENCHMARK MATRIX                                            |
| - Zero-radius Blueprint Table (Linux CLI vs Prometheus vs DotNexus)                |
+------------------------------------+[+]------------------[+]+----------------------+
| SECTION DIVIDER 5: variant="glow" (h-12)                                           |
| Label: "// DELIVERY_ROADMAP // HACKER_HOUSE_2026"                                  |
+------------------------------------+[+]------------------[+]+----------------------+
| SECTION 6: DELIVERY LINE JOURNEY (ROADMAP)                                         |
| - 4-Station Conduit Rail: Oct 14 -> Oct 24 -> Nov 06 -> Nov 07 Demo Day            |
+------------------------------------+[+]------------------[+]+----------------------+
| FOOTER: Minimalist Developer Footer with SS58: 42 & POT Decimals: 14 Indicator     |
======================================================================================
```

---

## 6. SO SÁNH CODE CHI TIẾT TRƯỚC VÀ SAU ÁP DỤNG

### 6.1. Hero Live Cluster Ticker Strip
- **Trước**:
  ```tsx
  <div className="max-w-4xl mx-auto p-3 sm:p-4 rounded-2xl border border-white/[0.08] bg-[#110A24]/95 grid grid-cols-1 sm:grid-cols-4 gap-2.5 sm:gap-3">
    <div className="p-3.5 rounded-xl bg-[#080512] border border-white/[0.06] ...">...</div>
    ...
  </div>
  ```
- **Sau (Blueprint Zero-Gap)**:
  ```tsx
  <div className="max-w-5xl mx-auto border border-white/[0.08] bg-[#07040E] grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08] rounded-none shadow-2xl relative">
    <CornerCrosshair position="top-left" />
    <CornerCrosshair position="top-right" />
    <CornerCrosshair position="bottom-left" />
    <CornerCrosshair position="bottom-right" />
    <div className="p-4 bg-[#080512]/90 hover:bg-white/[0.02] transition-colors relative">...</div>
    ...
  </div>
  ```

### 6.2. The 4 Pillars Bento Grid
- **Trước**:
  ```tsx
  <div className="relative p-3 sm:p-5 rounded-2xl border border-white/[0.08] bg-[#090516]/60">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
      <SpotlightCard className="md:col-span-2 rounded-xl ...">...</SpotlightCard>
      <SpotlightCard className="rounded-xl ...">...</SpotlightCard>
    </div>
  </div>
  ```
- **Sau (Blueprint Zero-Gap Bento)**:
  ```tsx
  <div className="relative border border-white/[0.08] bg-[#06040A] rounded-none shadow-2xl">
    <CornerCrosshair position="top-left" color="text-[#8B5CF6]" />
    <CornerCrosshair position="top-right" color="text-[#8B5CF6]" />
    <CornerCrosshair position="bottom-left" color="text-[#8B5CF6]" />
    <CornerCrosshair position="bottom-right" color="text-[#8B5CF6]" />

    {/* Row 1: Pillar 01 (Span 2) + Pillar 02 (Span 1) */}
    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.08] border-b border-white/[0.08]">
      <ZeroGapCard className="md:col-span-2 p-6 md:p-8" spotlightColor="rgba(230, 0, 122, 0.16)">
        {/* Pillar 01 Content */}
      </ZeroGapCard>
      <ZeroGapCard className="p-6 md:p-8" spotlightColor="rgba(168, 85, 247, 0.16)">
        {/* Pillar 02 Content */}
      </ZeroGapCard>
    </div>

    {/* Row 2: Pillar 03 (Span 1) + Pillar 04 (Span 2) */}
    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
      <ZeroGapCard className="p-6 md:p-8" spotlightColor="rgba(192, 132, 252, 0.16)">
        {/* Pillar 03 Content */}
      </ZeroGapCard>
      <ZeroGapCard className="md:col-span-2 p-6 md:p-8" spotlightColor="rgba(56, 189, 248, 0.16)">
        {/* Pillar 04 Content */}
      </ZeroGapCard>
    </div>
  </div>
  ```

---

## 7. KẾ HOẠCH TRIỂN KHAI VÀO `LandingPage.tsx` (NEXT STEPS)

1. **Import Primitives**:
   Import `BlueprintSection`, `SectionDivider`, `CornerCrosshair`, `ZeroGapCard` từ `@/components/blueprint` vào `LandingPage.tsx`.
2. **Bọc Hero Section**:
   Áp dụng `BlueprintSection` bọc Hero, giữ nguyên WebGL `<ThreeCanvas />` chạy nền không bị ngắt quãng.
3. **Chèn Technical Spacers**:
   Đặt 5 dải `SectionDivider` với các variant phù hợp (`hatched` -> `glow` -> `dots` -> `hatched` -> `glow`).
4. **Tái Cấu Trúc Pillars Thẻ Bento**:
   Thay thế khối `SpotlightCard` bo tròn bằng kiến trúc Zero-Gap 2 hàng tiếp giáp 1px.
5. **Đồng Bộ Hoá Khung DAG Canvas & Table**:
   Chuyển container DAG sang viền phẳng kỹ thuật `rounded-none`, giữ trọn vẹn tương tác kéo thả node và Bezier wire routing của InteractiveCanvas.
6. **Kiểm Thử Toàn Diện**:
   - Chạy `npm run build` xác nhận không có lỗi TypeScript hay Tailwind CSS.
   - Chạy `python -m unittest tests/test_engine.py` bảo đảm 100% backend unit test tiếp tục pass.

---
*DotNexus Architectural Specifications — Portaldot Hacker House 2026*
