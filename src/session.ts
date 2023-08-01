import { getData, setData } from './dataStore';
import { isValidTokenStructure, isTokenLoggedIn, isValidQuizId, isValidCreator, isValidSessionId } from './helper';
import { Session, SessionStatus } from './interfaces';
import HTTPError from 'http-errors';

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
    metadata: metaData,
  };
}
