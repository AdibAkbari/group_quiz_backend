// tests for authRegisterRequest function
import {
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  createQuizQuestionRequest,
  quizQuestionDuplicateRequest,
  adminQuizInfoRequest,
  quizQuestionDuplicateRequestV1
} from './it3_testRoutes';
import HTTPError from 'http-errors';

import {
  TokenId,
  QuizId,
  QuestionId,
} from '../interfaces';

const ERROR = { error: expect.any(String) };
const validAnswers = [{ answer: 'great', correct: true }, { answer: 'bad', correct: false }];

let user: TokenId;
let quiz: QuizId;
let question: QuestionId;
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
  quiz = quizCreateRequest(user.token, 'My Quiz', 'This is my quiz');
  question = createQuizQuestionRequest(quiz.quizId, user.token, 'How are you?', 5, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
});

describe('error cases', () => {
  test('quizId invalid', () => {
    expect(() => quizQuestionDuplicateRequest(quiz.quizId + 1, question.questionId, user.token)).toThrow(HTTPError[400]);
  });

  test('user does not own quiz', () => {
    const user2 = authRegisterRequest('email2@gmail.com', 'password1', 'Firstname', 'Lastname').body;
    expect(() => quizQuestionDuplicateRequest(quiz.quizId, question.questionId, user2.token)).toThrow(HTTPError[400]);
  });

  test('questionId invalid', () => {
    expect(() => quizQuestionDuplicateRequest(quiz.quizId, question.questionId + 1, user.token)).toThrow(HTTPError[400]);
  });

  test('invalid token structure', () => {
    expect(() => quizQuestionDuplicateRequest(quiz.quizId, question.questionId, 'fsdjfndjf')).toThrow(HTTPError[401]);
  });

  test('TokenId not logged in', () => {
    expect(() => quizQuestionDuplicateRequest(quiz.quizId, question.questionId, user.token + 1)).toThrow(HTTPError[403]);
  });
});

describe('valid input', () => {
  test('one question duplicate', () => {
    const timeNow = Math.floor(Date.now() / 1000);
    const result = quizQuestionDuplicateRequest(quiz.quizId, question.questionId, user.token);
    const info = adminQuizInfoRequest(user.token, quiz.quizId);
    expect(result).toStrictEqual({ newQuestionId: expect.any(Number) });
    expect(info).toStrictEqual({
      quizId: quiz.quizId,
      name: 'My Quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'This is my quiz',
      numQuestions: 2,
      questions: [
        {
          questionId: question.questionId,
          question: 'How are you?',
          duration: 5,
          points: 5,
          answers: [
            { answerId: expect.any(Number), answer: 'great', colour: expect.any(String), correct: true },
            { answerId: expect.any(Number), answer: 'bad', colour: expect.any(String), correct: false },
          ],
          thumbnailUrl: expect.any(String),
        },
        {
          questionId: result.newQuestionId,
          question: 'How are you?',
          duration: 5,
          points: 5,
          answers: [
            { answerId: expect.any(Number), answer: 'great', colour: expect.any(String), correct: true },
            { answerId: expect.any(Number), answer: 'bad', colour: expect.any(String), correct: false },
          ],
          thumbnailUrl: expect.any(String),
        }
      ],
      duration: 10,
    });
    expect(info.timeLastEdited).toBeGreaterThanOrEqual(timeNow);
    expect(info.timeLastEdited).toBeLessThanOrEqual(timeNow + 3);
  });

  // whitebox testing, assuming questions appear in the order they were created
  test('two questions, duplicate the first', () => {
    const answersQuestion2 = [{ answer: 'yum', correct: true }, { answer: 'ew', correct: false }];
    const questionTwo = createQuizQuestionRequest(quiz.quizId, user.token, 'Pineapples on pizza?', 3, 3, answersQuestion2, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
    const result = quizQuestionDuplicateRequest(quiz.quizId, question.questionId, user.token);
    const timeNow = Math.floor(Date.now() / 1000);
    const info = adminQuizInfoRequest(user.token, quiz.quizId);
    expect(result).toStrictEqual({ newQuestionId: expect.any(Number) });
    expect(info).toStrictEqual({
      quizId: quiz.quizId,
      name: 'My Quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'This is my quiz',
      numQuestions: 3,
      questions: [
        {
          questionId: question.questionId,
          question: 'How are you?',
          duration: 5,
          points: 5,
          answers: [
            { answerId: expect.any(Number), answer: 'great', colour: expect.any(String), correct: true },
            { answerId: expect.any(Number), answer: 'bad', colour: expect.any(String), correct: false },
          ],
          thumbnailUrl: expect.any(String),
        },
        {
          questionId: result.newQuestionId,
          question: 'How are you?',
          duration: 5,
          points: 5,
          answers: [
            { answerId: expect.any(Number), answer: 'great', colour: expect.any(String), correct: true },
            { answerId: expect.any(Number), answer: 'bad', colour: expect.any(String), correct: false },
          ],
          thumbnailUrl: expect.any(String),
        },
        {
          questionId: questionTwo.questionId,
          question: 'Pineapples on pizza?',
          duration: 3,
          points: 3,
          answers: [
            { answerId: expect.any(Number), answer: 'yum', colour: expect.any(String), correct: true },
            { answerId: expect.any(Number), answer: 'ew', colour: expect.any(String), correct: false },
          ],
          thumbnailUrl: expect.any(String),
        }
      ],
      duration: 13,
    });
    expect(info.timeLastEdited).toBeGreaterThanOrEqual(timeNow);
    expect(info.timeLastEdited).toBeLessThanOrEqual(timeNow + 1);
  });
});

describe('V1 WRAPPERS', () => {
  test('TokenId not logged in', () => {
    const result = quizQuestionDuplicateRequestV1(quiz.quizId, question.questionId, user.token + 1);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(403);
  });

  test('invalid token structure', () => {
    const result = quizQuestionDuplicateRequestV1(quiz.quizId, question.questionId, '4324.5324');
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(401);
  });

  test('questionId invalid', () => {
    const result = quizQuestionDuplicateRequestV1(quiz.quizId, question.questionId + 1, user.token);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(400);
  });

  test('one question duplicate', () => {
    const result = quizQuestionDuplicateRequestV1(quiz.quizId, question.questionId, user.token);
    expect(result.body).toStrictEqual({ newQuestionId: expect.any(Number) });
    expect(result.statusCode).toStrictEqual(200);
  });
});
