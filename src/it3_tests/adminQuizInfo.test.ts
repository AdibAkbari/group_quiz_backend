import {
  adminQuizInfoRequest,
  quizCreateRequest,
  authRegisterRequest,
  clearRequest,
  createQuizQuestionRequest,
  adminQuizInfoRequestV1,
  createQuizQuestionRequestV1,
} from './it3_testRoutes';
import HTTPError from 'http-errors';

import { TokenId, QuizId } from '../interfaces';

const ERROR = { error: expect.any(String) };

let user: TokenId;
let quiz: QuizId;
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'Firstname', 'Lastname').body;
  quiz = quizCreateRequest(user.token, 'Cats', 'A quiz about cats');
});

describe('QuizId invalid', () => {
  test('Quiz Id does not refer to a valid quiz', () => {
    expect(() => adminQuizInfoRequest(user.token, quiz.quizId + 1)).toThrow(HTTPError[400]);
  });

  test('Quiz Id does not refer to a quiz that this user owns', () => {
    const user2 = authRegisterRequest('email2@gmail.com', 'password1', 'FirstnameB', 'LastnameB').body;
    expect(() => adminQuizInfoRequest(user2.token, quiz.quizId)).toThrow(HTTPError[400]);
  });
});

describe('Token invalid', () => {
  test('token invalid structure', () => {
    expect(() => adminQuizInfoRequest('584935h', quiz.quizId)).toThrow(HTTPError[401]);
  });

  test('Unused tokenId', () => {
    expect(() => adminQuizInfoRequest(user.token + 1, quiz.quizId)).toThrow(HTTPError[403]);
  });
});

describe('Valid inputs', () => {
  test('quiz with no questions', () => {
    expect(adminQuizInfoRequest(user.token, quiz.quizId)).toStrictEqual({
      quizId: quiz.quizId,
      name: 'Cats',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'A quiz about cats',
      numQuestions: 0,
      questions: [],
      duration: 0
    });
  });

  
  test('quiz with questions created', () => {
    const questionId = createQuizQuestionRequest(quiz.quizId, user.token, 'Question 1', 6, 3, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }], 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg').questionId;
    const q2Id = createQuizQuestionRequest(quiz.quizId, user.token, 'Question 2?', 6, 3, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }], 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg').questionId;
    const q3Id = createQuizQuestionRequest(quiz.quizId, user.token, 'Question 3?', 6, 3, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }], 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg').questionId;
    const timeNow = Math.floor(Date.now() / 1000);

    const expectedQuestions = [
      {
        questionId: questionId,
        question: 'Question 1',
        duration: 6,
        points: 3,
        answers: [
          { answerId: expect.any(Number), answer: 'answer1', colour: expect.any(String), correct: true },
          { answerId: expect.any(Number), answer: 'answer2', colour: expect.any(String), correct: false },
        ], 
        thumbnailUrl: expect.any(String),
      },
      {
        questionId: q2Id,
        question: 'Question 2?',
        duration: 6,
        points: 3,
        answers: [
          { answerId: expect.any(Number), answer: 'answer1', colour: expect.any(String), correct: true },
          { answerId: expect.any(Number), answer: 'answer2', colour: expect.any(String), correct: false },
        ],
        thumbnailUrl: expect.any(String),
      },
      {
        questionId: q3Id,
        question: 'Question 3?',
        duration: 6,
        points: 3,
        answers: [
          { answerId: expect.any(Number), answer: 'answer1', colour: expect.any(String), correct: true },
          { answerId: expect.any(Number), answer: 'answer2', colour: expect.any(String), correct: false },
        ],
        thumbnailUrl: expect.any(String),
      }
    ];

    const result = adminQuizInfoRequest(user.token, quiz.quizId);
    expect(result).toStrictEqual({
      quizId: quiz.quizId,
      name: 'Cats',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'A quiz about cats',
      numQuestions: 3,
      questions: expectedQuestions,
      duration: 18
    });

    expect(result.timeLastEdited).toBeGreaterThanOrEqual(timeNow);
    expect(result.timeLastEdited).toBeLessThanOrEqual(timeNow + 1);
  });
});

describe('V1 WRAPPERS', () => {
  test('Quiz Id does not refer to a valid quiz', () => {
    const result = adminQuizInfoRequestV1(user.token, quiz.quizId + 1);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(400);
  });

  test('invalid token', () => {
    const list = adminQuizInfoRequestV1('5435h45', quiz.quizId);
    expect(list.body).toStrictEqual(ERROR);
    expect(list.statusCode).toStrictEqual(401);
  });

  test('Unused tokenId', () => {
    const list = adminQuizInfoRequestV1(user.token + 1, quiz.quizId);
    expect(list.body).toStrictEqual(ERROR);
    expect(list.statusCode).toStrictEqual(403);
  });

  test('one question created', () => {
    const questionId = createQuizQuestionRequest(quiz.quizId, user.token, 'Question 1', 6, 3, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }]).questionId;
    expect(adminQuizInfoRequestV1(user.token, quiz.quizId).body).toStrictEqual({
      quizId: quiz.quizId,
      name: 'Cats',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'A quiz about cats',
      numQuestions: 1,
      questions: [
        {
          questionId: questionId,
          question: 'Question 1',
          duration: 6,
          points: 3,
          answers: [
            {
              answerId: expect.any(Number),
              answer: 'answer1',
              colour: expect.any(String),
              correct: true
            },
            {
              answerId: expect.any(Number),
              answer: 'answer2',
              colour: expect.any(String),
              correct: false
            }
          ]
        }
      ],
      duration: 6
    });
  });
});
