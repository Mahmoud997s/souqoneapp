import React from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { render, fireEvent, cleanup, within, act } from '@testing-library/react-native'
import {
  UnifiedBottomBar,
  UNIFIED_BOTTOM_BAR_HEIGHT,
  type BottomBarTabItem,
} from '../../components/navigation/UnifiedBottomBar'
import { BottomBarTokens } from '../../constants/bottomBarTokens'
import { ADD_BUTTON_ASSET } from '../../components/navigation/AddListingButton'
import { CarsBottomBar } from '../../components/cars/CarsBottomBar'
import { BusesBottomBar } from '../../components/buses/BusesBottomBar'
import { EquipmentBottomBar } from '../../components/equipment/EquipmentBottomBar'
import { PartsBottomBar } from '../../components/parts/PartsBottomBar'
import { ServicesBottomBar } from '../../components/services/ServicesBottomBar'

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: (props: any) => {
    const React = require('react')
    const { View } = require('react-native')
    return React.createElement(View, props)
  },
}))

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}))

// Mock expo-blur
jest.mock('expo-blur', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    BlurView: (props: any) => React.createElement(View, props),
  }
})

// Mock expo-image
jest.mock('expo-image', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Image: (props: any) => React.createElement(View, { testID: 'mock-expo-image', ...props }),
  }
})

// Mock vector icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Ionicons: (props: any) =>
      React.createElement(View, { testID: `icon-Ionicons-${props.name}`, ...props }),
    MaterialCommunityIcons: (props: any) =>
      React.createElement(View, { testID: `icon-MaterialCommunityIcons-${props.name}`, ...props }),
  }
})

// Mock NavVisibilityContext with mutable shared value
const mockNavHidden = { value: 0 }
jest.mock('../../context/NavVisibilityContext', () => ({
  useNavVisibility: () => ({
    navHidden: mockNavHidden,
  }),
}))

// Mock useAppReducedMotion
jest.mock('../../utils/listing-detail/useAppReducedMotion', () => ({
  useAppReducedMotion: jest.fn(() => false),
}))

// Mock safe area insets
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }),
}))

// Mock useDepartmentBottomBar for the five section wrappers
jest.mock('../../hooks/useDepartmentBottomBar', () => ({
  useCarsBottomBar: () => ({
    tabs: [
      { id: 'home', label: 'الرئيسية', icon: 'car-sport', iconOutline: 'car-sport-outline', family: 'Ionicons' },
      { id: 'post', isPost: true },
      { id: 'profile', label: 'حسابي', icon: 'person', iconOutline: 'person-outline', family: 'Ionicons' },
    ],
    activeTab: 'home',
    handleTabPress: jest.fn(),
    handlePostPress: jest.fn(),
    activeColor: '#009CB5',
    activeBgColor: '#ECF8FA',
    scrollAware: true,
  }),
  useBusesBottomBar: () => ({
    tabs: [
      { id: 'home', label: 'الرئيسية', icon: 'bus', iconOutline: 'bus-outline', family: 'Ionicons' },
      { id: 'post', isPost: true },
      { id: 'profile', label: 'حسابي', icon: 'person', iconOutline: 'person-outline', family: 'Ionicons' },
    ],
    activeTab: 'home',
    handleTabPress: jest.fn(),
    handlePostPress: jest.fn(),
    activeColor: '#009CB5',
    activeBgColor: '#ECF8FA',
    scrollAware: true,
  }),
  useEquipmentBottomBar: () => ({
    tabs: [
      { id: 'home', label: 'الرئيسية', icon: 'construct', iconOutline: 'construct-outline', family: 'Ionicons' },
      { id: 'post', isPost: true },
      { id: 'profile', label: 'حسابI', icon: 'person', iconOutline: 'person-outline', family: 'Ionicons' },
    ],
    activeTab: 'home',
    handleTabPress: jest.fn(),
    handlePostPress: jest.fn(),
    activeColor: '#009CB5',
    activeBgColor: '#ECF8FA',
    scrollAware: true,
  }),
  usePartsBottomBar: () => ({
    tabs: [
      { id: 'home', label: 'الرئيسية', icon: 'car-wrench', iconOutline: 'car-wrench', family: 'MaterialCommunityIcons' },
      { id: 'post', isPost: true },
      { id: 'profile', label: 'حسابي', icon: 'person', iconOutline: 'person-outline', family: 'Ionicons' },
    ],
    activeTab: 'home',
    handleTabPress: jest.fn(),
    handlePostPress: jest.fn(),
    activeColor: '#009CB5',
    activeBgColor: '#ECF8FA',
    scrollAware: true,
  }),
  useServicesBottomBar: () => ({
    tabs: [
      { id: 'home', label: 'الرئيسية', icon: 'hammer-wrench', iconOutline: 'hammer-wrench', family: 'MaterialCommunityIcons' },
      { id: 'post', isPost: true },
      { id: 'profile', label: 'حسابي', icon: 'person', iconOutline: 'person-outline', family: 'Ionicons' },
    ],
    activeTab: 'home',
    handleTabPress: jest.fn(),
    handlePostPress: jest.fn(),
    activeColor: '#009CB5',
    activeBgColor: '#ECF8FA',
    scrollAware: true,
  }),
}))

const sampleTabs: BottomBarTabItem[] = [
  { id: 'home', label: 'الرئيسية', icon: 'home', iconOutline: 'home-outline', family: 'Ionicons' },
  { id: 'favorites', label: 'مفضلتي', icon: 'heart', iconOutline: 'heart-outline', family: 'Ionicons', badgeCount: 3 },
  { id: 'post', isPost: true },
  { id: 'listings', label: 'إعلاناتي', icon: 'albums', iconOutline: 'albums-outline', family: 'Ionicons' },
  { id: 'profile', label: 'حسابي', icon: 'person', iconOutline: 'person-outline', family: 'Ionicons' },
]

describe('UnifiedBottomBar (Task D-167 Stage 2 Adoption)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockNavHidden.value = 0
  })

  afterEach(() => {
    cleanup()
  })

  it('(d) UNIFIED_BOTTOM_BAR_HEIGHT value is exactly 52 (preserving existing layout footprint)', () => {
    expect(UNIFIED_BOTTOM_BAR_HEIGHT).toBe(52)
    expect(UNIFIED_BOTTOM_BAR_HEIGHT).toBe(BottomBarTokens.expandedHeight)
  })

  it('(a) renders all tabs and calls onTabPress for a normal press in expanded state', async () => {
    const onTabPressMock = jest.fn()
    const onPostPressMock = jest.fn()

    const { getByText, getByRole } = await render(
      <UnifiedBottomBar
        tabs={sampleTabs}
        activeTab="home"
        onTabPress={onTabPressMock}
        onPostPress={onPostPressMock}
      />
    )

    // Expanded state renders all tab labels
    expect(getByText('الرئيسية')).toBeTruthy()
    expect(getByText('مفضلتي')).toBeTruthy()
    expect(getByText('إعلاناتي')).toBeTruthy()
    expect(getByText('حسابي')).toBeTruthy()

    // Pressing a tab triggers onTabPress
    const favTab = getByText('مفضلتي')
    fireEvent.press(favTab)
    expect(onTabPressMock).toHaveBeenCalledTimes(1)
    expect(onTabPressMock).toHaveBeenCalledWith(sampleTabs[1])
  })

  it('(b) collapsed state (navHidden=1) renders active tab icon and press expands without calling tab/post callbacks', async () => {
    mockNavHidden.value = 1
    const onTabPressMock = jest.fn()
    const onPostPressMock = jest.fn()

    const { getByTestId } = await render(
      <UnifiedBottomBar
        tabs={sampleTabs}
        activeTab="home"
        onTabPress={onTabPressMock}
        onPostPress={onPostPressMock}
      />
    )

    // Collapsed circle button is rendered
    const collapsedBtn = getByTestId('bottom-bar-collapsed-button')
    expect(collapsedBtn).toBeTruthy()

    // The collapsed circle contains the active tab icon (home)
    const collapsedScope = within(collapsedBtn)
    expect(collapsedScope.getByTestId('icon-Ionicons-home')).toBeTruthy()

    // Other non-active tab icons are NOT in the collapsed button
    expect(collapsedScope.queryByTestId('icon-Ionicons-albums')).toBeNull()

    // Tapping the collapsed circle expands the bar (resets navHidden to 0) and NEVER calls onTabPress or onPostPress
    fireEvent.press(collapsedBtn)
    expect(mockNavHidden.value).toBe(0)
    expect(onTabPressMock).not.toHaveBeenCalled()
    expect(onPostPressMock).not.toHaveBeenCalled()
  })

  it('(c) scrollAware={false} never collapses (ignores navHidden and stays expanded)', async () => {
    mockNavHidden.value = 1

    const { getByTestId } = await render(
      <UnifiedBottomBar
        tabs={sampleTabs}
        activeTab="home"
        onTabPress={jest.fn()}
        onPostPress={jest.fn()}
        scrollAware={false}
      />
    )

    // With scrollAware false, shell ignores navHidden: width stays at expanded width
    const shell = getByTestId('unified-bottom-bar')
    const flatStyle = StyleSheet.flatten(shell.props.style)
    expect(flatStyle.width).toBe(BottomBarTokens.maxWidth)
    expect(flatStyle.height).toBe(BottomBarTokens.expandedHeight)
    expect(flatStyle.borderRadius).toBe(BottomBarTokens.expandedRadius)
  })

  it('(e) the five section wrappers render with their tabs (Cars, Buses, Equipment, Parts, Services)', async () => {
    const cars = await render(<CarsBottomBar />)
    expect(cars.getByText('الرئيسية')).toBeTruthy()

    const buses = await render(<BusesBottomBar />)
    expect(buses.getByText('الرئيسية')).toBeTruthy()

    const equip = await render(<EquipmentBottomBar />)
    expect(equip.getByText('الرئيسية')).toBeTruthy()

    const parts = await render(<PartsBottomBar />)
    expect(parts.getByText('الرئيسية')).toBeTruthy()

    const services = await render(<ServicesBottomBar />)
    expect(services.getByText('الرئيسية')).toBeTruthy()
  })

  it('(f) badge count is shown on the collapsed circle when the active tab has an unread count', async () => {
    mockNavHidden.value = 1

    const { getByTestId } = await render(
      <UnifiedBottomBar
        tabs={sampleTabs}
        activeTab="favorites" // favorites has badgeCount: 3
        onTabPress={jest.fn()}
        onPostPress={jest.fn()}
      />
    )

    const collapsedBtn = getByTestId('bottom-bar-collapsed-button')
    expect(collapsedBtn).toBeTruthy()
    const collapsedScope = within(collapsedBtn)
    expect(collapsedScope.getByText('3')).toBeTruthy()
    expect(collapsedScope.getByTestId('icon-Ionicons-heart')).toBeTruthy()
  })

  it('Tooth a & d (D-173): section bar renders glossy add button image, pressing it calls onPostPress and never onTabPress, no gradient or old icon', async () => {
    const onTabPressMock = jest.fn()
    const onPostPressMock = jest.fn()

    const { getByTestId, queryByTestId } = await render(
      <UnifiedBottomBar
        tabs={sampleTabs}
        activeTab="home"
        onTabPress={onTabPressMock}
        onPostPress={onPostPressMock}
      />
    )

    // Add button rendered
    const addBtn = getByTestId('section-bottom-bar-add-button')
    expect(addBtn).toBeTruthy()
    expect(addBtn.props.accessibilityLabel).toBe('إضافة إعلان جديد')

    // Image rendered with exact asset module
    const img = getByTestId('section-bottom-bar-add-button-image')
    expect(img).toBeTruthy()
    expect(img.props.source).toBe(ADD_BUTTON_ASSET)

    // Press calls onPostPress once and never onTabPress
    await act(async () => {
      fireEvent.press(addBtn)
    })
    expect(onPostPressMock).toHaveBeenCalledTimes(1)
    expect(onTabPressMock).not.toHaveBeenCalled()

    // No old gradient squircle or Ionicons add
    expect(queryByTestId('icon-Ionicons-add')).toBeNull()
  })
})
