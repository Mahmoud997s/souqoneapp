import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Dimensions,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  TextInput,
} from 'react-native'
import { WIZARD_STICKY_FOOTER_CONTENT_HEIGHT } from '../ui/WizardStickyFooter'

export const WIZARD_FOCUSED_INPUT_GAP = 28

export interface FocusedInputScrollParams {
  scrollViewY: number
  scrollViewHeight: number
  inputY: number
  inputHeight: number
  windowHeight: number
  keyboardHeight: number
  footerClearance?: number
  extraGap?: number
  topClearance?: number
}

/**
 * Computes the vertical scroll delta needed so a focused input (single-line or multiline)
 * sits cleanly above the software keyboard + floating WizardStickyFooter with extra breathing gap.
 */
export function computeFocusedInputScrollDelta({
  scrollViewY,
  scrollViewHeight,
  inputY,
  inputHeight,
  windowHeight,
  keyboardHeight,
  footerClearance = WIZARD_STICKY_FOOTER_CONTENT_HEIGHT,
  extraGap = WIZARD_FOCUSED_INPUT_GAP,
  topClearance = 16,
}: FocusedInputScrollParams): number {
  const keyboardTopY = keyboardHeight > 0 ? windowHeight - keyboardHeight : windowHeight
  const visibleBottomY = Math.min(scrollViewY + scrollViewHeight, keyboardTopY)
  const safeBottomY = visibleBottomY - footerClearance - extraGap
  const inputBottomY = inputY + inputHeight

  if (inputBottomY > safeBottomY) {
    return inputBottomY - safeBottomY
  }

  const safeTopY = scrollViewY + topClearance
  if (inputY < safeTopY) {
    return inputY - safeTopY
  }

  return 0
}

type MeasurableNode = {
  measureInWindow?: (cb: (x: number, y: number, width: number, height: number) => void) => void
}

interface WizardKeyboardScrollContextValue {
  notifyInputFocus: (input: MeasurableNode | null) => void
}

const WizardKeyboardScrollContext = createContext<WizardKeyboardScrollContextValue | null>(null)

export function useWizardKeyboardScroll(): WizardKeyboardScrollContextValue | null {
  return useContext(WizardKeyboardScrollContext)
}

export interface WizardKeyboardScrollViewProps extends ScrollViewProps {
  footerClearance?: number
  extraGap?: number
}

export const WizardKeyboardScrollView = forwardRef<ScrollView, WizardKeyboardScrollViewProps>(
  (
    {
      children,
      contentContainerStyle,
      footerClearance = WIZARD_STICKY_FOOTER_CONTENT_HEIGHT,
      extraGap = WIZARD_FOCUSED_INPUT_GAP,
      keyboardShouldPersistTaps = 'handled',
      automaticallyAdjustKeyboardInsets = Platform.OS === 'ios',
      onScroll,
      scrollEventThrottle = 16,
      ...rest
    },
    forwardedRef
  ) => {
    const internalRef = useRef<ScrollView | null>(null)
    const scrollOffsetYRef = useRef(0)
    const keyboardHeightRef = useRef(0)
    const lastFocusedInputRef = useRef<MeasurableNode | null>(null)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [keyboardHeight, setKeyboardHeight] = useState(0)

    const setMergedRef = useCallback(
      (node: ScrollView | null) => {
        internalRef.current = node
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }
      },
      [forwardedRef]
    )

    const scrollToInputIntoView = useCallback(
      (targetInput: MeasurableNode | null, activeKeyboardHeight: number) => {
        const scrollNode = internalRef.current as unknown as
          | (ScrollView & MeasurableNode)
          | null
        if (!scrollNode?.measureInWindow || !targetInput?.measureInWindow) {
          return
        }

        scrollNode.measureInWindow((_svX, svY, _svW, svH) => {
          targetInput.measureInWindow?.((_inX, inY, _inW, inH) => {
            const windowHeight = Dimensions.get('window').height
            const delta = computeFocusedInputScrollDelta({
              scrollViewY: svY,
              scrollViewHeight: svH,
              inputY: inY,
              inputHeight: inH,
              windowHeight,
              keyboardHeight: activeKeyboardHeight,
              footerClearance,
              extraGap,
            })

            if (delta !== 0) {
              const nextY = Math.max(0, scrollOffsetYRef.current + delta)
              scrollNode.scrollTo?.({ y: nextY, animated: true })
            }
          })
        })
      },
      [extraGap, footerClearance]
    )

    const scheduleScrollToInput = useCallback(
      (targetInput: MeasurableNode | null, activeKeyboardHeight: number) => {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
        }
        timerRef.current = setTimeout(() => {
          scrollToInputIntoView(targetInput, activeKeyboardHeight)
        }, 50)
      },
      [scrollToInputIntoView]
    )

    useEffect(() => {
      const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
      const onShow = (e: { endCoordinates?: { height?: number } }) => {
        const height = e.endCoordinates?.height ?? 0
        keyboardHeightRef.current = height
        setKeyboardHeight(height)

        const currentFocused =
          lastFocusedInputRef.current ??
          ((TextInput as unknown as { State?: { currentlyFocusedInput?: () => MeasurableNode | null } })
            .State?.currentlyFocusedInput?.() ?? null)

        if (currentFocused) {
          scheduleScrollToInput(currentFocused, height)
        }
      }

      const onHide = () => {
        keyboardHeightRef.current = 0
        setKeyboardHeight(0)
      }

      const showSub = Keyboard.addListener(showEvent, onShow)
      const didShowSub =
        showEvent !== 'keyboardDidShow' ? Keyboard.addListener('keyboardDidShow', onShow) : null
      const hideSub = Keyboard.addListener('keyboardDidHide', onHide)

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
        }
        showSub.remove()
        didShowSub?.remove()
        hideSub.remove()
      }
    }, [scheduleScrollToInput])

    const notifyInputFocus = useCallback(
      (input: MeasurableNode | null) => {
        lastFocusedInputRef.current = input
        if (input && keyboardHeightRef.current > 0) {
          scheduleScrollToInput(input, keyboardHeightRef.current)
        }
      },
      [scheduleScrollToInput]
    )

    const contextValue = useMemo(() => ({ notifyInputFocus }), [notifyInputFocus])

    const handleScroll = useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollOffsetYRef.current = e.nativeEvent.contentOffset.y
        onScroll?.(e)
      },
      [onScroll]
    )

    const mergedContentStyle = useMemo(() => {
      if (Platform.OS !== 'android' || keyboardHeight <= 0) {
        return contentContainerStyle
      }
      const flat = StyleSheet.flatten(contentContainerStyle) || {}
      const basePaddingBottom = typeof flat.paddingBottom === 'number' ? flat.paddingBottom : 0
      return [contentContainerStyle, { paddingBottom: basePaddingBottom + keyboardHeight }]
    }, [contentContainerStyle, keyboardHeight])

    return (
      <WizardKeyboardScrollContext.Provider value={contextValue}>
        <ScrollView
          ref={setMergedRef}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          automaticallyAdjustKeyboardInsets={automaticallyAdjustKeyboardInsets}
          scrollEventThrottle={scrollEventThrottle}
          onScroll={handleScroll}
          contentContainerStyle={mergedContentStyle}
          {...rest}
        >
          {children}
        </ScrollView>
      </WizardKeyboardScrollContext.Provider>
    )
  }
)

WizardKeyboardScrollView.displayName = 'WizardKeyboardScrollView'
