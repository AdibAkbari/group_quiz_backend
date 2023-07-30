import { getData, setData } from './dataStore';
import { generateName, isValidPlayerId, isValidQuestionPosition } from './helper';
import { Players, PlayerStatus } from './interfaces';
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

export function playerCurrentQuestionInfo(playerId: number, questionPosition: number): PlayerStatus {
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

  return {
    currentQuestion
  };
}



export function playerSubmitAnswer(answerIds: number[], playerId: number, questionposition: number): Record<string, never> {
  return {};
}
