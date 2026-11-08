import React from 'react'
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import NewPartListingScreen from '../../../app/parts/new'
import { partsApi } from '../../api/parts'
import { carsApi } from '../../api/cars'
import { uploadsApi } from '../../api/uploads'
import { apiClient } from '../../api/client'
import { router } from 'expo-router'
import {
  usePartWizardStore,
  defaultPartFormData,
  mergePartWizardState,
} from '../../store/partWizardStore'
import { useAuthStore } from '../../store/authStore'
import { dialogService } from '../../store/dialogStore'
import * as partQueryKeysModule from '../../screens/parts/hooks/partQueryKeys'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { serializeLedger, createEmptyLedger } from '../../utils/imageReconciliation'

jest.mock('../../api/parts')
jest.mock('../../api/cars', () => ({
  carsApi: {
    getBrands: jest.fn().mockResolvedValue([]),
  },
}))

jest.mock('../../api/uploads', () => ({
  uploadsApi: {
    single: jest.fn(),
    addPartImage: jest.fn(),
    addPartImageByUrl: jest.fn(),
    removePartImage: jest.fn(),
  },
}))

jest.mock('../../api/client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}))

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}))

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => <>{children}</>,
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}))

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

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn(),
  },
}))

describe('Parts Wizard Image Reconciliation Flow (F6b / D-247 / Codex A-051)', () => {
  let queryClient: QueryClient
  let invalidateSpy: jest.SpyInstance

  const validPartFormData = {
    ...defaultPartFormData,
    listingType: 'SPARE_PART_SALE' as const,
    partCategory: 'ENGINE' as const,
    condition: 'USED' as const,
    isOriginal: true,
    title: 'محرك لاندكروزر V8 أصلي',
    description: 'محرك أصلي بحالة ممتازة ومفحوص بالكامل مع ضمان 6 أشهر',
    partNumber: '1GR-FE',
    price: 850,
    governorateId: 1,
    wilayaId: 10,
    governorateNameAr: 'مسقط',
    wilayaNameAr: 'السيب',
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
    usePartWizardStore.getState().reset()

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    invalidateSpy = jest
      .spyOn(partQueryKeysModule, 'invalidatePartListingQueries')
      .mockResolvedValue(undefined)

    useAuthStore.setState({
      user: { id: 'u1', phone: '+96891234567' } as any,
    })
  })

  afterEach(async () => {
    cleanup()
  })

  async function renderScreen() {
    return render(
      <QueryClientProvider client={queryClient}>
        <NewPartListingScreen />
      </QueryClientProvider>
    )
  }

  describe('1. Create Listing - Full Success Flow', () => {
    it('saves listing first, reconciles images, invalidates queries, and shows success view', async () => {
      ;(partsApi.create as jest.Mock).mockResolvedValueOnce({
        id: 'new-part-100',
        title: validPartFormData.title,
      })

      ;(uploadsApi.single as jest.Mock)
        .mockResolvedValueOnce({ data: { url: 'https://cdn.souqone.com/parts/p1.jpg' } })
        .mockResolvedValueOnce({ data: { url: 'https://cdn.souqone.com/parts/p2.jpg' } })

      usePartWizardStore.setState({
        currentStep: 6,
        formData: {
          ...validPartFormData,
          images: [
            { uri: 'file://local-p1.jpg', isPrimary: true },
            { uri: 'file://local-p2.jpg', isPrimary: false },
          ],
        },
      })

      await renderScreen()

      const submitBtn = await screen.findByTestId('wizard-submit-btn')
      await act(async () => {
        fireEvent.press(submitBtn)
      })

      await waitFor(() => {
        expect(partsApi.create).toHaveBeenCalledTimes(1)
        expect(uploadsApi.single).toHaveBeenCalledTimes(2)
        expect(invalidateSpy).toHaveBeenCalledWith(expect.any(Object), 'new-part-100')
      })

      expect(screen.getByText('تم نشر إعلانك بنجاح!')).toBeTruthy()
      expect(screen.getByTestId('publish-success-primary-btn')).toBeTruthy()
    })
  })

  describe('2. Create Listing - Partial Failure & Retry Flow (Decision d5)', () => {
    it('shows partial success without reset, and retry re-uploads only the failed image', async () => {
      ;(partsApi.create as jest.Mock).mockResolvedValueOnce({
        id: 'new-part-200',
        title: validPartFormData.title,
      })

      // First image succeeds, second image fails
      ;(uploadsApi.single as jest.Mock)
        .mockResolvedValueOnce({ data: { url: 'https://cdn.souqone.com/parts/p1.jpg' } })
        .mockRejectedValueOnce(new Error('Network timeout on upload'))

      usePartWizardStore.setState({
        currentStep: 6,
        formData: {
          ...validPartFormData,
          images: [
            { uri: 'file://local-p1.jpg', isPrimary: true },
            { uri: 'file://local-p2.jpg', isPrimary: false },
          ],
        },
      })

      await renderScreen()

      const submitBtn = await screen.findByTestId('wizard-submit-btn')
      await act(async () => {
        fireEvent.press(submitBtn)
      })

      // Verified: Listing is saved, partial view is displayed with retry button
      await waitFor(() => {
        expect(partsApi.create).toHaveBeenCalledTimes(1)
        expect(screen.getByText('تم نشر الإعلان')).toBeTruthy()
        expect(screen.getByText(/تعذر رفع 1 من الصور/)).toBeTruthy()
        expect(screen.getByTestId('publish-retry-failed-images-btn')).toBeTruthy()
      })

      // Form data in store is NOT cleared (no reset on partial failure)
      expect(usePartWizardStore.getState().formData.title).toBe(validPartFormData.title)

      // Now mock single to succeed on retry for local-p2.jpg
      ;(uploadsApi.single as jest.Mock).mockResolvedValueOnce({
        data: { url: 'https://cdn.souqone.com/parts/p2-retry.jpg' },
      })

      const retryBtn = screen.getByTestId('publish-retry-failed-images-btn')
      await act(async () => {
        fireEvent.press(retryBtn)
      })

      // Reconciler should only retry the failed image (1 call), not re-upload the succeeded one
      await waitFor(() => {
        expect(uploadsApi.single).toHaveBeenCalledTimes(3) // 2 from first attempt + 1 retry
        expect(screen.getByText('تم نشر إعلانك بنجاح!')).toBeTruthy()
      })
    })
  })

  describe('3. Edit Listing - Independent Attachment and Deletion (A-051 P1 teeth proof)', () => {
    it('proves attach failure does NOT abort or skip image deletions', async () => {
      ;(partsApi.update as jest.Mock).mockResolvedValueOnce({
        id: 'edit-part-300',
        title: validPartFormData.title,
      })

      ;(uploadsApi.single as jest.Mock).mockResolvedValueOnce({
        data: { url: 'https://cdn.souqone.com/parts/new-uploaded.jpg' },
      })
      // Attach fails with 500
      ;(uploadsApi.addPartImageByUrl as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to attach image to part')
      )
      // Delete succeeds
      ;(uploadsApi.removePartImage as jest.Mock).mockResolvedValueOnce({})

      usePartWizardStore.setState({
        currentStep: 6,
        formData: {
          ...validPartFormData,
          editMode: true,
          editListingId: 'edit-part-300',
          existingImages: [{ id: 'img-to-keep', url: 'https://cdn.souqone.com/img-keep.jpg' }],
          removedImageIds: ['img-to-delete-99'],
          images: [{ uri: 'file://new-local.jpg' }],
        },
      })

      await renderScreen()

      const submitBtn = await screen.findByTestId('wizard-submit-btn')
      await act(async () => {
        fireEvent.press(submitBtn)
      })

      await waitFor(() => {
        expect(partsApi.update).toHaveBeenCalledTimes(1)
        expect(uploadsApi.single).toHaveBeenCalledTimes(1)
        expect(uploadsApi.addPartImageByUrl).toHaveBeenCalledTimes(1)
        // TEETH PROOF: removePartImage MUST have been called despite attach failure!
        expect(uploadsApi.removePartImage).toHaveBeenCalledWith('img-to-delete-99')
      })

      // Screen reports partial failure because attach failed
      await waitFor(() => {
        expect(screen.getByText('تم حفظ التعديل جزئياً')).toBeTruthy()
        expect(screen.getByText(/تعذر تحديث 1 من الصور/)).toBeTruthy()
      })
    })
  })

  describe('4. Backend Endpoint Parity (A-051 P1 teeth proof)', () => {
    it('proves addPartImageByUrl calls POST /uploads/parts/:partId/images/url with { url, isPrimary }', async () => {
      // Test the real uploadsApi implementation from uploads.ts against mock apiClient
      const realUploadsModule = jest.requireActual('../../api/uploads')
      ;(apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { id: 'img-1', url: 'https://cdn.souqone.com/test.jpg' },
      })

      await realUploadsModule.uploadsApi.addPartImageByUrl('part-777', 'https://cdn.souqone.com/test.jpg', true)

      expect(apiClient.post).toHaveBeenCalledWith(
        '/uploads/parts/part-777/images/url',
        {
          url: 'https://cdn.souqone.com/test.jpg',
          isPrimary: true,
        }
      )
    })
  })

  describe('5. Store Hydration and Migration Safety (A-051 P2)', () => {
    it('migrates v0 state without version or imageLedger safely', () => {
      const v0Persisted = {
        formData: {
          title: 'محرك قديم',
          price: 500,
        },
        currentStep: 3,
      }

      const currentState = usePartWizardStore.getState()
      const merged = mergePartWizardState(v0Persisted, currentState)

      expect(merged.formData.title).toBe('محرك قديم')
      expect(merged.formData.imageLedger).toBeNull()
      expect(merged.formData.editMode).toBe(false)
      expect(merged.formData.editListingId).toBeNull()
    })

    it('strips stale listingId when hydrating into create mode to prevent cross-listing mutation', () => {
      const persistedWithLedger = {
        formData: {
          title: 'مسودة جديدة',
          imageLedger: serializeLedger({
            ...createEmptyLedger('stale-listing-123'),
            uploadedImages: [
              {
                localUri: 'file://p1.jpg',
                remoteUrl: 'https://cdn.souqone.com/p1.jpg',
                uploadedAt: Date.now(),
              },
            ],
          }),
        },
        currentStep: 2,
      }

      const currentState = {
        ...usePartWizardStore.getState(),
        formData: {
          ...defaultPartFormData,
          editMode: false,
          editListingId: null,
        },
      }
      const merged = mergePartWizardState(persistedWithLedger, currentState)

      expect(merged.formData.imageLedger).not.toBeNull()
      // Stale listingId must be stripped
      expect(merged.formData.imageLedger?.listingId).toBeUndefined()
      expect(merged.formData.imageLedger?.uploadedImages.length).toBe(1)
    })
  })
})
