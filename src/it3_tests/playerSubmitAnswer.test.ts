import {
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  createQuizQuestionRequest,
  startSessionRequest,
  playerJoinRequest,
  playerSubmitAnswerRequest,
  playerCurrentQuestionInfoRequest,
  // sessionUpdateRequest,
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
const validAnswers2 = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: true }];
const FIRST_POS = 1;
const SECOND_POS = 2;
const THIRD_POS = 3;

beforeEach(() => {
  clearRequest();
  token = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body.token;
  quizId = quizCreateRequest(token, 'quiz1', '').quizId;
  createQuizQuestionRequest(quizId, token, 'Question 1', 5, 6, validAnswers);
  createQuizQuestionRequest(quizId, token, 'Question 2', 5, 6, validAnswers);
  sessionId = startSessionRequest(quizId, token, 3).sessionId;
  playerId = playerJoinRequest(sessionId, 'Joe').playerId;
  // Update session state 
  answerId = playerCurrentQuestionInfoRequest(playerId, FIRST_POS).answers.answerId[0];
  answerId2 = playerCurrentQuestionInfoRequest(playerId, SECOND_POS).answers.answerId[0];
  answerId3 = playerCurrentQuestionInfoRequest(playerId, SECOND_POS).answers.answerId[1];
});

describe('Error cases', () => {
  test('PlayerId does not exist', () => {
    expect(() => playerSubmitAnswerRequest([answerId], playerId + 1, FIRST_POS)).toThrow(HTTPError[400]);
  });

  test('Question position is not valid for the session this player is in', () => {
    expect(() => playerSubmitAnswerRequest([answerId], playerId, THIRD_POS)).toThrow(HTTPError[400]);
  });
  
//   test('Session is in QUESTION_OPEN', () => {
//     // Update session state to QUESTION_OPEN state
//     expect(() => playerSubmitAnswerRequest([answerId], playerId, FIRST_POS)).toThrow(HTTPError[400]);
//   });

//   test('Session is not currently on this question', () => {
//     // Update session state to first question
//     expect(() => playerSubmitAnswerRequest([answerId], playerId, SECOND_POS)).toThrow(HTTPError[400]);
//   });

  test('Answer IDs are not valid for this particular question', () => {
    // Update session state to first ques
    expect(() => playerSubmitAnswerRequest(['Answer'], playerId, FIRST_POS)).toThrow(HTTPError[400]);
  });

  test('There are duplicate answer IDs provided', () => {
    // Update session state to first ques
    expect(() => playerSubmitAnswerRequest([answerId, answerId], playerId, FIRST_POS)).toThrow(HTTPError[400]);
  });

  test('Less than 1 answer ID was submitted', () => {
    // Update session state to first ques
    expect(() => playerSubmitAnswerRequest([], playerId, FIRST_POS)).toThrow(HTTPError[400]);
  });
});

describe('Success cases', () => {
  test('Correct return', () => {
    // Update session state to first ques
    expect(playerSubmitAnswerRequest([answerId], playerId, FIRST_POS)).toStrictEqual({});
  });

  test('Multiple answers inputted', () => {
    // Update session state to first ques
    expect(playerSubmitAnswerRequest([answerId2, answerId3], playerId, SECOND_POS)).toStrictEqual({});
  });
});
