# SouqOne — Master Brief for Cascade
> اقرأ هذا الملف كاملاً قبل كتابة أي كود. كل قرار معماري موثق هنا.

---

## 1. Project Overview

**الاسم:** SouqOne  
**النوع:** React Native mobile app (iOS + Android)  
**الوصف:** منصة إعلانات مركبات شاملة تجمع بين بيع/شراء السيارات، وظائف السائقين، خدمات السيارات، قطع الغيار، الباصات، المعدات الثقيلة، وطلبات النقل.  
**السوق المستهدف:** سلطنة عُمان (RTL — Arabic)  
**Backend:** NestJS موجود ومكتمل — لا تعدّل فيه

---

## 2. Tech Stack

```
Framework:        Expo SDK 51 (Managed Workflow)
Language:         TypeScript (strict mode)
Navigation:       Expo Router v3 (file-based)
State:            Zustand
Server State:     TanStack React Query v5
HTTP Client:      Axios
Auth Storage:     expo-secure-store
Real-time:        Socket.IO Client
Images:           expo-image + expo-image-picker
Notifications:    expo-notifications
Styling:          StyleSheet.create() — NO NativeWind
Font:             Cairo (Arabic) via expo-google-fonts
Icons:            @expo/vector-icons (Ionicons)
```

### Installation Commands
```bash
npx create-expo-app SouqOne --template blank-typescript
cd SouqOne

npx expo install expo-router expo-secure-store expo-image expo-image-picker
npx expo install expo-notifications expo-font @expo-google-fonts/cairo
npx expo install react-native-screens react-native-safe-area-context
npx expo install react-native-gesture-handler react-native-reanimated

npm install @tanstack/react-query axios zustand socket.io-client
npm install @react-native-async-storage/async-storage
```

---

## 3. Design Tokens

### Colors
```typescript
// src/constants/colors.ts
export const Colors = {
  // Brand
  primary:        '#1565C0',   // SouqOne Blue
  primaryLight:   '#EBF2FE',
  primaryDark:    '#0D47A1',
  accent:         '#FF6D00',   // SouqOne Orange
  accentLight:    '#FFF0E0',

  // Neutrals
  dark:           '#1C1C1E',
  gray700:        '#3A3A3C',
  gray400:        '#8E8E93',
  gray200:        '#C7C7CC',
  gray100:        '#E5E5EA',
  background:     '#F2F2F7',
  surface:        '#FFFFFF',

  // Semantic
  success:        '#34C759',
  successLight:   '#EBF8F1',
  warning:        '#FF9500',
  warningLight:   '#FFF8E6',
  error:          '#FF3B30',
  errorLight:     '#FEF0F0',
  info:           '#1565C0',
  infoLight:      '#EBF2FE',
} as const
```

### Spacing
```typescript
// src/constants/spacing.ts
export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
} as const
```

### Typography
```typescript
// src/constants/typography.ts
export const Typography = {
  h1:      { fontSize: 32, fontFamily: 'Cairo_700Bold',   lineHeight: 40 },
  h2:      { fontSize: 24, fontFamily: 'Cairo_600SemiBold', lineHeight: 32 },
  h3:      { fontSize: 20, fontFamily: 'Cairo_600SemiBold', lineHeight: 28 },
  body:    { fontSize: 16, fontFamily: 'Cairo_400Regular', lineHeight: 26 },
  bodyMd:  { fontSize: 14, fontFamily: 'Cairo_400Regular', lineHeight: 22 },
  caption: { fontSize: 13, fontFamily: 'Cairo_400Regular', lineHeight: 20 },
  small:   { fontSize: 11, fontFamily: 'Cairo_400Regular', lineHeight: 17 },
  price:   { fontSize: 22, fontFamily: 'Cairo_700Bold',   color: '#FF6D00' },
  label:   { fontSize: 13, fontFamily: 'Cairo_500Medium', lineHeight: 20 },
} as const
```

### Border Radius
```typescript
export const Radius = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
} as const
```

---

## 4. Folder Structure

```
SouqOne/
├── app/                          ← Expo Router (file-based routing)
│   ├── _layout.tsx               ← Root layout + auth gate
│   ├── onboarding.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── verify-email.tsx
│   │   ├── forgot-password.tsx
│   │   └── reset-password.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx           ← Bottom tab navigator
│   │   ├── index.tsx             ← Home
│   │   ├── search.tsx
│   │   ├── post.tsx              ← Redirects to modal
│   │   ├── chat.tsx
│   │   └── profile.tsx
│   ├── (modals)/
│   │   ├── _layout.tsx
│   │   ├── post-category.tsx
│   │   ├── filters.tsx
│   │   ├── image-viewer.tsx
│   │   └── bid.tsx
│   ├── listings/[id].tsx
│   ├── jobs/
│   │   ├── [id].tsx
│   │   └── apply/[id].tsx
│   ├── services/[id].tsx
│   ├── parts/[id].tsx
│   ├── buses/[id].tsx
│   ├── equipment/[id].tsx
│   ├── transport/[id].tsx
│   ├── chat/[roomId].tsx
│   └── profile/
│       ├── [userId].tsx
│       ├── settings.tsx
│       ├── subscription.tsx
│       ├── favorites.tsx
│       └── notifications.tsx
│
└── src/
    ├── api/
    │   ├── client.ts             ← Axios instance + interceptors
    │   ├── auth.ts
    │   ├── listings.ts
    │   ├── jobs.ts
    │   ├── services.ts
    │   ├── parts.ts
    │   ├── buses.ts
    │   ├── equipment.ts
    │   ├── transport.ts
    │   ├── chat.ts
    │   ├── search.ts
    │   ├── uploads.ts
    │   ├── favorites.ts
    │   ├── reviews.ts
    │   ├── payments.ts
    │   └── notifications.ts
    ├── hooks/                    ← React Query hooks
    │   ├── useListings.ts
    │   ├── useJobs.ts
    │   ├── useSearch.ts
    │   ├── useChat.ts
    │   └── ...
    ├── store/                    ← Zustand stores
    │   ├── authStore.ts
    │   ├── filtersStore.ts
    │   └── chatStore.ts
    ├── components/
    │   ├── ui/                   ← Base components
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Avatar.tsx
    │   │   ├── Chip.tsx
    │   │   ├── Divider.tsx
    │   │   ├── LoadingSpinner.tsx
    │   │   ├── EmptyState.tsx
    │   │   └── PriceText.tsx
    │   ├── cards/
    │   │   ├── ListingCard.tsx
    │   │   ├── ListingCardHorizontal.tsx
    │   │   ├── JobCard.tsx
    │   │   ├── ServiceCard.tsx
    │   │   └── ChatPreviewCard.tsx
    │   ├── layout/
    │   │   ├── ScreenHeader.tsx
    │   │   ├── SafeScreen.tsx
    │   │   └── KeyboardScreen.tsx
    │   └── features/
    │       ├── SearchBar.tsx
    │       ├── CategoryGrid.tsx
    │       ├── ImageGallery.tsx
    │       ├── FilterSheet.tsx
    │       └── SellerInfo.tsx
    ├── constants/
    │   ├── colors.ts
    │   ├── spacing.ts
    │   ├── typography.ts
    │   └── config.ts
    ├── types/
    │   ├── auth.types.ts
    │   ├── listing.types.ts
    │   ├── job.types.ts
    │   └── api.types.ts
    └── utils/
        ├── socket.ts
        ├── storage.ts
        ├── format.ts             ← formatPrice, formatDate, formatPhone
        └── validation.ts
```

---

## 5. API Configuration

### Base URL & Client
```typescript
// src/api/client.ts
import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const BASE_URL = 'https://your-api.com/api/v1'   // ← غيّر هذا

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach token
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — auto refresh
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = await SecureStore.getItemAsync('refreshToken')
      if (!refresh) {
        // Logout user
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: refresh })
      await SecureStore.setItemAsync('accessToken', data.accessToken)
      await SecureStore.setItemAsync('refreshToken', data.refreshToken)
      original.headers.Authorization = `Bearer ${data.accessToken}`
      return apiClient(original)
    }
    return Promise.reject(error)
  }
)
```

---

## 6. Auth API & Types

### Types
```typescript
// src/types/auth.types.ts
export interface User {
  id: string
  email: string
  username: string
  displayName?: string
  phone?: string
  country?: string
  governorate?: string
  city?: string
  role: 'user' | 'admin'
  isVerified: boolean
  avatar?: string
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
  requiresVerification?: boolean
}

export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  email: string
  username: string
  password: string        // 8+ chars, uppercase, number
  displayName?: string
  phone?: string
  country?: string
  governorate?: string
  city?: string
}
```

### Auth API calls
```typescript
// src/api/auth.ts
export const authApi = {
  login:          (dto: LoginDto)           => apiClient.post<AuthResponse>('/auth/login', dto),
  register:       (dto: RegisterDto)        => apiClient.post<AuthResponse>('/auth/signup', dto),
  loginGoogle:    (token: string)           => apiClient.post<AuthResponse>('/auth/google', { token }),
  refresh:        (refreshToken: string)    => apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }),
  logout:         (refreshToken: string)    => apiClient.post('/auth/logout', { refreshToken }),
  verifyEmail:    (code: string)            => apiClient.post('/auth/verify-email', { code }),
  forgotPassword: (email: string)           => apiClient.post('/auth/forgot-password', { email }),
  resetPassword:  (token: string, password: string) => apiClient.post('/auth/reset-password', { token, password }),
}
```

---

## 7. Auth Store (Zustand)

```typescript
// src/store/authStore.ts
import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { User } from '../types/auth.types'

interface AuthState {
  user: User | null
  isLoggedIn: boolean
  isLoading: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>
  logout: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  isLoading: true,

  setAuth: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync('accessToken', accessToken)
    await SecureStore.setItemAsync('refreshToken', refreshToken)
    set({ user, isLoggedIn: true })
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken')
    await SecureStore.deleteItemAsync('refreshToken')
    set({ user: null, isLoggedIn: false })
  },

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken')
      if (token) {
        // Validate token with /auth/me or decode JWT
        set({ isLoggedIn: true })
      }
    } finally {
      set({ isLoading: false })
    }
  },
}))
```

---

## 8. Root Layout — Auth Gate

```typescript
// app/_layout.tsx
import { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { useFonts, Cairo_400Regular, Cairo_500Medium, Cairo_600SemiBold, Cairo_700Bold } from '@expo-google-fonts/cairo'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '../src/store/authStore'

const queryClient = new QueryClient()

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_500Medium, Cairo_600SemiBold, Cairo_700Bold })
  const { isLoggedIn, isLoading, initialize } = useAuthStore()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => { initialize() }, [])

  useEffect(() => {
    if (isLoading || !fontsLoaded) return
    const inAuth = segments[0] === '(auth)'
    const inTabs = segments[0] === '(tabs)'

    if (!isLoggedIn && !inAuth) {
      // Allow browsing without login — only redirect protected routes
    }
  }, [isLoggedIn, isLoading, fontsLoaded, segments])

  if (!fontsLoaded || isLoading) return null

  return (
    <QueryClientProvider client={queryClient}>
      <Slot />
    </QueryClientProvider>
  )
}
```

---

## 9. Main Entities & API Endpoints

### Listings (سيارات)
```
GET    /listings                  → قائمة الإعلانات
GET    /listings/:id              → تفاصيل إعلان
POST   /listings                  → رفع إعلان جديد (Auth)
PUT    /listings/:id              → تعديل (Auth + Owner)
DELETE /listings/:id              → حذف (Auth + Owner)
GET    /listings/my               → إعلاناتي (Auth)
POST   /listings/:id/images       → رفع صور
```

```typescript
export interface Listing {
  id: string
  title: string
  description: string
  price: number
  currency: 'OMR' | 'USD'
  type: 'sale' | 'rent' | 'request'
  condition: 'new' | 'used'
  governorate: string
  city: string
  isPremium: boolean
  views: number
  user: UserSummary
  images: ListingImage[]
  car?: CarDetails
  createdAt: string
}

export interface ListingImage {
  id: string
  url: string        // Cloudinary URL
  isPrimary: boolean
  order: number
}

export interface CarDetails {
  brandId: string
  modelId: string
  year: number
  mileage: number
  fuelType: string
  transmission: string
  color: string
}
```

### Jobs (وظائف)
```
GET    /jobs                      → قائمة الوظائف
GET    /jobs/:id                  → تفاصيل وظيفة
POST   /jobs                      → نشر وظيفة (Auth)
POST   /jobs/:id/apply            → تقدم للوظيفة (Auth)
GET    /jobs/:id/applications     → المتقدمين (Auth + Owner)
```

### Services (خدمات)
```
GET    /services
GET    /services/:id
POST   /services
```

### Parts (قطع غيار)
```
GET    /parts
GET    /parts/:id
POST   /parts
```

### Equipment (معدات)
```
GET    /equipment
GET    /equipment/:id
POST   /equipment
POST   /equipment/:id/bids        → تقديم عرض مزايدة (Auth)
GET    /equipment/:id/bids        → عروض المزايدة
```

### Search
```
GET    /search?q=&entityType=&governorate=&minPrice=&maxPrice=&sortBy=&page=&limit=
GET    /search/autocomplete?q=&limit=8

entityType values: listings | jobs | services | parts | buses | equipment | operators
sortBy values: price:asc | price:desc | createdAt:desc | views:desc
```

### Chat
```
GET    /chat                      → قائمة المحادثات
GET    /chat/:roomId/messages     → رسائل محادثة
POST   /chat                      → بدء محادثة { entityType, entityId, receiverId }
```

### Uploads
```
POST   /uploads                   → صورة واحدة
POST   /uploads/multiple          → حتى 10 صور
Response: { url: "https://res.cloudinary.com/..." }
```

### Favorites
```
POST   /favorites       { entityType, entityId }   → إضافة
DELETE /favorites/:id                               → حذف
GET    /favorites                                   → قائمة مفضلاتي
```

### Payments (Thawani)
```
GET    /payments/plans            → خطط الاشتراك
POST   /payments/subscribe        → اشتراك { planId }
POST   /payments/feature-listing  → ترقية إعلان { listingId }
Response includes: { checkoutUrl }  → افتح في WebView
```

### Notifications
```
GET    /notifications             → قائمة الإشعارات
PUT    /notifications/read-all    → تحديد كلها مقروءة
```

---

## 10. Socket.IO — Chat

```typescript
// src/utils/socket.ts
import { io, Socket } from 'socket.io-client'
import * as SecureStore from 'expo-secure-store'

let socket: Socket | null = null

export const getSocket = async (): Promise<Socket> => {
  if (socket?.connected) return socket

  const token = await SecureStore.getItemAsync('accessToken')
  socket = io('YOUR_API_BASE_URL', {
    auth: { token },
    transports: ['websocket'],
  })
  return socket
}

export const disconnectSocket = () => {
  socket?.disconnect()
  socket = null
}

// Events to listen for:
// socket.on('message', (msg: ChatMessage) => ...)
// socket.on('typing', ({ userId, roomId }) => ...)
// socket.on('read', ({ roomId }) => ...)

// Events to emit:
// socket.emit('join', { roomId })
// socket.emit('message', { roomId, content })
// socket.emit('typing', { roomId })
```

---

## 11. Core UI Components Specs

### Button
```typescript
// src/components/ui/Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger'
  size: 'sm' | 'md' | 'lg'
  label: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  icon?: string           // Ionicons name
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

// Styles:
// primary:   bg=#1565C0  text=white
// secondary: bg=#EBF2FE  text=#1565C0
// accent:    bg=#FF6D00  text=white
// ghost:     bg=transparent  border=#C7C7CC
// danger:    bg=#FF3B30  text=white
// sizes: sm=36px, md=44px, lg=52px height
```

### ListingCard
```typescript
// src/components/cards/ListingCard.tsx
interface ListingCardProps {
  listing: Listing
  variant: 'grid' | 'horizontal' | 'featured'
  onPress: () => void
  onFavorite?: () => void
  isFavorite?: boolean
}

// grid:       2 per row, image top, info bottom
// horizontal: image left (120px), info right
// featured:   180px wide, horizontal scroll
```

### SearchBar
```typescript
interface SearchBarProps {
  value: string
  onChangeText: (text: string) => void
  onSubmit: () => void
  onFilterPress?: () => void
  placeholder?: string
  variant: 'home' | 'search'   // home=inside blue header, search=standalone
}
```

### Badge
```typescript
interface BadgeProps {
  label: string
  variant: 'premium' | 'new' | 'used' | 'success' | 'warning' | 'error' | 'info'
}
// premium: bg=#FFF0E0 text=#B84A00
// new:     bg=#EBF8F1 text=#1A6644
// used:    bg=#EBF2FE text=#0C447C
```

---

## 12. Screens Specifications

### Home Screen (app/(tabs)/index.tsx)

**Layout (top to bottom):**
1. Blue header با SouqOne logo + location + notification bell
2. Search bar (inside header)
3. Category grid (8 categories, 4 per row)
4. Section: "إعلانات مميزة" → FlatList horizontal → ListingCard (featured)
5. Section: "أحدث الإعلانات" → FlatList 2-column grid → ListingCard (grid)

**Data fetching:**
```typescript
const { data: featured } = useQuery({
  queryKey: ['listings', 'featured'],
  queryFn: () => apiClient.get('/listings?isPremium=true&limit=10')
})
const { data: recent } = useQuery({
  queryKey: ['listings', 'recent'],
  queryFn: () => apiClient.get('/listings?sortBy=createdAt:desc&limit=20')
})
```

### Search Screen (app/(tabs)/search.tsx)

**Layout:**
1. Header with back + active search input + filter icon
2. Category chips (horizontal scroll, filterable)
3. Filter chips (location, sort, condition)
4. Results count
5. FlatList 2-column → ListingCard (grid)

**Search logic:**
```typescript
const debouncedSearch = useDebounce(query, 400)
const { data } = useQuery({
  queryKey: ['search', debouncedSearch, filters],
  queryFn: () => apiClient.get('/search', { params: { q: debouncedSearch, ...filters } }),
  enabled: debouncedSearch.length > 1,
})
```

### Listing Detail (app/listings/[id].tsx)

**Layout:**
1. Image gallery (full width, swipeable, dot indicators)
2. Overlay: back + share + favorite buttons
3. Price (accent color, large)
4. Title + Premium badge
5. Info chips (location, year, mileage, condition)
6. Description (expandable)
7. Seller card (avatar + name + rating + date)
8. Sticky bottom bar: Call button + Chat button

**Auth gate on Chat/Call:**
```typescript
const handleChat = () => {
  if (!isLoggedIn) {
    router.push('/(auth)/login')
    return
  }
  // Create chat room then navigate
  createChatMutation.mutate({ entityType: 'listing', entityId: id })
}
```

### Post Flow (5 steps)

**Step 1 — Category** (`(modals)/post-category.tsx`):
List of 7 categories with icon + title + subtitle

**Step 2 — Form** (dynamic per category):
```typescript
// Different fields per category:
// listings: brand, model, year, mileage, condition, price, type
// jobs: title, salary, requirements, jobType
// services: serviceName, serviceType, pricePerHour
// parts: partName, brand, compatibility, condition, price
```

**Step 3 — Images** (expo-image-picker):
```typescript
const pickImages = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    quality: 0.8,
    selectionLimit: 10,
  })
  // Upload to /uploads/multiple
}
```

**Step 4 — Location**: Governorate + City picker

**Step 5 — Preview + Publish**:
Show preview → option to upgrade to premium (Thawani WebView)

---

## 13. Navigation Rules

### Protected Routes
```typescript
// Screens requiring login:
const PROTECTED = [
  '(tabs)/post',
  '(tabs)/chat',
  '(modals)/bid',
  'jobs/apply',
  'profile/settings',
  'profile/subscription',
  'profile/favorites',
  'profile/notifications',
  'chat/[roomId]',
]

// Guest can access:
// - Home, Search, all [id] detail screens, profile/[userId]
```

### Bottom Tab Config
```typescript
// app/(tabs)/_layout.tsx
const tabs = [
  { name: 'index',   title: 'الرئيسية', icon: 'home-outline'    },
  { name: 'search',  title: 'البحث',    icon: 'search-outline'   },
  { name: 'post',    title: 'أضف',      icon: 'add',  isFAB: true }, // Orange FAB
  { name: 'chat',    title: 'رسائل',    icon: 'chatbubble-outline' },
  { name: 'profile', title: 'حسابي',    icon: 'person-outline'   },
]
// Active color: #1565C0
// FAB: bg=#FF6D00, elevated, borderWidth=3, borderColor=background
```

---

## 14. RTL Configuration

```typescript
// app/_layout.tsx — add this
import { I18nManager } from 'react-native'
I18nManager.forceRTL(true)
I18nManager.allowRTL(true)

// In all StyleSheets — use start/end instead of left/right:
// paddingStart instead of paddingLeft
// paddingEnd instead of paddingRight
// textAlign: 'right' for Arabic text
// flexDirection: 'row' stays the same (RTL handles it)
```

---

## 15. Coding Conventions

```
- TypeScript strict mode — no 'any'
- Named exports for components (no default except screens)
- All screens: default export
- All API functions return typed responses
- React Query for all server state — no useState for API data
- Zustand only for: auth, filters, socket/chat state
- StyleSheet.create() for all styles — no inline styles except dynamic values
- All prices formatted: formatPrice(amount) → "45,000 ر.ع"
- All dates formatted: formatDate(iso) → "منذ 3 ساعات"
- Images always via expo-image (not RN Image)
- FlatList for any list > 5 items (never ScrollView + map)
- Always handle: loading state, error state, empty state
- Error boundaries on all screens
```

### Format Utilities
```typescript
// src/utils/format.ts
export const formatPrice = (amount: number, currency = 'OMR') =>
  `${amount.toLocaleString('ar-OM')} ر.ع`

export const formatDate = (iso: string) => {
  // Returns: منذ 3 ساعات / منذ يومين / 15 مايو
}

export const formatPhone = (phone: string) =>
  phone.startsWith('+968') ? phone : `+968${phone}`
```

---

## 16. Environment Variables

```bash
# .env
EXPO_PUBLIC_API_URL=https://your-api.com/api/v1
EXPO_PUBLIC_SOCKET_URL=https://your-api.com
EXPO_PUBLIC_CLOUDINARY_CLOUD=your_cloud_name
```

```typescript
// src/constants/config.ts
export const Config = {
  apiUrl:    process.env.EXPO_PUBLIC_API_URL!,
  socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL!,
  cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD!,
}
```

---

## 17. First Session Instructions for Cascade

أعطِ Cascade هذا الأمر في أول session:

```
اقرأ ملف SouqOne_Cascade_Master.md كاملاً.

ابدأ بترتيب هذا الترتيب بالضبط:

1. أنشئ المشروع بالـ tech stack المذكور
2. أنشئ folder structure كاملاً كما هو موضح
3. أنشئ constants/ (colors, spacing, typography, config)
4. أنشئ src/api/client.ts مع الـ interceptors
5. أنشئ src/store/authStore.ts
6. أنشئ app/_layout.tsx مع auth gate
7. أنشئ app/(auth)/ screens كاملة
8. أنشئ src/components/ui/ (Button, Input, Badge, Avatar, Chip)

لا تبدأ في الـ screens قبل أن تنتهي من الـ foundation.
اتبع التصميم بالألوان المحددة بالضبط:
- Primary: #1565C0
- Accent: #FF6D00
- Background: #F2F2F7
- Font: Cairo

التطبيق RTL بالكامل — Arabic.
```

---

## 18. Sprint Plan

| Sprint | المحتوى | الأولوية |
|--------|---------|---------|
| 1 | Setup + Constants + API Client + Auth Store | Critical |
| 2 | Auth Screens (Login, Register, Verify, Forgot) | Critical |
| 3 | UI Components Library (Button, Card, Input...) | Critical |
| 4 | Home Screen + Category Grid | High |
| 5 | Search Screen + Filters | High |
| 6 | Listing/Job/Service Detail Screens | High |
| 7 | Post Flow (5 steps + Image Upload) | High |
| 8 | Chat (Socket.IO + UI) | Medium |
| 9 | Profile + Settings + Favorites | Medium |
| 10 | Payments (Thawani WebView) + Notifications | Medium |
| 11 | Polish + RTL fixes + Performance | Low |
| 12 | Testing + App Store Submission | Low |

---

*آخر تحديث: SouqOne v1.0 — جميع القرارات المعمارية موثقة هنا*
