import fs from 'fs';
import path from 'path';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { WizardCard } from '../components/ui/WizardCard';
import { Colors } from '../constants/colors';

const WIZARD_ENTRY_FILES = [
  'app/cars/new.tsx',
  'app/buses/new.tsx',
  'app/equipment/new.tsx',
  'app/equipment/operators/add.tsx',
  'app/parts/new.tsx',
  'app/services/new.tsx',
];

describe('D-367: Wizard cards & draftBar use white Colors.surface like intro card', () => {
  it('WizardCard renders backgroundColor Colors.surface with border and no GlassSurface', async () => {
    const { getByTestId, queryByTestId } = await render(
      <WizardCard testID="d367-card" title="بيانات">
        <Text>محتوى</Text>
      </WizardCard>
    );

    const card = getByTestId('d367-card');
    const style = StyleSheet.flatten(card.props.style);
    expect(style.backgroundColor).toBe(Colors.surface);
    expect(style.borderColor).toBe(Colors.border);
    expect(style.borderWidth).toBe(1);
    expect(queryByTestId('d367-card-surface')).toBeNull();
    expect(queryByTestId('mock-blur-view')).toBeNull();
  });

  it.each(WIZARD_ENTRY_FILES)('%s draftBar uses Colors.surface instead of Colors.inputBg', (relPath) => {
    const fullPath = path.resolve(process.cwd(), relPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const match = content.match(/draftBar:\s*\{[\s\S]*?\n\s*\},/);
    expect(match).not.toBeNull();
    const block = match![0];
    expect(block).toContain('backgroundColor: Colors.surface');
    expect(block).not.toContain('backgroundColor: Colors.inputBg');
  });
});
