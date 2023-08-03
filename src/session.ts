import { getData, setData } from './dataStore';
import { isValidTokenStructure, isTokenLoggedIn, isValidQuizId, isValidCreator, getSessionResults, isValidSessionId } from './helper';
import { Session, SessionStatus, SessionResults, Timers, Data } from './interfaces';
import HTTPError from 'http-errors';
import fs from 'fs';
import config from './config.json'

const COUNTDOWN = 100;
const timers:Timers[] = [];

/**
 *This copies the quiz, so that any edits whilst a session is running does not affect active session
 *
 * @param {number} quizId
 * @param {string} token
 * @param {number} autoStartNum
 * @returns {sessionId: number}
 */
export function startSession(quizId: number, token: string, autoStartNum: number): { sessionId: number} {
  if (!isValidTokenStructure(token)) {
    throw HTTPError(401, 'Token is not a valid structure');
  }
  if (!isTokenLoggedIn(token)) {
    throw HTTPError(403, 'Token is not logged in');
  }
  if (!isValidQuizId(quizId) || !isValidCreator(quizId, token)) {
    throw HTTPError(400, 'Invalid QuizId');
  }
  if (autoStartNum > 50 || autoStartNum < 0) {
    throw HTTPError(400, 'Invalid autostart number');
  }
  const data = getData();
  if (data.sessions.filter(state => state.sessionState !== 'END').length >= 10) {
    throw HTTPError(400, 'Too many sessions currently running');
  }

  const quiz = data.quizzes.find(id => id.quizId === quizId);
  if (quiz.numQuestions === 0) {
    throw HTTPError(400, 'No questions in quiz');
  }
  const sessionId = data.sessions.length + 1;

  const session: Session = {
    sessionId: sessionId,
    sessionState: 'LOBBY',
    autoStartNum: autoStartNum,
    atQuestion: 0,
    players: [],
    metadata: quiz,
  };

  data.sessions.push(session);
  setData(data);

  return { sessionId: sessionId };
}

export function updateSessionState(quizId: number, sessionId: number, token: string, action: string): Record<string, never> {
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
  if (!isValidSessionId(sessionId, quizId)) {
    throw HTTPError(400, 'Invalid Session Id');
  }

  const actions = ['NEXT_QUESTION', 'GO_TO_ANSWER', 'GO_TO_FINAL_RESULTS', 'END'];
  if (actions.find(actions => actions === action) === undefined) {
    throw HTTPError(400, 'Invalid action');
  }

  const data = getData();
  const session = data.sessions.find(id => id.sessionId === sessionId);

  // action: next_question
  if (action === 'NEXT_QUESTION') {
    if (session.sessionState !== 'LOBBY' && session.sessionState !== 'QUESTION_CLOSE' && session.sessionState !== 'ANSWER_SHOW') {
      throw HTTPError(400, 'Action enum cannot be applied in current state');
    }
    if (session.atQuestion === session.metadata.numQuestions) {
      throw HTTPError(400, 'No more questions');
    }

    session.sessionState = 'QUESTION_COUNTDOWN';
    session.atQuestion++;

    const timer = timers.find(id => id.sessionId === sessionId);
    const timerId = setTimeout(questionOpen, COUNTDOWN, sessionId);
    if (timer !== undefined) {
      timer.timer = timerId;
    } else {
      timers.push({
        sessionId: sessionId,
        timer: timerId
      });
    }
  }

  // action: go_to_answer
  if (action === 'GO_TO_ANSWER') {
    if (session.sessionState !== 'QUESTION_OPEN' && session.sessionState !== 'QUESTION_CLOSE') {
      throw HTTPError(400, 'Action enum cannot be applied in current state');
    }
    if (session.sessionState === 'QUESTION_OPEN') {
      const timer = timers.find(id => id.sessionId === sessionId);
      clearTimeout(timer.timer);
    }
    session.sessionState = 'ANSWER_SHOW';
    calculateQuestionPoints(sessionId, data);
  }

  // action: go_to_final_results
  if (action === 'GO_TO_FINAL_RESULTS') {
    if (session.sessionState !== 'QUESTION_CLOSE' && session.sessionState !== 'ANSWER_SHOW') {
      throw HTTPError(400, 'Action enum cannot be applied in current state');
    }
    if (session.sessionState === 'QUESTION_CLOSE') {
      calculateQuestionPoints(sessionId, data);
    }

    session.atQuestion = 0;
    session.sessionState = 'FINAL_RESULTS';
  }

  // action: end
  if (action === 'END') {
    if (session.sessionState === 'END') {
      throw HTTPError(400, 'Action enum cannot be applied in current state');
    }
    if (session.sessionState === 'QUESTION_OPEN' || session.sessionState === 'QUESTION_COUNTDOWN') {
      const timer = timers.find(id => id.sessionId === sessionId);
      clearTimeout(timer.timer);
    }
    session.atQuestion = 0;
    session.sessionState = 'END';
  }

  setData(data);

  return {};
}

function questionOpen(sessionId: number) {
  const data = getData();
  const session = data.sessions.find(id => id.sessionId === sessionId);
  session.sessionState = 'QUESTION_OPEN';
  session.currentQuestionStartTime = Math.floor(Date.now() / 1000);
  const duration = session.metadata.questions[session.atQuestion - 1].duration;

  const timerId = setTimeout(questionClose, duration * 1000, sessionId);
  const timer = timers.find(id => id.sessionId === sessionId);
  timer.timer = timerId;
  setData(data);
}

function questionClose(sessionId: number) {
  const data = getData();
  const session = data.sessions.find(id => id.sessionId === sessionId);
  session.sessionState = 'QUESTION_CLOSE';
  setData(data);
}

function calculateQuestionPoints(sessionId: number, data: Data) {
  const session = data.sessions.find((id: any) => id.sessionId === sessionId);

  const question = session.metadata.questions[session.atQuestion - 1];
  const questionId = question.questionId;
  const correctAnswers = question.answers.filter((answer: any) => answer.correct === true);

  const sessionPlayers = data.players.filter((session: any) => session.sessionId === sessionId);

  const filteredPlayers = [];
  for (const player of sessionPlayers) {
    const currentAnswer = player.questionResponse.find((id: any) => id.questionId === questionId);
    if (currentAnswer && currentAnswer.playerAnswers.length > 0) {
      if (arraysContainSameElements(currentAnswer.playerAnswers, correctAnswers.map((answer: any) => answer.answerId))) {
        filteredPlayers.push(player);
      }
    }
  }

  filteredPlayers.sort(function(a, b) {
    const timeA = a.questionResponse.find((id: any) => id.questionId === questionId).answerTime;
    const timeB = b.questionResponse.find((id: any) => id.questionId === questionId).answerTime;
    return timeA - timeB;
  });

  const points = question.points;
  let counter = 1;
  for (const player of filteredPlayers) {
    const playerInfo = data.players.find((id: any) => id.playerId === player.playerId);
    const point = points * 1 / counter;
    playerInfo.score += point;
    playerInfo.questionResponse.find((id: any) => id.questionId === questionId).points = point;
    counter++;
  }
  setData(data);
}

function arraysContainSameElements(arr1: number[], arr2: number[]): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }

  const set1 = new Set(arr1);
  const set2 = new Set(arr2);

  return (
    arr1.every(element => set2.has(element)) &&
    arr2.every(element => set1.has(element))
  );
}

export function clearTimers() {
  for (const timer of timers) {
    clearTimeout(timer.timer);
  }
}

/**
 * Update the state of a particular session by sending an action command
 *
 * @param {number} quizId
 * @param {string} token
 * @param {number} sessionId
 * @returns {SessionStatus}
 */
export function sessionStatus(token: string, quizId: number, sessionId: number): SessionStatus {
  if (!isValidTokenStructure(token)) {
    throw HTTPError(401, 'Token is not a valid structure');
  }
  if (!isTokenLoggedIn(token)) {
    throw HTTPError(403, 'Token is not logged in');
  }
  if (!isValidQuizId(quizId) || !isValidCreator(quizId, token)) {
    throw HTTPError(400, 'Invalid QuizId');
  }
  if (!isValidSessionId(sessionId, quizId)) {
    throw HTTPError(400, 'Invalid: Session Id');
  }

  const data = getData();
  const session = data.sessions.find(id => id.sessionId === sessionId);

  const playerNames = session.players.sort();
  const metaData = session.metadata;
  delete metaData.creator;
  delete metaData.questionCount;

  return {
    state: session.sessionState,
    atQuestion: session.atQuestion,
    players: playerNames,
    metadata: session.metadata,
  };
}

/**
 * Returns object containing various results from a completed quiz session
 *
 * @param {number} quizId
 * @param {number} sessionId
 * @param {string} token
 * @returns {SessionResults}
 */
export function sessionResults(quizId: number, sessionId: number, token: string): SessionResults {
  if (!isValidTokenStructure(token)) {
    throw HTTPError(401, 'Token is not a valid structure');
  }
  if (!isTokenLoggedIn(token)) {
    throw HTTPError(403, 'Token is not logged in');
  }
  if (!isValidQuizId(quizId)) {
    throw HTTPError(400, 'invalid quiz Id');
  }
  if (!isValidCreator(quizId, token)) {
    throw HTTPError(400, 'quizId does not refer to a quiz that this user owns');
  }
  if (!isValidSessionId(sessionId, quizId)) {
    throw HTTPError(400, 'Session Id does not refer to a valid session within this quiz');
  }

  const data = getData();
  const session = data.sessions.find(session => session.sessionId === sessionId);

  if (session.sessionState !== 'FINAL_RESULTS') {
    throw HTTPError(400, 'Session is not in FINAL_RESULTS state');
  }

  return getSessionResults(session);
}

/**
 * Creates a CSV file with results for each player and question. Returns URL to file.
 *
 * @param {number} quizId
 * @param {number} sessionId
 * @param {string} token
 * @returns {{url: string}}
 */
export function sessionResultsCSV(quizId: number, sessionId: number, token: string):{url: string} {
  if (!isValidTokenStructure(token)) {
    throw HTTPError(401, 'Token is not a valid structure');
  }
  if (!isTokenLoggedIn(token)) {
    throw HTTPError(403, 'Token is not logged in');
  }
  if (!isValidQuizId(quizId)) {
    throw HTTPError(400, 'invalid quiz Id');
  }
  if (!isValidCreator(quizId, token)) {
    throw HTTPError(400, 'quizId does not refer to a quiz that this user owns');
  }
  if (!isValidSessionId(sessionId, quizId)) {
    throw HTTPError(400, 'Session Id does not refer to a valid session within this quiz');
  }

  const data = getData();
  const session = data.sessions.find(session => session.sessionId === sessionId);

  if (session.sessionState !== 'FINAL_RESULTS') {
    throw HTTPError(400, 'Session is not in FINAL_RESULTS state');
  }

  const playerList = data.players.filter(player => session.players.includes(player.name));

  const numQuestions = session.metadata.numQuestions;

  const header: string[] = ['Player'];
  for (let i = 1; i <= numQuestions; i++) {
    header.push(`question${i}score`);
    header.push(`question${i}rank`);
  }

  const results: string[][] = [];
  for (let row = 0; row < playerList.length; row++) {
    const playerResults: string[] = [playerList[row].name];
    for (let col = 0; col < numQuestions; col++) {
      if (playerList[row].questionResponse[col] === undefined) {
        playerResults.push('0');
        playerResults.push('0');
      } else {
        const questionRanking = playerList.filter(player => player.questionResponse[col] !== undefined);
        questionRanking.sort((player1, player2) => {
          return player2.questionResponse[col].points - player1.questionResponse[col].points;
        });
        const score = playerList[row].questionResponse[col].points;
        const rank = (questionRanking.findIndex(player => player.playerId === playerList[row].playerId) + 1);
        playerResults.push(score.toString());
        playerResults.push(rank.toString());
      }
    }
    results.push(playerResults);
  }

  results.sort((row1, row2) => (row1[0].localeCompare(row2[0])));
  results.unshift(header);

  const csvResults = results.map(row => row.join(',')).join('\n');

  fs.writeFileSync(`./session${sessionId}_results.csv`, csvResults);

  const fileUrl = `${config.url}:${config.port}/session${sessionId}_results.csv`;

  return { url: fileUrl };
}
