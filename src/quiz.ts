import { getData, setData, Data, Error } from './dataStore';
import {
  checkNameValidity,
  isValidCreator,
  isValidQuizId,
  isValidUserId,
  isWhiteSpace,
  isValidTokenStructure,
  isTokenLoggedIn,
  findUserFromToken,
} from './helper';

  interface QuizList {
      quizId: number,
      name: string
  }

  interface QuizCreate {
      quizId: number,
  }

/**
   * Provide a list of all quizzes that are owned by the currently logged in user.
   *
   * @param {number} token
   * @returns {{quizzes: Array<{
   *                  quizId: number,
   *                  name: string
   *              }>
   *          }}
   */
export function adminQuizList (token: string): {quizzes: QuizList[]} | Error {
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

  const authUserId = findUserFromToken(token);

  const newList = data.quizzes.filter(id => id.creator === authUserId);
  const quizzes: QuizList[] = newList.map((quiz) => { return { quizId: quiz.quizId, name: quiz.name }; });

  /*
  for (const quiz of data.quizzes) {
    if (quiz.creator === authUserId) {
      const quizId: number = quiz.quizId;
     // const name: string = quiz.name;
      quizzes.push({ quizId, name });
    }
  }
*/
  return {
    quizzes: quizzes
  };
}

/**
 * Given basic details about a new quiz, create one for the user.
 *
 * @param {string} token
 * @param {string} name
 * @param {string} description
 * @returns {{quizId: number}} quizId
 */
export function adminQuizCreate(token: string, name: string, description: string): QuizCreate | Error {
  // invalid token structure
  if (!isValidTokenStructure(token)) {
    return { error: 'Invalid Token Structure' };
  }

  // token is not logged in
  if (!isTokenLoggedIn(token)) {
    return { error: 'Token not logged in' };
  }

  // get authUserId from token
  const authUserId = findUserFromToken(token);

  // invalid name
  if (!checkNameValidity(name, authUserId)) {
    return { error: 'Invalid Name' };
  }

  // invalid description
  if (description.length > 100) {
    return { error: 'Invalid Description' };
  }

  // get time in seconds
  const timeNow: number = Math.floor((new Date()).getTime() / 1000);

  // get and set data to add quiz object to quizzes array
  const data: Data = getData();
  data.quizCount++; // increment quizCount by 1
  const id: number = data.quizCount;
  data.quizzes.push(
    {
      quizId: id,
      name: name,
      timeCreated: timeNow,
      timeLastEdited: timeNow,
      description: description,
      numQuestions: 0,
      questions: [],
      creator: authUserId,
      duration: 0,
    }
  );
  setData(data);

  return {
    quizId: id,
  };
}
/**
 * Given a particular quizId, permanently remove the quiz.
 *
 * @param {string} token
 * @param {number} quizId
 * @returns {{ }} empty object
 */
export function adminQuizRemove(token: string, quizId: number): Record<string, never> | Error {
  // invalid token structure
  if (!isValidTokenStructure(token)) {
    return { error: 'Invalid Token Structure' };
  }

  // token is not logged in
  if (!isTokenLoggedIn(token)) {
    return { error: 'Token not logged in' };
  }

  if (!isValidQuizId(quizId)) {
    return { error: 'Invalid: QuizId' };
  }

  // get authUserId from token
  const authUserId = findUserFromToken(token);

  if (!isValidCreator(quizId, authUserId)) {
    return { error: 'Invalid: user does not own quiz' };
  }

  const data: Data = getData();
  const index = data.quizzes.findIndex((quiz) => quiz.quizId === quizId);

  if (index !== -1) {
    data.trash.push(data.quizzes[index]);
    data.quizzes.splice(index, 1);
    setData(data);
  }

  return { };
}

/**
   * View the quizzes that are currently in the trash
   *
   * @param token
   * @returns {{quizzes: Array<{
  *                  quizId: number,
  *                  name: string
  *              }>
  *          }}
  */
export function adminQuizTrash(token: string): {quizzes: QuizList[]} | Error {
  // invalid token structure
  if (!isValidTokenStructure(token)) {
    return { error: 'Invalid Token Structure' };
  }

  // token is not logged in
  if (!isTokenLoggedIn(token)) {
    return { error: 'Token not logged in' };
  }

  const data = getData();
  // maps list of quiz objects in trash to just have name and quizId
  const trashQuizzes = data.trash.map((quiz) => { 
    return { quizId: quiz.quizId, name: quiz.name }; 
  });

  return {
    quizzes: trashQuizzes
  };
}

/**
   * Given quizId restore the quiz from the trash back to an active quiz
   *
   * @param {string} token
   * @param {number} quizId
   * @returns { } empty object
   */
export function adminQuizRestore(token: string, quizId: number): Record<string, never> | Error {
  // invalid token structure
  if (!isValidTokenStructure(token)) {
    return { error: 'Invalid Token Structure' };
  }

  // token is not logged in
  if (!isTokenLoggedIn(token)) {
    return { error: 'Token not logged in' };
  }

  const data = getData();
  const quizIndex = data.trash.findIndex((quiz) => quiz.quizId === quizId);
  if (quizIndex === -1) {
    return { error: 'Invalid: quiz is not currently in trash or does not exist' };
  }

  // get authUserId from token
  const authUserId = findUserFromToken(token);

  if (data.trash[quizIndex].creator !== authUserId) {
    return { error: 'Invalid: user does not own quiz' };
  }

  data.quizzes.push(data.trash[quizIndex]);
  data.trash.splice(quizIndex, 1);
  setData(data);
  return { };
}

/**
   * Get all of the relevant information about the current quiz.
   *
   * @param {number} authUserId
   * @param {number} quizId
   * @returns {{
   *           quizId: number,
   *           name: string,
   *           timeCreated: number,
   *           timeLastEdited: number,
   *           description: string,
   *          }}
   */
export function adminQuizInfo(authUserId: number, quizId: number): Error | {
      quizId: number, name: string, timeCreated: number, timeLastEdited: number, description: string
  } {
  if (!isValidUserId(authUserId)) {
    return { error: 'authUserId does not refer to valid user' };
  }

  if (!isValidQuizId(quizId)) {
    return { error: 'quizId does not refer to valid quiz' };
  }

  if (!isValidCreator(quizId, authUserId)) {
    return { error: 'quizId does not refer to quiz that this user owns' };
  }

  const data: Data = getData();
  for (const quiz of data.quizzes) {
    if (quiz.quizId === quizId) {
      return {
        quizId: quiz.quizId,
        name: quiz.name,
        timeCreated: quiz.timeCreated,
        timeLastEdited: quiz.timeLastEdited,
        description: quiz.description,
      };
    }
  }

  return {
    error: 'Quiz could not be found'
  };
}

/**
   * Update the name of the relevant quiz given the authUserId
   * of the owner of the quiz, the quizId of the quiz to change and the
   * new name.
   *
   * @param {number} authUserId
   * @param {number} quizId
   * @param {string} name
   * @returns {{ }} empty object
   */
export function adminQuizNameUpdate(authUserId: number, quizId: number, name: string): Record<string, never> | Error {
  // Check inputted UserId is valid
  if (isValidUserId(authUserId) === false) {
    return { error: 'Please enter a valid user' };
  }
  // Check inputted quizId is valid
  if (isValidQuizId(quizId) === false) {
    return { error: 'Please enter a valid quiz' };
  }
  // Check inputted Quiz ID does not refer to a quiz that this user owns
  if (isValidCreator(quizId, authUserId) === false) {
    return { error: 'You do not own this quiz' };
  }
  // Check inputted name is valid
  if (!checkNameValidity(name, authUserId)) {
    return { error: 'Name not valid' };
  }
  // Check name isn't just whitespace
  if (isWhiteSpace(name)) {
    return { error: 'Quiz name cannot be solely white space' };
  }

  const data: Data = getData();
  const timeNow: number = Math.floor((new Date()).getTime() / 1000);
  for (const current of data.quizzes) {
    if (current.quizId === quizId) {
      current.name = name;
      current.timeLastEdited = timeNow;
      setData(data);
    }
  }

  return { };
}

/**
   * Update the description of the relevant quiz given the authUserId
   * of the owner of the quiz, the quizId of the quiz to change and the
   * new description.
   *
   * @param {number} authUserId
   * @param {number} quizId
   * @param {string} description
   * @returns {{ }}
   */
export function adminQuizDescriptionUpdate (authUserID: number, quizId: number, description: string): Record<string, never> | Error {
  if (!isValidUserId(authUserID)) {
    return { error: 'authUserId does not refer to valid user' };
  }

  if (!isValidQuizId(quizId)) {
    return { error: 'quizId does not refer to valid quiz' };
  }

  if (!isValidCreator(quizId, authUserID)) {
    return { error: 'quizId does not refer to a quiz that this user owns' };
  }

  if (description.length > 100) {
    return { error: 'description must be less than 100 characters' };
  }

  const store: Data = getData();
  const quizIndex: number = store.quizzes.findIndex(id => id.quizId === quizId);
  const timeNow: number = Math.floor((new Date()).getTime() / 1000);
  store.quizzes[quizIndex].description = description;
  store.quizzes[quizIndex].timeLastEdited = timeNow;
  setData(store);

  return { };
}
