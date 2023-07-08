import {
  quizCreateRequest,
  authRegisterRequest,
  clearRequest,
  createQuizQuestionRequest,
//  quizQuestionDeleteRequest,
//  adminQuizInfoRequest
} from './testRoutes';

interface Token {
    token: string
}

interface Quiz {
    quizId: number
}

interface Question {
    questionId: number
}

const validAnswers = [{ answer: 'great', correct: true }, { answer: 'bad', correct: false }];

const ERROR = { error: expect.any(String) };

let user: Token;
let quiz: Quiz;
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'Firstname', 'Lastname').body;
  quiz = quizCreateRequest(user.token, 'Cats', 'A quiz about cats').body;
});

describe('Valid answer inputs, invalid other input', () => {
  test('QuizId does not refer to a valid quiz', () => {
    const result = createQuizQuestionRequest(quiz.quizId + 1, user.token, 'How are you?', 5, 5, validAnswers);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(400);
  });

  test('QuizId does not refer to a quiz that this user owns', () => {
    const user2 = authRegisterRequest('email1@gmail.com', 'password2', 'FirstnameB', 'LastnameB').body;
    const quiz2 = quizCreateRequest(user2.token, 'Dogs', 'A quiz about dogs').body;
    const result = createQuizQuestionRequest(quiz2.quizId, user.token, 'How are you?', 5, 5, validAnswers);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(400);
  });

  test.each([
    { testname: 'Question string <5 characters', question: 'abcd' },
    { testname: 'Question string >50 characters', question: 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz' },
    { testname: 'Question string empty', question: '' },
    { testname: 'Question string just whitespace', question: '       ' },
  ])('Incorrect question string: $testName', ({ question }) => {
    const result = createQuizQuestionRequest(quiz.quizId, user.token, question, 5, 5, validAnswers);
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
    const result = createQuizQuestionRequest(quiz.quizId, user.token, 'How are you?', duration, points, validAnswers);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(400);
  });

  test('sum of questions durations in the quiz exceeds 3 minutes', () => {
    createQuizQuestionRequest(quiz.quizId, user.token, 'Question 1', 55, 5, validAnswers);
    createQuizQuestionRequest(quiz.quizId, user.token, 'Question 2', 55, 5, validAnswers);
    createQuizQuestionRequest(quiz.quizId, user.token, 'Question 3', 55, 5, validAnswers);
    const result = createQuizQuestionRequest(quiz.quizId, user.token, 'Question 4', 55, 5, validAnswers);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(400);
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
        { answer: 'abcdefghijklmnopqrstuvwxyzabcdefghij', correct: false },
        { answer: 'bad', correct: false }
      ]
    },
    {
      testname: 'answer strings duplicate of one another, both false',
      answers: [
        { answer: 'great', correct: true },
        { answer: 'bad', correct: false },
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
    const result = createQuizQuestionRequest(quiz.quizId, user.token, 'How are you?', 5, 5, answers);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(400);
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
    const result = createQuizQuestionRequest(quiz.quizId, token, 'How are you?', 5, 5, validAnswers);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(401);
  });

  test('Unused tokenId', () => {
    const result = createQuizQuestionRequest(quiz.quizId, user.token + 1, 'How are you?', 5, 5, validAnswers);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(403);
  });
});

describe('correct return from valid input', () => {
  let q1: Question;
  beforeEach(() => {
    q1 = createQuizQuestionRequest(quiz.quizId, user.token, 'Question 1', 5, 5, validAnswers).body;
  });

  test('create 1 question', () => {
    expect(q1.questionId).toStrictEqual(expect.any(Number));
  });

  test('unique question Id for each quiz', () => {
    const q2 = createQuizQuestionRequest(quiz.quizId, user.token, 'Question 2', 5, 5, validAnswers).body;
    expect(q2.questionId).toStrictEqual(expect.any(Number));
    expect(q1.questionId).not.toStrictEqual(q2.questionId);
  });

  // test.skip('unique quesiton Id after question is removed', () => {
  //     const q2 = createQuizQuestionRequest(quiz.quizId, user.token, "Question 2", 5, 5, validAnswers).body;
  //     const qRemove = createQuizQuestionRequest(quiz.quizId, user.token, "Question to remove", 5, 5, validAnswers).body;
  //     quizQuestionDeleteRequest(quiz.quizId, qRemove.questionId, user.token);
  //     const q3 = createQuizQuestionRequest(quiz.quizId, user.token, "Question 3", 5, 5, validAnswers).body;
  //     expect(q3.questionId).not.toStrictEqual(q1.questionId);
  //     expect(q3.questionId).not.toStrictEqual(q2.questionId);

  // })

  test('correct status code', () => {
    const result = createQuizQuestionRequest(quiz.quizId, user.token, 'How are you?', 5, 5, validAnswers);
    expect(result.body.questionId).toStrictEqual(expect.any(Number));
    expect(result.statusCode).toStrictEqual(200);
  });

  // test('confirming one question creation with quizInfo', () => {
  //     expect(adminQuizInfoRequest(quiz.quizId, user.token).body).toStrictEqual({
  //         quizId: quiz.quizId,
  //         name: 'Cats',
  //         timeCreated: expect.any(Number),
  //         timeLastEdited: expect.any(Number),
  //         description: 'A quiz about cats',
  //         numQuestions: 1,
  //         questions: [
  //             {
  //                 questionId: q1.questionId,
  //                 question: "Question 1",
  //                 duration: 5,
  //                 thumbnailUrl: "ERROR: WHAT DOES THIS RETURN",
  //                 points: 5,
  //                 answers: [
  //                     {
  //                         answerId: expect.any(Number),
  //                         answer: "great",
  //                         colour: expect.any(String),
  //                         correct: true
  //                     },
  //                     {
  //                         answerId: expect.any(Number),
  //                         answer: "bad",
  //                         colour: expect.any(String),
  //                         correct: false
  //                     },
  //                 ]
  //             }
  //         ]
  //     })

  // once written quiz info, copy test that checks if multiple quiz questions have been properly created
});

describe('valid edge cases', () => {
  test.each([
    { testname: 'question string length 5', question: 'abcde', duration: 5, points: 5 },
    { testname: 'question string length 50', question: 'qwertyuioplkjhgfdsazxcvbnmqwertyuioplkjhgfdsazxcvb', duration: 5, points: 5 },
    { testname: 'duration 3 minutes', question: 'valid question', duration: 180, points: 5 },
    { testname: 'points is 1', question: 'valid question', duration: 5, points: 1 },
    { testname: 'points is 10', question: 'valid question', duration: 5, points: 10 }
  ])('valid edge cases for question, duration and points: $testname', ({ question, duration, points }) => {
    const result = createQuizQuestionRequest(quiz.quizId, user.token, question, duration, points, validAnswers);
    expect(result.body.questionId).toStrictEqual(expect.any(Number));
    expect(result.statusCode).toStrictEqual(200);
  });

  test('sum of duration equals 3 minutes', () => {
    createQuizQuestionRequest(quiz.quizId, user.token, 'Question 1', 60, 5, validAnswers);
    createQuizQuestionRequest(quiz.quizId, user.token, 'Question 2', 60, 5, validAnswers);
    const result = createQuizQuestionRequest(quiz.quizId, user.token, 'Question 3', 60, 5, validAnswers);
    expect(result.body.questionId).toStrictEqual(expect.any(Number));
    expect(result.statusCode).toStrictEqual(200);
  });
});
