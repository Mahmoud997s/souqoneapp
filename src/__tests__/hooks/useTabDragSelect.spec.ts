import { renderHook, act } from '@testing-library/react-native'
import * as Haptics from 'expo-haptics'
import { useTabDragSelect, TabDragSelectTabItem } from '../../hooks/useTabDragSelect'

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}))

let mockTime = 100
function createPanEvent(locationX: number) {
  mockTime += 10
  return {
    nativeEvent: { locationX },
    touchHistory: {
      touchBank: [
        {
          touchActive: true,
          currentTimeStamp: mockTime,
          previousTimeStamp: mockTime - 10,
          currentPageX: locationX,
          currentPageY: 0,
          previousPageX: locationX,
          previousPageY: 0,
          startPageX: locationX,
          startPageY: 0,
          startTimeStamp: 100,
        },
      ],
      numberActiveTouches: 1,
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: mockTime,
    },
  } as any
}

describe('useTabDragSelect Hook', () => {
  const mockTabs: TabDragSelectTabItem[] = [
    { id: 'tab-1' },
    { id: 'tab-2' },
    { id: 'tab-post', isPost: true },
    { id: 'tab-4' },
  ]

  let mockOnTabPress: jest.Mock
  let mockOnPostPress: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnTabPress = jest.fn()
    mockOnPostPress = jest.fn()
  })

  it('initializes with null draggingTabId', async () => {
    const { result } = await renderHook(() =>
      useTabDragSelect({
        tabs: mockTabs,
        onTabPress: mockOnTabPress,
        onPostPress: mockOnPostPress,
      })
    )

    expect(result.current.draggingTabId).toBeNull()
    expect(result.current.panHandlers).toBeDefined()
    expect(result.current.onBarLayout).toBeDefined()
  })

  it('grant selects the tab under x and fires selection haptic', async () => {
    const { result } = await renderHook(() =>
      useTabDragSelect({
        tabs: mockTabs,
        onTabPress: mockOnTabPress,
        onPostPress: mockOnPostPress,
      })
    )

    // Simulate bar layout width = 400px (100px per tab for 4 tabs)
    await act(async () => {
      result.current.onBarLayout({
        nativeEvent: { layout: { width: 400, height: 60, x: 0, y: 0 } },
      } as any)
    })

    // Grant at x = 150 (tab index 1 -> 'tab-2')
    await act(async () => {
      result.current.panHandlers.onResponderGrant?.(createPanEvent(150))
    })

    expect(result.current.draggingTabId).toBe('tab-2')
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1)
  })

  it('move changes hover and calls selection haptic only when tab changes', async () => {
    const { result } = await renderHook(() =>
      useTabDragSelect({
        tabs: mockTabs,
        onTabPress: mockOnTabPress,
        onPostPress: mockOnPostPress,
      })
    )

    await act(async () => {
      result.current.onBarLayout({
        nativeEvent: { layout: { width: 400, height: 60, x: 0, y: 0 } },
      } as any)
    })

    // Grant at x = 50 (index 0 -> 'tab-1')
    await act(async () => {
      result.current.panHandlers.onResponderGrant?.(createPanEvent(50))
    })
    expect(result.current.draggingTabId).toBe('tab-1')
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1)

    // Move to x = 80 (still index 0 -> 'tab-1')
    await act(async () => {
      result.current.panHandlers.onResponderMove?.(createPanEvent(80))
    })
    expect(result.current.draggingTabId).toBe('tab-1')
    // Should NOT have fired again
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1)

    // Move to x = 120 (index 1 -> 'tab-2')
    await act(async () => {
      result.current.panHandlers.onResponderMove?.(createPanEvent(120))
    })
    expect(result.current.draggingTabId).toBe('tab-2')
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(2)
  })

  it('release calls tab handler once and clears dragging state', async () => {
    const { result } = await renderHook(() =>
      useTabDragSelect({
        tabs: mockTabs,
        onTabPress: mockOnTabPress,
        onPostPress: mockOnPostPress,
      })
    )

    await act(async () => {
      result.current.onBarLayout({
        nativeEvent: { layout: { width: 400, height: 60, x: 0, y: 0 } },
      } as any)
    })

    await act(async () => {
      result.current.panHandlers.onResponderGrant?.(createPanEvent(50))
    })

    // Release at x = 350 (index 3 -> 'tab-4')
    await act(async () => {
      result.current.panHandlers.onResponderRelease?.(createPanEvent(350))
    })

    expect(result.current.draggingTabId).toBeNull()
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light)
    expect(mockOnTabPress).toHaveBeenCalledTimes(1)
    expect(mockOnTabPress).toHaveBeenCalledWith(mockTabs[3])
    expect(mockOnPostPress).not.toHaveBeenCalled()
  })

  it('release calls post handler once if target tab is isPost', async () => {
    const { result } = await renderHook(() =>
      useTabDragSelect({
        tabs: mockTabs,
        onTabPress: mockOnTabPress,
        onPostPress: mockOnPostPress,
      })
    )

    await act(async () => {
      result.current.onBarLayout({
        nativeEvent: { layout: { width: 400, height: 60, x: 0, y: 0 } },
      } as any)
    })

    // Release at x = 250 (index 2 -> 'tab-post')
    await act(async () => {
      result.current.panHandlers.onResponderRelease?.(createPanEvent(250))
    })

    expect(result.current.draggingTabId).toBeNull()
    expect(mockOnPostPress).toHaveBeenCalledTimes(1)
    expect(mockOnTabPress).not.toHaveBeenCalled()
  })

  it('terminate clears dragging state without firing press callbacks', async () => {
    const { result } = await renderHook(() =>
      useTabDragSelect({
        tabs: mockTabs,
        onTabPress: mockOnTabPress,
        onPostPress: mockOnPostPress,
      })
    )

    await act(async () => {
      result.current.onBarLayout({
        nativeEvent: { layout: { width: 400, height: 60, x: 0, y: 0 } },
      } as any)
    })

    await act(async () => {
      result.current.panHandlers.onResponderGrant?.(createPanEvent(50))
    })
    expect(result.current.draggingTabId).toBe('tab-1')

    await act(async () => {
      result.current.panHandlers.onResponderTerminate?.(createPanEvent(50))
    })

    expect(result.current.draggingTabId).toBeNull()
    expect(mockOnTabPress).not.toHaveBeenCalled()
    expect(mockOnPostPress).not.toHaveBeenCalled()
  })
})
