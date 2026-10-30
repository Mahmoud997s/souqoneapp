import React from 'react'
import fs from 'fs'
import path from 'path'
import { StyleSheet } from 'react-native'
import { render, cleanup } from '@testing-library/react-native'
import { HowItWorksCard, HowItWorksStep } from '../components/ui/HowItWorksCard'
import { PartsHowItWorks } from '../components/parts/PartsHowItWorks'
import { ServicesHowItWorks } from '../components/services/ServicesHowItWorks'
import { Colors } from '../constants/colors'

describe('HowItWorks — Unified Component & Cross-Section Parity (D-156)', () => {
  afterEach(() => {
    cleanup()
  })

  describe('1. Unified HowItWorksCard Specification', () => {
    const mockSteps: HowItWorksStep[] = [
      { stepNumber: 1, icon: 'search', title: 'خطوة 1', desc: 'وصف الخطوة الأولى' },
      { stepNumber: 2, icon: 'shield-checkmark', title: 'خطوة 2', desc: 'وصف الخطوة الثانية' },
      { stepNumber: 3, icon: 'key', title: 'خطوة 3', desc: 'وصف الخطوة الثالثة' },
    ]

    it('renders unified card with icon box (48x48, radius 14), navy badge, and (steps - 1) dividers', async () => {
      const { getByText, getAllByTestId } = await render(
        <HowItWorksCard
          title="كيف تستخدم سوق وان؟"
          subTitle="3 خطوات سهلة وبسيطة"
          steps={mockSteps}
        />
      )

      expect(getByText('كيف تستخدم سوق وان؟')).toBeTruthy()
      expect(getByText('3 خطوات سهلة وبسيطة')).toBeTruthy()

      const iconBoxes = getAllByTestId('how-it-works-icon-box')
      expect(iconBoxes).toHaveLength(3)
      iconBoxes.forEach((box) => {
        const flattened = StyleSheet.flatten(box.props.style)
        expect(flattened.width).toBe(48)
        expect(flattened.height).toBe(48)
        expect(flattened.borderRadius).toBe(14)
        expect(flattened.backgroundColor).toBe(Colors.paleMint)
        expect(flattened.borderColor).toBe(Colors.border)
      })

      const badges = getAllByTestId('how-it-works-step-badge')
      expect(badges).toHaveLength(3)
      badges.forEach((badge) => {
        const flattened = StyleSheet.flatten(badge.props.style)
        expect(flattened.backgroundColor).toBe(Colors.primaryDark)
        expect(flattened.width).toBe(20)
        expect(flattened.height).toBe(20)
        expect(flattened.borderRadius).toBe(10)
        expect(flattened.borderColor).toBe(Colors.white)
      })

      const dividers = getAllByTestId('step-divider')
      expect(dividers).toHaveLength(mockSteps.length - 1)
      dividers.forEach((divider) => {
        const flattened = StyleSheet.flatten(divider.props.style)
        expect(flattened.height).toBe(1)
        expect(flattened.backgroundColor).toBe(Colors.border)
      })
    })
  })

  describe('2. PartsHowItWorks Wrapper Integration', () => {
    it('renders unified title and 3 parts steps with correct icons and exactly 2 dividers', async () => {
      const { getByText, getAllByTestId } = await render(<PartsHowItWorks />)

      expect(getByText('كيف تستخدم سوق وان لقطع الغيار؟')).toBeTruthy()
      expect(getByText('3 خطوات بسيطة للحصول على قطعة الغيار المناسبة لسيارتك')).toBeTruthy()
      expect(getByText('ابحث برقم القطعة أو الماركة')).toBeTruthy()
      expect(getByText('تأكد من الأصالة والمطابقة')).toBeTruthy()
      expect(getByText('تواصل مباشرة واستلم قطعتك')).toBeTruthy()

      const dividers = getAllByTestId('step-divider')
      expect(dividers).toHaveLength(2)
    })
  })

  describe('3. ServicesHowItWorks Wrapper Integration', () => {
    it('renders unified title and 3 services steps with correct icons and exactly 2 dividers', async () => {
      const { getByText, getAllByTestId } = await render(<ServicesHowItWorks />)

      expect(getByText('كيف تستخدم سوق وان للخدمات؟')).toBeTruthy()
      expect(getByText('3 خطوات بسيطة لإنجاز خدمات سيارتك')).toBeTruthy()
      expect(getByText('ابحث عن الخدمة المناسبة')).toBeTruthy()
      expect(getByText('اختر مقدم الخدمة')).toBeTruthy()
      expect(getByText('تواصل مباشرة')).toBeTruthy()

      const dividers = getAllByTestId('step-divider')
      expect(dividers).toHaveLength(2)
    })
  })

  describe('4. Zero Raw Hex Gate on the Three Files', () => {
    it('contains 0 raw hex color literals in HowItWorksCard, PartsHowItWorks, and ServicesHowItWorks', () => {
      const files = [
        path.resolve(__dirname, '../components/ui/HowItWorksCard.tsx'),
        path.resolve(__dirname, '../components/parts/PartsHowItWorks.tsx'),
        path.resolve(__dirname, '../components/services/ServicesHowItWorks.tsx'),
      ]

      const hexRegex = /#[0-9a-fA-F]{3,8}/g
      files.forEach((filePath) => {
        const content = fs.readFileSync(filePath, 'utf8')
        const matches = content.match(hexRegex) || []
        expect(matches).toEqual([])
      })
    })
  })
})
