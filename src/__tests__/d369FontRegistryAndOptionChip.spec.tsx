import fs from 'fs';
import path from 'path';
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { WizardOptionChip } from '../components/wizard/WizardOptionChip';
import { Colors } from '../constants/colors';

function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
      results.push(...collectSourceFiles(full));
    } else if (
      /\.(ts|tsx)$/.test(entry.name) &&
      !/\.(spec|test)\.(ts|tsx)$/.test(entry.name)
    ) {
      results.push(full);
    }
  }
  return results;
}

describe('D-369: Registered fontFamily guard & WizardOptionChip', () => {
  it('every literal fontFamily in src/ and app/ is registered in app/_layout.tsx', () => {
    const root = process.cwd();
    const layoutContent = fs.readFileSync(path.join(root, 'app/_layout.tsx'), 'utf8');
    const registeredMatches = layoutContent.match(/Almarai_[A-Za-z0-9_]+/g) ?? [];
    const registeredFonts = new Set(registeredMatches);
    expect(registeredFonts.size).toBeGreaterThanOrEqual(3);

    const files = [
      ...collectSourceFiles(path.join(root, 'src')),
      ...collectSourceFiles(path.join(root, 'app')),
    ];

    const violations: string[] = [];
    const fontLiteralRe = /fontFamily\s*:\s*['"]([^'"]+)['"]/g;

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      let match: RegExpExecArray | null;
      while ((match = fontLiteralRe.exec(content)) !== null) {
        const fontName = match[1];
        if (!registeredFonts.has(fontName)) {
          violations.push(`${path.relative(root, file)}: unregistered fontFamily "${fontName}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('WizardOptionChip renders TopBarGlassSurface ice-control when unselected and Colors.primary + white text when selected, without flex: 1', async () => {
    const onPress = jest.fn();
    const unselectedRender = await render(
      <WizardOptionChip testID="opt-chip" label="أوتوماتيك" selected={false} onPress={onPress} />
    );

    expect(unselectedRender.getByTestId('opt-chip-glass-layers')).toBeTruthy();
    expect(unselectedRender.getByTestId('opt-chip-glass-backing')).toBeTruthy();
    const unselectedBtnStyle = StyleSheet.flatten(unselectedRender.getByTestId('opt-chip').props.style);
    expect(unselectedBtnStyle.flex).toBeUndefined();
    const unselectedTextStyle = StyleSheet.flatten(unselectedRender.getByText('أوتوماتيك').props.style);
    expect(unselectedTextStyle.fontFamily).toBe('Almarai_400Regular');

    fireEvent.press(unselectedRender.getByTestId('opt-chip'));
    expect(onPress).toHaveBeenCalledTimes(1);

    const selectedRender = await render(
      <WizardOptionChip testID="opt-chip-sel" label="أوتوماتيك" selected onPress={onPress} />
    );
    expect(selectedRender.queryByTestId('opt-chip-sel-glass-layers')).toBeNull();
    const selectedBtnStyle = StyleSheet.flatten(selectedRender.getByTestId('opt-chip-sel').props.style);
    expect(selectedBtnStyle.backgroundColor).toBe(Colors.primaryStrong);
    expect(selectedBtnStyle.flex).toBeUndefined();
    const selectedTextStyle = StyleSheet.flatten(selectedRender.getByText('أوتوماتيك').props.style);
    expect(selectedTextStyle.fontFamily).toBe('Almarai_700Bold');
    expect(selectedTextStyle.color).toBe(Colors.surface);
  });
});
