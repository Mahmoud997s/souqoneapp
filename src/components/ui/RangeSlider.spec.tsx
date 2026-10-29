import React from 'react';
import { render, screen, act, cleanup } from '@testing-library/react-native';
import { RangeSlider } from './RangeSlider';

describe('RangeSlider - Reset and Prop Synchronization', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders with initialLow and initialHigh values', async () => {
    await render(
      <RangeSlider
        min={0}
        max={30000}
        initialLow={1000}
        initialHigh={5000}
      />
    );

    expect(screen.getByDisplayValue('1000')).toBeTruthy();
    expect(screen.getByDisplayValue('5000')).toBeTruthy();

    const slider = screen.getByTestId('mock-multi-slider');
    expect(slider.props.values).toEqual([1000, 5000]);
  });

  it('resets text inputs and slider handles when initialLow/initialHigh change to undefined/defaults (مسح الفلاتر)', async () => {
    const { rerender } = await render(
      <RangeSlider
        min={0}
        max={30000}
        initialLow={1000}
        initialHigh={5000}
      />
    );

    expect(screen.getByDisplayValue('1000')).toBeTruthy();
    expect(screen.getByDisplayValue('5000')).toBeTruthy();

    // Parent clears filters: passes undefined for initialLow and initialHigh
    await rerender(
      <RangeSlider
        min={0}
        max={30000}
        initialLow={undefined}
        initialHigh={undefined}
      />
    );

    // MUST reset to min (0) and max (30000)
    expect(screen.getByDisplayValue('0')).toBeTruthy();
    expect(screen.getByDisplayValue('30000')).toBeTruthy();

    const slider = screen.getByTestId('mock-multi-slider');
    expect(slider.props.values).toEqual([0, 30000]);
  });

  it('resets slider and inputs after user drag when parent resets props', async () => {
    const onValuesChangeFinish = jest.fn();
    const { rerender } = await render(
      <RangeSlider
        min={0}
        max={30000}
        initialLow={1000}
        initialHigh={5000}
        onValuesChangeFinish={onValuesChangeFinish}
      />
    );

    const slider = screen.getByTestId('mock-multi-slider');

    // Simulate user dragging slider handles to 2500, 12000
    await act(async () => {
      slider.props.onValuesChange([2500, 12000]);
    });

    expect(screen.getByDisplayValue('2500')).toBeTruthy();
    expect(screen.getByDisplayValue('12000')).toBeTruthy();
    expect(screen.getByTestId('mock-multi-slider').props.values).toEqual([2500, 12000]);

    // Now parent triggers filter reset (initialLow=undefined, initialHigh=undefined)
    await rerender(
      <RangeSlider
        min={0}
        max={30000}
        initialLow={undefined}
        initialHigh={undefined}
        onValuesChangeFinish={onValuesChangeFinish}
      />
    );

    // MUST reset to 0 and 30000
    expect(screen.getByDisplayValue('0')).toBeTruthy();
    expect(screen.getByDisplayValue('30000')).toBeTruthy();
    expect(screen.getByTestId('mock-multi-slider').props.values).toEqual([0, 30000]);
  });

  it('syncs to new external filter values when props change to new numbers', async () => {
    const { rerender } = await render(
      <RangeSlider
        min={0}
        max={30000}
        initialLow={1000}
        initialHigh={5000}
      />
    );

    await rerender(
      <RangeSlider
        min={0}
        max={30000}
        initialLow={3000}
        initialHigh={15000}
      />
    );

    expect(screen.getByDisplayValue('3000')).toBeTruthy();
    expect(screen.getByDisplayValue('15000')).toBeTruthy();

    const slider = screen.getByTestId('mock-multi-slider');
    expect(slider.props.values).toEqual([3000, 15000]);
  });
});
