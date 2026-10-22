import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { OperatorCardActions } from './OperatorCardActions'

describe('OperatorCardActions', () => {
  it('renders call button and calls onCall when pressed', async () => {
    const onCall = jest.fn()
    await render(
      <OperatorCardActions
        onCall={onCall}
        onWhatsApp={jest.fn()}
        isWhatsappEnabled={false}
      />
    )

    const callBtn = screen.getByLabelText('اتصال بالمشغل')
    expect(callBtn).toBeTruthy()
    fireEvent.press(callBtn)
    expect(onCall).toHaveBeenCalledTimes(1)
    expect(screen.queryByLabelText('تواصل عبر واتساب')).toBeNull()
  })

  it('renders whatsapp button and calls onWhatsApp when enabled', async () => {
    const onWhatsApp = jest.fn()
    await render(
      <OperatorCardActions
        onCall={jest.fn()}
        onWhatsApp={onWhatsApp}
        isWhatsappEnabled={true}
      />
    )

    const waBtn = screen.getByLabelText('تواصل عبر واتساب')
    expect(waBtn).toBeTruthy()
    fireEvent.press(waBtn)
    expect(onWhatsApp).toHaveBeenCalledTimes(1)
  })
})
