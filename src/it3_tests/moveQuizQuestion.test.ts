import {
  quizCreateRequest,
  authRegisterRequest,
  clearRequest,
  createQuizQuestionRequest,
  moveQuizQuestionRequest,
  adminQuizInfoRequest
} from './it3_testRoutes';
import HTTPError from 'http-errors';

import {
  TokenId,
} from '../interfaces';

const validAnswers = [{ answer: 'great', correct: true }, { answer: 'bad', correct: false }];

let user: TokenId;
let quizId: number;
let question1Id: number;
let question2Id: number;
let question3Id: number;
let question4Id: number;
let question5Id: number;

beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'Firstname', 'Lastname');
  quizId = quizCreateRequest(user.token, 'Cats', 'A quiz about cats').quizId;
  question1Id = createQuizQuestionRequest(quizId, user.token, 'Question 1?', 6, 3, validAnswers).questionId;
  question2Id = createQuizQuestionRequest(quizId, user.token, 'Question 2?', 6, 3, validAnswers).questionId;
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
    expect(() => moveQuizQuestionRequest(token, quizId, question1Id, 1)).toThrow(HTTPError[401]);
  });

  test('Unused tokenId', () => {
    expect(() => moveQuizQuestionRequest(user.token + 1, quizId, question1Id, 1)).toThrow(HTTPError[403]);
  });
});

describe('Invalid params', () => {
  test('QuizId does not refer to a valid quiz', () => {
    expect(() => moveQuizQuestionRequest(user.token, quizId + 1, question1Id, 1)).toThrow(HTTPError[400]);
  });

  test('QuizId does not refer to a quiz that this user owns', () => {
    const user2 = authRegisterRequest('email1@gmail.com', 'password2', 'FirstnameB', 'LastnameB');
    expect(() => moveQuizQuestionRequest(user2.token, quizId, question1Id, 1)).toThrow(HTTPError[400]);
  });

  test('No questions in any quiz with this questionId', () => {
    expect(() => moveQuizQuestionRequest(user.token, quizId, question1Id + 2, 1)).toThrow(HTTPError[400]);
  });

  test('No questions in this quiz with this questionId', () => {
    const quiz2Id = quizCreateRequest(user.token, 'Quiz2', '').quizId;
    expect(() => moveQuizQuestionRequest(user.token, quiz2Id, question1Id, 1)).toThrow(HTTPError[400]);
  });
});

describe('Invalid newPosition test', () => {
  test('newPosition < 0', () => {
    expect(() => moveQuizQuestionRequest(user.token, quizId, question1Id, -1)).toThrow(HTTPError[400]);
  });

  test('newPosition > n-1, where n is the number of questions', () => {
    expect(() => moveQuizQuestionRequest(user.token, quizId, question1Id, 2)).toThrow(HTTPError[400]);
  });

  test('NewPosition is the position of the current question', () => {
    expect(() => moveQuizQuestionRequest(user.token, quizId, question1Id, 0)).toThrow(HTTPError[400]);
  });
});

describe('Successful Move Question', () => {
  test('correct return', () => {
    expect(moveQuizQuestionRequest(user.token, quizId, question1Id, 1)).toStrictEqual({});
  });

  test('correct QuizInfo output', () => {
    moveQuizQuestionRequest(user.token, quizId, question1Id, 1);

    const received = adminQuizInfoRequest(user.token, quizId);
    const expected = {
      quizId: quizId,
      name: 'Cats',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'A quiz about cats',
      numQuestions: 2,
      questions: [
        {
          questionId: question2Id,
          question: 'Question 2?',
          duration: 6,
          points: 3,
          answers: [
            { answerId: expect.any(Number), answer: 'great', colour: expect.any(String), correct: true },
            { answerId: expect.any(Number), answer: 'bad', colour: expect.any(String), correct: false },
          ]
        },
        {
          questionId: question1Id,
          question: 'Question 1?',
          duration: 6,
          points: 3,
          answers: [
            { answerId: expect.any(Number), answer: 'great', colour: expect.any(String), correct: true },
            { answerId: expect.any(Number), answer: 'bad', colour: expect.any(String), correct: false },
          ]
        },
      ],
      duration: 12
    };

    expect(received).toStrictEqual(expected);
  });

  test('correct QuizInfo output: multiple questions', () => {
    question3Id = createQuizQuestionRequest(quizId, user.token, 'Question 3?', 6, 3, validAnswers).questionId;
    question4Id = createQuizQuestionRequest(quizId, user.token, 'Question 4?', 6, 3, validAnswers).questionId;
    question5Id = createQuizQuestionRequest(quizId, user.token, 'Question 5?', 6, 3, validAnswers).questionId;

    moveQuizQuestionRequest(user.token, quizId, question1Id, 1);

    const received = adminQuizInfoRequest(user.token, quizId);
    const expected = {
      quizId: quizId,
      name: 'Cats',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'A quiz about cats',
      numQuestions: 5,
      questions: [
        {
          questionId: question2Id,
          question: 'Question 2?',
          duration: 6,
          points: 3,
          answers: [
            { answerId: expect.any(Number), answer: 'great', colour: expect.any(String), correct: true },
            { answerId: expect.any(Number), answer: 'bad', colour: expect.any(String), correct: false },
          ]
        },
        {
          questionId: question1Id,
          question: 'Question 1?',
          duration: 6,
          points: 3,
          answers: [
            { answerId: expect.any(Number), answer: 'great', colour: expect.any(String), correct: true },
            { answerId: expect.any(Number), answer: 'bad', colour: expect.any(String), correct: false },
          ]
        },
        {
          questionId: question3Id,
          question: 'Question 3?',
          duration: 6,
          points: 3,
          answers: [
            { answerId: expect.any(Number), answer: 'great', colour: expect.any(String), correct: true },
            { answerId: expect.any(Number), answer: 'bad', colour: expect.any(String), correct: false },
          ]
        },
        {
          questionId: question4Id,
          question: 'Question 4?',
          duration: 6,
          points: 3,
          answers: [
            { answerId: expect.any(Number), answer: 'great', colour: expect.any(String), correct: true },
            { answerId: expect.any(Number), answer: 'bad', colour: expect.any(String), correct: false },
          ]
        },
        {
          questionId: question5Id,
          question: 'Question 5?',
          duration: 6,
          points: 3,
          answers: [
            { answerId: expect.any(Number), answer: 'great', colour: expect.any(String), correct: true },
            { answerId: expect.any(Number), answer: 'bad', colour: expect.any(String), correct: false },
          ]
        },
      ],
      duration: 30
    };

    expect(received).toStrictEqual(expected);
  });

  test('Correct time last edited', () => {
    const expectedTimeTransfered = Math.floor(Date.now() / 1000);
    moveQuizQuestionRequest(user.token, quizId, question1Id, 1);

    const quizInfo = adminQuizInfoRequest(user.token, quizId);

    const timeSent = quizInfo.timeLastEdited;

    expect(timeSent).toBeGreaterThanOrEqual(expectedTimeTransfered);
    expect(timeSent).toBeLessThanOrEqual(expectedTimeTransfered + 3);
  });
});
