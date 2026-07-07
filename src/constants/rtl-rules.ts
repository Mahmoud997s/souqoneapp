/*
 * SOUQONE RTL MASTER RULES
 * forceRTL(true) is ACTIVE
 *
 * VISUAL LAYOUT:
 *
 * RULE 1 - ABSOLUTE POSITION:
 *   ✅ RIGHT side → start: value
 *   ✅ LEFT side  → end: value
 *   ❌ NEVER use left/right
 *
 * RULE 2 - PADDING/MARGIN:
 *   ✅ Use paddingStart / paddingEnd
 *   ❌ NEVER use paddingLeft / paddingRight
 *   ❌ NEVER use marginLeft / marginRight
 *
 * RULE 3 - TEXT (CRITICAL):
 *   ✅ Arabic Text → writingDirection: 'rtl' ALWAYS
 *   ❌ NEVER use textAlign: 'right' on Text (forceRTL flips it to LEFT visually!)
 *   ✅ TextInput → textAlign: 'right' (TextInput is NOT flipped by forceRTL)
 *   ✅ textAlign: 'center' is safe everywhere
 *
 * RULE 4 - ALIGNMENT:
 *   ✅ Align visually to RIGHT → alignItems: 'flex-end'
 *   ✅ Align visually to LEFT  → alignItems: 'flex-start'
 *
 * RULE 5 - ICONS (BACK BUTTON):
 *   ✅ Back arrow → use 'arrow-forward-outline' (forceRTL flips it so it points Left)
 *
 * FORBIDDEN:
 *   ❌ left: / right:
 *   ❌ marginLeft / marginRight
 *   ❌ paddingLeft / paddingRight
 *   ❌ flexDirection: 'row-reverse'
 *   ❌ textAlign: 'right' on Text components
 */

export const RTL = {
  // Text
  text:    { writingDirection: 'rtl' as const },
  // Absolute positions
  absRight: { position:'absolute' as const, start:0 },
  absLeft:  { position:'absolute' as const, end:0 },
  // Alignment
  alignRight: { alignItems:'flex-end' as const },
  alignLeft:  { alignItems:'flex-start' as const },
  // Input padding/align
  inputPad: {
    paddingStart:48,
    paddingEnd:14,
    textAlign:'right' as const,
    writingDirection: 'rtl' as const
  },
} as const
