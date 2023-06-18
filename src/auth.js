import {setData, getData} from './dataStore.js'

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
    let data = getData();
    
    if (!isValidUserId(authUserId)) {
        return {
            error: 'AuthUserId is not a valid user'
        }
    };

    let i = findUserIndex(authUserId);
    if (i === -1) {
        return {
            error: 'AuthUserId is not a valid user'
        }
    }
    let name = `${data.users[i].nameFirst} ${data.users[i].nameLast}`;

    return { 
        user: 
        {
            userId: data.users[i].authUserId,
            name: name,
            email: data.users[i].email,
            numSuccessfulLogins: data.users[i].numSuccessfulLogins,
            numFailedPasswordsSinceLastLogin: data.users[i].numFailedPasswordsSinceLastLogin,
        }
    }
}

/**
 * Checks whether a given number is a valid user id
 * 
 * @param {number} authUserId 
 * @returns {boolean} true if valid, false if invalid
 */
function isValidUserId(authUserId) {
    if(isNaN(authUserId)) {
        return false;
    };
    let data = getData();
    for (const current of data.users) {
        if (current.authUserId === authUserId) {
            return true;
        }
    };
    return false;
}

/**
 * finds the array index of a given user id
 * 
 * @param {number} authUserId 
 * @returns {number} index number that corresponds to user id
 */
function findUserIndex(authUserId) {
    let data = getData();
    for (const i in data.users) {
        if (data.users[i].authUserId === authUserId) {
            return i;
        }
    }
    return -1;
}
