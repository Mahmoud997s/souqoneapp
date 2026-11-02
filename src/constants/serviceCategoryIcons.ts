import type { ImageSourcePropType } from 'react-native'
import { PART_CATEGORY_ICONS } from './partCategoryIcons'
import { CATEGORY_ICONS } from './categoryIcons'

export type ServiceCategoryIconId =
  | 'MAINTENANCE'
  | 'CLEANING'
  | 'INSPECTION'
  | 'BODYWORK'
  | 'MODIFICATION'
  | 'TOWING'
  | 'KEYS_LOCKS'
  | 'ACCESSORIES_INSTALL'
  | 'all'

export const SERVICE_CATEGORY_ICONS: Record<
  ServiceCategoryIconId,
  ImageSourcePropType
> = {
  MAINTENANCE: require('../../assets/images/categories/services/service-maintenance.png'),
  CLEANING: require('../../assets/images/categories/services/service-cleaning.png'),
  INSPECTION: require('../../assets/images/categories/services/service-inspection.png'),
  BODYWORK: require('../../assets/images/categories/services/service-bodywork.png'),
  MODIFICATION: require('../../assets/images/categories/services/service-modification.png'),
  TOWING: require('../../assets/images/categories/services/service-towing.png'),
  KEYS_LOCKS: require('../../assets/images/categories/services/service-keys-locks.png'),
  ACCESSORIES_INSTALL: PART_CATEGORY_ICONS.ACCESSORIES,
  all: CATEGORY_ICONS.browse,
}
