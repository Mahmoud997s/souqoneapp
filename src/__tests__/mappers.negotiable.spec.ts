import {
  mapListingToCard,
  mapBusToCard,
  mapEquipmentToCard,
  mapPartToCard,
} from '../utils/mappers'

describe('mappers isPriceNegotiable parity test suite', () => {
  it('mapListingToCard preserves isPriceNegotiable from direct field and raw', () => {
    const itemWithDirect = {
      id: 'car-1',
      title: 'تويوتا كامري 2022',
      price: 6500,
      isPriceNegotiable: true,
      listingType: 'SALE',
    }
    const card1 = mapListingToCard(itemWithDirect)
    expect(card1.isPriceNegotiable).toBe(true)

    const itemWithRaw = {
      id: 'car-2',
      title: 'هيونداي سوناتا',
      price: 5000,
      raw: { isPriceNegotiable: true },
      listingType: 'SALE',
    }
    const card2 = mapListingToCard(itemWithRaw)
    expect(card2.isPriceNegotiable).toBe(true)

    const itemNonNegotiable = {
      id: 'car-3',
      title: 'نيسان باترول',
      price: 15000,
      isPriceNegotiable: false,
    }
    const card3 = mapListingToCard(itemNonNegotiable)
    expect(card3.isPriceNegotiable).toBe(false)
  })

  it('mapBusToCard preserves isPriceNegotiable correctly', () => {
    const busItem = {
      id: 'bus-1',
      title: 'حافلة تويوتا كوستر 30 راكب',
      price: 12000,
      isPriceNegotiable: true,
      busListingType: 'BUS_SALE',
    }
    const card = mapBusToCard(busItem)
    expect(card.isPriceNegotiable).toBe(true)
  })

  it('mapEquipmentToCard preserves isPriceNegotiable correctly', () => {
    const equipItem = {
      id: 'equip-1',
      title: 'حفار كوماتسو PC200',
      price: 25000,
      isPriceNegotiable: true,
      listingType: 'EQUIPMENT_SALE',
    }
    const card = mapEquipmentToCard(equipItem)
    expect(card.isPriceNegotiable).toBe(true)
  })

  it('mapPartToCard preserves isPriceNegotiable correctly', () => {
    const partItem = {
      id: 'part-1',
      title: 'محرك لاندكروزر V8',
      price: 1800,
      isPriceNegotiable: true,
      condition: 'USED',
    }
    const card = mapPartToCard(partItem)
    expect(card.isPriceNegotiable).toBe(true)
  })
})
