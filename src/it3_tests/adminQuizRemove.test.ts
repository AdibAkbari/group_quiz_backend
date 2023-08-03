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
  test('invalid token structure', () => {
    expect(() => quizRemoveRequest('fhsfs', quiz.quizId)).toThrow(HTTPError[401]);
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
    createQuizQuestionRequest(quiz.quizId, user.token, 'Question 1', 5, 6, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }], 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
    const sessionId = startSessionRequest(quiz.quizId, user.token, 3).sessionId;
    updateSessionStateRequest(quiz.quizId, sessionId, user.token, 'NEXT_QUESTION');
    expect(() => quizRemoveRequest(user.token, quiz.quizId)).toThrow(HTTPError[400]);
  });
});

describe('Successfully removed quiz check', () => {
  test('Sucessful quiz remove', () => {
    const quiz2 = quizCreateRequest(user.token, 'quiz2', '');
    const quizToRemove = quizCreateRequest(user.token, 'quizToRemove', '');
    const quiz3 = quizCreateRequest(user.token, 'quiz3', '');

    expect(quizRemoveRequest(user.token, quizToRemove.quizId)).toStrictEqual({});

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
});

describe('V1 WRAPPERS', () => {
  test('invalid token', () => {
    const removeQuiz = quizRemoveRequestV1('fsdjfs', quiz.quizId);
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
