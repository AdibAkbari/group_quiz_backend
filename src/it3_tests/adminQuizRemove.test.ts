import {
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  quizRemoveRequest,
  adminQuizListRequest,
  adminQuizInfoRequest,
  createQuizQuestionRequest,
  startSessionRequest,
  updateSessionStateRequest,
  quizRemoveRequestV1,
} from './it3_testRoutes';
import { TokenId, QuizId } from '../interfaces';
import HTTPError from 'http-errors';

const ERROR = { error: expect.any(String) };

// Before each test, clear data and then create a new user and new quiz
let user: TokenId;
let quiz: QuizId;
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
  quiz = quizCreateRequest(user.token, 'quiz1', '');
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
    expect(() => quizRemoveRequest(token, quiz.quizId)).toThrow(HTTPError[401]);
  });

  test('Nobody logged in', () => {
    expect(() => quizRemoveRequest('7', quiz.quizId)).toThrow(HTTPError[403]);
  });

  test('TokenId not logged in', () => {
    expect(() => quizRemoveRequest(user.token + 1, quiz.quizId)).toThrow(HTTPError[403]);
  });
});

describe('Failed to remove', () => {
  // Testing quizID does not exist
  test('Quiz ID does not refer to a valid quiz', () => {
    expect(() => quizRemoveRequest(user.token, quiz.quizId + 1)).toThrow(HTTPError[400]);
  });

  // Testing the user does not own the quiz that is trying to be removed
  test('Quiz ID does not refer to a quiz that this user owns', () => {
    const user2 = authRegisterRequest('user2@gmail.com', 'StrongPassword123', 'TestFirst', 'TestLast').body;
    const quiz2 = quizCreateRequest(user2.token, 'quiz2', '');

    expect(() => quizRemoveRequest(user.token, quiz2.quizId)).toThrow(HTTPError[400]);
  });

  test('quiz not in end state', () => {
    createQuizQuestionRequest(quiz.quizId, user.token, 'Question 1', 5, 6, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }]);
    const sessionId = startSessionRequest(quiz.quizId, user.token, 3).sessionId;
    updateSessionStateRequest(quiz.quizId, sessionId, user.token, 'NEXT_QUESTION');
    expect(() => quizRemoveRequest(user.token, quiz.quizId)).toThrow(HTTPError[400]);
  });
});

describe('Successfully removed quiz check', () => {
  // Sucessfully remove the quiz
  test('Sucessful quiz remove return', () => {
    expect(quizRemoveRequest(user.token, quiz.quizId)).toStrictEqual({});
  });

  // Check that the quiz is actually removed
  test('Sucessful quiz remove integrated check', () => {
    const quiz2 = quizCreateRequest(user.token, 'quiz2', '');
    const quizToRemove = quizCreateRequest(user.token, 'quizToRemove', '');
    const quiz3 = quizCreateRequest(user.token, 'quiz3', '');

    quizRemoveRequest(user.token, quizToRemove.quizId);

    const received = adminQuizListRequest(user.token);
    const expected = {
      quizzes: [
        {
          quizId: quiz.quizId,
          name: 'quiz1',
        },
        {
          quizId: quiz2.quizId,
          name: 'quiz2',
        },
        {
          quizId: quiz3.quizId,
          name: 'quiz3',
        },
      ]
    };

    const receivedSet = new Set(received.quizzes);
    const expectedSet = new Set(expected.quizzes);
    expect(receivedSet).toStrictEqual(expectedSet);
  });

  // check that once a quiz is removed, the quiz id no longer exists
  test('No quiz Id once a quiz is removed', () => {
    quizRemoveRequest(user.token, quiz.quizId);
    expect(() => adminQuizInfoRequest(user.token, quiz.quizId)).toThrow(HTTPError[400]);

    quizCreateRequest(user.token, 'quiz2', '');
    expect(() => adminQuizInfoRequest(user.token, quiz.quizId)).toThrow(HTTPError[400]);
  });

  // check that once a quiz is removed, the next quiz still has a unique quiz id
  test('Unique quiz Id once a quiz is removed', () => {
    const quizToRemove = quizCreateRequest(user.token, 'quizToRemove', '');
    const quiz2 = quizCreateRequest(user.token, 'quiz2', '');
    quizRemoveRequest(user.token, quizToRemove.quizId);
    const quiz3 = quizCreateRequest(user.token, 'quiz3', '');

    expect(quiz3.quizId).not.toStrictEqual(quiz.quizId);
    expect(quiz3.quizId).not.toStrictEqual(quiz2.quizId);
  });
});

describe('V1 WRAPPERS', () => {
  test.each([
    { testName: 'token just letters', token: 'hello' },
    { testName: 'token starts with letters', token: 'a54364' },
  ])('token is not a valid structure: $testName', ({ token }) => {
    const removeQuiz = quizRemoveRequestV1(token, quiz.quizId);
    expect(removeQuiz.body).toStrictEqual(ERROR);
    expect(removeQuiz.statusCode).toStrictEqual(401);
  });

  test('Nobody logged in', () => {
    const removeQuiz = quizRemoveRequestV1('7', quiz.quizId);
    expect(removeQuiz.body).toStrictEqual(ERROR);
    expect(removeQuiz.statusCode).toStrictEqual(403);
  });

  test('Quiz ID does not refer to a valid quiz', () => {
    const removeQuiz = quizRemoveRequestV1(user.token, quiz.quizId + 1);
    expect(removeQuiz.body).toStrictEqual(ERROR);
    expect(removeQuiz.statusCode).toStrictEqual(400);
  });

  test('Sucessful quiz remove return', () => {
    const removeQuiz = quizRemoveRequestV1(user.token, quiz.quizId);
    expect(removeQuiz.body).toStrictEqual({});
    expect(removeQuiz.statusCode).toStrictEqual(200);
  });
});
