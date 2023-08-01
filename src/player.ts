import { getData, setData } from './dataStore';
import { generateName, isValidPlayerId } from './helper';
import { Players, PlayerStatus, Message } from './interfaces';
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

/**
 * Send a chat message
 *
 * @param {number} playerId
 * @param {string} message
 * @returns {} empty object
 */
export function playerSendChat (playerId: number, message: string): Record<string, never> {
  const data = getData;

  if (data.players.find(id => id.playerId === playerId) === undefined) {
    throw HTTPError(400, 'player does not exist');
  }

  if (messsage.length < 1 | message.length > 100) {
    throw HTTPError(400, 'message must be between 1 and 100 characters')
  }

  const player = data.players.find(id => id.playerId === playerId);
  const sessionIndex = data.sessions.findIndex(id => id.sessionId === player.sessionId);
  const timeNow: number = Math.floor((new Date()).getTime() / 1000);
  const message: Message = {
    messageBody: message,
    playerId: playerId,
    playerName: player.playerName,
    timeSent: timeNow,
  }

  data.sessions[sessionIndex].messages.push(message);
  setData(data);
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
