import { getData, setData } from './dataStore';
import { Data, Error, Answer, Quizzes, Question, QuizList, QuizId, QuizInfo, Answers } from './interfaces';
import {
  checkNameValidity,
  isValidCreator,
  isValidQuizId,
  isWhiteSpace,
  isValidTokenStructure,
  isTokenLoggedIn,
  findUserFromToken,
  isValidQuestionId,
  isValidEmail,
  giveError,
  getImg,
  isEndState
} from './helper';
import HTTPError from 'http-errors';
import config from './config.json';

/**
   * Provide a list of all quizzes that are owned by the currently logged in user.
   *
   * @param {string} token
   * @returns {{quizzes: Array<{
   *                  quizId: number,
   *                  name: string
   *              }>
   *          }}
   */
export function adminQuizList (token: string, isv2: boolean): {quizzes: QuizList[]} | Error {
  const data: Data = getData();

  if (!isValidTokenStructure(token)) {
    return giveError(isv2, 'token is an invalid structure', 401);
  }

  if (!isTokenLoggedIn(token)) {
    return giveError(isv2, 'token is not logged in', 403);
  }

  const authUserId = findUserFromToken(token);

  const newList = data.quizzes.filter(id => id.creator === authUserId);
  const quizzes: QuizList[] = newList.map((quiz) => { return { quizId: quiz.quizId, name: quiz.name }; });

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
export function adminQuizCreate(token: string, name: string, description: string, isv2: boolean): QuizId | Error {
  // invalid token structure
  if (!isValidTokenStructure(token)) {
    return giveError(isv2, 'Invalid Token Structure', 401);
  }

  // token is not logged in
  if (!isTokenLoggedIn(token)) {
    return giveError(isv2, 'Token not logged in', 403);
  }

  // get authUserId from token
  const authUserId = findUserFromToken(token);

  // invalid name
  if (!checkNameValidity(name, authUserId)) {
    return giveError(isv2, 'Invalid Name', 400);
  }

  // invalid description
  if (description.length > 100) {
    return giveError(isv2, 'Invalid Description', 400);
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
      questionCount: 0
    }
  );
  setData(data);

  return {
    quizId: id,
  };
}

/**
 * Given a particular quizId, send the quiz to trash
 *
 * @param {string} token
 * @param {number} quizId
 * @returns {{ }} empty object
 */
export function adminQuizRemove(token: string, quizId: number, isv2: boolean): Record<string, never> | Error {
  if (isv2) {
    if (!isEndState(quizId)) {
      throw HTTPError(400, 'Quiz is not in END state');
    }
  }

  if (!isValidTokenStructure(token)) {
    return giveError(isv2, 'Invalid Token Structure', 401);
  }
  if (!isTokenLoggedIn(token)) {
    return giveError(isv2, 'Token not logged in', 403);
  }

  if (!isValidQuizId(quizId)) {
    return giveError(isv2, 'Invalid: QuizId', 400);
  }

  if (!isValidCreator(quizId, token)) {
    return giveError(isv2, 'Invalid: user does not own quiz', 400);
  }

  const data: Data = getData();
  const index = data.quizzes.findIndex((quiz) => quiz.quizId === quizId);

  const timeNow: number = Math.floor((new Date()).getTime() / 1000);
  data.quizzes[index].timeLastEdited = timeNow;
  data.trash.push(data.quizzes[index]);
  data.quizzes.splice(index, 1);
  setData(data);

  return { };
}

/**
 * View the quizzes that are currently in the trash
 *
 * @param {string} token
 * @returns {{quizzes: Array<{
 *                  quizId: number,
 *                  name: string
 *              }>
 *          }}
 */
export function adminQuizTrash(token: string, isv2: boolean): {quizzes: QuizList[]} | Error {
  // invalid token structure
  if (!isValidTokenStructure(token)) {
    return giveError(isv2, 'Invalid Token Structure', 401);
  }

  // token is not logged in
  if (!isTokenLoggedIn(token)) {
    return giveError(isv2, 'Token not logged in', 403);
  }

  const data = getData();
  // filters out quizzes not created by user
  const authUserId = findUserFromToken(token);

  const trashQuizzes = data.trash.filter((quiz: Quizzes) => {
    return quiz.creator === authUserId;
  });

  // maps list of quiz objects in trash to just have name and quizId
  const simpleTrashQuizzes = trashQuizzes.map((quiz) => {
    return { quizId: quiz.quizId, name: quiz.name };
  });

  return {
    quizzes: simpleTrashQuizzes
  };
}

/**
   * Given quizId restore the quiz from the trash back to an active quiz
   *
   * @param {string} token
   * @param {number} quizId
   * @returns { } empty object
   */
export function adminQuizRestore(token: string, quizId: number, isv2: boolean): Record<string, never> | Error {
  // invalid token structure
  if (!isValidTokenStructure(token)) {
    return giveError(isv2, 'Invalid Token Structure', 401);
  }

  // token is not logged in
  if (!isTokenLoggedIn(token)) {
    return giveError(isv2, 'Token not logged in', 403);
  }

  const data = getData();
  const quizIndex = data.trash.findIndex((quiz) => quiz.quizId === quizId);
  if (quizIndex === -1) {
    return giveError(isv2, 'Invalid: quiz is not currently in trash or does not exist', 400);
  }

  // get authUserId from token
  const authUserId = findUserFromToken(token);

  if (data.trash[quizIndex].creator !== authUserId) {
    return giveError(isv2, 'Invalid: user does not own quiz', 400);
  }

  // get time in seconds
  const timeNow = Math.floor((new Date()).getTime() / 1000);
  data.trash[quizIndex].timeLastEdited = timeNow;
  // add the quiz to restore to list of quizzes
  data.quizzes.push(data.trash[quizIndex]);
  // remove quiz to restore from trash
  data.trash.splice(quizIndex, 1);
  setData(data);
  return { };
}

/**
 * Permanently deletes the specific quizzes currently in trash
 *
 * @param {string} token
 * @param {number[]} quizIds
 * @returns {{}} empty object
 */
export function adminQuizTrashEmpty(token: string, quizIds: number[], isv2: boolean): Record<string, never> | Error {
  if (!isValidTokenStructure(token)) {
    return giveError(isv2, 'Invalid Token Structure', 401);
  }

  if (!isTokenLoggedIn(token)) {
    return giveError(isv2, 'Token not logged in', 403);
  }

  const data = getData();
  const authUserId = findUserFromToken(token);

  for (const quizId of quizIds) {
    const quiz = data.trash.find((quiz) => quiz.quizId === quizId);
    if (quiz === undefined) {
      return giveError(isv2, 'one or more quizIds not currently in trash or do not exist', 400);
    }
    if (quiz.creator !== authUserId) {
      return giveError(isv2, 'one or more quizIds refer to a quiz that user does not own', 400);
    }
  }

  // filters trash and keeps quizzes if they are not in the list of quizIds
  data.trash = data.trash.filter((quiz) => !quizIds.includes(quiz.quizId));
  setData(data);

  return { };
}

/**
 * Get all of the relevant information about the current quiz.
 *
 * @param {string} token
 * @param {number} quizId
 * @returns {{
*           quizId: number,
*           name: string,
*           timeCreated: number,
*           timeLastEdited: number,
*           description: string,
*          }}
*/
export function adminQuizInfo(token: string, quizId: number, isv2: boolean): Error | QuizInfo {
  // Error checking for token
  if (!isValidTokenStructure(token)) {
    return giveError(isv2, 'invalid token structure', 401);
  }
  if (!isTokenLoggedIn(token)) {
    return giveError(isv2, 'token is not logged in', 403);
  }

  // Error checking for quizId
  if (!isValidQuizId(quizId)) {
    return giveError(isv2, 'invalid quizId', 400);
  }
  if (!isValidCreator(quizId, token)) {
    return giveError(isv2, 'invalid quizId', 400);
  }

  const data: Data = getData();
  const quiz = data.quizzes.find(id => id.quizId === quizId);

  if (isv2 & quiz.thumbnailUrl != undefined) {
    return {
      quizId: quizId,
      name: quiz.name,
      timeCreated: quiz.timeCreated,
      timeLastEdited: quiz.timeLastEdited,
      description: quiz.description,
      numQuestions: quiz.numQuestions,
      questions: quiz.questions,
      duration: quiz.duration,
      thumbnailUrl: quiz.thumbnailUrl,
    };
  }

  return {
    quizId: quizId,
    name: quiz.name,
    timeCreated: quiz.timeCreated,
    timeLastEdited: quiz.timeLastEdited,
    description: quiz.description,
    numQuestions: quiz.numQuestions,
    questions: quiz.questions,
    duration: quiz.duration
  };
}

/**
 * Update the name of the relevant quiz given the token
 * of the owner of the quiz, the quizId of the quiz to change and the
 * new name.
 *
 * @param {string} token
 * @param {number} quizId
 * @param {string} name
 * @returns {{ }} empty object
 */
export function adminQuizNameUpdate(token: string, quizId: number, name: string, isv2: boolean): Record<string, never> | Error {
  // Check if token structure is invalid
  if (!isValidTokenStructure(token)) {
    return giveError(isv2, 'Invalid Token Structure', 401);
  }
  // Check if token is not logged in
  if (!isTokenLoggedIn(token)) {
    return giveError(isv2, 'Token not logged in', 403);
  }

  // Check inputted quizId is valid
  if (!isValidQuizId(quizId)) {
    return giveError(isv2, 'Invalid: QuizId', 400);
  }
  // Check inputted Quiz ID does not refer to a quiz that this user owns
  if (!isValidCreator(quizId, token)) {
    return giveError(isv2, 'Invalid: You do not own this quiz', 400);
  }

  // Get authUserId from token
  const authUserId = findUserFromToken(token);
  // Check if the name is valid
  if (!checkNameValidity(name, authUserId)) {
    return giveError(isv2, 'Invalid: Name', 400);
  }

  const data: Data = getData();
  const timeNow = Math.floor(Date.now() / 1000);

  const quizToUpdate = data.quizzes.find((current) => current.quizId === quizId);

  quizToUpdate.name = name;
  quizToUpdate.timeLastEdited = timeNow;
  setData(data);

  return { };
}

/**
 * Update the description of the relevant quiz given the token
 * of the owner of the quiz, the quizId of the quiz to change and the
 * new description.
 *
 * @param {number} quizId
 * @param {string} tokenId
 * @param {string} description
 * @returns {{ }} empty object
 */
export function adminQuizDescriptionUpdate (quizId: number, tokenId: string, description: string, isv2: boolean): Record<string, never> | Error {
  if (!isValidTokenStructure(tokenId)) {
    return giveError(isv2, 'token is not a valid structure', 401);
  }

  if (!isTokenLoggedIn(tokenId)) {
    return giveError(isv2, 'token is not for a currently logged in session', 403);
  }

  if (!isValidQuizId(quizId)) {
    return giveError(isv2, 'quizId does not refer to valid quiz', 400);
  }

  if (!isValidCreator(quizId, tokenId)) {
    return giveError(isv2, 'quizId does not refer to a quiz that this user owns', 400);
  }

  if (description.length > 100) {
    return giveError(isv2, 'description must be less than 100 characters', 400);
  }

  const store: Data = getData();
  const quizIndex: number = store.quizzes.findIndex(id => id.quizId === quizId);
  const timeNow: number = Math.floor((new Date()).getTime() / 1000);
  store.quizzes[quizIndex].description = description;
  store.quizzes[quizIndex].timeLastEdited = timeNow;
  setData(store);

  return { };
}

/**
 * Transfer ownership of a quiz to a different user based on their email
 *
 * @param {string} token
 * @param {number} quizId
 * @param {string} userEmail
 * @returns {{ }} empty object
 */
export function adminQuizTransfer (token: string, quizId: number, userEmail: string, isv2: boolean): Record<string, never> | Error {
  if (isv2) {
    if (!isEndState(quizId)) {
      throw HTTPError(400, 'Quiz is not in END state');
    }
  }

  if (!isValidTokenStructure(token)) {
    return giveError(isv2, 'Invalid Token Structure', 401);
  }

  if (!isTokenLoggedIn(token)) {
    return giveError(isv2, 'Token not logged in', 403);
  }

  if (!isValidQuizId(quizId)) {
    return giveError(isv2, 'Invalid: QuizId', 400);
  }

  if (!isValidCreator(quizId, token)) {
    return giveError(isv2, 'Invalid: You do not own this quiz', 400);
  }

  // Check if email exist
  if (!isValidEmail(userEmail)) {
    return giveError(isv2, 'Invalid: Email does not exist', 400);
  }

  const data: Data = getData();
  const authUserId = findUserFromToken(token);

  const loggedInUser = data.users.find((current) => current.authUserId === authUserId);
  if (loggedInUser.email === userEmail) {
    return giveError(isv2, 'Invalid: Email is current users', 400);
  }

  // Find the correct quiz based on input
  const currentQuiz = data.quizzes.find((current) => current.quizId === quizId);
  // Find the user to transfer the quiz to
  const transferUser = data.users.find((current) => current.email === userEmail);
  // Flter all the quizzes that the user to transfer to owns
  const transferUserQuizzes = data.quizzes.filter((current) => current.creator === transferUser.authUserId);
  // Check if the user owns a quiz with the same name
  const sameName = transferUserQuizzes.find((current) => current.name === currentQuiz.name);
  if (sameName) {
    return giveError(isv2, 'Invalid: User already has a Quiz with the same name', 400);
  }

  const timeNow: number = Math.floor((new Date()).getTime() / 1000);
  currentQuiz.timeLastEdited = timeNow;

  currentQuiz.creator = transferUser.authUserId;

  setData(data);

  return { };
}

/**
 * Create a new stub question for a particular quiz.
 * When this route is called, and a question is created, the timeLastEdited for quiz is set as the time this question was created
 * and the colours of a question are randomly generated.
 *
 * @param {number} quizId
 * @param {string} token
 * @param {string} question
 * @param {number} duration
 * @param {number} points
 * @param {Answers[]} answers
 * @param {string} thumbnailUrl
 * @returns {questionId: number}
 */
export function createQuizQuestion(quizId: number, token: string, question: string, duration: number, points: number, answers: Answers[],thumbnailUrl: string, isv2: boolean): {questionId: number} | Error {
  // Error checking for token
  if (!isValidTokenStructure(token)) {
    return giveError(isv2, 'invalid token structure', 401);
  }
  if (!isTokenLoggedIn(token)) {
    return giveError(isv2, 'token is not logged in', 403);
  }

  // Error checking for quizId
  if (!isValidQuizId(quizId)) {
    return giveError(isv2, 'invalid quiz Id', 400);
  }

  if (!isValidCreator(quizId, token)) {
    return giveError(isv2, 'invalid quiz Id', 400);
  }

  // Error checking for quiz question inputs
  if (question.length < 5 || question.length > 50) {
    return giveError(isv2, 'invalid input: question must be 5-50 characters long', 400);
  }

  // Note: assume question cannot be only whitespace
  if (isWhiteSpace(question)) {
    return giveError(isv2, 'invalid input: question cannot be only whitespace', 400);
  }

  if (answers.length > 6 || answers.length < 2) {
    return giveError(isv2, 'invalid input: must have 2-6 answers', 400);
  }

  if (duration <= 0) {
    return giveError(isv2, 'invalid input: question duration must be a positive number', 400);
  }

  if (points < 1 || points > 10) {
    return giveError(isv2, 'invalid input: points must be between 1 and 10', 400);
  }

  if (answers.find(answer => (answer.answer.length > 30 || answer.answer.length < 1)) !== undefined) {
    return giveError(isv2, 'invalid input: answers must be 1-30 characters long', 400);
  }

  for (const current of answers) {
    if ((answers.filter(answer => answer.answer === current.answer)).length > 1) {
      return giveError(isv2, 'invalid input: cannot have duplicate answer strings', 400);
    }
  }

  if (answers.find(answer => answer.correct === true) === undefined) {
    return giveError(isv2, 'invalid input: must be at least one correct answer', 400);
  }

  const data = getData();
  const index = data.quizzes.findIndex(id => id.quizId === quizId);

  if (data.quizzes[index].duration + duration > 180) {
    return giveError(isv2, 'invalid input: question durations cannot exceed 3 minutes', 400);
  }

  // thumbnail error checking
  if (thumbnailUrl.length === 0) {
    return giveError(isv2, 'invalid input: url cannot be empty', 400);
  }

  if (thumbnailUrl.match(/\.(jpeg|jpg|png)$/) === null) {
    return giveError(isv2, 'invalid input: url must be a jpg or png file type', 400);
  }

  // Creating new quiz question
  data.quizzes[index].questionCount++;
  const questionId: number = data.quizzes[index].questionCount;
  const newFile = getImg(thumbnailUrl);
  const newUrl = `${config.url}:${config.port}/static/${newFile}`;

  const answerArray: Answer[] = [];
  const colours = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'brown'];
  let answerId = 0;

  for (const current of answers) {
    const colour = Math.floor(Math.random() * colours.length);
    answerId++;
    answerArray.push({
      answerId: answerId,
      answer: current.answer,
      colour: colours[colour],
      correct: current.correct
    });
    colours.splice(colour, 1);
  }

  data.quizzes[index].questions.push({
    questionId: questionId,
    question: question,
    duration: duration,
    points: points,
    answers: answerArray,
    thumbnailUrl: newUrl,
  });

  const timeNow: number = Math.floor(Date.now() / 1000);
  data.quizzes[index].timeLastEdited = timeNow;
  data.quizzes[index].duration += duration;
  data.quizzes[index].numQuestions++;

  setData(data);

  return {
    questionId: questionId
  };
}

/**
 * Create a new stub question for a particular quiz.
 * When this route is called, and a question is created, the timeLastEdited for quiz is set as the time this question was created
 * and the colours of a question are randomly generated.
 *
 * @param {number} quizId
 * @param {string} token
 * @param {string} question
 * @param {number} duration
 * @param {number} points
 * @param {Answers[]} answers
 * @returns {questionId: number}
 */
export function createQuizQuestionv1(quizId: number, token: string, question: string, duration: number, points: number, answers: Answers[], isv2: boolean): {questionId: number} | Error {
  // Error checking for token
  if (!isValidTokenStructure(token)) {
    return giveError(isv2, 'invalid token structure', 401);
  }
  if (!isTokenLoggedIn(token)) {
    return giveError(isv2, 'token is not logged in', 403);
  }

  // Error checking for quizId
  if (!isValidQuizId(quizId)) {
    return giveError(isv2, 'invalid quiz Id', 400);
  }

  if (!isValidCreator(quizId, token)) {
    return giveError(isv2, 'invalid quiz Id', 400);
  }

  // Error checking for quiz question inputs
  if (question.length < 5 || question.length > 50) {
    return giveError(isv2, 'invalid input: question must be 5-50 characters long', 400);
  }

  // Note: assume question cannot be only whitespace
  if (isWhiteSpace(question)) {
    return giveError(isv2, 'invalid input: question cannot be only whitespace', 400);
  }

  if (answers.length > 6 || answers.length < 2) {
    return giveError(isv2, 'invalid input: must have 2-6 answers', 400);
  }

  if (duration <= 0) {
    return giveError(isv2, 'invalid input: question duration must be a positive number', 400);
  }

  if (points < 1 || points > 10) {
    return giveError(isv2, 'invalid input: points must be between 1 and 10', 400);
  }

  if (answers.find(answer => (answer.answer.length > 30 || answer.answer.length < 1)) !== undefined) {
    return giveError(isv2, 'invalid input: answers must be 1-30 characters long', 400);
  }

  for (const current of answers) {
    if ((answers.filter(answer => answer.answer === current.answer)).length > 1) {
      return giveError(isv2, 'invalid input: cannot have duplicate answer strings', 400);
    }
  }

  if (answers.find(answer => answer.correct === true) === undefined) {
    return giveError(isv2, 'invalid input: must be at least one correct answer', 400);
  }

  const data = getData();
  const index = data.quizzes.findIndex(id => id.quizId === quizId);

  if (data.quizzes[index].duration + duration > 180) {
    return giveError(isv2, 'invalid input: question durations cannot exceed 3 minutes', 400);
  }

  // Creating new quiz question
  data.quizzes[index].questionCount++;
  const questionId: number = data.quizzes[index].questionCount;

  const answerArray: Answer[] = [];
  const colours = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'brown'];
  let answerId = 0;

  for (const current of answers) {
    const colour = Math.floor(Math.random() * colours.length);
    answerId++;
    answerArray.push({
      answerId: answerId,
      answer: current.answer,
      colour: colours[colour],
      correct: current.correct
    });
    colours.splice(colour, 1);
  }

  data.quizzes[index].questions.push({
    questionId: questionId,
    question: question,
    duration: duration,
    points: points,
    answers: answerArray
  });

  const timeNow: number = Math.floor(Date.now() / 1000);
  data.quizzes[index].timeLastEdited = timeNow;
  data.quizzes[index].duration += duration;
  data.quizzes[index].numQuestions++;

  setData(data);

  return {
    questionId: questionId
  };
}

/**
 * Create a new stub question for a particular quiz.
 * When this route is called, and a question is created, the timeLastEdited for quiz is set as the time this question was created
 * and the colours of a question are randomly generated.
 *
 * @param {number} quizId
 * @param {string} token
 * @param {string} question
 * @param {number} duration
 * @param {number} points
 * @param {Answers[]} answers
 * @param {string} thumbnailUrl
 * @returns {questionId: number}
 */
export function updateQuizQuestionv1(quizId: number, questionId: number, token: string, question: string, duration: number, points: number, answers: Answers[], isv2: boolean): Record<string, never> | Error {
  // Error checking for token
  if (!isValidTokenStructure(token)) {
    return giveError(isv2, 'invalid token structure', 401);
  }
  if (!isTokenLoggedIn(token)) {
    return giveError(isv2, 'token is not logged in', 403);
  }

  // Error checking for quizId and questionId
  if (!isValidQuizId(quizId)) {
    return giveError(isv2, 'invalid param: quiz Id', 400);
  }
  if (!isValidCreator(quizId, token)) {
    return giveError(isv2, 'invalid param: quiz Id', 400);
  }
  if (!isValidQuestionId(quizId, questionId)) {
    return giveError(isv2, 'invalid param: questionId', 400);
  }

  // Error checking for quiz question inputs
  if (question.length < 5 || question.length > 50) {
    return giveError(isv2, 'invalid input: question must be 5-50 characters long', 400);
  }

  // Note: assume question cannot be only whitespace
  if (isWhiteSpace(question)) {
    return giveError(isv2, 'invalid input: question cannot be only whitespace', 400);
  }

  if (answers.length > 6 || answers.length < 2) {
    return giveError(isv2, 'invalid input: must have 2-6 answers', 400);
  }

  if (duration <= 0) {
    return giveError(isv2, 'invalid input: question duration must be a positive number', 400);
  }

  if (points < 1 || points > 10) {
    return giveError(isv2, 'invalid input: points must be between 1 and 10', 400);
  }

  if (answers.find(answer => (answer.answer.length > 30 || answer.answer.length < 1)) !== undefined) {
    return giveError(isv2, 'invalid input: answers must be 1-30 characters long', 400);
  }

  for (const current of answers) {
    if ((answers.filter(answer => answer.answer === current.answer)).length > 1) {
      return giveError(isv2, 'invalid input: cannot have duplicate answer strings', 400);
    }
  }

  if (answers.find(answer => answer.correct === true) === undefined) {
    return giveError(isv2, 'invalid input: must be at least one correct answer', 400);
  }
  
  const data = getData();
  const currentQuiz = data.quizzes.find(id => id.quizId === quizId);
  const qIndex = currentQuiz.questions.findIndex(id => id.questionId === questionId);
  const newDuration = currentQuiz.duration + duration - currentQuiz.questions[qIndex].duration;

  if (newDuration > 180) {
    return giveError(isv2, 'invalid input: question durations cannot exceed 3 minutes', 400);
  }

  // Updating quiz question
  const answerArray: Answer[] = [];
  const colours = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];
  let answerId = 0;

  for (const current of answers) {
    const colour = Math.floor(Math.random() * colours.length);
    answerId++;
    answerArray.push({
      answerId: answerId,
      answer: current.answer,
      colour: colours[colour],
      correct: current.correct
    });
    colours.splice(colour, 1);
  }

  currentQuiz.questions[qIndex] = {
    questionId: questionId,
    question: question,
    duration: duration,
    points: points,
    answers: answerArray,
  };

  const timeNow: number = Math.floor(Date.now() / 1000);
  currentQuiz.timeLastEdited = timeNow;
  currentQuiz.duration = newDuration;
  setData(data);

  return {};
}

export function updateQuizQuestion(quizId: number, questionId: number, token: string, question: string, duration: number, points: number, answers: Answers[], thumbnailUrl: string, isv2: boolean): Record<string, never> | Error {
  // Error checking for token
  if (!isValidTokenStructure(token)) {
    return giveError(isv2, 'invalid token structure', 401);
  }
  if (!isTokenLoggedIn(token)) {
    return giveError(isv2, 'token is not logged in', 403);
  }

  // Error checking for quizId and questionId
  if (!isValidQuizId(quizId)) {
    return giveError(isv2, 'invalid param: quiz Id', 400);
  }
  if (!isValidCreator(quizId, token)) {
    return giveError(isv2, 'invalid param: quiz Id', 400);
  }
  if (!isValidQuestionId(quizId, questionId)) {
    return giveError(isv2, 'invalid param: questionId', 400);
  }

  // Error checking for quiz question inputs
  if (question.length < 5 || question.length > 50) {
    return giveError(isv2, 'invalid input: question must be 5-50 characters long', 400);
  }

  // Note: assume question cannot be only whitespace
  if (isWhiteSpace(question)) {
    return giveError(isv2, 'invalid input: question cannot be only whitespace', 400);
  }

  if (answers.length > 6 || answers.length < 2) {
    return giveError(isv2, 'invalid input: must have 2-6 answers', 400);
  }

  if (duration <= 0) {
    return giveError(isv2, 'invalid input: question duration must be a positive number', 400);
  }

  if (points < 1 || points > 10) {
    return giveError(isv2, 'invalid input: points must be between 1 and 10', 400);
  }

  if (answers.find(answer => (answer.answer.length > 30 || answer.answer.length < 1)) !== undefined) {
    return giveError(isv2, 'invalid input: answers must be 1-30 characters long', 400);
  }

  for (const current of answers) {
    if ((answers.filter(answer => answer.answer === current.answer)).length > 1) {
      return giveError(isv2, 'invalid input: cannot have duplicate answer strings', 400);
    }
  }

  if (answers.find(answer => answer.correct === true) === undefined) {
    return giveError(isv2, 'invalid input: must be at least one correct answer', 400);
  }

  // thumbnail error checking
  if (thumbnailUrl.length === 0) {
    return giveError(isv2, 'invalid input: url cannot be empty', 400);
  }

  if (thumbnailUrl.match(/\.(jpeg|jpg|png)$/) === null) {
    return giveError(isv2, 'invalid input: url must be a jpg or png file type', 400);
  }

  

  const data = getData();
  const currentQuiz = data.quizzes.find(id => id.quizId === quizId);
  const qIndex = currentQuiz.questions.findIndex(id => id.questionId === questionId);
  const newDuration = currentQuiz.duration + duration - currentQuiz.questions[qIndex].duration;
  const newFile = getImg(thumbnailUrl);
  const newUrl = `${config.url}:${config.port}/static/${newFile}`;

  if (newDuration > 180) {
    return giveError(isv2, 'invalid input: question durations cannot exceed 3 minutes', 400);
  }

  // Updating quiz question
  const answerArray: Answer[] = [];
  const colours = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];
  let answerId = 0;

  for (const current of answers) {
    const colour = Math.floor(Math.random() * colours.length);
    answerId++;
    answerArray.push({
      answerId: answerId,
      answer: current.answer,
      colour: colours[colour],
      correct: current.correct
    });
    colours.splice(colour, 1);
  }

  currentQuiz.questions[qIndex] = {
    questionId: questionId,
    question: question,
    duration: duration,
    points: points,
    answers: answerArray,
    thumbnailUrl: newUrl,
  };

  const timeNow: number = Math.floor(Date.now() / 1000);
  currentQuiz.timeLastEdited = timeNow;
  currentQuiz.duration = newDuration;
  setData(data);

  return {};
}

/**
 * Duplicate a question for a quiz.
 * the timeLastEdited for quiz is set as the time this question was created
 *
 * @param {number} quizId
 * @param {number} questionId
 * @param {string} token
 * @returns {newQuestionId: number}
 */
export function quizQuestionDuplicate (quizId: number, questionId: number, token: string, isv2: boolean): { newQuestionId: number } | Error {
  if (!isValidTokenStructure(token)) {
    return giveError(isv2, 'invalid token structure', 401);
  }

  if (!isTokenLoggedIn(token)) {
    return giveError(isv2, 'token is not logged in', 403);
  }

  // Error checking for quizId
  if (!isValidQuizId(quizId)) {
    return giveError(isv2, 'invalid quiz Id', 400);
  }

  if (!isValidCreator(quizId, token)) {
    return giveError(isv2, 'invalid quiz Id', 400);
  }

  if (!isValidQuestionId(quizId, questionId)) {
    return giveError(isv2, 'invalid question id', 400);
  }

  const data: Data = getData();
  const quizIndex: number = data.quizzes.findIndex(id => id.quizId === quizId);
  data.quizzes[quizIndex].questionCount++;
  const newQuestionId: number = data.quizzes[quizIndex].questionCount;
  const questionIndex: number = data.quizzes[quizIndex].questions.findIndex(id => id.questionId === questionId);
  const timeNow: number = Math.floor(Date.now() / 1000);
  data.quizzes[quizIndex].numQuestions++;
  data.quizzes[quizIndex].duration += data.quizzes[quizIndex].questions[questionIndex].duration;
  data.quizzes[quizIndex].timeLastEdited = timeNow;

  if (isv2) {
    const newQuestion: Question = {
      questionId: newQuestionId,
      question: data.quizzes[quizIndex].questions[questionIndex].question,
      duration: data.quizzes[quizIndex].questions[questionIndex].duration,
      points: data.quizzes[quizIndex].questions[questionIndex].points,
      answers: data.quizzes[quizIndex].questions[questionIndex].answers,
      thumbnailUrl: data.quizzes[quizIndex].questions[questionIndex].thumbnailUrl,
    }
  } else {
    const newQuestion: Question = {
      questionId: newQuestionId,
      question: data.quizzes[quizIndex].questions[questionIndex].question,
      duration: data.quizzes[quizIndex].questions[questionIndex].duration,
      points: data.quizzes[quizIndex].questions[questionIndex].points,
      answers: data.quizzes[quizIndex].questions[questionIndex].answers,
    };
  }

  data.quizzes[quizIndex].questions.splice(questionIndex + 1, 0, newQuestion);
  setData(data);

  return ({ newQuestionId: newQuestionId });
}

/**
 * Delete a particular question from a quiz
 *
 * @param {string} token
 * @param {number} quizId
 * @param {number} questionId
 * @returns {questionId: number}
 */
export function deleteQuizQuestion (token: string, quizId: number, questionId: number, isv2: boolean): Record<string, never> | Error {
  if (isv2) {
    if (!isEndState(quizId)) {
      throw HTTPError(400, 'Quiz is not in END state');
    }
  }

  if (!isValidTokenStructure(token)) {
    return giveError(isv2, 'invalid token structure', 401);
  }

  if (!isTokenLoggedIn(token)) {
    return giveError(isv2, 'token is not logged in', 403);
  }

  if (!isValidQuizId(quizId)) {
    return giveError(isv2, 'invalid quiz Id', 400);
  }

  if (!isValidCreator(quizId, token)) {
    return giveError(isv2, 'invalid quiz Id', 400);
  }

  if (!isValidQuestionId(quizId, questionId)) {
    return giveError(isv2, 'invalid param: questionId', 400);
  }

  const data: Data = getData();

  const quizToDelete = data.quizzes.find((quiz) => quiz.quizId === quizId);
  const questionToDelete = quizToDelete.questions.find((question) => question.questionId === questionId);
  const questionToDeleteIndex = quizToDelete.questions.findIndex((question) => question.questionId === questionId);

  const timeNow: number = Math.floor((new Date()).getTime() / 1000);
  quizToDelete.timeLastEdited = timeNow;

  quizToDelete.questions.splice(questionToDeleteIndex, 1);

  quizToDelete.numQuestions--;
  quizToDelete.duration = quizToDelete.duration - questionToDelete.duration;

  setData(data);

  return {};
}

/**
 * Move a question from one particular position in the quiz to another
 *
 * @param {string} token
 * @param {number} quizId
 * @param {number} questionId
 * @param {number} newPosition
 * @returns {}
 */
export function moveQuizQuestion(token: string, quizId: number, questionId: number, newPosition: number, isv2: boolean): Record<string, never> | Error {
  // Error checking for token
  if (!isValidTokenStructure(token)) {
    return giveError(isv2, 'invalid token structure', 401);
  }
  if (!isTokenLoggedIn(token)) {
    return giveError(isv2, 'token is not logged in', 403);
  }

  // Error checking for quizId and questionId
  if (!isValidQuizId(quizId)) {
    return giveError(isv2, 'invalid param: quiz Id', 400);
  }
  if (!isValidCreator(quizId, token)) {
    return giveError(isv2, 'invalid param: quiz Id', 400);
  }
  if (!isValidQuestionId(quizId, questionId)) {
    return giveError(isv2, 'invalid param: questionId', 400);
  }

  // Error checking for New Position
  if (newPosition < 0) {
    return giveError(isv2, 'invalid input: newPosition has to be greater then 0', 400);
  }

  const data = getData();
  const currentQuiz = data.quizzes.find(id => id.quizId === quizId);

  if (newPosition > (currentQuiz.numQuestions - 1)) {
    return giveError(isv2, 'invalid input:  newPosition must be less than the number of questions', 400);
  }

  const questionIndex = currentQuiz.questions.findIndex(id => id.questionId === questionId);
  if (newPosition === questionIndex) {
    return giveError(isv2, 'invalid input: newPosition is current position', 400);
  }

  // Remove question from current position
  const questionToMove = currentQuiz.questions.splice(questionIndex, 1)[0];
  // Add question to new position
  currentQuiz.questions.splice(newPosition, 0, questionToMove);

  const timeNow: number = Math.floor((new Date()).getTime() / 1000);
  currentQuiz.timeLastEdited = timeNow;

  setData(data);

  return {};
}

/**
 * Update quiz thumbnail
 *
 * @param {number} quizId
 * @param {string} token
 * @param {string} imgUrl
 * @returns {} empty object
*/
export function updateQuizThumbnail(quizId: number, token: string, imgUrl: string): Record<string, never> {
  console.log(imgUrl);
  // error checking
  if (!isValidTokenStructure(token)) {
    throw HTTPError(401, 'Token is not a valid structure');
  }
  if (!isTokenLoggedIn(token)) {
    throw HTTPError(403, 'Token is not logged in');
  }
  if (!isValidQuizId(quizId) || !isValidCreator(quizId, token)) {
    throw HTTPError(400, 'Invalid QuizId');
  }

  if (imgUrl.match(/\.(jpeg|jpg|png)$/) === null) {
    throw HTTPError(400, 'imgUrl must be a jpg or png image');
  }

  const newUrl = getImg(imgUrl);

  const data = getData();
  const quizIndex = data.quizzes.findIndex(id => id.quizId === quizId);
  data.quizzes[quizIndex].thumbnailUrl = `${config.url}:${config.port}/static/${newUrl}`;

  setData(data);

  return {};
}
