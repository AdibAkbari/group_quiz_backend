import {
  authRegisterRequest,
  authLoginRequest,
  adminUserDetailsRequest,
  clearRequest
} from './testRoutes';
import {
  TokenId
} from '../interfaces'


const ERROR = { error: expect.any(String) };
 let user: TokenId;

beforeEach(() => {
  clearRequest();
  let user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
  authRegisterRequest('email@gmail.com', 'password1', 'first', 'last');
});
describe('adminAuthLogin', () => {
  describe('error cases', () => {
    test('Email address does not exist', () => {
      const authLogin = authLoginRequest('emailFail@gmail.com', 'password1');
      expect(authLogin.body).toStrictEqual(ERROR);
      expect(authLogin.statusCode).toStrictEqual(400);
    });

    describe('Password not correct for given email (but correct for another email)', () => {
      beforeEach(() => {
        authRegisterRequest('email2@gmail.com', 'password2', 'first', 'last');
      });

      test('Error output for incorrect password', () => {
        const authLogin = authLoginRequest('email@gmail.com', 'password2');
        expect(authLogin.body).toStrictEqual(ERROR);
        expect(authLogin.statusCode).toStrictEqual(400);
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
      const authLogin = authLoginRequest('email@gmail.com', 'password1');
      expect(authLogin.body).toStrictEqual({ token: expect.any(String) });
      expect(authLogin.statusCode).toStrictEqual(200);
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
