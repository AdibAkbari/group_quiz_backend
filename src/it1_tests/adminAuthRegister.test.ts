// tests for authRegisterRequest function
import { 
  clearRequest, 
  authRegisterRequest, 
} from './testRoutes';

beforeEach(() => {
  clearRequest();
});

const ERROR = { error: expect.any(String)};

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
    let user = authRegisterRequest('email2@gmail.com', 'password1', first, 'nameLast');
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
    let user = (authRegisterRequest('email2@gmail.com', pass, 'nameFirst', 'nameLast'));
    expect(user.statusCode).toBe(400);
    expect(user.body).toStrictEqual(ERROR);
  });

  test('email already used', () => {
    authRegisterRequest('email@gmail.com', 'password1', 'nameFirst', 'nameLast');
    expect(authRegisterRequest('email@gmail.com', 'password12', 'nameFirsts', 'nameLasts').statusCode).toBe(400);
  });
});
