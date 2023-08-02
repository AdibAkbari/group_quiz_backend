import {
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  adminQuizInfoRequest,
  quizCreateRequestV1,
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
  test('token invalid structure', () => {
    expect(() => quizCreateRequest('84357h543', 'TestQuiz', '')).toThrow(HTTPError[401]);
  })

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
  let user: Token;
  beforeEach(() => {
    clearRequest();
    user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
  });

  test('testing correct quiz object creation', () => {
    const quiz = quizCreateRequest(user.token, 'TestQuiz', 'Test');
    expect(quiz).toStrictEqual({ quizId: expect.any(Number) });
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
  test('invalid token structure', () => {
    const quiz = quizCreateRequestV1('54353h54', 'TestQuiz', '');
    expect(quiz.body).toStrictEqual(ERROR);
    expect(quiz.statusCode).toStrictEqual(401);
  })

  test('Nobody logged in', () => {
    const quiz = quizCreateRequestV1('7', 'TestQuiz', '');
    expect(quiz.body).toStrictEqual(ERROR);
    expect(quiz.statusCode).toStrictEqual(403);
  });

  let user: Token;
  beforeEach(() => {
    clearRequest();
    user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
  });

  test('name already used by user for another quiz', () => {
    quizCreateRequestV1(user.token, 'TestQuiz', '');
    const quiz = quizCreateRequestV1(user.token, 'TestQuiz', '');
    expect(quiz.statusCode).toBe(400);
    expect(quiz.body).toStrictEqual(ERROR);
  });
});
