
import {
  adminQuizListRequest,
  quizCreateRequest,
  authRegisterRequest,
  clearRequest
} from './it3_testRoutes';
import HTTPError from 'http-errors';

import { TokenId, QuizId } from '../interfaces';

let user: TokenId;
let user2: TokenId;
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'Firstname', 'Lastname');
  user2 = authRegisterRequest('email1@gmail.com', 'password2', 'FirstnameB', 'LastnameB');
});

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
    expect(() => adminQuizListRequest(token)).toThrow(HTTPError[401])
  });

  test('Unused tokenId', () => {
    expect(() => adminQuizListRequest(user.token + user2.token)).toThrow(HTTPError[403])
  });
});

describe('User owns no quizzes', () => {
  test('No quizzes', () => {
    expect(adminQuizListRequest(user.token)).toStrictEqual({
      quizzes: []
    });
  });

  test('One quiz created on system', () => {
    quizCreateRequest(user2.token, 'Cats', '');
    expect(adminQuizListRequest(user.token)).toStrictEqual({
      quizzes: []
    });
  });

  test('multiple quizzes created on system', () => {
    quizCreateRequest(user2.token, 'Cats', '');
    quizCreateRequest(user2.token, 'Dogs', '');
    quizCreateRequest(user2.token, 'Birds', '');
    expect(adminQuizListRequest(user.token)).toStrictEqual({
      quizzes: []
    });
  });
});

describe('User does own quizzes', () => {
  let quiz: QuizId;
  beforeEach(() => {
    quiz = quizCreateRequest(user.token, 'Cats', 'A quiz about cats');
  });

  test('user owns one quiz', () => {
    expect(adminQuizListRequest(user.token)).toStrictEqual({
      quizzes: [
        {
          quizId: quiz.quizId,
          name: 'Cats'
        }
      ]
    });
  });

  test('user owns two quizzes', () => {
    const quiz2 = quizCreateRequest(user.token, 'Dogs', 'A quiz about dogs');
    const expected = {
      quizzes: [
        {
          quizId: quiz.quizId,
          name: 'Cats'
        },
        {
          quizId: quiz2.quizId,
          name: 'Dogs'
        }
      ]
    };
    const received = adminQuizListRequest(user.token);
    const receivedSet = new Set(received.quizzes);
    const expectedSet = new Set(expected.quizzes);
    expect(receivedSet).toStrictEqual(expectedSet);
  });

  test('user owns multiple quizzes', () => {
    const quiz2 = quizCreateRequest(user.token, 'Dogs', 'A quiz about dogs');
    quizCreateRequest(user2.token, 'Birds', 'A quiz about birds');
    const quiz4 = quizCreateRequest(user.token, 'Ducks', 'A quiz about ducks');
    const quiz5 = quizCreateRequest(user.token, 'Lizards', 'A quiz about lizards');
    quizCreateRequest(user2.token, 'Goats', 'A quiz about goats');

    const received = adminQuizListRequest(user.token);
    const expected = {
      quizzes: [
        {
          quizId: quiz.quizId,
          name: 'Cats'
        },
        {
          quizId: quiz2.quizId,
          name: 'Dogs'
        },
        {
          quizId: quiz5.quizId,
          name: 'Lizards'
        },
        {
          quizId: quiz4.quizId,
          name: 'Ducks'
        }
      ]
    };

    const receivedSet = new Set(received.quizzes);
    const expectedSet = new Set(expected.quizzes);
    expect(receivedSet).toStrictEqual(expectedSet);
  });
});
