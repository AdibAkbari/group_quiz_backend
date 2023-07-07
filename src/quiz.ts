import { getData, setData, Data, Error, Question, Answer } from './dataStore';
import { checkNameValidity, 
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

interface Answers {
  answer: string,
  correct: boolean
}

/**
 * Provide a list of all quizzes that are owned by the currently logged in user.
 *
 * @param {number} authUserId
 * @returns {{quizzes: Array<{
 *                  quizId: number,
 *                  name: string
 *              }>
 *          }}
 */
export function adminQuizList (authUserId: number): {quizzes: QuizList[]} | Error {
  const data: Data = getData();

  if (!isValidUserId(authUserId)) {
    return {
      error: 'AuthUserId is not a valid user'
    };
  }

  const quizzes: QuizList[] = [];

  for (const quiz of data.quizzes) {
    if (quiz.creator === authUserId) {
      const quizId: number = quiz.quizId;
      const name: string = quiz.name;
      quizzes.push({ quizId, name });
    }
  }

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
 * @param {number} authUserId
 * @param {number} quizId
 * @returns {{ }} empty object
 */
export function adminQuizRemove(authUserId: number, quizId: number): Record<string, never> | Error {
  if (isValidUserId(authUserId) === false) {
    return { error: 'AuthUserId is not a valid user' };
  }

  if (isValidQuizId(quizId) === false) {
    return { error: 'Quiz ID does not refer to valid quiz' };
  }

  if (isValidCreator(quizId, authUserId) === false) {
    return { error: 'Quiz ID does not refer to a quiz that this user owns' };
  }

  const data: Data = getData();
  for (const i in data.quizzes) {
    if (data.quizzes[i].quizId === quizId) {
      data.quizzes.splice(parseInt(i), 1);
      setData(data);
    }
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


// NEW FUNCTIONS
export function createQuizQuestion(quizId: number, token: string, question: string, duration: number, points: number, answers: Answers[]): {questionId: number} | Error {

  // Error checking for token
  if(!isValidTokenStructure(token)) {
    return {error: 'invalid token structure'};
  }
  if(!isTokenLoggedIn(token)) {
    return {error: 'token is not logged in'};
  }

  // Error checking for quizId
  if(!isValidQuizId(quizId)) {
    return {error: 'invalid quiz Id'};
  }
  if(!isValidCreator) {
    return {error: 'invalid quiz Id'};
  }

  // Error checking for quiz question inputs
  if(question.length < 5 || question.length > 50) {
    return {error: 'invalid input: question must be 5-50 characters long'}
  }

  if(answers.length > 6 || answers.length < 2) {
    return {error: 'invalid input: must have 2-6 answers'};
  }

  if(duration <= 0) {
    return {error: 'invalid input: question duration must be a positive number'};
  }

  if(points < 1 || points > 10) {
    return {error: 'invalid input: points must be between 1 and 10'};
  }

  if(answers.find(answer => (answer.answer.length > 30 || answer.answer.length < 1)) !== undefined) {
    return {error: 'invalid input: answers must be 1-30 characters long'};
  }

  for(const current of answers) {
    if((answers.filter(answer => answer.answer === current.answer)).length > 1) {
      return {error: 'invalid input: cannot have duplicate answer strings'};
    }
  }

  if(answers.find(answer => answer.correct === true) === undefined) {
    return {error: 'invalid input: must be at least one correct answer'};
  }

  let data = getData();
  const index = data.quizzes.findIndex(id => id.quizId === quizId);

  if(data.quizzes[index].duration + duration > 180) {
    return {error: 'invalid input: question durations cannot exceed 3 minutes'};
  }

  // Creating new quiz question


  // export interface Question {
  //   questionId: number;
  //   question: string;
  //   duration: number;
  //   thumbnailUrl: string;
  //   points: number;
  //   answers: Answer[];
  // }
  
  // export interface Answer {
  //   answerId: number;
  //   answer: string;
  //   colour: string;
  //   correct: boolean;
  // }

  
  
  



  return {error: 'nothing written'}
}