import {
  startSessionRequest,
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  createQuizQuestionRequest,
  updateQuizQuestionRequest,
  sessionStatusRequest
} from './it3_testRoutes';
import { } from '../interfaces';
import HTTPError from 'http-errors';

let token: string;
let quizId: number;
let questionId: number;
const validAnswers = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }];

beforeEach(() => {
  clearRequest();
  token = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body.token;
  quizId = quizCreateRequest(token, 'quiz1', '').quizId;
  questionId = createQuizQuestionRequest(quizId, token, 'Question 1', 5, 6, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg').questionId;
});

describe('invalid token', () => {
  test('invalid token structure', () => {
    expect(() => startSessionRequest(quizId, '4324h4324', 3)).toThrow(HTTPError[401]);
  });

  test('TokenId not logged in', () => {
    expect(() => startSessionRequest(quizId, token + 1, 3)).toThrow(HTTPError[403]);
  });
});

describe('invalid input', () => {
  test('quizId not a valid quiz', () => {
    expect(() => startSessionRequest(quizId + 1, token, 3)).toThrow(HTTPError[400]);
  });

  test('user does not own quiz', () => {
    const token2 = authRegisterRequest('email2@gmail.com', 'password1', 'firstname', 'lastname').body.token;
    expect(() => startSessionRequest(quizId, token2, 3)).toThrow(HTTPError[400]);
  });

  test('autostart num > 50', () => {
    expect(() => startSessionRequest(quizId, token, 51)).toThrow(HTTPError[400]);
  });

  test('autostart num negative', () => {
    expect(() => startSessionRequest(quizId, token, -1)).toThrow(HTTPError[400]);
  });

  test('10 sessions already active', () => {
    const quizId2 = quizCreateRequest(token, 'quiz2', '').quizId;
    createQuizQuestionRequest(quizId2, token, 'Question 1', 5, 6, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');

    startSessionRequest(quizId, token, 3);
    startSessionRequest(quizId2, token, 3);
    startSessionRequest(quizId, token, 3);
    startSessionRequest(quizId, token, 3);
    startSessionRequest(quizId, token, 3);
    startSessionRequest(quizId2, token, 3);
    startSessionRequest(quizId, token, 3);
    startSessionRequest(quizId2, token, 3);
    startSessionRequest(quizId, token, 3);
    startSessionRequest(quizId, token, 3);

    expect(() => startSessionRequest(quizId, token, 3)).toThrow(HTTPError[400]);
    expect(() => startSessionRequest(quizId2, token, 3)).toThrow(HTTPError[400]);
  });

  test('quiz has no questions', () => {
    const quizId2 = quizCreateRequest(token, 'quiz2', '').quizId;
    expect(() => startSessionRequest(quizId2, token, 3)).toThrow(HTTPError[400]);
  });
});

describe('successful cases', () => {
  test('successful creation', () => {
    const session = startSessionRequest(quizId, token, 3);
    expect(session).toStrictEqual({ sessionId: expect.any(Number) });
    expect(sessionStatusRequest(token, quizId, session.sessionId)).toStrictEqual({
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
            questionId: questionId,
            question: 'Question 1',
            duration: 5,
            points: 6,
            answers: [
              { answerId: expect.any(Number), answer: 'answer1', colour: expect.any(String), correct: true },
              { answerId: expect.any(Number), answer: 'answer2', colour: expect.any(String), correct: false }
            ],
            thumbnailUrl: expect.any(String),
          }
        ],
        duration: 5,
      }
    });
  });

  test('makes a copy of quiz on session start', () => {
    const sessionId = startSessionRequest(quizId, token, 3).sessionId;
    updateQuizQuestionRequest(quizId, questionId, token, 'Updated question', 10, 9, validAnswers, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
    expect(sessionStatusRequest(token, quizId, sessionId)).toStrictEqual({
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
            questionId: questionId,
            question: 'Question 1',
            duration: 5,
            points: 6,
            answers: [
              { answerId: expect.any(Number), answer: 'answer1', colour: expect.any(String), correct: true },
              { answerId: expect.any(Number), answer: 'answer2', colour: expect.any(String), correct: false }
            ],
            thumbnailUrl: expect.any(String),
          }
        ],
        duration: 5,
      }
    });
  });
});
