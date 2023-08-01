import {
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  createQuizQuestionRequest,
  startSessionRequest,
  playerJoinRequest,
  playerCurrentQuestionInfoRequest,
  updateSessionStateRequest,
} from './it3_testRoutes';
import { } from '../interfaces';
import HTTPError from 'http-errors';

let token: string;
let quizId: number;
let sessionId: number;
let playerId: number;
let questionOneId: number;
let questionTwoId: number;
const validAnswers = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }];
const FIRST_POS = 0;
const SECOND_POS = 1;
const THIRD_POS = 2;
const finishCountdown = 150;

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
  questionOneId = createQuizQuestionRequest(quizId, token, 'Question 1', 5, 6, validAnswers).questionId;
  questionTwoId = createQuizQuestionRequest(quizId, token, 'Question 2', 5, 6, validAnswers).questionId;
  sessionId = startSessionRequest(quizId, token, 3).sessionId;
  playerId = playerJoinRequest(sessionId, 'Joe').playerId;
});

describe('Error cases', () => {
  test('PlayerId does not exist', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    expect(() => playerCurrentQuestionInfoRequest(playerId + 1, FIRST_POS)).toThrow(HTTPError[400]);
  });

  test('Question position too high', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    expect(() => playerCurrentQuestionInfoRequest(playerId, THIRD_POS)).toThrow(HTTPError[400]);
  });

  
  test('Question position too low', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    expect(() => playerCurrentQuestionInfoRequest(playerId, -1)).toThrow(HTTPError[400]);
  });

  test('Session is not currently on this question', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    expect(() => playerCurrentQuestionInfoRequest(playerId, SECOND_POS)).toThrow(HTTPError[400]);
  });

  test('Session is in LOBBY', () => {
    expect(() => playerCurrentQuestionInfoRequest(playerId, FIRST_POS)).toThrow(HTTPError[400]);
  });

  test('Session is in END', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'END');
    expect(() => playerCurrentQuestionInfoRequest(playerId, FIRST_POS)).toThrow(HTTPError[400]);
  });
});

describe('Success cases', () => {
  test('Correct return object', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    expect(playerCurrentQuestionInfoRequest(playerId, FIRST_POS)).toStrictEqual({
      questionId: questionOneId,
      question: 'Question 1',
      duration: 5,
      // thumbnailUrl: 'http://google.com/some/image/path.jpg',
      points: 6,
      answers: [
        {
          answerId: expect.any(Number),
          answer: 'answer1',
          colour: expect.any(String),
        },
        {
          answerId: expect.any(Number),
          answer: 'answer2',
          colour: expect.any(String),
        }
      ],
    });
  });
});
