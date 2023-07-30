import {
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  createQuizQuestionRequest,
  startSessionRequest,
  playerJoinRequest,
  playerSubmitAnswerRequest,
  // sessionUpdateRequest,
} from './it3_testRoutes';
import { } from '../interfaces';
import HTTPError from 'http-errors';

let token: string;
let quizId: number;
let sessionId: number;
let playerId: number;
// let questionId: number;
const validAnswers = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }];

beforeEach(() => {
  clearRequest();
  token = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body.token;
  quizId = quizCreateRequest(token, 'quiz1', '').quizId;
  // questionId = createQuizQuestionRequest(quizId, token, 'Question 1', 5, 6, validAnswers).questionId;
  createQuizQuestionRequest(quizId, token, 'Question 1', 5, 6, validAnswers);
  sessionId = startSessionRequest(quizId, token, 3).sessionId;
  playerId = playerJoinRequest(sessionId, 'Joe').playerId;
});

describe('Error cases', () => {
  test('PlayerId does not exist', () => {
    expect(() => playerSubmitAnswerRequest(answerIds, playerId + 1, 1)).toThrow(HTTPError[400]);
  });
});

describe('Success cases', () => {
  
});
