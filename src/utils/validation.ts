export const validateEmail = (email: string): string | null => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) return 'البريد الإلكتروني مطلوب'
  if (!re.test(email)) return 'البريد الإلكتروني غير صالح'
  return null
}

export const validatePassword = (password: string): string | null => {
  if (!password) return 'كلمة المرور مطلوبة'
  if (password.length < 8) return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
  if (!/[A-Z]/.test(password)) return 'يجب أن تحتوي على حرف كبير'
  if (!/[0-9]/.test(password)) return 'يجب أن تحتوي على رقم'
  return null
}

export const validatePhone = (phone: string): string | null => {
  if (!phone) return 'رقم الهاتف مطلوب'
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length < 8) return 'رقم الهاتف غير صالح'
  return null
}

export const validateUsername = (username: string): string | null => {
  if (!username) return 'اسم المستخدم مطلوب'
  if (username.length < 3) return 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل'
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'اسم المستخدم يحتوي على أحرف غير مسموحة'
  return null
}

export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || !value.trim()) return `${fieldName} مطلوب`
  return null
}
