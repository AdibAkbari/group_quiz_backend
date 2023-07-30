import {
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  createQuizQuestionRequest,
  startSessionRequest,
  playerJoinRequest,
  playerStatusRequest,
  playerCurrentQuestionInfoRequest,
  // sessionUpdateRequest,
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
const FIRST_POS = 1;
const SECOND_POS = 2;
const THIRD_POS = 3;

beforeEach(() => {
  clearRequest();
  token = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body.token;
  quizId = quizCreateRequest(token, 'quiz1', '').quizId;
  questionOneId = createQuizQuestionRequest(quizId, token, 'Question 1', 5, 6, validAnswers).questionId;
  questionTwoId = createQuizQuestionRequest(quizId, token, 'Question 2', 5, 6, validAnswers).questionId;
  sessionId = startSessionRequest(quizId, token, 3).sessionId;
  playerId = playerJoinRequest(sessionId, 'Joe').playerId;
  // Update session state to start a question
});


describe('Error cases', () => {
  test('PlayerId does not exist', () => {
    expect(() => playerCurrentQuestionInfoRequest(playerId + 1, FIRST_POS)).toThrow(HTTPError[400]);
  });

  test('Question position is not valid for the session this player is in', () => {
    expect(() => playerCurrentQuestionInfoRequest(playerId, THIRD_POS)).toThrow(HTTPError[400]);
  });

//   test('Session is not currently on this question', () => {
//     // Update session state to first question
//     expect(() => playerCurrentQuestionInfoRequest(playerId, SECOND_POS)).toThrow(HTTPError[400]);
//   });

  test('Session is in LOBBY', () => {
    expect(() => playerCurrentQuestionInfoRequest(playerId, FIRST_POS)).toThrow(HTTPError[400]);
  });

//   test('Session is in END', () => {
//     // Update session state to end state
//     expect(() => playerCurrentQuestionInfoRequest(playerId, FIRST_POS)).toThrow(HTTPError[400]);
//   });
});

describe('Success cases', () => {
//   test('Correct return object', () => {
//     expect(playerCurrentQuestionInfoRequest(playerId, FIRST_POS)).toThrow({
//         questionId: questionOneId,
//         question: 'Question 1',
//         duration: 5,
//         // thumbnailUrl: 'http://google.com/some/image/path.jpg',
//         points: 6,
//         answers: [
//           {
//             answerId: expect.any(Number),
//             answer: 'answer1',
//             colour: expect.any(String),
//           },
//           {
//             answerId: expect.any(Number),
//             answer: 'answer2',
//             colour: expect.any(String),
//           }
//         ],
//     });
//   });

});
