import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('W2c Unified ImageViewerModal verification', () => {
  it('all active section detail screens use ImageViewerModal', () => {
    const screens = [
      'src/screens/cars/CarDetailScreen.tsx',
      'src/screens/buses/BusDetailScreen.tsx',
      'src/screens/equipment/EquipmentDetailScreen.tsx',
      'src/screens/operators/OperatorDetailScreen.tsx',
      'src/screens/parts/PartDetailScreen.tsx',
      'src/screens/services/ServiceDetailScreen.tsx',
    ]
    for (const screenPath of screens) {
      const content = readFileSync(resolve(__dirname, '../../../', screenPath), 'utf8')
      expect(content).toContain('ImageViewerModal')
    }
  })

  it('marks app/(modals)/image-viewer.tsx as deprecated', () => {
    const content = readFileSync(resolve(__dirname, '../../../app/(modals)/image-viewer.tsx'), 'utf8')
    expect(content).toContain('@deprecated')
  })
})
