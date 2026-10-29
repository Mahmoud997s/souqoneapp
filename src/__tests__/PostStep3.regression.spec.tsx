import React from 'react'
import { render, screen } from '@testing-library/react-native'
import PostStep3Screen from '../../app/post/step3'
import { usePostStore } from '../store/postStore'
import { router } from 'expo-router'

jest.mock('../../src/components/ui/AppHeader', () => ({
  AppHeader: ({ title }: any) => <></>,
}))

jest.mock('../../src/components/ui/Stepper', () => ({
  Stepper: () => <></>,
}))

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  },
}))

describe('PostStep3Screen Multi-Vertical Forms Regression Check', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    usePostStore.getState().reset()
  })

  it('redirects buses to dedicated /buses/new wizard', async () => {
    usePostStore.getState().set({ category: 'buses' })

    await render(<PostStep3Screen />)

    expect(router.replace).toHaveBeenCalledWith('/buses/new')
  })

  it('redirects other dedicated categories correctly', async () => {
    usePostStore.getState().set({ category: 'cars' })
    await render(<PostStep3Screen />)
    expect(router.replace).toHaveBeenCalledWith('/cars/new')

    jest.clearAllMocks()
    usePostStore.getState().set({ category: 'parts' })
    await render(<PostStep3Screen />)
    expect(router.replace).toHaveBeenCalledWith('/parts/new')

    jest.clearAllMocks()
    usePostStore.getState().set({ category: 'services' })
    await render(<PostStep3Screen />)
    expect(router.replace).toHaveBeenCalledWith('/services/new')
  })

  it('redirects stale draft with category jobs to /(tabs)', async () => {
    usePostStore.getState().set({ category: 'jobs' })

    const { queryByText } = await render(<PostStep3Screen />)

    expect(queryByText('نموذج jobs قيد التطوير')).toBeNull()
    expect(router.replace).toHaveBeenCalledWith('/(tabs)')
  })

  it('redirects stale draft with category transport to /(tabs)', async () => {
    usePostStore.getState().set({ category: 'transport' })

    await render(<PostStep3Screen />)

    expect(router.replace).toHaveBeenCalledWith('/(tabs)')
  })
})
