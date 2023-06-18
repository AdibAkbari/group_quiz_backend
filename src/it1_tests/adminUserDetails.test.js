import { 
    adminUserDetails,
    adminAuthRegister 
} from '../auth.js';

const ERROR = { error: expect.any(String) };

beforeEach(() => {
    clear();
  });

describe('AuthUserId not a valid user', () => {
    test('No users registered', () => {
        expect(adminUserDetails(7)).toStrictEqual(ERROR);
    });

    test('Unused ID', () => {
        const user = adminAuthRegister('email@gmail.com', 'password1', 'NameFirst', 'NameLast');
        expect(adminUserDetails(user.authUserId + 1)).toStrictEqual(ERROR);
    });

    test('authUserId not a number', () => {
        expect(adminUserDetails('hi')).toStrictEqual(ERROR);
    });
})

describe('Only one user registered', () => {
    let user;
    beforeEach(() => {
        user = adminAuthRegister('email@gmail.com', 'password1', 'Firstname', 'Lastname');
      });

    test('Correct data types', () => {
        expect(adminUserDetails(user.authUserId)).toStrictEqual({
            user: {
                userId: expect.any(Number),
                name: expect.any(String),
                email: expect.any(String),
                numSuccessfulLogins: expect.any(Number),
                numFailedPasswordsSinceLastLogin: expect.any(Number)
            }
        })
    });

    test('Just registered', () => {
        expect(adminUserDetails(user.authUserId)).toStrictEqual({
            user: {
                userId: user.authUserId,
                name: 'Firstname Lastname',
                email: 'email@gmail.com',
                numSuccessfulLogins: 1,
                numFailedPasswordsSinceLastLogin: 0
            }
        })
    });

    test('Registered and logged in', () => {
        adminAuthLogin('email@gmail.com', 'password1');
        expect(adminUserDetails(user.authUserId)).toStrictEqual({
            user: {
                userId: user.authUserId,
                name: 'Firstname Lastname',
                email: 'email@gmail.com',
                numSuccessfulLogins: 2,
                numFailedPasswordsSinceLastLogin: 0
            }
        })
    });

    test('Failed password attempt', () => {
        adminAuthLogin('email@gmail.com', 'password2');
        expect(adminUserDetails(user.authUserId)).toStrictEqual({
            user: {
                userId: user.authUserId,
                name: 'Firstname Lastname',
                email: 'email@gmail.com',
                numSuccessfulLogins: 1,
                numFailedPasswordsSinceLastLogin: 1
            }
        })
    });
})

describe('multiple users registered', () => {
    let user1;
    let user2;
    let user3;
    beforeEach(() => {
        user1 = adminAuthRegister('email1@gmail.com', 'password1', 'FirstnameA', 'LastnameA');
        user2 = adminAuthRegister('email2@gmail.com', 'password2', 'FirstnameB', 'LastnameB');
        user3 = adminAuthRegister('email3@gmail.com', 'password3', 'FirstnameC', 'LastnameC');
      });

    test.each([
        {input: user1.authUserId, name: 'FirstnameA LastnameA', email: 'email1@gmail.com'},
        {input: user2.authUserId, name: 'FirstnameB LastnameB', email: 'email2@gmail.com'},
        {input: user3.authUserId, name: 'FirstnameC LastnameC', email: 'email3@gmail.com'},
    ]) ('Testing each user', (input, name, email) => {
        expect(adminUserDetails(input)).toStrictEqual({
            user: {
                userId: input,
                name: name,
                email: email,
                numSuccessfulLogins: expect.any(Number),
                numFailedPasswordsSinceLastLogin: expect.any(Number)
            }
        })
    });
})