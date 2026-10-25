import { normalizeAndMerge } from './normalizeAndMerge'

describe('normalizeAndMerge — version propagation', () => {
  it('propagates raw version for car, bus, and equipment items', () => {
    const result = normalizeAndMerge({
      cars: [{ id: 'car-1', title: 'Car 1', status: 'ACTIVE', version: 4 }],
      buses: [{ id: 'bus-1', title: 'Bus 1', status: 'ACTIVE', version: 7 }],
      equipment: [{ id: 'eq-1', title: 'Eq 1', status: 'ACTIVE', version: 3 }],
    })

    const car = result.find((item) => item.id === 'car-1')
    const bus = result.find((item) => item.id === 'bus-1')
    const eq = result.find((item) => item.id === 'eq-1')

    expect(car?.version).toBe(4)
    expect(bus?.version).toBe(7)
    expect(eq?.version).toBe(3)
  })

  it('defaults version to 1 when raw car, bus, or equipment has no version', () => {
    const result = normalizeAndMerge({
      cars: [{ id: 'car-no-ver', title: 'Car', status: 'ACTIVE' }],
      buses: [{ id: 'bus-no-ver', title: 'Bus', status: 'ACTIVE' }],
      equipment: [{ id: 'eq-no-ver', title: 'Eq', status: 'ACTIVE' }],
    })

    expect(result.find((item) => item.id === 'car-no-ver')?.version).toBe(1)
    expect(result.find((item) => item.id === 'bus-no-ver')?.version).toBe(1)
    expect(result.find((item) => item.id === 'eq-no-ver')?.version).toBe(1)
  })
})
