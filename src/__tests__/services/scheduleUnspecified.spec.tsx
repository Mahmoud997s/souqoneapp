import React from 'react'
import { render, fireEvent, act } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ServiceStep4Schedule } from '../../components/services/wizard/ServiceStep4Schedule'
import { ServiceStep6Review } from '../../components/services/wizard/ServiceStep6Review'
import { ServiceScheduleCard } from '../../screens/services/components/ServiceScheduleCard'
import { ServiceCard } from '../../components/services/ServiceCard'
import { defaultServiceFormData } from '../../store/serviceWizardStore'
import { WORKING_DAYS_AR } from '../../constants/services'
import type { ServiceScheduleViewModel } from '../../types/serviceDetailViewModel.types'
import type { UnifiedCardItem } from '../../types/unified-card.types'

// Mocks
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}))

jest.mock('expo-image', () => ({
  Image: () => null,
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}))

jest.mock('react-native-modal-datetime-picker', () => {
  return function MockDateTimePicker() {
    return null
  }
})

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Services Schedule Unspecified Behavior (Decision d6, D-233)', () => {
  describe('ServiceStep4Schedule', () => {
    it('renders optional title and clear explanatory copy that days and hours are independent and optional', async () => {
      const onUpdateField = jest.fn()
      const { getByText, getByTestId } = await render(
        <ServiceStep4Schedule
          formData={{ ...defaultServiceFormData, workingDays: [] }}
          errors={{}}
          onUpdateField={onUpdateField}
        />
      )

      expect(getByText('أيام العمل (اختياري)')).toBeTruthy()
      expect(
        getByText(/أيام وساعات العمل اختيارية ومستقلة — حدد الأيام أو اتركها فارغة لتعني 'غير محدد'/)
      ).toBeTruthy()
      expect(getByText('أوقات وساعات العمل (اختياري)')).toBeTruthy()
      expect(
        getByText(/ساعات العمل اختيارية ومستقلة عن الأيام — حدد توقيت البدء والانتهاء أو اتركهما فارغين/)
      ).toBeTruthy()
      expect(getByTestId('unspecified-days-notice')).toBeTruthy()
      expect(
        getByText(/أيام وساعات العمل اختيارية ومستقلة — ترك الأيام فارغة يعني "غير محدد" للمشتري/)
      ).toBeTruthy()
    })

    it('allows clearing preset to empty so user can leave schedule unspecified', async () => {
      const onUpdateField = jest.fn()
      const { getByTestId } = await render(
        <ServiceStep4Schedule
          formData={{
            ...defaultServiceFormData,
            workingDays: [...WORKING_DAYS_AR],
          }}
          errors={{}}
          onUpdateField={onUpdateField}
        />
      )

      const clearBtn = getByTestId('clear-all-days')
      expect(clearBtn).toBeTruthy()
      await act(async () => {
        fireEvent.press(clearBtn)
      })
      expect(onUpdateField).toHaveBeenCalledWith('workingDays', [])
    })
  })

  describe('ServiceStep6Review', () => {
    it('displays "غير محدد" for days and hours when schedule is left empty', async () => {
      const { getByTestId } = await render(
        <ServiceStep6Review
          formData={{
            ...defaultServiceFormData,
            workingDays: [],
            workingHoursOpen: '',
            workingHoursClose: '',
          }}
          onEditStep={jest.fn()}
        />
      )

      const daysValue = getByTestId('review-working-days')
      const hoursValue = getByTestId('review-working-hours')

      expect(daysValue.props.children).toBe('غير محدد')
      expect(hoursValue.props.children).toBe('غير محدد')
    })

    it('displays formatted days and hours when schedule is specified', async () => {
      const { getByTestId } = await render(
        <ServiceStep6Review
          formData={{
            ...defaultServiceFormData,
            workingDays: ['السبت', 'الأحد'],
            workingHoursOpen: '08:00',
            workingHoursClose: '17:00',
          }}
          onEditStep={jest.fn()}
        />
      )

      const daysValue = getByTestId('review-working-days')
      const hoursValue = getByTestId('review-working-hours')

      expect(daysValue.props.children).toBe('السبت، الأحد')
      expect(hoursValue.props.children).toContain('08:00 ص')
      expect(hoursValue.props.children).toContain('05:00 م')
    })

    it('displays formatted hours and "غير محدد" for days when user selects hours only (D-233)', async () => {
      const { getByTestId } = await render(
        <ServiceStep6Review
          formData={{
            ...defaultServiceFormData,
            workingDays: [],
            workingHoursOpen: '08:00',
            workingHoursClose: '17:00',
          }}
          onEditStep={jest.fn()}
        />
      )

      const daysValue = getByTestId('review-working-days')
      const hoursValue = getByTestId('review-working-hours')

      expect(daysValue.props.children).toBe('غير محدد')
      expect(hoursValue.props.children).toContain('08:00 ص')
      expect(hoursValue.props.children).toContain('05:00 م')
    })
  })

  describe('ServiceScheduleCard', () => {
    it('renders "ساعات العمل: غير محدد" when schedule has no days and no hours', async () => {
      const unspecifiedSchedule: ServiceScheduleViewModel = {
        workingDays: [],
        workingDaysSummary: '',
        workingHoursLabel: '',
        hasSchedule: false,
        isOpenHoursProvided: false,
      }

      const { getByTestId, getByText } = await render(
        <ServiceScheduleCard schedule={unspecifiedSchedule} />
      )

      const card = getByTestId('service-schedule-card')
      expect(card).toBeTruthy()

      const unspecifiedText = getByTestId('schedule-unspecified')
      expect(unspecifiedText).toBeTruthy()
      expect(unspecifiedText.props.children).toBe('غير محدد')
      expect(getByText('ساعات العمل:')).toBeTruthy()
    })

    it('renders schedule sections when schedule has days and hours', async () => {
      const specifiedSchedule: ServiceScheduleViewModel = {
        workingDays: ['السبت', 'الأحد'],
        workingDaysSummary: 'السبت، الأحد',
        workingHoursLabel: '08:00 - 17:00',
        hasSchedule: true,
        isOpenHoursProvided: true,
      }

      const { getByTestId, queryByTestId, getByText } = await render(
        <ServiceScheduleCard schedule={specifiedSchedule} />
      )

      expect(getByTestId('service-schedule-card')).toBeTruthy()
      expect(queryByTestId('schedule-unspecified')).toBeNull()
      expect(getByText('السبت، الأحد')).toBeTruthy()
      expect(getByText('08:00 - 17:00')).toBeTruthy()
    })

    it('renders hours row and "أيام العمل: غير محدد" when schedule has hours but no days (D-233)', async () => {
      const hoursOnlySchedule: ServiceScheduleViewModel = {
        workingDays: [],
        workingDaysSummary: '',
        workingHoursLabel: 'من 08:00 ص إلى 05:00 م',
        hasSchedule: true,
        isOpenHoursProvided: true,
      }

      const { getByTestId, queryByTestId, getByText } = await render(
        <ServiceScheduleCard schedule={hoursOnlySchedule} />
      )

      expect(getByTestId('service-schedule-card')).toBeTruthy()
      expect(queryByTestId('schedule-unspecified')).toBeNull()
      expect(getByTestId('days-unspecified')).toBeTruthy()
      expect(getByTestId('days-unspecified').props.children).toBe('غير محدد')
      expect(getByText('من 08:00 ص إلى 05:00 م')).toBeTruthy()
    })
  })

  describe('ServiceCard', () => {
    it('omits hours pill when working hours are empty / unspecified', async () => {
      const item: UnifiedCardItem = {
        id: 'srv-1',
        title: 'خدمة بدون جدول عمل',
        price: 25,
        currency: 'OMR',
        governorate: 'مسقط',
        images: [],
        raw: {
          serviceType: 'MAINTENANCE',
          providerName: 'كراج الفلاح',
          providerType: 'WORKSHOP',
          workingHoursOpen: null,
          workingHoursClose: null,
          workingDays: [],
        },
      }

      const { getByText, queryByText } = await render(
        <ServiceCard item={item} onPress={jest.fn()} />,
        { wrapper: createWrapper() }
      )

      // Provider name pill exists
      expect(getByText('كراج الفلاح')).toBeTruthy()
      // No hours pill is present
      expect(queryByText(/-/)).toBeNull()
    })

    it('displays hours pill when working hours are specified even if days are empty (D-233)', async () => {
      const item: UnifiedCardItem = {
        id: 'srv-2',
        title: 'خدمة مع جدول عمل بساعات فقط',
        price: 40,
        currency: 'OMR',
        governorate: 'مسقط',
        images: [],
        raw: {
          serviceType: 'MAINTENANCE',
          providerName: 'كراج الفلاح',
          providerType: 'WORKSHOP',
          workingHoursOpen: '08:00',
          workingHoursClose: '18:00',
          workingDays: [], // Empty days
        },
      }

      const { getByText } = await render(
        <ServiceCard item={item} onPress={jest.fn()} />,
        { wrapper: createWrapper() }
      )

      expect(getByText('08:00 - 18:00')).toBeTruthy()
    })
  })
})
