// tests for authRegisterRequest function
import {
  adminUserDetailsRequest,
  authRegisterRequest,
  authLoginRequest,
  clearRequest,
  updateUserDetailsRequest,
} from './testRoutes';

const ERROR = { error: expect.any(String) };

beforeEach(() => {
  clearRequest();
});

describe('Error Cases: updateUserDetails', () => {
  test('Email used by another user', () => {
    const user = authRegisterRequest('email@gmail.com', 'password1', 'NameFirst', 'NameLast').body;
    const user2 = authRegisterRequest('email2@gmail.com', 'password1', 'NameFirst', 'NameLast').body;
    const update = updateUserDetailsRequest(user.token, 'email2@gmail.com', 'NameFirst', 'NameLast');
    expect(update.body).toStrictEqual(ERROR);
    expect(update.statusCode).toStrictEqual(400);
  });

  test('Email invalid', () => {
    const user = authRegisterRequest('email@gmail.com', 'password1', 'NameFirst', 'NameLast').body;
    const update = updateUserDetailsRequest(user.token, 'email', 'NameFirst', 'NameLast');
    expect(update.body).toStrictEqual(ERROR);
    expect(update.statusCode).toStrictEqual(400);
  });

  test.each([
    {testName: 'empty nameFirst', first: ''},
    {testName: 'invalid nameFirst', first: 'nameFirst$'},
    {testName: 'invalid nameFirst 2', first: 'nameFirst$()1'},
    {testName: 'nameFirst too short', first: 'n'},
    {testName: 'nameFirst too long', first: 'nameFirstIsMoreThanTwenty'},
    {testName: 'nameFirst whitespace', first: '    '},
  ])('$testName: $first', ({ first }) => {
    const user = authRegisterRequest('email@gmail.com', 'password1', 'nameFirst', 'nameLast').body;
    const update = updateUserDetailsRequest(user.token, 'email123@gmail.com', first, 'NameLast');
    expect(update.statusCode).toBe(400);
    expect(update.body).toStrictEqual(ERROR);
  });

  test.each([
    {testName: 'empty nameLast', last: ''},
    {testName: 'invalid nameLast', last: 'nameLast$'},
    {testName: 'invalid nameLast 2', last: 'nameLast1'},
    {testName: 'nameLast too short', last: 'n'},
    {testName: 'nameLast too long', last: 'nameLastIsMoreThanTwenty'},
    {testName: 'nameLast whitespace', last: '    '},
  ])('$testName: $last', ({ last }) => {
    const user = authRegisterRequest('email@gmail.com', 'password1', 'nameFirst', 'nameLast').body;
    const update = updateUserDetailsRequest(user.token, 'email123@gmail.com', 'nameFirst', last);
    expect(update.statusCode).toBe(400);
    expect(update.body).toStrictEqual(ERROR);
  });

  test.each([
    {testName: 'token just letters', token: 'hello'},
    {testName: 'token starts with letters', token: 'a54364'},
    {testName: 'token ends with letters', token: '54356s'},
    {testName: 'token includes letter', token: '5436h86'},
    {testName: 'token has space', token: '4324 757'},
    {testName: 'token only whitespace', token: '  '},
    {testName: 'token has other characters', token: '6365,53'},
    {testName: 'empty string', token: ''},
    {testName: 'token has decimal point', token: '53.74'},
    {testName: 'token has negative sign', token: '-37294'},
    {testName: 'token has positive sign', token: '+38594'},
  ])('invalid token: $testName', ({token}) => {
    const update = updateUserDetailsRequest(token, 'email123@gmail.com', 'nameFirst', 'nameLast');
    expect(update.statusCode).toBe(401);
    expect(update.body).toStrictEqual(ERROR);
  });

  test('tokenId not logged in', () => {
    const update = updateUserDetailsRequest('12345', 'email123@gmail.com', 'nameFirst', 'nameLast');
    expect(update.statusCode).toBe(403);
    expect(update.body).toStrictEqual(ERROR);
  })
});

describe('Valid Inputs', () => {
  test('update all fields', () => {
    const user = authRegisterRequest('email@gmail.com', 'password1', 'nameFirst', 'nameLast').body;
    const update = updateUserDetailsRequest(user.token, 'newEmail@gmail.com', 'newFirst', 'newLast');
    expect(update.statusCode).toBe(200);
    expect(update.body).toStrictEqual({ });
    const userDetails = adminUserDetailsRequest(user.token);
    expect(userDetails.statusCode).toStrictEqual(200);
    expect(userDetails.body).toStrictEqual({
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
    const user = authRegisterRequest('email@gmail.com', 'password1', 'nameFirst', 'nameLast').body;
    const update = updateUserDetailsRequest(user.token, 'email@gmail.com', 'nameFirst', 'nameLast');
    expect(update.statusCode).toBe(200);
    expect(update.body).toStrictEqual({ });
    const userDetails = adminUserDetailsRequest(user.token);
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