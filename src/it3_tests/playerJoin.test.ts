import {
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  createQuizQuestionRequest,
  startSessionRequest,
  playerJoinRequest,
  updateSessionStateRequest,
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
  createQuizQuestionRequest(quizId, token, 'Question 1', 5, 6, validAnswers);
  sessionId = startSessionRequest(quizId, token, 3).sessionId;
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
    expect(playerJoinRequest(sessionId, 'Player One')).toStrictEqual({ playerId: expect.any(Number) });
  });

  test('Empty name', () => {
    expect(playerJoinRequest(sessionId, '')).toStrictEqual({ playerId: expect.any(Number) });
  });
});
