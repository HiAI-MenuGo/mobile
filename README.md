# 📱 HiAI-MenuGo — Mobile App (Expo / React Native)

> **Ứng dụng di động quản lý vận hành nhà hàng F&B chuyên nghiệp** (POS di động, Gọi món tại bàn, Quản lý đơn bếp, Báo hết món, Kiểm kho, Báo cáo doanh thu).

---

## 🛠️ Tech Stack

- **Runtime & Framework:** Expo (~57.0.23) + React Native (0.86.3) + React (19.2.3)
- **Ngôn ngữ:** TypeScript (~6.0.3), `strict: true`
- **Điều hướng (Navigation):** Custom Tab + Hub Pattern trong `App.tsx` & `OperationsScreen.tsx` — **Không dùng React Navigation / Expo Router**
- **Quản lý State:** Zustand 5 (`useMenuStore`, `historyStore`) kết hợp local state cho `cart`, `activeTab`, `operationSubView`
- **UI & Styling:** `StyleSheet.create` kết hợp NativeWind v4 & Theme Tokens (`src/theme/index.ts`)
- **Icons:** `lucide-react-native` (^1.47.0) — Duy nhất
- **Metro Port:** `8081`

---

## 🚀 Khởi Chạy Nhanh (Getting Started)

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Khởi động Metro Bundler
```bash
npx expo start
# hoặc
npm start
```

### 3. Chạy trên thiết bị / Giả lập
- **iOS Simulator:** Nhấn `i` trong terminal hoặc `npm run ios` (yêu cầu macOS + Xcode).
- **Android Emulator / Thiết bị thật:** Nhấn `a` trong terminal hoặc `npm run android`.
- **Expo Go:** Quét mã QR hiển thị trên terminal bằng camera (iOS) hoặc app Expo Go (Android).

---

## 👥 Phân Chia Công Việc & Workflow

Chi tiết các task được phân định rõ ràng trong thư mục `docs/`:
- 📱 [docs/A_Work_Flow.md](docs/A_Work_Flow.md) — Dành cho **iOS Developer (Thành viên A)**: App Shell, HomeScreen, RevenueScreen, OrderScreen, Notification.
- 🤖 [docs/B_Work_Flow.md](docs/B_Work_Flow.md) — Dành cho **Android Developer (Thành viên B)**: OperationsHub, Orders realtime, Cashier, SoldOut, Inventory, History.
- 🌐 [docs/C_Work_Flow.md](docs/C_Work_Flow.md) — Tham chiếu API & Database từ Web Developer (Thành viên C).

---

## 📐 Cấu Trúc Dự Án

```
mobile/
├── App.tsx                     # Shell Root, Tab routing & Safe Area
├── index.ts                    # Expo Entry point
├── .agents/                    # Context, Nghiệp vụ F&B & Design System
│   ├── AGENTS.md               # Kiến trúc & Quy chuẩn kỹ thuật
│   ├── business.md             # Nghiệp vụ F&B, multi-tenant & logic bàn/đơn
│   └── skill.md                # Design System & UI/UX tokens
├── docs/                       # Hướng dẫn Workflow thành viên
├── src/
│   ├── types/index.ts          # Type definitions trung tâm
│   ├── theme/index.ts          # Color tokens, radii, shadows
│   ├── data/                   # Zustand stores & mockData
│   ├── components/             # BottomNav, FloatingDock, Stepper, Modal
│   └── screens/                # Home, Revenue, Order, Operations, Settings
│       └── operations/         # Cashier, Orders, Tables, SoldOut, Inventory, History
```

---

## ⚠️ Quy Tắc Kỹ Thuật Quan Trọng

1. **Tuyệt đối không cài React Navigation / Expo Router:** Điều hướng hoàn toàn qua `activeTab` và `operationSubView`.
2. **Composite Key cho món trong Cart:** Định danh `${item.id}__${JSON.stringify(modifiers)}__${note}`.
3. **Safe Area Insets:** Luôn dùng `useSafeAreaInsets()` (`insets.top`, `insets.bottom`).
4. **Theme Tokens:** Luôn import từ `theme.colors.*`, không hardcode mã hex rải rác.
