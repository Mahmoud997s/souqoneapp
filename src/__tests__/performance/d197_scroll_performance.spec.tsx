import React from 'react'
import * as fs from 'fs'
import * as path from 'path'
import { render, cleanup } from '@testing-library/react-native'
import { BROWSE_LIST_VIRTUALIZATION_PROPS } from '../../constants/listVirtualization'
import { MyListingsCategoryView } from '../../components/profile/my-listings/MyListingsCategoryView'

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}))

const REPO_ROOT = path.resolve(__dirname, '../../..')

describe('D-197 Scroll Performance Safe Fixes', () => {
  afterEach(() => {
    cleanup()
  })

  describe('Item 3: List virtualization props on glass-bearing card lists', () => {
    it('defines tuned virtualization values minimizing mounted glass rows without removeClippedSubviews', () => {
      expect(BROWSE_LIST_VIRTUALIZATION_PROPS).toEqual({
        initialNumToRender: 4,
        maxToRenderPerBatch: 4,
        windowSize: 5,
        updateCellsBatchingPeriod: 50,
      })
      expect('removeClippedSubviews' in BROWSE_LIST_VIRTUALIZATION_PROPS).toBe(false)
    })

    it('passes BROWSE_LIST_VIRTUALIZATION_PROPS to rendered Animated.FlatList in MyListingsCategoryView', async () => {
      const { getByTestId } = await render(
        <MyListingsCategoryView
          data={[]}
          isLoading={false}
          isRefreshing={false}
          isFetchingNextPage={false}
          hasNextPage={false}
          fetchNextPage={jest.fn()}
          onRefresh={jest.fn()}
          onView={jest.fn()}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          isEditSupported={() => true}
          bottomInset={20}
          topInset={60}
        />
      )

      const flatList = getByTestId('my-listings-category-flat-list')
      expect(flatList.props.initialNumToRender).toBe(4)
      expect(flatList.props.maxToRenderPerBatch).toBe(4)
      expect(flatList.props.windowSize).toBe(5)
      expect(flatList.props.updateCellsBatchingPeriod).toBe(50)
      expect(flatList.props.removeClippedSubviews).toBe(false)
    })

    it.each([
      'app/cars/browse.tsx',
      'app/buses/browse.tsx',
      'app/equipment/browse.tsx',
      'app/equipment/operators/browse.tsx',
      'app/parts/browse.tsx',
      'app/services/browse.tsx',
      'app/profile/favorites.tsx',
      'src/components/profile/my-listings/MyListingsCategoryView.tsx',
    ])('wires BROWSE_LIST_VIRTUALIZATION_PROPS into %s without removeClippedSubviews', (relPath) => {
      const content = fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8')
      expect(content).toContain('BROWSE_LIST_VIRTUALIZATION_PROPS')
      expect(content).toMatch(/<Animated\.FlatList[\s\S]*?\.\.\.BROWSE_LIST_VIRTUALIZATION_PROPS/)
      expect(content).not.toMatch(/removeClippedSubviews\s*=\s*\{?\s*true/)
    })
  })
})
