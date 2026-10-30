// Password rule of email accounts, shared by the sign-up form and the server.

export type PasswordProblem = 'length' | 'mix';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** Why the password is not acceptable, or null: 8–128 characters with letters and digits. */
export function passwordProblem(password: string): PasswordProblem | null {
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) return 'length';
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return 'mix';
  return null;
}

export function passwordProblemText(problem: PasswordProblem, zh: boolean): string {
  if (problem === 'length') return zh ? '密码长度须为 8–128 位' : 'Use 8–128 characters';
  return zh ? '密码须同时包含字母和数字' : 'Use both letters and digits';
}
