import React, { useCallback, useMemo, useState } from 'react'
import {
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'
import { TopBarTokens } from '../../constants/topBarTokens'
import { TopBarGlassSurface } from './TopBarGlassSurface'
import { useAppReducedMotion } from '../../utils/listing-detail/useAppReducedMotion'

export interface WizardSelectOption {
  value: string
  label: string
  testID?: string
}

export interface WizardSelectGroup {
  title: string
  options: WizardSelectOption[]
}

export interface WizardSelectFieldProps {
  label?: string
  value?: string | null
  placeholder?: string
  options?: WizardSelectOption[]
  groups?: WizardSelectGroup[]
  onSelect: (value: string) => void
  error?: string
  errorTestID?: string
  disabled?: boolean
  glass?: boolean
  testID?: string
}

const HEADER_HEIGHT = 48
const OPTION_ROW_HEIGHT = 48
const GROUP_HEADER_HEIGHT = 36
const ANIMATION_DURATION_MS = 260
const ANIMATION_EASING = Easing.bezier(0.2, 0.8, 0.2, 1)

export function WizardSelectField({
  label,
  value,
  placeholder = 'اختر...',
  options,
  groups,
  onSelect,
  error,
  errorTestID,
  disabled = false,
  glass = false,
  testID,
}: WizardSelectFieldProps) {
  const reducedMotion = useAppReducedMotion()
  const [isOpen, setIsOpen] = useState(false)
  const [shouldRenderList, setShouldRenderList] = useState(false)
  const [measuredHeight, setMeasuredHeight] = useState(0)

  const progress = useSharedValue(0)

  const allOptions = useMemo(() => {
    if (groups && groups.length > 0) {
      return groups.flatMap((group) => group.options)
    }
    return options ?? []
  }, [groups, options])

  const selectedOption = useMemo(
    () => allOptions.find((opt) => opt.value === value),
    [allOptions, value]
  )

  const estimatedHeight = useMemo(() => {
    if (groups && groups.length > 0) {
      const groupHeadersHeight = groups.length * GROUP_HEADER_HEIGHT
      const rowsHeight = groups.reduce(
        (sum, group) => sum + group.options.length * OPTION_ROW_HEIGHT,
        0
      )
      return groupHeadersHeight + rowsHeight
    }
    return (options?.length ?? 0) * OPTION_ROW_HEIGHT
  }, [groups, options])

  const targetHeight = measuredHeight > 0 ? measuredHeight : estimatedHeight

  const finishCollapse = useCallback((finished?: boolean) => {
    if (finished !== false) {
      setShouldRenderList(false)
    }
  }, [])

  const setExpandedState = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setShouldRenderList(true)
        setIsOpen(true)
        if (reducedMotion) {
          progress.value = 1
        } else {
          progress.value = withTiming(1, {
            duration: ANIMATION_DURATION_MS,
            easing: ANIMATION_EASING,
          })
        }
        return
      }

      setIsOpen(false)
      if (reducedMotion) {
        progress.value = 0
        setShouldRenderList(false)
      } else {
        progress.value = withTiming(
          0,
          {
            duration: ANIMATION_DURATION_MS,
            easing: ANIMATION_EASING,
          },
          (finished) => {
            runOnJS(finishCollapse)(finished)
          }
        )
      }
    },
    [finishCollapse, progress, reducedMotion]
  )

  const handleToggle = useCallback(() => {
    if (disabled) return
    setExpandedState(!isOpen)
  }, [disabled, isOpen, setExpandedState])

  const handleSelectOption = useCallback(
    (selectedValue: string) => {
      onSelect(selectedValue)
      setExpandedState(false)
    },
    [onSelect, setExpandedState]
  )

  const handleContentLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const nextHeight = Math.ceil(event.nativeEvent.layout.height)
      if (nextHeight > 0 && nextHeight !== measuredHeight) {
        setMeasuredHeight(nextHeight)
      }
    },
    [measuredHeight]
  )

  const bodyAnimatedStyle = useAnimatedStyle(() => ({
    height: progress.value * targetHeight,
    opacity: interpolate(progress.value, [0.15, 1], [0, 1], Extrapolation.CLAMP),
    overflow: 'hidden',
  }))

  const chevronAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(progress.value, [0, 1], [0, 180])}deg`,
      },
    ],
  }))

  const renderOptionRow = (opt: WizardSelectOption) => {
    const isSelected = opt.value === value
    return (
      <TouchableOpacity
        key={opt.value}
        testID={opt.testID}
        style={[s.optionRow, glass && s.optionRowGlass, isSelected && s.optionRowSelected]}
        onPress={() => handleSelectOption(opt.value)}
        activeOpacity={0.75}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={opt.label}
      >
        <Text
          style={[s.optionText, isSelected && s.optionTextSelected]}
          numberOfLines={2}
        >
          {opt.label}
        </Text>
        {isSelected ? (
          <Ionicons name="checkmark" size={18} color={Colors.primary} />
        ) : null}
      </TouchableOpacity>
    )
  }

  return (
    <View style={s.wrapper}>
      {label ? <Text style={s.label}>{label}</Text> : null}

      <View
        style={[
          s.container,
          glass && s.containerGlass,
          error && !isOpen ? s.containerError : null,
          isOpen ? s.containerOpen : null,
          disabled ? s.containerDisabled : null,
        ]}
      >
        {glass ? (
          <TopBarGlassSurface
            testID={testID ? `${testID}-glass` : 'wizard-select-glass'}
            kind="ice-control"
            borderRadius={Radius.md}
          />
        ) : null}
        <TouchableOpacity
          testID={testID}
          style={s.headerRow}
          onPress={handleToggle}
          disabled={disabled}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ expanded: isOpen, disabled }}
          accessibilityLabel={label || placeholder}
        >
          <Text
            style={[
              s.headerText,
              !selectedOption ? s.placeholderText : s.selectedHeaderText,
            ]}
            numberOfLines={1}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </Text>

          <Animated.View style={chevronAnimatedStyle}>
            <Ionicons
              name="chevron-down"
              size={18}
              color={isOpen ? Colors.primary : Colors.textMuted}
            />
          </Animated.View>
        </TouchableOpacity>

        {shouldRenderList ? (
          <Animated.View style={bodyAnimatedStyle}>
            <View onLayout={handleContentLayout}>
              {groups && groups.length > 0
                ? groups.map((group) => (
                    <View key={group.title}>
                      <View style={s.groupHeader}>
                        <Text style={s.groupHeaderText}>{group.title}</Text>
                      </View>
                      {group.options.map(renderOptionRow)}
                    </View>
                  ))
                : allOptions.map(renderOptionRow)}
            </View>
          </Animated.View>
        ) : null}
      </View>

      {error ? <Text testID={errorTestID} style={s.errorText}>{error}</Text> : null}
    </View>
  )
}

const s = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 19,
    color: Colors.text,
    marginBottom: Spacing.space2,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  container: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  containerGlass: {
    backgroundColor: Colors.transparent,
    borderColor: TopBarTokens.buttonBorderColor,
  },
  containerOpen: {
    borderColor: Colors.primary,
  },
  containerError: {
    borderColor: Colors.error,
  },
  containerDisabled: {
    opacity: 0.6,
  },
  headerRow: {
    height: HEADER_HEIGHT,
    paddingHorizontal: Spacing.space3 + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.space2,
  },
  headerText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  selectedHeaderText: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.text,
  },
  placeholderText: {
    fontFamily: 'Almarai_400Regular',
    color: Colors.placeholder,
  },
  groupHeader: {
    height: GROUP_HEADER_HEIGHT,
    backgroundColor: Colors.surfaceAlt,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.space3 + 2,
    justifyContent: 'center',
  },
  groupHeaderText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  optionRow: {
    minHeight: OPTION_ROW_HEIGHT,
    paddingHorizontal: Spacing.space3 + 2,
    paddingVertical: Spacing.space2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.space2,
  },
  optionRowGlass: {
    backgroundColor: Colors.transparent,
  },
  optionRowSelected: {
    backgroundColor: Colors.paleMint,
  },
  optionText: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  optionTextSelected: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
  },
  errorText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: Colors.error,
    marginTop: Spacing.space1 + 2,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
})
