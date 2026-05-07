export type ValidationResult = {
  valid: boolean;
  error?: string;
};

const valid = (): ValidationResult => ({ valid: true });
const invalid = (error: string): ValidationResult => ({ valid: false, error });

export const validatePhone = (phone: string): ValidationResult => {
  if (/^010-\d{4}-\d{4}$/.test(phone.trim())) {
    return valid();
  }

  return invalid('휴대폰 번호는 010-1234-5678 형식으로 입력해 주세요.');
};

export const validateEmail = (
  email: string,
  isDuplicated = false,
): ValidationResult => {
  const normalizedEmail = email.trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return invalid('이메일 주소를 올바른 형식으로 입력해 주세요.');
  }

  if (isDuplicated) {
    return invalid('이미 가입된 이메일입니다.');
  }

  return valid();
};

export const validatePassword = (password: string): ValidationResult => {
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (password.length >= 8 && hasLetter && hasNumber && hasSpecial) {
    return valid();
  }

  return invalid('비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.');
};

export const validateUsername = (
  username: string,
  isDuplicated = false,
): ValidationResult => {
  if (!/^[a-z0-9_]{3,20}$/.test(username.trim())) {
    return invalid(
      '아이디는 영문 소문자, 숫자, 언더스코어만 사용해 3~20자로 입력해 주세요.',
    );
  }

  if (isDuplicated) {
    return invalid('이미 사용 중인 아이디입니다.');
  }

  return valid();
};

export const validateNickname = (nickname: string): ValidationResult => {
  const normalizedNickname = nickname.trim();

  if (normalizedNickname.length >= 2 && normalizedNickname.length <= 10) {
    return valid();
  }

  return invalid('닉네임은 2~10자로 입력해 주세요.');
};
