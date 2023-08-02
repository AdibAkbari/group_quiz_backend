import {
  quizCreateRequest,
  authRegisterRequest,
  clearRequest,
  createQuizQuestionRequest,
  updateQuizQuestionRequest,
  deleteQuizQuestionRequest,
  adminQuizInfoRequest,
  updateQuizQuestionRequestV1
} from './it3_testRoutes';
import { TokenId } from '../interfaces';
import HTTPError from 'http-errors';

const validAnswers = [{ answer: 'great', correct: true }, { answer: 'bad', correct: false }];
const ERROR = { error: expect.any(String) };

let user: TokenId;
let quizId: number;
let questionId: number;
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'Firstname', 'Lastname').body;
  quizId = quizCreateRequest(user.token, 'Cats', 'A quiz about cats').quizId;
  questionId = createQuizQuestionRequest(quizId, user.token, 'Question 1?', 6, 3, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }], 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg').questionId;
});

describe('Invalid params', () => {
  test('QuizId does not refer to a valid quiz', () => {
    expect(() => updateQuizQuestionRequest(quizId + 1, questionId, user.token, 'How are you?', 5, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg')).toThrow(HTTPError[400]);
  });

  test('QuizId does not refer to a quiz that this user owns', () => {
    const user2 = authRegisterRequest('email1@gmail.com', 'password2', 'FirstnameB', 'LastnameB').body;
    expect(() => updateQuizQuestionRequest(quizId, questionId, user2.token, 'How are you?', 5, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg')).toThrow(HTTPError[400]);
  });

  test('No questions in any quiz with this questionId', () => {
    expect(() => updateQuizQuestionRequest(quizId, questionId + 1, user.token, 'How are you?', 5, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg')).toThrow(HTTPError[400]);
  });

  test('question with given questionId has been removed', () => {
    deleteQuizQuestionRequest(user.token, quizId, questionId);
    expect(() => updateQuizQuestionRequest(quizId, questionId, user.token, 'How are you?', 5, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg')).toThrow(HTTPError[400]);
  });

  test('Empty URL', () => {
    expect(() => updateQuizQuestionRequest(quizId, questionId, user.token, 'How are you?', 5, 5, validAnswers, '')).toThrow(HTTPError[400]);
  });

  test('Invalid URL', () => {
    expect(() => updateQuizQuestionRequest(quizId, questionId, user.token, 'How are you?', 5, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7123.jpg')).toThrow(HTTPError[400]);
  });

  test('Not jpg or png', () => {
    expect(() => updateQuizQuestionRequest(quizId, questionId, user.token, 'How are you?', 5, 5, validAnswers, 'https://media.tenor.com/sz-XG3TLQx8AAAAM/bugcat-capoo.gif')).toThrow(HTTPError[400]);
  });
});

describe('invalid question body - question, duration, points', () => {
  test.each([
    { testname: 'Question string <5 characters', question: 'abcd' },
    { testname: 'Question string >50 characters', question: 'a'.repeat(60) },
    { testname: 'Question string empty', question: '' },
    { testname: 'Question string just whitespace', question: '       ' },
  ])('Incorrect question string: $testName', ({ question }) => {
    expect(() => updateQuizQuestionRequest(quizId, questionId, user.token, question, 5, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg')).toThrow(HTTPError[400]);
  });

  test.each([
    { testname: 'Question duration negative', duration: -2, points: 5 },
    { testname: 'Question duration 0', duration: 0, points: 5 },
    { testname: 'Question duration >3 minutes', duration: 200, points: 5 },
    { testname: 'Question points negative', duration: 5, points: -5 },
    { testname: 'Question points 0', duration: 5, points: 0 },
    { testname: 'Question points >10', duration: 5, points: 15 },
  ])('Invalid question points or duration: $testName', ({ duration, points }) => {
    expect(() => updateQuizQuestionRequest(quizId, questionId, user.token, 'How are you?', duration, points, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg')).toThrow(HTTPError[400]);
  });

  test('if this quiz were to be updated, sum of question durations exceed 3 minutes', () => {
    createQuizQuestionRequest(quizId, user.token, 'Question 2', 50, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
    createQuizQuestionRequest(quizId, user.token, 'Question 3', 50, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
    createQuizQuestionRequest(quizId, user.token, 'Question 4', 50, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
    expect(() => updateQuizQuestionRequest(quizId, questionId, user.token, 'How are you?', 40, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg')).toThrow(HTTPError[400]);
  });
});

describe('invalid question body - answers', () => {
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
        { answer: 'a'.repeat(35), correct: false },
        { answer: 'bad', correct: false }
      ]
    },
    {
      testname: 'answer strings duplicate of one another, one false one true',
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
    expect(() => updateQuizQuestionRequest(quizId, questionId, user.token, 'How are you?', 5, 5, answers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg')).toThrow(HTTPError[400]);
  });
});

describe('Token invalid', () => {
  test.each([
    { testName: 'token just letters', token: 'hello' },
    { testName: 'token starts with letters', token: 'a54364' },
    { testName: 'token has space', token: '4324 757' },
    { testName: 'token only whitespace', token: '  ' },
    { testName: 'token has other characters', token: '6365,53+' },
    { testName: 'empty string', token: '' },
  ])('token is not a valid structure: $testName', ({ token }) => {
    expect(() => updateQuizQuestionRequest(quizId, questionId, token, 'How are you?', 5, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg')).toThrow(HTTPError[401]);
  });

  test('Unused tokenId', () => {
    expect(() => updateQuizQuestionRequest(quizId, questionId, user.token + 1, 'How are you?', 5, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg')).toThrow(HTTPError[403]);
  });
});

describe('valid input', () => {
  test('correct return type and status code', () => {
    const result = updateQuizQuestionRequest(quizId, questionId, user.token, 'New Question', 5, 4, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
    expect(result).toStrictEqual({});
  });

  test('quiz with one question successfully updated', () => {
    updateQuizQuestionRequest(quizId, questionId, user.token, 'New Question', 5, 4, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
    expect(adminQuizInfoRequest(user.token, quizId)).toStrictEqual({
      quizId: quizId,
      name: 'Cats',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'A quiz about cats',
      numQuestions: 1,
      questions: [
        {
          questionId: questionId,
          question: 'New Question',
          duration: 5,
          points: 4,
          answers: [
            { answerId: expect.any(Number), answer: 'great', colour: expect.any(String), correct: true },
            { answerId: expect.any(Number), answer: 'bad', colour: expect.any(String), correct: false },
          ],
          thumbnailUrl: expect.any(String),
        }
      ],
      duration: 5,
    });
  });

  test('quiz with multiple questions successfully updated', () => {
    const q2Id = createQuizQuestionRequest(quizId, user.token, 'Question 2?', 6, 3, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }], 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg').questionId;
    const q3Id = createQuizQuestionRequest(quizId, user.token, 'Question 3?', 6, 3, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }], 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg').questionId;
    updateQuizQuestionRequest(quizId, q2Id, user.token, 'New Question 2', 5, 4, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');

    const expected = {
      quizId: quizId,
      name: 'Cats',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'A quiz about cats',
      numQuestions: 3,
      questions: [
        {
          questionId: questionId,
          question: 'Question 1?',
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
          question: 'New Question 2',
          duration: 5,
          points: 4,
          answers: [
            { answerId: expect.any(Number), answer: 'great', colour: expect.any(String), correct: true },
            { answerId: expect.any(Number), answer: 'bad', colour: expect.any(String), correct: false },
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
        },
      ],
      duration: 17,
    };
    expect(adminQuizInfoRequest(user.token, quizId)).toStrictEqual(expected);
  });
  test('timeLastEdited successfully updated', () => {
    const timeNow = Math.floor(Date.now() / 1000);
    updateQuizQuestionRequest(quizId, questionId, user.token, 'New Question', 5, 4, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
    const result = adminQuizInfoRequest(user.token, quizId);
    expect(result.timeLastEdited).toBeGreaterThanOrEqual(timeNow);
    expect(result.timeLastEdited).toBeLessThanOrEqual(timeNow + 1);
  });

  test('quiz duration only <3 minutes when old question duration no longer included', () => {
    const q2Id = createQuizQuestionRequest(quizId, user.token, 'Question 2', 50, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg').questionId;
    createQuizQuestionRequest(quizId, user.token, 'Question 3', 50, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
    createQuizQuestionRequest(quizId, user.token, 'Question 4', 50, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
    const result = updateQuizQuestionRequest(quizId, q2Id, user.token, 'How are you?', 55, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
    expect(result).toStrictEqual({});
  });
});

describe('V1 WRAPPERS', () => {
  test.each([
    { testName: 'token just letters', token: 'hello' },
    { testName: 'token starts with letters', token: 'a54364' },
  ])('token is not a valid structure: $testName', ({ token }) => {
    const result = updateQuizQuestionRequestV1(quizId, questionId, token, 'How are you?', 5, 5, validAnswers);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(401);
  });

  test('Unused tokenId', () => {
    const result = updateQuizQuestionRequestV1(quizId, questionId, user.token + 1, 'How are you?', 5, 5, validAnswers);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(403);
  });

  test('QuizId does not refer to a valid quiz', () => {
    const result = updateQuizQuestionRequestV1(quizId + 1, questionId, user.token, 'How are you?', 5, 5, validAnswers);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(400);
  });

  test('correct return type and status code', () => {
    const result = updateQuizQuestionRequestV1(quizId, questionId, user.token, 'New Question', 5, 4, validAnswers);
    expect(result.body).toStrictEqual({});
    expect(result.statusCode).toStrictEqual(200);
  });
});
