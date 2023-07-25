import {
  quizTrashRequest,
  clearRequest,
  authRegisterRequest,
  quizRestoreRequest,
  quizCreateRequest,
  quizRemoveRequest,
  adminQuizListRequest,
  adminQuizInfoRequest,
} from './testRoutes';
import { TokenId, QuizId } from '../interfaces';

const ERROR = { error: expect.any(String) };

let user: TokenId;
let quiz: QuizId;
// creates a user and a quiz for the user.
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
  quiz = quizCreateRequest(user.token, 'quiz1', '').body;
});

describe('adminQuizRestore', () => {
  describe('Error cases', () => {
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
      const restoreQuiz = quizRestoreRequest(token, quiz.quizId);
      expect(restoreQuiz.body).toStrictEqual(ERROR);
      expect(restoreQuiz.statusCode).toStrictEqual(401);
    });

    test('TokenId not logged in', () => {
      const restoreQuiz = quizRestoreRequest(user.token + 1, quiz.quizId);
      expect(restoreQuiz.body).toStrictEqual(ERROR);
      expect(restoreQuiz.statusCode).toStrictEqual(403);
    });

    test('Quiz ID does not refer to a valid quiz', () => {
      quizRemoveRequest(user.token, quiz.quizId);
      const restoreQuiz = quizRestoreRequest(user.token, quiz.quizId + 1);
      expect(restoreQuiz.body).toStrictEqual(ERROR);
      expect(restoreQuiz.statusCode).toStrictEqual(400);
    });

    test('Quiz ID does not refer to a quiz that this user owns', () => {
      quizRemoveRequest(user.token, quiz.quizId);
      const user2 = authRegisterRequest('user2@gmail.com', 'StrongPassword123', 'TestFirst', 'TestLast').body;
      const quiz2 = quizCreateRequest(user2.token, 'quiz2', '').body;
      quizRemoveRequest(user2.token, quiz2.quizId);

      // user tries to restore quiz created and removed by user2
      const restoreQuiz = quizRestoreRequest(user.token, quiz2.quizId);
      expect(restoreQuiz.body).toStrictEqual(ERROR);
      expect(restoreQuiz.statusCode).toStrictEqual(400);
    });

    test('Quiz ID does not refer to a quiz in trash', () => {
      const restoreQuiz = quizRestoreRequest(user.token, quiz.quizId);
      expect(restoreQuiz.body).toStrictEqual(ERROR);
      expect(restoreQuiz.statusCode).toStrictEqual(400);
    });
  });

  describe('Success cases', () => {
    let restoreQuizBody: Record<string, never>;
    let restoreQuizStatusCode: number;
    let quiz2: QuizId;
    let quiz3: QuizId;
    // creates 2 more quizzes and removes all quizzes to trash
    beforeEach(() => {
      quiz2 = quizCreateRequest(user.token, 'quiz2', '').body;
      quiz3 = quizCreateRequest(user.token, 'quiz3', '').body;
      quizRemoveRequest(user.token, quiz.quizId);
      quizRemoveRequest(user.token, quiz2.quizId);
      quizRemoveRequest(user.token, quiz3.quizId);
      const restoreQuiz = quizRestoreRequest(user.token, quiz.quizId);
      restoreQuizBody = restoreQuiz.body;
      restoreQuizStatusCode = restoreQuiz.statusCode;
    });

    test('outputs empty object', () => {
      expect(restoreQuizBody).toStrictEqual({});
      expect(restoreQuizStatusCode).toStrictEqual(200);
    });

    test('removes quiz from trash', () => {
      const expected = {
        quizzes: [
          {
            quizId: quiz2.quizId,
            name: 'quiz2'
          },
          {
            quizId: quiz3.quizId,
            name: 'quiz3'
          }
        ]
      };
      const trashList = quizTrashRequest(user.token).body;
      const trashSet = new Set(trashList.quizzes);
      const expectedSet = new Set(expected.quizzes);
      expect(trashSet).toStrictEqual(expectedSet);
    });

    test('adds quiz back to active quizzes', () => {
      const expected = {
        quizzes: [
          {
            quizId: quiz.quizId,
            name: 'quiz1'
          }
        ]
      };
      expect(adminQuizListRequest(user.token).body).toStrictEqual(expected);
    });

    test('timeLastEdited successfully updated', () => {
      const timeNow = Math.floor(Date.now() / 1000);
      const result = adminQuizInfoRequest(user.token, quiz.quizId).body;
      expect(result.timeLastEdited).toBeGreaterThanOrEqual(timeNow);
      expect(result.timeLastEdited).toBeLessThanOrEqual(timeNow + 1);
    });
  });
});
