import React from 'react'
import { render } from '@testing-library/react-native'
import { Colors } from '../../constants/colors'
import { FilterGlassTokens } from '../../constants/filterGlassTokens'
import { VisualFiltersBase, VisualFilterTab } from '../../components/ui/VisualFiltersBase'
import { PartsVisualFilters } from '../../components/parts/PartsVisualFilters'
import { CarStep5Review } from '../../components/cars/wizard/CarStep5Review'
import { BusStep6Review } from '../../components/buses/wizard/BusStep6Review'
import { ServiceStep6Review } from '../../components/services/wizard/ServiceStep6Review'
import { ServicesFilterBottomSheet } from '../../components/services/ServicesFilterBottomSheet'

jest.mock('@expo/vector-icons', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    Ionicons: (props: any) => <Text testID={`ionicon-${props.name}`} {...props} />,
    MaterialCommunityIcons: (props: any) => <Text testID={`mci-${props.name}`} {...props} />,
  }
})

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: any) => <>{children}</>,
}))

jest.mock('expo-image', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Image: (props: any) => <View testID="expo-image" {...props} />,
  }
})

jest.mock('../../components/navigation/glassSupport', () => ({
  useGlassSupport: () => ({ canUseGlass: false, reason: 'test' }),
  GlassSurface: ({ children }: any) => <>{children}</>,
}))

describe('Wave 2a (2.4 / F-09): Unified Color Rules & Parts Icons', () => {
  it('FilterGlassTokens.tab active tab uses Colors.primary background and Colors.white text', () => {
    expect(FilterGlassTokens.tab.activeBg).toBe(Colors.primaryStrong)
    expect(FilterGlassTokens.tab.activeTextColor).toBe(Colors.white)
  })

  it('VisualFiltersBase renders active segmented tab (e.g. أفضل الماركات) with Colors.primary bg and #FFFFFF text', async () => {
    const tabs: VisualFilterTab[] = [
      { id: 'brands', label: 'أفضل الماركات', icon: 'ribbon-outline', items: [{ id: '1', label: 'تويوتا' }] },
      { id: 'models', label: 'الموديلات', icon: 'car-outline', items: [{ id: '2', label: 'كامري' }] },
    ]
    const { getByLabelText, getByText } = await render(
      <VisualFiltersBase tabs={tabs} defaultTab="brands" />
    )
    const { StyleSheet } = require('react-native')
    const activeTab = getByLabelText('أفضل الماركات')
    const flatTabStyle = StyleSheet.flatten(activeTab.props.style)
    expect(flatTabStyle.backgroundColor).toBe(Colors.primary)

    const activeLabel = getByText('أفضل الماركات')
    const flatTextStyle = StyleSheet.flatten(activeLabel.props.style)
    expect(flatTextStyle.color).toBe(Colors.white)
  })

  it('PartsVisualFilters renders all part category icons in Colors.primary (turquoise)', async () => {
    const { getByTestId } = await render(
      <PartsVisualFilters onSelectFilter={jest.fn()} onViewAll={jest.fn()} />
    )
    const engineIcon = getByTestId('mci-engine')
    const brakesIcon = getByTestId('mci-car-brake-alert')
    expect(engineIcon.props.color).toBe(Colors.primary)
    expect(brakesIcon.props.color).toBe(Colors.primary)
  })

  it('Wizard review screens unify listing type badge and price color to Colors.primary and BusStep6Review uses "بيع مع عقد"', async () => {
    const carRes = await render(
      <CarStep5Review
        formData={{
          listingType: 'SALE',
          brandName: 'تويوتا',
          modelName: 'كامري',
          year: '2022',
          price: '6500',
          isPriceNegotiable: true,
          governorateName: 'مسقط',
          wilayaName: 'السيب',
          images: [],
          existingImages: [],
          features: [],
        } as any}
        onEditStep={jest.fn()}
      />
    )
    const priceNode = carRes.getByText(/6,500/)
    const priceStyle = Object.assign({}, ...(Array.isArray(priceNode.props.style) ? priceNode.props.style : [priceNode.props.style]).filter(Boolean))
    expect(priceStyle.color).toBe(Colors.primary)

    const busRes = await render(
      <BusStep6Review
        data={{
          busListingType: 'BUS_SALE_WITH_CONTRACT',
          busType: 'COASTER',
          make: 'Toyota',
          model: 'Coaster',
          year: '2022',
          capacity: '30',
          condition: 'USED',
          transmission: 'MANUAL',
          fuelType: 'DIESEL',
          features: [],
          price: '12000',
          currency: 'OMR',
          isPriceNegotiable: false,
          title: 'حافلة مع عقد',
          description: 'وصف',
          governorateNameAr: 'مسقط',
          wilayaNameAr: 'السيب',
          images: [],
          existingImages: [],
        } as any}
        onEditStep={jest.fn()}
      />
    )
    expect(busRes.getByText('بيع مع عقد')).toBeTruthy()

    const svcRes = await render(
      <ServiceStep6Review
        formData={{
          title: 'ورشة',
          description: 'صيانة',
          serviceType: 'MAINTENANCE',
          providerType: 'WORKSHOP',
          providerName: 'الأمان',
          priceFrom: 15,
          images: [],
          existingImages: [],
        } as any}
        onEditStep={jest.fn()}
      />
    )
    const svcPrice = svcRes.getByTestId('price-display-txt')
    const svcPriceStyle = Object.assign({}, ...(Array.isArray(svcPrice.props.style) ? svcPrice.props.style : [svcPrice.props.style]).filter(Boolean))
    expect(svcPriceStyle.color).toBe(Colors.primary)
  })

  it('ServicesFilterBottomSheet uses Colors.primary for all Switch trackColor.true values', async () => {
    const { toJSON } = await render(
      <ServicesFilterBottomSheet
        visible={true}
        onClose={jest.fn()}
        initialFilters={{}}
        onApplyFilters={jest.fn()}
      />
    )
    const tree = toJSON()
    const switches: Array<{ type?: string; props?: { trackColor?: { true?: string }; onTintColor?: string } }> = []
    const walk = (node: unknown) => {
      if (!node || typeof node !== 'object') return
      if (Array.isArray(node)) {
        node.forEach(walk)
        return
      }
      const el = node as { type?: string; props?: { trackColor?: { true?: string }; onTintColor?: string }; children?: unknown[] }
      if (el.type === 'RCTSwitch' || el.type === 'Switch' || el.props?.trackColor !== undefined) {
        switches.push(el)
      }
      if (el.children) walk(el.children)
    }
    walk(tree)
    expect(switches.length).toBeGreaterThanOrEqual(2)
    for (const sw of switches) {
      expect(sw.props?.trackColor?.true ?? sw.props?.onTintColor).toBe(Colors.primary)
    }
  })
})
