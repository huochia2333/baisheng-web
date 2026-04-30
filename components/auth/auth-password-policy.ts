export function getPasswordPolicyState(password: string) {
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-z]/i.test(password);
  const hasNumber = /\d/.test(password);

  return {
    hasLetter,
    hasMinLength,
    hasNumber,
    isValid: hasMinLength && hasLetter && hasNumber,
  };
}
