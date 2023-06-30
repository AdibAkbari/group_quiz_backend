import { error, setData, getData } from './dataStore';
import validator from 'validator';
import { isValidUserId, findUserIndex, isWhiteSpace } from './other';

export interface userId {
    authUserId: number;
}

export interface user {
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
 * authUserId value.
 *
 * @param {string} email
 * @param {string} password
 * @param {string} nameFirst
 * @param {string} nameLast
 * @returns {{authUserId: number}}
 */
export function adminAuthRegister (email: string, password: string, nameFirst: string, nameLast: string): error | userId {
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

  const authUserId = store.users.length + 1;
  const numSuccessfulLogins = 1;
  const numFailedPasswordsSinceLastLogin = 0;
  const user = { email, password, nameFirst, nameLast, authUserId, numSuccessfulLogins, numFailedPasswordsSinceLastLogin };

  store.users.push(user);
  setData(store);
  return {
    authUserId: authUserId
  };
}

/**
 * Given a registered user's email and password returns their authUserId value.
 *
 * @param {string} email
 * @param {string} password
 * @returns {{authUserId: number}}
 */
export function adminAuthLogin(email: string, password: string): error | userId {
  let emailExists = false;
  const newData = getData();
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
    return { error: 'password does not match given email' };
  }
  newData.users[userIndex].numSuccessfulLogins++;
  newData.users[userIndex].numFailedPasswordsSinceLastLogin = 0;

  setData(newData);

  return {
    authUserId: newData.users[userIndex].authUserId,
  };
}

/**
 * Given an admin user's authUserId, return details about the user.
 * "name" is the first and last name concatenated with a single space between them.
 *
 * @param {number} authUserId
 * @returns {{user: {
 *              userId: number,
 *              name: string,
 *              email: string,
 *              numSuccessfulLogins: number,
 *              numFailedPasswordsSinceLastLogin: number
 *              }}}
 */
export function adminUserDetails(authUserId: number): user | error {
  const data = getData();

  if (!isValidUserId(authUserId)) {
    return {
      error: 'AuthUserId is not a valid user'
    };
  }

  const i = findUserIndex(authUserId);
  if (i === -1) {
    return {
      error: 'AuthUserId is not a valid user'
    };
  }
  const name = `${data.users[i].nameFirst} ${data.users[i].nameLast}`;

  return {
    user:
        {
          userId: data.users[i].authUserId,
          name: name,
          email: data.users[i].email,
          numSuccessfulLogins: data.users[i].numSuccessfulLogins,
          numFailedPasswordsSinceLastLogin: data.users[i].numFailedPasswordsSinceLastLogin,
        }
  };
}
