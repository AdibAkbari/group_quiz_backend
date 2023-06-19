import { setData, getData } from './dataStore.js'
import validator from 'validator';

/**
 * Register a user with an email, password, and names, then returns their 
 * authUserId value.
 * 
 * @param {string} email 
 * @param {string} password 
 * @param {string} nameFirst 
 * @param {string} nameLast 
 * @returns {authUserId: 1} authuserId
 */
export function adminAuthRegister (email, password, nameFirst, nameLast) {
    let store = getData();
    let authUserId = store.users.length + 1;
    let user = {email, password, nameFirst, nameLast, authUserId};

    if (!validator.isEmail(email)) {
        return {error: 'Email is Invalid'};
    };

    if (store.users.filter(mail => mail.email === email).length > 0) {
        return {error: 'Email already in use'}
    };

    store.users.push(user);
    setData(store);
    return {
        authUserId: authUserId
    };
}

console.log(adminAuthRegister('email@gmail.com', 'password1','nameFirst', 'nameLast'));

/**
 * Given a registered user's email and password returns their authUserId value.
 * 
 * @param {string} email - passes through the email of the user
 * @param {string} password - passes through the password of the user 
 * @returns {authUserId: 1} - returns authUserId: 1
 */
export function adminAuthLogin(email, password) {
    return {
      authUserId: 1,
    }
}

/**
 * Given an admin user's authUserId, return details about the user.
 * "name" is the first and last name concatenated with a single space between them
 * 
 * @param {number} authUserId
 * @returns {{user: {userId: number, name: string, email: string, 
 *                     numSuccessfulLogins: number,
 *                     numFailedPasswordsSinceLastLogin: number}}} object
 */
export function adminUserDetails(authUserId) {
    return { 
        user: 
        {
            userId: 1,
            name: 'Hayden Smith',
            email: 'hayden.smith@unsw.edu.au',
            numSuccessfulLogins: 3,
            numFailedPasswordsSinceLastLogin: 1,
        }
    }
}
