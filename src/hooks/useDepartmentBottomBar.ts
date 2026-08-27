import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, usePathname, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { usePostStore } from '../store/postStore';
import { Colors } from '../constants/colors';
import { BottomBarTabItem, IconFamily } from '../components/navigation/UnifiedBottomBar';
import { showDraftResumePrompt, hasMeaningfulPostData, navigateToCarForm } from '../components/ui/DraftResumePrompt';

export interface DepartmentTabConfig {
  id: string;
  label?: string;
  icon?: string;
  iconOutline?: string;
  family?: IconFamily;
  route?: string;
  isPost?: boolean;
  requireAuth?: boolean;
  badgeCount?: number;
  onPress?: () => void;
}

export interface DepartmentBottomBarConfig {
  category: string;
  customTabs?: DepartmentTabConfig[];
  homeIcon?: string;
  homeIconOutline?: string;
  homeFamily?: IconFamily;
  favoritesTab?: string;
  postRoute?: string;
  activeColor?: string;
  activeBgColor?: string;
  onPost?: () => void;
  onHomePress?: () => void;
  scrollAware?: boolean;
}

export function useDepartmentBottomBar({
  category,
  customTabs,
  homeIcon = 'home',
  homeIconOutline = 'home-outline',
  homeFamily = 'Ionicons',
  favoritesTab,
  postRoute,
  activeColor = Colors.primary,
  activeBgColor = '#EFF6FF',
  onPost,
  onHomePress,
  scrollAware = true,
}: DepartmentBottomBarConfig) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn } = useAuthStore();
  const { set } = usePostStore();

  const [activeTab, setActiveTab] = useState('home');

  // Always reset activeTab to 'home' whenever the department screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setActiveTab('home');
    }, [])
  );

  const tabs: BottomBarTabItem[] = useMemo(() => {
    if (customTabs && customTabs.length > 0) {
      return customTabs.map((t) => ({
        id: t.id,
        label: t.label,
        icon: t.icon,
        iconOutline: t.iconOutline,
        family: t.family,
        isPost: t.isPost,
        badgeCount: t.badgeCount,
      }));
    }

    return [
      { id: 'home', label: 'الرئيسية', icon: homeIcon, iconOutline: homeIconOutline, family: homeFamily },
      { id: 'favorites', label: 'مفضلتي', icon: 'heart', iconOutline: 'heart-outline', family: 'Ionicons' },
      { id: 'post', isPost: true },
      { id: 'listings', label: 'إعلاناتي', icon: 'albums', iconOutline: 'albums-outline', family: 'Ionicons' },
      { id: 'profile', label: 'حسابي', icon: 'person', iconOutline: 'person-outline', family: 'Ionicons' },
    ];
  }, [customTabs, homeIcon, homeIconOutline, homeFamily]);

  const handlePostPress = useCallback(() => {
    if (!isLoggedIn) {
      router.push('/(auth)/login' as any);
      return;
    }

    if (onPost) {
      onPost();
      return;
    }

    if (postRoute) {
      router.push(postRoute as any);
      return;
    }

    // Default post flow: check draft or start fresh
    const state = usePostStore.getState();
    const navigateToForm = () => router.push('/post/step2' as any);

    if (state.category === category && hasMeaningfulPostData(state)) {
      showDraftResumePrompt({
        onResume: navigateToForm,
        onDiscard: () => {
          usePostStore.getState().reset('draft');
          set({ category });
          navigateToForm();
        }
      });
    } else {
      usePostStore.getState().reset('draft');
      set({ category });
      navigateToForm();
    }
  }, [isLoggedIn, onPost, postRoute, set, category, router]);

  const handleTabPress = useCallback(
    (tab: BottomBarTabItem) => {
      // Check if this tab is configured with custom routing in customTabs
      if (customTabs) {
        const customDef = customTabs.find((t) => t.id === tab.id);
        if (customDef) {
          if (customDef.onPress) {
            customDef.onPress();
            return;
          }
          if (customDef.requireAuth && !isLoggedIn) {
            router.push('/(auth)/login' as any);
            return;
          }
          if (customDef.route) {
            if (customDef.id === 'home') {
              setActiveTab('home');
              if (onHomePress) onHomePress();
            } else {
              router.push(customDef.route as any);
            }
            return;
          }
        }
      }

      // Default routing behaviors
      if (tab.id === 'home') {
        setActiveTab('home');
        if (onHomePress) onHomePress();
      } else if (tab.id === 'favorites') {
        if (!isLoggedIn) {
          router.push('/(auth)/login' as any);
          return;
        }
        const tabQuery = favoritesTab ? `?tab=${encodeURIComponent(favoritesTab)}` : '';
        router.push(`/profile/favorites${tabQuery}` as any);
      } else if (tab.id === 'listings') {
        if (!isLoggedIn) {
          router.push('/(auth)/login' as any);
          return;
        }
        router.push('/profile/my-listings' as any);
      } else if (tab.id === 'profile') {
        if (!isLoggedIn) {
          router.push('/(auth)/login' as any);
          return;
        }
        router.push('/(tabs)/profile' as any);
      }
    },
    [customTabs, favoritesTab, isLoggedIn, onHomePress, router]
  );

  return {
    tabs,
    activeTab,
    setActiveTab,
    handleTabPress,
    handlePostPress,
    activeColor,
    activeBgColor,
    scrollAware,
  };
}

// ─── Specialized Department Hooks ─────────────────────────────────────────────

export function useCarsBottomBar() {
  return useDepartmentBottomBar({
    category: 'cars',
    activeColor: Colors.primary,
    activeBgColor: '#EFF6FF',
    onPost: navigateToCarForm,
    customTabs: [
      { id: 'home', label: 'الرئيسية', icon: 'home', iconOutline: 'home-outline', family: 'Ionicons', route: '/cars' },
      { id: 'browse', label: 'تصفح', icon: 'car-multiple', iconOutline: 'car-multiple', family: 'MaterialCommunityIcons', route: '/cars/browse' },
      { id: 'post', isPost: true },
      { id: 'favorites', label: 'مفضلتي', icon: 'heart', iconOutline: 'heart-outline', family: 'Ionicons', route: '/profile/favorites?tab=سيارات', requireAuth: true },
      { id: 'profile', label: 'حسابي', icon: 'person', iconOutline: 'person-outline', family: 'Ionicons', route: '/(tabs)/profile', requireAuth: true },
    ],
  });
}

export function useTransportBottomBar() {
  return useDepartmentBottomBar({
    category: 'transport',
    postRoute: '/transport/new',
    activeColor: Colors.primary,
    activeBgColor: '#EFF6FF',
    customTabs: [
      { id: 'home', label: 'الرئيسية', icon: 'home', iconOutline: 'home-outline', family: 'Ionicons', route: '/transport' },
      { id: 'browse', label: 'الطلبات', icon: 'package-variant', iconOutline: 'package-variant-closed', family: 'MaterialCommunityIcons', route: '/transport/browse' },
      { id: 'post', isPost: true },
      { id: 'carriers', label: 'الناقلين', icon: 'truck-fast', iconOutline: 'truck-fast-outline', family: 'MaterialCommunityIcons', route: '/transport/carriers' },
      { id: 'dashboard', label: 'لوحتي', icon: 'view-dashboard', iconOutline: 'view-dashboard-outline', family: 'MaterialCommunityIcons', route: '/transport/carrier-dashboard', requireAuth: true },
    ],
  });
}

export function useServicesBottomBar() {
  return useDepartmentBottomBar({
    category: 'services',
    activeColor: Colors.primary,
    activeBgColor: '#EFF6FF',
    customTabs: [
      { id: 'home', label: 'الرئيسية', icon: 'home', iconOutline: 'home-outline', family: 'Ionicons', route: '/services' },
      { id: 'browse', label: 'الخدمات', icon: 'toolbox', iconOutline: 'toolbox-outline', family: 'MaterialCommunityIcons', route: '/services/browse' },
      { id: 'post', isPost: true },
      { id: 'favorites', label: 'مفضلتي', icon: 'heart', iconOutline: 'heart-outline', family: 'Ionicons', route: '/profile/favorites?tab=خدمات', requireAuth: true },
      { id: 'profile', label: 'حسابي', icon: 'person', iconOutline: 'person-outline', family: 'Ionicons', route: '/(tabs)/profile', requireAuth: true },
    ],
  });
}

export function usePartsBottomBar() {
  return useDepartmentBottomBar({
    category: 'parts',
    activeColor: Colors.primary,
    activeBgColor: '#EFF6FF',
    customTabs: [
      { id: 'home', label: 'الرئيسية', icon: 'home', iconOutline: 'home-outline', family: 'Ionicons', route: '/parts' },
      { id: 'browse', label: 'قطع الغيار', icon: 'car-wrench', iconOutline: 'car-wrench', family: 'MaterialCommunityIcons', route: '/parts/browse' },
      { id: 'post', isPost: true },
      { id: 'favorites', label: 'مفضلتي', icon: 'heart', iconOutline: 'heart-outline', family: 'Ionicons', route: '/profile/favorites?tab=قطع غيار', requireAuth: true },
      { id: 'profile', label: 'حسابي', icon: 'person', iconOutline: 'person-outline', family: 'Ionicons', route: '/(tabs)/profile', requireAuth: true },
    ],
  });
}

export function useEquipmentBottomBar() {
  return useDepartmentBottomBar({
    category: 'equipment',
    postRoute: '/equipment/new',
    activeColor: '#d97706',
    activeBgColor: '#FEF3C7',
    customTabs: [
      { id: 'home', label: 'الرئيسية', icon: 'hammer-wrench', iconOutline: 'hammer-wrench', family: 'MaterialCommunityIcons', route: '/equipment' },
      { id: 'browse', label: 'المعدات', icon: 'excavator', iconOutline: 'excavator', family: 'MaterialCommunityIcons', route: '/equipment/browse' },
      { id: 'post', isPost: true },
      { id: 'operators', label: 'المشغلين', icon: 'account-hard-hat', iconOutline: 'account-hard-hat-outline', family: 'MaterialCommunityIcons', route: '/equipment/operators/browse' },
      { id: 'favorites', label: 'مفضلتي', icon: 'heart', iconOutline: 'heart-outline', family: 'Ionicons', route: '/profile/favorites?tab=معدات', requireAuth: true },
    ],
  });
}

export function useBusesBottomBar() {
  return useDepartmentBottomBar({
    category: 'buses',
    postRoute: '/buses/new',
    activeColor: Colors.primary,
    activeBgColor: '#EFF6FF',
    customTabs: [
      { id: 'home', label: 'الرئيسية', icon: 'home', iconOutline: 'home-outline', family: 'Ionicons', route: '/buses' },
      { id: 'browse', label: 'الحافلات', icon: 'bus-side', iconOutline: 'bus-side', family: 'MaterialCommunityIcons', route: '/buses/browse' },
      { id: 'post', isPost: true },
      { id: 'favorites', label: 'مفضلتي', icon: 'heart', iconOutline: 'heart-outline', family: 'Ionicons', route: '/profile/favorites?tab=حافلات', requireAuth: true },
      { id: 'profile', label: 'حسابي', icon: 'person', iconOutline: 'person-outline', family: 'Ionicons', route: '/(tabs)/profile', requireAuth: true },
    ],
  });
}

export function useJobsBottomBar() {
  return useDepartmentBottomBar({
    category: 'jobs',
    postRoute: '/jobs/create',
    activeColor: Colors.primary,
    activeBgColor: '#EFF6FF',
    customTabs: [
      { id: 'home', label: 'الرئيسية', icon: 'briefcase', iconOutline: 'briefcase-outline', family: 'MaterialCommunityIcons', route: '/jobs' },
      { id: 'browse', label: 'الوظائف', icon: 'briefcase-search', iconOutline: 'briefcase-search-outline', family: 'MaterialCommunityIcons', route: '/jobs/browse' },
      { id: 'post', isPost: true },
      { id: 'drivers', label: 'السائقين', icon: 'card-account-details', iconOutline: 'card-account-details-outline', family: 'MaterialCommunityIcons', route: '/jobs/drivers' },
      { id: 'dashboard', label: 'لوحتي', icon: 'view-dashboard', iconOutline: 'view-dashboard-outline', family: 'MaterialCommunityIcons', route: '/jobs/dashboard', requireAuth: true },
    ],
  });
}




