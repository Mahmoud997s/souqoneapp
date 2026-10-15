import { router } from 'expo-router';
import { dialogService } from '../store/dialogStore';

export const PROFILE_PHONE_REQUIRED_CODE = 'PROFILE_PHONE_REQUIRED';
export const PROFILE_PHONE_REQUIRED_MESSAGE =
  'لازم تضيف رقم هاتفك في بروفايلك الأول عشان المشترين يقدروا يتواصلوا معاك';

export function isProfilePhoneRequiredError(error: any): boolean {
  const data = error?.response?.data;
  if (!data) return false;
  if (data.code === PROFILE_PHONE_REQUIRED_CODE) return true;
  if (data.message?.code === PROFILE_PHONE_REQUIRED_CODE) return true;
  if (
    typeof data.message === 'string' &&
    (data.message === PROFILE_PHONE_REQUIRED_CODE ||
      data.message.includes('لازم تضيف رقم هاتفك'))
  ) {
    return true;
  }
  return false;
}

export function promptProfilePhoneRequired() {
  dialogService.confirm(
    'إضافة رقم الهاتف مطلوبة',
    PROFILE_PHONE_REQUIRED_MESSAGE,
    () => {
      router.push('/profile/edit-profile' as any);
    },
    'أضف رقمك',
    'إلغاء'
  );
}
