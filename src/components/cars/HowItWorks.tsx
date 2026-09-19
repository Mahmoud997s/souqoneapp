import React from 'react'
import { HowItWorksCard, HowItWorksStep } from '../ui/HowItWorksCard'

export const HowItWorks = () => {
  const steps: HowItWorksStep[] = [
    {
      stepNumber: 1,
      icon: 'search',
      title: 'ابحث وقارن',
      desc: 'تصفح آلاف السيارات المتاحة واستخدم الفلاتر للوصول لسيارتك المفضلة.',
    },
    {
      stepNumber: 2,
      icon: 'shield-checkmark',
      title: 'افحص وتأكد',
      desc: 'اطلب تقرير الفحص الفني الشامل لضمان سلامة وجودة السيارة قبل شرائها.',
    },
    {
      stepNumber: 3,
      icon: 'key',
      title: 'تواصل وامتلك',
      desc: 'تواصل مع البائع مباشرة وقم بإنهاء إجراءات البيع بأمان وسهولة.',
    },
  ]

  return (
    <HowItWorksCard
      title="كيف تستخدم سوق وان للسيارات؟"
      subTitle="3 خطوات بسيطة لبيع وشراء سيارتك"
      steps={steps}
    />
  )
}
