import {
  authRegisterRequest,
  authLoginRequest,
  adminUserDetailsRequest,
  clearRequest
} from './testRoutes';

interface TokenId {
  token: string
}
const ERROR = { error: expect.any(String) };
let user: TokenId;

beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
});
describe('adminAuthLogin', () => {
  describe('error cases', () => {
    test('Email address does not exist', () => {
      expect(authLoginRequest('emailFail@gmail.com', 'password1')).toStrictEqual(ERROR);
    });

    describe('Password not correct for given email (but correct for another email)', () => {
      beforeEach(() => {
        authRegisterRequest('email2@gmail.com', 'password2', 'first', 'last');
      });

      test('Error output for incorrect password', () => {
        expect(authLoginRequest('email@gmail.com', 'password2')).toStrictEqual(ERROR);
      });

      test('Correct incrementation of numFailedPasswordsSinceLastLogin', () => {
        authLoginRequest('email@gmail.com', 'password2');
        expect(
          adminUserDetailsRequest(user.token).body.user.numFailedPasswordsSinceLastLogin
        ).toBe(1);
      });
    });
  });

  describe('success cases', () => {
    test('Testing authUserId output', () => {
      expect(authLoginRequest('email@gmail.com', 'password1')).toStrictEqual(
        { token: expect.any(String) });
    });

    test('Correct incrementation of numSuccessfulLogins', () => {
      authLoginRequest('email@gmail.com', 'password1');
      expect(
        adminUserDetailsRequest(user.token).body.user.numSuccessfulLogins
      ).toBe(2);
    });
    test('Correct reset of numFailedPasswordsSinceLastLogin', () => {
      authLoginRequest('email@gmail.com', 'password1');
      expect(
        adminUserDetailsRequest(user.token).body.user.numFailedPasswordsSinceLastLogin
      ).toBe(0);
    });
  });
});
