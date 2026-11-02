import type { ImageSourcePropType } from 'react-native'
import { CATEGORY_ICONS } from './categoryIcons'

export type PostCategoryId = 'cars' | 'buses' | 'equipment' | 'services' | 'parts'

export interface PostCategoryOption {
  id: PostCategoryId
  title: string
  description: string
  icon: ImageSourcePropType
}

export const POST_CATEGORIES: readonly PostCategoryOption[] = [
  {
    id: 'cars',
    title: 'سيارات ومركبات',
    description: 'بيع أو أجّر سيارتك',
    icon: CATEGORY_ICONS.cars,
  },
  {
    id: 'buses',
    title: 'حافلات',
    description: 'حافلات للبيع أو الإيجار',
    icon: CATEGORY_ICONS.buses,
  },
  {
    id: 'equipment',
    title: 'معدات',
    description: 'معدات ثقيلة وخفيفة',
    icon: CATEGORY_ICONS.equipment,
  },
  {
    id: 'services',
    title: 'خدمات',
    description: 'قدّم خدمتك',
    icon: CATEGORY_ICONS.services,
  },
  {
    id: 'parts',
    title: 'قطع غيار',
    description: 'قطع غيار جديدة ومستعملة',
    icon: CATEGORY_ICONS.parts,
  },
]
