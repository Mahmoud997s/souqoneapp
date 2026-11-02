import { Dimensions, type ImageSourcePropType } from 'react-native'
import { CATEGORY_ICONS, type CategoryVertical } from '../../constants/categoryIcons'
import { Colors } from '../../constants/colors'
import { CARS_PEEK_WIDTH_RATIO } from '../../constants/peekCarousel'
import { Radius } from '../../constants/radius'

export interface HomeHowItWorksStepContent {
  id: string
  number: number
  icon: 'search' | 'chatbubble-ellipses' | 'add-circle'
  title: string
  description: string
}

export interface HomeListingCategory {
  id: Extract<CategoryVertical, 'cars' | 'buses' | 'equipment' | 'services' | 'parts'>
  title: string
  image: ImageSourcePropType
}

export const HOME_HOW_IT_WORKS_STEPS: readonly HomeHowItWorksStepContent[] = [
  {
    id: 'discover',
    number: 1,
    icon: 'search',
    title: 'تصفّح واكتشف',
    description: 'تصفّح السيارات والحافلات والمعدات وقطع الغيار والخدمات في مكان واحد.',
  },
  {
    id: 'connect',
    number: 2,
    icon: 'chatbubble-ellipses',
    title: 'تواصل مباشرة',
    description: 'كلّم البائع أو مقدّم الخدمة بالمحادثة أو الاتصال من غير وسيط.',
  },
  {
    id: 'publish',
    number: 3,
    icon: 'add-circle',
    title: 'انشر إعلانك',
    description: 'أضف إعلانك في دقائق وخلّي المشترين يوصلولك.',
  },
]

export const HOME_LISTING_CATEGORIES: readonly HomeListingCategory[] = [
  { id: 'cars', title: 'سيارات', image: CATEGORY_ICONS.cars },
  { id: 'buses', title: 'حافلات', image: CATEGORY_ICONS.buses },
  { id: 'equipment', title: 'معدات', image: CATEGORY_ICONS.equipment },
  { id: 'services', title: 'خدمات', image: CATEGORY_ICONS.services },
  { id: 'parts', title: 'قطع غيار', image: CATEGORY_ICONS.parts },
]

export const HOME_BOTTOM_TOKENS = {
  cardRadius: Radius.lg,
  glassWashColor: Colors.paleMint,
  glassWashOpacity: 0.18,
  howItWorksWidthRatio: CARS_PEEK_WIDTH_RATIO,
  categoryImageSize: 36,
  categoryLabelLines: 1,
  titleLines: 2,
  descriptionLines: 2,
  stepIconSize: 20,
  stepIconBox: 44,
  stepBadgeSize: 18,
  badgeOffset: -4,
  headerFontSize: 16,
  headerLineHeight: 23,
  subtitleFontSize: 12,
  subtitleLineHeight: 17,
  stepTitleFontSize: 13,
  stepTitleLineHeight: 19,
  stepDescriptionFontSize: 11,
  stepDescriptionLineHeight: 16,
  stepNumberFontSize: 10,
  stepNumberLineHeight: 14,
  bannerTitleFontSize: 15,
  bannerTitleLineHeight: 22,
  bannerSubtitleFontSize: 11,
  bannerSubtitleLineHeight: 16,
  categoryLabelFontSize: 9,
  categoryLabelLineHeight: 13,
  buttonFontSize: 13,
  buttonLineHeight: 19,
} as const

export const getHomeHowItWorksWidth = (screenWidth = Dimensions.get('window').width): number =>
  Math.round(screenWidth * HOME_BOTTOM_TOKENS.howItWorksWidthRatio)
