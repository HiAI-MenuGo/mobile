# HiAI-MenuGo Mobile — Agent Entry Point

> **Repo này là `mobile/`** — Expo ~57 + React Native 0.86.3 + React 19.  
> App di động vận hành nhà hàng dành cho nhân viên (iOS & Android): POS Gọi món, Quản lý đơn hàng live, Thu ngân, Kho, Lịch sử.

---

## 1. Bản Đồ Files (đọc theo thứ tự)

| # | File | Nội dung chính | Khi nào đọc |
|---|---|---|---|
| 1 | `AGENTS.md` (file này) | Index repo · cấu trúc thư mục · navigation map · workflow mobile | Luôn đọc đầu tiên |
| 2 | [BUSINESS.md](./BUSINESS.md) | Nghiệp vụ F&B: lifecycle gọi món, Quản lý đơn hàng live, POS, kho BOM, Loyalty | Trước khi xây tính năng liên quan nghiệp vụ |
| 3 | [TECHS.md](./TECHS.md) | Stack: Expo 57, RN 0.86, Zustand 5, Socket.IO Client, Axios, expo-secure-store | Trước khi chọn thư viện, viết hook/service mới |
| 4 | [RULES.md](./RULES.md) | Luật bắt buộc: **cấm React Navigation/Expo Router**, cart composite key, theme tokens, Safe Area | Trước khi viết/sửa bất kỳ code nào |
| 5 | [SKILLS.md](./SKILLS.md) | Design System: theme tokens, StyleSheet patterns, NativeWind, component mẫu, thumb zone | Trước khi làm UI/component mới |
| 6 | [SYSTEM.md](./SYSTEM.md) | System: auth flow, Socket.IO mobile, IP LAN config, navigation hub pattern | Khi làm auth, realtime hoặc navigation |

---

## 2. Thông Tin Repo Này

- **Repo:** `mobile.git` — Thành viên A (iOS/Foundation) + B (Android/Operations)
- **Runtime:** Expo ~57.0.23 · React Native 0.86.3 · React 19.2.3 · TypeScript ~6.0.3
- **Metro port:** `8081` — **không tự đổi**
- **Nhánh hiện tại:** `dev` → PR vào `dev`, merge `main` khi release
- **API backend:** `EXPO_PUBLIC_API_URL` trong `.env` (thay `localhost` bằng IP LAN khi test thiết bị thật)
- **Navigation:** Custom Hub Pattern — **cấm tuyệt đối React Navigation & Expo Router**
- **Token storage:** `expo-secure-store` — **không AsyncStorage thô**

---

## 3. Cấu Trúc Thư Mục Mobile

```
mobile/
├── App.tsx                              # Root shell: SafeAreaProvider + Tab state + Cart state
├── index.ts                             # Expo entry (registerRootComponent)
├── app.json                             # Config: portrait, light theme, bundle ID
├── src/
│   ├── types/
│   │   └── index.ts                     # TabType, OperationSubView, MenuItem, CartItem,
│   │                                    # LiveOrder, OrderItem, Ingredient, ModifierGroup...
│   ├── theme/
│   │   └── index.ts                     # colors, radii, shadows, spacing (nguồn duy nhất)
│   ├── data/
│   │   ├── mockData.ts                  # Dữ liệu mẫu (chỉ dùng khi dev offline)
│   │   └── menuStore.ts                 # Zustand: useMenuStore (menu items) + historyStore
│   ├── services/
│   │   └── api.ts                       # Axios instance: baseURL, token interceptor, refresh 401
│   ├── hooks/                           # Custom hooks dùng chung
│   ├── components/
│   │   ├── BottomNav.tsx                # Tab bar dưới cùng (5 tabs: Home/Order/Ops/Revenue/Settings)
│   │   └── ...                          # Shared components (Modal, Badge, Spinner...)
│   └── screens/
│       ├── LoginScreen.tsx              # Đăng nhập → lưu token vào expo-secure-store
│       ├── HomeScreen.tsx               # Tổng quan ca: doanh thu nhanh, bàn đang phục vụ
│       ├── OrderScreen.tsx              # POS: menu + giỏ hàng + gửi đơn
│       ├── OperationsScreen.tsx         # Hub điều phối: render sub-view theo operationSubView
│       ├── RevenueScreen.tsx            # Doanh thu & phân tích (chart, stat cards)
│       ├── NotificationScreen.tsx       # Thông báo hệ thống
│       ├── SettingsScreen.tsx           # Cài đặt người dùng, thông tin chi nhánh, logout
│       └── operations/                  # 10 sub-views trong OperationsScreen
│           ├── OrdersScreen.tsx         # Quản lý đơn hàng live — danh sách đơn, đổi trạng thái
│           ├── CashierScreen.tsx        # Thu ngân: xem đơn bàn, áp voucher, xác nhận TT
│           ├── TablesScreen.tsx         # Sơ đồ bàn: occupied/empty/reserved
│           ├── SoldOutScreen.tsx        # Báo hết món: toggle sold out từng món
│           ├── InventoryScreen.tsx      # Kiểm kê kho nguyên liệu, điều chỉnh số lượng
│           ├── HistoryScreen.tsx        # Lịch sử đơn hàng đã đóng
│           ├── ItemOptionsScreen.tsx    # Chọn modifier/tùy chọn cho một món
│           ├── MenuItemFormScreen.tsx   # Form tạo/sửa món ăn
│           ├── ModifierDetailScreen.tsx # Xem/sửa modifier group và options
│           └── PrepTimeDetailScreen.tsx # Cài đặt thời gian chế biến ước tính
├── assets/                              # Ảnh, fonts, icons tĩnh
├── .env / .env.example
├── babel.config.js
├── metro.config.js
├── tailwind.config.js                   # NativeWind config
├── global.css                           # NativeWind base styles
└── tsconfig.json
```

---

## 4. Navigation Architecture (Hub Pattern)

**Không có React Navigation hay Expo Router.** Điều hướng hoàn toàn qua `useState` trong `App.tsx`:

```
App.tsx  (activeTab state)
 ├── 'home'        → <HomeScreen />
 ├── 'order'       → <OrderScreen />   (POS + cart)
 ├── 'operations'  → <OperationsScreen operationSubView={...} />
 │                      ├── 'default'          → Hub menu chọn chức năng
 │                      ├── 'orders'           → <OrdersScreen /> (Quản lý đơn live)
 │                      ├── 'cashier'          → <CashierScreen />
 │                      ├── 'tables'           → <TablesScreen />
 │                      ├── 'sold-out'         → <SoldOutScreen />
 │                      ├── 'inventory'        → <InventoryScreen />
 │                      ├── 'history'          → <HistoryScreen />
 │                      ├── 'item-options'     → <ItemOptionsScreen />
 │                      ├── 'menu-item-form'   → <MenuItemFormScreen />
 │                      ├── 'modifier-detail'  → <ModifierDetailScreen />
 │                      └── 'prep-time'        → <PrepTimeDetailScreen />
 ├── 'revenue'     → <RevenueScreen />
 └── 'settings'    → <SettingsScreen />
```

**Để điều hướng:** Gọi prop callback `onNavigate(subView)` truyền từ `App.tsx` xuống — không dùng hook navigation nào.

---

## 5. Cart Item Composite Key (bắt buộc)

```typescript
// Định danh duy nhất cho mỗi dòng trong giỏ hàng:
const cartItemId = `${item.id}__${JSON.stringify(selectedModifiers)}__${note}`;

// Ví dụ:
// "drink_01__[{"size":"L"},{"sugar":"50%"}]__không đá"  ← Trà Đào L, 50% đường
// "drink_01__[{"size":"M"},{"sugar":"100%"}]__"         ← Trà Đào M, 100% đường (khác dòng!)
```

> Quy tắc này đảm bảo 2 ly Trà Đào cùng tên nhưng khác tùy chọn = 2 dòng riêng trên phiếu bếp.

---

## 6. Theme Tokens (bắt buộc)

```typescript
import { theme } from '@/theme'; // src/theme/index.ts

// Luôn dùng:
theme.colors.primary       // màu nhấn chính
theme.colors.background    // nền màn hình
theme.colors.surface       // nền card/panel
theme.colors.text          // màu chữ chính
theme.radii.md             // border radius
theme.shadows.card         // box shadow card

// ❌ TUYỆT ĐỐI KHÔNG hardcode hex:
// backgroundColor: '#FF5733'  ← SAI
// backgroundColor: theme.colors.primary ← ĐÚNG
```

---

## 7. Safe Area (bắt buộc)

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();

// Luôn áp dụng:
paddingTop: insets.top       // tránh notch/status bar
paddingBottom: insets.bottom // tránh home indicator (iOS)
```

---

## 8. Phân Chia Công Việc (A & B)

| Thành viên | Platform | Màn hình phụ trách |
|---|---|---|
| **A (iOS)** | iPhone / iOS Simulator | `App.tsx` shell, `HomeScreen`, `OrderScreen`, `RevenueScreen`, `NotificationScreen`, `LoginScreen` |
| **B (Android)** | Android / Emulator | `OperationsScreen` hub + tất cả 10 sub-views trong `operations/` |

---

## 9. Workflow Bắt Buộc Của Agent

1. Đọc file này → xác định task thuộc screen/component nào → đọc SKILLS.md nếu làm UI.
2. **Cấm tuyệt đối** import bất cứ thứ gì từ `@react-navigation/*` hay `expo-router`.
3. **Mọi màu** phải từ `theme.colors.*` — không hardcode hex.
4. **Safe Area** phải có `useSafeAreaInsets()` ở mọi screen root.
5. **Cart composite key** bắt buộc theo format `${id}__${JSON.stringify(modifiers)}__${note}`.
6. **Token** lưu và đọc từ `expo-secure-store` — không `AsyncStorage`.
7. Khi test thiết bị thật: đổi `.env` thành IP LAN thay vì `localhost`.
8. **TUYỆT ĐỐI KHÔNG `git push`** khi chưa có xác nhận của user.
9. Commit theo Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.
