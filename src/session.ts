import { getData, setData } from './dataStore';
import { isValidTokenStructure, isTokenLoggedIn, isValidQuizId, isValidCreator } from './helper';
import { Session, SessionStatus } from './interfaces';
import HTTPError from 'http-errors';

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


export function updateSessionState(quizId: number, sessionId: number, token: string, action: string): {} {
  return {};
}


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
  //   if () {
  //     throw HTTPError(400, 'Invalid: Session Id');
  //   }

  const data = getData();
  const session = data.sessions.find(id => id.sessionId === sessionId);

  const playerNames = session.players.sort();

  return {
    state: session.sessionState,
    atQuestion: session.atQuestion,
    players: playerNames,
    metadata: session.metadata,
  };
}
