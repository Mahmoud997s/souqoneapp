import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { usePostStore } from '../../src/store/postStore'
import { navigateToCarForm, navigateToBusForm, navigateToPartForm, navigateToServiceForm, navigateToEquipmentForm, showDraftResumePrompt, hasMeaningfulPostData } from '../../src/components/ui/DraftResumePrompt'
import { POST_CATEGORIES } from '../../src/constants/postCategories'
import { PostCategorySheet } from '../../src/components/post/PostCategorySheet'

export default function PostCategoryModal() {
  const { set } = usePostStore()
  const insets = useSafeAreaInsets()

  const navigateToForm = (categoryId: string) => {
    if (categoryId === 'equipment') {
      router.replace('/equipment/new')
    } else if (categoryId === 'cars') {
      router.replace('/cars/new')
    } else if (categoryId === 'buses') {
      router.replace('/buses/new')
    } else if (categoryId === 'parts') {
      router.replace('/parts/new')
    } else if (categoryId === 'services') {
      router.replace('/services/new')

    } else {
      router.replace('/post/step2')
    }
  }

  const handleSelect = (categoryId: string) => {
    if (categoryId === 'equipment') {
      navigateToEquipmentForm('replace')
      return
    }

    if (categoryId === 'cars') {
      navigateToCarForm('replace')
      return
    }

    if (categoryId === 'buses') {
      navigateToBusForm('replace')
      return
    }

    if (categoryId === 'parts') {
      navigateToPartForm('replace')
      return
    }

    if (categoryId === 'services') {
      navigateToServiceForm('replace')
      return
    }

    const state = usePostStore.getState()
    
    if (state.category === categoryId && hasMeaningfulPostData(state)) {
      showDraftResumePrompt({
        onResume: () => {
          navigateToForm(categoryId)
        },
        onDiscard: () => {
          set({ category: categoryId }) // `set` uses `usePostStore` directly which is fine.
          usePostStore.getState().reset('draft') // force reset draft
          usePostStore.getState().set({ category: categoryId })
          navigateToForm(categoryId)
        }
      })
    } else {
      usePostStore.getState().reset('draft')
      usePostStore.getState().set({ category: categoryId })
      navigateToForm(categoryId)
    }
  }

  return (
    <PostCategorySheet
      categories={POST_CATEGORIES}
      topInset={insets.top}
      bottomInset={insets.bottom}
      onSelectCategory={handleSelect}
      onCancel={() => router.back()}
    />
  )
}
