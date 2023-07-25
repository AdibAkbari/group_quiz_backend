// tests for authRegisterRequest function
import {
  clearRequest,
  authRegisterRequest,
  authLogoutRequest
} from './it3_testRoutes';
import HTTPError from 'http-errors';

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
    expect(() => authLogoutRequest(token)).toThrow(HTTPError[401])
  });

  test('user created then logged out', () => {
    const user = authRegisterRequest('email@gmail.com', 'password1', 'nameFirst', 'nameLast').body;
    const userToken = user.token;
    authLogoutRequest(userToken);
    expect(() => authLogoutRequest(token)).toThrow(HTTPError[400])
  });

  test('token never created', () => {
    expect(() => authLogoutRequest('12345')).toThrow(HTTPError[400])
  });
});

describe('successful cases', () => {
  test('one token created', () => {
    const user = authRegisterRequest('email@gmail.com', 'password1', 'nameFirst', 'nameLast');
    expect(authLogoutRequest(user.token)).toStrictEqual({ });
  });

  test('two tokens created', () => {
    authRegisterRequest('email@gmail.com', 'password1', 'nameFirst', 'nameLast');
    const user2 = authRegisterRequest('email123@gmail.com', 'password1', 'nameFirst', 'nameLast');

    expect(authLogoutRequest(user2.token)).toStrictEqual({ });
  });
});
