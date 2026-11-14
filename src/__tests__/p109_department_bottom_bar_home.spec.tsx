import { renderHook, act } from '@testing-library/react-native';
import {
  useDepartmentBottomBar,
  useCarsBottomBar,
  useBusesBottomBar,
  useEquipmentBottomBar,
  usePartsBottomBar,
  useServicesBottomBar,
} from '../hooks/useDepartmentBottomBar';
import { useAuthStore } from '../store/authStore';

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockPathname = '/cars';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => mockPathname,
  useFocusEffect: jest.fn(),
}));

jest.mock('../components/ui/DraftResumePrompt', () => ({
  navigateToCarForm: jest.fn(),
  navigateToBusForm: jest.fn(),
  navigateToPartForm: jest.fn(),
  navigateToServiceForm: jest.fn(),
  navigateToEquipmentForm: jest.fn(),
  showDraftResumePrompt: jest.fn(),
  hasMeaningfulPostData: jest.fn(),
}));

describe('useDepartmentBottomBar Home Tab Navigation (P1-09 / D-320)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/cars';
    useAuthStore.setState({ user: { id: 'test-user-1' } as never, isLoggedIn: true });
  });

  const departmentCases = [
    {
      name: 'useCarsBottomBar',
      hook: useCarsBottomBar,
      subRoute: '/cars/browse',
      subRouteWithQuery: '/cars/browse?sort=newest',
      homeRoute: '/cars',
    },
    {
      name: 'useBusesBottomBar',
      hook: useBusesBottomBar,
      subRoute: '/buses/browse',
      subRouteWithQuery: '/buses/browse?type=coaster',
      homeRoute: '/buses',
    },
    {
      name: 'useEquipmentBottomBar',
      hook: useEquipmentBottomBar,
      subRoute: '/equipment/browse',
      subRouteWithQuery: '/equipment/operators/browse?governorate=muscat',
      homeRoute: '/equipment',
    },
    {
      name: 'usePartsBottomBar',
      hook: usePartsBottomBar,
      subRoute: '/parts/browse',
      subRouteWithQuery: '/parts/browse?condition=new',
      homeRoute: '/parts',
    },
    {
      name: 'useServicesBottomBar',
      hook: useServicesBottomBar,
      subRoute: '/services/browse',
      subRouteWithQuery: '/services/browse?category=maintenance',
      homeRoute: '/services',
    },
  ];

  describe.each(departmentCases)('$name', ({ hook, subRoute, subRouteWithQuery, homeRoute }) => {
    it('navigates from sub-route to department home via router.replace without calling router.push', async () => {
      mockPathname = subRoute;
      const { result } = await renderHook(() => hook());
      const homeTab = result.current.tabs.find((t) => t.id === 'home');
      expect(homeTab).toBeDefined();

      await act(async () => {
        result.current.handleTabPress(homeTab!);
      });

      expect(result.current.activeTab).toBe('home');
      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith(homeRoute);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('normalizes query strings when navigating from sub-route back to home', async () => {
      mockPathname = subRouteWithQuery;
      const { result } = await renderHook(() => hook());
      const homeTab = result.current.tabs.find((t) => t.id === 'home')!;

      await act(async () => {
        result.current.handleTabPress(homeTab);
      });

      expect(result.current.activeTab).toBe('home');
      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith(homeRoute);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('activates home tab without redundant replace/push when already on home route (including trailing slash / query)', async () => {
      for (const alreadyHomePath of [homeRoute, `${homeRoute}/`, `${homeRoute}?tab=featured`]) {
        jest.clearAllMocks();
        mockPathname = alreadyHomePath;
        const { result } = await renderHook(() => hook());
        const homeTab = result.current.tabs.find((t) => t.id === 'home')!;

        await act(async () => {
          result.current.handleTabPress(homeTab);
        });

        expect(result.current.activeTab).toBe('home');
        expect(mockReplace).not.toHaveBeenCalled();
        expect(mockPush).not.toHaveBeenCalled();
      }
    });
  });

  it('uses category fallback route on default home tab when customTabs is omitted', async () => {
    mockPathname = '/cars/browse';
    const { result } = await renderHook(() => useDepartmentBottomBar({ category: 'cars' }));
    const homeTab = result.current.tabs.find((t) => t.id === 'home')!;

    await act(async () => {
      result.current.handleTabPress(homeTab);
    });

    expect(result.current.activeTab).toBe('home');
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/cars');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not navigate via router.replace when onHomePress override is provided', async () => {
    const onHomePress = jest.fn();
    mockPathname = '/cars/browse';
    const { result } = await renderHook(() =>
      useDepartmentBottomBar({
        category: 'cars',
        customTabs: [{ id: 'home', label: 'الرئيسية', route: '/cars' }],
        onHomePress,
      })
    );
    const homeTab = result.current.tabs.find((t) => t.id === 'home')!;

    await act(async () => {
      result.current.handleTabPress(homeTab);
    });

    expect(result.current.activeTab).toBe('home');
    expect(onHomePress).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
