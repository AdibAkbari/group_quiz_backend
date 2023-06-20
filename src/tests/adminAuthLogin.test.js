import {
    adminAuthRegister,
    adminAuthLogin,
    adminUserDetails
} from '../auth.js';
import { clear } from '../other.js';


const ERROR = { error: expect.any(String) };
let user;
beforeEach(() => {
    clear();
    user = adminAuthRegister('email@gmail.com', 'pass', 'first', 'last');
});


test('Email address does not exist', () => {
    expect(adminAuthLogin('emailFail@gmail.com', 'pass')).toStrictEqual(ERROR);
});


describe('Password not correct for given email (but correct for another email)', () => {
    let user2;
    beforeEach(() => {
        user2 = adminAuthRegister('email2@gmail.com', 'pass2', 'first', 'last');
    });

    test('Error output for incorrect password', () => {
        expect(adminAuthLogin('email@gmail.com', 'pass2')).toStrictEqual(ERROR);
    });
    // Relies on adminUserDetails - commented
    // test('Correct incrementation of numFailedPasswordsSinceLastLogin', () => {
    //     adminAuthLogin('email@gmail.com', 'pass2');
    //     expect(
    //         adminUserDetails(user.authUserId).user.numFailedPasswordsSinceLastLogin
    //     ).toBe(1);
    // });
});

describe('Valid email and password', () => {
    test('Testing authUserId output', () => {
        expect(adminAuthLogin('email@gmail.com', 'pass')).toStrictEqual(
            { authUserId: expect.any(Number) });
    });
    // // Relies on adminUserDetails - commented
    // test('Correct incrementation of numSuccessfulLogins', () => {
    //     adminAuthLogin('email@gmail.com', 'pass');
    //     expect(
    //         adminUserDetails(user.authUserId).user.numSuccessfulLogins
    //     ).toBe(2);
    // });
    // test('Correct reset of numFailedPasswordsSinceLastLogin', () => {
    //     adminAuthLogin('email@gmail.com', 'pass');
    //     expect(
    //         adminUserDetails(user.authUserId).user.numFailedPasswordsSinceLastLogin
    //     ).toBe(0);
    // });
});
