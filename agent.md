# Agent Context – gm-mobile (Mobile App)

> Tài liệu định nghĩa toàn bộ kiến trúc kỹ thuật, quy tắc bắt buộc, quy ước code và knowledge base của **Mobile App (HiAI-MenuGo)**. AI Agent PHẢI tuân thủ nghiêm ngặt khi làm việc trong thư mục `mobile/`.

---

## 1. Tổng Quan Dự Án & Tech Stack

- **Dự án:** HiAI-MenuGo — Ứng dụng di động quản lý vận hành nhà hàng (POS di động, Gọi món tại bàn, Quản lý đơn live, Báo hết món, Kiểm kho, Báo cáo doanh thu)
- **Framework & Runtime:** Expo (~57.0.23) + React Native (0.86.3) + React (19.2.3)
- **Language:** TypeScript (~6.0.3), `strict: true` (kế thừa `expo/tsconfig.base`)
- **Navigation:** Custom Tab + Hub Pattern trong `App.tsx` & `OperationsScreen.tsx` — **Không dùng** React Navigation / Expo Router
- **State Management:** Zustand 5 (`useMenuStore`) kết hợp local state cho `cart`, `activeTab`, `operationSubView`
- **UI Kit & Design Tokens:** `StyleSheet.create` kết hợp theme tokens (`src/theme/index.ts`)
- **Icons:** `lucide-react-native` (^1.47.0) — **Duy nhất**, không dùng icon set khác
- **Native Modules:** `react-native-safe-area-context`, `expo-image-picker`, `expo-status-bar`, `react-native-svg`
- **Port / Metro:** `8081`

**Scripts (`mobile/package.json`):**
```bash
npm start          # Khởi động Metro Bundler (expo start)
npm run ios        # Mở trên iOS Simulator
npm run android    # Mở trên Android Emulator / Thiết bị
npm run web        # Mở bản Web
```

---

## 2. Quy Tắc Bắt Buộc (Critical Rules)

1. **Không được tự ý `git push`** — Chỉ commit local với conventional commit message (`feat:`, `fix:`, `refactor:`, `docs:`), hỏi và chờ xác nhận từ user trước khi push.
2. **Kiểm tra TypeScript:** Luôn chạy `npx tsc --noEmit` sau khi sửa code để đảm bảo không có lỗi type.
3. **Kiến Trúc Điều Hướng (Custom Tab + Hub):** Tuyệt đối **không cài đặt hay sử dụng** React Navigation / Expo Router. Toàn bộ routing quản lý qua `activeTab` (`TabType`) và `operationSubView` (`OperationSubView`).
4. **Theme Tokens Chuẩn:** Không hardcode mã màu hex (`#10B981`, `#059669`, `#F8FAFC`...) rải rác; luôn import từ `theme.colors.*`, `theme.radii.*`, `theme.shadows.*`.
5. **Icon System:** Chỉ dùng `lucide-react-native`. Import named icon, set `strokeWidth={2}` hoặc `2.5`, kích thước từ `14` đến `28` tùy context.
6. **Safe Area Insets:** Mọi màn hình có Header hoặc Dock nổi bắt buộc tính toán `useSafeAreaInsets()` (`insets.top`, `insets.bottom`). Không dùng số pixel cố định tránh bị che bởi notch/dynamic island hoặc thanh Home Indicator.
7. **Cart Item Identity:** Khóa định danh `cartItemId` trong giỏ hàng là chuỗi composite: `${item.id}__${JSON.stringify(modifiers)}__${note}`. Khi xóa/sửa số lượng món trong giỏ hàng phải dùng `cartItemId`, không dùng `item.id` thuần khi món có tùy chọn (modifiers/note).

---

## 3. Kiến Trúc Điều Hướng & Routing (Custom Tab + Hub)

```
Root Shell (mobile/App.tsx)
 ├── SafeAreaProvider
 ├── activeTab: 'home' | 'revenue' | 'order' | 'notifications' | 'settings'
 │    ├── 'home'          ───> <HomeScreen />
 │    ├── 'revenue'       ───> <RevenueScreen />
 │    ├── 'notifications' ───> <NotificationScreen />
 │    ├── 'settings'      ───> <SettingsScreen />
 │    └── 'order'         ───> <OperationsScreen /> (HUB Trung Tâm)
 │                              ├── 'hub'        ───> Grid 6 tính năng chính
 │                              ├── 'order'      ───> <OrderScreen /> (Menu gọi món & Giỏ hàng)
 │                              ├── 'tables'     ───> <TablesScreen /> (Sơ đồ bàn)
 │                              ├── 'orders'     ───> <OrdersScreen /> (Đơn live: PENDING/CONFIRMED/DONE)
 │                              ├── 'cashier'    ───> <CashierScreen /> (Thanh toán CASH/VIETQR)
 │                              ├── 'sold_out'   ───> <SoldOutScreen /> (Toggle báo hết món)
 │                              ├── 'inventory'  ───> <InventoryScreen /> (Tồn kho nguyên liệu)
 │                              └── 'history'    ───> <HistoryScreen /> (Lịch sử 142 đơn)
 └── Floating BottomNav (Dock 5 Tabs) — Tự động ẩn khi vào các sub-views con
```

---

## 4. Cấu Trúc Thư Mục Mobile

```
mobile/
├── App.tsx                          # Root shell: SafeArea + Tab routing + Cart state
├── index.ts                         # Expo entry (registerRootComponent)
├── app.json                         # Expo configuration (icon, splash, scheme)
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Dependencies & scripts
├── assets/                          # Assets tĩnh (icon, adaptive-icon, splash)
└── src/
    ├── types/
    │   └── index.ts                 # Toàn bộ TypeScript interfaces & types trung tâm
    ├── theme/
    │   └── index.ts                 # Design tokens (colors, radii, shadows, typography)
    ├── data/
    │   ├── mockData.ts              # Mock data: Menu, Modifiers, Bàn, Doanh thu, Thông báo
    │   └── menuStore.ts             # Zustand store: CRUD món ăn & danh mục
    ├── components/
    │   └── BottomNav.tsx            # Floating Dock 5 tabs với nút Center tròn nổi bật
    └── screens/
        ├── HomeScreen.tsx           # Dashboard tổng quan, doanh thu ngày, món bán chạy
        ├── RevenueScreen.tsx        # Báo cáo doanh thu chi tiết (Ngày/Tháng/Năm) + Chart
        ├── OrderScreen.tsx          # Màn hình gọi món: Lưới thực đơn, Search, Giỏ hàng
        ├── OperationsScreen.tsx     # HUB trung tâm chuyển hướng 6 tính năng nghiệp vụ
        ├── NotificationScreen.tsx   # Danh sách thông báo realtime (Đơn mới, Thanh toán)
        ├── SettingsScreen.tsx       # Cài đặt: Hồ sơ nhân viên & Cấu hình âm thanh/hệ thống
        └── operations/              # Màn hình nghiệp vụ chi tiết (Sub-views)
            ├── OrdersScreen.tsx         # Theo dõi đơn trực tiếp & đếm ngược chế biến
            ├── TablesScreen.tsx         # Sơ đồ & trạng thái các bàn ăn
            ├── CashierScreen.tsx        # Thanh toán tiền mặt / mã VietQR động
            ├── SoldOutScreen.tsx        # Bật/tắt trạng thái hết món nhanh
            ├── InventoryScreen.tsx      # Quản lý tồn kho nguyên liệu & cảnh báo sắp hết
            ├── HistoryScreen.tsx        # Tra cứu lịch sử đơn hàng đã hoàn tất
            ├── ItemOptionsScreen.tsx    # Modal tùy chọn món (Size, Đường, Đá, Topping, Note)
            ├── MenuItemFormScreen.tsx   # Thêm/sửa món ăn kèm chọn ảnh từ thiết bị
            ├── ModifierDetailScreen.tsx # Cấu hình nhóm tùy chọn (Modifiers)
            └── PrepTimeDetailScreen.tsx # Chi tiết thời gian ước tính làm món
```

---

## 5. Design System & Theme Tokens (`src/theme/index.ts`)

```typescript
export const theme = {
  colors: {
    // Primary Brand (Emerald / Mint)
    primary: '#10B981',
    primaryDark: '#059669',
    primaryLight: '#D1FAE5',
    primaryTint: '#ECFDF5',

    // Accent & Status
    accent: '#0284C7',
    accentLight: '#E0F2FE',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',

    // Surfaces & Backgrounds
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceSubtle: '#F1F5F9',

    // Borders & Dividers
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',

    // Text Colors
    textMain: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textInverse: '#FFFFFF',
  },
  radii: {
    pill: 999,
    xl: 24,
    lg: 18,
    md: 14,
    sm: 10,
  },
  shadows: {
    card:  { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    float: { shadowColor: '#059669', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 14, elevation: 6 },
    dock:  { shadowColor: '#0F172A', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 8 },
  }
};
```

---

## 6. Chi Tiết Các Màn Hình & Trách Nhiệm

### 6.1. Màn hình chính (Main Tabs)
| Màn hình | File | Trách nhiệm chính |
|---|---|---|
| **Home** | `HomeScreen.tsx` | Doanh thu tóm tắt trong ngày, số đơn chờ, 2 nút Quick Action, danh sách 4 món bán chạy |
| **Revenue** | `RevenueScreen.tsx` | Báo cáo doanh thu 3 chế độ (Ngày/Tháng/Năm), biểu đồ cột tỷ lệ, cơ cấu Chuyển khoản vs Tiền mặt, Modal DatePicker |
| **Operations (Hub)** | `OperationsScreen.tsx` | HUB trung tâm 6 tính năng: Bán hàng & Phục vụ, Thực đơn & Kho, Lịch sử đơn hàng |
| **Notifications** | `NotificationScreen.tsx` | Thông báo đơn mới, thanh toán, bàn ăn, cảnh báo hệ thống; đánh dấu đã đọc |
| **Settings** | `SettingsScreen.tsx` | 2 Sub-tabs: Hồ sơ cá nhân (Chi nhánh, ca làm) và Cài đặt hệ thống (Chuông báo, Push notif, Đổi MK, Đăng xuất) |

### 6.2. Màn hình nghiệp vụ (Operations Sub-views)
| Màn hình | File | Trách nhiệm chính |
|---|---|---|
| **Tạo Order** | `OrderScreen.tsx` | Lưới thực đơn 2 cột, Search bar, Category pills, Stepper số lượng, Modal tùy chọn món, Cart Bottom Sheet |
| **Đơn Hàng** | `OrdersScreen.tsx` | Theo dõi đơn Live theo 3 tab: `PENDING` (Chờ duyệt), `CONFIRMED` (Đang chế biến), `DONE` (Hoàn thành) |
| **Sơ Đồ Bàn** | `TablesScreen.tsx` | Danh sách bàn theo khu vực, trạng thái Bàn trống / Đang dùng / Đặt trước |
| **Thanh Toán** | `CashierScreen.tsx` | Thu ngân chọn phương thức (Tiền mặt / VietQR), kiểm tra thông tin thanh toán, xuất hóa đơn |
| **Hết Món** | `SoldOutScreen.tsx` | Danh sách toàn bộ món ăn kèm Toggle Switch báo tạm hết món nhanh |
| **Kho Nguyên Liệu**| `InventoryScreen.tsx`| Danh sách nguyên liệu tồn kho, cảnh báo mức tồn an toàn (`safetyStock`), điều chỉnh kho |
| **Lịch Sử Đơn** | `HistoryScreen.tsx` | Danh sách toàn bộ đơn hàng trong ca/ngày, tìm kiếm theo mã đơn, lọc theo ngày |
| **Tùy Chọn Món** | `ItemOptionsScreen.tsx`| Modal tùy chọn: Đường (0-100%), Đá, Size (M/L phụ thu), Topping (+tiền), Ghi chú riêng |
| **Thêm/Sửa Món** | `MenuItemFormScreen.tsx`| Form thêm/sửa món ăn, chọn ảnh từ thư viện ảnh (`expo-image-picker`), cấu hình giá và nhóm modifier |

---

## 7. State Management & Data Layer

### 7.1. TypeScript Core Interfaces (`src/types/index.ts`)
- `MenuItem`: `{ id, name, category, price, imageUrl, isPopular?, modifierGroups?, prepTimeMinutes? }`
- `ModifierGroup`: `{ id, name, options: ModifierOption[] }` (Đường, Đá, Size, Topping)
- `CartItem`: `{ cartItemId, item, quantity, selectedModifiers?, note?, unitPrice }`
- `LiveOrder`: `{ id, code, time, orderType, status: 'PENDING'|'CONFIRMED'|'DONE', items, total, paymentStatus }`
- `RevenueData`: `{ timeframe, total, growthPercent, orderCount, cashTotal, transferTotal, breakdown, transactions }`

### 7.2. Zustand Store (`src/data/menuStore.ts`)
```typescript
interface MenuState {
  items: MenuItem[];
  categories: string[];
  addItem: (item: Omit<MenuItem, 'id'>) => MenuItem;
  updateItem: (id: string, updated: Partial<MenuItem>) => void;
  deleteItem: (id: string) => void;
  addCategory: (category: string) => void;
}
```
*`useMenuStore` là single source of truth cho dữ liệu thực đơn trên mobile app.*

---

## 8. Quy Ước UI/UX & Native Mobile

1. **Card Component Chuẩn:**
   ```typescript
   backgroundColor: theme.colors.surface,
   borderRadius: theme.radii.lg, // 18px
   borderWidth: 1,
   borderColor: theme.colors.border,
   ...theme.shadows.card,
   ```
2. **Nút Bấm & CTA (Touch Target):** Chiều cao tối thiểu 44px, bo góc `theme.radii.pill` (999) hoặc `theme.radii.md` (14px). Luôn có hiệu ứng `activeOpacity={0.7~0.8}`.
3. **Modal & Bottom Sheet:**
   - Sử dụng `Modal transparent` với nền backdrop mờ `rgba(15, 23, 42, 0.5)`.
   - Kết hợp `Animated.spring` hoặc `slide` animation để tạo độ mượt mà.
   - Bo góc trên `borderTopLeftRadius: 28, borderTopRightRadius: 28`.
4. **Header & Floating Dock:**
   - Header luôn bù `paddingTop: Math.max(insets.top, 24)`.
   - Floating BottomNav luôn bù `bottom: Math.max(insets.bottom, 12)` để tránh dính thanh Home Indicator của iPhone.

---

## 9. Lộ Trình Nối Real Backend API

Hiện tại app đang chạy trên Mock Data (`src/data/mockData.ts`) để tối ưu UI/UX. Khi nối API backend (`http://localhost:5000` hoặc production URL):
1. Giữ nguyên toàn bộ interface trong `src/types/index.ts`.
2. Tạo module API client (`src/services/api.ts`) với `axios` hoặc `fetch` kèm cơ chế đính kèm JWT Token (`Authorization: Bearer <token>`).
3. Thay thế implementation trong `menuStore.ts`, `RevenueScreen`, `OrdersScreen`, `NotificationScreen` bằng async API calls.
4. Tích hợp `socket.io-client` để nhận sự kiện realtime từ backend (`order:new`, `order:item:status`, `sold_out:updated`, `payment:completed`).

---

## 10. Checklist Kiểm Tra Khi Thêm Tính Năng Mới

- [ ] Đã thêm kiểu dữ liệu đầy đủ trong `src/types/index.ts` chưa?
- [ ] Nếu thêm màn hình thao tác mới, đã khai báo trong `OperationSubView` và route trong `OperationsScreen.tsx` chưa?
- [ ] Toàn bộ màu sắc, bán kính bo góc và shadow đã dùng từ `theme` (`src/theme/index.ts`) chưa?
- [ ] Mọi icon đã import từ `lucide-react-native` chưa?
- [ ] Đã kiểm tra giao diện trên cả iOS (tai thỏ / Dynamic Island) và Android qua `useSafeAreaInsets` chưa?
- [ ] `BottomNav` có tự động ẩn đúng cách khi vào màn hình con không?
- [ ] Đã chạy `npx tsc --noEmit` không còn bất kỳ lỗi nào?
- [ ] Đã commit local đúng cú pháp conventional commit trước khi báo cáo hoàn thành?
