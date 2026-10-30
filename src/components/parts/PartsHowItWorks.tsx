import React from 'react'
import { HowItWorksCard, HowItWorksStep } from '../ui/HowItWorksCard'

const STEPS: HowItWorksStep[] = [
  {
    stepNumber: 1,
    icon: 'search',
    title: 'ابحث برقم القطعة أو الماركة',
    desc: 'ابحث بسهولة بالاسم، رقم القطعة، الموديل أو تصفح الأقسام للعثور على القطعة المطابقة.',
  },
  {
    stepNumber: 2,
    icon: 'shield-checkmark',
    title: 'تأكد من الأصالة والمطابقة',
    desc: 'راجع تفاصيل القطعة (أصلية وكالة، تجارية، أو سكراب) وتأكد من توافقها مع سنة وموديل سيارتك.',
  },
  {
    stepNumber: 3,
    icon: 'chatbubbles',
    title: 'تواصل مباشرة واستلم قطعتك',
    desc: 'تواصل فوراً مع البائع أو السكراب عبر الاتصال أو الواتساب واستلم قطعتك بأفضل سعر.',
  },
]

export const PartsHowItWorks = () => {
  return (
    <HowItWorksCard
      title="كيف تستخدم سوق وان لقطع الغيار؟"
      subTitle="3 خطوات بسيطة للحصول على قطعة الغيار المناسبة لسيارتك"
      steps={STEPS}
    />
  )
}
