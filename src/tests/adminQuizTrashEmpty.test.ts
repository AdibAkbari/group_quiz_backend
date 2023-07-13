import {
  quizTrashRequest,
  clearRequest,
  authRegisterRequest,
  quizRestoreRequest,
  quizCreateRequest,
  quizRemoveRequest,
  quizTrashEmptyRequest,
} from './testRoutes';

const ERROR = { error: expect.any(String) };

interface TokenId {
  token: string
}
interface QuizCreate {
  quizId: number
}

let user: TokenId;
let quiz1: QuizCreate;
let quiz2: QuizCreate;
let quiz3: QuizCreate;
// creates a user and a quiz for the user.
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
  quiz1 = quizCreateRequest(user.token, 'quiz1', '').body;
  quiz2 = quizCreateRequest(user.token, 'quiz2', '').body;
  quiz3 = quizCreateRequest(user.token, 'quiz3', '').body;
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

      const emptyTrash = quizTrashEmptyRequest(token, quizIds);
      expect(emptyTrash.body).toStrictEqual(ERROR);
      expect(emptyTrash.statusCode).toStrictEqual(401);
    });

    test('TokenId not logged in', () => {
      const quizIds = [quiz1.quizId, quiz2.quizId, quiz3.quizId];

      const emptyTrash = quizTrashEmptyRequest(user.token + 1, quizIds);
      expect(emptyTrash.body).toStrictEqual(ERROR);
      expect(emptyTrash.statusCode).toStrictEqual(403);
    });

    test('One or more quizIds do not refer to a valid quiz', () => {
      // third quizId in list is invalid
      const quizIds = [quiz1.quizId, quiz2.quizId, quiz3.quizId + 100];

      const emptyTrash = quizTrashEmptyRequest(user.token, quizIds);
      expect(emptyTrash.body).toStrictEqual(ERROR);
      expect(emptyTrash.statusCode).toStrictEqual(400);
    });

    test('One or more quizIds do not refer to a quiz that this user owns', () => {
      const user2 = authRegisterRequest('user2@gmail.com', 'StrongPassword123', 'TestFirst', 'TestLast').body;
      const quizNotOwned = quizCreateRequest(user2.token, 'quizNotOwned', '').body;
      quizRemoveRequest(user2.token, quizNotOwned.quizId);

      const quizIds = [quiz1.quizId, quiz2.quizId, quizNotOwned.quizId, quiz3.quizId];

      // user tries to empty trash of quiz created by user2
      const emptyTrash = quizTrashEmptyRequest(user.token, quizIds);
      expect(emptyTrash.body).toStrictEqual(ERROR);
      expect(emptyTrash.statusCode).toStrictEqual(400);
    });

    test('One or more quizIds do not refer to a quiz in trash', () => {
      quizRestoreRequest(user.token, quiz1.quizId);
      const quizIds = [quiz1.quizId, quiz2.quizId, quiz3.quizId];

      const emptyTrash = quizTrashEmptyRequest(user.token, quizIds);
      expect(emptyTrash.body).toStrictEqual(ERROR);
      expect(emptyTrash.statusCode).toStrictEqual(400);
    });
  });

  describe('Success cases', () => {
    let trashEmptyBody: Record<string, never>;
    let trashEmptyStatusCode: number;
    // empties trash
    beforeEach(() => {
      const quizIds = [quiz1.quizId, quiz3.quizId];
      const trashEmpty = quizTrashEmptyRequest(user.token, quizIds);
      trashEmptyBody = trashEmpty.body;
      trashEmptyStatusCode = trashEmpty.statusCode;
    });

    test('outputs empty object', () => {
      expect(trashEmptyBody).toStrictEqual({});
      expect(trashEmptyStatusCode).toStrictEqual(200);
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
      expect(quizTrashRequest(user.token).body).toStrictEqual(expected);
    });
  });
});
