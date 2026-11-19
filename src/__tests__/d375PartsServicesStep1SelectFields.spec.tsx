import React from 'react'
import fs from 'fs'
import path from 'path'
import { act, fireEvent, render } from '@testing-library/react-native'
import { PartStep1Category } from '../components/parts/wizard/PartStep1Category'
import { ServiceStep1Type } from '../components/services/wizard/ServiceStep1Type'
import { defaultPartFormData } from '../store/partWizardStore'
import { defaultServiceFormData } from '../store/serviceWizardStore'
import { SERVICE_TYPES } from '../constants/services'

describe('D-375: Parts & Services step 1 use glass WizardSelectField dropdowns', () => {
  it('PartStep1Category renders glass WizardSelectField for listingType & partCategory with options hidden until opened', async () => {
    const onUpdateField = jest.fn()
    const view = await render(
      <PartStep1Category
        formData={defaultPartFormData}
        errors={{
          listingType: 'اختر نوع الإعلان',
          partCategory: 'اختر فئة القطعة',
        }}
        onUpdateField={onUpdateField}
      />
    )

    expect(view.getByTestId('part-listing-type-select')).toBeTruthy()
    expect(view.getByTestId('part-listing-type-select-glass-layers')).toBeTruthy()
    expect(view.getByTestId('part-category-select')).toBeTruthy()
    expect(view.getByTestId('part-category-select-glass-layers')).toBeTruthy()

    expect(view.queryByTestId('listing-type-SPARE_PART_WANTED')).toBeNull()
    expect(view.queryByTestId('category-BRAKES')).toBeNull()

    expect(view.getByTestId('error-part-listing-type').props.children).toBe('اختر نوع الإعلان')
    expect(view.getByTestId('error-part-category').props.children).toBe('اختر فئة القطعة')

    await act(async () => {
      fireEvent.press(view.getByTestId('part-listing-type-select'))
    })
    expect(view.getByTestId('listing-type-SPARE_PART_SALE')).toBeTruthy()
    expect(view.getByTestId('listing-type-SPARE_PART_WANTED')).toBeTruthy()

    await act(async () => {
      fireEvent.press(view.getByTestId('listing-type-SPARE_PART_WANTED'))
    })
    expect(onUpdateField).toHaveBeenCalledWith('listingType', 'SPARE_PART_WANTED')

    await act(async () => {
      fireEvent.press(view.getByTestId('part-category-select'))
    })
    expect(view.getByTestId('category-BRAKES')).toBeTruthy()

    await act(async () => {
      fireEvent.press(view.getByTestId('category-BRAKES'))
    })
    expect(onUpdateField).toHaveBeenCalledWith('partCategory', 'BRAKES')
  })

  it('ServiceStep1Type renders glass WizardSelectField with OTHER_SERVICE as a normal option and error testID', async () => {
    const onUpdateField = jest.fn()
    const view = await render(
      <ServiceStep1Type
        formData={defaultServiceFormData}
        errors={{ serviceType: 'اختر نوع الخدمة' }}
        onUpdateField={onUpdateField}
      />
    )

    expect(view.getByTestId('service-type-select')).toBeTruthy()
    expect(view.getByTestId('service-type-select-glass-layers')).toBeTruthy()
    expect(view.queryByTestId('service-type-OTHER_SERVICE')).toBeNull()
    expect(view.getByTestId('error-service-type').props.children).toBe('اختر نوع الخدمة')

    await act(async () => {
      fireEvent.press(view.getByTestId('service-type-select'))
    })
    for (const st of SERVICE_TYPES) {
      expect(view.getByTestId(`service-type-${st.id}`)).toBeTruthy()
    }

    await act(async () => {
      fireEvent.press(view.getByTestId('service-type-OTHER_SERVICE'))
    })
    expect(onUpdateField).toHaveBeenCalledWith('serviceType', 'OTHER_SERVICE')
  })

  it('removes grid tiles, TouchableOpacity, SERVICE_TYPE_ICONS and MaterialCommunityIcons from both step 1 files', () => {
    const partsSrc = fs.readFileSync(
      path.resolve(__dirname, '..', 'components', 'parts', 'wizard', 'PartStep1Category.tsx'),
      'utf8'
    )
    const servicesSrc = fs.readFileSync(
      path.resolve(__dirname, '..', 'components', 'services', 'wizard', 'ServiceStep1Type.tsx'),
      'utf8'
    )

    for (const src of [partsSrc, servicesSrc]) {
      expect(src).toContain('WizardSelectField')
      expect(src).not.toContain('TouchableOpacity')
      expect(src).not.toContain('gridCard')
      expect(src).not.toContain('typeCard')
      expect(src).not.toContain('SERVICE_TYPE_ICONS')
      expect(src).not.toContain('MaterialCommunityIcons')
    }
  })
})
