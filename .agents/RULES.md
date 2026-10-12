# Mobile Rules — HiAI-MenuGo (Expo / React Native)

## 1. Architecture & Navigation

### Custom Hub Pattern (No React Navigation / Expo Router)
```
App.tsx
  └── BottomNav (5 tabs)
        ├── Home        → HomeScreen
        ├── Order       → OrderScreen (POS + Cart)
        ├── Operations  → OperationsScreen (Hub)
        │     ├── orders          → OrdersScreen (Quản lý đơn hàng live)
        │     ├── cashier         → CashierScreen
        │     ├── tables          → TablesScreen
        │     ├── sold-out        → SoldOutScreen
        │     ├── inventory       → InventoryScreen
        │     ├── history         → HistoryScreen
        │     ├── item-options    → ItemOptionsScreen
        │     ├── menu-item-form  → MenuItemFormScreen
        │     ├── modifier-detail → ModifierDetailScreen
        │     └── prep-time       → PrepTimeDetailScreen
        ├── Revenue     → RevenueScreen
        └── Settings    → SettingsScreen
```

### Navigation State (App.tsx)
```typescript
const [activeTab, setActiveTab] = useState<TabType>('home');
const [operationSubView, setOperationSubView] = useState<OperationSubView | null>(null);

// Navigate:
onNavigate('operations', 'cashier'); // setActiveTab('operations'), setOperationSubView('cashier')
onNavigate('home'); // setActiveTab('home'), setOperationSubView(null)
```

### Rules
- **Never** install `react-navigation`, `expo-router`, or any routing library.
- All navigation via `activeTab` + `operationSubView` props.
- `BottomNav.tsx` renders tab bar, highlights active.
- `OperationsScreen.tsx` renders sub-view based on `operationSubView`.

---

## 2. State Management (Zustand)

### Stores
| Store | Path | Purpose |
|-------|------|---------|
| `useMenuStore` | `src/data/menuStore.ts` | Menu items, categories, fetch from API |
| `useHistoryStore` | `src/data/historyStore.ts` | Order history, pagination, filters |
| `useAuthStore` | `src/data/authStore.ts` | User, tokens, login/logout, secure storage |

### Rules
- **No** Redux, Context API for global state.
- Local component state: `useState` / `useReducer` (cart, form inputs, UI toggles).
- Selectors: `useMenuStore(s => s.items)` not `useMenuStore()`.

---

## 3. API Client (`src/services/api.ts`)

### Base URL Resolution
```typescript
// Platform-aware
const DEFAULT_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:5001'  // Android emulator → host machine
  : 'http://localhost:5001'; // iOS Simulator / Web / Device
```

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

### Token Management
- `setAuthToken(token)` / `getAuthToken()` in `api.ts` — in-memory + Axios default header.
- `authStore` persists to **expo-secure-store** (encrypted, not AsyncStorage).
- Auto-refresh on 401: `authStore.loadFromStorage()` → tries `/api/auth/refresh`.

---

## 4. Socket.IO (`src/hooks/useSocket.ts`)

### Singleton Pattern
```typescript
let sharedSocket: Socket | null = null;

export function getSocket(config): Socket {
  if (!sharedSocket) { /* create with io() */ }
  return sharedSocket;
}

export function useSocket(config) { /* connection state + emit helper */ }
export function useSocketEvent(event, handler, deps) { /* auto-subscribe */ }
```

### Connection Config
```typescript
getSocket({
  token: authToken,           // JWT access token
  tenantId: 'default-tenant', // from user.tenantId
  branchId: 'default-branch', // from user.branchId or selected
  autoConnect: true,
});
```

### Room & Events
- Joins: `branch:{branchId}` (staff) or `table:{tableId}` (guest QR).
- Listens: `order:new` → `soundService.playNewOrderAlert()`
- Listens: `payment:completed` → `soundService.playPaymentCompleteAlert()`

### Usage in Screens
```typescript
const { isConnected } = useSocket({ token, tenantId, branchId });

// Subscribe to events
useSocketEvent('order:new', (data) => { refreshOrders(); }, []);
useSocketEvent('table:status-changed', (data) => { updateTable(data); }, []);
```

---

## 5. Theme System (`src/theme/index.ts`)

### Mandatory Usage
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

## 6. Cart Composite Key (Critical)

### Unique Key per Variant
```typescript
// src/screens/OrderScreen.tsx
const cartItemId = `${item.id}__${JSON.stringify(selectedModifiers)}__${note || ''}`;

// Examples:
// "item1__{}"                          → Trà Đào (no modifiers)
// "item1__{}"__"less ice"             → Trà Đào + note
// "item1__{"Đường":"50%","Đá":"70%"}__" → Trà Đào 50% đường 70% đá
// "item1__{"Đường":"100%","Đá":"70%"}__" → Trà Đào 100% đường 70% đá (DIFFERENT line)
```

### Why
- Same drink + different modifiers = **separate lines** in cart, kitchen ticket, bill.
- Modifier JSON stringified → deterministic key.

---

## 7. Sound Alerts (`src/services/sound.ts`)

### Setup
```typescript
// assets/sounds/new_order.mp3, payment_complete.mp3 required
soundService.playNewOrderAlert();      // order:new
soundService.playPaymentCompleteAlert(); // payment:completed
```

### Usage
- Auto-play via `useSocket` listeners (see Section 4).
- User toggle: `authStore.soundEnabled` (persisted).

---

## 8. Safe Area Handling

### Mandatory
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
      <BottomNav /> {/* fixed bottom */}
    </View>
  );
}
```

### Rules
- **Always** use `useSafeAreaInsets()` on top-level screens.
- Account for: status bar (top), home indicator (bottom), tab bar (76px).
- Test on: iPhone (notch/Dynamic Island), Android (gesture nav), iPad.

---

## 9. Icons (Lucide Only)

```typescript
import { 
  UtensilsCrossed, 
  Receipt, 
  CheckCircle2, 
  TrendingUp, 
  Flame 
} from 'lucide-react-native';

// Usage
<UtensilsCrossed size={22} color={theme.colors.primary} />
```

### Rules
- **Only** `lucide-react-native` — no `react-native-vector-icons`, `expo-icons`, etc.
- Import individually (tree-shaking).
- Size: 18-24 for UI, 28-32 for feature icons.

---

## 10. Type Definitions (`src/types/index.ts`)

### Core Types
```typescript
type TabType = 'home' | 'revenue' | 'order' | 'notifications' | 'settings';
type OperationSubView = 'hub' | 'orders' | 'cashier' | 'tables' | 'sold_out' | 'inventory' | 'history' | 'item_options' | 'menu_item_form' | 'modifier_detail' | 'prep_time';

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
- All shared types in `src/types/index.ts` — single source.
- API response types in `src/services/api.ts` (inline or imported).
- No duplicate interfaces across files.

---

## 11. Environment Variables

### `.env`
```env
EXPO_PUBLIC_API_URL=http://192.168.1.x:5000/api
```

### Platform-Specific Resolution (api.ts)
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

## 12. Common Patterns

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

// Pull-to-refresh
<ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}>
```

### Optimistic Updates
```typescript
// Toggle sold out
const toggleSoldOut = async (itemId: string, isSoldOut: boolean) => {
  // 1. Optimistic UI
  updateItem(itemId, { isSoldOut });
  // 2. API call
  try { await api.toggleSoldOut(itemId, isSoldOut, branchId); }
  catch { updateItem(itemId, { isSoldOut: !isSoldOut }); } // rollback
};
```

### Modal/Bottom Sheet
- Use `react-native-reanimated` + `react-native-gesture-handler` for performant animations.
- `ItemOptionsScreen`, `ModifierDetailScreen`, `PrepTimeDetailScreen` pushed via `operationSubView`.

---

## 13. Quality & Build

```bash
npm start            # Metro (port 8081)
npm run ios          # iOS Simulator
npm run android      # Android Emulator
npm run web          # Expo Web
npx expo start -c    # Clear Metro cache
```

### Pre-commit
- TypeScript strict mode: `tsconfig.json` → `"strict": true`
- No `any` — use types from `src/types/index.ts`
- ESLint: `npm run lint` (if configured)
- Test on both iOS & Android before push

---

## 14. Forbidden Patterns

| ❌ Forbidden | ✅ Use Instead |
|-------------|----------------|
| `react-navigation` / `expo-router` | Custom `activeTab` + `operationSubView` |
| `AsyncStorage` for tokens | `expo-secure-store` via `authStore` |
| Hardcoded colors (`#FF5733`) | `theme.colors.*` from `@/theme` |
| `localStorage` (web) | `expo-secure-store` (native) + try/catch |
| Separate `StyleSheet` per file without theme | Import `theme` from `@/theme` |
| New Zustand store | Existing `menuStore`, `historyStore`, `authStore` |
| Direct `fetch()` / `axios` | `api` from `src/services/api.ts` |
| `console.log` in production | Remove or use `__DEV__` guard |

---

## 15. Debugging Checklist

| Symptom | Check |
|---------|-------|
| API `Network Error` | `.env` IP correct? Backend running? Port 5000/5001? |
| Metro not reloading | `npx expo start -c` (clear cache) |
| iOS Simulator won't open | `xcode-select --install`, Xcode → Settings → Locations |
| Android build fail | `android/local.properties` → `sdk.dir=/path/to/sdk` |
| Socket not connecting | `EXPO_PUBLIC_API_URL` port matches backend? Backend log `⚡ [useSocket] Connected` |
| Theme not applying | Import `theme` from `@/theme`, check `tailwind.config.js` content paths |
| Sound not playing | Files in `assets/sounds/`, `soundEnabled` in authStore |
| Safe area wrong | `useSafeAreaInsets()` used? Test on device with notch |

---

## 16. Platform-Specific Notes

### Android
- Emulator: `10.0.2.2` maps to host `localhost` (handled in `api.ts:5`).
- Cleartext HTTP allowed for dev (debug manifest auto-configured by Expo).

### iOS
- Simulator: `localhost` works directly.
- Physical device: Must use LAN IP, same WiFi as Mac.
- `expo-secure-store` uses Keychain (works on device + simulator).

### Web (Expo Web)
- `expo-secure-store` no-op (try/catch in `authStore.ts`).
- Socket.IO works via polling fallback.