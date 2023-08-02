// tests for updateUserDetails function
import {
  adminUserDetailsRequest,
  authRegisterRequest,
  clearRequest,
  updateUserDetailsRequest,
  updateUserDetailsRequestV1,
  adminUserDetailsRequestV1
} from './it3_testRoutes';
import HTTPError from 'http-errors';

import { TokenId } from '../interfaces';

const ERROR = { error: expect.any(String) };

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
    { testName: 'nameFirst too short', first: 'n' },
    { testName: 'nameFirst too long', first: 'nameFirstIsMoreThanTwenty' },
    { testName: 'nameFirst whitespace', first: '    ' },
  ])('$testName: $first', ({ first }) => {
    expect(() => updateUserDetailsRequest(user.token, 'email123@gmail.com', first, 'NameLast')).toThrow(HTTPError[400]);
  });

  test.each([
    { testName: 'empty nameLast', last: '' },
    { testName: 'invalid nameLast', last: 'nameLast1' },
    { testName: 'nameLast too short', last: 'n' },
    { testName: 'nameLast too long', last: 'nameLastIsMoreThanTwenty' },
    { testName: 'nameLast whitespace', last: '    ' },
  ])('$testName: $last', ({ last }) => {
    expect(() => updateUserDetailsRequest(user.token, 'email123@gmail.com', 'nameFirst', last)).toThrow(HTTPError[400]);
  });

  test('invalid token structure', () => {
    expect(() => updateUserDetailsRequest('token', 'email123@gmail.com', 'nameFirst', 'nameLast')).toThrow(HTTPError[401]);
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

  test('invalid token structure', () => {
    const update = updateUserDetailsRequestV1('4342,', 'email123@gmail.com', 'nameFirst', 'nameLast');
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
