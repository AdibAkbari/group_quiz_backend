// tests for authRegisterRequest function
import {
  clearRequest,
  authRegisterRequest,
  quizDescriptionUpdateRequest,
  quizCreateRequest,
  adminQuizInfoRequest,
  quizDescriptionUpdateRequestV1,
  quizCreateRequestV1,
  adminQuizInfoRequestV1,
} from './it3_testRoutes';
import HTTPError from 'http-errors';

import { TokenId, QuizId } from '../interfaces';

const ERROR = { error: expect.any(String) };

let user: TokenId;
let quiz: QuizId;
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
  quiz = quizCreateRequest(user.token, 'My Quiz', 'First Description');
});

describe('Error Cases', () => {
  test('quizId not valid', () => {
    expect(() => quizDescriptionUpdateRequest(quiz.quizId + 1, user.token, 'New Description')).toThrow(HTTPError[400]);
  });

  test('user does not own quiz', () => {
    const user2 = authRegisterRequest('email2@gmail.com', 'password1', 'first', 'last').body;
    const quiz2 = quizCreateRequest(user2.token, 'User 2 Quiz', 'First Description');

    expect(() => quizDescriptionUpdateRequest(quiz2.quizId, user.token, 'New Description')).toThrow(HTTPError[400]);
  });

  test('description too long', () => {
    expect(() => quizDescriptionUpdateRequest(quiz.quizId, user.token, '1'.repeat(101))).toThrow(HTTPError[400]);
  });

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
  ])('invalid token: $testName', ({ token }) => {
    expect(() => quizDescriptionUpdateRequest(quiz.quizId, token, 'New Description')).toThrow(HTTPError[401]);
  });

  test('tokenId not logged in', () => {
    expect(() => quizDescriptionUpdateRequest(quiz.quizId, '12345', 'New Description')).toThrow(HTTPError[403]);
  });
});

describe('Success Cases', () => {
  test('valid input', () => {
    expect(quizDescriptionUpdateRequest(quiz.quizId, user.token, 'New Description')).toStrictEqual({ });

    expect(adminQuizInfoRequest(user.token, quiz.quizId)).toStrictEqual(
      {
        quizId: quiz.quizId,
        name: 'My Quiz',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'New Description',
        numQuestions: 0,
        questions: [],
        duration: 0
      }
    );
    const timeNow = Math.floor(Date.now() / 1000);
    const result = adminQuizInfoRequest(user.token, quiz.quizId);
    expect(result.timeLastEdited).toBeGreaterThanOrEqual(timeNow);
    expect(result.timeLastEdited).toBeLessThanOrEqual(timeNow + 1);
  });
})

describe('V1 WRAPPERS', () => {
    test('valid input V1', () => {
        const update = quizDescriptionUpdateRequestV1(quiz.quizId, user.token, 'New Description');
        expect(update.body).toStrictEqual({ });
        expect(update.statusCode).toBe(200);
        expect(adminQuizInfoRequestV1(user.token, quiz.quizId).body).toStrictEqual(
          {
            quizId: quiz.quizId,
            name: 'My Quiz',
            timeCreated: expect.any(Number),
            timeLastEdited: expect.any(Number),
            description: 'New Description',
            numQuestions: 0,
            questions: [],
            duration: 0
          }
        );
        const timeNow = Math.floor(Date.now() / 1000);
        const result = adminQuizInfoRequestV1(user.token, quiz.quizId).body;
        expect(result.timeLastEdited).toBeGreaterThanOrEqual(timeNow);
        expect(result.timeLastEdited).toBeLessThanOrEqual(timeNow + 1);
      });

      test('description too long', () => {
        const update = quizDescriptionUpdateRequestV1(quiz.quizId, user.token, '1'.repeat(101));
        expect(update.body).toStrictEqual(ERROR);
        expect(update.statusCode).toStrictEqual(400);
      });
})
