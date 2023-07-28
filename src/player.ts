import { getData, setData } from './dataStore';
import { generateName } from './helper';
import { Players } from './interfaces';
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

  if (session.players.find(player => player.playerName === playerName)) {
    throw HTTPError(400, 'Name of user entered is not unique');
  }

  session.playerIdCount++;
  const playerId: number = session.playerIdCount;

  const player: Players = {
    playerName: playerName,
    playerId: playerId,
    questionResponse: [],
    score: 0,
  };

  session.players.push(player);
  setData(data);

  return { playerId: playerId };
}
