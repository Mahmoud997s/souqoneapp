import { MaterialCommunityIcons } from '@expo/vector-icons'
import { MyListingEntityType } from '../../../types/my-listings.types'

export interface ListingSectionConfig {
  entityType: MyListingEntityType
  title: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  categoryId: string
}

export const MY_LISTINGS_SECTIONS_CONFIG: readonly ListingSectionConfig[] = [
  {
    entityType: 'car',
    title: 'إعلانات السيارات',
    icon: 'car-sports',
    categoryId: 'cars',
  },
  {
    entityType: 'bus',
    title: 'إعلانات الحافلات',
    icon: 'bus',
    categoryId: 'buses',
  },
  {
    entityType: 'equipment',
    title: 'المعدات الثقيلة',
    icon: 'wrench',
    categoryId: 'equipment',
  },
  {
    entityType: 'part',
    title: 'قطع الغيار',
    icon: 'cog',
    categoryId: 'parts',
  },
  {
    entityType: 'service',
    title: 'خدمات المركبات',
    icon: 'construct' as keyof typeof MaterialCommunityIcons.glyphMap,
    categoryId: 'services',
  },
] as const
