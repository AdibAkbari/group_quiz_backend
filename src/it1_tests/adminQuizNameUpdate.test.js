import { adminQuizCreate, adminQuizNameUpdate, adminQuizInfo } from '../quiz.js';
import { adminAuthRegister } from '../auth.js';
import { clear } from '../other.js';

const ERROR = { error: expect.any(String) };

let user;
let quiz;
// Before each test, clear data and then create a new user and new quiz
beforeEach(() => {
  clear();
  user = adminAuthRegister('user1@gmail.com', 'StrongPassword123', 'TestFirst', 'TestLast');
  quiz = adminQuizCreate(user.authUserId, 'quiz1', '');
});

describe('Invalid adminQuizNameUpdate', () => {
  // Testing AuthUserId does not exist
  test('AuthUserId is not a valid user', () => {
    expect(adminQuizNameUpdate(user.authUserId + 1, quiz.quizId, 'NewQuizName')).toStrictEqual(ERROR);
  });

  // Testing quizID does not exist
  test('Quiz ID does not refer to a valid quiz', () => {
    expect(adminQuizNameUpdate(user.authUserId, quiz.quizId + 1, 'NewQuizName')).toStrictEqual(ERROR);
  });

  // Testing the user does not own the quiz that is trying to be removed
  test('Quiz ID does not refer to a quiz that this user owns', () => {
    const user2 = adminAuthRegister('user2@gmail.com', 'StrongPassword123', 'TestFirst', 'TestLast');
    const quiz2 = adminQuizCreate(user2.authUserId, 'quiz2', '');

    expect(adminQuizNameUpdate(user.authUserId, quiz2.quizId, 'NewQuizName')).toStrictEqual(ERROR);
  });

  // Output error if new name contains not alphanumeric characters
  test.each([
    { name: '!@#$%^&*' },
    { name: 'user\'s test' },
    { name: 'test1;' },
  ])('Name contains any characters that are not alphanumeric or are spaces: "$name"', ({ name }) => {
    expect(adminQuizNameUpdate(user.authUserId, quiz.quizId, name)).toStrictEqual(ERROR);
  });

  // Output error if new name is either less than 3 characters long or more than 30 characters long
  test.each([
    { name: 'q1' },
    { name: 'namemorethanthirtycharacterslong' },
  ])('Length of name is too short/long: "$name"', ({ name }) => {
    expect(adminQuizNameUpdate(user.authUserId, quiz.quizId, name)).toStrictEqual(ERROR);
  });

  // Output error if the name is already used by the current logged in user for another quiz
  test('Name is already used by the current logged in user for another quiz', () => {
    const quiz2 = adminQuizCreate(user.authUserId, 'quiz2', '');
    expect(adminQuizNameUpdate(user.authUserId, quiz2.quizId, 'quiz1')).toStrictEqual(ERROR);
  });

  // Output error if the name is just white space
  test('Name is just whitespace', () => {
    expect(adminQuizNameUpdate(user.authUserId, quiz.quizId, '          ')).toStrictEqual(ERROR);
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
    expect(adminQuizNameUpdate(user.authUserId, quiz.quizId, name)).toStrictEqual({});
    expect(adminQuizInfo(user.authUserId, quiz.quizId)).toStrictEqual({
      quizId: quiz.quizId,
      name: name,
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: '',
    });
  });
});
