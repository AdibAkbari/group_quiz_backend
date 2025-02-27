import { getData } from './dataStore';
import { Data, Players, QuestionResult, Quizzes, Session, SessionResults } from './interfaces';
import HTTPError from 'http-errors';
import request from 'sync-request';
import fs from 'fs';

const BAD_REQUEST = 400;

const minQuizNameLength = 3;
const maxQuizNameLength = 30;

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

/**
 * Helper function to determine if session Id is a valid session
 *
 * @param {number} quizId
 * @param {number} sessionId
 * @returns {boolean} - returns true if sessionId is a valid session within this quiz, false otherwise
 */
export function isValidSessionId(sessionId: number, quizId: number): boolean {
  const data = getData();
  const session = data.sessions.find(id => id.sessionId === sessionId);
  if (session === undefined) {
    return false;
  }
  if (session.metadata.quizId !== quizId) {
    return false;
  }
  return true;
}

export function isValidQuestionPosition(playerId: number, questionPosition: number): boolean {
  const data = getData();
  const player = data.players.find(id => id.playerId === playerId);
  const session = data.sessions.find(id => id.sessionId === player.sessionId);

  if (questionPosition > session.metadata.numQuestions) {
    return false;
  }
  if (questionPosition <= 0) {
    return false;
  }
  if (questionPosition !== session.atQuestion) {
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
  if (name.length < minQuizNameLength || name.length > maxQuizNameLength) {
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

/**
 * Helper function to give error based on if it is a v1 or v2 route
 *
 * @param {boolean} isv2
 * @param {string } errorMessage
 * @param {number} statusCode
 * @returns {{error: string}}
 */
export function giveError(isv2: boolean, errorMessage: string, statusCode: number) {
  if (isv2) {
    throw HTTPError(statusCode, errorMessage);
  }
  return { error: errorMessage };
}

/**
   * Helper function to download and save an image
   *
   * @param {string} imgUrl
   * @returns {string} thumbnailUrl
   */
export function getImg(imgUrl: string) {
  const res = request(
    'GET',
    imgUrl
  );
  if (res.statusCode !== 200) {
    throw HTTPError(BAD_REQUEST, 'imgUrl does not return a valid file');
  }
  const body = res.getBody();
  const timeNow: number = Math.floor((new Date()).getTime() / 1000);
  const thumbnail: string = (Math.floor(Math.random() * timeNow)).toString();
  let fileType: string;
  if (imgUrl.match(/\.(jpeg|jpg)$/) !== null) {
    fileType = 'jpg';
  }
  if (imgUrl.match(/\.(png)$/) !== null) {
    fileType = 'png';
  }

  fs.writeFileSync(`./static/${thumbnail}.${fileType}`, body, { flag: 'w' });
  return `${thumbnail}.${fileType}`;
}

/**
 * Helper function to generate a random string
 *
 * @param {} - no params
 * @returns {string} - playerName
 */
export function randomString(string: string) {
  const array = string.split('');
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array.join('');
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

/**
   * Helper function to determine if All sessions for this quiz are in END state
   *
   * @param {number} quizId
   * @returns {boolean} - returns true if does exist
   * @returns {boolean} - returns false if it dosn't exist
   */
export function isEndState(quizId: number): boolean {
  const data: Data = getData();
  const session = data.sessions.find(session => session.metadata.quizId === quizId);

  if (session === undefined) {
    return true;
  }
  if (session.sessionState === 'END') {
    return true;
  }
  return false;
}

/**
 * Returns the results object for the specified question in the given session
 *
 * @param {number} position
 * @param {Session} session
 * @param {Players[]} playerList
 * @returns {QuestionResult} - Object with results from specific question
 */
export function questionResult(index: number, session: Session, playerList: Players[]): QuestionResult {
  // Reset arrays and counters for each question
  let totalAnswerTime = 0;
  let numPlayers = 0;
  let numCorrectPlayers = 0;
  const question = session.metadata.questions[index];

  const questionCorrectBreakdown = [];
  // set to keep track of which players have been added to counts already
  const addedPlayers = new Set();

  for (const answer of question.answers) {
    const playersCorrect = [];

    for (const player of playerList) {
      const questionResponse = player.questionResponse.find(
        (questionResponse) => questionResponse.questionId === question.questionId
      );

      if (questionResponse !== undefined) {
        if (answer.correct && questionResponse.playerAnswers.includes(answer.answerId)) {
          playersCorrect.push(player.name);
        }
        if (!addedPlayers.has(player.name)) {
          totalAnswerTime += questionResponse.answerTime;
          numPlayers++;
          addedPlayers.add(player.name);

          if (questionResponse.points !== 0) {
            numCorrectPlayers++;
          }
        }
      } else if (!addedPlayers.has(player.name)) {
        numPlayers++;
        addedPlayers.add(player.name);
      }
    }
    playersCorrect.sort((a, b) => a.localeCompare(b));
    // pushes to list for each correct answer after adding all correct players to playerCorrect
    if (answer.correct) {
      questionCorrectBreakdown.push({
        answerId: answer.answerId,
        playersCorrect: playersCorrect
      });
    }
  }
  const averageAnswerTime = numPlayers === 0 ? 0 : Math.round(totalAnswerTime / numPlayers);
  const percentCorrect = numPlayers === 0 ? 0 : Math.round((100 * numCorrectPlayers) / numPlayers);

  return {
    questionId: question.questionId,
    questionCorrectBreakdown: questionCorrectBreakdown,
    averageAnswerTime: averageAnswerTime,
    percentCorrect: percentCorrect
  };
}
/**
 * Returns full results from a completed quiz session
 *
 * @param session
 * @returns {SessionResults} - object containing results of quiz session
 */
export function getSessionResults(session: Session): SessionResults {
  const data = getData();
  const playerList = data.players.filter(player => session.players.includes(player.name));

  const mappedPlayers = playerList.map(({ name, score }) => ({ name, score }));
  const rankedPlayers = mappedPlayers.sort((player1, player2) => {
    return player2.score - player1.score;
  });

  const questionResults = session.metadata.questions.map(
    (_, index) => questionResult(index, session, playerList)
  );

  return {
    usersRankedByScore: rankedPlayers,
    questionResults: questionResults
  };
}
