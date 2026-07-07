/**
 * RTL text helpers for use with I18nManager.forceRTL(true)
 *
 * IMPORTANT: With forceRTL enabled, React Native flips `textAlign: 'right'`
 * on Text components to LEFT visually. Therefore:
 * - Do NOT use `textAlign: 'right'` on Text components
 * - Use only `writingDirection: 'rtl'` which handles alignment correctly
 * - `textAlign: 'right'` is safe ONLY on TextInput components (not flipped)
 * - `textAlign: 'center'` is safe everywhere (symmetric)
 */
export const RTLText = {
  writingDirection: 'rtl' as const,
}

/** For TextInput components only — textAlign is NOT flipped on TextInput */
export const RTLTextInput = {
  textAlign: 'right' as const,
  writingDirection: 'rtl' as const,
}
