import { mapCarBackendErrors } from '../../hooks/useCarValidation'

describe('mapCarBackendErrors (S7 / PR #163 compatibility)', () => {
  it('maps structured backend fieldErrors and identifies firstInvalidStep correctly', () => {
    const errorResponse = {
      response: {
        status: 400,
        data: {
          fieldErrors: {
            title: 'العنوان قصير جداً',
            price: 'السعر غير صالح',
            fuelType: 'نوع الوقود مطلوب',
          },
        },
      },
    }

    const res = mapCarBackendErrors(errorResponse)
    expect(res.fieldErrors).toEqual({
      title: 'العنوان قصير جداً',
      price: 'السعر غير صالح',
      fuelType: 'نوع الوقود مطلوب',
    })
    // title -> step 1, price -> step 2, fuelType -> step 3
    expect(res.firstInvalidStep).toBe(1)
  })

  it('falls back to Arabic/English message strings and resolves steps accurately', () => {
    const errorStringResponse = {
      response: {
        status: 400,
        data: {
          message: 'السعر مطلوب ويجب أن يكون رقماً',
        },
      },
    }

    const res = mapCarBackendErrors(errorStringResponse)
    expect(res.fieldErrors.price).toBe('السعر مطلوب ويجب أن يكون رقماً')
    expect(res.firstInvalidStep).toBe(4)
  })

  it('returns empty fieldErrors and null firstInvalidStep for non-object errors', () => {
    expect(mapCarBackendErrors(null)).toEqual({ fieldErrors: {}, firstInvalidStep: null })
    expect(mapCarBackendErrors(undefined)).toEqual({ fieldErrors: {}, firstInvalidStep: null })
  })
})
