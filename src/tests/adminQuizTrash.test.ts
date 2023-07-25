import { TokenId } from '../interfaces';
import {
  quizTrashRequest,
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  quizRemoveRequest,
} from './it3_testRoutes';
import HTTPError from 'http-errors';

beforeEach(() => {
  clearRequest();
});

describe('adminQuizTrash', () => {
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
      expect(() => quizTrashRequest(token)).toThrow(HTTPError[401]);
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
