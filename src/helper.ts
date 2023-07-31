import { getData } from './dataStore';
import { Data, Quizzes, Question } from './interfaces';
import HTTPError from 'http-errors';

// HELPER FUNCTIONS
/**
   * Helper function to determine whether token is a valid structure
   *
   * @param {string} token
   * @returns {boolean}
   */
export function isValidTokenStructure(token: string): boolean {
  if (/^\d+$/.test(token)) {
    return true;
  }
  return false;
}

/**
   * checks whether a given token corresponds to a tokenId that is logged in
   *
   * @param {string} token
   * @returns {boolean}
   */
export function isTokenLoggedIn(token: string): boolean {
  const data: Data = getData();
  if (data.tokens.find(id => id.tokenId === token) === undefined) {
    return false;
  }
  return true;
}

/**
   * from a tokenId, return the corresponding userId
   *
   * @param {string} token
   * @returns {number} userId
   */
export function findUserFromToken(token: string): number {
  const data: Data = getData();
  return (data.tokens.find(id => id.tokenId === token)).userId;
}

/**
   * Helper function to determine if the quizId exist
   *
   * @param {number} quizId
   * @returns {boolean} - returns true if does exist
   * @returns {boolean} - returns false if it dosn't exist
   */
export function isValidQuizId(quizId: number): boolean {
  const data: Data = getData();
  if (data.quizzes.find(id => id.quizId === quizId) === undefined) {
    return false;
  }
  return true;
}

/**
   * Helper function to determine if Quiz ID does not refer to a quiz that this user owns
   *
   * @param {number} quizId
   * @param {string} token
   * @returns {boolean} - returns true if user does own quiz
   * @returns {boolean} - returns false if user does not own quiz
   */
export function isValidCreator(quizId: number, token: string): boolean {
  const data: Data = getData();
  const userId = findUserFromToken(token);
  const index = data.quizzes.findIndex(id => id.quizId === quizId);
  if (data.quizzes[index].creator === userId) {
    return true;
  }
  return false;
}

/**
 * Helper function to determine if question Id is a valid question within the given quiz
 *
 * @param {number} quizId
 * @param {number} questionId
 * @returns {boolean} - returns true if questionId is a valid question within this quiz, false otherwise
 */
export function isValidQuestionId(quizId: number, questionId: number): boolean {
  const data: Data = getData();
  const index = data.quizzes.findIndex(id => id.quizId === quizId);
  if (data.quizzes[index].questions.find(id => id.questionId === questionId) === undefined) {
    return false;
  }
  return true;
}

export function isValidSessionId(sessionId: number, quizId: number): boolean {
  const data = getData();
  const session = data.sessions.find(id => id.sessionId === sessionId);
  if(session === undefined) {
    return false;
  }
  if(session.metadata.quizId !== quizId) {
    return false;
  }
  return true;
}

export function isValidQuestionPosition(playerId: number, questionPosition: number): boolean {
  const data = getData();
  const player = data.players.find(id => id.playerId === playerId);
  const session = data.sessions.find(id => id.sessionId === player.sessionId);

  if(questionPosition > session.metadata.numQuestions) {
    return false;
  }
  if(questionPosition < 0) {
    return false;
  }
  if(questionPosition !== session.atQuestion) {
    return false;
  }
  return true;
}

/**
   * Helper function for adminQuizCreate to check if a quiz name is valid
   *
   * @param {number} authUserId
   * @param {String} name
   * @returns {Boolean} whether the name is valid
   */
export function checkNameValidity(name: string, authUserId: number): boolean {
  // length must be between 3 and 30 characters
  if (name.length < 3 || name.length > 30) {
    return false;
  }
  // only alpha-numeric characters
  const alphaNumeric = /^[a-zA-Z0-9\s]*$/;
  if (!alphaNumeric.test(name)) {
    return false;
  }

  // return false if name is only whitespace
  if (isWhiteSpace(name)) {
    return false;
  }

  // name cannot be already used by user for another quiz
  const quizzes: Quizzes[] = getData().quizzes;
  for (const quiz of quizzes) {
    if (quiz.creator === authUserId && quiz.name === name) {
      return false;
    }
  }

  return true;
}

/**
   * Check if given string is purely whitespace
   *
   * @param {string} name
   * @returns {boolean}
   */
export function isWhiteSpace (name: string): boolean {
  const expression = /^[\s]+$/;

  if (expression.test(name)) {
    return true;
  }

  return false;
}

/**
   * Helper function to determine if the email exist
   *
   * @param {string} userEmail
   * @returns {boolean} - returns true if does exist
   * @returns {boolean} - returns false if it dosn't exist
   */
export function isValidEmail (userEmail: string): boolean {
  const data: Data = getData();

  const validEmail = data.users.find(current => current.email === userEmail);
  if (validEmail) {
    return true;
  }

  return false;
}

export function giveError(isv2: boolean, errorMessage: string, statusCode: number) {
  if (isv2) {
    throw HTTPError(statusCode, errorMessage);
  }
  return { error: errorMessage };
}

/**
 * Helper function to generate a random name if user didnt enter a name
 *
 * @param {} - no params
 * @returns {string} - playerName
 */
export function generateName() {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';

  function randomString(str) {
    const array = str.split('');
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array.join('');
  }

  const nameChar = randomString(letters).slice(0, 5);
  const nameNum = randomString(numbers).slice(0, 3);

  const playerName = nameChar + nameNum;

  return playerName;
}

/**
   * Helper function to determine if the playerId exist
   *
   * @param {number} playerId
   * @returns {boolean} - returns true if does exist
   * @returns {boolean} - returns false if it dosn't exist
   */
export function isValidPlayerId(playerId: number): boolean {
  const data: Data = getData();
  if (data.players.find(id => id.playerId === playerId) === undefined) {
    return false;
  }
  return true;
}
