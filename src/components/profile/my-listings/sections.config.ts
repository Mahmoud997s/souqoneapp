import { Ionicons } from '@expo/vector-icons'
import { MyListingEntityType } from '../../../types/my-listings.types'

export interface ListingSectionConfig {
  entityType: MyListingEntityType
  title: string
  icon: keyof typeof Ionicons.glyphMap
  gradient: readonly [string, string]
  categoryId: string
}

export const MY_LISTINGS_SECTIONS_CONFIG: readonly ListingSectionConfig[] = [
  {
    entityType: 'car',
    title: 'إعلانات السيارات',
    icon: 'car-sport',
    gradient: ['#009CB5', '#009CB5'],
    categoryId: 'cars',
  },
  {
    entityType: 'bus',
    title: 'إعلانات الحافلات',
    icon: 'bus',
    gradient: ['#F59E0B', '#FCD34D'],
    categoryId: 'buses',
  },
  {
    entityType: 'equipment',
    title: 'المعدات الثقيلة',
    icon: 'construct',
    gradient: ['#64748B', '#94A3B8'],
    categoryId: 'equipment',
  },
  {
    entityType: 'part',
    title: 'قطع الغيار',
    icon: 'settings',
    gradient: ['#8B5CF6', '#A78BFA'],
    categoryId: 'parts',
  },
  {
    entityType: 'service',
    title: 'خدمات المركبات',
    icon: 'build',
    gradient: ['#3B82F6', '#60A5FA'],
    categoryId: 'services',
  },
] as const
