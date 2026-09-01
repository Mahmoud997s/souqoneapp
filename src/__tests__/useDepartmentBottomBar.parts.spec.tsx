import React from 'react'
import { View, TouchableOpacity, Text } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import {
  usePartsBottomBar,
  useCarsBottomBar,
  useServicesBottomBar,
  useTransportBottomBar,
  useEquipmentBottomBar,
  useBusesBottomBar,
  useJobsBottomBar,
} from '../hooks/useDepartmentBottomBar'
import { navigateToPartForm, navigateToCarForm } from '../components/ui/DraftResumePrompt'
import { useAuthStore } from '../store/authStore'

jest.mock('../components/ui/DraftResumePrompt', () => ({
  navigateToPartForm: jest.fn(),
  navigateToCarForm: jest.fn(),
  showDraftResumePrompt: jest.fn(),
  hasMeaningfulPostData: jest.fn(),
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => '/parts',
  useFocusEffect: jest.fn(),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
}))

function TestBottomBarHarness({ hookType }: { hookType: string }) {
  let bar: any
  if (hookType === 'parts') bar = usePartsBottomBar()
  else if (hookType === 'cars') bar = useCarsBottomBar()
  else if (hookType === 'services') bar = useServicesBottomBar()
  else if (hookType === 'transport') bar = useTransportBottomBar()
  else if (hookType === 'equipment') bar = useEquipmentBottomBar()
  else if (hookType === 'buses') bar = useBusesBottomBar()
  else bar = useJobsBottomBar()

  return (
    <View>
      <TouchableOpacity testID="btn-post" onPress={bar.handlePostPress}>
        <Text>Post</Text>
      </TouchableOpacity>
      <Text testID="tab-count">{String(bar.tabs.length)}</Text>
    </View>
  )
}

describe('useDepartmentBottomBar Specialized Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useAuthStore.setState({ user: { id: 'test-user-1' } as any, isLoggedIn: true })
  })

  it('usePartsBottomBar delegates handlePostPress to navigateToPartForm', async () => {
    await render(<TestBottomBarHarness hookType="parts" />)

    fireEvent.press(screen.getByTestId('btn-post'))

    expect(navigateToPartForm).toHaveBeenCalledTimes(1)
  })

  it('useCarsBottomBar delegates handlePostPress to navigateToCarForm', async () => {
    await render(<TestBottomBarHarness hookType="cars" />)

    fireEvent.press(screen.getByTestId('btn-post'))

    expect(navigateToCarForm).toHaveBeenCalledTimes(1)
  })

  it('useServicesBottomBar falls through to generic post flow without onPost callback', async () => {
    await render(<TestBottomBarHarness hookType="services" />)

    fireEvent.press(screen.getByTestId('btn-post'))

    expect(navigateToPartForm).not.toHaveBeenCalled()
    expect(navigateToCarForm).not.toHaveBeenCalled()
  })

  it('useTransportBottomBar configures 5 tabs', async () => {
    await render(<TestBottomBarHarness hookType="transport" />)
    expect(screen.getByTestId('tab-count').props.children).toBe('5')
  })

  it('useEquipmentBottomBar configures 5 tabs', async () => {
    await render(<TestBottomBarHarness hookType="equipment" />)
    expect(screen.getByTestId('tab-count').props.children).toBe('5')
  })

  it('useBusesBottomBar configures 5 tabs', async () => {
    await render(<TestBottomBarHarness hookType="buses" />)
    expect(screen.getByTestId('tab-count').props.children).toBe('5')
  })

  it('useJobsBottomBar configures 5 tabs', async () => {
    await render(<TestBottomBarHarness hookType="jobs" />)
    expect(screen.getByTestId('tab-count').props.children).toBe('5')
  })
})
