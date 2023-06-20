import { getData, setData } from "./dataStore.js";

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
export function adminAuthRegister(email, password, nameFirst, nameLast) {
    return {
        authUserId: 1,
    }
}

/**
 * Given a registered user's email and password returns their authUserId value.
 * 
 * @param {string} email - passes through the email of the user
 * @param {string} password - passes through the password of the user 
 * @returns {authUserId: 1} - returns authUserId: 1
 */
export function adminAuthLogin(email, password) {
    let emailExists = false;
    let newData = getData();
    let userIndex;

    for (const user of newData.users) {
        if (user.email === email) {
            emailExists = true;
            userIndex = newData.users.indexOf(user);
        }
    }
    if (emailExists === false) {
        return { error: 'email does not exist' };
    }

    if (newData.users[userIndex].password !== password) {
        newData.users[userIndex].numFailedPasswordsSinceLastLogin++;
        setData(newData);
        return { error: 'password does not match given email' }
    }
    newData.users[userIndex].numSuccessfulLogins++;
    newData.users[userIndex].numFailedPasswordsSinceLastLogin = 0;

    setData(newData);

    return {
        authUserId: newData.users[userIndex].authUserId,
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
