import { setData, getData } from './dataStore';
import { Error, Data, Users, Token } from './interfaces';
import validator from 'validator';
import { isValidTokenStructure, isTokenLoggedIn, findUserFromToken, isWhiteSpace } from './helper';

export interface UserId {
    authUserId: number;
}

export interface TokenId {
  token: string;
}

export interface User {
    user: {
        userId: number;
        name: string;
        email: string;
        numSuccessfulLogins: number;
        numFailedPasswordsSinceLastLogin: number;
    }
}

/**
 * Register a user with an email, password, and names, then returns their
 * token value.
 *
 * @param {string} email
 * @param {string} password
 * @param {string} nameFirst
 * @param {string} nameLast
 * @returns {{token: number}}
 */
export function adminAuthRegister (email: string, password: string, nameFirst: string, nameLast: string): Error | TokenId {
  const store = getData();

  if (!validator.isEmail(email)) {
    return { error: 'Email is Invalid' };
  }

  if (store.users.filter(mail => mail.email === email).length > 0) {
    return { error: 'Email already in use' };
  }

  if (nameFirst.length < 2 || nameFirst.length > 20) {
    return { error: 'First name must be 2 to 20 characters' };
  }

  const expressionName = /^[A-Za-z\s'-]+$/;
  if (!expressionName.test(nameFirst)) {
    return { error: 'First name must only contain letters, spaces, hyphens or apostrophes' };
  }

  if (nameLast.length < 2 || nameLast.length > 20) {
    return { error: 'Last name must be 2 to 20 characters' };
  }

  if (!expressionName.test(nameLast)) {
    return { error: 'Last name must only contain letters, spaces, hyphens or apostrophes' };
  }

  if (isWhiteSpace(nameFirst) || isWhiteSpace(nameLast)) {
    return { error: 'First name and Last name cannot be solely white space' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters' };
  }

  const letters = /[a-zA-Z]/;
  const numbers = /\d/;
  if (!letters.test(password) || !numbers.test(password)) {
    return { error: 'Password must contain at least one letter and one number' };
  }

  const userId: number = store.users.length + 1;
  const numSuccessfulLogins = 1;
  const numFailedPasswordsSinceLastLogin = 0;
  const user: Users = { email, password, nameFirst, nameLast, authUserId: userId, numSuccessfulLogins, numFailedPasswordsSinceLastLogin };
  store.users.push(user);

  const timeNow: number = Math.floor((new Date()).getTime() / 1000);
  const tokenId: string = (Math.floor(Math.random() * timeNow)).toString();
  const token: Token = { tokenId, userId };
  store.tokens.push(token);
  setData(store);

  return {
    token: tokenId
  };
}

/**
 * Given a registered user's email and password returns their authUserId value.
 *
 * @param {string} email
 * @param {string} password
 * @returns {{authUserId: number}}
 */
export function adminAuthLogin(email: string, password: string): Error | TokenId {
  const newData = getData();
  const userIndex = newData.users.findIndex((user) => user.email === email);

  if (userIndex === -1) {
    return { error: 'email does not exist' };
  }

  if (newData.users[userIndex].password !== password) {
    newData.users[userIndex].numFailedPasswordsSinceLastLogin++;
    setData(newData);
    return { error: 'password does not match given email' };
  }

  newData.users[userIndex].numSuccessfulLogins++;
  newData.users[userIndex].numFailedPasswordsSinceLastLogin = 0;

  setData(newData);

  const userId = newData.users[userIndex].authUserId;
  const token = newData.tokens.find((token) => token.userId === userId);

  return {
    token: token.tokenId
  };
}

/**
 * Given an admin user's token, return details about the user.
 * "name" is the first and last name concatenated with a single space between them.
 *
 * @param {number} token
 * @returns {{user: {
 *              userId: number,
 *              name: string,
 *              email: string,
 *              numSuccessfulLogins: number,
 *              numFailedPasswordsSinceLastLogin: number
 *              }}}
 */
export function adminUserDetails(token: string): User | Error {
  const data: Data = getData();

  if (!isValidTokenStructure(token)) {
    return {
      error: 'token is an invalid structure'
    };
  }

  if (!isTokenLoggedIn(token)) {
    return {
      error: 'token is not logged in'
    };
  }

  const userId = findUserFromToken(token);
  const index = data.users.findIndex(id => id.authUserId === userId);
  const name = `${data.users[index].nameFirst} ${data.users[index].nameLast}`;

  return {
    user:
        {
          userId: data.users[index].authUserId,
          name: name,
          email: data.users[index].email,
          numSuccessfulLogins: data.users[index].numSuccessfulLogins,
          numFailedPasswordsSinceLastLogin: data.users[index].numFailedPasswordsSinceLastLogin,
        }
  };
}

/**
 * Updates a logged in user's password
 *
 * @param {string} token
 * @param {string} oldPassword
 * @param {string} newPassword
 * @returns {{ }} empty object
 */
export function updateUserPassword(token: string, oldPassword: string, newPassword: string): Error | Record<string, never> {
  const data: Data = getData();

  if (!isValidTokenStructure(token)) {
    return { error: 'Token is an invalid structure' };
  }

  if (!isTokenLoggedIn(token)) {
    return { error: 'Token is not logged in' };
  }

  const userId = findUserFromToken(token);
  const index = data.users.findIndex(id => id.authUserId === userId);
  if (data.users[index].password !== oldPassword) {
    return { error: 'Old password is incorrect' };
  }

  if (data.users[index].oldPasswords !== undefined) {
    if (data.users[index].oldPasswords.includes(newPassword)) {
      return { error: 'New password has been used previously' };
    }
  }

  if (newPassword.length < 8) {
    return { error: 'New password must be at least 8 characters' };
  }

  const letters = /[a-zA-Z]/;
  const numbers = /\d/;
  if (!letters.test(newPassword) || !numbers.test(newPassword)) {
    return { error: 'New password must contain at least one letter and one number' };
  }

  if (data.users[index].oldPasswords === undefined) {
    data.users[index].oldPasswords = [];
  }

  data.users[index].oldPasswords.push(oldPassword);
  data.users[index].password = newPassword;

  setData(data);
  return ({ });
}

/**
 * Update the email, first name and last name of a logged in user
 *
 * @param {string} token
 * @param {string} email
 * @param {string} nameFirst
 * @param {string} nameLast
 * @returns {{ }} empty object
*/
export function updateUserDetails(token: string, email: string, nameFirst: string, nameLast: string): Record<string, never> | Error {
  const data: Data = getData();

  if (!isValidTokenStructure(token)) {
    return { error: 'Token is an invalid structure' };
  }

  if (!isTokenLoggedIn(token)) {
    return { error: 'Token is not logged in' };
  }

  const userId = findUserFromToken(token);
  const index = data.users.findIndex(id => id.authUserId === userId);
  if (data.users[index].email !== email && data.users.filter(mail => mail.email === email).length > 0) {
    return { error: 'Email is currently used by another user' };
  }

  if (!validator.isEmail(email)) {
    return { error: 'Email is Invalid' };
  }

  const expressionName = /^[A-Za-z\s'-]+$/;
  if (!expressionName.test(nameFirst)) {
    return { error: 'First name must only contain letters, spaces, hyphens or apostrophes' };
  }

  if (nameFirst.length < 2 || nameFirst.length > 20) {
    return { error: 'First name must be 2 to 20 characters' };
  }

  if (!expressionName.test(nameLast)) {
    return { error: 'Last name must only contain letters, spaces, hyphens or apostrophes' };
  }

  if (nameLast.length < 2 || nameLast.length > 20) {
    return { error: 'Last name must be 2 to 20 characters' };
  }

  if (isWhiteSpace(nameFirst) || isWhiteSpace(nameLast)) {
    return { error: 'First name and Last name cannot be solely white space' };
  }

  data.users[index].email = email;
  data.users[index].nameFirst = nameFirst;
  data.users[index].nameLast = nameLast;

  setData(data);
  return ({ });
}
