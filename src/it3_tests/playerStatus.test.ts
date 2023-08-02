import {
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  createQuizQuestionRequest,
  startSessionRequest,
  playerJoinRequest,
  playerStatusRequest,
  updateSessionStateRequest,
} from './it3_testRoutes';
import { } from '../interfaces';
import HTTPError from 'http-errors';

let token: string;
let quizId: number;
let sessionId: number;
let playerId: number;
const validAnswers = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }];

const finishCountdown = 150;
const questionDuration = 2;

function sleepSync(ms: number) {
  const startTime = new Date().getTime();
  while (new Date().getTime() - startTime < ms) {
    // zzzZZ - comment needed so eslint doesn't complain
  }
}

beforeEach(() => {
  clearRequest();
  token = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body.token;
  quizId = quizCreateRequest(token, 'quiz1', '').quizId;
  createQuizQuestionRequest(quizId, token, 'Question 1', questionDuration, 6, validAnswers);
  sessionId = startSessionRequest(quizId, token, 3).sessionId;
  playerId = playerJoinRequest(sessionId, 'Joe').playerId;
});

describe('Error cases', () => {
  test('PlayerId does not exist', () => {
    expect(() => playerStatusRequest(playerId + 1)).toThrow(HTTPError[400]);
  });
});

describe('Success cases', () => {
  test('each state during a game with one question', () => {
    expect(playerStatusRequest(playerId)).toStrictEqual({
      state: 'LOBBY',
      numQuestions: 1,
      atQuestion: 0,
    });

    // lobby -> question_countdown
    expect(updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION')).toStrictEqual({});
    expect(playerStatusRequest(playerId)).toStrictEqual({
      state: 'QUESTION_COUNTDOWN',
      numQuestions: 1,
      atQuestion: 1,
    });

    // question_countdown -> question_open
    sleepSync(finishCountdown);
    expect(playerStatusRequest(playerId)).toStrictEqual({
      state: 'QUESTION_OPEN',
      numQuestions: 1,
      atQuestion: 1,
    });

    // question_open -> question_close
    sleepSync(questionDuration * 1000);
    expect(playerStatusRequest(playerId)).toStrictEqual({
      state: 'QUESTION_CLOSE',
      numQuestions: 1,
      atQuestion: 1,
    });

    // question_close -> answer_show
    expect(updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER')).toStrictEqual({});
    expect(playerStatusRequest(playerId)).toStrictEqual({
      state: 'ANSWER_SHOW',
      numQuestions: 1,
      atQuestion: 1,
    });

    // answer_show -> final_results
    expect(updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_FINAL_RESULTS')).toStrictEqual({});
    expect(playerStatusRequest(playerId)).toStrictEqual({
      state: 'FINAL_RESULTS',
      numQuestions: 1,
      atQuestion: 0,
    });

    // final_results -> end
    expect(updateSessionStateRequest(quizId, sessionId, token, 'END')).toStrictEqual({});
    expect(playerStatusRequest(playerId)).toStrictEqual({
      state: 'END',
      numQuestions: 1,
      atQuestion: 0,
    });
  });
});
