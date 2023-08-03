import {
  quizCreateRequest,
  authRegisterRequest,
  clearRequest,
  createQuizQuestionRequestV1,
  deleteQuizQuestionRequest,
  adminQuizInfoRequest,
  updateQuizQuestionRequestV1
} from './it3_testRoutes';
import { TokenId } from '../interfaces';

const validAnswers = [{ answer: 'great', correct: true }, { answer: 'bad', correct: false }];
const ERROR = { error: expect.any(String) };

let user: TokenId;
let quizId: number;
let questionId: number;
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'Firstname', 'Lastname').body;
  quizId = quizCreateRequest(user.token, 'Cats', 'A quiz about cats').quizId;
  questionId = createQuizQuestionRequestV1(quizId, user.token, 'Question 1?', 6, 3, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }]).body.questionId;
});

describe('Invalid params', () => {
  test('QuizId does not refer to a valid quiz', () => {
    const result = updateQuizQuestionRequestV1(quizId + 1, questionId, user.token, 'How are you?', 5, 5, validAnswers);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(400);
  });

  test('QuizId does not refer to a quiz that this user owns', () => {
    const user2 = authRegisterRequest('email1@gmail.com', 'password2', 'FirstnameB', 'LastnameB').body;
    const result = updateQuizQuestionRequestV1(quizId, questionId, user2.token, 'How are you?', 5, 5, validAnswers);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(400);
  });

  test('No questions in any quiz with this questionId', () => {
    const result = updateQuizQuestionRequestV1(quizId, questionId + 1, user.token, 'How are you?', 5, 5, validAnswers);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(400);
  });

  test('question with given questionId has been removed', () => {
    deleteQuizQuestionRequest(user.token, quizId, questionId);
    const result = updateQuizQuestionRequestV1(quizId, questionId, user.token, 'How are you?', 5, 5, validAnswers);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(400);
  });
});

describe('invalid question body - question, duration, points', () => {
  test.each([
    { testname: 'Question string <5 characters', question: 'abcd' },
    { testname: 'Question string >50 characters', question: 'a'.repeat(60) },
    { testname: 'Question string empty', question: '' },
    { testname: 'Question string just whitespace', question: '       ' },
  ])('Incorrect question string: $testName', ({ question }) => {
    const result = updateQuizQuestionRequestV1(quizId, questionId, user.token, question, 5, 5, validAnswers);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(400);
  });

  test.each([
    { testname: 'Question duration negative', duration: -2, points: 5 },
    { testname: 'Question duration 0', duration: 0, points: 5 },
    { testname: 'Question duration >3 minutes', duration: 200, points: 5 },
    { testname: 'Question points negative', duration: 5, points: -5 },
    { testname: 'Question points 0', duration: 5, points: 0 },
    { testname: 'Question points >10', duration: 5, points: 15 },
  ])('Invalid question points or duration: $testName', ({ duration, points }) => {
    const result = updateQuizQuestionRequestV1(quizId, questionId, user.token, 'How are you?', duration, points, validAnswers);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(400);
  });

  test('if this quiz were to be updated, sum of question durations exceed 3 minutes', () => {
    createQuizQuestionRequestV1(quizId, user.token, 'Question 2', 150, 5, validAnswers);
    const result = updateQuizQuestionRequestV1(quizId, questionId, user.token, 'How are you?', 40, 5, validAnswers);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(400);
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
    const result = updateQuizQuestionRequestV1(quizId, questionId, user.token, 'How are you?', 5, 5, answers);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(400);
  });
});

describe('Token invalid', () => {
  test('invalid token structure', () => {
    const result = updateQuizQuestionRequestV1(quizId, questionId, '432h4324', 'How are you?', 5, 5, validAnswers);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(401);
  });

  test('Unused tokenId', () => {
    const result = updateQuizQuestionRequestV1(quizId, questionId, user.token + 1, 'How are you?', 5, 5, validAnswers);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(403);
  });
});

describe('valid input', () => {
  test('quiz with one question successfully updated', () => {
    updateQuizQuestionRequestV1(quizId, questionId, user.token, 'New Question', 5, 4, validAnswers);

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
        }
      ],
      duration: 5,
    });
  });

  test('quiz with multiple questions successfully updated', () => {
    const q2Id = createQuizQuestionRequestV1(quizId, user.token, 'Question 2?', 6, 3, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }]).body.questionId;
    const q3Id = createQuizQuestionRequestV1(quizId, user.token, 'Question 3?', 6, 3, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }]).body.questionId;
    updateQuizQuestionRequestV1(quizId, q2Id, user.token, 'New Question 2', 5, 4, validAnswers);

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
        },
      ],
      duration: 17,
    };
    expect(adminQuizInfoRequest(user.token, quizId)).toStrictEqual(expected);
  });
  test('timeLastEdited successfully updated', () => {
    const timeNow = Math.floor(Date.now() / 1000);
    updateQuizQuestionRequestV1(quizId, questionId, user.token, 'New Question', 5, 4, validAnswers);
    const result = adminQuizInfoRequest(user.token, quizId);
    expect(result.timeLastEdited).toBeGreaterThanOrEqual(timeNow);
    expect(result.timeLastEdited).toBeLessThanOrEqual(timeNow + 1);
  });

  test('quiz duration only <3 minutes when old question duration no longer included', () => {
    const q2Id = createQuizQuestionRequestV1(quizId, user.token, 'Question 2', 50, 5, validAnswers).body.questionId;
    createQuizQuestionRequestV1(quizId, user.token, 'Question 3', 50, 5, validAnswers);
    createQuizQuestionRequestV1(quizId, user.token, 'Question 4', 50, 5, validAnswers);
    const result = updateQuizQuestionRequestV1(quizId, q2Id, user.token, 'How are you?', 55, 5, validAnswers).body;
    expect(result).toStrictEqual({});
  });
});
