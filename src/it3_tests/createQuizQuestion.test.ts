import {
  quizCreateRequest,
  authRegisterRequest,
  clearRequest,
  createQuizQuestionRequest,
  adminQuizInfoRequest,
} from './it3_testRoutes';
import { TokenId, QuizId, QuestionId } from '../interfaces';
import HTTPError from 'http-errors';

const validAnswers = [{ answer: 'great', correct: true }, { answer: 'bad', correct: false }];

let user: TokenId;
let quiz: QuizId;
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'Firstname', 'Lastname').body;
  quiz = quizCreateRequest(user.token, 'Cats', 'A quiz about cats');
});

describe('Valid answer inputs, invalid other input', () => {
  test('QuizId does not refer to a valid quiz', () => {
    expect(() => createQuizQuestionRequest(quiz.quizId + 1, user.token, 'How are you?', 5, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg')).toThrow(HTTPError[400]);
  });

  test('QuizId does not refer to a quiz that this user owns', () => {
    const user2 = authRegisterRequest('email1@gmail.com', 'password2', 'FirstnameB', 'LastnameB').body;
    const quiz2 = quizCreateRequest(user2.token, 'Dogs', 'A quiz about dogs');
    expect(() => createQuizQuestionRequest(quiz2.quizId, user.token, 'How are you?', 5, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg')).toThrow(HTTPError[400]);
  });

  test.each([
    { testname: 'Question string <5 characters', question: 'abcd' },
    { testname: 'Question string >50 characters', question: 'abc'.repeat(20) },
    { testname: 'Question string empty', question: '' },
    { testname: 'Question string just whitespace', question: '       ' },
  ])('Incorrect question string: $testName', ({ question }) => {
    expect(() => createQuizQuestionRequest(quiz.quizId, user.token, question, 5, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg')).toThrow(HTTPError[400]);
  });

  test.each([
    { testname: 'Question duration negative', duration: -2, points: 5 },
    { testname: 'Question duration 0', duration: 0, points: 5 },
    { testname: 'Question duration >3 minutes', duration: 200, points: 5 },
    { testname: 'Question points negative', duration: 5, points: -5 },
    { testname: 'Question points 0', duration: 5, points: 0 },
    { testname: 'Question points >10', duration: 5, points: 15 },
  ])('Invalid question points or duration: $testName', ({ duration, points }) => {
    expect(() => createQuizQuestionRequest(quiz.quizId, user.token, 'How are you?', duration, points, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg')).toThrow(HTTPError[400]);
  });

  test('sum of questions durations in the quiz exceeds 3 minutes', () => {
    createQuizQuestionRequest(quiz.quizId, user.token, 'Question 1', 55, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
    createQuizQuestionRequest(quiz.quizId, user.token, 'Question 2', 100, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
    expect(() => createQuizQuestionRequest(quiz.quizId, user.token, 'Question 3', 55, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg')).toThrow(HTTPError[400]);
  });

  test('Empty URL', () => {
    expect(() => createQuizQuestionRequest(quiz.quizId, user.token, 'Question 4', 55, 5, validAnswers, '')).toThrow(HTTPError[400]);
  });

  test('Invalid URL', () => {
    expect(() => createQuizQuestionRequest(quiz.quizId, user.token, 'Question 4', 55, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d37.jpg')).toThrow(HTTPError[400]);
  });

  test('Not jpg or png', () => {
    expect(() => createQuizQuestionRequest(quiz.quizId, user.token, 'Question 4', 55, 5, validAnswers, 'https://media.tenor.com/sz-XG3TLQx8AAAAM/bugcat-capoo.gif')).toThrow(HTTPError[400]);
  });
});

describe('invalid answer inputs', () => {
  test.each([
    {
      testname: '>6 answers',
      answers: [
        { answer: 'ans1', correct: true },
        { answer: 'ans2', correct: false },
        { answer: 'ans3', correct: false },
        { answer: 'ans4', correct: false },
        { answer: 'ans5', correct: false },
        { answer: 'ans6', correct: false },
        { answer: 'ans7', correct: false }
      ]
    },
    {
      testname: '<2 answers',
      answers: [
        { answer: 'great', correct: true },
      ]
    },
    {
      testname: 'no answers',
      answers: []
    },
    {
      testname: 'length of an answer <1 character long',
      answers: [
        { answer: 'great', correct: true },
        { answer: 'bad', correct: false },
        { answer: '', correct: false }
      ]
    },
    {
      testname: 'length of an answer >30 character long',
      answers: [
        { answer: 'great', correct: true },
        { answer: 'abc'.repeat(12), correct: false },
        { answer: 'bad', correct: false }
      ]
    },
    {
      testname: 'answer strings duplicate of one another',
      answers: [
        { answer: 'great', correct: false },
        { answer: 'bad', correct: true },
        { answer: 'bad', correct: false }
      ]
    },
    {
      testname: 'no correct answers',
      answers: [
        { answer: 'great', correct: false },
        { answer: 'bad', correct: false }
      ]
    },
  ])('invalid answers: $testname', ({ answers }) => {
    expect(() => createQuizQuestionRequest(quiz.quizId, user.token, 'How are you?', 5, 5, answers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg')).toThrow(HTTPError[400]);
  });
});

describe('Token invalid', () => {
  test('token structure is null or undefined', () => {
    expect(() => createQuizQuestionRequest(quiz.quizId, null, 'How are you?', 5, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg')).toThrow(HTTPError[401]);

    expect(() => createQuizQuestionRequest(quiz.quizId, undefined, 'How are you?', 5, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg')).toThrow(HTTPError[401]);
  });

  // Whitebox testing - token has to be a string of numbers
  test.each([
    { testName: 'token just letters', token: 'hello' },
    { testName: 'token has space', token: '4324 757' },
    { testName: 'token only whitespace', token: '  ' },
    { testName: 'token has other characters', token: '6365,53' },
    { testName: 'empty string', token: '' },
  ])('token is not a valid structure: $testName', ({ token }) => {
    expect(() => createQuizQuestionRequest(quiz.quizId, token, 'How are you?', 5, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg')).toThrow(HTTPError[401]);
  });

  test('Unused tokenId', () => {
    expect(() => createQuizQuestionRequest(quiz.quizId, user.token + 1, 'How are you?', 5, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg')).toThrow(HTTPError[403]);
  });
});

describe('valid input', () => {
  let q1: QuestionId;
  beforeEach(() => {
    q1 = createQuizQuestionRequest(quiz.quizId, user.token, 'Question 1', 5, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
  });

  test('one question successfully created', () => {
    expect(q1.questionId).toStrictEqual(expect.any(Number));
    expect(adminQuizInfoRequest(user.token, quiz.quizId)).toStrictEqual({
      quizId: quiz.quizId,
      name: 'Cats',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'A quiz about cats',
      numQuestions: 1,
      questions: [
        {
          questionId: q1.questionId,
          question: 'Question 1',
          duration: 5,
          points: 5,
          answers: [
            { answerId: expect.any(Number), answer: 'great', colour: expect.any(String), correct: true },
            { answerId: expect.any(Number), answer: 'bad', colour: expect.any(String), correct: false },
          ],
          thumbnailUrl: expect.any(String),
        }
      ],
      duration: 5
    });
  });

  test('multiple questions successfully created', () => {
    const q2 = createQuizQuestionRequest(quiz.quizId, user.token, 'Question 2?', 6, 3, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }], 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
    const q3 = createQuizQuestionRequest(quiz.quizId, user.token, 'Question 3?', 6, 3, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }], 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');

    const expected = {
      quizId: quiz.quizId,
      name: 'Cats',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'A quiz about cats',
      numQuestions: 3,
      questions: [
        {
          questionId: q1.questionId,
          question: 'Question 1',
          duration: 5,
          points: 5,
          answers: [
            { answerId: expect.any(Number), answer: 'great', colour: expect.any(String), correct: true },
            { answerId: expect.any(Number), answer: 'bad', colour: expect.any(String), correct: false },
          ],
          thumbnailUrl: expect.any(String),
        },
        {
          questionId: q2.questionId,
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
          questionId: q3.questionId,
          question: 'Question 3?',
          duration: 6,
          points: 3,
          answers: [
            { answerId: expect.any(Number), answer: 'answer1', colour: expect.any(String), correct: true },
            { answerId: expect.any(Number), answer: 'answer2', colour: expect.any(String), correct: false },
          ],
          thumbnailUrl: expect.any(String),
        },
      ],
      duration: 17
    };
    expect(adminQuizInfoRequest(user.token, quiz.quizId)).toStrictEqual(expected);
  });

  test('timeLastEdited successfully updated', () => {
    const timeNow = Math.floor(Date.now() / 1000);
    createQuizQuestionRequest(quiz.quizId, user.token, 'How are you?', 5, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
    const result = adminQuizInfoRequest(user.token, quiz.quizId);
    expect(result.timeLastEdited).toBeGreaterThanOrEqual(timeNow);
    expect(result.timeLastEdited).toBeLessThanOrEqual(timeNow + 1);
  });
});
