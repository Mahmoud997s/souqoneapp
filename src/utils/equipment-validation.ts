import { EquipmentListing, OperatorListing } from '../types/equipment.types'

export const validateEquipmentForm = (data: Partial<EquipmentListing>): Record<string, string> => {
  const errors: Record<string, string> = {}

  if (!data.title?.trim()) errors.title = 'العنوان مطلوب'
  if (!data.description?.trim()) errors.description = 'الوصف مطلوب'
  if (!data.equipmentType) errors.equipmentType = 'يجب اختيار نوع المعدة'
  if (!data.listingType) errors.listingType = 'يجب اختيار نوع الإعلان'

  if (data.listingType === 'EQUIPMENT_SALE') {
    if (!data.price || data.price <= 0) errors.price = 'سعر البيع مطلوب ويجب أن يكون أكبر من الصفر'
  }

  if (data.listingType === 'EQUIPMENT_RENT') {
    if ((!data.dailyPrice || data.dailyPrice <= 0) && (!data.monthlyPrice || data.monthlyPrice <= 0)) {
      errors.dailyPrice = 'يجب تحديد سعر إيجار يومي أو شهري'
    }
  }

  if (data.listingType === 'EQUIPMENT_WANTED') {
    if (!data.budgetMax || data.budgetMax <= 0) errors.budgetMax = 'يجب تحديد الميزانية القصوى'
    if (!data.rentalDuration?.trim()) errors.rentalDuration = 'يجب تحديد مدة الإيجار المطلوبة'
  }

  if (!data.governorate) errors.governorateId = 'المحافظة مطلوبة'
  if (!data.city) errors.city = 'المدينة مطلوبة'
  if (!data.contactPhone?.trim()) errors.contactPhone = 'رقم التواصل مطلوب'

  return errors
}

export const validateOperatorForm = (data: Partial<OperatorListing>): Record<string, string> => {
  const errors: Record<string, string> = {}

  if (!data.title?.trim()) errors.title = 'العنوان مطلوب'
  if (!data.description?.trim()) errors.description = 'نبذة عن الخبرة مطلوبة'
  if (!data.operatorType) errors.operatorType = 'نوع المشغل مطلوب'
  
  if (data.experienceYears === undefined || data.experienceYears < 0) {
    errors.experienceYears = 'سنوات الخبرة مطلوبة'
  }

  if (!data.equipmentTypes || data.equipmentTypes.length === 0) {
    errors.equipmentTypes = 'يجب تحديد نوع معدة واحد على الأقل'
  }

  if (!data.governorate) errors.governorateId = 'المحافظة مطلوبة'
  if (!data.city) errors.city = 'المدينة مطلوبة'
  if (!data.contactPhone?.trim()) errors.contactPhone = 'رقم التواصل مطلوب'

  return errors
}
