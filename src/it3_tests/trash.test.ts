import {
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  quizRemoveRequest,
  quizRestoreRequest,
  quizTrashRequest,
  quizTrashEmptyRequest,
  adminQuizListRequest,
  adminQuizInfoRequest,
  quizRemoveRequestV1,
  quizRestoreRequestV1,
  quizTrashRequestV1,
  quizTrashEmptyRequestV1,
} from './it3_testRoutes';
import HTTPError from 'http-errors';
import { TokenId, QuizId } from '../interfaces';

const ERROR = { error: expect.any(String) };

beforeEach(() => {
  clearRequest();
});

describe('Tokens', () => {
  let user: TokenId;
  let quiz: QuizId;
  beforeEach(() => {
    clearRequest();
    user = authRegisterRequest('email@gmail.com', 'password1', 'Firstname', 'Lastname').body;
    quiz = quizCreateRequest(user.token, 'Cats', 'A quiz about cats');
  });

  test.each([
    { testName: 'token just letters', token: 'hello' },
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
    expect(() => quizRestoreRequest(token, quiz.quizId)).toThrow(HTTPError[401]);
    expect(() => quizTrashRequest(token)).toThrow(HTTPError[401]);
  });
});

// 1. QuizRemove //
describe('QuizRemove', () => {
  let user: TokenId;
  let quiz: QuizId;
  beforeEach(() => {
    clearRequest();
    user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
    quiz = quizCreateRequest(user.token, 'quiz1', '');
  });

  describe('Token invalid', () => {
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
});

// 2. QuizRestore //
describe('QuizRestore', () => {
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

    test.each([
      { testName: 'token just letters', token: 'hello' },
      { testName: 'token starts with letters', token: 'a54364' },
    ])('token is not a valid structure: $testName', ({ token }) => {
      const restoreQuiz = quizRestoreRequestV1(token, quiz.quizId);
      expect(restoreQuiz.body).toStrictEqual(ERROR);
      expect(restoreQuiz.statusCode).toStrictEqual(401);
    });

    test('TokenId not logged in', () => {
      const restoreQuiz = quizRestoreRequestV1(user.token + 1, quiz.quizId);
      expect(restoreQuiz.body).toStrictEqual(ERROR);
      expect(restoreQuiz.statusCode).toStrictEqual(403);
    });

    test('outputs empty object', () => {
      const quiz2 = quizCreateRequest(user.token, 'quiz2', '');
      quizRemoveRequest(user.token, quiz2.quizId);

      const restoreQuiz = quizRestoreRequestV1(user.token, quiz2.quizId);
      expect(restoreQuiz.body).toStrictEqual({});
      expect(restoreQuiz.statusCode).toStrictEqual(200);
    });
  });
});

// 3. QuizTrash //
describe('QuizTrash', () => {
  describe('Error cases', () => {
    test('TokenId not logged in', () => {
      const user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
      expect(() => quizTrashRequest(user.token + 1)).toThrow(HTTPError[403]);
    });
  });

  describe('Success cases', () => {
    let user : TokenId;
    beforeEach(() => {
      user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
    });

    test('empty quiz trash', () => {
      const trash = quizTrashRequest(user.token);
      expect(trash).toStrictEqual({ quizzes: [] });
    });

    test('one quiz creator in trash quizzes', () => {
      // create quizzes
      const quiz1 = quizCreateRequest(user.token, 'quiz1', '');
      const quiz2 = quizCreateRequest(user.token, 'quiz2', '');
      const quiz3 = quizCreateRequest(user.token, 'quiz3', '');
      // remove quizzes
      quizRemoveRequest(user.token, quiz1.quizId);
      quizRemoveRequest(user.token, quiz2.quizId);
      quizRemoveRequest(user.token, quiz3.quizId);
      // test that they are in now trash with correct trash output
      const expected = {
        quizzes: [
          {
            quizId: quiz1.quizId,
            name: 'quiz1'
          },
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

    test('multiple quiz creators in trash quizzes', () => {
      const user2 = authRegisterRequest('user2@gmail.com', 'StrongPassword123', 'TestFirst', 'TestLast').body;
      // create quizzes of user
      const quiz1 = quizCreateRequest(user.token, 'quiz1', '');
      const quiz2 = quizCreateRequest(user.token, 'quiz2', '');
      const quiz3 = quizCreateRequest(user.token, 'quiz3', '');
      // create quiz of user2
      const user2Quiz = quizCreateRequest(user2.token, 'user2Quiz', '');

      // remove quizzes
      quizRemoveRequest(user.token, quiz1.quizId);
      quizRemoveRequest(user.token, quiz2.quizId);
      quizRemoveRequest(user.token, quiz3.quizId);
      quizRemoveRequest(user2.token, user2Quiz.quizId);

      // test that only quizzes created by user are displayed
      const expected = {
        quizzes: [
          {
            quizId: quiz1.quizId,
            name: 'quiz1'
          },
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
  });

  describe('V1 WRAPPERS', () => {
    test.each([
      { testName: 'token just letters', token: 'hello' },
      { testName: 'token starts with letters', token: 'a54364' },
    ])('token is not a valid structure: $testName', ({ token }) => {
      const trash = quizTrashRequestV1(token);
      expect(trash.body).toStrictEqual(ERROR);
      expect(trash.statusCode).toStrictEqual(401);
    });

    test('TokenId not logged in', () => {
      const trash = quizTrashRequestV1('7');
      expect(trash.body).toStrictEqual(ERROR);
      expect(trash.statusCode).toStrictEqual(403);
    });

    let user : TokenId;
    beforeEach(() => {
      user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
    });

    test('empty quiz trash', () => {
      const trash = quizTrashRequestV1(user.token);
      expect(trash.body).toStrictEqual({ quizzes: [] });
      expect(trash.statusCode).toStrictEqual(200);
    });
  });
});

// 4. QuizTrashEmpty //
describe('QuizTrashEmpty', () => {
  let user: TokenId;
  let quiz1: QuizId;
  let quiz2: QuizId;
  let quiz3: QuizId;
  // creates a user and a quiz for the user.
  beforeEach(() => {
    clearRequest();
    user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
    quiz1 = quizCreateRequest(user.token, 'quiz1', '');
    quiz2 = quizCreateRequest(user.token, 'quiz2', '');
    quiz3 = quizCreateRequest(user.token, 'quiz3', '');
    quizRemoveRequest(user.token, quiz1.quizId);
    quizRemoveRequest(user.token, quiz2.quizId);
    quizRemoveRequest(user.token, quiz3.quizId);
  });

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
      const quizIds = [quiz1.quizId, quiz2.quizId, quiz3.quizId];
      expect(() => quizTrashEmptyRequest(token, quizIds)).toThrow(HTTPError[401]);
    });

    test('TokenId not logged in', () => {
      const quizIds = [quiz1.quizId, quiz2.quizId, quiz3.quizId];
      expect(() => quizTrashEmptyRequest(user.token + 1, quizIds)).toThrow(HTTPError[403]);
    });

    test('One or more quizIds do not refer to a valid quiz', () => {
      // third quizId in list is invalid
      const quizIds = [quiz1.quizId, quiz2.quizId, quiz3.quizId + 100];
      expect(() => quizTrashEmptyRequest(user.token, quizIds)).toThrow(HTTPError[400]);
    });

    test('One or more quizIds do not refer to a quiz that this user owns', () => {
      const user2 = authRegisterRequest('user2@gmail.com', 'StrongPassword123', 'TestFirst', 'TestLast').body;
      const quizNotOwned = quizCreateRequest(user2.token, 'quizNotOwned', '');
      quizRemoveRequest(user2.token, quizNotOwned.quizId);

      const quizIds = [quiz1.quizId, quiz2.quizId, quizNotOwned.quizId, quiz3.quizId];
      expect(() => quizTrashEmptyRequest(user.token, quizIds)).toThrow(HTTPError[400]);
    });

    test('One or more quizIds do not refer to a quiz in trash', () => {
      quizRestoreRequest(user.token, quiz1.quizId);
      const quizIds = [quiz1.quizId, quiz2.quizId, quiz3.quizId];
      expect(() => quizTrashEmptyRequest(user.token, quizIds)).toThrow(HTTPError[400]);
    });
  });

  describe('Success cases', () => {
    let trashEmpty: Record<string, never>;
    // empties trash
    beforeEach(() => {
      const quizIds = [quiz1.quizId, quiz3.quizId];
      trashEmpty = quizTrashEmptyRequest(user.token, quizIds);
    });

    test('outputs empty object', () => {
      expect(trashEmpty).toStrictEqual({});
    });

    test('test specified quizzes in trash emptied', () => {
      // only quiz2 remaining
      const expected = {
        quizzes: [
          {
            quizId: quiz2.quizId,
            name: 'quiz2'
          }
        ]
      };
      expect(quizTrashRequest(user.token)).toStrictEqual(expected);
    });
  });

  describe('V1 WRAPPERS', () => {
    test('One or more quizIds do not refer to a quiz in trash', () => {
      quizRestoreRequestV1(user.token, quiz1.quizId);
      const quizIds = [quiz1.quizId, quiz2.quizId, quiz3.quizId];

      const emptyTrash = quizTrashEmptyRequestV1(user.token, quizIds);
      expect(emptyTrash.body).toStrictEqual(ERROR);
      expect(emptyTrash.statusCode).toStrictEqual(400);
    });

    test.each([
      { testName: 'token just letters', token: 'hello' },
      { testName: 'token starts with letters', token: 'a54364' },
    ])('token is not a valid structure: $testName', ({ token }) => {
      const quizIds = [quiz1.quizId, quiz2.quizId, quiz3.quizId];

      const emptyTrash = quizTrashEmptyRequestV1(token, quizIds);
      expect(emptyTrash.body).toStrictEqual(ERROR);
      expect(emptyTrash.statusCode).toStrictEqual(401);
    });

    test('TokenId not logged in', () => {
      const quizIds = [quiz1.quizId, quiz2.quizId, quiz3.quizId];

      const emptyTrash = quizTrashEmptyRequestV1(user.token + 1, quizIds);
      expect(emptyTrash.body).toStrictEqual(ERROR);
      expect(emptyTrash.statusCode).toStrictEqual(403);
    });

    let trashEmptyBody: Record<string, never>;
    let trashEmptyStatusCode: number;
    // empties trash
    beforeEach(() => {
      const quizIds = [quiz1.quizId, quiz3.quizId];
      const trashEmpty = quizTrashEmptyRequestV1(user.token, quizIds);
      trashEmptyBody = trashEmpty.body;
      trashEmptyStatusCode = trashEmpty.statusCode;
    });

    test('outputs empty object', () => {
      expect(trashEmptyBody).toStrictEqual({});
      expect(trashEmptyStatusCode).toStrictEqual(200);
    });
  });
});
