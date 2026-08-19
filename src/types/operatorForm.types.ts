/**
 * Types & Interfaces for Operator Forms & Wizard Steps
 */

export interface OperatorFormData {
  operatorType: string
  title: string
  experienceYears: string
  description: string
  equipmentTypes: string[]
  certifications: string[]
  specializations: string[]
  dailyRate: string
  hourlyRate: string
  currency?: string
  isPriceNegotiable: boolean
  governorateId: number | null | undefined
  wilayaId: number | null | undefined
  governorateName: string
  wilayaName: string
  contactPhone: string
  whatsapp: string
}

export type OperatorFormErrors = Partial<Record<keyof OperatorFormData | 'governorate' | 'city', string>>

export interface OperatorRoleStepProps {
  formData: OperatorFormData
  errors: OperatorFormErrors
  onUpdateField: (field: keyof OperatorFormData, value: any) => void
}

export interface OperatorEquipCertsStepProps {
  formData: OperatorFormData
  errors: OperatorFormErrors
  onToggleEquipment: (eqId: string) => void
  onPickCertificateImages: () => void
  onRemoveCertificate: (index: number) => void
  onAddTextCertificate: (text: string) => void
  onAddSpecialization?: (text: string) => void
  onRemoveSpecialization?: (index: number) => void
  isUploading: boolean
}

export interface OperatorRatesLocationStepProps {
  formData: OperatorFormData
  errors: OperatorFormErrors
  onUpdateField: (field: keyof OperatorFormData, value: any) => void
  onLocationChange: (govId: number, wilId: number, govNameAr: string, wilNameAr: string) => void
  onClearFieldError: (field: keyof OperatorFormData | 'governorate' | 'city') => void
}
