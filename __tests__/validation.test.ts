import {
  validateEmail,
  validateNickname,
  validatePassword,
  validatePhone,
  validateUsername,
} from '../src/utils/validation';

describe('회원가입 입력 검증', () => {
  test('휴대폰 번호는 010-xxxx-xxxx 형식만 허용한다', () => {
    expect(validatePhone('010-1234-5678')).toEqual({ valid: true });
    expect(validatePhone('011-1234-5678')).toEqual({
      valid: false,
      error: '휴대폰 번호는 010-1234-5678 형식으로 입력해 주세요.',
    });
  });

  test('이메일은 기본 이메일 형식을 요구한다', () => {
    expect(validateEmail('user@example.com')).toEqual({ valid: true });
    expect(validateEmail('not-an-email')).toEqual({
      valid: false,
      error: '이메일 주소를 올바른 형식으로 입력해 주세요.',
    });
    expect(validateEmail('user@example.com', true)).toEqual({
      valid: false,
      error: '이미 가입된 이메일입니다.',
    });
  });

  test('비밀번호는 8자 이상이며 영문, 숫자, 특수문자를 포함해야 한다', () => {
    expect(validatePassword('Yellow1!')).toEqual({ valid: true });
    expect(validatePassword('yellowball')).toEqual({
      valid: false,
      error: '비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.',
    });
  });

  test('아이디는 영문 소문자, 숫자, 언더스코어 3~20자만 허용하고 중복을 막는다', () => {
    expect(validateUsername('yellow_01')).toEqual({ valid: true });
    expect(validateUsername('Yellow01')).toEqual({
      valid: false,
      error:
        '아이디는 영문 소문자, 숫자, 언더스코어만 사용해 3~20자로 입력해 주세요.',
    });
    expect(validateUsername('yellow_01', true)).toEqual({
      valid: false,
      error: '이미 사용 중인 아이디입니다.',
    });
  });

  test('닉네임은 2~10자로 입력해야 한다', () => {
    expect(validateNickname('옐로볼')).toEqual({ valid: true });
    expect(validateNickname('옐')).toEqual({
      valid: false,
      error: '닉네임은 2~10자로 입력해 주세요.',
    });
  });
});
