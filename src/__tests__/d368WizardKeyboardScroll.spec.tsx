import fs from 'fs';
import path from 'path';
import React from 'react';
import { Keyboard, Dimensions, TouchableOpacity } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import {
  WizardKeyboardScrollView,
  computeFocusedInputScrollDelta,
  useWizardKeyboardScroll,
} from '../components/wizard/WizardKeyboardScrollView';
import { AppInput } from '../components/ui/AppInput';
import { WIZARD_STICKY_FOOTER_CONTENT_HEIGHT } from '../components/ui/WizardStickyFooter';

const WIZARD_ENTRY_FILES = [
  'app/cars/new.tsx',
  'app/buses/new.tsx',
  'app/equipment/new.tsx',
  'app/equipment/operators/add.tsx',
  'app/parts/new.tsx',
  'app/services/new.tsx',
];

describe('D-368: Wizard keyboard scroll to focused field above keyboard + sticky footer', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('computeFocusedInputScrollDelta scrolls down when focused input is covered by keyboard + sticky footer', () => {
    const delta = computeFocusedInputScrollDelta({
      scrollViewY: 100,
      scrollViewHeight: 700,
      inputY: 460,
      inputHeight: 92, // multiline input: bottom = 552
      windowHeight: 844,
      keyboardHeight: 336, // keyboardTopY = 508, safeBottomY = 508 - 70 - 28 = 410
      footerClearance: WIZARD_STICKY_FOOTER_CONTENT_HEIGHT,
      extraGap: 28,
    });
    expect(delta).toBe(552 - (844 - 336 - WIZARD_STICKY_FOOTER_CONTENT_HEIGHT - 28));
    expect(delta).toBeGreaterThan(0);
  });

  it('computeFocusedInputScrollDelta returns 0 when focused input is already safely above footer + gap', () => {
    const delta = computeFocusedInputScrollDelta({
      scrollViewY: 100,
      scrollViewHeight: 700,
      inputY: 220,
      inputHeight: 44, // bottom = 264 < 410
      windowHeight: 844,
      keyboardHeight: 336,
      footerClearance: WIZARD_STICKY_FOOTER_CONTENT_HEIGHT,
      extraGap: 28,
    });
    expect(delta).toBe(0);
  });

  it('WizardKeyboardScrollView scrolls ScrollView above keyboard + footer when input focuses and keyboard opens', async () => {
    jest.useFakeTimers();
    const scrollToMock = jest.fn();
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 390, height: 844, scale: 3, fontScale: 1 });

    let keyboardDidShowCb: ((e: { endCoordinates: { height: number } }) => void) | undefined;
    jest.spyOn(Keyboard, 'addListener').mockImplementation(((event: string, cb: unknown) => {
      if (event === 'keyboardDidShow') {
        keyboardDidShowCb = cb as (e: { endCoordinates: { height: number } }) => void;
      }
      return { remove: jest.fn() };
    }) as never);

    const fakeFocusedInput = {
      measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => cb(16, 460, 358, 92),
    };

    function FocusTrigger() {
      const ctx = useWizardKeyboardScroll();
      return (
        <TouchableOpacity
          testID="trigger-focus"
          onPress={() => ctx?.notifyInputFocus(fakeFocusedInput)}
        />
      );
    }

    const scrollRef = React.createRef<never>();
    const { getByTestId } = await render(
      <WizardKeyboardScrollView ref={scrollRef} testID="wizard-ksv">
        <FocusTrigger />
      </WizardKeyboardScrollView>
    );

    if (scrollRef.current) {
      (scrollRef.current as unknown as { scrollTo: jest.Mock }).scrollTo = scrollToMock;
      (scrollRef.current as unknown as { measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void }).measureInWindow = (cb) => cb(0, 100, 390, 700);
    }

    act(() => {
      fireEvent.press(getByTestId('trigger-focus'));
      keyboardDidShowCb?.({ endCoordinates: { height: 336 } });
      jest.advanceTimersByTime(100);
    });

    expect(scrollToMock).toHaveBeenCalledWith(
      expect.objectContaining({
        y: 552 - (844 - 336 - WIZARD_STICKY_FOOTER_CONTENT_HEIGHT - 28),
        animated: true,
      })
    );
  });

  it('AppInput wires onFocus and multiline onContentSizeChange into WizardKeyboardScrollContext without breaking callbacks', async () => {
    const onFocusMock = jest.fn();
    const onContentSizeChangeMock = jest.fn();
    let keyboardDidShowCb: ((e: { endCoordinates: { height: number } }) => void) | undefined;
    jest.spyOn(Keyboard, 'addListener').mockImplementation(((event: string, cb: unknown) => {
      if (event === 'keyboardDidShow') {
        keyboardDidShowCb = cb as (e: { endCoordinates: { height: number } }) => void;
      }
      return { remove: jest.fn() };
    }) as never);

    const { getByPlaceholderText } = await render(
      <WizardKeyboardScrollView testID="wizard-ksv">
        <AppInput
          placeholder="الوصف"
          multiline
          onFocus={onFocusMock}
          onContentSizeChange={onContentSizeChangeMock}
        />
      </WizardKeyboardScrollView>
    );

    const input = getByPlaceholderText('الوصف');
    act(() => {
      keyboardDidShowCb?.({ endCoordinates: { height: 300 } });
      fireEvent(input, 'focus', { nativeEvent: {} });
      fireEvent(input, 'contentSizeChange', { nativeEvent: { contentSize: { width: 300, height: 120 } } });
    });

    expect(onFocusMock).toHaveBeenCalledTimes(1);
    expect(onContentSizeChangeMock).toHaveBeenCalledTimes(1);
  });

  it.each(WIZARD_ENTRY_FILES)('%s uses shared WizardKeyboardScrollView instead of bare ScrollView', (relPath) => {
    const fullPath = path.resolve(process.cwd(), relPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    expect(content).toContain('WizardKeyboardScrollView');
    expect(content).not.toMatch(/<ScrollView\b/);
  });
});
