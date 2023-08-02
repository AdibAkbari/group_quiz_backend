import {
  clearRequest,
  authRegisterRequest,
  quizNameUpdateRequest,
  adminQuizInfoRequest,
  quizCreateRequest,
  quizNameUpdateRequestV1,
} from './it3_testRoutes';
import { TokenId, QuizId } from '../interfaces';
import HTTPError from 'http-errors';

const ERROR = { error: expect.any(String) };

// Before each test, clear data and then create a new user and new quiz
let user: TokenId;
let quiz: QuizId;
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
  quiz = quizCreateRequest(user.token, 'quiz1', '');
});

describe('Token invalid', () => {
  test('invalid token structure', () => {
    expect(() => quizNameUpdateRequest('543j', quiz.quizId, 'TestQuizUpdate')).toThrow(HTTPError[401]);
  })

  test('Nobody logged in', () => {
    expect(() => quizNameUpdateRequest('7', quiz.quizId, 'TestQuizUpdate')).toThrow(HTTPError[403]);
  });

  test('TokenId not logged in', () => {
    expect(() => quizNameUpdateRequest(user.token + 1, quiz.quizId, 'TestQuizUpdate')).toThrow(HTTPError[403]);
  });
});

describe('Invalid adminQuizNameUpdate', () => {
  test('Quiz ID does not refer to a valid quiz', () => {
    expect(() => quizNameUpdateRequest(user.token, quiz.quizId + 1, 'TestQuizUpdate')).toThrow(HTTPError[400]);
  });

  test('Quiz ID does not refer to a quiz that this user owns', () => {
    const user2 = authRegisterRequest('user2@gmail.com', 'StrongPassword123', 'TestFirst', 'TestLast').body;
    const quiz2 = quizCreateRequest(user2.token, 'quiz2', '');

    expect(() => quizNameUpdateRequest(user.token, quiz2.quizId, 'NewQuizName')).toThrow(HTTPError[400]);
  });

  // Output error if new name contains not alphanumeric characters
  test('name contains non-alphanumeric characters', () => {
    expect(() => quizNameUpdateRequest(user.token, quiz.quizId, 'test;!')).toThrow(HTTPError[400]);
  })

  test.each([
    {
      name: 'q1',
      test: '< 3'
    },
    {
      name: 'namemorethanthirtycharacterslong',
      test: '> 30'
    },
  ])('"$test": "$name"', ({ name, test }) => {
    expect(() => quizNameUpdateRequest(user.token, quiz.quizId, name)).toThrow(HTTPError[400]);
  });

  // Output error if the name is already used by the current logged in user for another quiz
  test('Name is already used by the current logged in user for another quiz', () => {
    const quiz2 = quizCreateRequest(user.token, 'quiz2', '');
    expect(() => quizNameUpdateRequest(user.token, quiz2.quizId, 'quiz1')).toThrow(HTTPError[400]);
  });

  // Output error if the name is just white space
  test('Name is just whitespace', () => {
    expect(() => quizNameUpdateRequest(user.token, quiz.quizId, '          ')).toThrow(HTTPError[400]);
  });
});

describe('Valid adminQuizNameUpdate', () => {

  test('successful quiz name update', () => {
    expect(quizNameUpdateRequest(user.token, quiz.quizId, 'New Quiz')).toStrictEqual({});

    expect(adminQuizInfoRequest(user.token, quiz.quizId)).toStrictEqual({
      quizId: quiz.quizId,
      name: 'New Quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: '',
      numQuestions: 0,
      questions: [],
      duration: 0,
    });
  })

  test('Correct time last edited', () => {
    const expectedTimeTransfered = Math.floor(Date.now() / 1000);
    expect(quizNameUpdateRequest(user.token, quiz.quizId, 'New Quiz Name')).toStrictEqual({});

    const quizInfo = adminQuizInfoRequest(user.token, quiz.quizId);

    const timeSent = quizInfo.timeLastEdited;

    expect(timeSent).toBeGreaterThanOrEqual(expectedTimeTransfered);
    expect(timeSent).toBeLessThanOrEqual(expectedTimeTransfered + 3);
  });
});

describe('V1 WRAPPERS', () => {
  test('Name is just whitespace', () => {
    const newQuiz = quizNameUpdateRequestV1(user.token, quiz.quizId, '          ');
    expect(newQuiz.body).toStrictEqual(ERROR);
    expect(newQuiz.statusCode).toStrictEqual(400);
  });

  test('invalid token', () => {
    const newQuiz = quizNameUpdateRequestV1('fsfsf', quiz.quizId, 'TestQuizUpdate');
    expect(newQuiz.body).toStrictEqual(ERROR);
    expect(newQuiz.statusCode).toStrictEqual(401);
  })

  test('Nobody logged in', () => {
    const newQuiz = quizNameUpdateRequestV1('7', quiz.quizId, 'TestQuizUpdate');
    expect(newQuiz.body).toStrictEqual(ERROR);
    expect(newQuiz.statusCode).toStrictEqual(403);
  });
  
  test('successful name update', () => {
    const newQuiz = quizNameUpdateRequestV1(user.token, quiz.quizId, 'qz1');
    expect(newQuiz.body).toStrictEqual({});
    expect(newQuiz.statusCode).toStrictEqual(200);
  })
});
