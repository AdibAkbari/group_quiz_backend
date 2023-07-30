import {
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  createQuizQuestionRequest,
  startSessionRequest,
  playerJoinRequest,
  sessionStatusRequest,
  // sessionUpdateRequest,
} from './it3_testRoutes';
import { } from '../interfaces';
import HTTPError from 'http-errors';

let token: string;
let quizId: number;
let sessionId: number;
// let questionId: number;
const validAnswers = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }];

beforeEach(() => {
  clearRequest();
  token = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body.token;
  quizId = quizCreateRequest(token, 'quiz1', '').quizId;
  // questionId = createQuizQuestionRequest(quizId, token, 'Question 1', 5, 6, validAnswers).questionId;
  createQuizQuestionRequest(quizId, token, 'Question 1', 5, 6, validAnswers);
  sessionId = startSessionRequest(quizId, token, 3).sessionId;
});

describe('invalid token', () => {
  test.each([
    { testName: 'token has letters', token: '5436h8j6' },
    { testName: 'token only whitespace', token: '  ' },
    { testName: 'token has other characters', token: '6365,53' },
    { testName: 'empty string', token: '' },
    { testName: 'token has decimal point', token: '53.74' },
    { testName: 'token has negative sign', token: '-37294' },
  ])('token is not a valid structure: $testName', ({ token }) => {
    expect(() => sessionStatusRequest(token, quizId, sessionId)).toThrow(HTTPError[401]);
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

  // test.todo('Session Id does not refer to a valid question within this quiz', () => {
  // });
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
          creator: 1,
          duration: 5,
          questionCount: 1,
          // thumbnailUrl: "",
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
          creator: 1,
          duration: 5,
          questionCount: 1,
          // thumbnailUrl: "",
        }
      });
  });
});
