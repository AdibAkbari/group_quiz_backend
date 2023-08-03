import {
  quizCreateRequest,
  authRegisterRequest,
  clearRequest,
  createQuizQuestionRequest,
  deleteQuizQuestionRequest,
  startSessionRequest,
  updateSessionStateRequest,
  adminQuizInfoRequest,
  deleteQuizQuestionRequestV1
} from './it3_testRoutes';
import HTTPError from 'http-errors';
import {
  TokenId,
  QuizId,
  QuestionId
} from '../interfaces';

const validAnswers = [{ answer: 'great', correct: true }, { answer: 'bad', correct: false }];

const ERROR = { error: expect.any(String) };

let user: TokenId;
let quiz: QuizId;
let question: QuestionId;
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'Firstname', 'Lastname').body;
  quiz = quizCreateRequest(user.token, 'Cats', 'A quiz about cats');
  question = createQuizQuestionRequest(quiz.quizId, user.token, 'Question 1', 5, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
});

describe('Token invalid', () => {
  test('invalid token structure', () => {
    expect(() => deleteQuizQuestionRequest('', quiz.quizId, question.questionId)).toThrow(HTTPError[401]);
  });

  test('Unused tokenId', () => {
    expect(() => deleteQuizQuestionRequest(user.token + 1, quiz.quizId, question.questionId)).toThrow(HTTPError[403]);
  });
});

describe('Invalid QuizId', () => {
  // Testing quizID does not exist
  test('Quiz ID does not refer to a valid quiz', () => {
    expect(() => deleteQuizQuestionRequest(user.token, quiz.quizId + 1, question.questionId)).toThrow(HTTPError[400]);
  });

  // Testing the user does not own the quiz that is trying to be removed
  test('Quiz ID does not refer to a quiz that this user owns', () => {
    const user2 = authRegisterRequest('user2@gmail.com', 'StrongPassword123', 'TestFirst', 'TestLast').body;
    const quiz2 = quizCreateRequest(user2.token, 'quiz2', '');

    expect(() => deleteQuizQuestionRequest(user.token, quiz2.quizId, question.questionId)).toThrow(HTTPError[400]);
  });
});

describe('Invalid Questionid', () => {
  // Testing QuestionId does not exist
  test('Question ID does not exist', () => {
    expect(() => deleteQuizQuestionRequest(user.token, quiz.quizId, question.questionId + 1)).toThrow(HTTPError[400]);
  });

  // The Quiz exist but the quiz has no questions
  test('No questions in this quiz with this questionId', () => {
    const quiz2Id = quizCreateRequest(user.token, 'Quiz2', '').quizId;
    expect(() => deleteQuizQuestionRequest(user.token, quiz2Id, question.questionId)).toThrow(HTTPError[400]);
  });

  // Testing the question id exist but the user does not have any questions
  test('QuestionId Exist but not in the users Quiz', () => {
    const user2 = authRegisterRequest('user2@gmail.com', 'StrongPassword123', 'TestFirst', 'TestLast').body;
    const quiz2 = quizCreateRequest(user2.token, 'quiz2', '');

    expect(() => deleteQuizQuestionRequest(user2.token, quiz2.quizId, question.questionId)).toThrow(HTTPError[400]);
  });
});

describe('Quiz is not in END state', () => {
  test('quiz not in end state', () => {
    createQuizQuestionRequest(quiz.quizId, user.token, 'Question 1', 5, 6, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }], 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
    const sessionId = startSessionRequest(quiz.quizId, user.token, 3).sessionId;
    updateSessionStateRequest(quiz.quizId, sessionId, user.token, 'NEXT_QUESTION');
    expect(() => deleteQuizQuestionRequest(user.token, quiz.quizId, question.questionId)).toThrow(HTTPError[400]);
  });
});

describe('Successfully removed quiz question', () => {
  // Check that the quiz question is actually removed
  test('Sucessful quiz remove question integrated check', () => {
    const questionToRemove = createQuizQuestionRequest(quiz.quizId, user.token, 'Question Remove', 5, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
    const question2 = createQuizQuestionRequest(quiz.quizId, user.token, 'Question 2', 5, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');

    expect(deleteQuizQuestionRequest(user.token, quiz.quizId, questionToRemove.questionId)).toStrictEqual({});

    const received = adminQuizInfoRequest(user.token, quiz.quizId);
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
          ],
          thumbnailUrl: expect.any(String),
        },
        {
          questionId: question2.questionId,
          question: 'Question 2',
          duration: 5,
          points: 5,
          answers: [
            { answerId: expect.any(Number), answer: 'great', colour: expect.any(String), correct: true },
            { answerId: expect.any(Number), answer: 'bad', colour: expect.any(String), correct: false },
          ],
          thumbnailUrl: expect.any(String),
        },
      ],
      duration: 10
    };

    expect(received).toStrictEqual(expected);
  });

  // check that once a question is removed, the next question still has a unique quiz id
  test('Unique question Id once a question is removed', () => {
    const questionToRemove = createQuizQuestionRequest(quiz.quizId, user.token, 'questionToRemove', 5, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
    const question2 = createQuizQuestionRequest(quiz.quizId, user.token, 'Question 2', 5, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
    deleteQuizQuestionRequest(user.token, quiz.quizId, questionToRemove.questionId);
    const question3 = createQuizQuestionRequest(quiz.quizId, user.token, 'Question 3', 5, 5, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');

    expect(question3.questionId).not.toStrictEqual(question.questionId);
    expect(question3.questionId).not.toStrictEqual(question2.questionId);
  });
});

describe('V1 WRAPPERS', () => {
  test('Quiz ID does not refer to a valid quiz', () => {
    const deleteQuestion = deleteQuizQuestionRequestV1(user.token, quiz.quizId + 1, question.questionId);
    expect(deleteQuestion.body).toStrictEqual(ERROR);
    expect(deleteQuestion.statusCode).toStrictEqual(400);
  });

  test('invalid token structure', () => {
    const result = deleteQuizQuestionRequestV1('token', quiz.quizId, question.questionId);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(401);
  });

  test('Unused tokenId', () => {
    const result = deleteQuizQuestionRequestV1(user.token + 1, quiz.quizId, question.questionId);
    expect(result.body).toStrictEqual(ERROR);
    expect(result.statusCode).toStrictEqual(403);
  });

  test('Sucessful quiz remove question empty return', () => {
    const deleteQuestion = deleteQuizQuestionRequestV1(user.token, quiz.quizId, question.questionId);
    expect(deleteQuestion.body).toStrictEqual({});
    expect(deleteQuestion.statusCode).toStrictEqual(200);
  });
});
