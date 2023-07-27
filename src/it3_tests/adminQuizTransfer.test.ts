import {
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  quizTransferRequest,
  adminQuizInfoRequest,
  adminQuizListRequest
} from './it3_testRoutes';
import HTTPError from 'http-errors';

import {
  TokenId,
  QuizId
} from '../interfaces';

// Before each test, clear data and then create a new user and new quiz
let user: TokenId;
let user2: TokenId;
let quiz: QuizId;
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last');
  quiz = quizCreateRequest(user.token, 'quiz1', '');
  user2 = authRegisterRequest('email2@gmail.com', 'password2', 'firsttwo', 'lasttwo');
});

// token not valid
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
    expect(() => quizTransferRequest(token, quiz.quizId, 'email2@gmail.com')).toThrow(HTTPError[401]);
  });

  test('Nobody logged in', () => {
    expect(() => quizTransferRequest('7', quiz.quizId, 'email2@gmail.com')).toThrow(HTTPError[403]);
  });

  test('TokenId not logged in', () => {
    expect(() => quizTransferRequest(user.token + 1, quiz.quizId, 'email2@gmail.com')).toThrow(HTTPError[403]);
  });
});

// quizId wrong
describe('invalid quizId', () => {
  // Testing quizID does not exist
  test('Quiz ID does not refer to a valid quiz', () => {
    expect(() => quizTransferRequest(user.token, quiz.quizId + 1, 'email2@gmail.com')).toThrow(HTTPError[400]);
  });

  // Testing the user does not own the quiz that is trying to be removed
  test('Quiz ID does not refer to a quiz that this user owns', () => {
    const quiz2 = quizCreateRequest(user2.token, 'quiz2', '');

    expect(() => quizTransferRequest(user.token, quiz2.quizId, 'email2@gmail.com')).toThrow(HTTPError[400]);
  });

  // Quiz ID refers to a quiz that has a name that is already used by the target user
  test('User already has a quiz named', () => {
    quizCreateRequest(user2.token, 'quiz1', '');

    expect(() => quizTransferRequest(user.token, quiz.quizId, 'email2@gmail.com')).toThrow(HTTPError[400]);
  });
});

// userEmail wrong
describe('invalid userEmail', () => {
  test('userEmail is not a real user', () => {
    expect(() => quizTransferRequest(user.token, quiz.quizId, 'fakeemail@gmail.com')).toThrow(HTTPError[400]);
  });

  test('userEmail is the current logged in user', () => {
    expect(() => quizTransferRequest(user.token, quiz.quizId, 'email@gmail.com')).toThrow(HTTPError[400]);
  });
});

// Success cases
describe('Successful quiz transfer', () => {
  test('Successful transfer quiz empty object response', () => {
    expect(quizTransferRequest(user.token, quiz.quizId, 'email2@gmail.com')).toStrictEqual({});
  });

  test('Successful transfer quiz integrated test', () => {
    expect(quizTransferRequest(user.token, quiz.quizId, 'email2@gmail.com')).toStrictEqual({});

    expect(adminQuizListRequest(user2.token)).toStrictEqual({
      quizzes: [
        {
          quizId: quiz.quizId,
          name: 'quiz1'
        }
      ]
    });

    expect(adminQuizListRequest(user.token)).toStrictEqual({
      quizzes: []
    });
  });

  test('Correct time last edited', () => {
    const expectedTimeTransfered = Math.floor(Date.now() / 1000);
    expect(quizTransferRequest(user.token, quiz.quizId, 'email2@gmail.com')).toStrictEqual({});

    const quizInfo = adminQuizInfoRequest(user2.token, quiz.quizId);

    const timeSent = quizInfo.timeLastEdited;

    expect(timeSent).toBeGreaterThanOrEqual(expectedTimeTransfered);
    expect(timeSent).toBeLessThanOrEqual(expectedTimeTransfered + 3);
  });
});
