import {
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  adminQuizInfoRequest,
  quizCreateRequestV1,
  adminQuizInfoRequestV1,
} from './it3_testRoutes';
import HTTPError from 'http-errors';

const ERROR = { error: expect.any(String) };

interface Token {
  token: string
}

beforeEach(() => {
  clearRequest();
});

// name/description wrong
describe('invalid name/description edge cases', () => {
  let user: Token;
  beforeEach(() => {
    clearRequest();
    user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
  });

  test.each([
    {
      name: 'test1;',
      test: 'not alpha-numeric'
    },
    {
      name: 'user\'s test',
      test: 'not alpha-numeric'
    },
    {
      name: '     ',
      test: 'only whitespaces'
    },
    {
      name: 'Q1',
      test: '<3 chars'
    },
    {
      name: '0123456789012345678901234567890',
      test: '>30 chars'
    },
  ])("'$name' is invalid: '$test'", ({ name, test }) => {
    expect(() => quizCreateRequest(user.token, name, '')).toThrow(HTTPError[400]);
  });

  test('name already used by user for another quiz', () => {
    quizCreateRequest(user.token, 'TestQuiz', '');
    expect(() => quizCreateRequest(user.token, 'TestQuiz', '')).toThrow(HTTPError[400]);
  });

  // description more than 100 character error
  test('invalid description (>100 characters)', () => {
    // string of length 101
    const longString = '0'.repeat(101);
    expect(() => quizCreateRequest(user.token, 'TestQuiz', longString)).toThrow(HTTPError[400]);
  });
});

// token not valid
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
    expect(() => quizCreateRequest(token, 'TestQuiz', '')).toThrow(HTTPError[401]);
  });

  test('Nobody logged in', () => {
    expect(() => quizCreateRequest('7', 'TestQuiz', '')).toThrow(HTTPError[403]);
  });

  test('TokenId not logged in', () => {
    const user = authRegisterRequest('email@gmail.com', 'password1', 'NameFirst', 'NameLast').body;
    expect(() => quizCreateRequest(user.token + 1, 'TestQuiz', '')).toThrow(HTTPError[403]);
  });
});

// Successful quizCreate
describe('valid input tests', () => {
  // test adminQuizCreate correct output
  let user: Token;
  beforeEach(() => {
    clearRequest();
    user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
  });

  test('valid input - testing quizId creation', () => {
    expect(quizCreateRequest(user.token, 'TestQuiz', '')).toStrictEqual({ quizId: expect.any(Number) });
  });

  test('testing correct quiz object creation', () => {
    const quiz = quizCreateRequest(user.token, 'TestQuiz', 'Test');
    expect(adminQuizInfoRequest(user.token, quiz.quizId)).toStrictEqual(
      {
        quizId: quiz.quizId,
        name: 'TestQuiz',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'Test',
        numQuestions: 0,
        questions: [],
        duration: 0,
      }
    );
  });
});

// Successful quizCreate
describe('V1 WRAPPERS', () => {
  // test adminQuizCreate correct output
  let user: Token;
  beforeEach(() => {
    clearRequest();
    user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
  });

  test('valid input - testing quizId creation', () => {
    expect(quizCreateRequestV1(user.token, 'TestQuiz', '').body).toStrictEqual({ quizId: expect.any(Number) });
  });

  test('name already used by user for another quiz', () => {
    quizCreateRequestV1(user.token, 'TestQuiz', '');
    const quiz = quizCreateRequestV1(user.token, 'TestQuiz', '');
    expect(quiz.statusCode).toBe(400);
    expect(quiz.body).toStrictEqual(ERROR);
  });
});