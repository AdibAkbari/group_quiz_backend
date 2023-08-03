import {
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  createQuizQuestionRequest,
  startSessionRequest,
  playerJoinRequest,
  updateSessionStateRequest,
  playerStatusRequest
} from './it3_testRoutes';
import { } from '../interfaces';
import HTTPError from 'http-errors';

let token: string;
let quizId: number;
let sessionId: number;
const validAnswers = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }];

beforeEach(() => {
  clearRequest();
  token = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body.token;
  quizId = quizCreateRequest(token, 'quiz1', '').quizId;
  createQuizQuestionRequest(quizId, token, 'Question 1', 5, 6, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
  sessionId = startSessionRequest(quizId, token, 2).sessionId;
});

describe('Error cases', () => {
  test('Name of user entered is not unique', () => {
    expect(playerJoinRequest(sessionId, 'Player One')).toStrictEqual({ playerId: expect.any(Number) });
    expect(() => playerJoinRequest(sessionId, 'Player One')).toThrow(HTTPError[400]);
  });

  test('Session is not in LOBBY state', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    expect(() => playerJoinRequest(sessionId, 'Player One')).toThrow(HTTPError[400]);
  });

  test('Invalid sessionId', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    expect(() => playerJoinRequest(sessionId + 1, 'Player One')).toThrow(HTTPError[400]);
  });
});

describe('Success cases', () => {
  test('Correct Return', () => {
    const playerId = playerJoinRequest(sessionId, 'Player One');
    expect(playerId).toStrictEqual({ playerId: expect.any(Number) });
    expect(playerStatusRequest(playerId.playerId)).toStrictEqual({
      state: 'LOBBY',
      numQuestions: 1,
      atQuestion: 0,
    });
  });

  test('Empty name', () => {
    expect(playerJoinRequest(sessionId, '')).toStrictEqual({ playerId: expect.any(Number) });
  });
});
