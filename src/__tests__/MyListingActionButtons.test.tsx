import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { MyListingActionButtons } from '../components/profile/my-listings/MyListingActionButtons';
import { MyListingItem } from '../types/my-listings.types';

const extractText = (node: any): string => {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && node.children) return extractText(node.children);
  return '';
};

jest.mock('../constants/colors', () => ({
  Colors: { primary: '#000' }
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('MyListingActionButtons', () => {
  const baseItem: MyListingItem = {
    id: '123',
    entityType: 'operator',
    title: 'Test Operator',
    updatedAt: new Date().toISOString(),
    normalizedStatus: 'active',
    rawStatus: 'ACTIVE',
    raw: {} as any,
    mapped: {} as any,
  };

  it('renders normal buttons when no pending deletion request', () => {
    let root: any;
    act(() => {
      root = TestRenderer.create(
        <MyListingActionButtons
          item={baseItem}
          onDelete={jest.fn()}
          onEdit={jest.fn()}
          isEditSupported={true}
        />
      );
    });
    
    const textOutput = extractText(root.toJSON());
    expect(textOutput).not.toContain('إلغاء طلب الحذف');
    expect(textOutput).not.toContain('قيد مراجعة الإدارة');
  });

  it('renders cancel button when pending deletion request is within 24 hours', () => {
    const fixedTime = new Date('2026-09-07T12:00:00Z').getTime();
    jest.spyOn(Date, 'now').mockImplementation(() => fixedTime);

    const itemWithRecentRequest: MyListingItem = {
      ...baseItem,
      pendingDeletionRequest: {
        id: 'req_1',
        status: 'PENDING',
        createdAt: new Date(fixedTime - 2 * 60 * 60 * 1000).toISOString(),
      }
    };

    let root: any;
    act(() => {
      root = TestRenderer.create(
        <MyListingActionButtons
          item={itemWithRecentRequest}
          onDelete={jest.fn()}
          onEdit={jest.fn()}
          isEditSupported={true}
          onCancelDeletionRequest={jest.fn()}
        />
      );
    });

    const textOutput = extractText(root.toJSON());
    expect(textOutput).toContain('إلغاء طلب الحذف');
    jest.restoreAllMocks();
  });

  it('renders locked label when pending deletion request is older than 24 hours', () => {
    const fixedTime = new Date('2026-09-07T12:00:00Z').getTime();
    jest.spyOn(Date, 'now').mockImplementation(() => fixedTime);

    const itemWithOldRequest: MyListingItem = {
      ...baseItem,
      pendingDeletionRequest: {
        id: 'req_1',
        status: 'PENDING',
        createdAt: new Date(fixedTime - 25 * 60 * 60 * 1000).toISOString(),
      }
    };

    let root: any;
    act(() => {
      root = TestRenderer.create(
        <MyListingActionButtons
          item={itemWithOldRequest}
          onDelete={jest.fn()}
          onEdit={jest.fn()}
          isEditSupported={true}
          onCancelDeletionRequest={jest.fn()}
        />
      );
    });

    const textOutput = extractText(root.toJSON());
    expect(textOutput).not.toContain('إلغاء طلب الحذف');
    expect(textOutput).toContain('قيد مراجعة الإدارة');
    jest.restoreAllMocks();
  });
});
