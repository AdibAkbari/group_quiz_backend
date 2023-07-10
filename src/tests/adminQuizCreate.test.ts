import {
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  // QuizInfoRequest,
} from './testRoutes';

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
    const quiz = quizCreateRequest(user.token, name, '');
    expect(quiz.statusCode).toBe(400);
    expect(quiz.body).toStrictEqual(ERROR);
  });

  test('name already used by user for another quiz', () => {
    quizCreateRequest(user.token, 'TestQuiz', '');
    const quiz = quizCreateRequest(user.token, 'TestQuiz', '');
    expect(quiz.statusCode).toBe(400);
    expect(quiz.body).toStrictEqual(ERROR);
  });

  // description more than 100 character error
  test('invalid description (>100 characters)', () => {
    // string of length 101
    const longString = '0'.repeat(101);
    const quiz = quizCreateRequest(user.token, 'TestQuiz', longString);
    expect(quiz.statusCode).toBe(400);
    expect(quiz.body).toStrictEqual(ERROR);
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
    const quiz = quizCreateRequest(token, 'TestQuiz', '');
    expect(quiz.body).toStrictEqual(ERROR);
    expect(quiz.statusCode).toStrictEqual(401);
  });

  test('Nobody logged in', () => {
    const quiz = quizCreateRequest('7', 'TestQuiz', '');
    expect(quiz.body).toStrictEqual(ERROR);
    expect(quiz.statusCode).toStrictEqual(403);
  });

  test('TokenId not logged in', () => {
    const user = authRegisterRequest('email@gmail.com', 'password1', 'NameFirst', 'NameLast').body;
    const quiz = quizCreateRequest(user.token + 1, 'TestQuiz', '');
    expect(quiz.body).toStrictEqual(ERROR);
    expect(quiz.statusCode).toStrictEqual(403);
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
    const quiz = quizCreateRequest(user.token, 'TestQuiz', '');
    expect(quiz.body).toStrictEqual({ quizId: expect.any(Number) });
    expect(quiz.statusCode).toStrictEqual(200);
  });

  // test that the quiz is correctly added to the array of quizzes
//   test.skip('testing correct quiz object creation', () => {
//     const quiz = quizCreateRequest(user.authUserId, 'TestQuiz', 'Test');
//     expect(adminQuizInfo(user.authUserId, quiz.quizId)).toStrictEqual(
//       {
//         quizId: quiz.quizId,
//         name: 'TestQuiz',
//         timeCreated: expect.any(Number),
//         timeLastEdited: expect.any(Number),
//         description: 'Test',
//       }
//     );
//   });
});
