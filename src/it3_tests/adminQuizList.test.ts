
import {
  adminQuizListRequest,
  quizCreateRequest,
  authRegisterRequest,
  clearRequest,
  adminQuizListRequestV1,
} from './it3_testRoutes';
import HTTPError from 'http-errors';
import { TokenId } from '../interfaces';

const ERROR = { error: expect.any(String) };

let user: TokenId;
let user2: TokenId;
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'Firstname', 'Lastname').body;
  user2 = authRegisterRequest('email1@gmail.com', 'password2', 'FirstnameB', 'LastnameB').body;
});

describe('Token invalid', () => {
  test('invalid token', () => {
    expect(() => adminQuizListRequest('54893h5483')).toThrow(HTTPError[401]);
  });

  test('Unused tokenId', () => {
    expect(() => adminQuizListRequest(user.token + user2.token)).toThrow(HTTPError[403]);
  });
});

describe('valid input', () => {
  test('No quizzes', () => {
    expect(adminQuizListRequest(user.token)).toStrictEqual({
      quizzes: []
    });
  });

  test('user owns one quiz', () => {
    const quiz = quizCreateRequest(user.token, 'Cats', 'A quiz about cats');
    expect(adminQuizListRequest(user.token)).toStrictEqual({
      quizzes: [
        {
          quizId: quiz.quizId,
          name: 'Cats'
        }
      ]
    });
  });

  test('user owns more than one quiz', () => {
    const quiz = quizCreateRequest(user.token, 'Cats', 'A quiz about cats');
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
});

describe('V1 WRAPPERS', () => {
  test('invalid token', () => {
    const list = adminQuizListRequestV1('fheufhw');
    expect(list.body).toStrictEqual(ERROR);
    expect(list.statusCode).toStrictEqual(401);
  });

  test('Unused tokenId', () => {
    const list = adminQuizListRequestV1(user.token + user2.token);
    expect(list.body).toStrictEqual(ERROR);
    expect(list.statusCode).toStrictEqual(403);
  });

  test('user owns one quiz', () => {
    const quiz = quizCreateRequest(user.token, 'Cats', 'A quiz about cats');
    expect(adminQuizListRequestV1(user.token).body).toStrictEqual({
      quizzes: [
        {
          quizId: quiz.quizId,
          name: 'Cats'
        }
      ]
    });
  });
});
