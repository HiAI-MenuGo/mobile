# HiAI-MenuGo Mobile — Master Code Patterns & Skills (SKILLS)

> **Góc nhìn Mobile (React Native):** Tài liệu này chứa toàn bộ các **mẫu screen architecture, navigation hub pattern, theme styling, sound service, cart composite key và realtime socket snippets chuẩn** trong Expo ~57 + React Native 0.86 của HiAI-MenuGo Staff App.
>
> - 🧭 Index & Cấu trúc repo: [AGENTS.md](./AGENTS.md)
> - 📖 Nghiệp vụ: [BUSINESS.md](./BUSINESS.md)
> - ⛔ Luật bắt buộc: [RULES.md](./RULES.md)
> - 🔧 Tech Stack: [TECHS.md](./TECHS.md)

---

## 1. Custom Hub Navigation Pattern (No React Navigation)

Dự án **tuyệt đối không dùng** `react-navigation` hay `expo-router`. Toàn bộ app điều hướng qua state trong `App.tsx`:

```tsx
// App.tsx
import React, { useState } from 'react';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabType, OperationSubView } from './src/types';
import { HomeScreen } from './src/screens/HomeScreen';
import { OperationsScreen } from './src/screens/OperationsScreen';
import { BottomNav } from './src/components/BottomNav';

export default function MainApp() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [operationSubView, setOperationSubView] = useState<OperationSubView>('hub');

  // Hàm chuyển màn hình linh hoạt
  const handleNavigate = (tab: TabType, subView?: OperationSubView) => {
    setActiveTab(tab);
    if (tab === 'order') {
      setOperationSubView(subView || 'hub');
    }
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen onNavigate={handleNavigate} />;
      case 'order':
        return (
          <OperationsScreen
            initialSubView={operationSubView}
            onSubViewChange={setOperationSubView}
            onBackToHub={() => setOperationSubView('hub')}
          />
        );
      default:
        return <HomeScreen onNavigate={handleNavigate} />;
    }
  };

  const dynamicTop = Math.max(insets.top, Platform.OS === 'android' ? 24 : 44);

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: dynamicTop }}>
      <View className="flex-1 bg-background">{renderScreen()}</View>
      {(activeTab !== 'order' || operationSubView === 'hub') && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => handleNavigate(tab, 'hub')}
          bottomInset={insets.bottom}
        />
      )}
    </View>
  );
}
```

---

## 2. Safe Area Insets & Touch Feedback Styling

Mọi màn hình trên thiết bị di động phải đảm bảo không bị che khuất bởi tai thỏ (Notch / Dynamic Island) và thanh điều hướng đáy:

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';

export function StandardScreenContainer({ title, children }: { title: string; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const dynamicPaddingBottom = (insets.bottom > 0 ? Math.max(insets.bottom - 16, 6) : 6) + 76;

  return (
    <View className="flex-1 bg-background">
      {/* Header Bar */}
      <View className="bg-white px-4 py-3 border-b border-border flex-row items-center justify-between">
        <Text className="text-[18px] font-extrabold text-textMain">{title}</Text>
      </View>

      {/* Nội dung có cuộn */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: dynamicPaddingBottom }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}
```

### Quy Chuẩn Touch Feedback:
- Dùng `TouchableOpacity` hoặc `Pressable` với `activeOpacity={0.75}`.
- Không để nút bấm trơ không có phản hồi thị giác khi chạm.

---

## 3. Cart State & Composite Key Pattern

Để phân biệt món cùng tên nhưng khác kích cỡ / đường / đá / topping trong giỏ hàng:

```typescript
export interface CartItem {
  cartItemId: string; // Khóa tổng hợp
  item: MenuItem;
  quantity: number;
  unitPrice: number;
  selectedModifiers?: Record<string, string>;
  note?: string;
}

// Hàm thêm vào giỏ:
export function createCartItemId(itemId: string, modifiers?: Record<string, string>, note?: string): string {
  const modKey = modifiers ? JSON.stringify(modifiers) : '';
  const noteKey = note?.trim() || '';
  return `${itemId}__${modKey}__${noteKey}`;
}

// Tính đơn giá có phụ thu extraPrice:
export function calculateUnitPrice(basePrice: number, modifiers?: Record<string, string>, modifierGroups?: any[]): number {
  let extra = 0;
  if (modifiers && modifierGroups) {
    modifierGroups.forEach((group) => {
      const selectedOptionName = modifiers[group.name];
      const foundOpt = group.options?.find((o: any) => o.name === selectedOptionName);
      if (foundOpt?.extraPrice) extra += foundOpt.extraPrice;
    });
  }
  return basePrice + extra;
}
```

---

## 4. Realtime Socket Hook Pattern (`useSocketEvent`)

Hook tự động đăng ký và hủy lắng nghe Socket.IO khi màn hình đóng mở:

```typescript
import { useEffect } from 'react';
import { socketService } from '../services/socket';

export function useSocketEvent(event: string, callback: (...args: any[]) => void) {
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    socket.on(event, callback);

    return () => {
      socket.off(event, callback); // Cleanup bắt buộc
    };
  }, [event, callback]);
}

// Sử dụng trong OrdersScreen.tsx (Quản Lý Đơn Live):
useSocketEvent('order:new', (newOrder) => {
  soundService.playAlertSound();
  fetchOrders(); // Tải lại danh sách đơn
});

useSocketEvent('order:updated', () => {
  fetchOrders();
});
```

---

## 5. Âm Thanh Chuông Báo (`soundService`)

Sử dụng service âm thanh tập trung để cảnh báo đơn mới và yêu cầu gọi bàn:

```typescript
import { Audio } from 'expo-av';

class SoundService {
  private sound: Audio.Sound | null = null;

  async playAlertSound() {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/alert.mp3'),
        { shouldPlay: true }
      );
      this.sound = sound;
    } catch (error) {
      console.warn('[SoundService] Không thể phát âm thanh chuông:', error);
    }
  }
}

export const soundService = new SoundService();
```

---

## 6. Secure Storage & Token Authentication

Lưu trữ token nhạy cảm bằng `expo-secure-store`:

```typescript
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'user_access_token';
const REFRESH_TOKEN_KEY = 'user_refresh_token';

export async function saveAuthTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function getAccessToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearAuthTokens() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
```

---

## 7. Format Tiền Tệ & Đếm Ngược

```typescript
// Format tiền tệ VND:
export const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(val);
};

// Đếm ngược thời gian chế biến (mm:ss):
export const formatCountdown = (seconds?: number): string => {
  if (seconds === undefined || seconds === null) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};
```
