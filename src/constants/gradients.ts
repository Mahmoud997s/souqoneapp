import { Colors } from '../../src/constants/colors'
export const Gradients = {
  // Stitch: from-[#0B2447] to-[Colors.primary] (used in headers + buttons)
  primary: ['#0B2447', Colors.primary] as const,
  // WhatsApp
  whatsapp: ['#25D366', '#25D366'] as const,

  // Design System additions
  hero: ['#0B2447', '#1a3a6b', '#0d3060'] as const,
  button: ['#0B2447', '#1a3a6b'] as const,
  driver: ['#065f46', '#059669'] as const,
  employer: ['#0B2447', '#1e3a5f'] as const,
} as const
