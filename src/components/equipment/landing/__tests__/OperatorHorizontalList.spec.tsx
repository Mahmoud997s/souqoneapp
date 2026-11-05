import React from 'react'
import * as fs from 'fs'
import * as path from 'path'
import { render, fireEvent } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OperatorHorizontalList } from '../OperatorHorizontalList'

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  router: { push: jest.fn(), back: jest.fn() },
}))

jest.mock('../../../cards/OperatorCard', () => ({
  OperatorCard: ({ item }: { item: any }) => {
    const { Text, View } = require('react-native')
    return (
      <View testID={`operator-card-${item.id}`}>
        <Text>{item.title}</Text>
      </View>
    )
  },
}))

async function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return await render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('OperatorHorizontalList (D-225)', () => {
  const FAKE_OPERATOR_TITLES = [
    'مشغل بلدوزر وجرافة',
    'فني صيانة مولدات كهربائية',
    'فني صيانة معدات هيدروليك',
    'مشغل رافعة برجية معتمد',
  ]

  it('renders existing empty state when data is empty and NEVER renders fake operators', async () => {
    const { getByTestId, queryByText, getByText } = await renderWithClient(
      <OperatorHorizontalList
        title="أمهر المشغلين"
        data={[]}
        isLoading={false}
        emptyText="لا يوجد مشغلين مسجلين حالياً"
        onSeeAll={jest.fn()}
        onPressItem={jest.fn()}
      />
    )

    // Existing empty state must be rendered
    expect(getByTestId('operator-list-empty-state')).toBeTruthy()
    expect(getByText('لا يوجد مشغلين مسجلين حالياً')).toBeTruthy()

    // None of the removed mock operator titles must ever be rendered
    for (const fakeTitle of FAKE_OPERATOR_TITLES) {
      expect(queryByText(fakeTitle)).toBeNull()
    }
  })

  it('renders existing list error state with retry action when request fails and NEVER renders fake operators', async () => {
    const onRetryMock = jest.fn()
    const { getByTestId, queryByText, getByText } = await renderWithClient(
      <OperatorHorizontalList
        title="أمهر المشغلين"
        data={[]}
        isLoading={false}
        isError={true}
        error={new Error('Network failure')}
        onRetry={onRetryMock}
        emptyText="لا يوجد مشغلين مسجلين حالياً"
        onSeeAll={jest.fn()}
        onPressItem={jest.fn()}
      />
    )

    // List error state must be rendered
    expect(getByTestId('operator-list-error-state')).toBeTruthy()
    expect(getByText('تعذر تحميل المشغلين')).toBeTruthy()

    // Retry action is functional
    const retryBtn = getByText('إعادة المحاولة')
    expect(retryBtn).toBeTruthy()
    fireEvent.press(retryBtn)
    expect(onRetryMock).toHaveBeenCalledTimes(1)

    // No fake operators
    for (const fakeTitle of FAKE_OPERATOR_TITLES) {
      expect(queryByText(fakeTitle)).toBeNull()
    }
  })

  it('renders real operators data when items are available', async () => {
    const realOperators = [
      { id: 'real-op-1', title: 'مشغل كرين محترف معتمد' },
      { id: 'real-op-2', title: 'سائق شاحنة ثقيلة' },
    ]

    const { getByTestId, getByText } = await renderWithClient(
      <OperatorHorizontalList
        title="أمهر المشغلين"
        data={realOperators}
        isLoading={false}
        emptyText="لا يوجد مشغلين مسجلين حالياً"
        onSeeAll={jest.fn()}
        onPressItem={jest.fn()}
      />
    )

    expect(getByTestId('operator-card-real-op-1')).toBeTruthy()
    expect(getByText('مشغل كرين محترف معتمد')).toBeTruthy()
    expect(getByTestId('operator-card-real-op-2')).toBeTruthy()
    expect(getByText('سائق شاحنة ثقيلة')).toBeTruthy()
  })

  it('contract check: verifies MOCK_OPERATORS was eradicated from app/equipment/index.tsx', () => {
    const screenPath = path.resolve(__dirname, '../../../../../app/equipment/index.tsx')
    const fileContent = fs.readFileSync(screenPath, 'utf8')

    expect(fileContent.includes('MOCK_OPERATORS')).toBe(false)
    expect(fileContent.includes('const operators = fetchedOperators')).toBe(true)
  })
})
