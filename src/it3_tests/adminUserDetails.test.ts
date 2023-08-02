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
  test('invalid token structure', () => {
    expect(() => adminUserDetailsRequest('-43242')).toThrow(HTTPError[401]);
  });

  test('Nobody logged in', () => {
    expect(() => adminUserDetailsRequest('7')).toThrow(HTTPError[403]);
  });

  test('TokenId not logged in', () => {
    const user = authRegisterRequest('email@gmail.com', 'password1', 'NameFirst', 'NameLast').body;
    expect(() => adminUserDetailsRequest(user.token + 1)).toThrow(HTTPError[403]);
  });
});

describe('Valid cases', () => {
  let user: TokenId;
  beforeEach(() => {
    user = authRegisterRequest('email@gmail.com', 'password1', 'Firstname', 'Lastname').body;
  });

  test('Only one user', () => {
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

  test('multiple users registered', () => {
    const user2 = authRegisterRequest('email2@gmail.com', 'password2', 'FirstnameB', 'LastnameB').body;
    authRegisterRequest('email3@gmail.com', 'password3', 'FirstnameC', 'LastnameC');
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
});

describe('V1 WRAPPERS', () => {
  test('Nobody logged in', () => {
    const userDetails = adminUserDetailsRequestV1('7');
    expect(userDetails.body).toStrictEqual(ERROR);
    expect(userDetails.statusCode).toStrictEqual(403);
  });

  test('invalid token structure', () => {
    const details = adminUserDetailsRequestV1('+432432');
    expect(details.body).toStrictEqual(ERROR);
    expect(details.statusCode).toStrictEqual(401);
  });
});
