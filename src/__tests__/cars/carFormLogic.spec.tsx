import { renderHook, act } from '@testing-library/react-native'
import { useCarFormLogic } from '../../hooks/useCarFormLogic'
import { useCarWizardStore } from '../../store/carWizardStore'

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}))

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}))

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn(),
  },
}))

describe('useCarFormLogic: Consecutive image removals', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useCarWizardStore.getState().resetForm()
  })

  it('preserves all consecutive removed image IDs in removedImageIds without dropping prior ones', async () => {
    const updateField = (field: any, val: any) => {
      useCarWizardStore.getState().updateField(field, val)
    }

    // Seed existing images
    useCarWizardStore.getState().updateField('existingImages', [
      { id: 'img-1', url: 'https://img1.jpg' },
      { id: 'img-2', url: 'https://img2.jpg' },
      { id: 'img-3', url: 'https://img3.jpg' },
    ])

    const { result } = await renderHook(() =>
      useCarFormLogic(useCarWizardStore.getState().formData, updateField)
    )

    act(() => {
      result.current.handleRemoveExistingImage('img-1')
    })
    expect(useCarWizardStore.getState().formData.removedImageIds).toEqual(['img-1'])

    act(() => {
      result.current.handleRemoveExistingImage('img-2')
    })
    // Must contain BOTH img-1 and img-2 (no closure race/drop!)
    expect(useCarWizardStore.getState().formData.removedImageIds).toEqual(['img-1', 'img-2'])
  })
})
