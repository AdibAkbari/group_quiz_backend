// tests for authRegisterRequest function
import {
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  createQuizQuestionRequest,
  quizQuestionDuplicateRequest,
  adminQuizInfoRequest,
} from './testRoutes';

import {
  TokenId,
  QuizId,
  QuestionId,
} from '../interfaces';

const validAnswers = [{ answer: 'great', correct: true }, { answer: 'bad', correct: false }];
const ERROR = { error: expect.any(String) };

let user: TokenId;
let quiz: QuizId;
let question: QuestionId;
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
  quiz = quizCreateRequest(user.token, 'My Quiz', 'This is my quiz').body;
  question = createQuizQuestionRequest(quiz.quizId, user.token, 'How are you?', 5, 5, validAnswers).body;
});

describe('error cases', () => {
  test('quizId invalid', () => {
    const result = quizQuestionDuplicateRequest(quiz.quizId + 1, question.questionId, user.token);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(400);
  });

  test('user does not own quiz', () => {
    const user2 = authRegisterRequest('email2@gmail.com', 'password1', 'Firstname', 'Lastname').body;
    const result = quizQuestionDuplicateRequest(quiz.quizId, question.questionId, user2.token);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(400);
  });

  test('questionId invalid', () => {
    const result = quizQuestionDuplicateRequest(quiz.quizId, question.questionId + 1, user.token);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(400);
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
  ])('token invalid structure: $testName', ({ token }) => {
    const result = quizQuestionDuplicateRequest(quiz.quizId, question.questionId, token);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(401);
  });

  test('TokenId not logged in', () => {
    const result = quizQuestionDuplicateRequest(quiz.quizId, question.questionId, user.token + 1);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(403);
  });
});

describe('valid input', () => {
  test('one question duplicate', () => {
    const result = quizQuestionDuplicateRequest(quiz.quizId, question.questionId, user.token);
    expect(result.body).toStrictEqual({ newQuestionId: expect.any(Number) });
    expect(result.statusCode).toStrictEqual(200);
    expect(adminQuizInfoRequest(user.token, quiz.quizId).body).toStrictEqual({
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
          ]
        },
        {
          questionId: result.body.newQuestionId,
          question: 'How are you?',
          duration: 5,
          points: 5,
          answers: [
            { answerId: expect.any(Number), answer: 'great', colour: expect.any(String), correct: true },
            { answerId: expect.any(Number), answer: 'bad', colour: expect.any(String), correct: false },
          ]
        }
      ],
      duration: 10,
    });
    const timeNow = Math.floor(Date.now() / 1000);
    const info = adminQuizInfoRequest(user.token, quiz.quizId).body;
    expect(info.timeLastEdited).toBeGreaterThanOrEqual(timeNow);
    expect(info.timeLastEdited).toBeLessThanOrEqual(timeNow + 1);
  });

  // whitebox testing, assuming questions appear in the order they were created
  test('two questions, duplicate the first', () => {
    const answersQuestion2 = [{ answer: 'yum', correct: true }, { answer: 'ew', correct: false }];
    const questionTwo = createQuizQuestionRequest(quiz.quizId, user.token, 'Pineapples on pizza?', 3, 3, answersQuestion2).body;
    const result = quizQuestionDuplicateRequest(quiz.quizId, question.questionId, user.token);
    expect(result.body).toStrictEqual({ newQuestionId: expect.any(Number) });
    expect(result.statusCode).toStrictEqual(200);
    expect(adminQuizInfoRequest(user.token, quiz.quizId).body).toStrictEqual({
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
          ]
        },
        {
          questionId: result.body.newQuestionId,
          question: 'How are you?',
          duration: 5,
          points: 5,
          answers: [
            { answerId: expect.any(Number), answer: 'great', colour: expect.any(String), correct: true },
            { answerId: expect.any(Number), answer: 'bad', colour: expect.any(String), correct: false },
          ]
        },
        {
          questionId: questionTwo.questionId,
          question: 'Pineapples on pizza?',
          duration: 3,
          points: 3,
          answers: [
            { answerId: expect.any(Number), answer: 'yum', colour: expect.any(String), correct: true },
            { answerId: expect.any(Number), answer: 'ew', colour: expect.any(String), correct: false },
          ]
        }
      ],
      duration: 13,
    });
    const timeNow = Math.floor(Date.now() / 1000);
    const info = adminQuizInfoRequest(user.token, quiz.quizId).body;
    expect(info.timeLastEdited).toBeGreaterThanOrEqual(timeNow);
    expect(info.timeLastEdited).toBeLessThanOrEqual(timeNow + 1);
  });
});
