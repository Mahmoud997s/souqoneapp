import React from 'react'
import { render, fireEvent, cleanup, act } from '@testing-library/react-native'
import { CategoriesGrid } from '../components/cars/CategoriesGrid'
import { BusCategoriesGrid } from '../components/buses/landing/BusCategoriesGrid'
import { EquipmentCategoriesGrid } from '../components/equipment/landing/EquipmentCategoriesGrid'
import { PartsCategoriesGrid } from '../components/parts/PartsCategoriesGrid'
import { ServicesCategoriesGrid } from '../components/services/ServicesCategoriesGrid'

const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('Section Grids Order — New Before Used (D-144)', () => {
  afterEach(async () => {
    await act(async () => {
      cleanup()
    })
    jest.clearAllMocks()
  })

  describe('1. Cars CategoriesGrid', () => {
    it('renders "new" before "used" in exact sequence: جديدة, مستعملة, تأجير, مطلوب', async () => {
      const { getAllByText } = await render(<CategoriesGrid />)

      const arabicLabels = getAllByText(/[\u0600-\u06FF]/).map((node) => node.props.children)
      expect(arabicLabels).toEqual(['جديدة', 'مستعملة', 'تأجير', 'مطلوب'])
    })

    it('navigates to exact routes when each car category tile is pressed', async () => {
      const { getByText } = await render(<CategoriesGrid />)

      // 1. جديدة -> /cars/browse?type=new
      await act(async () => {
        fireEvent.press(getByText('جديدة'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/cars/browse?type=new')

      // 2. مستعملة -> /cars/browse?type=used
      await act(async () => {
        fireEvent.press(getByText('مستعملة'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/cars/browse?type=used')

      // 3. تأجير -> /cars/browse?type=rental
      await act(async () => {
        fireEvent.press(getByText('تأجير'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/cars/browse?type=rental')

      // 4. مطلوب -> /cars/browse?type=wanted
      await act(async () => {
        fireEvent.press(getByText('مطلوب'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/cars/browse?type=wanted')
    })
  })

  describe('2. Buses Landing BusCategoriesGrid', () => {
    it('renders "new" before "used" in exact sequence: جديدة, مستعملة, بيع بعقد, تأجير, مطلوب', async () => {
      const { getAllByText } = await render(<BusCategoriesGrid />)

      const arabicLabels = getAllByText(/[\u0600-\u06FF]/).map((node) => node.props.children)
      expect(arabicLabels).toEqual(['جديدة', 'مستعملة', 'بيع بعقد', 'تأجير', 'مطلوب'])
    })

    it('navigates to exact routes when each bus category tile is pressed', async () => {
      const { getByText } = await render(<BusCategoriesGrid />)

      // 1. جديدة -> /buses/browse?condition=NEW
      await act(async () => {
        fireEvent.press(getByText('جديدة'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/buses/browse?condition=NEW')

      // 2. مستعملة -> /buses/browse?condition=USED
      await act(async () => {
        fireEvent.press(getByText('مستعملة'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/buses/browse?condition=USED')

      // 3. بيع بعقد -> /buses/browse?busListingType=BUS_SALE_WITH_CONTRACT
      await act(async () => {
        fireEvent.press(getByText('بيع بعقد'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/buses/browse?busListingType=BUS_SALE_WITH_CONTRACT')

      // 4. تأجير -> /buses/browse?busListingType=BUS_RENT
      await act(async () => {
        fireEvent.press(getByText('تأجير'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/buses/browse?busListingType=BUS_RENT')

      // 5. مطلوب -> /buses/browse?type=wanted
      await act(async () => {
        fireEvent.press(getByText('مطلوب'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/buses/browse?type=wanted')
    })
  })

  describe('3. Equipment Landing EquipmentCategoriesGrid', () => {
    it('renders "new" before "used" in exact sequence: جديدة, مستعملة, للبيع, للإيجار, المشغلين', async () => {
      const { getAllByText } = await render(<EquipmentCategoriesGrid />)

      const arabicLabels = getAllByText(/[\u0600-\u06FF]/).map((node) => node.props.children)
      expect(arabicLabels).toEqual(['جديدة', 'مستعملة', 'للبيع', 'للإيجار', 'المشغلين'])
    })

    it('navigates to exact routes when each equipment category tile is pressed', async () => {
      const { getByText } = await render(<EquipmentCategoriesGrid />)

      // 1. جديدة -> /equipment/browse?type=new
      await act(async () => {
        fireEvent.press(getByText('جديدة'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/equipment/browse?type=new')

      // 2. مستعملة -> /equipment/browse?type=used
      await act(async () => {
        fireEvent.press(getByText('مستعملة'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/equipment/browse?type=used')

      // 3. للبيع -> /equipment/browse?type=sale
      await act(async () => {
        fireEvent.press(getByText('للبيع'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/equipment/browse?type=sale')

      // 4. للإيجار -> /equipment/browse?type=rental
      await act(async () => {
        fireEvent.press(getByText('للإيجار'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/equipment/browse?type=rental')

      // 5. المشغلين -> /equipment/operators/browse
      await act(async () => {
        fireEvent.press(getByText('المشغلين'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/equipment/operators/browse')
    })
  })

  describe('4. Parts Landing PartsCategoriesGrid', () => {
    it('renders all canonical parts categories + all in exact sequence', async () => {
      const { getAllByText } = await render(<PartsCategoriesGrid />)

      const arabicLabels = getAllByText(/[\u0600-\u06FF]/).map((node) => node.props.children)
      expect(arabicLabels).toEqual([
        'محرك وملحقاته',
        'الهيكل والبودي',
        'كهرباء وإلكترونيات',
        'مساعدات ونظام تعليق',
        'فرامل ومكابح',
        'مقصورة وداخلية',
        'إطارات وجنوط',
        'بطاريات',
        'زيوت وفلاتر',
        'إكسسوارات وزينة',
        'أخرى',
        'عرض الكل',
      ])
    })

    it('navigates to exact routes when each parts category tile is pressed', async () => {
      const { getByText } = await render(<PartsCategoriesGrid />)

      // 1. محرك وملحقاته
      await act(async () => {
        fireEvent.press(getByText('محرك وملحقاته'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse?category=ENGINE')

      // 2. الهيكل والبودي
      await act(async () => {
        fireEvent.press(getByText('الهيكل والبودي'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse?category=BODY')

      // 3. كهرباء وإلكترونيات
      await act(async () => {
        fireEvent.press(getByText('كهرباء وإلكترونيات'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse?category=ELECTRICAL')

      // 4. مساعدات ونظام تعليق
      await act(async () => {
        fireEvent.press(getByText('مساعدات ونظام تعليق'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse?category=SUSPENSION')

      // 5. فرامل ومكابح
      await act(async () => {
        fireEvent.press(getByText('فرامل ومكابح'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse?category=BRAKES')

      // 6. مقصورة وداخلية
      await act(async () => {
        fireEvent.press(getByText('مقصورة وداخلية'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse?category=INTERIOR')

      // 7. إطارات وجنوط
      await act(async () => {
        fireEvent.press(getByText('إطارات وجنوط'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse?category=TIRES')

      // 8. بطاريات
      await act(async () => {
        fireEvent.press(getByText('بطاريات'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse?category=BATTERIES')

      // 9. زيوت وفلاتر
      await act(async () => {
        fireEvent.press(getByText('زيوت وفلاتر'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse?category=OILS')

      // 10. إكسسوارات وزينة
      await act(async () => {
        fireEvent.press(getByText('إكسسوارات وزينة'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse?category=ACCESSORIES')

      // 11. أخرى
      await act(async () => {
        fireEvent.press(getByText('أخرى'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse?category=OTHER')

      // 12. عرض الكل
      await act(async () => {
        fireEvent.press(getByText('عرض الكل'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse')
    })
  })

  describe('5. Services Landing ServicesCategoriesGrid', () => {
    it('renders all canonical services categories + all in exact sequence', async () => {
      const { getAllByText } = await render(<ServicesCategoriesGrid />)

      const arabicLabels = getAllByText(/[\u0600-\u06FF]/).map((node) => node.props.children)
      expect(arabicLabels).toEqual([
        'صيانة وميكانيكا',
        'غسيل وتلميع ونانو',
        'تعديل وتزويد',
        'فحص وبرمجة كمبيوتر',
        'سمكرة ودهان وتعديل صدمات',
        'تركيب شاشات وإكسسوارات',
        'قص وبرمجة مفاتيح',
        'سطحات ونقل سيارات',
        'خدمات أخرى',
        'عرض الكل',
      ])
    })

    it('navigates to exact routes when each service category tile is pressed', async () => {
      const { getByText } = await render(<ServicesCategoriesGrid />)

      // 1. صيانة وميكانيكا
      await act(async () => {
        fireEvent.press(getByText('صيانة وميكانيكا'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/services/browse?serviceType=MAINTENANCE')

      // 2. غسيل وتلميع ونانو
      await act(async () => {
        fireEvent.press(getByText('غسيل وتلميع ونانو'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/services/browse?serviceType=CLEANING')

      // 3. تعديل وتزويد
      await act(async () => {
        fireEvent.press(getByText('تعديل وتزويد'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/services/browse?serviceType=MODIFICATION')

      // 4. فحص وبرمجة كمبيوتر
      await act(async () => {
        fireEvent.press(getByText('فحص وبرمجة كمبيوتر'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/services/browse?serviceType=INSPECTION')

      // 5. سمكرة ودهان وتعديل صدمات
      await act(async () => {
        fireEvent.press(getByText('سمكرة ودهان وتعديل صدمات'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/services/browse?serviceType=BODYWORK')

      // 6. تركيب شاشات وإكسسوارات
      await act(async () => {
        fireEvent.press(getByText('تركيب شاشات وإكسسوارات'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/services/browse?serviceType=ACCESSORIES_INSTALL')

      // 7. قص وبرمجة مفاتيح
      await act(async () => {
        fireEvent.press(getByText('قص وبرمجة مفاتيح'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/services/browse?serviceType=KEYS_LOCKS')

      // 8. سطحات ونقل سيارات
      await act(async () => {
        fireEvent.press(getByText('سطحات ونقل سيارات'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/services/browse?serviceType=TOWING')

      // 9. خدمات أخرى
      await act(async () => {
        fireEvent.press(getByText('خدمات أخرى'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/services/browse?serviceType=OTHER_SERVICE')

      // 10. عرض الكل
      await act(async () => {
        fireEvent.press(getByText('عرض الكل'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/services/browse')
    })
  })
})
