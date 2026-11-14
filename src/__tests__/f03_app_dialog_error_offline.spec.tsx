import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { AxiosError, AxiosHeaders } from 'axios';
import { AppDialog } from '../components/ui/AppDialog';
import { GlobalDialog } from '../components/ui/GlobalDialog';
import { dialogService, useDialogStore } from '../store/dialogStore';
import { showErrorDialog } from '../utils/showErrorDialog';

jest.mock('@expo/vector-icons', () => {
  const ReactMock = require('react');
  const { Text: RNText } = require('react-native');
  return {
    Ionicons: (props: { name: string; color?: string; size?: number }) =>
      ReactMock.createElement(
        RNText,
        {
          testID: 'mock-dialog-ionicon',
          accessibilityLabel: `${props.name}|${props.color ?? ''}`,
        },
        props.name
      ),
  };
});

jest.mock('expo-linear-gradient', () => {
  const ReactMock = require('react');
  const { View: RNView } = require('react-native');
  return {
    LinearGradient: (props: { children?: React.ReactNode; style?: unknown }) =>
      ReactMock.createElement(RNView, { style: props.style }, props.children),
  };
});

function makeAxiosError(
  code: string,
  status?: number,
  data?: unknown
): AxiosError {
  const headers = new AxiosHeaders();
  const config = { headers };
  const response =
    status !== undefined
      ? {
          status,
          statusText: 'Error',
          headers,
          config,
          data: data ?? {},
        }
      : undefined;
  return new AxiosError('Request failed', code, config, undefined, response);
}

describe('F-03 M-035: AppDialog, GlobalDialog & showErrorDialog', () => {
  beforeEach(() => {
    useDialogStore.setState({
      visible: false,
      type: 'info',
      iconVariant: undefined,
      title: undefined,
      message: undefined,
      actions: [],
      options: [],
    });
  });

  it('Case 1: showErrorDialog maps ERR_NETWORK and ECONNABORTED to offline type with cloud-offline-outline icon', async () => {
    const netErr = makeAxiosError('ERR_NETWORK');
    showErrorDialog(netErr, 'تعذر الاتصال بالخادم');

    expect(useDialogStore.getState().visible).toBe(true);
    expect(useDialogStore.getState().type).toBe('offline');

    const { unmount } = await render(<GlobalDialog />);
    const icon = screen.getByTestId('mock-dialog-ionicon');
    expect(icon.props.children).toBe('cloud-offline-outline');

    const timeoutErr = makeAxiosError('ECONNABORTED');
    await act(async () => {
      showErrorDialog(timeoutErr, 'انتهت مهلة الاتصال', 'خطأ في الاتصال');
    });

    expect(useDialogStore.getState().type).toBe('offline');
    expect(useDialogStore.getState().title).toBe('خطأ في الاتصال');
    await unmount();
  });

  it('Case 2: showErrorDialog maps HTTP 500, 400 and unknown errors to error type with red close-circle-outline icon (never info)', async () => {
    const serverErr = makeAxiosError('ERR_BAD_RESPONSE', 500, {
      message: 'Internal error',
    });
    showErrorDialog(serverErr, 'فشل العملية');

    expect(useDialogStore.getState().type).toBe('error');
    expect(useDialogStore.getState().title).toBe('خطأ');

    const { unmount } = await render(<GlobalDialog />);
    const icon = screen.getByTestId('mock-dialog-ionicon');
    expect(icon.props.accessibilityLabel).toBe('close-circle-outline|#DC2626');

    const badReqErr = makeAxiosError('ERR_BAD_REQUEST', 400, {
      message: 'Validation failed',
    });
    await act(async () => {
      showErrorDialog(badReqErr, 'فشل التحقق');
    });
    expect(useDialogStore.getState().type).toBe('error');
    expect(useDialogStore.getState().message).toBe(
      'بيانات الطلب غير صالحة. يرجى التأكد من البيانات والمحاولة مجدداً.'
    );

    await act(async () => {
      showErrorDialog(new Error('Unexpected'), 'حدث خطأ غير متوقع');
    });
    expect(useDialogStore.getState().type).toBe('error');
    await unmount();
  });

  it('Case 3: preserves default info and explicit success without Arabic-text icon inference, and clears iconVariant between calls', async () => {
    // Message deliberately contains "خطأ" and "اتصال" to prove NO text inference happens
    dialogService.alert('تنبيه', 'يوجد خطأ في الاتصال بالإنترنت');
    expect(useDialogStore.getState().type).toBe('info');

    const { unmount } = await render(<GlobalDialog />);
    expect(screen.getByTestId('mock-dialog-ionicon').props.accessibilityLabel).toBe(
      'information-circle-outline|#0284C7'
    );

    await act(async () => {
      dialogService.alert('نجاح', 'تم تجاوز خطأ الاتصال بنجاح', 'success');
    });
    expect(useDialogStore.getState().type).toBe('success');
    expect(screen.getByTestId('mock-dialog-ionicon').props.accessibilityLabel).toBe(
      'checkmark-circle-outline|#16A34A'
    );

    // Ensure iconVariant set via show() does not leak into subsequent alert()
    await act(async () => {
      dialogService.show({
        type: 'confirm',
        iconVariant: 'warning',
        title: 'تغييرات غير محفوظة',
        message: 'هل تريد التجاهل؟',
        actions: [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'تجاهل والخروج', style: 'destructive' },
        ],
      });
    });
    expect(useDialogStore.getState().iconVariant).toBe('warning');

    await act(async () => {
      dialogService.alert('تنبيه', 'رسالة عادية');
    });
    expect(useDialogStore.getState().type).toBe('info');
    expect(useDialogStore.getState().iconVariant).toBeUndefined();
    await unmount();
  });

  it('Case 4: unsaved-changes confirm dialog with iconVariant="warning" shows amber alert-circle-outline while keeping destructive button red', async () => {
    const { unmount } = await render(
      <AppDialog
        visible
        type="confirm"
        iconVariant="warning"
        title="تغييرات غير محفوظة"
        message="لديك تغييرات لم يتم حفظها. هل تريد تجاهلها والخروج؟"
        actions={[
          { text: 'البقاء في الصفحة', style: 'cancel' },
          { text: 'تجاهل والخروج', style: 'destructive' },
        ]}
      />
    );

    const icon = screen.getByTestId('mock-dialog-ionicon');
    expect(icon.props.accessibilityLabel).toBe('alert-circle-outline|#D97706');

    const discardText = screen.getByText('تجاهل والخروج');
    const flatStyle = Array.isArray(discardText.props.style)
      ? Object.assign({}, ...discardText.props.style)
      : discardText.props.style;
    expect(flatStyle.color).toBe('#DC2626');
    await unmount();
  });

  it('Case 5: destructive confirmation without iconVariant shows red trash-outline icon', async () => {
    dialogService.confirm(
      'حذف الرسالة',
      'هل أنت متأكد من حذف هذه الرسالة؟',
      jest.fn(),
      'حذف',
      'إلغاء',
      true
    );

    expect(useDialogStore.getState().type).toBe('confirm');
    expect(useDialogStore.getState().iconVariant).toBeUndefined();

    const { unmount } = await render(<GlobalDialog />);
    const icon = screen.getByTestId('mock-dialog-ionicon');
    expect(icon.props.accessibilityLabel).toBe('trash-outline|#DC2626');
    await unmount();
  });
});
