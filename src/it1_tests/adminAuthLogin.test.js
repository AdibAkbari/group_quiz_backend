import {
  authRegisterRequest,
  authLoginRequest,
  // userDetailsRequest
} from './testRoutes';
import { clear } from '../other';

const ERROR = { error: expect.any(String) };
let user;
beforeEach(() => {
  clear();
  user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last');
});
describe("adminAuthLogin", () => {

  describe("error cases", () => {
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

      test.skip('Correct incrementation of numFailedPasswordsSinceLastLogin', () => {
        authLoginRequest('email@gmail.com', 'password2');
        expect(
          adminUserDetails(user.authUserId).user.numFailedPasswordsSinceLastLogin
        ).toBe(1);
      });
    });
  });

  describe('success cases', () => {
    test('Testing authUserId output', () => {
      expect(authLoginRequest('email@gmail.com', 'password1')).toStrictEqual(
        { token: expect.any(String) });
    });

    test.skip('Correct incrementation of numSuccessfulLogins', () => {
      authLoginRequest('email@gmail.com', 'password1');
      expect(
        adminUserDetails(user.authUserId).user.numSuccessfulLogins
      ).toBe(2);
    });
    test.skip('Correct reset of numFailedPasswordsSinceLastLogin', () => {
      authLoginRequest('email@gmail.com', 'password1');
      expect(
        adminUserDetails(user.authUserId).user.numFailedPasswordsSinceLastLogin
      ).toBe(0);
    });
  });
});