import type { ImageSourcePropType } from 'react-native'

export type CategoryVertical = 'cars' | 'services' | 'parts' | 'equipment' | 'buses' | 'operators' | 'browse'

export const CATEGORY_ICONS: Record<CategoryVertical, ImageSourcePropType> = {
  cars: require('../../assets/images/categories/cat-cars.png'),
  services: require('../../assets/images/categories/cat-services.png'),
  parts: require('../../assets/images/categories/cat-parts.png'),
  equipment: require('../../assets/images/categories/cat-equipment.png'),
  buses: require('../../assets/images/categories/cat-buses.png'),
  operators: require('../../assets/images/categories/cat-operators.png'),
  browse: require('../../assets/images/categories/cat-browse.png'),
} as const
