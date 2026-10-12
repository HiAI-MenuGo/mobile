# Mobile System Design — HiAI-MenuGo (Expo / React Native)

## 1. Architecture Overview

**Mobile App** vận hành nhà hàng F&B cho nhân viên (iOS & Android).
- **Runtime:** Expo ~57 + React Native 0.86.3 + React 19 + TypeScript
- **Navigation:** Custom Hub Pattern — **NO React Navigation / Expo Router**
- **State:** Zustand 5 (`menuStore`, `historyStore`, `authStore`) + local `useState`
- **Styling:** `StyleSheet.create` + **NativeWind v4** + Theme Tokens (`src/theme/index.ts`)
- **Icons:** **Only** `lucide-react-native`
- **Realtime:** Socket.IO Client 4.8 (shared backend)
- **HTTP:** Axios 1.20 (with interceptors)
- **Storage:** `expo-secure-store` (encrypted, not AsyncStorage)
- **Audio:** `expo-audio` (chuông báo đơn mới)
- **Animation:** `react-native-reanimated 4.5`
- **Safe Area:** `react-native-safe-area-context 5.7`
- **Metro Port:** 8081 — **không tự đổi**

---

## 2. Navigation Architecture (Custom Hub Pattern)

### State (App.tsx)
```typescript
const [activeTab, setActiveTab] = useState<TabType>('home');
const [operationSubView, setOperationSubView] = useState<OperationSubView>('hub');

// Types from src/types/index.ts
type TabType = 'home' | 'revenue' | 'order' | 'notifications' | 'settings';
type OperationSubView = 'hub' | 'order' | 'tables' | 'orders' | 'cashier' | 'sold_out' | 'inventory' | 'history';
```

### Navigation Tree (Actual — matching code)
```
App.tsx
└── BottomNav (5 tabs)
      ├── Home        → HomeScreen
      ├── Order       → OrderScreen (POS + Cart)
      ├── Operations  → OperationsScreen (Hub)
      │     ├── order           → OrderScreen (tạo order gọi món)
      │     ├── orders          → OrdersScreen (KDS realtime)
      │     ├── tables          → TablesScreen (sơ đồ bàn)
      │     ├── cashier         → CashierScreen (thu ngân)
      │     ├── sold_out        → SoldOutScreen (báo hết món)
      │     ├── inventory       → InventoryScreen (kiểm kho)
      │     └── history         → HistoryScreen (lịch sử ca)
      ├── Revenue     → RevenueScreen
      └── Settings    → SettingsScreen
```

### Navigation Flow
1. `BottomNav` → `handleNavigate(tab, subView?)` → sets `activeTab` + `operationSubView`
2. `OperationsScreen` receives `initialSubView`, `onSubViewChange` for internal navigation
3. Sub-views render own toolbar/action bar (BottomNav hidden in sub-view except `hub`)

### Screens in `src/screens/operations/` (10 files, 7 mapped to OperationSubView)
| Screen File | OperationSubView | Used in Navigation |
|-------------|------------------|-------------------|
| `OrderScreen.tsx` | `'order'` (singular) | ✅ |
| `OrdersScreen.tsx` | `'orders'` (plural) | ✅ |
| `TablesScreen.tsx` | `'tables'` | ✅ |
| `CashierScreen.tsx` | `'cashier'` | ✅ |
| `SoldOutScreen.tsx` | `'sold_out'` | ✅ |
| `InventoryScreen.tsx` | `'inventory'` | ✅ |
| `HistoryScreen.tsx` | `'history'` | ✅ |
| `ItemOptionsScreen.tsx` | — | ❌ Not in OperationSubView |
| `MenuItemFormScreen.tsx` | — | ❌ Not in OperationSubView |
| `ModifierDetailScreen.tsx` | — | ❌ Not in OperationSubView |
| `PrepTimeDetailScreen.tsx` | — | ❌ Not in OperationSubView |

> **Note:** `ItemOptionsScreen`, `MenuItemFormScreen`, `ModifierDetailScreen`, `PrepTimeDetailScreen` exist but are NOT part of `OperationSubView` navigation. They may be used as modals or separate navigation flows.

---

## 3. State Management (Zustand)

### Stores
| Store | Path | Purpose |
|-------|------|---------|
| `useAuthStore` | `src/data/authStore.ts` | Token, user, login/logout, SecureStore persistence |
| `useMenuStore` | `src/data/menuStore.ts` | Menu items, categories, fetch from API |
| `useHistoryStore` | `src/data/historyStore.ts` | Order history, pagination, filters |

### Local State (useState)
- Cart: `App.tsx` — `CartItem[]` with composite key
- UI toggles: modals, loading, form inputs

---

## 4. API Client (`src/services/api.ts`)

### Platform-Aware Base URL
```typescript
const DEFAULT_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:5001'  // Android emulator → host machine
  : 'http://localhost:5001'; // iOS Simulator / Web / Device
```

### Token Management
- `setAuthToken(token)` / `getAuthToken()` — in-memory + Axios default header
- `authStore` persists to **expo-secure-store**
- Auto-refresh on 401: `authStore.loadFromStorage()` → tries `/api/auth/refresh`

### Usage
```typescript
import { api } from '@/services/api';

// GET
const tables = await api.getTables(branchId);

// POST
await api.updateTableStatus(tableId, 'OCCUPIED', branchId);

// Auth
const { user, accessToken, refreshToken } = await api.login(email, password);
```

---

## 5. Socket.IO Realtime (`src/hooks/useSocket.ts`)

### Singleton Pattern
```typescript
let sharedSocket: Socket | null = null;

export function getSocket(config): Socket { /* ... */ }
export function useSocket(config) { /* connection state + emit */ }
export function useSocketEvent(event, handler, deps) { /* auto-subscribe */ }
```

### Connection Config
```typescript
getSocket({
  token: authToken,
  tenantId: 'default-tenant',
  branchId: 'default-branch',
  autoConnect: true,
});
```

### Room & Events (match backend `SOCKET_EVENTS`)
- Joins: `branch:{branchId}` (staff) or `table:{tableId}` (guest QR)
- Listens: `order:new` → `soundService.playNewOrderAlert()`
- Listens: `payment:completed` → `soundService.playPaymentCompleteAlert()`
- Listens: `order:updated`, `order:item-status`, `table:status-changed`, `sold_out:updated`, `session:closed`

### Usage in Screens
```typescript
const { isConnected } = useSocket({ token, tenantId, branchId });

useSocketEvent('order:new', (data) => { refreshOrders(); }, []);
useSocketEvent('table:status-changed', (data) => { updateTable(data); }, []);
```

---

## 6. Theme System (`src/theme/index.ts`) — MANDATORY

### Tokens
```typescript
import { theme } from '@/theme';

// Colors
theme.colors.primary        // #00A389
theme.colors.background     // #0F172A (dark)
theme.colors.surface        // #1E293B
theme.colors.textPrimary    // #F8FAFC
theme.colors.textSecondary  // #94A3B8
theme.colors.border         // #334155

// Spacing
theme.spacing.xs  // 4
theme.spacing.sm  // 8
theme.spacing.md  // 16
theme.spacing.lg  // 24

// Border Radius
theme.radii.sm  // 8
theme.radii.md  // 12
theme.radii.lg  // 16
theme.radii.xl  // 24

// Shadows
theme.shadows.card
theme.shadows.modal
```

### Forbidden
```tsx
// ❌ Never hardcode
<View style={{ backgroundColor: '#FF5733' }}>
<Text style={{ color: '#FFFFFF' }}>

// ✅ Always use theme
<View className="bg-primary">
<View style={styles.container}> // StyleSheet with theme values
```

### StyleSheet Pattern
```typescript
const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
});
```

---

## 7. Cart Composite Key (CRITICAL)

### Unique Key per Variant
```typescript
const cartItemId = `${item.id}__${JSON.stringify(selectedModifiers)}__${note || ''}`;

// Examples:
// "item1__{}"                          → Trà Đào (no modifiers)
// "item1__{}"__"less ice"             → Trà Đào + note
// "item1__{"Đường":"50%","Đá":"70%"}__" → Trà Đào 50% đường 70% đá
// "item1__{"Đường":"100%","Đá":"70%"}__" → Trà Đào 100% đường 70% đá (DIFFERENT line)
```

### Why
- Same drink + different modifiers = **separate lines** in cart, kitchen ticket, bill
- Modifier JSON stringified → deterministic key

---

## 8. Sound Alerts (`src/services/sound.ts`)

### Setup
```typescript
// assets/sounds/new_order.mp3, payment_complete.mp3 required
soundService.playNewOrderAlert();      // order:new
soundService.playPaymentCompleteAlert(); // payment:completed
```

### Usage
- Auto-play via `useSocket` listeners
- User toggle: `authStore.soundEnabled` (persisted)

---

## 9. Safe Area Handling — MANDATORY

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function MyScreen() {
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? Math.max(insets.bottom - 16, 6) : 6;

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPadding + 76 }} // + tab bar
      >
        {/* content */}
      </ScrollView>
      <BottomNav />
    </View>
  );
}
```

### Rules
- **Always** use `useSafeAreaInsets()` on top-level screens
- Account for: status bar (top), home indicator (bottom), tab bar (76px)
- Test on: iPhone (notch/Dynamic Island), Android (gesture nav), iPad

---

## 10. Icons — Lucide Only

```typescript
import { UtensilsCrossed, Receipt, CheckCircle2, TrendingUp, Flame } from 'lucide-react-native';

<UtensilsCrossed size={22} color={theme.colors.primary} />
```

### Rules
- **Only** `lucide-react-native` — no `react-native-vector-icons`, `expo-icons`
- Import individually (tree-shaking)
- Size: 18-24 for UI, 28-32 for feature icons

---

## 11. Type Definitions (`src/types/index.ts`) — Single Source

### Core Types
```typescript
type TabType = 'home' | 'revenue' | 'order' | 'notifications' | 'settings';
type OperationSubView = 'hub' | 'order' | 'tables' | 'orders' | 'cashier' | 'sold_out' | 'inventory' | 'history';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  isPopular?: boolean;
  description?: string;
  modifierGroups?: ModifierGroup[];
  prepTimeMinutes?: number;
}

interface CartItem {
  cartItemId: string; // composite key
  item: MenuItem;
  quantity: number;
  selectedModifiers?: Record<string, string>;
  note?: string;
  unitPrice?: number;
}
```

### Rules
- All shared types in `src/types/index.ts`
- API response types in `src/services/api.ts`
- No duplicate interfaces across files

---

## 12. Environment Variables

### `.env`
```env
EXPO_PUBLIC_API_URL=http://192.168.1.x:5000/api
```

### Platform Resolution (api.ts)
| Platform | Resolved URL |
|----------|--------------|
| Android Emulator | `http://10.0.2.2:5001/api` |
| iOS Simulator | `http://localhost:5001/api` |
| Physical Device (LAN) | `http://192.168.x.x:5000/api` |
| Expo Web | `http://localhost:5001/api` |

### Multi-Device Setup
1. Windows backend: `ipconfig` → IPv4 (e.g., `192.168.1.50`)
2. Mac `.env`: `EXPO_PUBLIC_API_URL=http://192.168.1.50:5000/api`
3. Run Metro: `npx expo start --lan`
4. Scan QR with Expo Go (phone) or press `i` (iOS Simulator)

---

## 13. Common Patterns

### Data Fetching with Loading
```typescript
const [loading, setLoading] = useState(false);
const { items, fetchMenuItems } = useMenuStore();

const loadData = useCallback(async () => {
  setLoading(true);
  await fetchMenuItems(branchId);
  setLoading(false);
}, [fetchMenuItems, branchId]);

useEffect(() => { loadData(); }, [loadData]);

<ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}>
```

### Optimistic Updates
```typescript
const toggleSoldOut = async (itemId: string, isSoldOut: boolean) => {
  updateItem(itemId, { isSoldOut }); // 1. Optimistic UI
  try { await api.toggleSoldOut(itemId, isSoldOut, branchId); }
  catch { updateItem(itemId, { isSoldOut: !isSoldOut }); } // 2. Rollback
};
```

### Modal/Bottom Sheet
- Use `react-native-reanimated` + `react-native-gesture-handler`
- `ItemOptionsScreen`, `ModifierDetailScreen`, `PrepTimeDetailScreen` pushed via `operationSubView`

---

## 14. Team Assignment

| Member | Platform | Screens |
|--------|----------|---------|
| **A (iOS)** | iPhone / iOS Simulator | `App.tsx` shell, `HomeScreen`, `OrderScreen`, `RevenueScreen`, `NotificationScreen`, `LoginScreen` |
| **B (Android)** | Android / Emulator | `OperationsScreen` hub + all 7 sub-views in `operations/` |

---

## 15. File Navigation Quick Reference

| Need | File |
|------|------|
| Entry + routing | `App.tsx`, `index.ts` |
| Auth gate | `App.tsx` (AuthGate, MainApp) |
| Tab bar | `src/components/BottomNav.tsx` |
| Home | `src/screens/HomeScreen.tsx` |
| Revenue | `src/screens/RevenueScreen.tsx` |
| Operations Hub | `src/screens/OperationsScreen.tsx` |
| KDS | `src/screens/operations/OrdersScreen.tsx` |
| Cashier | `src/screens/operations/CashierScreen.tsx` |
| Tables | `src/screens/operations/TablesScreen.tsx` |
| Sold Out | `src/screens/operations/SoldOutScreen.tsx` |
| Inventory | `src/screens/operations/InventoryScreen.tsx` |
| History | `src/screens/operations/HistoryScreen.tsx` |
| Types | `src/types/index.ts` |
| Theme | `src/theme/index.ts` |
| Auth store | `src/data/authStore.ts` |
| Menu store | `src/data/menuStore.ts` |
| API client | `src/services/api.ts` |
| Socket hook | `src/hooks/useSocket.ts` |
| Sound | `src/services/sound.ts` |
| Expo config | `app.json`, `eas.json` |

---

## 16. Quality Gates (Pre-push)

```bash
npx expo start -c    # Clear Metro cache
npm run ios          # iOS Simulator test
npm run android      # Android Emulator test
# TypeScript strict mode in tsconfig.json
# No `any` — use types from src/types/index.ts
```

---

## 17. Forbidden Patterns

| ❌ Forbidden | ✅ Use Instead |
|-------------|----------------|
| `react-navigation` / `expo-router` | Custom `activeTab` + `operationSubView` |
| `AsyncStorage` for tokens | `expo-secure-store` via `authStore` |
| Hardcoded colors (`#FF5733`) | `theme.colors.*` from `@/theme` |
| `localStorage` (web) | `expo-secure-store` + try/catch |
| Separate StyleSheet without theme | Import `theme` from `@/theme` |
| New Zustand store | Existing `menuStore`, `historyStore`, `authStore` |
| Direct `fetch()` / `axios` | `api` from `src/services/api.ts` |
| `console.log` in production | Remove or `__DEV__` guard |

---

## 18. Platform-Specific Notes

### Android
- Emulator: `10.0.2.2` maps to host `localhost` (handled in `api.ts:5`)
- Cleartext HTTP allowed for dev (debug manifest auto-configured by Expo)

### iOS
- Simulator: `localhost` works directly
- Physical device: Must use LAN IP, same WiFi as Mac
- `expo-secure-store` uses Keychain (works on device + simulator)

### Web (Expo Web)
- `expo-secure-store` no-op (try/catch in `authStore.ts`)
- Socket.IO works via polling fallback