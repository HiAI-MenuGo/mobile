# 📱 HiAI-MenuGo — Mobile App (Expo / React Native)

> **Ứng dụng di động quản lý vận hành nhà hàng F&B** dành cho nhân viên bếp, thu ngân và phục vụ — xây dựng bằng **Expo ~57 + React Native 0.86.3 + React 19**.

---

## 🛠️ Tech Stack

| Tầng | Công nghệ |
|---|---|
| Runtime & Framework | **Expo ~57.0.23** + **React Native 0.86.3** + **React 19.2.3** |
| Ngôn ngữ | **TypeScript ~6.0.3**, `strict: true` |
| Navigation | Custom Tab + Hub Pattern (`App.tsx` & `OperationsScreen.tsx`) — **Không dùng React Navigation / Expo Router** |
| State | **Zustand 5** (`useMenuStore`, `historyStore`) + local `useState` cho `cart`, `activeTab`, `operationSubView` |
| Styling | `StyleSheet.create` + **NativeWind v4** + Theme Tokens (`src/theme/index.ts`) |
| Icons | **lucide-react-native** (^1.47.0) — Duy nhất |
| Realtime | **Socket.IO Client 4.8** (kết nối backend chung) |
| HTTP | **Axios 1.20** |
| Storage | **expo-secure-store** (lưu token an toàn) |
| Audio | **expo-audio** (chuông báo đơn mới) |
| Image | **expo-image-picker** + **react-native-svg** |
| Animation | **react-native-reanimated 4.5** |
| Safe Area | **react-native-safe-area-context 5.7** |

---

## 🗂️ Cấu Trúc Dự Án

```
mobile/
├── App.tsx                          # Root shell: SafeArea + Custom Tab routing + Cart state
├── index.ts                         # Expo Entry point (registerRootComponent)
├── app.json                         # Expo config (portrait, light theme)
├── .agents/                         # Ngữ cảnh cho AI Agent
│   ├── AGENTS.md                    # Entry point điều phối
│   ├── BUSINESS.md                  # Nghiệp vụ F&B
│   ├── TECHS.md                     # Tech stack chi tiết
│   ├── RULES.md                     # Luật bắt buộc
│   ├── SKILLS.md                    # Design System
│   └── SYSTEM.md                    # System design
├── src/
│   ├── types/
│   │   └── index.ts                 # Type definitions trung tâm (TabType, OperationSubView, MenuItem, CartItem, LiveOrder...)
│   ├── theme/
│   │   └── index.ts                 # Color tokens, radii, shadows (LUÔN import từ đây)
│   ├── data/
│   │   ├── mockData.ts              # Dữ liệu mẫu (dev)
│   │   └── menuStore.ts             # Zustand store: useMenuStore, historyStore
│   ├── services/
│   │   └── api.ts                   # Axios instance + API calls
│   ├── hooks/                       # Custom hooks
│   ├── components/
│   │   ├── BottomNav.tsx            # Thanh điều hướng dưới cùng (5 tabs)
│   │   └── ...                      # Các component dùng chung
│   └── screens/
│       ├── LoginScreen.tsx          # Đăng nhập
│       ├── HomeScreen.tsx           # Tổng quan nhanh, thống kê ca
│       ├── OrderScreen.tsx          # POS gọi món (menu + giỏ hàng)
│       ├── OperationsScreen.tsx     # Hub vận hành (điều phối sub-views)
│       ├── RevenueScreen.tsx        # Doanh thu & phân tích
│       ├── NotificationScreen.tsx   # Thông báo hệ thống
│       ├── SettingsScreen.tsx       # Cài đặt người dùng & app
│       └── operations/              # 10 sub-views vận hành
│           ├── OrdersScreen.tsx     # Quản lý đơn hàng live
│           ├── CashierScreen.tsx    # Thu ngân / Thanh toán
│           ├── TablesScreen.tsx     # Sơ đồ bàn
│           ├── SoldOutScreen.tsx    # Báo hết món
│           ├── InventoryScreen.tsx  # Kiểm kê kho nguyên liệu
│           ├── HistoryScreen.tsx    # Lịch sử đơn hàng
│           ├── ItemOptionsScreen.tsx        # Tùy chọn modifier cho món
│           ├── MenuItemFormScreen.tsx       # Form tạo/sửa món
│           ├── ModifierDetailScreen.tsx     # Chi tiết modifier group
│           └── PrepTimeDetailScreen.tsx     # Thời gian chế biến
├── .env                             # Biến môi trường (không commit)
├── .env.example                     # Template biến môi trường
├── package.json
├── babel.config.js
├── metro.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## 🗺️ Navigation Architecture

Ứng dụng dùng **Custom Hub Pattern** — không có React Navigation hay Expo Router:

```
App.tsx
 └── BottomNav (5 tabs)
      ├── Home        → HomeScreen
      ├── Order       → OrderScreen (POS + Cart)
      ├── Operations  → OperationsScreen (Hub)
      │                   ├── orders          → OrdersScreen (Quản lý đơn live)
      │                   ├── cashier         → CashierScreen
      │                   ├── tables          → TablesScreen
      │                   ├── sold-out        → SoldOutScreen
      │                   ├── inventory       → InventoryScreen
      │                   ├── history         → HistoryScreen
      │                   ├── item-options    → ItemOptionsScreen
      │                   ├── menu-item-form  → MenuItemFormScreen
      │                   ├── modifier-detail → ModifierDetailScreen
      │                   └── prep-time       → PrepTimeDetailScreen
      ├── Revenue     → RevenueScreen
      └── Settings    → SettingsScreen
```

Điều hướng qua state: `activeTab` (tab chính) và `operationSubView` (sub-view trong Operations).

---

## 🚀 Khởi Chạy Nhanh

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Tạo file môi trường

```bash
cp .env.example .env
# Chỉnh sửa .env
```

Biến môi trường:

| Biến | Ví dụ | Mô tả |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `http://192.168.1.x:5000/api` | URL Backend API |

> ⚠️ **Quan trọng:** Khi test trên thiết bị thật hoặc máy ảo, **không dùng `localhost`** — thay bằng **IP LAN** của máy chạy backend (ví dụ: `http://192.168.1.100:5000/api`). Dùng `ipconfig` (Windows) hoặc `ifconfig` (macOS/Linux) để biết IP.

### 3. Khởi động Metro Bundler

```bash
npm start
# hoặc
npx expo start
```

### 4. Chạy trên thiết bị / Giả lập

- **iOS Simulator:** Nhấn `i` trong terminal hoặc `npm run ios` (yêu cầu macOS + Xcode)
- **Android Emulator / Thiết bị thật:** Nhấn `a` hoặc `npm run android`
- **Expo Go:** Quét mã QR hiển thị trên terminal bằng camera (iOS) hoặc app Expo Go (Android)

Metro chạy tại cổng **8081** — không tự ý thay đổi.

---

## ⚡ Realtime — Socket.IO

App kết nối Socket.IO tới backend chung (cùng instance với Web):

- Join room `branch:{branchId}` sau khi đăng nhập
- Nhận events: `order:new`, `order:updated`, `sold_out:updated`, `payment:completed`, `session:closed`...
- Quản lý đơn (`OrdersScreen`) tự refresh realtime khi có đơn mới/cập nhật

---

## 🔐 Auth & Storage

- Token lưu trong **expo-secure-store** (mã hóa native — không AsyncStorage thô)
- Access token (15 phút) + tự refresh khi 401
- Gửi `Authorization: Bearer <token>` với mọi API request qua Axios

---

## 🎨 Design System

Toàn bộ màu sắc, khoảng cách và shadow được định nghĩa trong `src/theme/index.ts`:

```typescript
import { theme } from '@/theme';

// Luôn dùng:
theme.colors.primary
theme.colors.background
theme.radii.md
theme.shadows.card
```

**Tuyệt đối không hardcode hex** như `#FF5733` rải rác trong file. Mọi màu phải từ `theme.colors.*`.

---

## 🛒 Cart Item Key (Composite)

Khi khách chọn cùng một món với tùy chọn khác nhau, hệ thống tạo key phân biệt:

```typescript
const cartItemId = `${item.id}__${JSON.stringify(modifiers)}__${note}`;
```

Điều này đảm bảo *1 Trà Đào 50% đường* và *1 Trà Đào 100% đường* là **2 dòng riêng biệt** trong giỏ hàng và trên phiếu bếp.

---

## 📋 Phân Chia Công Việc

| Thành viên | Platform | Màn hình phụ trách |
|---|---|---|
| **A (iOS)** | iPhone | App Shell, HomeScreen, RevenueScreen, OrderScreen, NotificationScreen |
| **B (Android)** | Android | OperationsHub, Live Orders, CashierScreen, SoldOutScreen, InventoryScreen, HistoryScreen |

Chi tiết task: `docs/A_Work_Flow.md` và `docs/B_Work_Flow.md`

---

## ⚠️ Quy Tắc Kỹ Thuật Bắt Buộc

1. **Tuyệt đối không cài React Navigation / Expo Router** — điều hướng hoàn toàn qua `activeTab` và `operationSubView`
2. **Safe Area:** Luôn dùng `useSafeAreaInsets()` — lấy `insets.top` và `insets.bottom`
3. **Theme Tokens:** Luôn import từ `theme.colors.*` — không hardcode hex rải rác
4. **Cart Composite Key:** Định danh `${item.id}__${JSON.stringify(modifiers)}__${note}`
5. **Icons:** Chỉ dùng `lucide-react-native` — không dùng thư viện icon khác

---

## 📦 Scripts

```bash
npm start            # Expo Metro Bundler (cổng 8081)
npm run ios          # Chạy iOS Simulator
npm run android      # Chạy Android Emulator
npm run web          # Chạy Expo Web (dev)
```

---

## 🛠️ Development Workflow

### Custom Tab Navigation (No React Navigation)
- `App.tsx`: State `activeTab` + `operationSubView` điều hướng toàn app
- `BottomNav.tsx`: 5 tabs (Home, Order, Operations, Revenue, Settings)
- `OperationsScreen.tsx`: Hub 10 sub-views (Orders, Cashier, Tables, SoldOut, Inventory, History, ItemOptions, MenuItemForm, ModifierDetail, PrepTime)
- Điều hướng: `onNavigate('order', 'cashier')` → set `activeTab='order'`, `operationSubView='cashier'`

### Theme System (Mandatory)
```typescript
// src/theme/index.ts - LUÔN import từ đây
import { theme } from '@/theme';

// ✅ Đúng
style={styles.container}
<View className="bg-background">

// ❌ Sai - không hardcode
<View style={{backgroundColor: '#FF5733'}}>
```

### Cart Composite Key (Unique per variant)
```typescript
// Khi cùng món + modifier khác nhau = 2 dòng riêng
const cartItemId = `${item.id}__${JSON.stringify(modifiers)}__${note}`;
// Ví dụ: "item1__{"Đường":"50%","Đá":"70%"}__" vs "item1__{"Đường":"100%","Đá":"70%"}__"
```

### Sound Alerts (Đơn mới/Thanh toán)
```typescript
// src/services/sound.ts
soundService.playNewOrderAlert();     // order:new
soundService.playPaymentCompleteAlert(); // payment:completed
```
Cần file `assets/sounds/new_order.mp3`, `payment_complete.mp3`.

---

## 🔧 Common Issues & Fixes

| Issue | Nguyên nhân | Fix |
|-------|-------------|-----|
| `Network Error` API | Sai `EXPO_PUBLIC_API_URL` hoặc backend không chạy | `.env` dùng IP LAN máy backend (không `localhost`), check backend port 5000/5001 |
| Metro bundler không reload | Cache Metro | `npx expo start -c` (clear cache) |
| iOS Simulator không mở | Xcode command line tools thiếu | `xcode-select --install` |
| Android build fail | `local.properties` sdk.dir sai | Tạo `android/local.properties` trỏ SDK path |
| Socket.IO không connect | `EXPO_PUBLIC_API_URL` trỏ sai port/backend | `.env` trỏ đúng backend IP:port, backend log `⚡ [useSocket] Connected` |
| Theme token không áp dụng | Import sai hoặc Tailwind class không compile | Import `theme` từ `@/theme`, check `tailwind.config.js` content paths |
| `expo-secure-store` fail web | Không hỗ trợ web | Try/catch trong `authStore.ts` (đã handle) |

---

## 🌐 Multi-Device Development (LAN)

**Windows (Backend host):** IP = `192.168.x.x` (lấy bằng `ipconfig`)
**Mac (Mobile dev):** Cập nhật `.env`:
```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:5000/api
```
Chạy Metro: `npx expo start --lan` → quét QR bằng Expo Go trên phone/iOS Simulator.

> ⚠️ **Android Emulator** dùng `10.0.2.2` thay vì IP LAN (mapping host machine). `api.ts:5` đã handle: `Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001'`
