import {
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  createQuizQuestionRequest,
  startSessionRequest,
  playerJoinRequest,
  // sessionUpdateRequest,
  playerSendChatRequest,
} from './it3_testRoutes';
import { } from '../interfaces';
import HTTPError from 'http-errors';

let token: string;
let quizId: number;
let sessionId: number;
let playerId: number;
const validAnswers = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }];

beforeEach(() => {
  clearRequest();
  token = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body.token;
  quizId = quizCreateRequest(token, 'quiz1', '').quizId;
  createQuizQuestionRequest(quizId, token, 'Question 1', 5, 6, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
  sessionId = startSessionRequest(quizId, token, 3).sessionId;
  playerId = playerJoinRequest(sessionId, 'Player One').playerId;
});

describe('Error cases', () => {
  test('playerId does not exist', () => {
    expect(() => playerSendChatRequest(playerId + 1, 'hello my name is elder john')).toThrow(HTTPError[400]);
  });

  test('message body too short', () => {
    expect(() => playerSendChatRequest(playerId, '')).toThrow(HTTPError[400]);
  });

  test('message body too long', () => {
    expect(() => playerSendChatRequest(playerId, 'a'.repeat(101))).toThrow(HTTPError[400]);
  });
});

describe('Success Cases', () => {
  test('one message sent', () => {
    expect(playerSendChatRequest(playerId, 'hello its me')).toStrictEqual({});
  });
});
