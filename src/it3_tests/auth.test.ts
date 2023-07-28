import {
  clearRequest,
  authRegisterRequest,
  authLoginRequest,
  authLogoutRequest,
  adminUserDetailsRequest,
  updateUserDetailsRequest,
  updateUserPasswordRequest,
  adminUserDetailsRequestV1,
  authLogoutRequestV1,
  updateUserDetailsRequestV1,
  updateUserPasswordRequestV1,
} from './it3_testRoutes';
import HTTPError from 'http-errors';
import {
  TokenId
} from '../interfaces';

const ERROR = { error: expect.any(String) };

beforeEach(() => {
  clearRequest();
});

// 1. AuthLogin //
describe('AuthLogin', () => {
  let user: TokenId;
  beforeEach(() => {
    clearRequest();
    user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
    authRegisterRequest('email@gmail.com', 'password1', 'first', 'last');
  });

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
          adminUserDetailsRequestV1(user.token).body.user.numFailedPasswordsSinceLastLogin
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
        adminUserDetailsRequestV1(user.token).body.user.numSuccessfulLogins
      ).toBe(2);
    });
    test('Correct reset of numFailedPasswordsSinceLastLogin', () => {
      authLoginRequest('email@gmail.com', 'password1');
      expect(
        adminUserDetailsRequestV1(user.token).body.user.numFailedPasswordsSinceLastLogin
      ).toBe(0);
    });
  });
});

// 2. AuthLogout //
describe('AuthLogout', () => {
  beforeEach(() => {
    clearRequest();
  });

  describe('error cases tests', () => {
    test.each([
      { testName: 'token just letters', token: 'hello' },
      { testName: 'token starts with letters', token: 'a54364' },
      { testName: 'token ends with letters', token: '54356s' },
      { testName: 'token includes letter', token: '5436h86' },
      { testName: 'token has space', token: '4324 757' },
      { testName: 'token only whitespace', token: '  ' },
      { testName: 'token has other characters', token: '6365,53' },
      { testName: 'empty string', token: '' },
      { testName: 'token has decimal point', token: '53.74' },
      { testName: 'token has negative sign', token: '-37294' },
      { testName: 'token has positive sign', token: '+38594' },
    ])('invalid token structure: $testName', ({ token }) => {
      expect(() => authLogoutRequest(token)).toThrow(HTTPError[401]);
    });

    test('user created then logged out', () => {
      const user = authRegisterRequest('email@gmail.com', 'password1', 'nameFirst', 'nameLast').body;
      const userToken = user.token;
      authLogoutRequest(userToken);
      expect(() => authLogoutRequest(userToken)).toThrow(HTTPError[403]);
    });

    test('token never created', () => {
      expect(() => authLogoutRequest('12345')).toThrow(HTTPError[403]);
    });
  });

  describe('successful cases', () => {
    test('one token created', () => {
      const user = authRegisterRequest('email@gmail.com', 'password1', 'nameFirst', 'nameLast').body;
      expect(authLogoutRequest(user.token)).toStrictEqual({ });
    });

    test('two tokens created', () => {
      authRegisterRequest('email@gmail.com', 'password1', 'nameFirst', 'nameLast');
      const user2 = authRegisterRequest('email123@gmail.com', 'password1', 'nameFirst', 'nameLast').body;

      expect(authLogoutRequest(user2.token)).toStrictEqual({ });
    });
  });

  describe('V1 WRAPPERS', () => {
    test('user created then logged out', () => {
      const user = authRegisterRequest('email@gmail.com', 'password1', 'nameFirst', 'nameLast').body;
      const userToken = user.token;
      authLogoutRequestV1(userToken);
      const logout = authLogoutRequestV1(userToken);
      expect(logout.body).toStrictEqual(ERROR);
      expect(logout.statusCode).toStrictEqual(403);
    });

    test.each([
      { testName: 'token just letters', token: 'hello' },
      { testName: 'token starts with letters', token: 'a54364' },
    ])('invalid token structure: $testName', ({ token }) => {
      const logout = authLogoutRequestV1(token);
      expect(logout.body).toStrictEqual(ERROR);
      expect(logout.statusCode).toStrictEqual(401);
    });
  });
});

// 3. AuthRegister //
describe('AuthRegister', () => {
  describe('valid input authRegisterRequestV1 tests', () => {
    test.each([
      {
        testName: 'valid input',
        email: 'email@gmail.com',
        pass: 'password1',
        first: 'nameFirst',
        last: 'nameLast'
      },
      {
        testName: 'valid input 2',
        email: 'email3@hotmail.com',
        pass: 'passw123',
        first: 'na',
        last: 'na'
      },
      {
        testName: 'valid input 3',
        email: 'email4@yahoo.com',
        pass: 'longPassword12345',
        first: 'nameIsExactlyTwentyy',
        last: 'lastIsExactlyTwentyy'
      },
      {
        testName: 'valid input 4',
        email: 'email10@gmail.com',
        pass: 'password1',
        first: 'name- First\'s',
        last: 'name- Last\'s'
      },
    ])('$testName', ({ email, pass, first, last }) => {
      const user = authRegisterRequest(email, pass, first, last);
      expect(user.body).toStrictEqual({ token: expect.any(String) });
      expect(parseInt(user.body.token)).toStrictEqual(expect.any(Number));
      expect(user.statusCode).toBe(200);
    });
  });

  describe('test for errors for adminAuthRegister', () => {
    test.each([
      {
        testName: 'empty email',
        email: ''
      },
      {
        testName: 'invalid email',
        email: 'email'
      },
    ])('$testName: $email', ({ email }) => {
      const user = authRegisterRequest(email, 'password1', 'nameFirst', 'nameLast');
      expect(user.statusCode).toBe(400);
      expect(user.body).toStrictEqual(ERROR);
    });

    test.each([
      {
        testName: 'empty nameLast',
        last: ''
      },
      {
        testName: 'invalid nameLast',
        last: 'nameLast$'
      },
      {
        testName: 'invalid nameLast 2',
        last: 'nameLast1'
      },
      {
        testName: 'nameLast too short',
        last: 'n'
      },
      {
        testName: 'nameLast too long',
        last: 'nameLastIsMoreThanTwenty'
      },
      {
        testName: 'nameLast whitespace',
        last: '    '
      },
    ])('$testName: $last', ({ last }) => {
      const user = authRegisterRequest('email2@gmail.com', 'password1', 'nameFirst', last);
      expect(user.statusCode).toBe(400);
      expect(user.body).toStrictEqual(ERROR);
    });

    test.each([
      {
        testName: 'empty nameFirst',
        first: ''
      },
      {
        testName: 'invalid nameFirst',
        first: 'nameFirst$'
      },
      {
        testName: 'invalid nameFirst 2',
        first: 'nameFirst$()1'
      },
      {
        testName: 'nameFirst too short',
        first: 'n'
      },
      {
        testName: 'nameFirst too long',
        first: 'nameFirstIsMoreThanTwenty'
      },
      {
        testName: 'nameFirst whitespace',
        first: '    '
      },
    ])('$testName: $first', ({ first }) => {
      const user = authRegisterRequest('email2@gmail.com', 'password1', first, 'nameLast');
      expect(user.statusCode).toBe(400);
      expect(user.body).toStrictEqual(ERROR);
    });

    test.each([
      {
        testName: 'empty password',
        pass: ''
      },
      {
        testName: 'password too short',
        pass: 'pass1'
      },
      {
        testName: 'password must contain number',
        pass: 'password'
      },
      {
        testName: 'password must contain letter',
        pass: '12345678'
      },
    ])('$testName: $pass', ({ pass }) => {
      const user = (authRegisterRequest('email2@gmail.com', pass, 'nameFirst', 'nameLast'));
      expect(user.statusCode).toBe(400);
      expect(user.body).toStrictEqual(ERROR);
    });

    test('email already used', () => {
      authRegisterRequest('email@gmail.com', 'password1', 'nameFirst', 'nameLast');
      expect(authRegisterRequest('email@gmail.com', 'password12', 'nameFirsts', 'nameLasts').statusCode).toBe(400);
    });
  });
});

// 4. UserDetails //
describe('UserDetails', () => {
  describe('Token invalid', () => {
    test.each([
      { testName: 'token just letters', token: 'hello' },
      { testName: 'token starts with letters', token: 'a54364' },
      { testName: 'token ends with letters', token: '54356s' },
      { testName: 'token includes letter', token: '5436h86' },
      { testName: 'token has space', token: '4324 757' },
      { testName: 'token only whitespace', token: '  ' },
      { testName: 'token has other characters', token: '6365,53' },
      { testName: 'empty string', token: '' },
      { testName: 'token has decimal point', token: '53.74' },
      { testName: 'token has negative sign', token: '-37294' },
      { testName: 'token has positive sign', token: '+38594' },
    ])('token is not a valid structure: $testName', ({ token }) => {
      expect(() => adminUserDetailsRequest(token)).toThrow(HTTPError[401]);
    });

    test('Nobody logged in', () => {
      expect(() => adminUserDetailsRequest('7')).toThrow(HTTPError[403]);
    });

    test('TokenId not logged in', () => {
      const user = authRegisterRequest('email@gmail.com', 'password1', 'NameFirst', 'NameLast').body;
      expect(() => adminUserDetailsRequest(user.token + 1)).toThrow(HTTPError[403]);
    });
  });

  describe('Only one user registered', () => {
    let user: TokenId;
    beforeEach(() => {
      user = authRegisterRequest('email@gmail.com', 'password1', 'Firstname', 'Lastname').body;
    });

    test('Just registered', () => {
      expect(adminUserDetailsRequest(user.token)).toStrictEqual({
        user: {
          userId: expect.any(Number),
          name: 'Firstname Lastname',
          email: 'email@gmail.com',
          numSuccessfulLogins: 1,
          numFailedPasswordsSinceLastLogin: 0
        }
      });
    });
  });

  describe('multiple users registered', () => {
    let user1: TokenId;
    let user2: TokenId;
    let user3: TokenId;
    beforeEach(() => {
      user1 = authRegisterRequest('email1@gmail.com', 'password1', 'FirstnameA', 'LastnameA').body;
      user2 = authRegisterRequest('email2@gmail.com', 'password2', 'FirstnameB', 'LastnameB').body;
      user3 = authRegisterRequest('email3@gmail.com', 'password3', 'FirstnameC', 'LastnameC').body;
    });

    test('Finding user 1', () => {
      expect(adminUserDetailsRequest(user1.token)).toStrictEqual({
        user: {
          userId: expect.any(Number),
          name: 'FirstnameA LastnameA',
          email: 'email1@gmail.com',
          numSuccessfulLogins: expect.any(Number),
          numFailedPasswordsSinceLastLogin: expect.any(Number)
        }
      });
    });

    test('Finding user 2', () => {
      expect(adminUserDetailsRequest(user2.token)).toStrictEqual({
        user: {
          userId: expect.any(Number),
          name: 'FirstnameB LastnameB',
          email: 'email2@gmail.com',
          numSuccessfulLogins: expect.any(Number),
          numFailedPasswordsSinceLastLogin: expect.any(Number)
        }
      });
    });

    test('Finding user 3', () => {
      expect(adminUserDetailsRequest(user3.token)).toStrictEqual({
        user: {
          userId: expect.any(Number),
          name: 'FirstnameC LastnameC',
          email: 'email3@gmail.com',
          numSuccessfulLogins: expect.any(Number),
          numFailedPasswordsSinceLastLogin: expect.any(Number)
        }
      });
    });
  });

  describe('V1 WRAPPERS', () => {
    test('Nobody logged in', () => {
      const userDetails = adminUserDetailsRequestV1('7');
      expect(userDetails.body).toStrictEqual(ERROR);
      expect(userDetails.statusCode).toStrictEqual(403);
    });

    test.each([
      { testName: 'token just letters', token: 'hello' },
      { testName: 'token starts with letters', token: 'a54364' },
    ])('token is not a valid structure: $testName', ({ token }) => {
      const details = adminUserDetailsRequestV1(token);
      expect(details.body).toStrictEqual(ERROR);
      expect(details.statusCode).toStrictEqual(401);
    });
  });
});

// 5. UpdateUserDetails //
describe('UpdateUserDetails', () => {
  let user: TokenId;

  beforeEach(() => {
    clearRequest();
    user = authRegisterRequest('email@gmail.com', 'password1', 'nameFirst', 'nameLast').body;
  });

  describe('Error Cases: updateUserDetails', () => {
    test('Email used by another user', () => {
      const user2 = authRegisterRequest('email2@gmail.com', 'password1', 'NameFirst', 'NameLast').body;
      expect(() => updateUserDetailsRequest(user2.token, 'email@gmail.com', 'NameFirst', 'NameLast')).toThrow(HTTPError[400]);
    });

    test('Email invalid', () => {
      expect(() => updateUserDetailsRequest(user.token, 'email', 'NameFirst', 'NameLast')).toThrow(HTTPError[400]);
    });

    test.each([
      { testName: 'empty nameFirst', first: '' },
      { testName: 'invalid nameFirst', first: 'nameFirst$' },
      { testName: 'invalid nameFirst 2', first: 'nameFirst$()1' },
      { testName: 'nameFirst too short', first: 'n' },
      { testName: 'nameFirst too long', first: 'nameFirstIsMoreThanTwenty' },
      { testName: 'nameFirst whitespace', first: '    ' },
    ])('$testName: $first', ({ first }) => {
      expect(() => updateUserDetailsRequest(user.token, 'email123@gmail.com', first, 'NameLast')).toThrow(HTTPError[400]);
    });

    test.each([
      { testName: 'empty nameLast', last: '' },
      { testName: 'invalid nameLast', last: 'nameLast$' },
      { testName: 'invalid nameLast 2', last: 'nameLast1' },
      { testName: 'nameLast too short', last: 'n' },
      { testName: 'nameLast too long', last: 'nameLastIsMoreThanTwenty' },
      { testName: 'nameLast whitespace', last: '    ' },
    ])('$testName: $last', ({ last }) => {
      expect(() => updateUserDetailsRequest(user.token, 'email123@gmail.com', 'nameFirst', last)).toThrow(HTTPError[400]);
    });

    test.each([
      { testName: 'token just letters', token: 'hello' },
      { testName: 'token starts with letters', token: 'a54364' },
      { testName: 'token ends with letters', token: '54356s' },
      { testName: 'token includes letter', token: '5436h86' },
      { testName: 'token has space', token: '4324 757' },
      { testName: 'token only whitespace', token: '  ' },
      { testName: 'token has other characters', token: '6365,53' },
      { testName: 'empty string', token: '' },
      { testName: 'token has decimal point', token: '53.74' },
      { testName: 'token has negative sign', token: '-37294' },
      { testName: 'token has positive sign', token: '+38594' },
    ])('invalid token: $testName', ({ token }) => {
      expect(() => updateUserDetailsRequest(token, 'email123@gmail.com', 'nameFirst', 'nameLast')).toThrow(HTTPError[401]);
    });

    test('tokenId not logged in', () => {
      expect(() => updateUserDetailsRequest('12345', 'email123@gmail.com', 'nameFirst', 'nameLast')).toThrow(HTTPError[403]);
    });
  });

  describe('Valid Inputs', () => {
    test('update all fields', () => {
      const update = updateUserDetailsRequest(user.token, 'newEmail@gmail.com', 'newFirst', 'newLast');
      expect(update).toStrictEqual({ });
      const userDetails = adminUserDetailsRequest(user.token);
      expect(userDetails).toStrictEqual({
        user: {
          userId: expect.any(Number),
          name: 'newFirst newLast',
          email: 'newEmail@gmail.com',
          numSuccessfulLogins: 1,
          numFailedPasswordsSinceLastLogin: 0
        }
      });
    });

    test('keep all same', () => {
      const update = updateUserDetailsRequest(user.token, 'email@gmail.com', 'nameFirst', 'nameLast');
      expect(update).toStrictEqual({ });
      const userDetails = adminUserDetailsRequest(user.token);
      expect(userDetails).toStrictEqual({
        user: {
          userId: expect.any(Number),
          name: 'nameFirst nameLast',
          email: 'email@gmail.com',
          numSuccessfulLogins: 1,
          numFailedPasswordsSinceLastLogin: 0
        }
      });
    });
  });

  describe('V1 WRAPPERS', () => {
    test('Email used by another user', () => {
      const user2 = authRegisterRequest('email2@gmail.com', 'password1', 'NameFirst', 'NameLast').body;
      const update = updateUserDetailsRequestV1(user2.token, 'email@gmail.com', 'NameFirst', 'NameLast');
      expect(update.body).toStrictEqual(ERROR);
      expect(update.statusCode).toStrictEqual(400);
    });

    test.each([
      { testName: 'token just letters', token: 'hello' },
      { testName: 'token starts with letters', token: 'a54364' },
    ])('invalid token: $testName', ({ token }) => {
      const update = updateUserDetailsRequestV1(token, 'email123@gmail.com', 'nameFirst', 'nameLast');
      expect(update.statusCode).toBe(401);
      expect(update.body).toStrictEqual(ERROR);
    });

    test('tokenId not logged in', () => {
      const update = updateUserDetailsRequestV1('12345', 'email123@gmail.com', 'nameFirst', 'nameLast');
      expect(update.statusCode).toBe(403);
      expect(update.body).toStrictEqual(ERROR);
    });

    test('keep all same', () => {
      const update = updateUserDetailsRequestV1(user.token, 'email@gmail.com', 'nameFirst', 'nameLast');
      expect(update.statusCode).toBe(200);
      expect(update.body).toStrictEqual({ });
      const userDetails = adminUserDetailsRequestV1(user.token);
      expect(userDetails.statusCode).toStrictEqual(200);
      expect(userDetails.body).toStrictEqual({
        user: {
          userId: expect.any(Number),
          name: 'nameFirst nameLast',
          email: 'email@gmail.com',
          numSuccessfulLogins: 1,
          numFailedPasswordsSinceLastLogin: 0
        }
      });
    });
  });
});

// 6. UpdateUserPassword //
describe('UpdateUserPassword', () => {
  describe('Error Cases: updateUserDetails', () => {
    test('Old Password Incorrect', () => {
      const user: TokenId = authRegisterRequest('email@gmail.com', 'password1', 'NameFirst', 'NameLast').body;
      expect(() => updateUserPasswordRequest(user.token, 'password2', 'password3')).toThrow(HTTPError[400]);
    });

    test('New Password Used Previously', () => {
      const user = authRegisterRequest('email@gmail.com', 'password1', 'NameFirst', 'NameLast').body;
      updateUserPasswordRequest(user.token, 'password1', 'password2');
      expect(() => updateUserPasswordRequest(user.token, 'password2', 'password1')).toThrow(HTTPError[400]);
    });

    test.each([
      { testName: 'empty new password', pass: '' },
      { testName: 'new password too short', pass: 'pass1' },
      { testName: 'new password must contain number', pass: 'password' },
      { testName: 'new password must contain letter', pass: '12345678' },
    ])('$testName: $pass', ({ pass }) => {
      const user = authRegisterRequest('email@gmail.com', 'password1', 'nameFirst', 'nameLast').body;
      expect(() => updateUserPasswordRequest(user.token, 'password1', pass)).toThrow(HTTPError[400]);
    });

    test.each([
      { testName: 'token just letters', token: 'hello' },
      { testName: 'token starts with letters', token: 'a54364' },
      { testName: 'token ends with letters', token: '54356s' },
      { testName: 'token includes letter', token: '5436h86' },
      { testName: 'token has space', token: '4324 757' },
      { testName: 'token only whitespace', token: '  ' },
      { testName: 'token has other characters', token: '6365,53' },
      { testName: 'empty string', token: '' },
      { testName: 'token has decimal point', token: '53.74' },
      { testName: 'token has negative sign', token: '-37294' },
      { testName: 'token has positive sign', token: '+38594' },
    ])('invalid token: $testName', ({ token }) => {
      expect(() => updateUserPasswordRequest(token, 'password1', 'password2')).toThrow(HTTPError[401]);
    });

    test('tokenId not logged in', () => {
      expect(() => updateUserPasswordRequest('12345', 'password1', 'password2')).toThrow(HTTPError[403]);
    });
  });

  describe('Valid Inputs', () => {
    test('update password once', () => {
      const user = authRegisterRequest('email@gmail.com', 'password1', 'nameFirst', 'nameLast').body;
      expect(updateUserPasswordRequest(user.token, 'password1', 'password2')).toStrictEqual({ });
      const login = authLoginRequest('email@gmail.com', 'password1');
      expect(login.statusCode).toBe(400);
      expect(login.body).toStrictEqual(ERROR);
    });

    test('update password twice', () => {
      const user = authRegisterRequest('email@gmail.com', 'password1', 'nameFirst', 'nameLast').body;
      const update = updateUserPasswordRequest(user.token, 'password1', 'password2');
      expect(update).toStrictEqual({ });
      const update2 = updateUserPasswordRequest(user.token, 'password2', 'password3');
      expect(update2).toStrictEqual({ });
      const login = authLoginRequest('email@gmail.com', 'password1');
      expect(login.statusCode).toBe(400);
      expect(login.body).toStrictEqual(ERROR);
    });
  });

  describe('V1 WRAPPERS', () => {
    test('update password once', () => {
      const user = authRegisterRequest('email@gmail.com', 'password1', 'nameFirst', 'nameLast').body;
      const update = updateUserPasswordRequestV1(user.token, 'password1', 'password2');
      expect(update.statusCode).toBe(200);
      expect(update.body).toStrictEqual({ });
      const login = authLoginRequest('email@gmail.com', 'password1');
      expect(login.statusCode).toBe(400);
      expect(login.body).toStrictEqual(ERROR);
    });

    test.each([
      { testName: 'token just letters', token: 'hello' },
      { testName: 'token starts with letters', token: 'a54364' },
    ])('invalid token: $testName', ({ token }) => {
      const update = updateUserPasswordRequestV1(token, 'password1', 'password2');
      expect(update.statusCode).toBe(401);
      expect(update.body).toStrictEqual(ERROR);
    });

    test('tokenId not logged in', () => {
      const update = updateUserPasswordRequestV1('12345', 'password1', 'password2');
      expect(update.statusCode).toBe(403);
      expect(update.body).toStrictEqual(ERROR);
    });

    test.each([
      { testName: 'empty new password', pass: '' },
      { testName: 'new password too short', pass: 'pass1' },
      { testName: 'new password must contain number', pass: 'password' },
      { testName: 'new password must contain letter', pass: '12345678' },
    ])('$testName: $pass', ({ pass }) => {
      const user = authRegisterRequest('email@gmail.com', 'password1', 'nameFirst', 'nameLast').body;
      const update = updateUserPasswordRequestV1(user.token, 'password1', pass);
      expect(update.statusCode).toBe(400);
      expect(update.body).toStrictEqual(ERROR);
    });
  });
});
