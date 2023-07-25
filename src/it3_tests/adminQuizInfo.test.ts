import {
  adminQuizInfoRequest,
  quizCreateRequest,
  authRegisterRequest,
  clearRequest,
  createQuizQuestionRequest,
  quizRemoveRequest,
  quizNameUpdateRequest,
  quizDescriptionUpdateRequest
} from './it3_testRoutes';
import HTTPError from 'http-errors';

import { TokenId, QuizId } from '../interfaces';

let user: TokenId;
let quiz: QuizId;
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'Firstname', 'Lastname');
  quiz = quizCreateRequest(user.token, 'Cats', 'A quiz about cats');
});

describe('QuizId invalid', () => {
  test('Quiz Id does not refer to a valid quiz', () => {
    expect(() => adminQuizInfoRequest(user.token, quiz.quizId + 1)).toThrow(HTTPError[400])
  });

  test('Quiz Id does not refer to a quiz that this user owns', () => {
    const user2 = authRegisterRequest('email2@gmail.com', 'password1', 'FirstnameB', 'LastnameB');
    expect(() => adminQuizInfoRequest(user2.token, quiz.quizId)).toThrow(HTTPError[400])
    const quiz2 = quizCreateRequest(user2.token, 'Dogs', 'A quiz about dogs');
    expect(() => adminQuizInfoRequest(user.token, quiz2.quizId)).toThrow(HTTPError[400])
  });
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
    expect(() => adminQuizInfoRequest(token, quiz.quizId)).toThrow(HTTPError[401])
  });

  test('Unused tokenId', () => {
    expect(() => adminQuizInfoRequest(user.token + 1, quiz.quizId)).toThrow(HTTPError[403])
  });
});

describe('Valid inputs', () => {
  test('only one quiz created', () => {
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

  test('more than one quiz stored', () => {
    const user2 = authRegisterRequest('email2@gmail.com', 'password1', 'FirstnameB', 'LastnameB');
    const quiz2 = quizCreateRequest(user2.token, 'Dogs', 'A quiz about dogs');
    expect(adminQuizInfoRequest(user2.token, quiz2.quizId)).toStrictEqual({
      quizId: quiz2.quizId,
      name: 'Dogs',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'A quiz about dogs',
      numQuestions: 0,
      questions: [],
      duration: 0
    });
  });

  test('more than one quiz created by user', () => {
    const user2 = authRegisterRequest('email2@gmail.com', 'password1', 'FirstnameB', 'LastnameB');
    quizCreateRequest(user2.token, 'Dogs', 'A quiz about dogs');
    const quiz3 = quizCreateRequest(user.token, 'Birds', 'A quiz about birds');
    expect(adminQuizInfoRequest(user.token, quiz3.quizId)).toStrictEqual({
      quizId: quiz3.quizId,
      name: 'Birds',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'A quiz about birds',
      numQuestions: 0,
      questions: [],
      duration: 0
    });
  });
});

describe('quizzes with questions created', () => {
  let questionId: number;
  beforeEach(() => {
    questionId = createQuizQuestionRequest(quiz.quizId, user.token, 'Question 1', 6, 3, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }]).questionId;
  });

  test('one question created', () => {
    expect(adminQuizInfoRequest(user.token, quiz.quizId)).toStrictEqual({
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

  test('multiple questions created', () => {
    const q2Id = createQuizQuestionRequest(quiz.quizId, user.token, 'Question 2?', 6, 3, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }]).questionId;
    const q3Id = createQuizQuestionRequest(quiz.quizId, user.token, 'Question 3?', 6, 3, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }]).questionId;
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
        ]
      },
      {
        questionId: q2Id,
        question: 'Question 2?',
        duration: 6,
        points: 3,
        answers: [
          { answerId: expect.any(Number), answer: 'answer1', colour: expect.any(String), correct: true },
          { answerId: expect.any(Number), answer: 'answer2', colour: expect.any(String), correct: false },
        ]
      },
      {
        questionId: q3Id,
        question: 'Question 3?',
        duration: 6,
        points: 3,
        answers: [
          { answerId: expect.any(Number), answer: 'answer1', colour: expect.any(String), correct: true },
          { answerId: expect.any(Number), answer: 'answer2', colour: expect.any(String), correct: false },
        ]
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

describe('testing with other functions', () => {
  test('removing quiz', () => {
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

    quizRemoveRequest(user.token, quiz.quizId);
    expect(adminQuizInfoRequest(user.token, quiz.quizId)).toStrictEqual(ERROR);
  });

  test('name update', () => {
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

    quizNameUpdateRequest(user.token, quiz.quizId, 'NewName');
    expect(adminQuizInfoRequest(user.token, quiz.quizId)).toStrictEqual({
      quizId: quiz.quizId,
      name: 'NewName',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'A quiz about cats',
      numQuestions: 0,
      questions: [],
      duration: 0
    });
  });

  test('description update', () => {
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

    quizDescriptionUpdateRequest(quiz.quizId, user.token, 'New description');
    expect(adminQuizInfoRequest(user.token, quiz.quizId)).toStrictEqual({
      quizId: quiz.quizId,
      name: 'Cats',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'New description',
      numQuestions: 0,
      questions: [],
      duration: 0
    });
  });
});
