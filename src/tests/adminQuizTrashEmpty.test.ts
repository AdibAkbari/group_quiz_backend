import {
  quizTrashRequest,
  clearRequest,
  authRegisterRequest,
  quizRestoreRequest,
  quizCreateRequest,
  quizRemoveRequest,
  quizTrashEmptyRequest,
} from './it3_testRoutes';
import { TokenId, QuizId } from '../interfaces';
import HTTPError from 'http-errors';

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
});
