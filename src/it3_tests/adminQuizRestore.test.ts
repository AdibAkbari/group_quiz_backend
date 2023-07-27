import {
  quizTrashRequest,
  clearRequest,
  authRegisterRequest,
  quizRestoreRequest,
  quizCreateRequest,
  quizRemoveRequest,
  adminQuizListRequest,
  adminQuizInfoRequest,
  quizRestoreRequestV1,
} from './it3_testRoutes';
import { TokenId, QuizId } from '../interfaces';
import HTTPError from 'http-errors';

const ERROR = { error: expect.any(String) };

let user: TokenId;
let quiz: QuizId;
// creates a user and a quiz for the user.
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
  quiz = quizCreateRequest(user.token, 'quiz1', '');
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
      expect(() => quizRestoreRequest(token, quiz.quizId)).toThrow(HTTPError[401]);
    });

    test('TokenId not logged in', () => {
      expect(() => quizRestoreRequest(user.token + 1, quiz.quizId)).toThrow(HTTPError[403]);
    });

    test('Quiz ID does not refer to a valid quiz', () => {
      quizRemoveRequest(user.token, quiz.quizId);
      expect(() => quizRestoreRequest(user.token, quiz.quizId + 1)).toThrow(HTTPError[400]);
    });

    test('Quiz ID does not refer to a quiz that this user owns', () => {
      quizRemoveRequest(user.token, quiz.quizId);
      const user2 = authRegisterRequest('user2@gmail.com', 'StrongPassword123', 'TestFirst', 'TestLast').body;
      const quiz2 = quizCreateRequest(user2.token, 'quiz2', '');
      quizRemoveRequest(user2.token, quiz2.quizId);

      // user tries to restore quiz created and removed by user2
      expect(() => quizRestoreRequest(user.token, quiz2.quizId)).toThrow(HTTPError[400]);
    });

    test('Quiz ID does not refer to a quiz in trash', () => {
      expect(() => quizRestoreRequest(user.token, quiz.quizId)).toThrow(HTTPError[400]);
    });
  });

  describe('Success cases', () => {
    let restoreQuiz: Record<string, never>;
    let quiz2: QuizId;
    let quiz3: QuizId;
    // creates 2 more quizzes and removes all quizzes to trash
    beforeEach(() => {
      quiz2 = quizCreateRequest(user.token, 'quiz2', '');
      quiz3 = quizCreateRequest(user.token, 'quiz3', '');
      quizRemoveRequest(user.token, quiz.quizId);
      quizRemoveRequest(user.token, quiz2.quizId);
      quizRemoveRequest(user.token, quiz3.quizId);
      restoreQuiz = quizRestoreRequest(user.token, quiz.quizId);
    });

    test('outputs empty object', () => {
      expect(restoreQuiz).toStrictEqual({});
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
      const trashList = quizTrashRequest(user.token);
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
      expect(adminQuizListRequest(user.token)).toStrictEqual(expected);
    });

    test('timeLastEdited successfully updated', () => {
      const timeNow = Math.floor(Date.now() / 1000);
      const result = adminQuizInfoRequest(user.token, quiz.quizId);
      expect(result.timeLastEdited).toBeGreaterThanOrEqual(timeNow);
      expect(result.timeLastEdited).toBeLessThanOrEqual(timeNow + 1);
    });
  });
});

describe('V1 WRAPPERS', () => {
  test('Quiz ID does not refer to a quiz in trash', () => {
    const restoreQuiz = quizRestoreRequestV1(user.token, quiz.quizId);
    expect(restoreQuiz.body).toStrictEqual(ERROR);
    expect(restoreQuiz.statusCode).toStrictEqual(400);
  });
});
