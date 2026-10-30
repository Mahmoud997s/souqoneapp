import React from 'react'
import { HowItWorksCard, HowItWorksStep } from '../ui/HowItWorksCard'

const STEPS: HowItWorksStep[] = [
  {
    stepNumber: 1,
    icon: 'search',
    title: 'ابحث عن الخدمة المناسبة',
    desc: 'تصفح أقسام الخدمات مثل الصيانة، الغسيل، والتعديل للعثور على ما تحتاجه سيارتك.',
  },
  {
    stepNumber: 2,
    icon: 'briefcase',
    title: 'اختر مقدم الخدمة',
    desc: 'قارن بين الورش والأفراد والخدمات المتنقلة، وتحقق من الموثوقية والأسعار.',
  },
  {
    stepNumber: 3,
    icon: 'chatbubbles',
    title: 'تواصل مباشرة',
    desc: 'تواصل مع مقدم الخدمة لحجز موعدك أو طلب خدمة متنقلة تصلك أينما كنت.',
  },
]

export const ServicesHowItWorks = () => {
  return (
    <HowItWorksCard
      title="كيف تستخدم سوق وان للخدمات؟"
      subTitle="3 خطوات بسيطة لإنجاز خدمات سيارتك"
      steps={STEPS}
    />
  )
}
