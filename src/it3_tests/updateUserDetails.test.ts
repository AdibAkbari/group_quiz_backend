// tests for updateUserDetails function
import {
  adminUserDetailsRequest,
  authRegisterRequest,
  clearRequest,
  updateUserDetailsRequest,
} from './it3_testRoutes';
import HTTPError from 'http-errors';

const ERROR = { error: expect.any(String) };

import { TokenId } from '../interfaces';

let user: TokenId;

beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'nameFirst', 'nameLast');
});

describe('Error Cases: updateUserDetails', () => {
  test('Email used by another user', () => {
    const user2 = authRegisterRequest('email2@gmail.com', 'password1', 'NameFirst', 'NameLast');
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
