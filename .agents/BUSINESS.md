# HiAI-MenuGo Mobile — Nghiệp Vụ F&B (BUSINESS)

> **Góc nhìn Mobile (React Native):** Tài liệu này mô tả nghiệp vụ F&B dưới dạng **screen behavior, state management và API calls** trong app di động dành cho nhân viên vận hành nhà hàng.
>
> - 🏗️ Entry point & cấu trúc repo: [AGENTS.md](./AGENTS.md)
> - ⛔ Luật bắt buộc khi viết code: [RULES.md](./RULES.md)
> - 🎨 Design System & UI: [SKILLS.md](./SKILLS.md)

---

## 1. Người Dùng Mobile & Các Màn Hình Thực Tế

App mobile phục vụ **nhân viên vận hành nội bộ** (Thu ngân, Phục vụ, Quản lý) — khách hàng gọi món qua QR Menu trên trình duyệt:

### Các Tab Chính (BottomNav):
| Tab / Screen | Mục đích & Nghiệp vụ |
|---|---|
| `HomeScreen` | Trang chủ tổng quan ca: doanh thu tạm tính, số bàn đang phục vụ, lối tắt thao tác nhanh |
| `RevenueScreen` | Báo cáo doanh thu chi tiết theo ngày/tuần/tháng, phương thức thanh toán, top món bán chạy |
| `OperationsScreen` | **Trung tâm thao tác (Hub)**: Chứa toàn bộ các tính năng vận hành của quán |
| `NotificationScreen` | Thông báo hệ thống: gọi nhân viên từ bàn, đơn mới, cập nhật thanh toán |
| `SettingsScreen` | Cài đặt ca làm, cấu hình máy in bill, IP máy chủ LAN, thông tin tài khoản |

### Các Phân Hệ Trong Trung Tâm Thao Tác (`OperationsScreen` Sub-views):
| Sub-view / Screen | File component | Nghiệp vụ chi tiết |
|---|---|---|
| `order` | `OrderScreen.tsx` | **Tạo Order / Gọi Món Nhanh (POS Mobile)**: Chọn bàn, chọn món, tuỳ chọn size/đường/đá/topping, gửi đơn vào bàn |
| `orders` | `OrdersScreen.tsx` | **Quản Lý Đơn Hàng Live**: Theo dõi đơn đang mở (Chờ xử lý `PENDING`, Đang xử lý `CONFIRMED`, Hoàn tất `DONE`), nút Tiếp nhận, Hoàn tất và Hủy đơn |
| `tables` | `TablesScreen.tsx` | **Sơ Đồ Bàn Ăn**: Xem trạng thái bàn (Trống, Đang dùng, Chờ dọn), mở bàn, chuyển bàn, gộp bàn |
| `cashier` | `CashierScreen.tsx` | **Quản Lý Thanh Toán**: Xem đơn chưa thanh toán theo bàn, áp mã giảm giá/thành viên, thanh toán Tiền mặt hoặc tạo mã VietQR động |
| `sold_out` | `SoldOutScreen.tsx` | **Quản Lý Thực Đơn / Báo Hết Món**: Bật/tắt trạng thái hết món (Sold-Out) realtime cho toàn hệ thống |
| `inventory` | `InventoryScreen.tsx` | **Quản Lý Nguyên Liệu**: Kiểm kê nguyên liệu, xem cảnh báo sắp hết kho, điều chỉnh số lượng tồn |
| `history` | `HistoryScreen.tsx` | **Lịch Sử Đơn Hàng**: Tra cứu các đơn đã thanh toán/đã đóng, xem chi tiết hóa đơn, hỗ trợ sao chép vào giỏ để sửa đơn |

---

## 2. Auth Flow — Mobile Specifics

```typescript
// LoginScreen.tsx:
const response = await api.login(email, password);
// Lưu token an toàn vào SecureStore (expo-secure-store):
await SecureStore.setItemAsync('accessToken', response.token);
await SecureStore.setItemAsync('refreshToken', response.refreshToken);

// Tự động kiểm tra phiên khi mở app (src/data/authStore.ts):
loadFromStorage() → đọc SecureStore
→ có token: set isAuthenticated = true → vào MainApp
→ không có token: điều hướng sang LoginScreen

// Interceptor (src/services/api.ts):
// - Gắn header 'Authorization: Bearer <token>' và 'x-branch-id: <branchId>'
// - Bắt 401: Xóa SecureStore, đưa về LoginScreen
```

---

## 3. Tạo Order / Gọi Món Nhanh (POS) — `OrderScreen`

```
Chọn bàn ăn → Load danh mục & món (useMenuStore)
             → Bấm món → Mở modal ItemOptionsScreen (chọn Topping, Size, Đường, Đá, Ghi chú)
             → Thêm vào giỏ hàng với composite key
             → Xem giỏ hàng → Bấm "Gửi Bếp / Tạo Đơn"
             → POST /api/sessions/:tableId/order
             → Socket emit 'order:new' → Toàn hệ thống nhận đơn mới
```

### Cart State trong `App.tsx`:
```typescript
// Quản lý giỏ hàng tập trung, truyền qua props xuống các sub-view:
const [cart, setCart] = useState<CartItem[]>([]);

// Khóa định danh giỏ hàng tổng hợp (Composite Key):
const cartItemId = `${item.id}__${JSON.stringify(selectedModifiers)}__${note}`;
```

### Chọn Tuỳ Chọn Món (`ItemOptionsScreen.tsx`):
- **Đồ uống (DRINK)**: Bắt buộc chọn nhóm kích cỡ (Size), mức đường, mức đá; tuỳ chọn topping tính thêm tiền `extraPrice`.
- **Đồ ăn (FOOD)**: Tuỳ chọn ghi chú chế biến, gia vị kèm theo.
- Nút thêm chỉ kích hoạt khi đã chọn đủ các nhóm tuỳ chọn bắt buộc (`required === true`).

---

## 4. Quản Lý Đơn Hàng Live — `OrdersScreen`

Đây là màn hình theo dõi và điều phối toàn bộ các đơn hàng đang hoạt động trong ca của nhân viên phục vụ / thu ngân:

```
┌────────────────────────────────────────────────────────────┐
│ [ Chờ xử lý (PENDING) ] [ Đang xử lý (CONFIRMED) ] [ Hoàn tất (DONE) ] │
├────────────────────────────────────────────────────────────┤
│ Card Đơn: Bàn 04 • #ORD-102 • 12:45 • Đếm ngược 08:30      │
│  - 2x Trà Sữa Oolong (Size L, 50% Đường, Trân Châu Trắng)  │
│  - 1x Cơm Gà Chiên Mắm (Ít cay)                            │
│ Nút: [ Hủy đơn ]              [ Tiếp nhận / Xác nhận đơn ] │
└────────────────────────────────────────────────────────────┘
```

### Luồng nghiệp vụ trạng thái đơn:
1. **PENDING (Chờ xử lý)**: Đơn mới gửi từ khách (QR Menu) hoặc từ nhân viên (`OrderScreen`).
   - Có chuông âm thanh cảnh báo (`soundService.playAlertSound()`).
   - Nhân viên kiểm tra và bấm **"Tiếp nhận đơn"** → Gọi API `PATCH /api/orders/:id/status` với `{ status: 'CONFIRMED' }`.
2. **CONFIRMED (Đang xử lý / chế biến)**: Đơn đã được tiếp nhận.
   - Có đồng hồ đếm ngược thời gian chuẩn bị (`countdownSeconds`).
   - Sau khi món hoàn thành mang ra bàn, bấm **"Hoàn tất"** → Gọi API `PATCH /api/orders/:id/status` với `{ status: 'DONE' }`.
3. **Hủy đơn**:
   - Khi khách đổi ý hoặc có sự cố, nhân viên bấm **"Hủy đơn"** → Xác nhận qua Alert dialog → Gọi `POST /api/orders/:id/void`.

### Socket.IO Realtime:
- `order:new`: Tự động chèn đơn mới vào đầu danh sách, phát âm thanh chuông báo.
- `order:updated`: Tự động cập nhật trạng thái đơn (chuyển tab hoặc đổi trạng thái hiển thị).

---

## 5. Quản Lý Thanh Toán — `CashierScreen`

1. **Hiển thị danh sách bàn có đơn**: Gọi `GET /api/tables?status=OCCUPIED` để lấy danh sách bàn đang có khách dùng bữa.
2. **Chọn bàn & Xem chi tiết bill**: Gọi `GET /api/sessions/:tableId/current` để lấy toàn bộ các order item, tạm tính, thuế, phụ thu.
3. **Tích điểm thành viên**: Nhập số điện thoại khách → Gọi `GET /api/loyalty/customer/:phone` → Lấy hạng thẻ (Đồng, Bạc, Vàng) và % giảm giá.
4. **Áp mã khuyến mãi**: Nhập voucher code → Gọi `POST /api/vouchers/validate`.
5. **Thanh toán**:
   - **Tiền mặt**: Nhập số tiền khách đưa → Hệ thống tính tiền thối lại → Bấm xác nhận thanh toán.
   - **VietQR**: Gọi `POST /api/cashier/create-qr` → Hiển thị mã QR động có kèm số tiền và nội dung chuyển khoản → Lắng nghe sự kiện Socket `payment:completed` để tự động chốt bill.

---

## 6. Báo Hết Món — `SoldOutScreen`

- Hiển thị danh sách toàn bộ món ăn theo danh mục.
- Switch toggle bật/tắt nhanh trạng thái hết hàng:
  - Gọi API `PATCH /api/menu/items/:id/sold-out` với `{ isSoldOut: true/false }`.
  - Backend phát Socket `sold_out:updated` giúp màn hình chọn món trên Mobile, Web và QR Menu của khách cập nhật ngay lập tức không cho đặt món đó nữa.

---

## 7. Quản Lý Nguyên Liệu — `InventoryScreen`

- Xem danh sách nguyên liệu và tồn kho thực tế.
- Cảnh báo trực quan:
  - `quantity <= 0`: Nhãn đỏ **"Hết kho"**.
  - `quantity <= minStock`: Nhãn vàng **"Sắp hết"**.
  - `quantity > minStock`: Nhãn xanh **"Đủ hàng"**.
- Bấm vào nguyên liệu để mở Modal điều chỉnh số lượng (nhập số chênh lệch delta và lý do: Nhập hàng `PURCHASE`, Hư hỏng/Hao hụt `WASTE`, Kiểm kê `ADJUSTMENT`).

---

## 8. Báo Cáo Doanh Thu — `RevenueScreen`

- Chọn khoảng thời gian: Hôm nay, Hôm qua, 7 ngày qua, Tháng này.
- Thẻ số liệu chính: Doanh thu thực, Tổng số đơn, Giá trị đơn trung bình.
- Phân tích cơ cấu thanh toán: Tỷ lệ Tiền mặt vs VietQR / Chuyển khoản.
- Danh sách top món bán chạy nhất trong kỳ.

---

## 9. Realtime Socket Events Trong App Mobile

| Event | Component lắng nghe | Xử lý |
|---|---|---|
| `order:new` | `OrdersScreen`, `HomeScreen` | Cập nhật số badge đơn chờ, chèn đơn mới vào danh sách, phát chuông báo `soundService` |
| `order:updated` | `OrdersScreen` | Cập nhật trạng thái đơn (PENDING / CONFIRMED / DONE) |
| `call_staff:request` | `NotificationScreen`, `HomeScreen` | Hiện notification bàn đang gọi phục vụ, rung/chuông |
| `payment:completed` | `CashierScreen`, `TablesScreen` | Đóng bill, cập nhật bàn về trạng thái trống/chờ dọn |
| `sold_out:updated` | `SoldOutScreen`, `OrderScreen` | Cập nhật trạng thái cho phép chọn món |
| `table:status-changed`| `TablesScreen` | Đổi màu trạng thái bàn (Trống, Đang dùng, Chờ dọn) |
