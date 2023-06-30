import { adminQuizList, adminQuizCreate } from '../quiz';
import { adminAuthRegister } from '../auth';
import { clear } from '../other';

const ERROR = { error: expect.any(String) };

beforeEach(() => {
  clear();
});

describe('AuthUserId not a valid user', () => {
  test('No users registered', () => {
    expect(adminQuizList(7)).toStrictEqual(ERROR);
  });

  test('Unused ID', () => {
    const user = adminAuthRegister('email@gmail.com', 'password1', 'NameFirst', 'NameLast');
    expect(adminQuizList(user.authUserId + 1)).toStrictEqual(ERROR);
  });

  test('authUserId not a number', () => {
    expect(adminQuizList('hi')).toStrictEqual(ERROR);
  });
});

describe('User owns no quizzes', () => {
  let user;
  beforeEach(() => {
    user = adminAuthRegister('email@gmail.com', 'password1', 'Firstname', 'Lastname');
  });

  test('No quizzes', () => {
    expect(adminQuizList(user.authUserId)).toStrictEqual({
      quizzes: []
    });
  });

  test('One quiz created on system', () => {
    const user2 = adminAuthRegister('email1@gmail.com', 'password2', 'FirstnameB', 'LastnameB');
    adminQuizCreate(user2.authUserId, 'Cats', '');
    expect(adminQuizList(user.authUserId)).toStrictEqual({
      quizzes: []
    });
  });

  test('multiple quizzes created on system', () => {
    const user2 = adminAuthRegister('email1@gmail.com', 'password2', 'FirstnameB', 'LastnameB');
    adminQuizCreate(user2.authUserId, 'Cats', '');
    adminQuizCreate(user2.authUserId, 'Dogs', '');
    adminQuizCreate(user2.authUserId, 'Birds', '');
    expect(adminQuizList(user.authUserId)).toStrictEqual({
      quizzes: []
    });
  });
});

describe('User does own quizzes', () => {
  let user;
  let quiz;
  beforeEach(() => {
    user = adminAuthRegister('email@gmail.com', 'password1', 'Firstname', 'Lastname');
    quiz = adminQuizCreate(user.authUserId, 'Cats', 'A quiz about cats');
  });

  test('user owns one quiz', () => {
    expect(adminQuizList(user.authUserId)).toStrictEqual({
      quizzes: [
        {
          quizId: quiz.quizId,
          name: 'Cats'
        }
      ]
    });
  });

  test('user owns two quizzes', () => {
    const quiz2 = adminQuizCreate(user.authUserId, 'Dogs', 'A quiz about dogs');
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
    const received = adminQuizList(user.authUserId);
    const receivedSet = new Set(received.quizzes);
    const expectedSet = new Set(expected.quizzes);
    expect(receivedSet).toStrictEqual(expectedSet);
  });

  test('user owns multiple quizzes', () => {
    const user2 = adminAuthRegister('email1@gmail.com', 'password2', 'FirstnameB', 'LastnameB');
    const quiz2 = adminQuizCreate(user.authUserId, 'Dogs', 'A quiz about dogs');
    const quiz3 = adminQuizCreate(user2.authUserId, 'Birds', 'A quiz about birds');
    const quiz4 = adminQuizCreate(user.authUserId, 'Ducks', 'A quiz about ducks');
    const quiz5 = adminQuizCreate(user.authUserId, 'Lizards', 'A quiz about lizards');
    const quiz6 = adminQuizCreate(user2.authUserId, 'Goats', 'A quiz about goats');

    const received = adminQuizList(user.authUserId);
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
