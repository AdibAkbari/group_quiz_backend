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

  if (session.players.find(player => player.name === playerName)) {
    throw HTTPError(400, 'Name of user entered is not unique');
  }

  data.playerIdCount++;
  const playerId: number = data.playerIdCount;

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

export function playerStatus(playerId: number): PlayerStatus {

  return {
    state: "LOBBY",
    numQuestions: 1,
    atQuestion: 3
  };
}
