import React from 'react'
import fs from 'fs'
import path from 'path'
import TestRenderer, { act } from 'react-test-renderer'
import { BrowseHeader } from './BrowseHeader'

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))
jest.mock('./AppHeader', () => ({
  AppHeader: ({ centerSlot, rightSlot }: { centerSlot: React.ReactNode; rightSlot: React.ReactNode }) => (
    <>{centerSlot}{rightSlot}</>
  ),
}))
jest.mock('./TopBarGlassSurface', () => ({ TopBarGlassSurface: 'TopBarGlassSurface' }))

const routes = [
  '../../../app/cars/browse.tsx',
  '../../../app/buses/browse.tsx',
  '../../../app/equipment/browse.tsx',
  '../../../app/equipment/operators/browse.tsx',
  '../../../app/parts/browse.tsx',
  '../../../app/services/browse.tsx',
]

describe('browse route header smoke coverage', () => {
  test.each(routes)('%s wires and renders the shared BrowseHeader', (routePath) => {
    const source = fs.readFileSync(path.join(__dirname, routePath), 'utf8')
    expect(source).toContain('<BrowseHeader')
    expect(source.indexOf('<BrowseHeader')).toBeLessThan(source.indexOf('<CollapsibleSubHeader'))

    let renderer: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(
        <BrowseHeader
          searchQuery=""
          onSearchChange={jest.fn()}
          activeFiltersCount={0}
          onFilterPress={jest.fn()}
        />
      )
    })

    expect(renderer!.toJSON()).toBeTruthy()
  })
})
