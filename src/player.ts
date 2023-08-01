import { getData, setData } from './dataStore';
import { generateName } from './helper';
import { Players, Message } from './interfaces';
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

  if (session.players.find(player => player.name === playerName)) {
    throw HTTPError(400, 'Name of user entered is not unique');
  }

  session.playerIdCount++;
  const playerId: number = session.playerIdCount;

  const player: Players = {
    name: playerName,
    playerId: playerId,
    questionResponse: [],
    score: 0,
  };

  session.players.push(player);
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