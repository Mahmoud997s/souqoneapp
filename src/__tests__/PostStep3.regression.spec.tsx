import React from 'react'
import { render, screen } from '@testing-library/react-native'
import PostStep3Screen from '../../app/post/step3'
import { usePostStore } from '../store/postStore'
import { BusForm, ServiceForm } from '../components/post/forms'

jest.mock('../../src/components/post/forms/BusForm', () => ({
  BusForm: () => <></>,
}))

jest.mock('../../src/components/post/forms/ServiceForm', () => ({
  ServiceForm: () => <></>,
}))

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

  it('exports BusForm and ServiceForm cleanly from forms index', () => {
    expect(BusForm).toBeDefined()
    expect(ServiceForm).toBeDefined()
  })

  it('renders BusForm when category is buses', async () => {
    usePostStore.getState().set({ category: 'buses' })

    await render(<PostStep3Screen />)

    expect(screen.queryByText(/نموذج .* قيد التطوير/)).toBeNull()
  })

  it('renders ServiceForm when category is services', async () => {
    usePostStore.getState().set({ category: 'services' })

    await render(<PostStep3Screen />)

    expect(screen.queryByText(/نموذج .* قيد التطوير/)).toBeNull()
  })

  it('renders fallback development message for other categories like jobs', async () => {
    usePostStore.getState().set({ category: 'jobs' })

    await render(<PostStep3Screen />)

    expect(screen.getByText('نموذج jobs قيد التطوير')).toBeTruthy()
  })
})
