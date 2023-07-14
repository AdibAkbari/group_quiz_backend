import {
  quizCreateRequest,
  authRegisterRequest,
  clearRequest,
  createQuizQuestionRequest,
  deleteQuizQuestionRequest,
  adminQuizInfoRequest
} from './testRoutes';

import {
  TokenId,
  QuizId,
  QuestionCreate
} from '../interfaces';

const validAnswers = [{ answer: 'great', correct: true }, { answer: 'bad', correct: false }];

const ERROR = { error: expect.any(String) };

let user: TokenId;
let quiz: QuizId;
let question: QuestionCreate;
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'Firstname', 'Lastname').body;
  quiz = quizCreateRequest(user.token, 'Cats', 'A quiz about cats').body;
  question = createQuizQuestionRequest(quiz.quizId, user.token, 'Question 1', 5, 5, validAnswers).body;
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
    const result = deleteQuizQuestionRequest(token, quiz.quizId, question.questionId);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(401);
  });

  test('Unused tokenId', () => {
    const result = deleteQuizQuestionRequest(user.token + 1, quiz.quizId, question.questionId);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(403);
  });
});

describe('Invalid QuizId', () => {
  // Testing quizID does not exist
  test('Quiz ID does not refer to a valid quiz', () => {
    const deleteQuestion = deleteQuizQuestionRequest(user.token, quiz.quizId + 1, question.questionId);
    expect(deleteQuestion.body).toStrictEqual(ERROR);
    expect(deleteQuestion.statusCode).toStrictEqual(400);
  });

  // Testing the user does not own the quiz that is trying to be removed
  test('Quiz ID does not refer to a quiz that this user owns', () => {
    const user2 = authRegisterRequest('user2@gmail.com', 'StrongPassword123', 'TestFirst', 'TestLast').body;
    const quiz2 = quizCreateRequest(user2.token, 'quiz2', '').body;

    const deleteQuestion = deleteQuizQuestionRequest(user.token, quiz2.quizId, question.questionId);
    expect(deleteQuestion.body).toStrictEqual(ERROR);
    expect(deleteQuestion.statusCode).toStrictEqual(400);
  });
});

describe('Invalid Questionid', () => {
  // Testing QuestionId does not exist
  test('Question ID does not exist', () => {
    const deleteQuestion = deleteQuizQuestionRequest(user.token, quiz.quizId, question.questionId + 1);
    expect(deleteQuestion.body).toStrictEqual(ERROR);
    expect(deleteQuestion.statusCode).toStrictEqual(400);
  });

  // The Quiz exist but the quiz has no questions
  test('No questions in this quiz with this questionId', () => {
    const quiz2Id = quizCreateRequest(user.token, 'Quiz2', '').body.quizId;
    const result = deleteQuizQuestionRequest(user.token, quiz2Id, question.questionId);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(400);
  });

  // Testing the question id exist but the user does not have any questions
  test('QuestionId Exist but not in the users Quiz', () => {
    const user2 = authRegisterRequest('user2@gmail.com', 'StrongPassword123', 'TestFirst', 'TestLast').body;
    const quiz2 = quizCreateRequest(user2.token, 'quiz2', '').body;

    const deleteQuestion = deleteQuizQuestionRequest(user2.token, quiz2.quizId, question.questionId);
    expect(deleteQuestion.body).toStrictEqual(ERROR);
    expect(deleteQuestion.statusCode).toStrictEqual(400);
  });
});

describe('Successfully removed quiz question', () => {
  // Sucessfully remove the quiz
  test('Sucessful quiz remove question empty return', () => {
    const deleteQuestion = deleteQuizQuestionRequest(user.token, quiz.quizId, question.questionId);
    expect(deleteQuestion.body).toStrictEqual({});
    expect(deleteQuestion.statusCode).toStrictEqual(200);
  });

  // Check that the quiz question is actually removed
  test('Sucessful quiz remove question integrated check', () => {
    const questionToRemove = createQuizQuestionRequest(quiz.quizId, user.token, 'Question Remove', 5, 5, validAnswers).body;
    const question2 = createQuizQuestionRequest(quiz.quizId, user.token, 'Question 2', 5, 5, validAnswers).body;

    deleteQuizQuestionRequest(user.token, quiz.quizId, questionToRemove.questionId);

    const received = adminQuizInfoRequest(user.token, quiz.quizId).body;
    const expected = {
      quizId: quiz.quizId,
      name: 'Cats',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'A quiz about cats',
      numQuestions: 2,
      questions: [
        {
          questionId: question.questionId,
          question: 'Question 1',
          duration: 5,
          points: 5,
          answers: [
            { answerId: expect.any(Number), answer: 'great', colour: expect.any(String), correct: true },
            { answerId: expect.any(Number), answer: 'bad', colour: expect.any(String), correct: false },
          ]
        },
        {
          questionId: question2.questionId,
          question: 'Question 2',
          duration: 5,
          points: 5,
          answers: [
            { answerId: expect.any(Number), answer: 'great', colour: expect.any(String), correct: true },
            { answerId: expect.any(Number), answer: 'bad', colour: expect.any(String), correct: false },
          ]
        }
      ],
      duration: 10
    };

    expect(received).toStrictEqual(expected);
  });

  // check that once a question is removed, the next question still has a unique quiz id
  test('Unique question Id once a question is removed', () => {
    const questionToRemove = createQuizQuestionRequest(quiz.quizId, user.token, 'questionToRemove', 5, 5, validAnswers).body;
    const question2 = createQuizQuestionRequest(quiz.quizId, user.token, 'Question 2', 5, 5, validAnswers).body;
    deleteQuizQuestionRequest(user.token, quiz.quizId, questionToRemove.questionId);
    const question3 = createQuizQuestionRequest(quiz.quizId, user.token, 'Question 3', 5, 5, validAnswers).body;

    expect(question3.questionId).not.toStrictEqual(question.questionId);
    expect(question3.questionId).not.toStrictEqual(question2.questionId);
  });
});
