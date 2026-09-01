import { PartFormData, defaultPartFormData } from '../store/partWizardStore'
import { Part } from '../types/listing.types'

/**
 * Pure function mirroring handleSubmit payload construction from app/parts/new.tsx
 */
export function buildPartSubmitPayload(
  formData: PartFormData,
  finalImageUrls: string[] = []
): Partial<Part> {
  const payload: any = {
    title: formData.title.trim(),
    description: formData.description.trim(),
    partCategory: formData.partCategory!,
    condition: formData.condition!,
    partNumber: formData.partNumber ? formData.partNumber.trim() : undefined,
    compatibleMakes:
      formData.compatibleMakes && formData.compatibleMakes.length > 0
        ? formData.compatibleMakes
        : undefined,
    compatibleModels:
      formData.compatibleModels && formData.compatibleModels.length > 0
        ? formData.compatibleModels
        : undefined,
    yearFrom: formData.yearFrom != null ? Number(formData.yearFrom) : undefined,
    yearTo: formData.yearTo != null ? Number(formData.yearTo) : undefined,
    isOriginal: formData.isOriginal != null ? formData.isOriginal : undefined,
    price: formData.price != null ? Number(formData.price) : 0,
    currency: formData.currency || 'OMR',
    isPriceNegotiable: Boolean(formData.isPriceNegotiable),
    governorateId:
      formData.governorateId != null ? Number(formData.governorateId) : undefined,
    wilayaId: formData.wilayaId != null ? Number(formData.wilayaId) : undefined,
    latitude: formData.latitude != null ? formData.latitude : undefined,
    longitude: formData.longitude != null ? formData.longitude : undefined,
    contactPhone: formData.contactPhone ? formData.contactPhone.trim() : undefined,
    whatsapp: formData.whatsapp ? formData.whatsapp.trim() : undefined,
    hasWarranty: formData.hasWarranty,
    warrantyDuration:
      formData.hasWarranty && formData.warrantyDuration
        ? formData.warrantyDuration
        : undefined,
    quantity: formData.quantity || undefined,
    compatibleVehicleTypes:
      formData.compatibleVehicleTypes && formData.compatibleVehicleTypes.length > 0
        ? formData.compatibleVehicleTypes
        : undefined,

    ...(formData.editMode
      ? {}
      : { images: finalImageUrls.length > 0 ? finalImageUrls : undefined }),
  }

  return payload
}

describe('buildPartSubmitPayload', () => {
  it('correctly constructs CreatePartDto payload with numbers and trims strings', () => {
    const formData: PartFormData = {
      ...defaultPartFormData,
      title: '  محرك لكزس 430  ',
      description: '  محرك نظيف وارد اليابان  ',
      partCategory: 'ENGINE',
      condition: 'USED',
      partNumber: '  12345-67890  ',
      compatibleMakes: ['lexus', 'toyota'],
      compatibleModels: ['LS430', 'GS430'],
      yearFrom: 2001,
      yearTo: 2006,
      isOriginal: true,
      price: 350,
      isPriceNegotiable: true,
      governorateId: 1,
      wilayaId: 10,
      latitude: 23.588,
      longitude: 58.3829,
      contactPhone: '  91234567  ',
      whatsapp: '  91234567  ',
      hasWarranty: true,
      warrantyDuration: 'THREE_MONTHS',
      quantity: 'ONE',
      compatibleVehicleTypes: ['CAR'],
      editMode: false,
    }

    const images = ['https://cdn.example.com/p1.jpg', 'https://cdn.example.com/p2.jpg']
    const payload = buildPartSubmitPayload(formData, images)

    expect(payload.title).toBe('محرك لكزس 430')
    expect(payload.description).toBe('محرك نظيف وارد اليابان')
    expect(payload.partNumber).toBe('12345-67890')
    expect(payload.partCategory).toBe('ENGINE')
    expect(payload.condition).toBe('USED')
    expect(payload.price).toBe(350)
    expect(payload.governorateId).toBe(1)
    expect(payload.wilayaId).toBe(10)
    expect(payload.hasWarranty).toBe(true)
    expect(payload.warrantyDuration).toBe('THREE_MONTHS')
    expect(payload.compatibleVehicleTypes).toEqual(['CAR'])
    expect(payload.images).toEqual(images)
  })

  it('omits images in edit mode payload', () => {
    const formData: PartFormData = {
      ...defaultPartFormData,
      title: 'قطعة للتعديل',
      partCategory: 'BRAKES',
      condition: 'NEW',
      price: 50,
      editMode: true,
      editListingId: 'part-999',
    }

    const payload = buildPartSubmitPayload(formData, ['https://cdn.example.com/p1.jpg'])
    expect(payload.images).toBeUndefined()
  })

  it('omits warrantyDuration when hasWarranty is false', () => {
    const formData: PartFormData = {
      ...defaultPartFormData,
      title: 'قطعة بدون ضمان',
      partCategory: 'TIRES',
      condition: 'USED',
      price: 25,
      hasWarranty: false,
      warrantyDuration: 'ONE_MONTH', // should be ignored
    }

    const payload = buildPartSubmitPayload(formData)
    expect(payload.warrantyDuration).toBeUndefined()
    expect(payload.hasWarranty).toBe(false)
  })

  it('omits empty arrays and optional empty strings as undefined', () => {
    const formData: PartFormData = {
      ...defaultPartFormData,
      title: 'قطعة',
      partCategory: 'OTHER',
      condition: 'REFURBISHED',
      partNumber: '',
      compatibleMakes: [],
      compatibleModels: [],
      compatibleVehicleTypes: [],
      contactPhone: '',
      whatsapp: '',
    }

    const payload = buildPartSubmitPayload(formData)
    expect(payload.partNumber).toBeUndefined()
    expect(payload.compatibleMakes).toBeUndefined()
    expect(payload.compatibleModels).toBeUndefined()
    expect(payload.compatibleVehicleTypes).toBeUndefined()
    expect(payload.contactPhone).toBeUndefined()
    expect(payload.whatsapp).toBeUndefined()
  })
})
