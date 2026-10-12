# HiAI-MenuGo Mobile — Tech Stack & Dependencies (TECHS)

> **Góc nhìn Mobile (React Native):** Tài liệu công nghệ chi tiết, phiên bản SDK Expo, React Native, NativeWind, cấu hình Metro Bundler và kết nối mạng LAN dành riêng cho repo `mobile/`.
>
> - 🧭 Index & Cấu trúc repo: [AGENTS.md](./AGENTS.md)
> - 📖 Nghiệp vụ: [BUSINESS.md](./BUSINESS.md)
> - ⛔ Luật bắt buộc: [RULES.md](./RULES.md)
> - 🎨 Mastery Skills: [SKILLS.md](./SKILLS.md)

---

## 1. Core Stack & Runtime

| Thành phần | Công nghệ / Phiên bản | Vai trò & Mục đích |
|---|---|---|
| **Nền tảng** | Expo ~57.0.23 | SDK phát triển ứng dụng di động đa nền tảng |
| **Framework** | React Native 0.86.3 | Core framework cho iOS và Android |
| **Giao diện** | React 19.2.3 | UI runtime |
| **Ngôn ngữ** | TypeScript ~6.0.3 | Strict mode, extends `expo/tsconfig.base` |
| **Styling** | NativeWind v4 + StyleSheet | Utility-first CSS cho React Native kết hợp Theme Tokens |
| **Điều hướng** | Custom Tab & Hub Pattern | Điều hướng state qua `App.tsx` (**CẤM** React Navigation / Expo Router) |
| **Icons** | `lucide-react-native` ^1.47.0 | Bộ icon duy nhất toàn app |
| **State** | Zustand 5.0.15 | Quản lý state toàn cục (`menuStore`, `authStore`, `historyStore`) |
| **Bảo mật** | `expo-secure-store` | Lưu trữ Access Token & Refresh Token an toàn native |
| **HTTP Client** | Axios | Gọi API backend kèm request/response interceptors |
| **Realtime** | `socket.io-client` 4.8 | Kết nối realtime nhận sự kiện đơn hàng, thanh toán, hết món |
| **Âm thanh** | `expo-av` / `expo-audio` | Phát âm thanh chuông báo khi có đơn mới hoặc gọi phục vụ |

---

## 2. Port & Cấu Hình Mạng (LAN Setup)

- **Cổng Metro Bundler:** `8081` (khởi chạy qua lệnh `npm start`).
- **Địa chỉ kết nối Backend API:**
  - **Thiết bị thật (iOS / Android qua Expo Go):** Dùng IP mạng WiFi nội bộ của máy chủ backend:
    ```
    http://192.168.x.x:5000/api
    ```
  - **Android Emulator:** Dùng gateway mặc định của máy ảo:
    ```
    http://10.0.2.2:5000/api
    ```
  - **iOS Simulator:** Có thể trỏ về:
    ```
    http://localhost:5000/api
    ```
- App tích hợp modal cấu hình Server IP linh hoạt ngay trong màn hình Cài đặt (`SettingsScreen`).

---

## 3. Quản Lý Trạng Thái & Stores (Zustand)

Các store được tổ chức trong thư mục `src/data/`:

| Store | Đường dẫn | Trách nhiệm |
|---|---|---|
| `authStore.ts` | `src/data/authStore.ts` | Trạng thái đăng nhập `isAuthenticated`, thông tin user, nạp token từ SecureStore |
| `menuStore.ts` | `src/data/menuStore.ts` | Danh sách thực đơn, danh mục, trạng thái Báo hết món (`isSoldOut`) |
| `historyStore.ts` | `src/data/historyStore.ts` | Danh sách đơn hàng lịch sử, hỗ trợ nạp lại vào giỏ để sửa đơn |

*Lưu ý: Giỏ hàng chọn món POS (`cart`) được quản lý bằng React state có composite key trong `App.tsx` và truyền xuống các subview qua props.*

---

## 4. Theme & Tokens Hệ Thống

Định nghĩa tập trung tại `src/theme/index.ts`:
- **Primary:** `#00A389` (Xanh ngọc thương hiệu)
- **Background:** `#F8FAFC` (Canvas sáng sang trọng)
- **Card Surface:** `#FFFFFF`, viền `#F1F5F9`
- **Text:** Chính `#0F172A`, Phụ `#64748B`
- **Status Colors:**
  - `success`: `#059669` (Hoàn tất)
  - `warning`: `#D97706` (Chờ xử lý PENDING)
  - `info`: `#2563EB` (Đang chế biến CONFIRMED)
  - `danger`: `#E11D48` (Hết hàng / Hủy đơn)

---

## 5. Scripts Vận Hành

```bash
npm start            # Khởi động Expo Metro Bundler (cổng 8081)
npm run android      # Mở app trên máy ảo hoặc thiết bị Android kết nối ADB
npm run ios          # Mở app trên iOS Simulator (yêu cầu macOS & Xcode)
npm run web          # Chạy Expo Web để kiểm tra nhanh giao diện
```
