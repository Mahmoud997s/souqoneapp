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
    it('renders 11 parts categories in exact sequence', async () => {
      const { getAllByText } = await render(<PartsCategoriesGrid />)

      const arabicLabels = getAllByText(/[\u0600-\u06FF]/).map((node) => node.props.children)
      expect(arabicLabels).toEqual([
        'المحرك',
        'الهيكل',
        'الكهرباء',
        'المساعدات والتعليق',
        'الفرامل',
        'الداخلية',
        'الإطارات',
        'البطاريات',
        'الزيوت',
        'إكسسوارات',
        'عرض الكل',
      ])
    })

    it('navigates to exact routes when each parts category tile is pressed', async () => {
      const { getByText } = await render(<PartsCategoriesGrid />)

      // 1. المحرك
      await act(async () => {
        fireEvent.press(getByText('المحرك'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse?category=ENGINE')

      // 2. الهيكل
      await act(async () => {
        fireEvent.press(getByText('الهيكل'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse?category=BODY')

      // 3. الكهرباء
      await act(async () => {
        fireEvent.press(getByText('الكهرباء'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse?category=ELECTRICAL')

      // 4. المساعدات والتعليق
      await act(async () => {
        fireEvent.press(getByText('المساعدات والتعليق'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse?category=SUSPENSION')

      // 5. الفرامل
      await act(async () => {
        fireEvent.press(getByText('الفرامل'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse?category=BRAKES')

      // 6. الداخلية
      await act(async () => {
        fireEvent.press(getByText('الداخلية'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse?category=INTERIOR')

      // 7. الإطارات
      await act(async () => {
        fireEvent.press(getByText('الإطارات'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse?category=TIRES')

      // 8. البطاريات
      await act(async () => {
        fireEvent.press(getByText('البطاريات'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse?category=BATTERIES')

      // 9. الزيوت
      await act(async () => {
        fireEvent.press(getByText('الزيوت'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse?category=OILS')

      // 10. إكسسوارات
      await act(async () => {
        fireEvent.press(getByText('إكسسوارات'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse?category=ACCESSORIES')

      // 11. عرض الكل
      await act(async () => {
        fireEvent.press(getByText('عرض الكل'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/parts/browse')
    })
  })

  describe('5. Services Landing ServicesCategoriesGrid', () => {
    it('renders 9 services categories in exact sequence', async () => {
      const { getAllByText } = await render(<ServicesCategoriesGrid />)

      const arabicLabels = getAllByText(/[\u0600-\u06FF]/).map((node) => node.props.children)
      expect(arabicLabels).toEqual([
        'صيانة',
        'غسيل وتلميع',
        'فحص',
        'سمكرة وصبغ',
        'تعديل',
        'ونش وإنقاذ',
        'مفاتيح',
        'إكسسوارات',
        'عرض الكل',
      ])
    })

    it('navigates to exact routes when each service category tile is pressed', async () => {
      const { getByText } = await render(<ServicesCategoriesGrid />)

      // 1. صيانة
      await act(async () => {
        fireEvent.press(getByText('صيانة'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/services/browse?serviceType=MAINTENANCE')

      // 2. غسيل وتلميع
      await act(async () => {
        fireEvent.press(getByText('غسيل وتلميع'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/services/browse?serviceType=CLEANING')

      // 3. فحص
      await act(async () => {
        fireEvent.press(getByText('فحص'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/services/browse?serviceType=INSPECTION')

      // 4. سمكرة وصبغ
      await act(async () => {
        fireEvent.press(getByText('سمكرة وصبغ'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/services/browse?serviceType=BODYWORK')

      // 5. تعديل
      await act(async () => {
        fireEvent.press(getByText('تعديل'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/services/browse?serviceType=MODIFICATION')

      // 6. ونش وإنقاذ
      await act(async () => {
        fireEvent.press(getByText('ونش وإنقاذ'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/services/browse?serviceType=TOWING')

      // 7. مفاتيح
      await act(async () => {
        fireEvent.press(getByText('مفاتيح'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/services/browse?serviceType=KEYS_LOCKS')

      // 8. إكسسوارات
      await act(async () => {
        fireEvent.press(getByText('إكسسوارات'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/services/browse?serviceType=ACCESSORIES_INSTALL')

      // 9. عرض الكل
      await act(async () => {
        fireEvent.press(getByText('عرض الكل'))
      })
      expect(mockPush).toHaveBeenLastCalledWith('/services/browse')
    })
  })
})
