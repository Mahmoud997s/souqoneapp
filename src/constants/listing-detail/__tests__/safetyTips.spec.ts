import {
  BUYER_SAFETY_TIPS_TITLE,
  BUYER_SAFETY_TIPS,
  SELLER_SAFETY_TIPS_TITLE,
  SELLER_SAFETY_TIPS,
  BUS_BUYER_SAFETY_TIPS,
  BUS_SELLER_SAFETY_TIPS,
  EQUIPMENT_BUYER_SAFETY_TIPS_TITLE,
  EQUIPMENT_BUYER_SAFETY_TIPS,
  EQUIPMENT_RENTER_SAFETY_TIPS_TITLE,
  EQUIPMENT_RENTER_SAFETY_TIPS,
  EQUIPMENT_SELLER_SAFETY_TIPS_TITLE,
  EQUIPMENT_SELLER_SAFETY_TIPS,
  OPERATOR_HIRER_SAFETY_TIPS_TITLE,
  OPERATOR_HIRER_SAFETY_TIPS,
  OPERATOR_OWNER_SAFETY_TIPS_TITLE,
  OPERATOR_OWNER_SAFETY_TIPS,
} from '../safetyTips'

describe('safetyTips constants', () => {
  it('preserves existing car safety tips unchanged (baseline snapshot)', () => {
    expect(BUYER_SAFETY_TIPS_TITLE).toBe('نصائح لسلامتك عند الشراء')
    expect(BUYER_SAFETY_TIPS).toEqual([
      'عاين السيارة شخصيًا قبل أي دفع، ولا تعتمد على الصور فقط.',
      'قابل البائع في مكان عام وآمن، ويفضل اصطحاب شخص معك.',
      'لا تحوّل أي مبلغ قبل معاينة السيارة والتأكد من أوراقها الرسمية.',
      'تأكد من مطابقة رقم الهيكل والبيانات في الأوراق مع السيارة الفعلية.',
      'يفضّل فحص السيارة عند فني موثوق قبل إتمام الشراء.',
      'لا تشارك بياناتك البنكية أو كلمات المرور مع أي طرف تحت أي ظرف.',
    ])

    expect(SELLER_SAFETY_TIPS_TITLE).toBe('نصائح لسلامتك عند البيع')
    expect(SELLER_SAFETY_TIPS).toEqual([
      'قابل المشتري في مكان عام وآمن.',
      'تأكد من هوية المشتري قبل تسليم أي أوراق أصلية.',
      'لا تسلّم مفاتيح السيارة أو أوراقها الأصلية إلا بعد استلام كامل المبلغ.',
      'احتفظ بنسخة من عقد البيع موقعة من الطرفين.',
      'لا تشارك بيانات حسابك البنكي مع المشتري إلا عند إتمام البيع فعليًا.',
    ])
  })

  it('preserves existing bus safety tips unchanged (baseline snapshot)', () => {
    expect(BUS_BUYER_SAFETY_TIPS).toEqual([
      'عاين الحافلة شخصيًا قبل أي دفع، ولا تعتمد على الصور فقط.',
      'قابل البائع في مكان عام وآمن، ويفضل اصطحاب شخص معك.',
      'لا تحوّل أي مبلغ قبل معاينة الحافلة والتأكد من أوراقها الرسمية.',
      'تأكد من مطابقة رقم الهيكل والبيانات في الأوراق مع الحافلة الفعلية.',
      'يفضّل فحص الحافلة عند فني موثوق قبل إتمام الشراء.',
      'لا تشارك بياناتك البنكية أو كلمات المرور مع أي طرف تحت أي ظرف.',
    ])

    expect(BUS_SELLER_SAFETY_TIPS).toEqual([
      'قابل المشتري في مكان عام وآمن.',
      'تأكد من هوية المشتري قبل تسليم أي أوراق أصلية.',
      'لا تسلّم مفاتيح الحافلة أو أوراقها الأصلية إلا بعد استلام كامل المبلغ.',
      'احتفظ بنسخة من عقد البيع موقعة من الطرفين.',
      'لا تشارك بيانات حسابك البنكي مع المشتري إلا عند إتمام البيع فعليًا.',
    ])
  })

  it('provides equipment buyer, renter, and seller safety tips without emojis', () => {
    expect(EQUIPMENT_BUYER_SAFETY_TIPS_TITLE).toBe('نصائح لسلامتك عند شراء معدة')
    expect(EQUIPMENT_BUYER_SAFETY_TIPS.length).toBeGreaterThanOrEqual(5)

    expect(EQUIPMENT_RENTER_SAFETY_TIPS_TITLE).toBe('نصائح لسلامتك عند استئجار معدة')
    expect(EQUIPMENT_RENTER_SAFETY_TIPS.length).toBeGreaterThanOrEqual(4)

    expect(EQUIPMENT_SELLER_SAFETY_TIPS_TITLE).toBe('نصائح لسلامتك عند بيع معدة')
    expect(EQUIPMENT_SELLER_SAFETY_TIPS.length).toBeGreaterThanOrEqual(3)

    // Ensure no emoji in any tip
    const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Emoji_Presentation}/u
    const allTips = [
      ...EQUIPMENT_BUYER_SAFETY_TIPS,
      ...EQUIPMENT_RENTER_SAFETY_TIPS,
      ...EQUIPMENT_SELLER_SAFETY_TIPS,
    ]
    for (const tip of allTips) {
      expect(emojiRegex.test(tip)).toBe(false)
      expect(tip.trim().length).toBeGreaterThan(10)
    }
  })

  it('provides operator hirer and owner safety tips without emojis', () => {
    expect(OPERATOR_HIRER_SAFETY_TIPS_TITLE).toBe('نصائح لسلامتك عند التعاقد مع مشغّل')
    expect(OPERATOR_HIRER_SAFETY_TIPS.length).toBeGreaterThanOrEqual(5)

    expect(OPERATOR_OWNER_SAFETY_TIPS_TITLE).toBe('نصائح لسلامتك كمشغّل معدات')
    expect(OPERATOR_OWNER_SAFETY_TIPS.length).toBeGreaterThanOrEqual(4)

    const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Emoji_Presentation}/u
    const allTips = [
      ...OPERATOR_HIRER_SAFETY_TIPS,
      ...OPERATOR_OWNER_SAFETY_TIPS,
    ]
    for (const tip of allTips) {
      expect(emojiRegex.test(tip)).toBe(false)
      expect(tip.trim().length).toBeGreaterThan(10)
    }
  })
})
