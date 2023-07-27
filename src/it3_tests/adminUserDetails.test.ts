import {
  adminUserDetailsRequest,
  authRegisterRequest,
  clearRequest,
  adminUserDetailsRequestV1,
} from './it3_testRoutes';
import {
  TokenId
} from '../interfaces';
import HTTPError from 'http-errors';

const ERROR = { error: expect.any(String) };

beforeEach(() => {
  clearRequest();
});

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

  let user: TokenId;
  beforeEach(() => {
    user = authRegisterRequest('email@gmail.com', 'password1', 'Firstname', 'Lastname').body;
  });

  test('Just registered', () => {
    const userDetails = adminUserDetailsRequestV1(user.token);
    expect(userDetails.body).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'Firstname Lastname',
        email: 'email@gmail.com',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0
      }
    });
    expect(userDetails.statusCode).toStrictEqual(200);
  });
});