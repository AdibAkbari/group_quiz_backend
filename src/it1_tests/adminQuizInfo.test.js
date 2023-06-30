import {
  adminQuizInfo,
  adminQuizCreate,
  adminQuizRemove,
  adminQuizNameUpdate,
  adminQuizDescriptionUpdate
} from '../quiz.js';
import { adminAuthRegister } from '../auth.js';
import { clear } from '../other.js';

const ERROR = { error: expect.any(String) };

let user;
let quiz;
beforeEach(() => {
  clear();
  user = adminAuthRegister('email@gmail.com', 'password1', 'Firstname', 'Lastname');
  quiz = adminQuizCreate(user.authUserId, 'Cats', 'A quiz about cats');
});

describe('AuthUserId not a valid user', () => {
  test('Unused ID', () => {
    expect(adminQuizInfo(user.authUserId + 1, quiz.quizId)).toStrictEqual(ERROR);
  });

  test('authUserId not a number', () => {
    expect(adminQuizInfo('hi', quiz.quizId)).toStrictEqual(ERROR);
  });
});

describe('Quiz Id invalid', () => {
  test('Quiz Id does not refer to a valid quiz', () => {
    expect(adminQuizInfo(user.authUserId, quiz.quizId + 1)).toStrictEqual(ERROR);
  });

  test('Quiz Id does not refer to a quiz that this user owns', () => {
    const user2 = adminAuthRegister('email2@gmail.com', 'password1', 'FirstnameB', 'LastnameB');
    expect(adminQuizInfo(user2.authUserId, quiz.quizId)).toStrictEqual(ERROR);
    const quiz2 = adminQuizCreate(user2.authUserId, 'Dogs', 'A quiz about dogs');
    expect(adminQuizInfo(user.authUserId, quiz2.quizId)).toStrictEqual(ERROR);
  });

  test('quizId not a number', () => {
    expect(adminQuizInfo(user.authUserId, 'hi')).toStrictEqual(ERROR);
  });
});

describe('Valid inputs', () => {
  test('only one quiz created', () => {
    expect(adminQuizInfo(user.authUserId, quiz.quizId)).toStrictEqual({
      quizId: quiz.quizId,
      name: 'Cats',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'A quiz about cats',
    });
  });

  test('more than one quiz stored', () => {
    const user2 = adminAuthRegister('email2@gmail.com', 'password1', 'FirstnameB', 'LastnameB');
    const quiz2 = adminQuizCreate(user2.authUserId, 'Dogs', 'A quiz about dogs');
    expect(adminQuizInfo(user2.authUserId, quiz2.quizId)).toStrictEqual({
      quizId: quiz2.quizId,
      name: 'Dogs',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'A quiz about dogs',
    });
  });

  test('more than one quiz created by user', () => {
    const user2 = adminAuthRegister('email2@gmail.com', 'password1', 'FirstnameB', 'LastnameB');
    adminQuizCreate(user2.authUserId, 'Dogs', 'A quiz about dogs');
    const quiz3 = adminQuizCreate(user.authUserId, 'Birds', 'A quiz about birds');
    expect(adminQuizInfo(user.authUserId, quiz3.quizId)).toStrictEqual({
      quizId: quiz3.quizId,
      name: 'Birds',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'A quiz about birds',
    });
  });
});

describe('testing with other functions', () => {
  test('removing quiz', () => {
    expect(adminQuizInfo(user.authUserId, quiz.quizId)).toStrictEqual({
      quizId: quiz.quizId,
      name: 'Cats',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'A quiz about cats',
    });

    adminQuizRemove(user.authUserId, quiz.quizId);
    expect(adminQuizInfo(user.authUserId, quiz.quizId)).toStrictEqual(ERROR);
  });

  test('name update', () => {
    expect(adminQuizInfo(user.authUserId, quiz.quizId)).toStrictEqual({
      quizId: quiz.quizId,
      name: 'Cats',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'A quiz about cats',
    });

    adminQuizNameUpdate(user.authUserId, quiz.quizId, 'NewName');
    expect(adminQuizInfo(user.authUserId, quiz.quizId)).toStrictEqual({
      quizId: quiz.quizId,
      name: 'NewName',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'A quiz about cats',
    });
  });

  test('description update', () => {
    expect(adminQuizInfo(user.authUserId, quiz.quizId)).toStrictEqual({
      quizId: quiz.quizId,
      name: 'Cats',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'A quiz about cats',
    });

    adminQuizDescriptionUpdate(user.authUserId, quiz.quizId, 'New description');
    expect(adminQuizInfo(user.authUserId, quiz.quizId)).toStrictEqual({
      quizId: quiz.quizId,
      name: 'Cats',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'New description',
    });
  });
});
