import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { render, screen } from '@testing-library/react-native'
import { MyListingsAllView } from '../MyListingsAllView'

describe('MyListingsAllView — Empty & Error State Layout (D-155)', () => {
  const mockHandlers = {
    onRefresh: jest.fn(),
    onSelectCategory: jest.fn(),
    onView: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    isEditSupported: () => true,
    bottomInset: 20,
    topInset: 40,
  }

  const dummyHeader = (
    <View testID="mock-header">
      <Text>Header Filters</Text>
    </View>
  )

  it('renders header at top without vertical centering or container horizontal padding in empty state', async () => {
    const { getByTestId } = await render(
      <MyListingsAllView
        groupedSections={[]}
        isLoading={false}
        isRefreshing={false}
        header={dummyHeader}
        {...mockHandlers}
      />
    )

    // Header exists
    expect(getByTestId('mock-header')).toBeTruthy()

    // Empty state exists
    expect(getByTestId('my-listings-empty-state')).toBeTruthy()

    // Empty wrapper has flex: 1 and justifyContent: 'center'
    const wrapper = getByTestId('my-listings-empty-wrapper')
    const wrapperStyle = StyleSheet.flatten(wrapper.props.style)
    expect(wrapperStyle.flex).toBe(1)
    expect(wrapperStyle.justifyContent).toBe('center')

    // ScrollView contentContainerStyle does NOT have justifyContent: 'center' or paddingHorizontal
    const scroll = getByTestId('my-listings-empty-scroll')
    const scrollStyle = StyleSheet.flatten(scroll.props.contentContainerStyle)
    expect(scrollStyle.justifyContent).toBeUndefined()
    expect(scrollStyle.paddingHorizontal).toBeUndefined()
  })

  it('renders header at top without vertical centering in error state', async () => {
    const { getByTestId } = await render(
      <MyListingsAllView
        groupedSections={[]}
        isLoading={false}
        isError={true}
        error={new Error('Network failure')}
        isRefreshing={false}
        header={dummyHeader}
        {...mockHandlers}
      />
    )

    expect(getByTestId('mock-header')).toBeTruthy()
    expect(getByTestId('my-listings-error-state')).toBeTruthy()

    const wrapper = getByTestId('my-listings-empty-wrapper')
    const wrapperStyle = StyleSheet.flatten(wrapper.props.style)
    expect(wrapperStyle.flex).toBe(1)
    expect(wrapperStyle.justifyContent).toBe('center')

    const scroll = getByTestId('my-listings-empty-scroll')
    const scrollStyle = StyleSheet.flatten(scroll.props.contentContainerStyle)
    expect(scrollStyle.justifyContent).toBeUndefined()
    expect(scrollStyle.paddingHorizontal).toBeUndefined()
  })
})
