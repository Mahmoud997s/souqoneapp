import { Colors } from '../../src/constants/colors'

export const Gradients = {
  // Primary (Solid Flat Turquoise #009CB5)
  primary: [Colors.primary, Colors.primary] as const,

  // WhatsApp
  whatsapp: ['#25D366', '#25D366'] as const,

  // Design System additions (Solid Flat Colors)
  hero: ['#192435', '#192435'] as const, // الكحلي: لخلفية البانر الداكن
  button: [Colors.primary, Colors.primary] as const, // الفيروزي الرئيسي للأزرار
  driver: [Colors.primary, Colors.primary] as const,
  employer: ['#192435', '#192435'] as const,
} as const
