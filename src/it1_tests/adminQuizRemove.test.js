import { adminQuizRemove, adminQuizCreate, adminQuizList, adminQuizInfo } from '../quiz';
import { adminAuthRegister } from '../auth';
import { clear } from '../other';

const ERROR = { error: expect.any(String) };

describe('adminQuizRemove', () => {
  let user;
  let quiz;
  // Before each test, clear data and then create a new user and new quiz
  beforeEach(() => {
    clear();
    user = adminAuthRegister('user1@gmail.com', 'StrongPassword123', 'TestFirst', 'TestLast');
    quiz = adminQuizCreate(user.authUserId, 'quiz1', '');
  });

  // Testing AuthUserId does not exist
  test('AuthUserId is not a valid user', () => {
    expect(adminQuizRemove(user.authUserId + 1, quiz.quizId)).toStrictEqual(ERROR);
  });

  // Testing quizID does not exist
  test('Quiz ID does not refer to a valid quiz', () => {
    expect(adminQuizRemove(user.authUserId, quiz.quizId + 1)).toStrictEqual(ERROR);
  });

  // Testing the user does not own the quiz that is trying to be removed
  test('Quiz ID does not refer to a quiz that this user owns', () => {
    const user2 = adminAuthRegister('user2@gmail.com', 'StrongPassword123', 'TestFirst', 'TestLast');
    const quiz2 = adminQuizCreate(user2.authUserId, 'quiz2', '');

    expect(adminQuizRemove(user.authUserId, quiz2.quizId)).toStrictEqual(ERROR);
  });

  // Sucessfully remove the quiz
  test('Sucessful quiz remove return', () => {
    expect(adminQuizRemove(user.authUserId, quiz.quizId)).toStrictEqual({});
  });

  // Check that the quiz is actually removed
  test('Sucessful quiz remove integrated check', () => {
    const quiz2 = adminQuizCreate(user.authUserId, 'quiz2', '');
    const quizToRemove = adminQuizCreate(user.authUserId, 'quizToRemove', '');
    const quiz3 = adminQuizCreate(user.authUserId, 'quiz3', '');

    adminQuizRemove(user.authUserId, quizToRemove.quizId);

    const received = adminQuizList(user.authUserId);
    const expected = {
      quizzes: [
        {
          quizId: quiz.quizId,
          name: 'quiz1',
        },
        {
          quizId: quiz2.quizId,
          name: 'quiz2',
        },
        {
          quizId: quiz3.quizId,
          name: 'quiz3',
        },
      ]
    };

    const receivedSet = new Set(received.quizzes);
    const expectedSet = new Set(expected.quizzes);
    expect(receivedSet).toStrictEqual(expectedSet);
  });

  // check that once a quiz is removed, the quiz id no longer exists
  test('No quiz Id once a quiz is removed', () => {
    adminQuizRemove(user.authUserId, quiz.quizId);
    expect(adminQuizInfo(user.authUserId, quiz.quizId)).toStrictEqual(ERROR);
    adminQuizCreate(user.authUserId, 'quiz2', '');
    expect(adminQuizInfo(user.authUserId, quiz.quizId)).toStrictEqual(ERROR);
  });

  // check that once a quiz is removed, the next quiz still has a unique quiz id
  test('Unique quiz Id once a quiz is removed', () => {
    const quizToRemove = adminQuizCreate(user.authUserId, 'quizToRemove', '');
    const quiz2 = adminQuizCreate(user.authUserId, 'quiz2', '');
    adminQuizRemove(user.authUserId, quizToRemove.quizId);
    const quiz3 = adminQuizCreate(user.authUserId, 'quiz3', '');
    expect(quiz3.quizId).not.toStrictEqual(quiz.quizId);
    expect(quiz3.quizId).not.toStrictEqual(quiz2.quizId);
  });
});
