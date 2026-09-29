import { Colors } from '../../src/constants/colors'
export const Gradients = {
  // Primary: from Deep Pine Green to Hunter Green
  primary: ['#0B2B26', Colors.primary] as const,
  // WhatsApp
  whatsapp: ['#25D366', '#25D366'] as const,

  // Design System additions
  hero: ['#051F20', '#0B2B26', '#163832'] as const,
  button: ['#0B2B26', '#235347'] as const,
  driver: ['#0B2B26', '#163832'] as const,
  employer: ['#051F20', '#0B2B26'] as const,
} as const
