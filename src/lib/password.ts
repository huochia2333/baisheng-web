export const passwordRuleText = '密码至少需要 6 位，且必须同时包含字母和数字。'

export function hasLetterAndNumber(password: string) {
  return /[A-Za-z]/.test(password) && /\d/.test(password)
}
