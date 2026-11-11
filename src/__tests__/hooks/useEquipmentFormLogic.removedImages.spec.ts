import { act, renderHook } from '@testing-library/react-native'
import { useEquipmentFormLogic } from '../../hooks/useEquipmentFormLogic'

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}))

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn(),
  },
}))

describe('useEquipmentFormLogic removedImageIds (D-266 / R2-2)', () => {
  const existing = [
    { id: 'eq-img-1', url: 'https://cdn.example.com/1.jpg' },
    { id: 'eq-img-2', url: 'https://cdn.example.com/2.jpg' },
    { id: 'eq-img-3', url: 'https://cdn.example.com/3.jpg' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('preserves all deleted image IDs across sequential deletions when controlled via removedImageIds prop', async () => {
    let existingImages = [...existing]
    let removedImageIds: string[] = []

    const onUpdateExistingImages = jest.fn((imgs: any[]) => {
      existingImages = imgs
    })
    const onUpdateRemovedImageIds = jest.fn((ids: string[]) => {
      removedImageIds = ids
    })

    const { result, rerender } = await renderHook(
      (props: { existingImages: any[]; removedImageIds: string[] }) =>
        useEquipmentFormLogic({
          images: [],
          existingImages: props.existingImages,
          removedImageIds: props.removedImageIds,
          features: [],
          onUpdateImages: jest.fn(),
          onUpdateExistingImages,
          onUpdateRemovedImageIds,
          onUpdateFeatures: jest.fn(),
        }),
      { initialProps: { existingImages, removedImageIds } }
    )

    await act(async () => {
      result.current.handleRemoveExistingImage('eq-img-1')
    })
    expect(onUpdateRemovedImageIds).toHaveBeenLastCalledWith(['eq-img-1'])
    expect(onUpdateExistingImages).toHaveBeenLastCalledWith([existing[1], existing[2]])

    await rerender({ existingImages, removedImageIds })

    await act(async () => {
      result.current.handleRemoveExistingImage('eq-img-2')
    })
    expect(onUpdateRemovedImageIds).toHaveBeenLastCalledWith(['eq-img-1', 'eq-img-2'])
    expect(removedImageIds).toEqual(['eq-img-1', 'eq-img-2'])
    expect(onUpdateExistingImages).toHaveBeenLastCalledWith([existing[2]])
  })

  it('preserves sequential deleted image IDs even when removedImageIds prop is omitted', async () => {
    const onUpdateExistingImages = jest.fn()
    const onUpdateRemovedImageIds = jest.fn()

    const { result } = await renderHook(() =>
      useEquipmentFormLogic({
        images: [],
        existingImages: existing,
        features: [],
        onUpdateImages: jest.fn(),
        onUpdateExistingImages,
        onUpdateRemovedImageIds,
        onUpdateFeatures: jest.fn(),
      })
    )

    await act(async () => {
      result.current.handleRemoveExistingImage('eq-img-1')
    })
    await act(async () => {
      result.current.handleRemoveExistingImage('eq-img-2')
    })

    expect(onUpdateRemovedImageIds).toHaveBeenNthCalledWith(1, ['eq-img-1'])
    expect(onUpdateRemovedImageIds).toHaveBeenNthCalledWith(2, ['eq-img-1', 'eq-img-2'])
  })

  it('prevents duplicate IDs if the same existing image is removed twice', async () => {
    let removedImageIds: string[] = ['eq-img-1']
    const onUpdateExistingImages = jest.fn()
    const onUpdateRemovedImageIds = jest.fn((ids: string[]) => {
      removedImageIds = ids
    })

    const { result, rerender } = await renderHook(
      (props: { removedImageIds: string[] }) =>
        useEquipmentFormLogic({
          images: [],
          existingImages: existing,
          removedImageIds: props.removedImageIds,
          features: [],
          onUpdateImages: jest.fn(),
          onUpdateExistingImages,
          onUpdateRemovedImageIds,
          onUpdateFeatures: jest.fn(),
        }),
      { initialProps: { removedImageIds } }
    )

    await act(async () => {
      result.current.handleRemoveExistingImage('eq-img-1')
    })
    expect(onUpdateRemovedImageIds).not.toHaveBeenCalled()

    // Deleting by URL also resolves target.id and appends once
    await act(async () => {
      result.current.handleRemoveExistingImage('https://cdn.example.com/2.jpg')
    })
    expect(onUpdateRemovedImageIds).toHaveBeenCalledTimes(1)
    expect(onUpdateRemovedImageIds).toHaveBeenCalledWith(['eq-img-1', 'eq-img-2'])

    await rerender({ removedImageIds })

    await act(async () => {
      result.current.handleRemoveExistingImage('eq-img-2')
    })
    expect(onUpdateRemovedImageIds).toHaveBeenCalledTimes(1)
  })

  it('resets tracked IDs when starting a fresh edit session with empty removedImageIds', async () => {
    const onUpdateExistingImages = jest.fn()
    const onUpdateRemovedImageIds = jest.fn()

    const { result, rerender } = await renderHook(
      (props: { existingImages: any[]; removedImageIds: string[] }) =>
        useEquipmentFormLogic({
          images: [],
          existingImages: props.existingImages,
          removedImageIds: props.removedImageIds,
          features: [],
          onUpdateImages: jest.fn(),
          onUpdateExistingImages,
          onUpdateRemovedImageIds,
          onUpdateFeatures: jest.fn(),
        }),
      { initialProps: { existingImages: existing, removedImageIds: ['eq-img-1'] } }
    )

    // New edit session resets removedImageIds to a new empty array
    const nextListingImages = [{ id: 'eq-img-99', url: 'https://cdn.example.com/99.jpg' }]
    await rerender({ existingImages: nextListingImages, removedImageIds: [] })

    await act(async () => {
      result.current.handleRemoveExistingImage('eq-img-99')
    })

    expect(onUpdateRemovedImageIds).toHaveBeenLastCalledWith(['eq-img-99'])
  })
})
