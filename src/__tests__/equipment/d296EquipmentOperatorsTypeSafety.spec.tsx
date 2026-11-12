import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from 'expo-router'

import EquipmentLandingScreen from '../../../app/equipment/index'
import EquipmentDraftsScreen from '../../../app/equipment/drafts'
import EditEquipmentLoaderScreen from '../../../app/equipment/edit/[id]'
import EditOperatorScreen from '../../../app/equipment/operators/edit/[id]'
import { EquipmentHorizontalList } from '../../components/equipment/landing/EquipmentHorizontalList'
import { EquipmentStep1Type } from '../../components/equipment/wizard/EquipmentStep1Type'
import { EquipmentStep2Images } from '../../components/equipment/wizard/EquipmentStep2Images'
import { EquipmentStep5Review } from '../../components/equipment/wizard/EquipmentStep5Review'
import { equipmentApi } from '../../api/equipment'
import { useEquipment, useOperatorsInfinite, useOperatorItem, useUpdateOperator } from '../../hooks/useEquipment'
import { useEquipmentWizardStore } from '../../store/equipmentWizardStore'
import { dialogService } from '../../store/dialogStore'
import { EquipmentFormData } from '../../types/equipmentForm.types'
import { UnifiedCardItem } from '../../types/unified-card.types'

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
}

let mockSearchId = 'op-edit-1'

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ id: mockSearchId }),
  usePathname: () => '/equipment',
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  Stack: {
    Screen: () => null,
  },
}))

jest.mock('@expo/vector-icons', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    Ionicons: ({ name }: { name: string }) => <Text testID={`icon-${name}`}>{name}</Text>,
    MaterialCommunityIcons: ({ name }: { name: string }) => <Text testID={`mci-${name}`}>{name}</Text>,
  }
})

jest.mock('../../components/navigation/glassCapability', () => {
  const actual = jest.requireActual('../../components/navigation/glassCapability')
  return {
    ...actual,
    useGlassSupport: () => ({ kind: 'blur' as const }),
  }
})

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

jest.mock('../../hooks/useScrollAwareNav', () => ({
  useScrollAwareNav: () => ({
    scrollHandler: jest.fn(),
    scrollY: { value: 0 },
  }),
}))

jest.mock('../../utils/scheduleIdleTask', () => ({
  scheduleIdleTask: (cb: () => void) => {
    cb()
    return { cancel: jest.fn() }
  },
}))

jest.mock('../../api/equipment', () => ({
  equipmentApi: {
    getById: jest.fn(),
  },
}))

jest.mock('../../hooks/useEquipment', () => ({
  useEquipment: jest.fn(),
  useOperatorsInfinite: jest.fn(),
  useOperatorItem: jest.fn(),
  useUpdateOperator: jest.fn(),
}))

jest.mock('../../store/equipmentWizardStore', () => ({
  useEquipmentWizardStore: jest.fn(),
}))

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn(),
  },
}))

jest.mock('../../components/ui/AnimatedHeroHeader', () => ({
  AnimatedHeroHeader: ({ onHeaderIconPress }: { onHeaderIconPress?: () => void }) => {
    const { TouchableOpacity, Text } = require('react-native')
    return (
      <TouchableOpacity testID="hero-header-notif-btn" onPress={onHeaderIconPress}>
        <Text>Notifications</Text>
      </TouchableOpacity>
    )
  },
}))

jest.mock('../../components/equipment/EquipmentBottomBar', () => ({
  EquipmentBottomBar: () => null,
}))

jest.mock('../../components/equipment/landing/EquipmentCategoriesGrid', () => ({
  EquipmentCategoriesGrid: () => null,
}))

jest.mock('../../components/cards/EquipCard', () => ({
  EquipCard: ({ item, onPress }: { item: { id: string; title: string }; onPress: () => void }) => {
    const { TouchableOpacity, Text } = require('react-native')
    return (
      <TouchableOpacity testID={`equip-card-press-${item.id}`} onPress={onPress}>
        <Text>{item.title}</Text>
      </TouchableOpacity>
    )
  },
}))

jest.mock('../../components/cards/OperatorCard', () => ({
  OperatorCard: ({ item, onPress }: { item: { id: string; title: string }; onPress: () => void }) => {
    const { TouchableOpacity, Text } = require('react-native')
    return (
      <TouchableOpacity testID={`operator-card-press-${item.id}`} onPress={onPress}>
        <Text>{item.title}</Text>
      </TouchableOpacity>
    )
  },
}))

jest.mock('../../components/operators/OperatorRoleStep', () => ({
  OperatorRoleStep: ({ formData }: { formData: { governorateName?: string } }) => {
    const { Text } = require('react-native')
    return <Text testID="mock-op-gov">{formData.governorateName}</Text>
  },
}))

jest.mock('../../components/operators/OperatorEquipCertsStep', () => ({
  OperatorEquipCertsStep: () => null,
}))

jest.mock('../../components/operators/OperatorRatesLocationStep', () => ({
  OperatorRatesLocationStep: () => null,
}))

const mockDraftCaptured: { images?: string[] } = {}
jest.mock('../../components/post/DraftResumeScreen', () => ({
  DraftResumeScreen: (props: { images: string[]; draftTitle: string }) => {
    const { Text } = require('react-native')
    mockDraftCaptured.images = props.images
    return <Text testID="draft-title">{props.draftTitle}</Text>
  },
}))

function createBaseEquipmentForm(overrides: Partial<EquipmentFormData> = {}): EquipmentFormData {
  return {
    title: 'حفار كاتربيلر 320',
    description: 'حفار بحالة ممتازة وجاهز للعمل الفوري',
    equipmentType: 'EXCAVATOR',
    listingType: 'EQUIPMENT_SALE',
    make: 'Caterpillar',
    model: '320D',
    year: '2021',
    condition: 'USED',
    capacity: '20 Ton',
    power: '150 HP',
    weight: '22000 kg',
    hoursUsed: '3200',
    features: ['كابينة مكيفة'],
    price: '25000',
    dailyPrice: '',
    monthlyPrice: '',
    isPriceNegotiable: true,
    withOperator: false,
    deliveryAvailable: true,
    budgetMin: '',
    budgetMax: '',
    rentalDuration: '',
    quantity: '1',
    siteDetails: '',
    governorateId: 1,
    wilayaId: 10,
    governorate: 'مسقط',
    city: 'السيب',
    latitude: null,
    longitude: null,
    whatsappEnabled: true,
    images: [],
    existingImages: [],
    removedImageIds: [],
    ...overrides,
  }
}

async function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return await render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('D-296 Equipment & Operators Strict Type Safety & Behavioral Parity', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDraftCaptured.images = undefined
    mockSearchId = 'op-edit-1'
  })

  it('EquipmentDraftsScreen maps string and object draft/existing images without any casts', async () => {
    ;(useEquipmentWizardStore as unknown as jest.Mock).mockReturnValue({
      currentStep: 2,
      formData: {
        title: 'حفارة تجريبية',
        images: [{ uri: 'file:///local/new1.jpg' }, 'file:///local/new2.jpg'],
        existingImages: [{ id: 'img-1', url: 'https://cdn.example/a.jpg' }, 'https://cdn.example/b.jpg'],
      },
      resetDraft: jest.fn(),
    })

    const { getByTestId } = await render(<EquipmentDraftsScreen />)
    expect(getByTestId('draft-title').props.children).toBe('حفارة تجريبية')
    expect(mockDraftCaptured.images).toEqual([
      'file:///local/new1.jpg',
      'file:///local/new2.jpg',
      'https://cdn.example/a.jpg',
      'https://cdn.example/b.jpg',
    ])
  })

  it('EquipmentStep2Images renders existing images and passes id-or-url on remove', async () => {
    const onRemoveExisting = jest.fn()
    const { getByText, getAllByTestId } = await render(
      <EquipmentStep2Images
        images={[]}
        existingImages={[
          { id: 'ext-1', url: 'https://cdn.example/one.jpg' },
          'https://cdn.example/two.jpg',
        ]}
        errors={{}}
        isUploading={false}
        onPickImages={jest.fn()}
        onRemoveNewImage={jest.fn()}
        onRemoveExistingImage={onRemoveExisting}
      />
    )

    expect(getByText('الصور الحالية المرفوعة (2)')).toBeTruthy()
    expect(getByText('الرئيسية')).toBeTruthy()

    const closeIcons = getAllByTestId('icon-close')
    expect(closeIcons.length).toBe(2)
    await fireEvent.press(closeIcons[0])
    await fireEvent.press(closeIcons[1])
    expect(onRemoveExisting).toHaveBeenNthCalledWith(1, 'ext-1')
    expect(onRemoveExisting).toHaveBeenNthCalledWith(2, 'https://cdn.example/two.jpg')
  })

  it('EquipmentStep5Review aggregates typed existingImages and new images cleanly', async () => {
    const formData = createBaseEquipmentForm({
      existingImages: [{ url: 'https://cdn.example/old.jpg' }],
      images: [{ uri: 'file:///new.jpg' }, 'file:///raw.jpg'],
    })

    const { getByText } = await render(
      <EquipmentStep5Review formData={formData} onEditStep={jest.fn()} />
    )

    expect(getByText('الصور والمرفقات (3)')).toBeTruthy()
  })

  it('EquipmentStep1Type selects listing types and equipment categories cleanly', async () => {
    const onUpdateField = jest.fn()
    const { getByText } = await render(
      <EquipmentStep1Type
        formData={createBaseEquipmentForm()}
        errors={{}}
        onUpdateField={onUpdateField}
      />
    )

    await fireEvent.press(getByText('معدة للإيجار'))
    expect(onUpdateField).toHaveBeenCalledWith('listingType', 'EQUIPMENT_RENT')

    await fireEvent.press(getByText('رافعة / كرين'))
    expect(onUpdateField).toHaveBeenCalledWith('equipmentType', 'CRANE')
  })

  it('EquipmentHorizontalList preserves UnifiedCardItem click dispatch', async () => {
    const onPressItem = jest.fn()
    const card: UnifiedCardItem = {
      id: 'eq-item-99',
      title: 'لودر كوماتسو WA380',
      images: ['https://cdn.example/wa380.jpg'],
      price: 18000,
    }

    const { getByTestId } = await renderWithQuery(
      <EquipmentHorizontalList
        title="أحدث المعدات"
        data={[card]}
        isLoading={false}
        emptyText="لا توجد معدات"
        onSeeAll={jest.fn()}
        onPressItem={onPressItem}
      />
    )

    await fireEvent.press(getByTestId('equip-card-press-eq-item-99'))
    expect(onPressItem).toHaveBeenCalledWith(card)
  })

  it('EquipmentLandingScreen navigates to typed routes with exact strings', async () => {
    const eqCard: UnifiedCardItem = {
      id: 'eq-route-1',
      title: 'شيول كاتربيلر',
      images: [],
    }
    const opCard: UnifiedCardItem = {
      id: 'op-route-2',
      title: 'مشغل كرين',
      images: [],
    }

    ;(useEquipment as jest.Mock).mockReturnValue({
      data: [eqCard],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetchError: false,
      isRefetching: false,
    })
    ;(useOperatorsInfinite as jest.Mock).mockReturnValue({
      data: { pages: [{ items: [opCard] }] },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetchError: false,
      isRefetching: false,
    })

    const { getByTestId } = await renderWithQuery(<EquipmentLandingScreen />)

    await fireEvent.press(getByTestId('equip-card-press-eq-route-1'))
    expect(mockRouter.push).toHaveBeenCalledWith('/equipment/eq-route-1')

    await waitFor(
      () => {
        expect(getByTestId('operator-card-press-op-route-2')).toBeTruthy()
      },
      { timeout: 1000 }
    )
    await fireEvent.press(getByTestId('operator-card-press-op-route-2'))
    expect(mockRouter.push).toHaveBeenCalledWith('/equipment/operators/op-route-2')

    await fireEvent.press(getByTestId('hero-header-notif-btn'))
    expect(mockRouter.push).toHaveBeenCalledWith('/profile/notifications')
  })

  it('EditEquipmentLoaderScreen unwraps direct listing payload without data envelope cast', async () => {
    const initEditMode = jest.fn()
    ;(useEquipmentWizardStore as unknown as jest.Mock).mockImplementation(
      (selector: (s: { initEditMode: typeof initEditMode }) => unknown) =>
        selector({ initEditMode })
    )
    const directPayload = { id: 'eq-direct-1', title: 'Direct Listing' }
    ;(equipmentApi.getById as jest.Mock).mockResolvedValueOnce(directPayload)

    mockSearchId = 'eq-direct-1'
    await render(<EditEquipmentLoaderScreen />)

    await waitFor(() => {
      expect(initEditMode).toHaveBeenCalledWith(directPayload)
      expect(router.replace).toHaveBeenCalledWith('/equipment/new')
    })
  })

  it('EditOperatorScreen reads nested governorate.nameAr and surfaces array mutation errors', async () => {
    const mutateMock = jest.fn((_args, opts) => {
      opts.onError({ response: { data: { message: ['رسالة خطأ أولى', 'رسالة ثانية'] } } })
    })
    ;(useUpdateOperator as jest.Mock).mockReturnValue({ mutate: mutateMock, isPending: false })
    ;(useOperatorItem as jest.Mock).mockReturnValue({
      data: {
        id: 'op-edit-1',
        operatorType: 'OPERATOR',
        title: 'مشغل حفار محترف',
        description: 'خبرة تزيد عن 10 سنوات في المشاريع الكبرى',
        experienceYears: 10,
        equipmentTypes: ['EXCAVATOR'],
        certifications: ['ROP'],
        dailyRate: 40,
        governorateId: 1,
        wilayaId: 10,
        governorate: { nameAr: 'مسقط' },
        wilaya: { nameAr: 'السيب' },
      },
      isLoading: false,
      isError: false,
    })

    const { getByTestId, getByText } = await render(<EditOperatorScreen />)

    await waitFor(() => {
      expect(getByTestId('mock-op-gov').props.children).toBe('مسقط')
    })

    await fireEvent.press(getByText('متابعة الخطوة التالية'))
    await fireEvent.press(getByText('متابعة الخطوة التالية'))
    await fireEvent.press(getByText('حفظ وتحديث البطاقة'))

    expect(mutateMock).toHaveBeenCalledTimes(1)
    expect(dialogService.alert).toHaveBeenCalledWith('خطأ', 'رسالة خطأ أولى')
  })
})
