import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { OperatorCertificationsList } from './OperatorCertificationsList'

describe('OperatorCertificationsList', () => {
  it('renders document thumbnail and triggers onPressCertificate when pressed', async () => {
    const onPressMock = jest.fn()
    await render(
      <OperatorCertificationsList
        certifications={[
          {
            key: 'c1',
            label: 'شهادة تشغيل',
            isDocument: true,
            imageUrl: 'https://example.com/cert.jpg',
          },
        ]}
        onPressCertificate={onPressMock}
      />
    )

    const docBtn = screen.getByTestId('operator-cert-doc-c1')
    expect(docBtn).toBeTruthy()
    fireEvent.press(docBtn)
    expect(onPressMock).toHaveBeenCalledWith('https://example.com/cert.jpg')
  })

  it('renders text certification ribbon item', async () => {
    await render(
      <OperatorCertificationsList
        certifications={[
          {
            key: 'c2',
            label: 'رخصة قيادة ثقيلة',
            isDocument: false,
          },
        ]}
      />
    )

    expect(screen.getByTestId('operator-cert-text-c2')).toBeTruthy()
    expect(screen.getByText('رخصة قيادة ثقيلة')).toBeTruthy()
  })
})
