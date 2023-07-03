import { clear } from '../other';
import { adminAuthRegister, adminUserDetails } from '../auth';
import { adminQuizCreate, adminQuizList } from '../quiz';

const ERROR = { error: expect.any(String) };

describe('clear test', () => {
  // Check that clear returns the correct object
  test('returns empty data', () => {
    expect(clear()).toStrictEqual({});
  });

  // Check that clear returns the correct object
  test('integrated clear test', () => {
    const user = adminAuthRegister('email@gmail.com', 'password1', 'nameFirst', 'nameLast');
    adminQuizCreate(user.authUserId, 'quiz1', '');

    clear();

    expect(adminUserDetails(user.authUserId)).toStrictEqual(ERROR);
    expect(adminQuizList(user.authUserId)).toStrictEqual(ERROR);
  });
});
