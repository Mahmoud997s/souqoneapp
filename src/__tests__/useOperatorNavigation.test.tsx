import React from 'react'
import { act, create } from 'react-test-renderer'
import { useOperatorNavigation } from '../hooks/useOperatorNavigation'
import { useRouter } from 'expo-router'
import { useMyOperators } from '../hooks/useEquipment'
import { TouchableOpacity } from 'react-native'

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('../hooks/useEquipment', () => ({
  useMyOperators: jest.fn(),
}))

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: jest.fn(),
}))

const TestComponent = ({ onMount }: { onMount: (nav: any) => void }) => {
  const { navigateToAddOperator } = useOperatorNavigation()
  React.useEffect(() => {
    onMount(navigateToAddOperator)
  }, [navigateToAddOperator])
  return null
}

describe('Single Operator Profile Rule: useOperatorNavigation', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
  })

  it('should navigate to add route when user has zero operator listings', async () => {
    const mockRefetch = jest.fn().mockResolvedValue({ data: [] })
    ;(useMyOperators as jest.Mock).mockReturnValue({ refetch: mockRefetch })

    let navFn: any
    act(() => {
      create(<TestComponent onMount={(fn) => { navFn = fn }} />)
    })

    await act(async () => {
      await navFn()
    })

    expect(mockRefetch).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/equipment/operators/add')
  })

  it('should navigate to edit route of existing listing when user already has an operator', async () => {
    const mockRefetch = jest.fn().mockResolvedValue({ data: [{ id: 'op_123' }] })
    ;(useMyOperators as jest.Mock).mockReturnValue({ refetch: mockRefetch })

    let navFn: any
    act(() => {
      create(<TestComponent onMount={(fn) => { navFn = fn }} />)
    })

    await act(async () => {
      await navFn()
    })

    expect(mockRefetch).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/equipment/operators/edit/op_123')
    expect(mockPush).not.toHaveBeenCalledWith('/equipment/operators/add')
  })

  it('should fallback to add route on error (safety net in add.tsx will catch it)', async () => {
    const mockRefetch = jest.fn().mockRejectedValue(new Error('Network error'))
    ;(useMyOperators as jest.Mock).mockReturnValue({ refetch: mockRefetch })

    let navFn: any
    act(() => {
      create(<TestComponent onMount={(fn) => { navFn = fn }} />)
    })

    await act(async () => {
      await navFn()
    })

    expect(mockRefetch).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/equipment/operators/add')
  })
})
