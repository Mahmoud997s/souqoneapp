import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { router } from 'expo-router'
import { useMyOperators, useCreateOperator } from '../hooks/useEquipment'
import { useAuthStore } from '../store/authStore'
import { useOperatorWizardStore } from '../store/operatorWizardStore'
import AddOperatorScreen from '../../app/equipment/operators/add'

const extractText = (node: any): string => {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && node.children) return extractText(node.children);
  return '';
};

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
  Stack: {
    Screen: () => null,
  },
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

jest.mock('../hooks/useEquipment', () => ({
  useMyOperators: jest.fn(),
  useCreateOperator: jest.fn(),
}))

jest.mock('../store/authStore', () => ({
  useAuthStore: jest.fn(),
}))

jest.mock('../store/operatorWizardStore', () => ({
  useOperatorWizardStore: jest.fn(),
}))

jest.mock('../hooks/useOperatorFormLogic', () => ({
  useOperatorFormLogic: () => ({}),
}))

jest.mock('../components/operators/OperatorRoleStep', () => ({
  OperatorRoleStep: () => null,
}))
jest.mock('../components/operators/OperatorEquipCertsStep', () => ({
  OperatorEquipCertsStep: () => null,
}))
jest.mock('../components/operators/OperatorRatesLocationStep', () => ({
  OperatorRatesLocationStep: () => null,
}))
jest.mock('../components/ui/Stepper', () => ({
  Stepper: () => null,
}))
jest.mock('../components/ui/AppHeader', () => ({
  AppHeader: () => null,
}))
jest.mock('../components/ui/AppButton', () => ({
  AppButton: () => null,
}))

describe('AddOperatorScreen Safety Net', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { id: 'user1' } })
    ;(useCreateOperator as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false })
    ;(useOperatorWizardStore as unknown as jest.Mock).mockReturnValue({
      currentStep: 1,
      formData: {},
      errors: {},
      nextStep: jest.fn(),
      prevStep: jest.fn(),
      setFormField: jest.fn(),
      setFormData: jest.fn(),
      clearFieldError: jest.fn(),
      validateStep: jest.fn(),
      resetDraft: jest.fn(),
    })
  })

  it('redirects to edit screen if user already has an operator profile', () => {
    // Mock existing operator
    ;(useMyOperators as jest.Mock).mockReturnValue({
      data: [{ id: 'op_existing_123' }],
      isLoading: false,
    })

    let root: any
    act(() => {
      root = TestRenderer.create(<AddOperatorScreen />)
    })

    // Should call router.replace with edit route
    expect(router.replace).toHaveBeenCalledWith('/equipment/operators/edit/op_existing_123')

    // Should NOT render the step title "البيانات المهنية والتخصص" since it guards with a blank view
    const textOutput = extractText(root.toJSON())
    expect(textOutput).not.toContain('البيانات المهنية والتخصص')
    expect(textOutput).not.toContain('إضافة بطاقة مهنية')
  })

  it('renders the add screen normally if user has no operator profiles', () => {
    // Mock no existing operator
    ;(useMyOperators as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    })

    let root: any
    act(() => {
      root = TestRenderer.create(<AddOperatorScreen />)
    })

    // Should NOT call router.replace
    expect(router.replace).not.toHaveBeenCalled()

    // Should render step 1 (Draft banner is part of the main screen)
    const textOutput = extractText(root.toJSON())
    expect(textOutput).toContain('مسح والبدء من جديد')
  })
})
