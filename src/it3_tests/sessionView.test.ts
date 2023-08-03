import {
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  createQuizQuestionRequest,
  startSessionRequest,
  updateSessionStateRequest,
  sessionViewRequest,
} from './it3_testRoutes';
import { } from '../interfaces';

let token: string;
let quizId: number;
let sessionId: number;
let sessionId2: number;
let sessionId3: number;
let sessionId4: number;
let sessionId5: number;
let sessionId6: number;
const validAnswers = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }];

beforeEach(() => {
  clearRequest();
  token = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body.token;
  quizId = quizCreateRequest(token, 'quiz1', '').quizId;
  createQuizQuestionRequest(quizId, token, 'Question 1', 5, 6, validAnswers);
});

describe('Success cases', () => {
  test('No active or inactive session', () => {
    expect(sessionViewRequest(token, quizId)).toStrictEqual({
      activeSessions: [],
      inactiveSessions: []
    });
  });

  test('One Active session', () => {
    sessionId = startSessionRequest(quizId, token, 4).sessionId;
    expect(sessionViewRequest(token, quizId)).toStrictEqual({
      activeSessions: [
        sessionId
      ],
      inactiveSessions: []
    });
  });

  test('One Active session One inactive session', () => {
    sessionId = startSessionRequest(quizId, token, 4).sessionId;
    sessionId2 = startSessionRequest(quizId, token, 4).sessionId;
    updateSessionStateRequest(quizId, sessionId2, token, 'END');
    expect(sessionViewRequest(token, quizId)).toStrictEqual({
      activeSessions: [
        sessionId
      ],
      inactiveSessions: [
        sessionId2
      ]
    });
  });

  test('Multiple Active and Multiple Inactive sessions', () => {
    sessionId = startSessionRequest(quizId, token, 4).sessionId;
    sessionId2 = startSessionRequest(quizId, token, 4).sessionId;
    sessionId3 = startSessionRequest(quizId, token, 4).sessionId;
    sessionId4 = startSessionRequest(quizId, token, 4).sessionId;
    sessionId5 = startSessionRequest(quizId, token, 4).sessionId;
    sessionId6 = startSessionRequest(quizId, token, 4).sessionId;

    updateSessionStateRequest(quizId, sessionId4, token, 'END');
    updateSessionStateRequest(quizId, sessionId5, token, 'END');
    updateSessionStateRequest(quizId, sessionId6, token, 'END');
    expect(sessionViewRequest(token, quizId)).toStrictEqual({
      activeSessions: [
        sessionId,
        sessionId2,
        sessionId3
      ],
      inactiveSessions: [
        sessionId4,
        sessionId5,
        sessionId6
      ]
    });
  });
});
