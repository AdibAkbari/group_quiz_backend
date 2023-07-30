import { getData, setData } from './dataStore';
import { generateName, getSessionResults, isValidPlayerId, isValidQuestionPosition, questionResult } from './helper';
import { Players, PlayerStatus, Question, QuestionResult, SessionResults } from './interfaces';
import HTTPError from 'http-errors';

export function playerJoin(sessionId: number, playerName: string): { playerId: number } {
  const data = getData();
  const session = data.sessions.find(id => id.sessionId === sessionId);

  if (session.sessionState !== 'LOBBY') {
    throw HTTPError(400, 'Session is not in LOBBY state');
  }

  if (playerName === '') {
    playerName = generateName();
  }

  if (session.players.find(name => name === playerName)) {
    throw HTTPError(400, 'Name of user entered is not unique');
  }

  data.playerIdCount++;
  const playerId: number = data.playerIdCount;

  const player: Players = {
    sessionId: sessionId,
    name: playerName,
    playerId: playerId,
    questionResponse: [],
    score: 0,
  };

  data.players.push(player);
  session.players.push(playerName);
  setData(data);

  return { playerId: playerId };
}

export function playerStatus(playerId: number): PlayerStatus {
  if (!isValidPlayerId(playerId)) {
    throw HTTPError(400, 'Invalid: PlayerId');
  }

  const data = getData();
  const player = data.players.find(id => id.playerId === playerId);
  const session = data.sessions.find(id => id.sessionId === player.sessionId);

  const numQuestions = session.metadata.questionCount;

  return {
    state: session.sessionState,
    numQuestions: numQuestions,
    atQuestion: session.atQuestion
  };
}

export function playerCurrentQuestionInfo(playerId: number, questionPosition: number): Question {
  if (!isValidPlayerId(playerId)) {
    throw HTTPError(400, 'Invalid: PlayerId');
  }

  if (!isValidQuestionPosition(playerId, questionPosition)) {
    throw HTTPError(400, 'Invalid: questionPosition');
  }

  const data = getData();
  const player = data.players.find(id => id.playerId === playerId);
  const session = data.sessions.find(id => id.sessionId === player.sessionId);

  if (session.sessionState === 'LOBBY' || session.sessionState === 'END') {
    throw HTTPError(400, 'Invalid: State');
  }

  const currentQuestion = session.metadata.questions[questionPosition];

  return currentQuestion;
}

export function playerResults(playerId: number): SessionResults {
  if (!isValidPlayerId(playerId)) {
    throw HTTPError(400, 'Invalid: PlayerId');
  }

  const data = getData();
  const player = data.players.find(id => id.playerId === playerId);
  const session = data.sessions.find(id => id.sessionId === player.sessionId);

  if (session.sessionState !== 'FINAL_RESULTS') {
    throw HTTPError(400, 'Session is not in FINAL_RESULTS state');
  }

  return getSessionResults(session);
}

export function playerQuestionResults(playerId: number, questionPosition: number): QuestionResult {
  if (!isValidPlayerId(playerId)) {
    throw HTTPError(400, 'Invalid: PlayerId');
  }

  const data = getData();
  const player = data.players.find(id => id.playerId === playerId);
  const session = data.sessions.find(id => id.sessionId === player.sessionId);

  if (questionPosition > session.metadata.numQuestions - 1) {
    throw HTTPError(400, 'Question position is not valid');
  }

  if (session.sessionState !== 'ANSWER_SHOW') {
    throw HTTPError(400, 'Session is not in FINAL_RESULTS state');
  }

  if (session.atQuestion !== questionPosition) {
    throw HTTPError(400, 'Session not yet up to this question');
  }

  const playerList = data.players.filter(player => session.players.includes(player.name));

  return questionResult(questionPosition, session, playerList);
}
