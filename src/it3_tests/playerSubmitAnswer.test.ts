import {
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  createQuizQuestionRequest,
  startSessionRequest,
  playerJoinRequest,
  playerSubmitAnswerRequest,
  playerCurrentQuestionInfoRequest,
  updateSessionStateRequest,
  sessionStatusRequest,
} from './it3_testRoutes';
import { } from '../interfaces';
import HTTPError from 'http-errors';

let token: string;
let quizId: number;
let sessionId: number;
let playerId: number;
let answerId: number;
let answerId2: number;
let answerId3: number;

const validAnswers = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }];
const FIRST_POS = 0;
const SECOND_POS = 1;
const THIRD_POS = 2;
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
  // Create a user and quiz with questions
  token = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body.token;
  quizId = quizCreateRequest(token, 'quiz1', '').quizId;
  createQuizQuestionRequest(quizId, token, 'Question 1', questionDuration, 6, validAnswers);
  createQuizQuestionRequest(quizId, token, 'Question 2', questionDuration, 6, validAnswers);
  // Start a session
  sessionId = startSessionRequest(quizId, token, 3).sessionId;
  // Player joins session
  playerId = playerJoinRequest(sessionId, 'Joe').playerId;
  // Start the first question_countdown
  updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
  sleepSync(finishCountdown);
});

describe('Error cases', () => {
  test('PlayerId does not exist', () => {
    answerId = playerCurrentQuestionInfoRequest(playerId, FIRST_POS).answers[0].answerId;
    expect(() => playerSubmitAnswerRequest([answerId], playerId + 1, FIRST_POS)).toThrow(HTTPError[400]);
  });

  test('Question position is not valid for the session this player is in', () => {
    answerId = playerCurrentQuestionInfoRequest(playerId, FIRST_POS).answers[0].answerId;
    expect(() => playerSubmitAnswerRequest([answerId], playerId, THIRD_POS)).toThrow(HTTPError[400]);
  });

  test('Session is not in QUESTION_OPEN', () => {
    sleepSync(questionDuration * 1000);
    answerId = playerCurrentQuestionInfoRequest(playerId, FIRST_POS).answers[0].answerId;
    expect(() => playerSubmitAnswerRequest([answerId], playerId, FIRST_POS)).toThrow(HTTPError[400]);
  });

  test('Session is not currently on this question', () => {
    answerId = playerCurrentQuestionInfoRequest(playerId, FIRST_POS).answers[0].answerId;
    expect(() => playerSubmitAnswerRequest([answerId], playerId, SECOND_POS)).toThrow(HTTPError[400]);
  });

  test('Answer IDs are not valid for this particular question', () => {
    answerId = playerCurrentQuestionInfoRequest(playerId, FIRST_POS).answers[0].answerId;
    expect(() => playerSubmitAnswerRequest([answerId + 18282], playerId, FIRST_POS)).toThrow(HTTPError[400]);
  });

  test('There are duplicate answer IDs provided', () => {
    answerId = playerCurrentQuestionInfoRequest(playerId, FIRST_POS).answers[0].answerId;
    expect(() => playerSubmitAnswerRequest([answerId, answerId], playerId, FIRST_POS)).toThrow(HTTPError[400]);
  });

  test('Less than 1 answer ID was submitted', () => {
    expect(() => playerSubmitAnswerRequest([], playerId, FIRST_POS)).toThrow(HTTPError[400]);
  });
});

describe('Success cases', () => {
  test('Correct return', () => {
    answerId = playerCurrentQuestionInfoRequest(playerId, FIRST_POS).answers[0].answerId;
    expect(playerSubmitAnswerRequest([answerId], playerId, FIRST_POS)).toStrictEqual({});
  });

  test('Multiple answers inputted', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER');
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);

    answerId2 = playerCurrentQuestionInfoRequest(playerId, SECOND_POS).answers[0].answerId;
    answerId3 = playerCurrentQuestionInfoRequest(playerId, SECOND_POS).answers[1].answerId;

    expect(playerSubmitAnswerRequest([answerId2, answerId3], playerId, SECOND_POS)).toStrictEqual({});
  });
});
