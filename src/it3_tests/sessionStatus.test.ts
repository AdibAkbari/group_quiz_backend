import {
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  createQuizQuestionRequest,
  startSessionRequest,
  playerJoinRequest,
  sessionStatusRequest,
  updateSessionStateRequest
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
  sessionId = startSessionRequest(quizId, token, 3).sessionId;
});

describe('invalid token', () => {
  test('invalid token structure', () => {
    expect(() => sessionStatusRequest('43244;53', quizId, sessionId)).toThrow(HTTPError[401]);
  });

  test('TokenId not logged in', () => {
    expect(() => sessionStatusRequest(token + 1, quizId, sessionId)).toThrow(HTTPError[403]);
  });
});

describe('Error cases', () => {
  test('quizId not a valid quiz', () => {
    expect(() => sessionStatusRequest(token, quizId + 1, sessionId)).toThrow(HTTPError[400]);
  });

  test('user does not own quiz', () => {
    const token2 = authRegisterRequest('email2@gmail.com', 'password1', 'firstname', 'lastname').body.token;
    expect(() => sessionStatusRequest(token2, quizId, sessionId)).toThrow(HTTPError[400]);
  });

  test('sessionId invalid', () => {
    expect(() => sessionStatusRequest(token, quizId, sessionId + 1)).toThrow(HTTPError[400]);
  });

  test('session not the same as quiz', () => {
    const quizId2 = quizCreateRequest(token, 'quiz2', '').quizId;
    expect(() => sessionStatusRequest(token, quizId2, sessionId)).toThrow(HTTPError[400]);
  });
});

describe('Success cases', () => {
  test('Correct Return', () => {
    expect(sessionStatusRequest(token, quizId, sessionId)).toStrictEqual(
      {
        state: 'LOBBY',
        atQuestion: 0,
        players: [],
        metadata: {
          quizId: quizId,
          name: 'quiz1',
          timeCreated: expect.any(Number),
          timeLastEdited: expect.any(Number),
          description: '',
          numQuestions: 1,
          questions: [
            {
              questionId: 1,
              question: 'Question 1',
              duration: 5,
              thumbnailUrl: expect.any(String),
              points: 6,
              answers: [
                {
                  answerId: expect.any(Number),
                  answer: 'answer1',
                  colour: expect.any(String),
                  correct: true
                },
                {
                  answerId: expect.any(Number),
                  answer: 'answer2',
                  colour: expect.any(String),
                  correct: false
                }
              ]
            }
          ],
          duration: 5,
        }
      });
  });

  test('Names sorted correctly', () => {
    playerJoinRequest(sessionId, 'Chad');
    playerJoinRequest(sessionId, 'Andy');
    playerJoinRequest(sessionId, 'Ben');
    expect(sessionStatusRequest(token, quizId, sessionId)).toStrictEqual(
      {
        state: 'LOBBY',
        atQuestion: 0,
        players: [
          'Andy',
          'Ben',
          'Chad'
        ],
        metadata: {
          quizId: quizId,
          name: 'quiz1',
          timeCreated: expect.any(Number),
          timeLastEdited: expect.any(Number),
          description: '',
          numQuestions: 1,
          questions: [
            {
              questionId: 1,
              question: 'Question 1',
              duration: 5,
              thumbnailUrl: expect.any(String),
              points: 6,
              answers: [
                {
                  answerId: expect.any(Number),
                  answer: 'answer1',
                  colour: expect.any(String),
                  correct: true
                },
                {
                  answerId: expect.any(Number),
                  answer: 'answer2',
                  colour: expect.any(String),
                  correct: false
                }
              ]
            }
          ],
          duration: 5,
        }
      });
  });

  test('shows updated states', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'END');
    expect(sessionStatusRequest(token, quizId, sessionId)).toStrictEqual(
      {
        state: 'END',
        atQuestion: 0,
        players: [],
        metadata: {
          quizId: quizId,
          name: 'quiz1',
          timeCreated: expect.any(Number),
          timeLastEdited: expect.any(Number),
          description: '',
          numQuestions: 1,
          questions: [
            {
              questionId: 1,
              question: 'Question 1',
              duration: 5,
              // thumbnailUrl: "http://google.com/some/image/path.jpg",
              points: 6,
              answers: [
                {
                  answerId: expect.any(Number),
                  answer: 'answer1',
                  colour: expect.any(String),
                  correct: true
                },
                {
                  answerId: expect.any(Number),
                  answer: 'answer2',
                  colour: expect.any(String),
                  correct: false
                }
              ]
            }
          ],
          duration: 5,
          // thumbnailUrl: "",
        }
      });
  });
});
