import type { MaterialCommunityIcons } from '@expo/vector-icons'

export type PostCategoryId = 'cars' | 'buses' | 'equipment' | 'services' | 'parts'

export interface PostCategoryOption {
  id: PostCategoryId
  title: string
  description: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
}

export const POST_CATEGORIES: readonly PostCategoryOption[] = [
  {
    id: 'cars',
    title: 'سيارات ومركبات',
    description: 'بيع أو أجّر سيارتك',
    icon: 'car-sports',
  },
  {
    id: 'buses',
    title: 'حافلات',
    description: 'حافلات للبيع أو الإيجار',
    icon: 'bus-side',
  },
  {
    id: 'equipment',
    title: 'معدات',
    description: 'معدات ثقيلة وخفيفة',
    icon: 'excavator',
  },
  {
    id: 'services',
    title: 'خدمات',
    description: 'قدّم خدمتك',
    icon: 'car-wrench',
  },
  {
    id: 'parts',
    title: 'قطع غيار',
    description: 'قطع غيار جديدة ومستعملة',
    icon: 'car-cog',
  },
]
