import React from 'react'
import { HowItWorksCard, HowItWorksStep } from '../ui/HowItWorksCard'

export function EquipmentHowItWorks() {
  const steps: HowItWorksStep[] = [
    {
      stepNumber: 1,
      icon: 'search',
      title: 'ابحث وقارن',
      desc: 'تصفح آلاف المعدات والمشغلين واستخدم الفلاتر لاختيار الأنسب لمشروعك.',
    },
    {
      stepNumber: 2,
      icon: 'shield-checkmark',
      title: 'افحص وتأكد',
      desc: 'تحقق من حالة المعدة وساعات العمل وسجلات الصيانة لضمان الكفاءة والسلامة.',
    },
    {
      stepNumber: 3,
      icon: 'key',
      title: 'تواصل وأتمم الصفقة',
      desc: 'تواصل مع المالك أو المشغل مباشرة وأتمم إجراءات الإيجار أو الشراء بسهولة.',
    },
  ]

  return (
    <HowItWorksCard
      title="كيف تستخدم سوق وان للمعدات؟"
      subTitle="3 خطوات بسيطة لبيع وإيجار معدتك أو طلب مشغل"
      steps={steps}
    />
  )
}
