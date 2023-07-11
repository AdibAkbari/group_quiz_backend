import { getData, setData, Data, Error, Answer } from './dataStore';
import {
  checkNameValidity,
  isValidCreator,
  isValidQuizId,
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

interface QuizInfoQuestions {
  questionId: number,
  question: string,
  duration: number,
  points: number,
  answers: {answerId: number, answer: string, colour: string, correct: boolean}[],
}

interface QuizInfo {
  quizId: number,
  name: string,
  timeCreated: number,
  timeLastEdited: number,
  description: string,
  numQuestions: number,
  questions: QuizInfoQuestions[],
  duration: number
}

interface Answers {
  answer: string,
  correct: boolean
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
      questionCount: 0
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

  if (!isValidCreator(quizId, token)) {
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
export function adminQuizInfo(token: string, quizId: number): Error | QuizInfo {
  // Error checking for token
  if (!isValidTokenStructure(token)) {
    return { error: 'invalid token structure' };
  }
  if (!isTokenLoggedIn(token)) {
    return { error: 'token is not logged in' };
  }

  // Error checking for quizId
  if (!isValidQuizId(quizId)) {
    return { error: 'invalid quizId' };
  }
  if (!isValidCreator(quizId, token)) {
    return { error: 'invalid quizId' };
  }

  const data: Data = getData();
  const quiz = data.quizzes.find(id => id.quizId === quizId);

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
  // if (isValidUserId(authUserId) === false) {
  //   return { error: 'Please enter a valid user' };
  // }
  // Check inputted quizId is valid
  if (isValidQuizId(quizId) === false) {
    return { error: 'Please enter a valid quiz' };
  }
  // Check inputted Quiz ID does not refer to a quiz that this user owns
  if (isValidCreator(quizId, '123') === false) {
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
  // if (!isValidUserId(authUserID)) {
  //   return { error: 'authUserId does not refer to valid user' };
  // }

  if (!isValidQuizId(quizId)) {
    return { error: 'quizId does not refer to valid quiz' };
  }

  if (!isValidCreator(quizId, '123')) {
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
export function createQuizQuestion(quizId: number, token: string, question: string, duration: number, points: number, answers: Answers[]): {questionId: number} | Error {
  // Error checking for token
  if (!isValidTokenStructure(token)) {
    return { error: 'invalid token structure' };
  }
  if (!isTokenLoggedIn(token)) {
    return { error: 'token is not logged in' };
  }

  // Error checking for quizId
  if (!isValidQuizId(quizId)) {
    return { error: 'invalid quiz Id' };
  }
  if (!isValidCreator(quizId, token)) {
    return { error: 'invalid quiz Id' };
  }

  // Error checking for quiz question inputs
  if (question.length < 5 || question.length > 50) {
    return { error: 'invalid input: question must be 5-50 characters long' };
  }

  // Note: assume question cannot be only whitespace
  if (isWhiteSpace(question)) {
    return { error: 'invalid input: question cannot be only whitespace' };
  }

  if (answers.length > 6 || answers.length < 2) {
    return { error: 'invalid input: must have 2-6 answers' };
  }

  if (duration <= 0) {
    return { error: 'invalid input: question duration must be a positive number' };
  }

  if (points < 1 || points > 10) {
    return { error: 'invalid input: points must be between 1 and 10' };
  }

  if (answers.find(answer => (answer.answer.length > 30 || answer.answer.length < 1)) !== undefined) {
    return { error: 'invalid input: answers must be 1-30 characters long' };
  }

  for (const current of answers) {
    if ((answers.filter(answer => answer.answer === current.answer)).length > 1) {
      return { error: 'invalid input: cannot have duplicate answer strings' };
    }
  }

  if (answers.find(answer => answer.correct === true) === undefined) {
    return { error: 'invalid input: must be at least one correct answer' };
  }

  const data = getData();
  const index = data.quizzes.findIndex(id => id.quizId === quizId);

  if (data.quizzes[index].duration + duration > 180) {
    return { error: 'invalid input: question durations cannot exceed 3 minutes' };
  }

  // Creating new quiz question
  data.quizzes[index].questionCount++;
  const questionId: number = data.quizzes[index].questionCount;

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
