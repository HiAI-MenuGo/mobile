# Mobile - Hệ thống điều hướng Code (HiAI-MenuGo Mobile)

## Tổng quan
Expo 57 + React Native 0.86 + React 19 + TypeScript. **Không dùng React Navigation / Expo Router** - điều hướng custom bằng `activeTab` + `operationSubView` state. Zustand 5 cho state. NativeWind v4 + Theme tokens. Lucide icons. Socket.IO realtime.

---

## Cấu trúc thư mục thực tế

```
mobile/
├── App.tsx                       # Root: AuthGate + MainApp + Tab routing + BottomNav
├── index.ts                      # Expo entry point
├── global.css                    # NativeWind/Tailwind global
├── src/
│   ├── types/index.ts            # Type definitions trung tâm (137 dòng)
│   ├── theme/index.ts            # Color tokens, radii, shadows
│   ├── data/                     # Zustand stores + mock data
│   │   ├── authStore.ts          # Auth state (token, user, loadFromStorage)
│   │   ├── menuStore.ts          # Menu items, categories
│   │   └── historyStore.ts       # Lịch sử đơn
│   ├── components/
│   │   ├── BottomNav.tsx         # Thanh tab chính (5 tab)
│   │   ├── FloatingDock.tsx      # (nếu có)
│   │   ├── Stepper.tsx           # Stepper component
│   │   └── Modal.tsx             # Modal base
│   ├── screens/
│   │   ├── HomeScreen.tsx        # Tab Home - Tổng quan doanh thu ngày
│   │   ├── RevenueScreen.tsx     # Tab Doanh thu - Chi tiết, biểu đồ
│   │   ├── OperationsScreen.tsx  # Tab Thao tác - Hub + 6 sub-view
│   │   ├── NotificationScreen.tsx # Tab Thông báo
│   │   ├── SettingsScreen.tsx    # Tab Cài đặt
│   │   ├── LoginScreen.tsx       # Đăng nhập
│   │   └── operations/           # 6 màn hình con của Thao tác
│   │       ├── TablesScreen.tsx      # Quản lý bàn
│   │       ├── OrdersScreen.tsx      # Đơn hàng realtime
│   │       ├── CashierScreen.tsx     # Thu ngân, in bill
│   │       ├── SoldOutScreen.tsx     # Báo hết món
│   │       ├── InventoryScreen.tsx   # Kiểm kho
│   │       ├── HistoryScreen.tsx     # Lịch sử ca
│   │       ├── PrepTimeDetailScreen.tsx
│   │       ├── ModifierDetailScreen.tsx
│   │       ├── MenuItemFormScreen.tsx
│   │       └── ItemOptionsScreen.tsx
│   ├── hooks/
│   │   └── useSocket.ts          # Socket.IO hook
│   ├── services/
│   │   ├── api.ts                # Axios instance + interceptors
│   │   ├── auth.service.ts       # Auth API calls
│   │   └── sound.ts              # Phát âm thanh (new_order, payment)
│   └── assets/                   # (nếu có local assets)
├── assets/
│   ├── icon.png, splash-icon.png, favicon.png
│   ├── android-icon-*.png
│   └── sounds/
│       ├── new_order.mp3
│       └── payment_complete.mp3
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
├── metro.config.js
├── babel.config.js
├── tailwind.config.js            # NativeWind v4 config
├── nativewind-env.d.ts
├── tsconfig.json
├── package.json
├── .env / .env.example
└── README.md
```

---

## Điều hướng (Navigation) - Custom Pattern

**Không dùng React Navigation / Expo Router.**

State điều hướng trong `App.tsx`:
- `activeTab: TabType` - 5 tab chính: `'home' | 'revenue' | 'order' | 'notifications' | 'settings'`
- `operationSubView: OperationSubView` - 7 sub-view khi `activeTab === 'order'`: `'hub' | 'order' | 'tables' | 'orders' | 'cashier' | 'sold_out' | 'inventory' | 'history'`

```typescript
// TabType
type TabType = 'home' | 'revenue' | 'order' | 'notifications' | 'settings';

// OperationSubView (khi ở tab "Thao tác")
type OperationSubView = 'hub' | 'order' | 'tables' | 'orders' | 'cashier' | 'sold_out' | 'inventory' | 'history';
```

**Luồng điều hướng:**
1. `BottomNav` → `handleNavigate(tab, subView?)` → set `activeTab` + `operationSubView`
2. `OperationsScreen` nhận `initialSubView`, `onSubViewChange` để điều hướng nội bộ
3. Các sub-view tự render toolbar/action bar riêng (BottomNav ẩn khi ở sub-view)

---

## State Management (Zustand)

| Store | File | Chức năng |
|-------|------|-----------|
| `useAuthStore` | `src/data/authStore.ts` | Token, user, isAuthenticated, loadFromStorage (SecureStore) |
| `useMenuStore` | `src/data/menuStore.ts` | Menu items, categories, sold-out state |
| `useHistoryStore` | `src/data/historyStore.ts` | Lịch sử đơn hàng |
| Local state `cart` | `App.tsx` | Giỏ hàng tạm (CartItem[]) - composite key `${item.id}__${JSON.stringify(modifiers)}__${note}` |

---

## Tìm file nhanh (theo chức năng)

| Cần tìm | File/Thư mục |
|---------|-------------|
| Entry point | `App.tsx`, `index.ts` |
| Auth gate + Main routing | `App.tsx` (AuthGate, MainApp, renderScreen) |
| Tab chính (BottomNav) | `src/components/BottomNav.tsx` |
| Home (Tổng quan) | `src/screens/HomeScreen.tsx` |
| Doanh thu | `src/screens/RevenueScreen.tsx` |
| Thao tác Hub + Sub-views | `src/screens/OperationsScreen.tsx` |
| Thông báo | `src/screens/NotificationScreen.tsx` |
| Cài đặt | `src/screens/SettingsScreen.tsx` |
| Đăng nhập | `src/screens/LoginScreen.tsx` |
| **Sub-view: Bàn** | `src/screens/operations/TablesScreen.tsx` |
| **Sub-view: Đơn hàng** | `src/screens/operations/OrdersScreen.tsx` |
| **Sub-view: Thu ngân** | `src/screens/operations/CashierScreen.tsx` |
| **Sub-view: Hết món** | `src/screens/operations/SoldOutScreen.tsx` |
| **Sub-view: Kiểm kho** | `src/screens/operations/InventoryScreen.tsx` |
| **Sub-view: Lịch sử** | `src/screens/operations/HistoryScreen.tsx` |
| Type definitions | `src/types/index.ts` |
| Theme tokens | `src/theme/index.ts` |
| Auth store | `src/data/authStore.ts` |
| Menu store | `src/data/menuStore.ts` |
| History store | `src/data/historyStore.ts` |
| API client | `src/services/api.ts` |
| Auth API | `src/services/auth.service.ts` |
| Socket hook | `src/hooks/useSocket.ts` |
| Sound service | `src/services/sound.ts` |
| Mock data | `src/data/mockData.ts` |
| Expo config | `app.json`, `eas.json` |
| NativeWind config | `tailwind.config.js`, `global.css` |

---

## Patterns tìm code (ripgrep)

```bash
# Tìm screen/component
rg "export default function\|export const.*=.*=>" src/screens/ src/components/

# Tìm hook
rg "export.*use[A-Z]" src/hooks/

# Tìm API call
rg "api\.\w+\|axios\." src/services/

# Tìm Zustand store
rg "createStore\|useAuthStore\|useMenuStore\|useHistoryStore" src/data/

# Tìm Socket.IO
rg "socket\.on\|socket\.emit\|useSocket" src/hooks/useSocket.ts src/screens/

# Tìm type/interface
rg "interface\|type " src/ --include="*.ts" --include="*.tsx"

# Tìm navigation logic
rg "activeTab\|operationSubView\|handleNavigate" App.tsx src/screens/OperationsScreen.tsx

# Tìm cart logic (composite key)
rg "cartItemId\|handleAddToCart\|handleRemoveFromCart" App.tsx

# Tìm theme usage
rg "theme\.colors\." src/ --include="*.tsx"

# Tìm NativeWind className
rg "className=" src/ --include="*.tsx"
```

---

## Scripts quan trọng (package.json)

```bash
npm start          # expo start
npm run android    # expo start --android
npm run ios        # expo start --ios
npm run web        # expo start --web
```

---

## Quy tắc kỹ thuật quan trọng (từ README.md)

1. **Tuyệt đối không cài React Navigation / Expo Router** - Dùng `activeTab` + `operationSubView`
2. **Composite Key cho Cart**: `${item.id}__${JSON.stringify(modifiers)}__${note}`
3. **Safe Area Insets**: Luôn dùng `useSafeAreaInsets()` (`insets.top`, `insets.bottom`)
4. **Theme Tokens**: Import từ `theme.colors.*`, không hardcode hex
5. **Icons**: Chỉ dùng `lucide-react-native`
6. **Metro Port**: 8081

---

## File quan trọng phải đọc trước
1. `README.md` - Tổng quan, workflow, quy tắc
2. `App.tsx` - AuthGate, MainApp, routing logic, cart logic
3. `src/types/index.ts` - Tất cả type definitions
4. `src/theme/index.ts` - Design tokens
5. `src/data/authStore.ts` - Auth persistence (SecureStore)
6. `src/services/api.ts` - Axios config
7. `src/hooks/useSocket.ts` - Realtime connection
8. `app.json` - Expo config
9. `.env.example` - Biến môi trường