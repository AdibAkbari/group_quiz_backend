 /**
 * Register a user with an email, password, and names, then returns their authUserId value.
 * @param = {string} email
 * @param = {string} password
 * @param = {string} nameFirst
 * @param = {string} nameLast
 * @returns = {authUserId: 1} authuserId
 */
function adminAuthRegister (email, password, nameFirst, nameLast) {
    return {
        authUserId: 1,
    }
}

/**
 * Given a registered user's email and password returns their authUserId value.
 * @param {string} email - passes through the email of the user
 * @param {string} password - passes through the password of the user 
 * @returns {authUserId: 1} - returns authUserId: 1
 */
function adminAuthLogin(email, password) {
    return {
      authUserId: 1,
    }
}