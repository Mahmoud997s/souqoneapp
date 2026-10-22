import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { OperatorCertificationsCard } from './OperatorCertificationsCard'
import type {
  OperatorCertificationItem,
  OperatorEquipmentTypeChip,
} from '../../../types/operatorDetailViewModel.types'

describe('OperatorCertificationsCard', () => {
  const sampleEquipment: OperatorEquipmentTypeChip[] = [
    { value: 'CRANE', label: 'رافعة' },
    { value: 'EXCAVATOR', label: 'حفار' },
  ]

  const sampleCerts: OperatorCertificationItem[] = [
    { key: 'cert-1', label: 'شهادة أمان مهني', isDocument: false },
    {
      key: 'cert-doc-2',
      label: 'رخصة تشغيل معتمدة',
      imageUrl: 'https://example.com/license.jpg',
      isDocument: true,
    },
  ]

  const sampleSpecs = ['حفريات عميقة', 'تشغيل ليلي']

  it('renders all sections when data is present', async () => {
    await render(
      <OperatorCertificationsCard
        equipmentTypes={sampleEquipment}
        certifications={sampleCerts}
        specializations={sampleSpecs}
      />
    )

    expect(screen.getByTestId('operator-certifications-card')).toBeTruthy()
    expect(screen.getByTestId('operator-equipment-types-section')).toBeTruthy()
    expect(screen.getByTestId('operator-specializations-section')).toBeTruthy()
    expect(screen.getByTestId('operator-certs-section')).toBeTruthy()
    expect(screen.getByText('رافعة')).toBeTruthy()
    expect(screen.getByText('حفار')).toBeTruthy()
    expect(screen.getByText('حفريات عميقة')).toBeTruthy()
    expect(screen.getByText('شهادة أمان مهني')).toBeTruthy()
    expect(screen.getByText('رخصة تشغيل معتمدة')).toBeTruthy()
  })

  it('triggers onPressCertificate when tapping a document item', async () => {
    const onPressCert = jest.fn()
    await render(
      <OperatorCertificationsCard
        certifications={sampleCerts}
        onPressCertificate={onPressCert}
      />
    )

    const docButton = screen.getByTestId('operator-cert-doc-cert-doc-2')
    fireEvent.press(docButton)

    expect(onPressCert).toHaveBeenCalledWith('https://example.com/license.jpg')
  })

  it('returns null when all sections are empty', async () => {
    await render(
      <OperatorCertificationsCard
        equipmentTypes={[]}
        certifications={[]}
        specializations={[]}
      />
    )

    expect(screen.queryByTestId('operator-certifications-card')).toBeNull()
  })
})
