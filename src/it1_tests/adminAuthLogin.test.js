import {
  adminAuthRegister,
  adminAuthLogin,
  adminUserDetails
} from '../auth.js';
import { clear } from '../other.js';

const ERROR = { error: expect.any(String) };
let user;
beforeEach(() => {
  clear();
  user = adminAuthRegister('email@gmail.com', 'password1', 'first', 'last');
});

test('Email address does not exist', () => {
  expect(adminAuthLogin('emailFail@gmail.com', 'password1')).toStrictEqual(ERROR);
});

describe('Password not correct for given email (but correct for another email)', () => {
  beforeEach(() => {
    adminAuthRegister('email2@gmail.com', 'password2', 'first', 'last');
  });

  test('Error output for incorrect password', () => {
    expect(adminAuthLogin('email@gmail.com', 'password2')).toStrictEqual(ERROR);
  });

  test('Correct incrementation of numFailedPasswordsSinceLastLogin', () => {
    adminAuthLogin('email@gmail.com', 'password2');
    expect(
      adminUserDetails(user.authUserId).user.numFailedPasswordsSinceLastLogin
    ).toBe(1);
  });
});

describe('Valid email and password', () => {
  test('Testing authUserId output', () => {
    expect(adminAuthLogin('email@gmail.com', 'password1')).toStrictEqual(
      { authUserId: expect.any(Number) });
  });

  test('Correct incrementation of numSuccessfulLogins', () => {
    adminAuthLogin('email@gmail.com', 'password1');
    expect(
      adminUserDetails(user.authUserId).user.numSuccessfulLogins
    ).toBe(2);
  });
  test('Correct reset of numFailedPasswordsSinceLastLogin', () => {
    adminAuthLogin('email@gmail.com', 'password1');
    expect(
      adminUserDetails(user.authUserId).user.numFailedPasswordsSinceLastLogin
    ).toBe(0);
  });
});
