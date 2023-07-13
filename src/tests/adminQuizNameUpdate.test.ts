import {
  clearRequest,
  authRegisterRequest,
  quizNameUpdateRequest,
  adminQuizInfoRequest,
  quizCreateRequest,
} from './testRoutes';

const ERROR = { error: expect.any(String) };

interface Token {
  token: string
}

interface QuizCreate {
  quizId: number
}
// Before each test, clear data and then create a new user and new quiz
let user: Token;
let quiz: QuizCreate;
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
  quiz = quizCreateRequest(user.token, 'quiz1', '').body;
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
    const newQuiz = quizNameUpdateRequest(token, quiz.quizId, 'TestQuizUpdate');
    expect(newQuiz.body).toStrictEqual(ERROR);
    expect(newQuiz.statusCode).toStrictEqual(401);
  });

  test('Nobody logged in', () => {
    const newQuiz = quizNameUpdateRequest('7', quiz.quizId, 'TestQuizUpdate');
    expect(newQuiz.body).toStrictEqual(ERROR);
    expect(newQuiz.statusCode).toStrictEqual(403);
  });

  test('TokenId not logged in', () => {
    const newQuiz = quizNameUpdateRequest(user.token + 1, quiz.quizId, 'TestQuizUpdate');
    expect(newQuiz.body).toStrictEqual(ERROR);
    expect(newQuiz.statusCode).toStrictEqual(403);
  });
});

describe('Invalid adminQuizNameUpdate', () => {
  // Testing quizID does not exist
  test('Quiz ID does not refer to a valid quiz', () => {
    const newQuiz = quizNameUpdateRequest(user.token, quiz.quizId + 1, 'TestQuizUpdate');
    expect(newQuiz.body).toStrictEqual(ERROR);
    expect(newQuiz.statusCode).toStrictEqual(400);
  });

  // Testing the user does not own the quiz that is trying to be removed
  test('Quiz ID does not refer to a quiz that this user owns', () => {
    const user2 = authRegisterRequest('user2@gmail.com', 'StrongPassword123', 'TestFirst', 'TestLast').body;
    const quiz2 = quizCreateRequest(user2.token, 'quiz2', '').body;

    const newQuiz = quizNameUpdateRequest(user.token, quiz2.quizId, 'NewQuizName');
    expect(newQuiz.body).toStrictEqual(ERROR);
    expect(newQuiz.statusCode).toStrictEqual(400);
  });

  // Output error if new name contains not alphanumeric characters
  test.each([
    {
      name: '!@#$%^&*',
      test: 'No letters'
    },
    {
      name: 'user\'s test',
      test: 'Invalid apostrophe'
    },
    {
      name: 'test1;',
      test: 'Invalid semi colon'
    },
  ])('"$test": "$name"', ({ name, test }) => {
    const newQuiz = quizNameUpdateRequest(user.token, quiz.quizId, name);
    expect(newQuiz.body).toStrictEqual(ERROR);
    expect(newQuiz.statusCode).toStrictEqual(400);
  });

  // Output error if new name is either less than 3 characters long or more than 30 characters long
  test.each([
    {
      name: 'q1',
      test: '< 3'
    },
    {
      name: 'namemorethanthirtycharacterslong',
      test: '> 30'
    },
  ])('"$test": "$name"', ({ name, test }) => {
    const newQuiz = quizNameUpdateRequest(user.token, quiz.quizId, name);
    expect(newQuiz.body).toStrictEqual(ERROR);
    expect(newQuiz.statusCode).toStrictEqual(400);
  });

  // Output error if the name is already used by the current logged in user for another quiz
  test('Name is already used by the current logged in user for another quiz', () => {
    const quiz2 = quizCreateRequest(user.token, 'quiz2', '').body;
    const newQuiz = quizNameUpdateRequest(user.token, quiz2.quizId, 'quiz1');
    expect(newQuiz.body).toStrictEqual(ERROR);
    expect(newQuiz.statusCode).toStrictEqual(400);
  });

  // Output error if the name is just white space
  test('Name is just whitespace', () => {
    const newQuiz = quizNameUpdateRequest(user.token, quiz.quizId, '          ');
    expect(newQuiz.body).toStrictEqual(ERROR);
    expect(newQuiz.statusCode).toStrictEqual(400);
  });
});

describe('Valid adminQuizNameUpdate', () => {
  // Successfully update the name of the quiz
  test.each([
    { name: 'qz1' },
    { name: 'Short' },
    { name: 'LongQuizNameWithClosetoMaxName' },
    { name: '123456789' },
    { name: '1quiz' },
    { name: 'Quiz1' },
    { name: 'New Quiz' },
  ])('Successful Quiz Name Update: "$name"', ({ name }) => {
    const newQuiz = quizNameUpdateRequest(user.token, quiz.quizId, name);
    expect(newQuiz.body).toStrictEqual({});
    expect(newQuiz.statusCode).toStrictEqual(200);

    expect(adminQuizInfoRequest(user.token, quiz.quizId).body).toStrictEqual({
      quizId: quiz.quizId,
      name: name,
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: '',
      numQuestions: 0,
      questions: [],
      duration: 0,
    });
    expect(adminQuizInfoRequest(user.token, quiz.quizId).statusCode).toStrictEqual(200);
  });

  test('Correct time last edited', () => {
    const expectedTimeTransfered = Math.floor(Date.now() / 1000);
    const newQuiz = quizNameUpdateRequest(user.token, quiz.quizId, 'New Quiz Name');
    expect(newQuiz.body).toStrictEqual({});
    expect(newQuiz.statusCode).toStrictEqual(200);

    const quizInfo = adminQuizInfoRequest(user.token, quiz.quizId).body;

    const timeSent = quizInfo.timeLastEdited;

    expect(timeSent).toBeGreaterThanOrEqual(expectedTimeTransfered);
    expect(timeSent).toBeLessThanOrEqual(expectedTimeTransfered + 3);
  });
});
