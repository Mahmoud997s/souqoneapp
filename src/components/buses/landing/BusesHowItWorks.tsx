import React from 'react'
import { HowItWorksCard, HowItWorksStep } from '../../ui/HowItWorksCard'

export function BusesHowItWorks() {
  const steps: HowItWorksStep[] = [
    {
      stepNumber: 1,
      icon: 'search',
      title: 'ابحث وقارن',
      desc: 'تصفح آلاف الحافلات المتاحة واستخدم الفلاتر للوصول لحافلتك المفضلة.',
    },
    {
      stepNumber: 2,
      icon: 'shield-checkmark',
      title: 'افحص وتأكد',
      desc: 'اطلب تقرير الفحص الفني وسجلات الصيانة لضمان سلامة وجودة الحافلة.',
    },
    {
      stepNumber: 3,
      icon: 'key',
      title: 'تواصل وامتلك',
      desc: 'تواصل مع المعلن مباشرة وقم بإنهاء إجراءات الشراء أو التأجير بأمان.',
    },
  ]

  return (
    <HowItWorksCard
      title="كيف تستخدم سوق وان للحافلات؟"
      subTitle="3 خطوات بسيطة لبيع وشراء حافلتك"
      steps={steps}
    />
  )
}
