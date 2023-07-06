import { getData, setData, Data, Quizzes, Token, Users } from './dataStore';

// HELPER FUNCTIONS

/**
 * Checks whether a given number is a valid user id
 *
 * @param {number} authUserId
 * @returns {boolean} true if valid, false if invalid
 */
export function isValidUserId(authUserId: number): boolean {
    if (isNaN(authUserId)) {
      return false;
    }
    const data: Data = getData();
    for (const current of data.users) {
      if (current.authUserId === authUserId) {
        return true;
      }
    }
    return false;
  }

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
  export function findUserFromToken(token: string): number  {
    const data: Data = getData();
    return (data.tokens.find(id => id.tokenId === token)).userId;
  }
  
  /**
   * finds the array index of a given user id
   *
   * @param {number} authUserId
   * @returns {number} index number that corresponds to user id
   */
  export function findUserIndex(authUserId: number): number {
    const data: Data = getData();
    for (const i in data.users) {
      if (data.users[i].authUserId === authUserId) {
        return parseInt(i);
      }
    }
    return -1;
  }
  
  /**
   * Helper function to determine if the quizId exist
   *
   * @param {number} quizId
   * @returns {boolean} - returns true if does exist
   * @returns {boolean} - returns false if it dosn't exist
   */
  export function isValidQuizId(quizId: number): boolean {
    if (isNaN(quizId)) {
      return false;
    }
  
    const data: Data = getData();
    // for (const current of data.quizzes) {
    //   if (current.quizId === quizId) {
    //     return true;
    //   }
    // }
    // return false;

    if (data.quizzes.find(id => id.quizId === quizId) === undefined) {
      return false;
    }
    return true;
  
    
  }
  
  /**
   * Helper function to determine if Quiz ID does not refer to a quiz that this user owns
   *
   * @param {number} quizId
   * @param {number} authUserID
   * @returns {boolean} - returns true if user does own quiz
   * @returns {boolean} - returns false if user does not own quiz
   */
  export function isValidCreator(quizId: number, authUserID: number): boolean {
    const data: Data = getData();
    for (const current of data.quizzes) {
      if (current.quizId === quizId) {
        if (current.creator === authUserID) {
          return true;
        }
      }
    }
  
    return false;
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