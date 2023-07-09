import {
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  quizRemoveRequest,
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
    const removeQuiz = quizRemoveRequest(token, quiz.quizId);
    expect(removeQuiz.body).toStrictEqual(ERROR);
    expect(removeQuiz.statusCode).toStrictEqual(401);
  });

  test('Nobody logged in', () => {
    const removeQuiz = quizRemoveRequest('7', quiz.quizId);
    expect(removeQuiz.body).toStrictEqual(ERROR);
    expect(removeQuiz.statusCode).toStrictEqual(403);
  });

  test('TokenId not logged in', () => {
    const removeQuiz = quizRemoveRequest(user.token + 1, quiz.quizId);
    expect(removeQuiz.body).toStrictEqual(ERROR);
    expect(removeQuiz.statusCode).toStrictEqual(403);
  });
});

describe('Failed to remove', () => {
  // Testing quizID does not exist
  test('Quiz ID does not refer to a valid quiz', () => {
    const removeQuiz = quizRemoveRequest(user.token, quiz.quizId + 1);
    expect(removeQuiz.body).toStrictEqual(ERROR);
    expect(removeQuiz.statusCode).toStrictEqual(400);
  });

  // Testing the user does not own the quiz that is trying to be removed
  test('Quiz ID does not refer to a quiz that this user owns', () => {
    const user2 = authRegisterRequest('user2@gmail.com', 'StrongPassword123', 'TestFirst', 'TestLast').body;
    const quiz2 = quizCreateRequest(user2.token, 'quiz2', '').body;

    const removeQuiz = quizRemoveRequest(user.token, quiz2.quizId);
    expect(removeQuiz.body).toStrictEqual(ERROR);
    expect(removeQuiz.statusCode).toStrictEqual(400);
  });
});

describe('Successfully removed quiz check', () => {
  // Sucessfully remove the quiz
  test('Sucessful quiz remove return', () => {
    const removeQuiz = quizRemoveRequest(user.token, quiz.quizId);
    expect(removeQuiz.body).toStrictEqual({});
    expect(removeQuiz.statusCode).toStrictEqual(200);
  });

  //   // Check that the quiz is actually removed
  //   test('Sucessful quiz remove integrated check', () => {
  //     const quiz2 = quizCreateRequest(user.token, 'quiz2', '').body;
  //     const quizToRemove = quizCreateRequest(user.token, 'quizToRemove', '').body;
  //     const quiz3 = quizCreateRequest(user.token, 'quiz3', '').body;

  //     quizRemoveRequest(user.token, quizToRemove.quizId);

  //     const received = adminQuizListRequest(user.token).body;
  //     const expected = {
  //       quizzes: [
  //         {
  //           quizId: quiz.quizId,
  //           name: 'quiz1',
  //         },
  //         {
  //           quizId: quiz2.quizId,
  //           name: 'quiz2',
  //         },
  //         {
  //           quizId: quiz3.quizId,
  //           name: 'quiz3',
  //         },
  //       ]
  //     };

  //     const receivedSet = new Set(received.quizzes);
  //     const expectedSet = new Set(expected.quizzes);
  //     expect(receivedSet).toStrictEqual(expectedSet);
  //   });

  //   // check that once a quiz is removed, the quiz id no longer exists
  //   test('No quiz Id once a quiz is removed', () => {
  //     quizRemoveRequest(user.token, quiz.quizId);
  //     const quizInfo = quizInfoRequest(user.token, quiz.quizId);
  //     expect(quizInfo.body).toStrictEqual(ERROR);
  //     expect(quizInfo.statusCode).toStrictEqual(400);

  //     quizCreateRequest(user.token, 'quiz2', '');
  //     const quizInfo2 = quizInfoRequest(user.token, quiz.quizId);
  //     expect(quizInfo2.body).toStrictEqual(ERROR);
  //     expect(quizInfo2.statusCode).toStrictEqual(400);
  //   });

  // check that once a quiz is removed, the next quiz still has a unique quiz id
  test('Unique quiz Id once a quiz is removed', () => {
    const quizToRemove = quizCreateRequest(user.token, 'quizToRemove', '').body;
    const quiz2 = quizCreateRequest(user.token, 'quiz2', '').body;
    quizRemoveRequest(user.token, quizToRemove.quizId);
    const quiz3 = quizCreateRequest(user.token, 'quiz3', '').body;

    expect(quiz3.quizId).not.toStrictEqual(quiz.quizId);
    expect(quiz3.quizId).not.toStrictEqual(quiz2.quizId);
  });

//   test('Time Last Edited is updated when a quiz is sent to trash', () => {
//     const expectedTimeEdited = Math.floor(Date.now() / 1000);
//     quizRemoveRequest(user.token, quiz.quizId);
    
//     const viewTrash = quizTrashRequest(user.token);
//     const timeLastEdited = viewTrash.quizzes.timeLastEdited;

//     expect(timeLastEdited).toBeGreaterThanOrEqual(expectedTimeEdited);
//     expect(timeLastEdited).toBeLessThanOrEqual(expectedTimeEdited + 2);
//   });
});
