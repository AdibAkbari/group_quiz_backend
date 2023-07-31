import { getData, setData } from './dataStore';
import { generateName, isValidPlayerId, isValidQuestionPosition } from './helper';
import { Players, PlayerStatus, QuestionResponse } from './interfaces';
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
  if (!isValidPlayerId(playerId)) {
    throw HTTPError(400, 'Invalid: PlayerId');
  }

  if (!isValidQuestionPosition(playerId, questionPosition)) {
    throw HTTPError(400, 'Invalid: questionPosition');
  }

  const data = getData();
  const player = data.players.find(id => id.playerId === playerId);
  const session = data.sessions.find(id => id.sessionId === player.sessionId);

  if (session.sessionState !== 'QUESTION_OPEN') {
    throw HTTPError(400, 'Session is not in QUESTION_OPEN state');
  }

  const currentQuestion = session.metadata.questions[questionPosition];
  for (let id of answerIds) {
    if (!currentQuestion.answers.includes(id)) {
      throw HTTPError(400, 'Answer IDs are not valid for this particular question');
    }
  }

  for (const current of answerIds) {
    if ((answerIds.filter(answer => answer === current)).length > 1) {
      throw HTTPError(400, 'There are duplicate answer IDs provided');
    }
  }

  if (answerIds.length < 1) {
    throw HTTPError(400, 'Less than 1 answer ID was submitted');
  }

  // If answer exist, delete exisiting and submit new one
  const playerResponseExist = player.questionResponse.findIndex(ques => ques.questionId === currentQuestion.questionId);
  if (playerResponseExist !== -1) {
    player.questionResponse.splice(playerResponseExist, 1);
  }

  const timeNow: number = Math.floor(Date.now() / 1000);
  const answerTime: number = session.timer - timeNow;

  const response: QuestionResponse = {
    questionId: currentQuestion.questionId,
    playerAnswers: answerIds,
    answerTime: answerTime,
    points: 0,
  };

  player.questionResponse.push(response);
  setData(data);

  return {};
}
