import { TokenId } from '../interfaces';
import {
  quizTrashRequest,
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  quizRemoveRequest,
  quizTrashRequestV1,
} from './it3_testRoutes';
import HTTPError from 'http-errors';

const ERROR = { error: expect.any(String) };

beforeEach(() => {
  clearRequest();
});

describe('adminQuizTrash', () => {
  describe('Error cases', () => {
    test('invalid token structure', () => {
      expect(() => quizTrashRequest('543.763')).toThrow(HTTPError[401]);
    });

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
});

describe('V1 WRAPPERS', () => {
  test('invalid token structre', () => {
    const trash = quizTrashRequestV1('432h53');
    expect(trash.body).toStrictEqual(ERROR);
    expect(trash.statusCode).toStrictEqual(401);
  });

  test('TokenId not logged in', () => {
    const trash = quizTrashRequestV1('7');
    expect(trash.body).toStrictEqual(ERROR);
    expect(trash.statusCode).toStrictEqual(403);
  });

  test('empty quiz trash', () => {
    const user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
    const trash = quizTrashRequestV1(user.token);
    expect(trash.body).toStrictEqual({ quizzes: [] });
    expect(trash.statusCode).toStrictEqual(200);
  });
});
