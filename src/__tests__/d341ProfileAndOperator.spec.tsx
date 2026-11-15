import fs from 'fs'
import path from 'path'
import React from 'react'
import { render, screen, fireEvent, act, renderHook } from '@testing-library/react-native'
import { router } from 'expo-router'

const mockNavigateToAddOperator = jest.fn()
const mockMutate = jest.fn()
let mockMyOperatorsState: { data: any[] | undefined; isLoading: boolean } = {
  data: [],
  isLoading: false,
}

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
  useFocusEffect: jest.fn(),
  Stack: { Screen: () => null },
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

jest.mock('../store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'user-42', displayName: 'سالم', phone: '91234567' },
    logout: jest.fn(),
  }),
}))

jest.mock('../hooks/useListings', () => ({
  useMyListings: () => ({
    data: [],
    isError: false,
    isRefetching: false,
    refetch: jest.fn(),
  }),
  useFavorites: () => ({
    data: [],
    isError: false,
    isRefetching: false,
    refetch: jest.fn(),
  }),
}))

jest.mock('../hooks/useEquipment', () => ({
  useMyOperators: () => mockMyOperatorsState,
  useCreateOperator: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}))

jest.mock('../hooks/useOperatorNavigation', () => ({
  useOperatorNavigation: () => ({
    navigateToAddOperator: mockNavigateToAddOperator,
  }),
}))

jest.mock('../hooks/useProfilePhoneGuard', () => ({
  useProfilePhoneGuard: () => ({ hasPhone: true }),
}))

jest.mock('../store/operatorWizardStore', () => ({
  useOperatorWizardStore: () => ({
    currentStep: 3,
    formData: {
      title: 'مشغل حفار',
      equipmentTypes: ['حفار'],
      specializations: ['حفر'],
      certifications: [],
      governorateId: '1',
      wilayaId: '2',
      phone: '91234567',
    },
    errors: {},
    setStep: jest.fn(),
    nextStep: jest.fn(),
    prevStep: jest.fn(),
    setFormField: jest.fn(),
    setFormData: jest.fn(),
    clearFieldError: jest.fn(),
    setErrors: jest.fn(),
    validateStep: () => true,
    resetDraft: jest.fn(),
  }),
}))

jest.mock('../hooks/useOperatorFormLogic', () => ({
  useOperatorFormLogic: () => ({}),
}))

jest.mock('../utils/operator-payload', () => ({
  buildOperatorPayload: (d: unknown) => d,
}))

jest.mock('../components/operators/OperatorRoleStep', () => ({
  OperatorRoleStep: () => null,
}))
jest.mock('../components/operators/OperatorEquipCertsStep', () => ({
  OperatorEquipCertsStep: () => null,
}))
jest.mock('../components/operators/OperatorRatesLocationStep', () => {
  const { View } = require('react-native')
  return { OperatorRatesLocationStep: () => <View testID="operator-step-3" /> }
})

import { useProfileOverview } from '../hooks/useProfileOverview'
import AddOperatorScreen from '../../app/equipment/operators/add'

describe('D-341: Profile links, Operator add redirect fix, and OperatorSmartBanner tokens', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMyOperatorsState = { data: [], isLoading: false }
  })

  it('builds seller public profile row and both operator row states without wrong-label flash while loading', async () => {
    mockMyOperatorsState = { data: undefined, isLoading: true }
    const { result, rerender } = await renderHook(() => useProfileOverview())
    expect(result.current.activitiesItems.some((i) => i.title.includes('مشغّل'))).toBe(false)

    const sellerRow = result.current.activitiesItems.find((i) => i.title === 'ملفي العام كبائع')
    expect(sellerRow).toBeDefined()
    expect(sellerRow?.subTitle).toBe('كما يراه المشترون')
    expect(sellerRow?.route).toBe('/profile/user-42')

    mockMyOperatorsState = { data: [], isLoading: false }
    await rerender({})
    const registerRow = result.current.activitiesItems.find(
      (i) => i.title === 'سجّل كمشغّل الآن وتلقَّ عروض عمل'
    )
    expect(registerRow).toBeDefined()
    registerRow?.onPress?.()
    expect(mockNavigateToAddOperator).toHaveBeenCalledTimes(1)

    mockMyOperatorsState = { data: [{ id: 'op-99' }], isLoading: false }
    await rerender({})
    const myOpRow = result.current.activitiesItems.find((i) => i.title === 'ملفي كمشغّل')
    expect(myOpRow?.route).toBe('/equipment/operators/op-99')
  })

  it('keeps AddOperatorScreen on PublishSuccessView after createMutation invalidates my-operators and routes primary CTA to created operator', async () => {
    mockMutate.mockImplementation((_payload, callbacks) => {
      callbacks.onSuccess({ data: { id: 'op-created-77' } })
    })

    const { rerender } = await render(<AddOperatorScreen />)
    const submitBtn = screen.getByText('نشر بطاقتي في الدليل')
    await act(async () => {
      fireEvent.press(submitBtn)
    })

    // Simulate ['my-operators'] invalidation refetch returning the newly created operator
    mockMyOperatorsState = { data: [{ id: 'op-created-77' }], isLoading: false }
    rerender(<AddOperatorScreen />)

    expect(router.replace).not.toHaveBeenCalledWith('/equipment/operators/edit/op-created-77')
    const primaryBtn = screen.getByTestId('publish-success-primary-btn')
    expect(primaryBtn).toBeTruthy()
    expect(screen.getByText('عرض بطاقتي')).toBeTruthy()

    await act(async () => {
      fireEvent.press(primaryBtn)
    })
    expect(router.replace).toHaveBeenCalledWith('/equipment/operators/op-created-77')
  })

  it('OperatorSmartBanner.tsx contains zero hard-coded hex or rgb/rgba literals', () => {
    const bannerSource = fs.readFileSync(
      path.resolve(__dirname, '../components/operators/OperatorSmartBanner.tsx'),
      'utf8'
    )
    const matches = bannerSource.match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(/g)
    expect(matches).toBeNull()
  })
})
