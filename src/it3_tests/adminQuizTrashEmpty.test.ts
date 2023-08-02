import {
  quizTrashRequest,
  clearRequest,
  authRegisterRequest,
  quizRestoreRequest,
  quizCreateRequest,
  quizRemoveRequest,
  quizTrashEmptyRequest,
  quizTrashEmptyRequestV1,
  quizRestoreRequestV1,
} from './it3_testRoutes';
import { TokenId, QuizId } from '../interfaces';
import HTTPError from 'http-errors';

const ERROR = { error: expect.any(String) };

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

describe('adminQuizTrash', () => {
  describe('Error cases', () => {
    test('invalid token structure', () => {
      const quizIds = [quiz1.quizId, quiz2.quizId, quiz3.quizId];
      expect(() => quizTrashEmptyRequest('432423;42', quizIds)).toThrow(HTTPError[401]);
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
});

describe('V1 WRAPPERS', () => {
  test('One or more quizIds do not refer to a quiz in trash', () => {
    quizRestoreRequestV1(user.token, quiz1.quizId);
    const quizIds = [quiz1.quizId, quiz2.quizId, quiz3.quizId];

    const emptyTrash = quizTrashEmptyRequestV1(user.token, quizIds);
    expect(emptyTrash.body).toStrictEqual(ERROR);
    expect(emptyTrash.statusCode).toStrictEqual(400);
  });

  test('invalid token structure', () => {
    const quizIds = [quiz1.quizId, quiz2.quizId, quiz3.quizId];
    const emptyTrash = quizTrashEmptyRequestV1('fejwfjes', quizIds);
    expect(emptyTrash.body).toStrictEqual(ERROR);
    expect(emptyTrash.statusCode).toStrictEqual(401);
  });

  test('TokenId not logged in', () => {
    const quizIds = [quiz1.quizId, quiz2.quizId, quiz3.quizId];

    const emptyTrash = quizTrashEmptyRequestV1(user.token + 1, quizIds);
    expect(emptyTrash.body).toStrictEqual(ERROR);
    expect(emptyTrash.statusCode).toStrictEqual(403);
  });

  test('outputs empty object', () => {
    const quizIds = [quiz1.quizId, quiz3.quizId];
    const trashEmpty = quizTrashEmptyRequestV1(user.token, quizIds);
    expect(trashEmpty.body).toStrictEqual({});
    expect(trashEmpty.statusCode).toStrictEqual(200);
  });
});
