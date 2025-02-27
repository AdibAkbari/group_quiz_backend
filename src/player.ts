import { getData, setData } from './dataStore';
import { generateName, getSessionResults, isValidPlayerId, isValidQuestionPosition, questionResult } from './helper';
import { Players, PlayerStatus, QuestionResult, SessionResults, QuestionResponse, QuestionInfo, Message } from './interfaces';
import HTTPError from 'http-errors';

const BAD_REQUEST = 400;

const minMessageLength = 1;
const maxMessageLength = 100;

/**
 * Allow player to join a session
 *
 * @param {number} sessionId
 * @param {string} playerName
 * @returns {playerId: number}
 */
export function playerJoin(sessionId: number, playerName: string): { playerId: number } {
  const data = getData();
  const session = data.sessions.find(id => id.sessionId === sessionId);
  if (session === undefined) {
    throw HTTPError(BAD_REQUEST, 'Invalid: Session Id');
  }

  if (session.sessionState !== 'LOBBY') {
    throw HTTPError(BAD_REQUEST, 'Session is not in LOBBY state');
  }

  if (playerName === '') {
    playerName = generateName();
  }

  if (session.players.find(name => name === playerName)) {
    throw HTTPError(BAD_REQUEST, 'Name of user entered is not unique');
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
  const data = getData();
  // console.log(data);

  if (data.players.find(id => id.playerId === playerId) === undefined) {
    throw HTTPError(BAD_REQUEST, 'player does not exist');
  }

  if (message.length < minMessageLength || message.length > maxMessageLength) {
    throw HTTPError(BAD_REQUEST, 'message must be between 1 and 100 characters');
  }

  const player = data.players.find(id => id.playerId === playerId);
  const sessionIndex = data.sessions.findIndex(id => id.sessionId === player.sessionId);
  const timeNow: number = Math.floor((new Date()).getTime() / 1000);
  const messageObject: Message = {
    messageBody: message,
    playerId: playerId,
    playerName: player.name,
    timeSent: timeNow,
  };

  if (data.sessions[sessionIndex].messages === undefined) {
    data.sessions[sessionIndex].messages = [];
  }
  data.sessions[sessionIndex].messages.push(messageObject);
  setData(data);

  return {};
}

/**
 * Allow player to join a session
 *
 * @param {number} playerId
 * @returns {PlayerStatus}
 */
export function playerStatus(playerId: number): PlayerStatus {
  if (!isValidPlayerId(playerId)) {
    throw HTTPError(BAD_REQUEST, 'Invalid: PlayerId');
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

/**
 * Get the info of the question a player is currently on
 *
 * @param {number} playerId
 * @param {number} questionPosition
 * @returns {QuestionInfo}
 */
export function playerCurrentQuestionInfo(playerId: number, questionPosition: number): QuestionInfo {
  if (!isValidPlayerId(playerId)) {
    throw HTTPError(BAD_REQUEST, 'Invalid: PlayerId');
  }

  const data = getData();
  const player = data.players.find(id => id.playerId === playerId);
  const session = data.sessions.find(id => id.sessionId === player.sessionId);

  if (session.sessionState === 'LOBBY' || session.sessionState === 'END') {
    throw HTTPError(BAD_REQUEST, 'Invalid: State');
  }

  if (!isValidQuestionPosition(playerId, questionPosition)) {
    throw HTTPError(BAD_REQUEST, 'Invalid: questionPosition');
  }

  const currentQuestion = session.metadata.questions[questionPosition - 1];
  for (const answer of currentQuestion.answers) {
    delete answer.correct;
  }

  return {
    questionId: currentQuestion.questionId,
    question: currentQuestion.question,
    duration: currentQuestion.duration,
    points: currentQuestion.points,
    answers: currentQuestion.answers,
  };
}

/**
 * Returns results of completed session player is in
 *
 * @param {number} playerId
 * @returns {SessionResults}
 */
export function playerResults(playerId: number): SessionResults {
  if (!isValidPlayerId(playerId)) {
    throw HTTPError(BAD_REQUEST, 'Invalid: PlayerId');
  }

  const data = getData();
  const player = data.players.find(id => id.playerId === playerId);
  const session = data.sessions.find(id => id.sessionId === player.sessionId);

  if (session.sessionState !== 'FINAL_RESULTS') {
    throw HTTPError(BAD_REQUEST, 'Session is not in FINAL_RESULTS state');
  }

  return getSessionResults(session);
}

/**
 * Returns results of specified question for session player is in
 *
 * @param {number} playerId
 * @param {number} questionPosition
 * @returns {QuestionResult}
 */
export function playerQuestionResults(playerId: number, questionPosition: number): QuestionResult {
  if (!isValidPlayerId(playerId)) {
    throw HTTPError(BAD_REQUEST, 'Invalid: PlayerId');
  }

  const data = getData();
  const player = data.players.find(id => id.playerId === playerId);
  const session = data.sessions.find(id => id.sessionId === player.sessionId);

  if (session.sessionState !== 'ANSWER_SHOW') {
    throw HTTPError(BAD_REQUEST, 'Session is not in ANSWER_SHOW state');
  }

  if (!isValidQuestionPosition(playerId, questionPosition)) {
    throw HTTPError(BAD_REQUEST, 'Invalid question position');
  }

  const playerList = data.players.filter(player => session.players.includes(player.name));

  return questionResult(questionPosition - 1, session, playerList);
}

/**
 * Allow a player to submit an answer
 *
 * @param {number} answerIds
 * @param {number} playerId
 * @param {number} questionPosition
 * @returns {}
 */
export function playerSubmitAnswer(answerIds: number[], playerId: number, questionPosition: number): Record<string, never> {
  if (!isValidPlayerId(playerId)) {
    throw HTTPError(BAD_REQUEST, 'Invalid: PlayerId');
  }

  if (!isValidQuestionPosition(playerId, questionPosition)) {
    throw HTTPError(BAD_REQUEST, 'Invalid: questionPosition');
  }

  const data = getData();
  const player = data.players.find(id => id.playerId === playerId);
  const session = data.sessions.find(id => id.sessionId === player.sessionId);

  if (session.sessionState !== 'QUESTION_OPEN') {
    throw HTTPError(BAD_REQUEST, 'Session is not in QUESTION_OPEN state');
  }

  const currentQuestion = session.metadata.questions[questionPosition - 1];
  if (!answerIds.every(answerId => currentQuestion.answers.some(answer => answer.answerId === answerId))) {
    throw HTTPError(BAD_REQUEST, 'Answer IDs are not valid for this particular question');
  }

  for (const current of answerIds) {
    if ((answerIds.filter(answer => answer === current)).length > 1) {
      throw HTTPError(BAD_REQUEST, 'There are duplicate answer IDs provided');
    }
  }

  if (answerIds.length < 1) {
    throw HTTPError(BAD_REQUEST, 'Less than 1 answer ID was submitted');
  }

  // If answer exist, delete exisiting and submit new one
  const playerResponseExist = player.questionResponse.findIndex(ques => ques.questionId === currentQuestion.questionId);
  if (playerResponseExist !== -1) {
    player.questionResponse.splice(playerResponseExist, 1);
  }

  const timeNow: number = Math.floor(Date.now() / 1000);
  const answerTime: number = timeNow - session.currentQuestionStartTime;

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

/**
 * View Messages in Session
 *
 * @param {number} playerId
 * @returns {array} Message
 */
export function playerViewChat (playerId: number): {messages: Message[]} | {messages: [] } {
  const data = getData();
  // console.log(data);

  if (data.players.find(id => id.playerId === playerId) === undefined) {
    throw HTTPError(BAD_REQUEST, 'player does not exist');
  }

  const player = data.players.find(id => id.playerId === playerId);
  const sessionIndex = data.sessions.findIndex(id => id.sessionId === player.sessionId);
  const messages = data.sessions[sessionIndex].messages;

  if (messages !== undefined) {
    return { messages: messages };
  } else {
    return { messages: [] };
  }
}
