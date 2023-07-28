import {
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  adminQuizListRequest,
  adminQuizInfoRequest,
  quizNameUpdateRequest,
  quizTransferRequest,
  quizDescriptionUpdateRequest,
  quizCreateRequestV1,
  adminQuizListRequestV1,
  adminQuizInfoRequestV1,
  quizNameUpdateRequestV1,
  quizDescriptionUpdateRequestV1,
  quizTransferRequestV1,
} from './it3_testRoutes';
import HTTPError from 'http-errors';
import { TokenId, QuizId } from '../interfaces';

const ERROR = { error: expect.any(String) };

beforeEach(() => {
  clearRequest();
});

describe('Tokens', () => {
  let user: TokenId;
  let quiz: QuizId;
  beforeEach(() => {
    clearRequest();
    user = authRegisterRequest('email@gmail.com', 'password1', 'Firstname', 'Lastname').body;
    quiz = quizCreateRequest(user.token, 'Cats', 'A quiz about cats');
  });

  test.each([
    { testName: 'token just letters', token: 'hello' },
    { testName: 'token includes letter', token: '5436h86' },
    { testName: 'token has space', token: '4324 757' },
    { testName: 'token only whitespace', token: '  ' },
    { testName: 'token has other characters', token: '6365,53' },
    { testName: 'empty string', token: '' },
    { testName: 'token has decimal point', token: '53.74' },
    { testName: 'token has negative sign', token: '-37294' },
    { testName: 'token has positive sign', token: '+38594' },
  ])('token is not a valid structure: $testName', ({ token }) => {
    expect(() => quizCreateRequest(token, 'TestQuiz', '')).toThrow(HTTPError[401]);
    expect(() => adminQuizListRequest(token)).toThrow(HTTPError[401]);
    expect(() => adminQuizInfoRequest(token, quiz.quizId)).toThrow(HTTPError[401]);
    expect(() => quizNameUpdateRequest(token, quiz.quizId, 'TestQuizUpdate')).toThrow(HTTPError[401]);
    expect(() => quizDescriptionUpdateRequest(quiz.quizId, token, 'New Description')).toThrow(HTTPError[401]);
    expect(() => quizTransferRequest(token, quiz.quizId, 'email2@gmail.com')).toThrow(HTTPError[401]);
  });
});

// 1. QuizCreate //
describe('QuizCreate', () => {
  describe('invalid name/description edge cases', () => {
    let user: TokenId;
    beforeEach(() => {
      clearRequest();
      user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
    });

    test.each([
      {
        name: 'test1;',
        test: 'not alpha-numeric'
      },
      {
        name: '     ',
        test: 'only whitespaces'
      },
      {
        name: 'Q1',
        test: '<3 chars'
      },
      {
        name: '0123456789012345678901234567890',
        test: '>30 chars'
      },
    ])("'$name' is invalid: '$test'", ({ name, test }) => {
      expect(() => quizCreateRequest(user.token, name, '')).toThrow(HTTPError[400]);
    });

    test('name already used by user for another quiz', () => {
      quizCreateRequest(user.token, 'TestQuiz', '');
      expect(() => quizCreateRequest(user.token, 'TestQuiz', '')).toThrow(HTTPError[400]);
    });

    // description more than 100 character error
    test('invalid description (>100 characters)', () => {
    // string of length 101
      const longString = '0'.repeat(101);
      expect(() => quizCreateRequest(user.token, 'TestQuiz', longString)).toThrow(HTTPError[400]);
    });
  });

  // token not valid
  describe('Token invalid', () => {
    test('Nobody logged in', () => {
      expect(() => quizCreateRequest('7', 'TestQuiz', '')).toThrow(HTTPError[403]);
    });

    test('TokenId not logged in', () => {
      const user = authRegisterRequest('email@gmail.com', 'password1', 'NameFirst', 'NameLast').body;
      expect(() => quizCreateRequest(user.token + 1, 'TestQuiz', '')).toThrow(HTTPError[403]);
    });
  });

  describe('valid input tests', () => {
    let user: TokenId;
    beforeEach(() => {
      clearRequest();
      user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
    });

    test('valid input - testing quizId creation', () => {
      expect(quizCreateRequest(user.token, 'TestQuiz', '')).toStrictEqual({ quizId: expect.any(Number) });
    });

    test('testing correct quiz object creation', () => {
      const quiz = quizCreateRequest(user.token, 'TestQuiz', 'Test');
      expect(adminQuizInfoRequest(user.token, quiz.quizId)).toStrictEqual(
        {
          quizId: quiz.quizId,
          name: 'TestQuiz',
          timeCreated: expect.any(Number),
          timeLastEdited: expect.any(Number),
          description: 'Test',
          numQuestions: 0,
          questions: [],
          duration: 0,
        }
      );
    });
  });

  // Successful quizCreate
  describe('V1 WRAPPERS', () => {
    test.each([
      { testName: 'token just letters', token: 'hello' },
      { testName: 'token starts with letters', token: 'a54364' },
    ])('token is not a valid structure: $testName', ({ token }) => {
      const quiz = quizCreateRequestV1(token, 'TestQuiz', '');
      expect(quiz.body).toStrictEqual(ERROR);
      expect(quiz.statusCode).toStrictEqual(401);
    });

    test('Nobody logged in', () => {
      const quiz = quizCreateRequestV1('7', 'TestQuiz', '');
      expect(quiz.body).toStrictEqual(ERROR);
      expect(quiz.statusCode).toStrictEqual(403);
    });

    let user: TokenId;
    beforeEach(() => {
      clearRequest();
      user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
    });

    test('name already used by user for another quiz', () => {
      quizCreateRequestV1(user.token, 'TestQuiz', '');
      const quiz = quizCreateRequestV1(user.token, 'TestQuiz', '');
      expect(quiz.statusCode).toBe(400);
      expect(quiz.body).toStrictEqual(ERROR);
    });
  });
});

// 2. QuizList //
describe('QuizList', () => {
  let user: TokenId;
  let user2: TokenId;
  beforeEach(() => {
    clearRequest();
    user = authRegisterRequest('email@gmail.com', 'password1', 'Firstname', 'Lastname').body;
    user2 = authRegisterRequest('email1@gmail.com', 'password2', 'FirstnameB', 'LastnameB').body;
  });

  describe('Token invalid', () => {
    test('Unused tokenId', () => {
      expect(() => adminQuizListRequest(user.token + user2.token)).toThrow(HTTPError[403]);
    });
  });

  describe('User owns no quizzes', () => {
    test('No quizzes', () => {
      expect(adminQuizListRequest(user.token)).toStrictEqual({
        quizzes: []
      });
    });

    test('One quiz created on system', () => {
      quizCreateRequest(user2.token, 'Cats', '');
      expect(adminQuizListRequest(user.token)).toStrictEqual({
        quizzes: []
      });
    });

    test('multiple quizzes created on system', () => {
      quizCreateRequest(user2.token, 'Cats', '');
      quizCreateRequest(user2.token, 'Dogs', '');
      quizCreateRequest(user2.token, 'Birds', '');
      expect(adminQuizListRequest(user.token)).toStrictEqual({
        quizzes: []
      });
    });
  });

  describe('User does own quizzes', () => {
    let quiz: QuizId;
    beforeEach(() => {
      quiz = quizCreateRequest(user.token, 'Cats', 'A quiz about cats');
    });

    test('user owns one quiz', () => {
      expect(adminQuizListRequest(user.token)).toStrictEqual({
        quizzes: [
          {
            quizId: quiz.quizId,
            name: 'Cats'
          }
        ]
      });
    });

    test('user owns two quizzes', () => {
      const quiz2 = quizCreateRequest(user.token, 'Dogs', 'A quiz about dogs');
      const expected = {
        quizzes: [
          {
            quizId: quiz.quizId,
            name: 'Cats'
          },
          {
            quizId: quiz2.quizId,
            name: 'Dogs'
          }
        ]
      };
      const received = adminQuizListRequest(user.token);
      const receivedSet = new Set(received.quizzes);
      const expectedSet = new Set(expected.quizzes);
      expect(receivedSet).toStrictEqual(expectedSet);
    });

    test('user owns multiple quizzes', () => {
      const quiz2 = quizCreateRequest(user.token, 'Dogs', 'A quiz about dogs');
      quizCreateRequest(user2.token, 'Birds', 'A quiz about birds');
      const quiz4 = quizCreateRequest(user.token, 'Ducks', 'A quiz about ducks');
      const quiz5 = quizCreateRequest(user.token, 'Lizards', 'A quiz about lizards');
      quizCreateRequest(user2.token, 'Goats', 'A quiz about goats');

      const received = adminQuizListRequest(user.token);
      const expected = {
        quizzes: [
          {
            quizId: quiz.quizId,
            name: 'Cats'
          },
          {
            quizId: quiz2.quizId,
            name: 'Dogs'
          },
          {
            quizId: quiz5.quizId,
            name: 'Lizards'
          },
          {
            quizId: quiz4.quizId,
            name: 'Ducks'
          }
        ]
      };

      const receivedSet = new Set(received.quizzes);
      const expectedSet = new Set(expected.quizzes);
      expect(receivedSet).toStrictEqual(expectedSet);
    });
  });

  describe('V1 WRAPPERS', () => {
    test.each([
      { testName: 'token just letters', token: 'hello' },
      { testName: 'token starts with letters', token: 'a54364' },
    ])('token is not a valid structure: $testName', ({ token }) => {
      const list = adminQuizListRequestV1(token);
      expect(list.body).toStrictEqual(ERROR);
      expect(list.statusCode).toStrictEqual(401);
    });

    test('Unused tokenId', () => {
      const list = adminQuizListRequestV1(user.token + user2.token);
      expect(list.body).toStrictEqual(ERROR);
      expect(list.statusCode).toStrictEqual(403);
    });

    let quiz: QuizId;
    beforeEach(() => {
      quiz = quizCreateRequest(user.token, 'Cats', 'A quiz about cats');
    });

    test('user owns one quiz', () => {
      expect(adminQuizListRequestV1(user.token).body).toStrictEqual({
        quizzes: [
          {
            quizId: quiz.quizId,
            name: 'Cats'
          }
        ]
      });
    });
  });
});

// 3. QuizInfo //
describe('QuizInfo', () => {
  let user: TokenId;
  let quiz: QuizId;
  beforeEach(() => {
    clearRequest();
    user = authRegisterRequest('email@gmail.com', 'password1', 'Firstname', 'Lastname').body;
    quiz = quizCreateRequest(user.token, 'Cats', 'A quiz about cats');
  });

  describe('QuizId invalid', () => {
    test('Quiz Id does not refer to a valid quiz', () => {
      expect(() => adminQuizInfoRequest(user.token, quiz.quizId + 1)).toThrow(HTTPError[400]);
    });

    test('Quiz Id does not refer to a quiz that this user owns', () => {
      const user2 = authRegisterRequest('email2@gmail.com', 'password1', 'FirstnameB', 'LastnameB').body;
      expect(() => adminQuizInfoRequest(user2.token, quiz.quizId)).toThrow(HTTPError[400]);
      const quiz2 = quizCreateRequest(user2.token, 'Dogs', 'A quiz about dogs');
      expect(() => adminQuizInfoRequest(user.token, quiz2.quizId)).toThrow(HTTPError[400]);
    });
  });

  describe('Token invalid', () => {
    test('Unused tokenId', () => {
      expect(() => adminQuizInfoRequest(user.token + 1, quiz.quizId)).toThrow(HTTPError[403]);
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
      const user2 = authRegisterRequest('email2@gmail.com', 'password1', 'FirstnameB', 'LastnameB').body;
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
      const user2 = authRegisterRequest('email2@gmail.com', 'password1', 'FirstnameB', 'LastnameB').body;
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

  describe('V1 WRAPPERS', () => {
    test('Quiz Id does not refer to a valid quiz', () => {
      const result = adminQuizInfoRequestV1(user.token, quiz.quizId + 1);
      expect(result.body).toStrictEqual(ERROR);
      expect(result.statusCode).toStrictEqual(400);
    });

    test.each([
      { testName: 'token just letters', token: 'hello' },
      { testName: 'token starts with letters', token: 'a54364' },
    ])('token is not a valid structure: $testName', ({ token }) => {
      const list = adminQuizInfoRequestV1(token, quiz.quizId);
      expect(list.body).toStrictEqual(ERROR);
      expect(list.statusCode).toStrictEqual(401);
    });

    test('Unused tokenId', () => {
      const list = adminQuizInfoRequestV1(user.token + 1, quiz.quizId);
      expect(list.body).toStrictEqual(ERROR);
      expect(list.statusCode).toStrictEqual(403);
    });

    test('one question created', () => {
      const user2 = authRegisterRequest('email2@gmail.com', 'password1', 'FirstnameB', 'LastnameB').body;
      const quiz2 = quizCreateRequest(user2.token, 'Dogs', 'A quiz about dogs');
      expect(adminQuizInfoRequestV1(user2.token, quiz2.quizId).body).toStrictEqual({
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
  });
});

// 4. QuizNameUpdate //
describe('QuizNameUpdate', () => {
  let user: TokenId;
  let quiz: QuizId;
  beforeEach(() => {
    clearRequest();
    user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
    quiz = quizCreateRequest(user.token, 'quiz1', '');
  });

  describe('Token invalid', () => {
    test('Nobody logged in', () => {
      expect(() => quizNameUpdateRequest('7', quiz.quizId, 'TestQuizUpdate')).toThrow(HTTPError[403]);
    });

    test('TokenId not logged in', () => {
      expect(() => quizNameUpdateRequest(user.token + 1, quiz.quizId, 'TestQuizUpdate')).toThrow(HTTPError[403]);
    });
  });

  describe('Invalid adminQuizNameUpdate', () => {
  // Testing quizID does not exist
    test('Quiz ID does not refer to a valid quiz', () => {
      expect(() => quizNameUpdateRequest(user.token, quiz.quizId + 1, 'TestQuizUpdate')).toThrow(HTTPError[400]);
    });

    // Testing the user does not own the quiz that is trying to be removed
    test('Quiz ID does not refer to a quiz that this user owns', () => {
      const user2 = authRegisterRequest('user2@gmail.com', 'StrongPassword123', 'TestFirst', 'TestLast').body;
      const quiz2 = quizCreateRequest(user2.token, 'quiz2', '');

      expect(() => quizNameUpdateRequest(user.token, quiz2.quizId, 'NewQuizName')).toThrow(HTTPError[400]);
    });

    // Output error if new name contains not alphanumeric characters
    test.each([
      {
        name: '!@#$%^&*',
        test: 'No letters'
      },
      {
        name: 'user\'s test',
        test: 'Invalid apostrophe'
      },
      {
        name: 'test1;',
        test: 'Invalid semi colon'
      },
    ])('"$test": "$name"', ({ name, test }) => {
      expect(() => quizNameUpdateRequest(user.token, quiz.quizId, name)).toThrow(HTTPError[400]);
    });

    // Output error if new name is either less than 3 characters long or more than 30 characters long
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
  // Successfully update the name of the quiz
    test.each([
      { name: 'qz1' },
      { name: 'Short' },
      { name: 'LongQuizNameWithClosetoMaxName' },
      { name: '123456789' },
      { name: '1quiz' },
      { name: 'Quiz1' },
      { name: 'New Quiz' },
    ])('Successful Quiz Name Update: "$name"', ({ name }) => {
      expect(quizNameUpdateRequest(user.token, quiz.quizId, name)).toStrictEqual({});

      expect(adminQuizInfoRequest(user.token, quiz.quizId)).toStrictEqual({
        quizId: quiz.quizId,
        name: name,
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: '',
        numQuestions: 0,
        questions: [],
        duration: 0,
      });
    });

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

    test.each([
      { testName: 'token just letters', token: 'hello' },
      { testName: 'token starts with letters', token: 'a54364' },
    ])('token is not a valid structure: $testName', ({ token }) => {
      const newQuiz = quizNameUpdateRequestV1(token, quiz.quizId, 'TestQuizUpdate');
      expect(newQuiz.body).toStrictEqual(ERROR);
      expect(newQuiz.statusCode).toStrictEqual(401);
    });

    test('Nobody logged in', () => {
      const newQuiz = quizNameUpdateRequestV1('7', quiz.quizId, 'TestQuizUpdate');
      expect(newQuiz.body).toStrictEqual(ERROR);
      expect(newQuiz.statusCode).toStrictEqual(403);
    });

    test.each([
      { name: 'qz1' },
      { name: 'Short' },
    ])('Successful Quiz Name Update: "$name"', ({ name }) => {
      const newQuiz = quizNameUpdateRequestV1(user.token, quiz.quizId, name);
      expect(newQuiz.body).toStrictEqual({});
      expect(newQuiz.statusCode).toStrictEqual(200);
    });
  });
});

// 5. QuizDescriptionUpdate //
describe('QuizDescriptionUpdate', () => {
  let user: TokenId;
  let quiz: QuizId;
  beforeEach(() => {
    clearRequest();
    user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
    quiz = quizCreateRequest(user.token, 'My Quiz', 'First Description');
  });

  describe('Error Cases', () => {
    test('quizId not valid', () => {
      expect(() => quizDescriptionUpdateRequest(quiz.quizId + 1, user.token, 'New Description')).toThrow(HTTPError[400]);
    });

    test('user does not own quiz', () => {
      const user2 = authRegisterRequest('email2@gmail.com', 'password1', 'first', 'last').body;
      const quiz2 = quizCreateRequest(user2.token, 'User 2 Quiz', 'First Description');

      expect(() => quizDescriptionUpdateRequest(quiz2.quizId, user.token, 'New Description')).toThrow(HTTPError[400]);
    });

    test('description too long', () => {
      expect(() => quizDescriptionUpdateRequest(quiz.quizId, user.token, '1'.repeat(101))).toThrow(HTTPError[400]);
    });

    test('tokenId not logged in', () => {
      expect(() => quizDescriptionUpdateRequest(quiz.quizId, '12345', 'New Description')).toThrow(HTTPError[403]);
    });
  });

  describe('Success Cases', () => {
    test('valid input', () => {
      const timeNow = Math.floor(Date.now() / 1000);
      expect(quizDescriptionUpdateRequest(quiz.quizId, user.token, 'New Description')).toStrictEqual({ });

      expect(adminQuizInfoRequest(user.token, quiz.quizId)).toStrictEqual(
        {
          quizId: quiz.quizId,
          name: 'My Quiz',
          timeCreated: expect.any(Number),
          timeLastEdited: expect.any(Number),
          description: 'New Description',
          numQuestions: 0,
          questions: [],
          duration: 0
        }
      );
      const result = adminQuizInfoRequest(user.token, quiz.quizId);
      expect(result.timeLastEdited).toBeGreaterThanOrEqual(timeNow);
      expect(result.timeLastEdited).toBeLessThanOrEqual(timeNow + 1);
    });
  });

  describe('V1 WRAPPERS', () => {
    test.each([
      { testName: 'token just letters', token: 'hello' },
      { testName: 'token starts with letters', token: 'a54364' },
    ])('invalid token: $testName', ({ token }) => {
      const update = quizDescriptionUpdateRequestV1(quiz.quizId, token, 'New Description');
      expect(update.statusCode).toBe(401);
      expect(update.body).toStrictEqual(ERROR);
    });

    test('tokenId not logged in', () => {
      const update = quizDescriptionUpdateRequestV1(quiz.quizId, '12345', 'New Description');
      expect(update.statusCode).toBe(403);
      expect(update.body).toStrictEqual(ERROR);
    });

    test('description too long', () => {
      const update = quizDescriptionUpdateRequestV1(quiz.quizId, user.token, '1'.repeat(101));
      expect(update.body).toStrictEqual(ERROR);
      expect(update.statusCode).toStrictEqual(400);
    });

    test('valid input', () => {
      const update = quizDescriptionUpdateRequestV1(quiz.quizId, user.token, 'New Description');
      expect(update.body).toStrictEqual({ });
      expect(update.statusCode).toBe(200);
    });
  });
});

// 6. QuizTransfer //
describe('QuizTransfer', () => {
  let user: TokenId;
  let user2: TokenId;
  let quiz: QuizId;
  beforeEach(() => {
    clearRequest();
    user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
    quiz = quizCreateRequest(user.token, 'quiz1', '');
    user2 = authRegisterRequest('email2@gmail.com', 'password2', 'firsttwo', 'lasttwo').body;
  });

  // token not valid
  describe('Token invalid', () => {
    test('Nobody logged in', () => {
      expect(() => quizTransferRequest('7', quiz.quizId, 'email2@gmail.com')).toThrow(HTTPError[403]);
    });

    test('TokenId not logged in', () => {
      expect(() => quizTransferRequest(user.token + 1, quiz.quizId, 'email2@gmail.com')).toThrow(HTTPError[403]);
    });
  });

  // quizId wrong
  describe('invalid quizId', () => {
  // Testing quizID does not exist
    test('Quiz ID does not refer to a valid quiz', () => {
      expect(() => quizTransferRequest(user.token, quiz.quizId + 1, 'email2@gmail.com')).toThrow(HTTPError[400]);
    });

    // Testing the user does not own the quiz that is trying to be removed
    test('Quiz ID does not refer to a quiz that this user owns', () => {
      const quiz2 = quizCreateRequest(user2.token, 'quiz2', '');

      expect(() => quizTransferRequest(user.token, quiz2.quizId, 'email2@gmail.com')).toThrow(HTTPError[400]);
    });

    // Quiz ID refers to a quiz that has a name that is already used by the target user
    test('User already has a quiz named', () => {
      quizCreateRequest(user2.token, 'quiz1', '');

      expect(() => quizTransferRequest(user.token, quiz.quizId, 'email2@gmail.com')).toThrow(HTTPError[400]);
    });
  });

  // userEmail wrong
  describe('invalid userEmail', () => {
    test('userEmail is not a real user', () => {
      expect(() => quizTransferRequest(user.token, quiz.quizId, 'fakeemail@gmail.com')).toThrow(HTTPError[400]);
    });

    test('userEmail is the current logged in user', () => {
      expect(() => quizTransferRequest(user.token, quiz.quizId, 'email@gmail.com')).toThrow(HTTPError[400]);
    });
  });

  // Success cases
  describe('Successful quiz transfer', () => {
    test('Successful transfer quiz empty object response', () => {
      expect(quizTransferRequest(user.token, quiz.quizId, 'email2@gmail.com')).toStrictEqual({});
    });

    test('Successful transfer quiz integrated test', () => {
      expect(quizTransferRequest(user.token, quiz.quizId, 'email2@gmail.com')).toStrictEqual({});

      expect(adminQuizListRequest(user2.token)).toStrictEqual({
        quizzes: [
          {
            quizId: quiz.quizId,
            name: 'quiz1'
          }
        ]
      });

      expect(adminQuizListRequest(user.token)).toStrictEqual({
        quizzes: []
      });
    });

    test('Correct time last edited', () => {
      const expectedTimeTransfered = Math.floor(Date.now() / 1000);
      expect(quizTransferRequest(user.token, quiz.quizId, 'email2@gmail.com')).toStrictEqual({});

      const quizInfo = adminQuizInfoRequest(user2.token, quiz.quizId);

      const timeSent = quizInfo.timeLastEdited;

      expect(timeSent).toBeGreaterThanOrEqual(expectedTimeTransfered);
      expect(timeSent).toBeLessThanOrEqual(expectedTimeTransfered + 3);
    });
  });

  describe('V1 WRAPPERS', () => {
    test('Quiz ID does not refer to a quiz that this user owns', () => {
      const quiz2 = quizCreateRequestV1(user2.token, 'quiz2', '').body;

      const transfer = quizTransferRequestV1(user.token, quiz2.quizId, 'email2@gmail.com');
      expect(transfer.body).toStrictEqual(ERROR);
      expect(transfer.statusCode).toStrictEqual(400);
    });

    test.each([
      { testName: 'token just letters', token: 'hello' },
      { testName: 'token starts with letters', token: 'a54364' },
    ])('token is not a valid structure: $testName', ({ token }) => {
      const transfer = quizTransferRequestV1(token, quiz.quizId, 'email2@gmail.com');
      expect(transfer.body).toStrictEqual(ERROR);
      expect(transfer.statusCode).toStrictEqual(401);
    });

    test('Nobody logged in', () => {
      const transfer = quizTransferRequestV1('7', quiz.quizId, 'email2@gmail.com');
      expect(transfer.body).toStrictEqual(ERROR);
      expect(transfer.statusCode).toStrictEqual(403);
    });

    test('Successful transfer quiz empty object response', () => {
      const transfer = quizTransferRequestV1(user.token, quiz.quizId, 'email2@gmail.com');
      expect(transfer.body).toStrictEqual({});
      expect(transfer.statusCode).toStrictEqual(200);
    });
  });
});
